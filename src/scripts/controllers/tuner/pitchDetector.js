import { DETECT } from '../../../settings/tuner.config.ts';

/** RBJ low-pass biquad coefficients, normalised so a0 = 1. */
function lowpass(freq, q, rate) {
  const w = 2 * Math.PI * freq / rate, cos = Math.cos(w), alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha, b1 = (1 - cos) / a0;
  return { b0: b1 / 2, b1, b2: b1 / 2, a1: -2 * cos / a0, a2: (1 - alpha) / a0 };
}

/** Bilinear 1st-order high-pass as a biquad (b2 = a2 = 0). First order
 * decays without ringing, so its start-up transient cannot masquerade as a
 * low note the way a resonant 2nd-order high-pass near B0 did. */
function highpass(freq, rate) {
  const k = Math.tan(Math.PI * freq / rate), norm = 1 / (1 + k);
  return { b0: norm, b1: -norm, b2: 0, a1: (k - 1) * norm, a2: 0 };
}

/** Fixed-window YIN on a band-limited copy of the PCM.
 *
 * - The caller's PCM is never mutated. Each window is filtered from its
 *   first sample, and only the tail is analysed, so overlapping windows
 *   carry no filter history: a 1st-order high-pass removes rumble and DC, and a
 *   4th-order low-pass above the highest detectable fundamental removes
 *   most broadband noise energy (about +10 dB SNR for white noise).
 * - Once the normalised difference dips below the threshold, the whole dip
 *   is searched for its lowest point. Stopping at the first local minimum
 *   let noise wiggles on the descending slope bias readings sharp.
 * - When no dip clears the threshold (low SNR, decaying note), the earliest
 *   dip close to the deepest one is kept as a weak candidate. A weak reading
 *   is accepted only when it continues the previous reading, so noise
 *   cannot produce isolated false locks. */
