import test from 'node:test';
import assert from 'node:assert/strict';
import { createPitchDetector } from '../../src/scripts/controllers/tuner/pitchDetector.js';
import { REALISTIC_CORPUS, scoreTake } from './fixtures.mjs';

/* Floors measured on the band-limited, full-dip YIN (2026-09). They guard
 * against regressions; tighten them as the detector improves. `p95` is the
 * 95th-percentile absolute error (cents) of accepted frames. Mains hum is a
 * known gap (needs a streaming notch) and is tracked, not enforced. */
const FLOORS = {
  'guitar E2 clean': { ok: 100, p95: 0.5 },
  'guitar A2 clean': { ok: 100, p95: 0.5 },
  'guitar G3 clean': { ok: 100, p95: 0.5 },
  'guitar E4 clean': { ok: 100, p95: 0.5 },
  'guitar E2 phone mic': { ok: 100, p95: 0.5 },
  'guitar E2 strong 2nd': { ok: 100, p95: 0.5 },
  'bass E1 phone mic': { ok: 95, p95: 0.6 },
  'bass B0 phone mic': { ok: 95, p95: 0.8 },
  'bass E1 inharmonic': { ok: 100, p95: 4 },
  'guitar G3 vibrato': { ok: 100 },
  'guitar E2 white 20dB': { ok: 95, p95: 4 },
  'guitar E2 white 10dB': { ok: 80, p95: 25 },
  'guitar A4 white 10dB': { ok: 95, p95: 8 },
  'guitar E2 pink 10dB': { ok: 20 },
  'guitar A2 white 6dB': { ok: 70, p95: 25 },
};

for (const spec of REALISTIC_CORPUS) {
  const floor = FLOORS[spec.name];
  test(`realistic: ${spec.name}`, { skip: floor ? false : 'tracked, not enforced' }, () => {
    const result = scoreTake(createPitchDetector, spec);
    assert.equal(result.octave, 0, `${result.octave} octave/partial errors`);
    assert.ok(result.acceptedPct >= floor.ok, `accepted ${result.acceptedPct.toFixed(0)}% < ${floor.ok}%`);
    if (floor.p95 !== undefined) assert.ok(result.p95 <= floor.p95, `p95 ${result.p95.toFixed(2)} ct > ${floor.p95}`);
  });
}
