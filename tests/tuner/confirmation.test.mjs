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
    const change = { excursion: { cents: 4.6 }, silence: { trusted: false }, target: { targetId: 'A2' }, gap: { time: 2200 }, precision: { tolerance: 1, cents: 1.1 } }[reason];
    assert.equal(dwell.update({ ...base, time: 1900, ...change }).progress, 0);
    assert.equal(dwell.update({ ...base, time: 2225 }).confirmed, false);
  });
}

test('edge jitter inside the exit margin keeps the dwell; entry still needs the tolerance', () => {
  const dwell = createTuningConfirmation();
  const base = { tolerance: 3, trusted: true, targetId: 'E2' };
  assert.equal(dwell.update({ ...base, time: 0, cents: 4 }).inBand, false, 'entered outside tolerance');
  let result;
  for (let time = 25; time <= 2025; time += 25) {
    result = dwell.update({ ...base, time, cents: time % 100 === 0 ? 4.2 : 2.6 });
    assert.equal(result.inBand, true, `dropped at ${time}`);
  }
  assert.equal(result.confirmed, true);
});
