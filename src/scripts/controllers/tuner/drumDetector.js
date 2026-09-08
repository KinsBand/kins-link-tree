import { DRUM_DETECT as D } from '../../../settings/drumTuner.config.ts';

/** Strike-gated spectral measurement. Drum partials are not a harmonic series,
 * so do not reuse the sustained-string YIN/octave confirmation pipeline. */
export function createDrumDetector() {
  const n = 16384, real = new Float64Array(n), imag = new Float64Array(n), power = new Float64Array(n / 2);
  let previousRms = 0, attackAt = null, lastAttack = -Infinity, lastTime = null, candidates = [];
  function reset() { previousRms = 0; attackAt = null; lastAttack = -Infinity; lastTime = null; candidates = []; }
  function spectrum(input, start, size, rate, target) {
    real.fill(0); imag.fill(0);
    let mean = 0;
    for (let i = start; i < size; i++) mean += input[i];
    mean /= size - start;
    for (let i = start; i < size; i++) real[i - start] = (input[i] - mean) * (0.5 - 0.5 * Math.cos(2 * Math.PI * (i - start) / (size - start - 1)));
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) [real[i], real[j]] = [real[j], real[i]];
    }
    for (let length = 2; length <= n; length <<= 1) {
      const angle = -2 * Math.PI / length, wr = Math.cos(angle), wi = Math.sin(angle);
      for (let base = 0; base < n; base += length) {
        let r = 1, im = 0;
        for (let j = 0; j < length / 2; j++) {
          const a = base + j, b = a + length / 2;
          const br = real[b] * r - imag[b] * im, bi = real[b] * im + imag[b] * r;
          real[b] = real[a] - br; imag[b] = imag[a] - bi; real[a] += br; imag[a] += bi;
          [r, im] = [r * wr - im * wi, r * wi + im * wr];
        }
      }
    }
    const low = Math.ceil(D.minHz * n / rate), high = Math.floor(Math.min(1600, rate / 2) * n / rate);
    let total = 0;
    for (let i = low; i <= high; i++) { power[i] = real[i] ** 2 + imag[i] ** 2; total += power[i]; }
    const from = Math.max(low + 1, Math.ceil(target * 0.72 * n / rate));
    const to = Math.min(high - 1, Math.floor(Math.min(D.maxHz, target * 1.38) * n / rate));
    let peak = -1;
    for (let i = from; i <= to; i++) if (power[i] > power[i - 1] && power[i] >= power[i + 1] && (peak < 0 || power[i] > power[peak])) peak = i;
    if (peak < 0 || total === 0) return null;
    const width = Math.ceil(1.5 * n / (size - start));
    let share = 0;
    for (let i = Math.max(low, peak - width); i <= Math.min(high, peak + width); i++) share += power[i];
    if (share / total < D.minPeakShare) return null;
    for (let i = from; i <= to; i++) if (Math.abs(i - peak) > width && power[i] > power[peak] * 0.65) return null;
    const a = Math.log(power[peak - 1] + 1e-30), b = Math.log(power[peak] + 1e-30), c = Math.log(power[peak + 1] + 1e-30);
    const delta = Math.max(-0.5, Math.min(0.5, (a - c) / (2 * (a - 2 * b + c))));
    return (peak + delta) * rate / n;
  }
  function process(input, size, rate, time, target) {
    const result = { status: 'waiting', timestamp: time, freq: 0, locked: false };
    if (!Number.isFinite(rate) || rate < 8000 || !Number.isFinite(time) || !Number.isInteger(size) || size < 256 || size > Math.min(input.length, n) || !Number.isFinite(target) || target < D.minHz || target > D.maxHz) return result;
    if (lastTime !== null && (time <= lastTime || time - lastTime > 250)) reset();
    lastTime = time;
    let squares = 0, clips = 0;
    const tail = Math.max(0, size - Math.round(rate * 0.012));
    for (let i = 0; i < size; i++) {
      if (!Number.isFinite(input[i])) { reset(); return result; }
      if (i >= tail) { squares += input[i] ** 2; if (Math.abs(input[i]) >= 0.98) clips++; }
    }
    const rms = Math.sqrt(squares / (size - tail));
    if (clips / (size - tail) > 0.005) { attackAt = null; previousRms = rms; return { ...result, status: 'clipped' }; }
    if (rms >= D.attackRms && (previousRms < D.releaseRms || rms > previousRms * D.riseRatio) && time - lastAttack > D.retriggerMs) {
      attackAt = time; lastAttack = time; candidates = [];
    }
    previousRms = rms;
    if (attackAt === null) return result;
    const elapsed = time - attackAt;
    if (elapsed < D.settleMs) return { ...result, status: 'settling' };
    if (elapsed > D.timeoutMs || rms < D.releaseRms) { attackAt = null; return { ...result, status: 'uncertain' }; }
    // Exclude the noisy initial stick contact; analyze the ringing head.
    const start = Math.max(0, size - Math.floor((elapsed - 20) * rate / 1000));
    if (size - start < rate * 0.075) return result;
    const freq = spectrum(input, start, size, rate, target);
    if (!freq) { candidates = []; return { ...result, status: 'settling' }; }
    candidates.push(freq);
    if (candidates.length < 3) return { ...result, status: 'settling' };
    if (candidates.length > 3) candidates.shift();
    const sorted = [...candidates].sort((a, b) => a - b);
    if (1200 * Math.log2(sorted[2] / sorted[0]) > D.maxSpreadCents) return { ...result, status: 'settling' };
    attackAt = null;
    return { ...result, status: 'ok', freq: sorted[1], locked: true };
  }
  return { process, reset };
}