export function createPitchDetector() {
  let differences = new Float64Array(0);
  let normalized = new Float64Array(0);
  let filtered = new Float64Array(0);
  let filterRate = 0, filters = [];
  let previousFreq = 0;
  let weakCandidate = 0;
  let candidateSince = null;
  let lastTime = null;
  let wasActive = false;

  function reset() {
    previousFreq = 0;
    weakCandidate = 0;
    candidateSince = null;
    lastTime = null;
    wasActive = false;
  }

  function designFilters(rate) {
    if (rate === filterRate) return;
    filterRate = rate;
    const cutoff = Math.min(DETECT.PREFILTER_LP_HZ, rate * 0.45);
    filters = [
      highpass(DETECT.PREFILTER_HP_HZ, rate),
      lowpass(cutoff, 0.5411961, rate),
      lowpass(cutoff, 1.3065630, rate)
    ];
  }

  /** Filter input[from, to) into filtered[0, to - from). */
  function bandLimit(input, from, to) {
    const n = to - from;
    if (filtered.length < n) filtered = new Float64Array(n);
    for (let i = 0; i < n; i++) filtered[i] = input[from + i];
    for (const f of filters) {
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < n; i++) {
        const x = filtered[i];
        const y = f.b0 * x + f.b1 * x1 + f.b2 * x2 - f.a1 * y1 - f.a2 * y2;
        x2 = x1; x1 = x; y2 = y1; y1 = y;
        filtered[i] = y;
      }
    }
  }

  function process(input, size, sampleRate, nowMs) {
    const result = { status: 'silent', freq: 0, clarity: 0, conf: 0, locked: false, onset: false, rms: 0, timestamp: nowMs };
    const invalid = () => { previousFreq = 0; weakCandidate = 0; candidateSince = null; wasActive = false; return result; };
    if (!Number.isFinite(sampleRate) || sampleRate < 8000 || !Number.isFinite(nowMs) ||
        !Number.isInteger(size) || size > input.length || size < 32) return invalid();
    if (lastTime !== null && (nowMs <= lastTime || nowMs - lastTime > DETECT.RESULT_GAP_MS)) {
      previousFreq = 0; weakCandidate = 0; candidateSince = null; wasActive = false;
    }
    lastTime = nowMs;
    const maxLag = Math.ceil(sampleRate / DETECT.MIN_DETECT_HZ);
    const minLag = Math.max(2, Math.floor(sampleRate / DETECT.MAX_DETECT_HZ));
    const window = Math.min(maxLag, size - maxLag - 2);
    if (window < maxLag) return invalid();
    const start = size - window - maxLag - 2;
    let clips = 0;
    for (let i = start; i < size; i++) {
      const x = input[i];
      if (!Number.isFinite(x)) return invalid();
      if (Math.abs(x) >= DETECT.CLIP_LEVEL) clips++;
    }
    const count = size - start;
    if (clips / count > DETECT.CLIP_RATIO) { result.status = 'clipped'; return invalid(); }

    designFilters(sampleRate);
    // Every sample before the analysed span warms the filters (~50 ms for a
    // 128 ms window), so their start-up transient has decayed by `start`.
    const from = 0;
    bandLimit(input, from, size);
    const x = filtered, offset = start - from;
    let squares = 0;
    for (let i = offset; i < offset + count; i++) squares += x[i] * x[i];
    result.rms = Math.sqrt(squares / count);
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
    normalized[0] = 1;
    for (let lag = 1; lag <= maxLag + 1; lag++) {
      let difference = 0;
      for (let i = offset, end = offset + window; i < end; i++) {
        const delta = x[i] - x[i + lag];
        difference += delta * delta;
      }
      differences[lag] = difference;
      cumulative += difference;
      normalized[lag] = cumulative > 0 ? difference * lag / cumulative : 1;
      const candidate = lag - 1;
      if (candidate < minLag) continue;
      if (normalized[candidate] < threshold) {
        if (chosen < 0 || normalized[candidate] < normalized[chosen]) chosen = candidate;
      } else if (chosen >= 0) break; // the first dip below threshold has ended
    }
    let weak = false;
    if (chosen < 0) {
      let deepest = Infinity;
      for (let lag = minLag; lag <= maxLag; lag++) {
        if (normalized[lag] <= normalized[lag - 1] && normalized[lag] <= normalized[lag + 1]) deepest = Math.min(deepest, normalized[lag]);
      }
      // Earliest basin that reaches within the slack of the deepest dip;
      // take its lowest point, not the first wiggle that crosses the level.
      const limit = deepest + DETECT.WEAK_DIP_SLACK;
      for (let lag = minLag; lag <= maxLag; lag++) {
        if (normalized[lag] <= limit) {
          if (chosen < 0 || normalized[lag] < normalized[chosen]) chosen = lag;
        } else if (chosen >= 0) break;
      }
      weak = true;
    }
    if (chosen < 0) { result.status = 'uncertain'; return invalid(); }
    // Interpolate the unnormalized difference at its minimum. Normalizing
    // changes the local slope and biases short periods at the top of range.
    let lag = chosen;
    if (lag - 1 >= 1 && differences[lag - 1] < differences[lag]) lag--;
    else if (lag + 1 <= maxLag && differences[lag + 1] < differences[lag]) lag++;
    const x1 = differences[lag - 1], x2 = differences[lag], x3 = differences[lag + 1];
    const denominator = x1 - 2 * x2 + x3;
    const fraction = denominator > 0 ? Math.max(-1, Math.min(1, 0.5 * (x1 - x3) / denominator)) : 0;
    const freq = sampleRate / (lag + fraction);
    if (!Number.isFinite(freq) || freq < DETECT.MIN_DETECT_HZ || freq > DETECT.MAX_DETECT_HZ) return invalid();
    result.clarity = Math.max(0, Math.min(1, 1 - normalized[chosen]));
    result.conf = result.clarity;
    if (weak) {
      const near = (ref) => ref > 0 && Math.abs(1200 * Math.log2(freq / ref)) <= DETECT.WEAK_TRACK_CENTS;
      if (result.conf < DETECT.WEAK_CONF || !(near(previousFreq) || near(weakCandidate))) {
        // Remember it: a consistent weak candidate next frame is accepted.
        weakCandidate = result.conf >= DETECT.WEAK_CONF ? freq : 0;
        previousFreq = 0; candidateSince = null;
        result.status = 'uncertain';
        return result;
      }
    }
    weakCandidate = 0;
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

/** Spatial hysteresis for the note label: the current note is kept while
 * the pitch stays within ±holdCents of it, so a pitch near a note boundary
 * reads as "E +55" instead of flickering between labels or blanking.
 * Temporal debouncing of real note changes happens upstream in
 * createPitchSmoother. Input is a fractional MIDI number. */
export function createNoteStabilizer(holdCents = DETECT.NOTE_HOLD_CENTS) {
  let current = null;
  function reset() { current = null; }
  function update(midiFloat) {
    if (!Number.isFinite(midiFloat)) return current;
    if (current === null || Math.abs(midiFloat - current) * 100 > holdCents) current = Math.round(midiFloat);
    return current;
  }
  return { update, reset };
}
