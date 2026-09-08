/** Starting points only: head construction and shell depth change the result.
 * Lug targets and whole-drum targets are intentionally independent. */
export const DRUM_DEFAULTS = [
  { id: 'rack', label: 'Rack tom', kind: 'tom', diameter: 12, lugs: 6, batter: 180, resonant: 180, whole: 110 },
  { id: 'floor', label: 'Floor tom', kind: 'tom', diameter: 16, lugs: 8, batter: 120, resonant: 120, whole: 73 },
  { id: 'snare', label: 'Snare', kind: 'snare', diameter: 14, lugs: 10, batter: 280, resonant: 360, whole: 180 },
  { id: 'kick', label: 'Kick', kind: 'kick', diameter: 22, lugs: 8, batter: 90, resonant: 90, whole: 55 },
];
export const DRUM_DETECT = {
  minHz: 45, maxHz: 500, windowMs: 128, settleMs: 120, timeoutMs: 450,
  attackRms: 0.012, releaseRms: 0.004, riseRatio: 1.8, retriggerMs: 350,
  maxSpreadCents: 24, toleranceCents: 15, minPeakShare: 0.30,
};
export const DRUM_STEPS = ['batter', 'resonant', 'whole'] as const;
