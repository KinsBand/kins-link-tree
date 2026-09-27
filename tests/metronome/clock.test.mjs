import test from 'node:test';
import assert from 'node:assert/strict';
import { MetroClock } from '../../src/scripts/controllers/metronome/metroClock.js';

function take(clock, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({ ...clock.next() });
  return out;
}

test('position is explicit: bar/beat/sub follow the meter and subdivision', () => {
  const c = new MetroClock();
  c.reset(0, { bpm: 60, perBeat: 2, beatsPerBar: 3, tiers: ['high', 'mid', 'low'] });
  const ev = take(c, 7);
  assert.deepEqual(ev.map((e) => [e.bar, e.beatInBar, e.sub]), [[0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1], [0, 2, 0], [0, 2, 1], [1, 0, 0]]);
  assert.deepEqual(ev.map((e) => e.isAccent), [true, false, false, false, false, false, true]);
  assert.deepEqual(ev.map((e) => e.time), [0, 0.5, 1, 1.5, 2, 2.5, 3]);
});

test('skipTo after a multi-hour gap keeps bar phase and lands on the grid', () => {
  const c = new MetroClock();
  c.reset(0, { bpm: 137, perBeat: 3, beatsPerBar: 7 });
  c.next();
  const target = 3 * 3600 + 0.123;
  c.skipTo(target);
  const interval = 60 / 137 / 3;
  assert.ok(c.nextTime >= target && c.nextTime - target < interval + 1e-6);
  const clicks = Math.round(c.nextTime / interval);
  assert.ok(Math.abs(c.nextTime - clicks * interval) < 1e-6, 'off grid');
  assert.equal(c.sub, clicks % 3);
  assert.equal(c.beat, Math.floor(clicks / 3) % 7);
  assert.equal(c.bar, Math.floor(clicks / 21));
  assert.equal(c.count, clicks);
});

test('snapshot/restore rewinds exactly (legacy flush path)', () => {
  const c = new MetroClock();
  c.reset(1, { bpm: 90, perBeat: 2, beatsPerBar: 4 });
  take(c, 3);
  const snap = c.snapshot();
  const a = take(c, 5);
  c.restore(snap);
  assert.deepEqual(take(c, 5), a);
});

test('reverting a pending change before it lands cancels it', () => {
  const c = new MetroClock();
  c.reset(0, { bpm: 120, perBeat: 2, beatsPerBar: 4, tiers: ['high', 'mid', 'mid', 'mid'] });
  take(c, 5); // mid bar, mid beat
  c.setPerBeat(3); c.setPerBeat(2);
  c.setMeter(3); c.setMeter(4);
  c.setTiers(['high', 'low', 'low', 'low']);
  assert.equal(c.pendingPerBeat, 0);
  assert.equal(c.pendingBeatsPerBar, 0);
  assert.deepEqual(c.tiers, ['high', 'low', 'low', 'low']);
});

test('tiers sent with a pending meter change travel with it', () => {
  const c = new MetroClock();
  c.reset(0, { bpm: 120, beatsPerBar: 4, tiers: ['high', 'mid', 'mid', 'mid'] });
  take(c, 3);
  c.setMeter(2);
  c.setTiers(['high', 'low']);
  const ev = take(c, 3);
  assert.deepEqual(ev.map((e) => e.tier), ['mid', 'high', 'low']);
});

test('invalid input is ignored', () => {
  const c = new MetroClock();
  c.reset(0, { bpm: NaN, perBeat: 0, beatsPerBar: -1 });
  assert.equal(c.bpm, 120);
  c.setBpm(-5, 0); c.setPerBeat(NaN); c.setMeter(999); c.setTiers(null);
  assert.deepEqual([c.bpm, c.perBeat, c.beatsPerBar], [120, 1, 4]);
});
