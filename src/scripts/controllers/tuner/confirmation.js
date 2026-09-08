import { DETECT } from '../../../settings/tuner.config.ts';

/** Counts only consecutive accepted audio timestamps, never animation frames. */
export function createTuningConfirmation(durationMs = DETECT.CONFIRM_MS, maxGapMs = DETECT.CONFIRM_MAX_GAP_MS) {
  let start = null;
  let last = null;
  let target = null;
  function reset() { start = null; last = null; target = null; }
  function update({ time, cents, tolerance, trusted, targetId }) {
    if (!trusted || !Number.isFinite(time) || !Number.isFinite(cents) || Math.abs(cents) > tolerance) {
      reset();
      return { progress: 0, confirmed: false };
    }
    if (start === null || target !== targetId || time <= last || time - last > maxGapMs) start = time;
    last = time;
    target = targetId;
    const progress = Math.min(1, (time - start) / durationMs);
    return { progress, confirmed: progress === 1 };
  }
  return { reset, update };
}
