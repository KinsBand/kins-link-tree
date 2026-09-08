import test from 'node:test';
import assert from 'node:assert/strict';
import { createTuningConfirmation } from '../../src/scripts/controllers/tuner/confirmation.js';

test('confirmation requires two seconds of consecutive fresh in-range audio', () => {
  const dwell = createTuningConfirmation();
  const tick = time => dwell.update({ time, cents: 2.4, tolerance: 3, trusted: true, targetId: 'E2' });
  for (let time = 0; time < 2000; time += 25) assert.equal(tick(time).confirmed, false);
  assert.equal(tick(2000).confirmed, true);
});

for (const reason of ['excursion', 'silence', 'target', 'gap', 'precision']) {
  test(`${reason} cannot inherit previous confirmation progress`, () => {
    const dwell = createTuningConfirmation();
    const base = { cents: 0, tolerance: 3, trusted: true, targetId: 'E2' };
    for (let time = 0; time < 1900; time += 25) dwell.update({ ...base, time });
    const change = { excursion: { cents: 3.1 }, silence: { trusted: false }, target: { targetId: 'A2' }, gap: { time: 2200 }, precision: { tolerance: 1, cents: 1.1 } }[reason];
    assert.equal(dwell.update({ ...base, time: 1900, ...change }).progress, 0);
    assert.equal(dwell.update({ ...base, time: 2225 }).confirmed, false);
  });
}
