import { DETECT } from '../../../settings/tuner.config.ts';

/** RBJ notch biquad, normalised so a0 = 1. */
function notch(freq, q, rate) {
  const w = 2 * Math.PI * freq / rate, cos = Math.cos(w), alpha = Math.sin(w) / (2 * q), a0 = 1 + alpha;
  return { b0: 1 / a0, b1: -2 * cos / a0, b2: 1 / a0, a1: -2 * cos / a0, a2: (1 - alpha) / a0, x1: 0, x2: 0, y1: 0, y2: 0 };
}

/** Streaming analysis owned by the pitch Worker. Capture chunks arrive
 * straight from the AudioWorklet (no main-thread hop), are written to a
 * ring, and a window is analysed at most once per hop of *sample* time.
 *
 * - A frame gap (worklet starvation, device hiccup) clears the ring and
 *   bumps `epoch`, so a window can never splice audio across the gap.
 * - Pacing: after an analysis, another waits until MIN_WALL_GAP_MS of wall
 *   time has passed. Chunks queued behind a slow analysis are then absorbed
 *   without re-analysing each one, so latency stays bounded on slow CPUs.
 * - Mains hum: a strong, steady lock at 50/60 Hz (or a low multiple) whose
 *   level does not decay like a plucked string enables a streaming notch
 *   comb for that mains family. Because the stream is continuous, the
 *   notches settle once and stay settled. Bypassed for drums. */
export function createAnalysisStream({ rate, detectors, now = () => performance.now() }) {
  const ring = new Float32Array(DETECT.RING_SAMPLES);
  const work = new Float32Array(Math.min(DETECT.WORK_WINDOW, ring.length));
  const windowSize = Math.min(work.length, Math.ceil(rate * DETECT.ANALYSIS_WINDOW_MS / 1000));
  const minimum = Math.ceil(2 * rate / DETECT.MIN_DETECT_HZ) + 2;
  let writeIndex = 0, valid = 0, expectedFrame = null, epoch = 0;
  let lastAnalysis = -Infinity, lastWallEnd = -Infinity;
  let config = { instrument: 'electric', targetHz: 0, revision: 0 };
  let hum = { family: 0, filters: [], candidate: 0, since: 0, minRms: 0, maxRms: 0 };

  function clear() {
    ring.fill(0); writeIndex = 0; valid = 0; epoch++;
    lastAnalysis = -Infinity;
    detectors.pitch.reset();
    detectors.drums.reset();
    for (const f of hum.filters) { f.x1 = f.x2 = f.y1 = f.y2 = 0; }
  }

  function setConfig(next) {
    const revisionChanged = next.revision !== config.revision;
    config = { ...config, ...next };
    if (revisionChanged) { detectors.pitch.reset(); detectors.drums.reset(); }
  }

  function enableHum(family) {
    hum.family = family;
    hum.filters = [];
    for (let k = 1; k <= DETECT.HUM_HARMONICS; k++) {
      const f = family * k;
      if (f < rate * 0.45) hum.filters.push(notch(f, DETECT.HUM_NOTCH_Q, rate));
    }
    hum.candidate = 0;
  }

  function filterSample(x) {
    for (let i = 0; i < hum.filters.length; i++) {
      const f = hum.filters[i];
      const y = f.b0 * x + f.b1 * f.x1 + f.b2 * f.x2 - f.a1 * f.y1 - f.a2 * f.y2;
      f.x2 = f.x1; f.x1 = x; f.y2 = f.y1; f.y1 = y;
      x = y;
    }
    return x;
  }

  /** Track steady 50/60 Hz locks; returns true when hum filtering starts. */
  function watchHum(reading) {
    if (hum.family || config.instrument === 'drums' || reading.status !== 'ok' || !(reading.clarity >= DETECT.CONF_LOCK)) {
      if (!hum.family && reading.status !== 'ok') hum.candidate = 0;
      return false;
    }
    let family = 0;
    for (const mains of [50, 60]) {
      for (let k = 1; k <= 3 && !family; k++) {
        if (Math.abs(reading.freq - mains * k) <= DETECT.HUM_TOLERANCE_HZ * k) family = mains;
      }
    }
    if (!family) { hum.candidate = 0; return false; }
    const t = reading.timestamp;
    if (hum.candidate !== family) {
      hum.candidate = family; hum.since = t; hum.minRms = hum.maxRms = reading.rms;
      return false;
    }
    hum.minRms = Math.min(hum.minRms, reading.rms);
    hum.maxRms = Math.max(hum.maxRms, reading.rms);
    if (hum.maxRms > hum.minRms * DETECT.HUM_MAX_LEVEL_RATIO) {
      // Decaying like a plucked note: restart the observation.
      hum.since = t; hum.minRms = hum.maxRms = reading.rms;
      return false;
    }
    if (t - hum.since < DETECT.HUM_CONFIRM_MS) return false;
    enableHum(family);
    return true;
  }

  function analyse(sampleEnd) {
    const size = Math.min(windowSize, valid);
    let position = (writeIndex - size + ring.length) % ring.length;
    for (let i = 0; i < size; i++) { work[i] = ring[position]; position = (position + 1) % ring.length; }
    const time = sampleEnd / rate * 1000;
    const started = now();
    const reading = config.instrument === 'drums'
      ? detectors.drums.process(work, size, rate, time, config.targetHz)
      : detectors.pitch.process(work, size, rate, time);
    // The ring still holds unfiltered audio: start clean once hum filtering begins.
    if (watchHum(reading)) clear();
    lastWallEnd = now();
    return { reading, revision: config.revision, epoch, hum: hum.family, durationMs: lastWallEnd - started };
  }

  /** Append one capture chunk. Returns an analysis result when one is due. */
  function push(frame, samples) {
    if (expectedFrame !== null && frame !== expectedFrame) clear();
    expectedFrame = frame + samples.length;
    const filtering = hum.family && config.instrument !== 'drums';
    for (let i = 0; i < samples.length; i++) {
      ring[writeIndex] = filtering ? filterSample(samples[i]) : samples[i];
      writeIndex = (writeIndex + 1) % ring.length;
    }
    valid = Math.min(ring.length, valid + samples.length);
    const time = expectedFrame / rate * 1000;
    if (valid < minimum || time - lastAnalysis < DETECT.ANALYSIS_HOP_MS) return null;
    if (now() - lastWallEnd < DETECT.MIN_WALL_GAP_MS) return null;
    lastAnalysis = time;
    return analyse(expectedFrame);
  }

  return {
    push, setConfig,
    get epoch() { return epoch; },
    get hum() { return hum.family; }
  };
}
