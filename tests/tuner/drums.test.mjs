import test from 'node:test';
import assert from 'node:assert/strict';
import { createDrumDetector } from '../../src/scripts/controllers/tuner/drumDetector.js';

function strikeWindow(rate, endMs, hz, noise = false) {
  const size = Math.ceil(rate * 0.128), input = new Float32Array(size);
  let seed = 71;
  for (let i = 0; i < size; i++) {
    const t = endMs / 1000 - (size - i) / rate - 0.15;
    if (t < 0) continue;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const random = seed / 2 ** 32 * 2 - 1;
    input[i] = Math.exp(-t * 5) * (noise ? random * 0.2 :
      0.24 * Math.sin(2 * Math.PI * hz * t) + 0.08 * Math.sin(2 * Math.PI * hz * 1.59 * t) + 0.025 * random * Math.exp(-t * 70));
  }
  return input;
}
for (const rate of [44100, 48000, 96000]) {
  test(`drum strikes: held once, correct partial, no octave jump at ${rate}`, () => {
    for (const hz of [55, 90, 120, 180, 280, 360]) {
      const detector = createDrumDetector(), found = [];
      for (let time = 0; time < 900; time += 25) {
        const pcm = strikeWindow(rate, time, hz);
        const reading = detector.process(pcm, pcm.length, rate, time, hz * 1.03);
        if (reading.status === 'ok') found.push(reading);
      }
      assert.equal(found.length, 1, `${hz} Hz: ${JSON.stringify(found)}`);
      assert.ok(Math.abs(1200 * Math.log2(found[0].freq / hz)) < 15, `${hz}: ${found[0].freq}`);
    }
  });
}
test('drum noise, silence and out-of-band strikes never produce a match', () => {
  for (const kind of ['noise', 'silence', 'outside']) {
    const detector = createDrumDetector();
    for (let time = 0; time < 800; time += 25) {
      const pcm = kind === 'silence' ? new Float32Array(6144) : strikeWindow(48000, time, 400, kind === 'noise');
      assert.notEqual(detector.process(pcm, pcm.length, 48000, time, 120).status, 'ok', kind);
    }
  }
});
test('reset discards pending drum strikes when the lug or target changes', () => {
  const detector = createDrumDetector();
  for (let time = 0; time < 275; time += 25) {
    const pcm = strikeWindow(48000, time, 180); detector.process(pcm, pcm.length, 48000, time, 180);
  }
  detector.reset();
  const silent = new Float32Array(6144);
  assert.notEqual(detector.process(silent, silent.length, 48000, 300, 120).status, 'ok');
});
