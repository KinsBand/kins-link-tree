import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnalysisStream } from '../../src/scripts/controllers/tuner/analysisStream.js';
import { createPitchDetector } from '../../src/scripts/controllers/tuner/pitchDetector.js';
import { createDrumDetector } from '../../src/scripts/controllers/tuner/drumDetector.js';
import { renderTake } from './fixtures.mjs';

const RATE = 48000, CHUNK = 512;

/** Feed a take in worklet-sized chunks on a simulated real-time wall clock. */
function run(take, { gapAt = -1, config } = {}) {
  let wall = 0;
  const stream = createAnalysisStream({ rate: RATE, detectors: { pitch: createPitchDetector(), drums: createDrumDetector() }, now: () => wall });
  if (config) stream.setConfig(config);
  const results = [];
  let frame = 0;
  for (let i = 0; i + CHUNK <= take.length; i += CHUNK) {
    if (i === gapAt) frame += CHUNK * 3; // three chunks lost
    wall = frame / RATE * 1000;
    const result = stream.push(frame, take.subarray(i, i + CHUNK));
    if (result) results.push(result);
    frame += CHUNK;
  }
  return { stream, results };
}

test('analyses once per 25 ms hop of sample time', () => {
  const { results } = run(renderTake({ f0: 110, seconds: 1.2 }));
  const times = results.map(r => r.reading.timestamp);
  for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= 25 - 1e-9 && times[i] - times[i - 1] < 25 + 11);
  assert.ok(results.slice(-10).every(r => r.reading.status === 'ok' && Math.abs(1200 * Math.log2(r.reading.freq / 110)) < 1));
});

test('a frame gap clears the ring and bumps the epoch instead of splicing audio', () => {
  const { results } = run(renderTake({ f0: 110, seconds: 1.2 }), { gapAt: CHUNK * 60 });
  const epochs = [...new Set(results.map(r => r.epoch))];
  assert.equal(epochs.length, 2);
  const after = results.filter(r => r.epoch === epochs[1]);
  assert.ok(after[0].reading.timestamp > results.find(r => r.epoch === epochs[1]).reading.timestamp - 1);
  assert.ok(after.every(r => r.reading.status !== 'ok' || Math.abs(1200 * Math.log2(r.reading.freq / 110)) < 1));
});

test('chunks queued behind a slow analysis are absorbed, not re-analysed one by one', () => {
  let wall = 0;
  const slow = { reset() {}, process(_w, _s, _r, time) { wall += 40; return { status: 'silent', timestamp: time, rms: 0 }; } };
  const stream = createAnalysisStream({ rate: RATE, detectors: { pitch: slow, drums: slow }, now: () => wall });
  const chunk = new Float32Array(CHUNK);
  let analyses = 0;
  for (let frame = 0; frame < RATE * 2; frame += CHUNK) {
    wall = Math.max(wall, frame / RATE * 1000); // real time never runs backwards
    if (stream.push(frame, chunk)) analyses++;
  }
  // 40 ms per analysis caps the rate near 1 / 45 ms, far below one per chunk.
  assert.ok(analyses > 20 && analyses < 50, `${analyses} analyses`);
});

test('steady 50 Hz hum is detected and notched; the note behind it then reads cleanly', () => {
  // Hum alone (as between plucks), then a note over the same hum (-20 dB re. the note).
  const humOnly = renderTake({ f0: 110, seconds: 2.5, mute: true, hum: { hz: 50, db: -20 } });
  const note = renderTake({ f0: 110, seconds: 2.2, hum: { hz: 50, db: -20 } });
  const take = new Float32Array(humOnly.length + note.length);
  take.set(humOnly); take.set(note, humOnly.length);
  const { stream, results } = run(take);
  assert.equal(stream.hum, 50);
  const noteStart = humOnly.length / RATE * 1000;
  const sustain = results.filter(r => r.reading.timestamp > noteStart + 230 && r.reading.timestamp < noteStart + 1200);
  const ok = sustain.filter(r => r.reading.status === 'ok');
  assert.ok(ok.length / sustain.length > 0.9, `accepted ${ok.length}/${sustain.length}`);
  for (const r of ok) assert.ok(Math.abs(1200 * Math.log2(r.reading.freq / 110)) < 3, `read ${r.reading.freq}`);
});

test('a plucked note that happens to sit on 50 Hz is not mistaken for hum', () => {
  const { stream } = run(renderTake({ f0: 50, seconds: 2.2, partials: [1, 0.8, 0.5] }));
  assert.equal(stream.hum, 0);
});

test('drums bypass hum detection', () => {
  const { stream } = run(renderTake({ f0: 110, mute: true, seconds: 3, hum: { hz: 60, db: -20 } }), { config: { instrument: 'drums', targetHz: 80, revision: 1 } });
  assert.equal(stream.hum, 0);
});
