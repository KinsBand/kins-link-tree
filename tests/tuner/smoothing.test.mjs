import test from 'node:test';
import assert from 'node:assert/strict';
import { createPitchSmoother } from '../../src/scripts/controllers/tuner/pitchSmoothing.js';
import { createDisplayState, tensionZone } from '../../src/scripts/controllers/tuner/displayState.js';

test('frequency EMA damps jitter and follows gradual tuning', () => {
  const filter = createPitchSmoother();
  filter.push(440, 0);
  const output = [];
  for (let t = 25; t <= 500; t += 25) output.push(filter.push(t % 50 ? 442 : 438, t).frequency);
  assert.ok(Math.max(...output) - Math.min(...output) < 1);
  for (let t = 525; t <= 1500; t += 25) filter.push(445, t);
  assert.ok(Math.abs(filter.push(445, 1525).frequency - 445) < 0.1);
});
test('decay survives invalid input for 1.25 seconds and expires', () => {
  const filter = createPitchSmoother();
  filter.push(110, 0);
  assert.deepEqual(filter.push(null, 1200), { frequency: 110, held: true });
  assert.equal(filter.push(null, 1275).frequency, null);
  filter.reset(); assert.equal(filter.push(NaN, 1300).frequency, null);
});
test('brief harmonics cannot replace a fundamental; sustained new notes can', () => {
  const filter = createPitchSmoother(); filter.push(110, 0);
  for (let t = 25; t < 1200; t += 25) assert.equal(filter.push(220, t).frequency, 110);
  filter.push(110, 1200);
  for (let t = 1225; t < 1475; t += 25) assert.equal(filter.push(146.83, t).frequency, 110);
  assert.equal(filter.push(146.83, 1475).frequency, 146.83);
});
test('UI state waits 250ms and resets pending flicker', () => {
  const display = createDisplayState();
  assert.equal(display.update('locked', 0), 'idle');
  assert.equal(display.update('locked', 200), 'idle');
  assert.equal(display.update('listening', 225), 'idle');
  assert.equal(display.update('locked', 250), 'idle');
  assert.equal(display.update('locked', 500), 'locked');
});
test('ear tension zones reveal no proximity across the normal range', () => {
  const profile = { warnUp: 2, deadDown: -4 };
  for (const cents of [-399, -100, -3, 0, 3, 100, 199]) assert.equal(tensionZone(cents, profile), 'normal');
  assert.equal(tensionZone(200, profile), 'high');
  assert.equal(tensionZone(-400, profile), 'slack');
  assert.equal(tensionZone(0, null), 'unknown');
});
