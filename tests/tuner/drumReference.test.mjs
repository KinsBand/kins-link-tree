import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { drumReferenceSample } from '../../src/scripts/controllers/tuner/drumReference.js';
import { validKit } from '../../src/scripts/controllers/tuner/drumWorkflow.js';
import { DRUM_DEFAULTS } from '../../src/settings/drumTuner.config.ts';

test('recorded drum references resolve to local files and transpose the selected Hz', () => {
  for (const kind of ['tom', 'kick', 'snare']) {
    for (const hz of [45, 90, 180, 360, 500]) {
      const sample = drumReferenceSample(kind, hz);
      assert.ok(existsSync(new URL('../../public' + sample.url, import.meta.url)));
      assert.ok(Number.isFinite(sample.playbackRate) && sample.playbackRate > 0);
    }
  }
  assert.equal(drumReferenceSample('snare', 400).playbackRate / drumReferenceSample('snare', 200).playbackRate, 2);
  for (const hz of [0, 44, 501, NaN, Infinity, '180']) assert.throws(() => drumReferenceSample('tom', hz));
  assert.throws(() => drumReferenceSample('unknown', 180));
});

test('saved kits accept all integer lug counts 4–12 and reject duplicate drum identities', () => {
  for (let lugs = 4; lugs <= 12; lugs++) assert.ok(validKit([{ ...DRUM_DEFAULTS[0], lugs }]));
  for (const lugs of [3, 13, 6.5]) assert.equal(validKit([{ ...DRUM_DEFAULTS[0], lugs }]), false);
  assert.equal(validKit([DRUM_DEFAULTS[0], DRUM_DEFAULTS[0]]), false);
  assert.equal(validKit([]), false);
});
