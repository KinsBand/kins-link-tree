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
