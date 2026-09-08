import { DETECT } from '../../../settings/tuner.config.ts';

/** Pure fixed-window YIN. PCM is never mutated, so overlapping windows and
 * DC offsets cannot corrupt filter history. Difference normalization includes
 * every lag from one, even when only a subset is eligible as a candidate. */
export function createPitchDetector() {
  let differences = new Float64Array(0);
  let normalized = new Float64Array(0);
  let previousFreq = 0;
  let candidateSince = null;
  let lastTime = null;
  let wasActive = false;

  function reset() {
    previousFreq = 0;
    candidateSince = null;
    lastTime = null;
    wasActive = false;
  }

  function process(input, size, sampleRate, nowMs) {
    const result = { status: 'silent', freq: 0, clarity: 0, conf: 0, locked: false, onset: false, rms: 0, timestamp: nowMs };
    const invalid = () => { previousFreq = 0; candidateSince = null; wasActive = false; return result; };
    if (!Number.isFinite(sampleRate) || sampleRate < 8000 || !Number.isFinite(nowMs) ||
        !Number.isInteger(size) || size > input.length || size < 32) return invalid();
    if (lastTime !== null && (nowMs <= lastTime || nowMs - lastTime > DETECT.RESULT_GAP_MS)) {
      previousFreq = 0; candidateSince = null; wasActive = false;
    }
    lastTime = nowMs;
    const maxLag = Math.ceil(sampleRate / DETECT.MIN_DETECT_HZ);
    const minLag = Math.max(2, Math.floor(sampleRate / DETECT.MAX_DETECT_HZ));
    const window = Math.min(maxLag, size - maxLag - 2);
    if (window < maxLag) return invalid();
    const start = size - window - maxLag - 2;
    let sum = 0, squares = 0, clips = 0;
    for (let i = start; i < size; i++) {
      const x = input[i];
      if (!Number.isFinite(x)) return invalid();
      sum += x; squares += x * x;
      if (Math.abs(x) >= DETECT.CLIP_LEVEL) clips++;
    }
    const count = size - start;
    result.rms = Math.sqrt(Math.max(0, squares / count - (sum / count) ** 2));
    if (clips / count > DETECT.CLIP_RATIO) { result.status = 'clipped'; return invalid(); }
    if (result.rms < (wasActive ? DETECT.RMS_RELEASE : DETECT.RMS_WAKE)) return invalid();
    result.onset = !wasActive;
    wasActive = true;
    if (differences.length < maxLag + 2) {
      differences = new Float64Array(maxLag + 2);
      normalized = new Float64Array(maxLag + 2);
    }
    const level = Math.max(0, Math.min(1, Math.log(result.rms / DETECT.RMS_RELEASE) / Math.log(DETECT.YIN_ADAPT_FULL_RMS / DETECT.RMS_RELEASE)));
    const threshold = DETECT.YIN_THRESH_MAX + (DETECT.YIN_THRESHOLD - DETECT.YIN_THRESH_MAX) * level;
    let cumulative = 0;
    let chosen = -1;
    for (let lag = 1; lag <= maxLag + 1; lag++) {
      let difference = 0;
      for (let i = start, end = start + window; i < end; i++) {
        const delta = input[i] - input[i + lag];
        difference += delta * delta;
      }
      differences[lag] = difference;
      cumulative += difference;
      normalized[lag] = cumulative > 0 ? difference * lag / cumulative : 1;
      const candidate = lag - 1;
      if (candidate >= minLag && normalized[candidate] < threshold &&
          normalized[candidate] <= normalized[candidate - 1] && normalized[candidate] <= normalized[lag]) {
        chosen = candidate;
        break;
      }
    }
    if (chosen < 0) { result.status = 'uncertain'; return invalid(); }
    // Interpolate the unnormalized difference at its minimum. Normalizing
    // changes the local slope and biases short periods at the top of range.
    let lag = chosen;
    if (differences[lag - 1] < differences[lag]) lag--;
    const x1 = differences[lag - 1], x2 = differences[lag], x3 = differences[lag + 1];
    const denominator = x1 - 2 * x2 + x3;
    const fraction = denominator > 0 ? Math.max(-1, Math.min(1, 0.5 * (x1 - x3) / denominator)) : 0;
    const freq = sampleRate / (lag + fraction);
    if (!Number.isFinite(freq) || freq < DETECT.MIN_DETECT_HZ || freq > DETECT.MAX_DETECT_HZ) return invalid();
    result.clarity = Math.max(0, Math.min(1, 1 - normalized[chosen]));
    result.conf = result.clarity;
    if (result.conf < DETECT.CONF_LOCK) { result.status = 'uncertain'; return invalid(); }
    const move = previousFreq ? Math.abs(1200 * Math.log2(freq / previousFreq)) : Infinity;
    if (candidateSince === null || move > DETECT.TRACK_JUMP_CENTS) candidateSince = nowMs;
    previousFreq = freq;
    result.freq = freq;
    result.status = 'ok';
    result.locked = nowMs - candidateSince >= DETECT.ACQUIRE_MS;
    return result;
  }
  return { process, reset };
}

/** Presentation smoothing is time based and independent of render cadence. */
export function createCentsSmoother() {
  let value = null;
  let lastTime = null;
  function reset() { value = null; lastTime = null; }
  function push(cents, _fine, nowMs = (lastTime ?? 0) + DETECT.ANALYSIS_HOP_MS) {
    if (!Number.isFinite(cents)) return { cents: value ?? 0, held: true };
    const dt = lastTime === null ? 0 : Math.max(0, nowMs - lastTime);
    if (value === null || dt > DETECT.RESULT_GAP_MS || Math.abs(cents - value) > DETECT.TRACK_JUMP_CENTS) value = cents;
    else value += (1 - Math.exp(-dt / DETECT.SMOOTH_MS)) * (cents - value);
    lastTime = nowMs;
    return { cents: value, held: false };
  }
  return { push, reset };
}

export function createNoteStabilizer() {
  let current = null;
  let candidate = null;
  let candidateSince = 0;

  function reset() {
    current = null;
    candidate = null;
    candidateSince = 0;
  }

  function update(midi, nowMs) {
    if (current === null) {
      current = midi;
      candidate = null;
      return current;
    }
    if (midi === current) {
      candidate = null;
      return current;
    }
    if (midi === candidate) {
      if (nowMs - candidateSince >= DETECT.LABEL_HYSTERESIS_MS) {
        current = midi;
        candidate = null;
      }
    } else {
      candidate = midi;
      candidateSince = nowMs;
    }
    return current;
  }

  return { update, reset };
}
