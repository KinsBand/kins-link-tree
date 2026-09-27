import { DETECT } from '../../../settings/tuner.config.ts';

/** Counts only consecutive accepted audio timestamps, never animation frames.
 * Entry requires |cents| <= tolerance; a run in progress survives small
 * excursions up to tolerance + exit margin (hysteresis). A new target, a
 * tolerance change, untrusted audio or a timestamp gap restarts the dwell. */
export function createTuningConfirmation(durationMs = DETECT.CONFIRM_MS, maxGapMs = DETECT.CONFIRM_MAX_GAP_MS, exitMarginCents = DETECT.CONFIRM_EXIT_MARGIN_CENTS) {
  let start = null;
  let last = null;
  let target = null;
  let band = null;
  const idle = { progress: 0, confirmed: false, inBand: false };
  function reset() { start = null; last = null; target = null; band = null; }
  function update({ time, cents, tolerance, trusted, targetId }) {
    if (!trusted || !Number.isFinite(time) || !Number.isFinite(cents) || !(tolerance > 0)) {
      reset();
      return idle;
    }
    const continuing = start !== null && target === targetId && band === tolerance && time > last && time - last <= maxGapMs;
    const limit = continuing ? tolerance + Math.min(exitMarginCents, tolerance / 2) : tolerance;
    if (Math.abs(cents) > limit) {
      reset();
      return idle;
    }
    if (!continuing) start = time;
    last = time;
    target = targetId;
    band = tolerance;
    const progress = Math.min(1, (time - start) / durationMs);
    return { progress, confirmed: progress === 1, inBand: true };
  }
  return { reset, update };
}
