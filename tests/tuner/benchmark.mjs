import assert from 'node:assert/strict';
import { createPitchDetector } from '../../src/scripts/controllers/tuner/pitchDetector.js';
import { tone, centsError } from './fixtures.mjs';

const errors = [], durations = [];
let misses = 0;
for (const rate of [44100, 48000, 96000]) {
  for (const midi of [21, 23, 28, 40, 45, 55, 64, 69, 81, 93, 96]) {
    for (const detune of [-40, -10, 0, 10, 40]) {
      const hz = 440 * 2 ** ((midi - 69) / 12 + detune / 1200);
      const detector = createPitchDetector();
      for (let frame = 0; frame < 8; frame++) {
        const samples = tone(hz, rate, Math.ceil(rate * .128), Math.round(frame * rate * .025));
        const started = performance.now();
        const reading = detector.process(samples, samples.length, rate, frame * 25);
        durations.push(performance.now() - started);
        if (frame < 4) continue;
        if (!reading.locked || reading.status !== 'ok') misses++;
        else errors.push(Math.abs(centsError(reading.freq, hz)));
      }
    }
  }
}
const quantile = (values, q) => values.toSorted((a, b) => a - b)[Math.ceil(q * values.length) - 1];
const result = {
  sampleRates: [44100, 48000, 96000], scenarios: 165,
  accepted: errors.length, misses,
  absoluteCentsP95: quantile(errors, .95), absoluteCentsMax: Math.max(...errors),
  analysisMsP95: quantile(durations, .95), analysisMsMax: Math.max(...durations),
  scope: 'Synthetic clean monophonic PCM; CPU timings depend on the test host. This does not measure physical microphone accuracy or end-to-end latency.'
};
console.log(JSON.stringify(result, null, 2));
assert.equal(misses, 0);
assert.ok(result.absoluteCentsP95 <= .5);
assert.ok(result.absoluteCentsMax <= 1);
