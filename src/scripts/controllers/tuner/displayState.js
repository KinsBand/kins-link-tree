/** Debounce semantic UI states independently of signal processing. */
export function createDisplayState(delayMs = 250) {
  let current = 'idle', pending = null, since = 0;
  return {
    reset(next = 'idle') { current = next; pending = null; return current; },
    update(next, now) {
      if (next === current) pending = null;
      else if (next !== pending) { pending = next; since = now; }
      else if (now - since >= delayMs) { current = next; pending = null; }
      return current;
    },
  };
}

/** Broad pitch-based tension estimate for the selected string, never tuning accuracy.
 * Actual tension also depends on string gauge, scale length and condition.
 */
export function tensionZone(cents, profile) {
  if (!Number.isFinite(cents) || !profile) return 'unknown';
  if (cents >= profile.warnUp * 100) return 'high';
  if (cents <= profile.deadDown * 100) return 'slack';
  return 'normal';
}

/** Ear-training marker position on the Loose | Normal | Tight scale, 0..1.
 * Each zone is a third of the scale. At pitch the marker is centred; the
 * Normal third spans deadDown..warnUp (several semitones), so small errors
 * barely move it — fine tuning stays an ear exercise. Loose extends 4
 * semitones below deadDown; Tight runs from warnUp to dangerUp + 1. */
export function tensionPosition(cents, profile) {
  if (!Number.isFinite(cents) || !profile) return null;
  const dead = profile.deadDown * 100, warn = profile.warnUp * 100, danger = profile.dangerUp * 100 + 100;
  const lerp = (v, a, b, from, to) => from + (to - from) * Math.min(1, Math.max(0, (v - a) / (b - a)));
  if (cents <= dead) return lerp(cents, dead - 400, dead, 0, 1 / 3);
  if (cents <= 0) return lerp(cents, dead, 0, 1 / 3, 1 / 2);
  if (cents <= warn) return lerp(cents, 0, warn, 1 / 2, 2 / 3);
  return lerp(cents, warn, danger, 2 / 3, 1);
}
