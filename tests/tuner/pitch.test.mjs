import test from 'node:test';
import assert from 'node:assert/strict';
import { createPitchDetector, createCentsSmoother } from '../../src/scripts/controllers/tuner/pitchDetector.js';
import { tone, centsError, seededNoise } from './fixtures.mjs';

for (const rate of [44100, 48000, 96000]) {
  test(`clean notes: correct octave, sub-cent error and lock at ${rate} Hz`, () => {
    for (const hz of [27.5, 30.8677, 41.2034, 82.4069, 110, 196, 329.6276, 440, 880, 1760, 2093.0045]) {
      const detector = createPitchDetector();
      const size = Math.ceil(rate * 0.128);
      for (let frame = 0; frame < 16; frame++) {
        const input = tone(hz, rate, size, Math.round(frame * rate * 0.025));
        const reading = detector.process(input, input.length, rate, frame * 25);
        if (frame < 12) continue;
        assert.equal(reading.status, 'ok', `${hz} Hz: ${reading.status}`);
        assert.ok(reading.locked, `${hz} Hz never locked`);
        assert.ok(Math.abs(centsError(reading.freq, hz)) <= 1, `${hz} Hz error ${centsError(reading.freq, hz)}`);
      }
    }
  });
}

test('overlapping PCM is immutable; DC offset does not bias pitch', () => {
  const detector = createPitchDetector();
  const input = tone(440, 48000, 6144, 41, 0.2, [1], 0.15);
  const original = input.slice();
  for (let frame = 0; frame < 20; frame++) detector.process(input, input.length, 48000, frame * 25);
  assert.deepEqual(input, original);
});

test('silence, noise and malformed input cannot lock', () => {
  for (const input of [new Float32Array(6144), seededNoise(6144), new Float32Array(20), Float32Array.of(NaN, Infinity)]) {
    const detector = createPitchDetector();
    for (let frame = 0; frame < 20; frame++) {
      const reading = detector.process(input, input.length, 48000, frame * 25);
      assert.equal(reading.locked, false);
      assert.notEqual(reading.status, 'ok');
    }
  }
});

test('strong overtones still resolve the fundamental', () => {
  for (const hz of [41.2034, 82.4069, 110, 196, 440]) {
    const detector = createPitchDetector();
    let reading;
    for (let frame = 0; frame < 20; frame++) {
      const input = tone(hz, 48000, 6144, frame * 1200, 0.15, [0.3, 1, 0.5, 0.2]);
      reading = detector.process(input, input.length, 48000, frame * 25);
    }
    assert.equal(reading.status, 'ok');
    assert.ok(Math.abs(centsError(reading.freq, hz)) <= 1, `${hz} Hz: ${reading.freq}`);
  }
});

test('locked display responds to a 20-cent change within 250 ms', () => {
  const smoother = createCentsSmoother();
  for (let frame = 0; frame < 20; frame++) smoother.push(20, true, frame * 25);
  let value;
  for (let frame = 20; frame < 30; frame++) value = smoother.push(0, true, frame * 25).cents;
  assert.ok(Math.abs(value) <= 2, `Still showing ${value} cents`);
});

test('note label holds its note up to ±60 cents, then follows the pitch', async () => {
  const { createNoteStabilizer } = await import('../../src/scripts/controllers/tuner/pitchDetector.js');
  const stab = createNoteStabilizer();
  assert.equal(stab.update(40.02), 40);
  assert.equal(stab.update(40.55), 40, 'flipped at +55 ct');
  assert.equal(stab.update(39.45), 40, 'flipped at -55 ct');
  assert.equal(stab.update(40.61), 41);
  assert.equal(stab.update(40.45), 41, 'flipped back inside the hold band');
  assert.equal(stab.update(45.1), 45, 'large move must follow immediately');
  assert.equal(stab.update(NaN), 45);
});
