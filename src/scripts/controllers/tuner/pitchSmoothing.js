/** Signal-domain filtering. Times are monotonic milliseconds; no DOM or timers. */
export function createPitchSmoother({ smoothingMs = 175, holdMs = 1250, changeMs = 250 } = {}) {
  let frequency = null, lastGood = -Infinity, lastTime = null;
  let candidate = null, candidateSince = 0;
  function reset() { frequency = null; lastGood = -Infinity; lastTime = null; candidate = null; }
  function push(input, now) {
    const valid = Number.isFinite(input) && input > 0;
    if (now - lastGood > holdMs) reset();
    if (!valid) { candidate = null; return { frequency, held: frequency !== null }; }
    if (frequency !== null) {
      const distance = Math.abs(1200 * Math.log2(input / frequency));
      if (distance > 80) {
        if (candidate === null || Math.abs(1200 * Math.log2(input / candidate)) > 50) {
          candidate = input; candidateSince = now;
        }
        // Octave/partial substitutions need a longer continuous observation.
        const harmonic = [2, 3, 4, 0.5, 1 / 3].some(ratio => Math.abs(1200 * Math.log2(input / frequency / ratio)) < 45);
        if (now - candidateSince < (harmonic ? holdMs : changeMs)) return { frequency, held: true };
        frequency = input;
      } else {
        candidate = null;
        const alpha = 1 - Math.exp(-Math.max(0, now - lastTime) / smoothingMs);
        frequency *= Math.pow(input / frequency, alpha);
      }
    } else frequency = input;
    lastGood = now; lastTime = now;
    return { frequency, held: false };
  }
  return { push, reset };
}
