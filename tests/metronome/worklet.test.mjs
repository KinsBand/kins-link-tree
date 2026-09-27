import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createWorkletHarness, WORKLET_PATH, CLOCK_PATH, round } from './harness.mjs';

const TIERS = ['high', 'mid', 'mid', 'mid'];
const START = 0.08; // first click offset after 'start'

function started(opts = {}) {
  const h = createWorkletHarness(opts);
  h.send({ type: 'start', bpm: 120, perBeat: 1, beatsPerBar: 4, tiers: TIERS, ...opts.start });
  return h;
}

test('worklet carries a verbatim copy of MetroClock', () => {
  const region = (src) => {
    const a = src.indexOf('/* METRO-CLOCK:BEGIN */'), b = src.indexOf('/* METRO-CLOCK:END */');
    assert.ok(a >= 0 && b > a, 'markers missing');
    return src.slice(a, b);
  };
  assert.equal(region(fs.readFileSync(WORKLET_PATH, 'utf8')), region(fs.readFileSync(CLOCK_PATH, 'utf8')),
    'public/worklets/click-worklet.js drifted from metroClock.js — copy the METRO-CLOCK region across');
});

test('steady 4/4 at 120 BPM: exact grid, accent only on beat 1, audio onset on the event frame', () => {
  const h = started();
  h.run(4.1);
  const beats = h.beats();
  assert.equal(beats.length, 9);
  beats.forEach((b, i) => {
    assert.equal(round(b.time), round(START + i * 0.5));
    assert.equal(b.beatInBar, i % 4);
    assert.equal(b.isAccent, i % 4 === 0);
    assert.equal(b.bar, Math.floor(i / 4));
    const level = h.levelAround(b.time);
    assert.ok(level.after > 0.05, `click ${i} inaudible`);
    assert.ok(level.before < 1e-6, `click ${i} starts early`);
  });
  assert.ok(h.levelAround(beats[0].time).after > h.levelAround(beats[1].time).after, 'accent not louder');
  assert.ok(!h.scope.messages.some((m) => m.type !== 'beat'), 'unexpected worklet messages');
});

test('suspension gap: missed clicks are skipped, grid and bar phase continue', () => {
  const h = started();
  h.run(1.3); // beats 1-3 of bar 0
  h.skip(1.37); // suspended across two beats
  h.run(1.5);
  const beats = h.beats();
  for (const b of beats) {
    const k = Math.round((b.time - START) / 0.5);
    assert.ok(Math.abs(b.time - (START + k * 0.5)) < 1e-6, `off grid at ${b.time}`);
    assert.equal(b.beatInBar, k % 4, `bar phase lost at ${b.time}`);
    assert.equal(b.bar, Math.floor(k / 4));
  }
  // Nothing was burst out on resume: every emitted click is audible at its own time.
  const after = beats.filter((b) => b.time > 2.67);
  assert.ok(after.length >= 2);
  for (const b of after) assert.ok(h.levelAround(b.time).after > 0.05);
});

test('meter change right after a downbeat re-reads that bar (no double downbeat)', () => {
  const h = started();
  h.run(4.1); // downbeat of bar 2 at 4.08 just played
  h.send({ type: 'opts', perBeat: 1, beatsPerBar: 3 });
  h.send({ type: 'tiers', tiers: ['high', 'mid', 'mid'] });
  h.run(3.0);
  const seq = h.beats().filter((b) => b.time > 4).map((b) => `${b.beatInBar}${b.isAccent ? '!' : ''}`);
  assert.deepEqual(seq.slice(0, 7), ['0!', '1', '2', '0!', '1', '2', '0!']);
});

test('meter change mid-bar lands on the next bar', () => {
  const h = started();
  h.run(1.2); // beats 1, 2, 3 played
  h.send({ type: 'opts', beatsPerBar: 3 });
  h.send({ type: 'tiers', tiers: ['high', 'mid', 'mid'] });
  h.run(3.0);
  const seq = h.beats().map((b) => `${b.beatInBar}${b.isAccent ? '!' : ''}`);
  assert.deepEqual(seq.slice(0, 8), ['0!', '1', '2', '3', '0!', '1', '2', '0!']);
});

test('subdivision change mid-beat takes effect on the next beat; beat starts stay on the grid', () => {
  const h = started({ start: { perBeat: 2 } });
  h.run(1.3); // mid-way through beat 3's "and"
  h.send({ type: 'opts', perBeat: 3 });
  h.run(2.0);
  const beats = h.beats();
  for (const b of beats.filter((x) => x.isBeatStart)) {
    const k = Math.round((b.time - START) / 0.5);
    assert.ok(Math.abs(b.time - (START + k * 0.5)) < 1e-6, `beat start off grid at ${b.time}`);
    assert.equal(b.beatInBar, k % 4);
  }
  const subsOf = (beatTime) => beats.filter((b) => b.time >= beatTime - 1e-9 && b.time < beatTime + 0.5 - 1e-9).length;
  assert.equal(subsOf(START + 2 * 0.5), 2, 'current beat keeps its eighths');
  assert.equal(subsOf(START + 3 * 0.5), 3, 'next beat switches to triplets');
});

test('tempo change is phase-preserving and immediate', () => {
  const h = started({ start: { bpm: 40 } });
  h.run(0.2); // first click at 0.08; next due at 1.58
  h.send({ type: 'bpm', bpm: 200 });
  h.run(1.5);
  const t = h.beats().map((b) => b.time);
  const expectedNext = 0.2 + (1.58 - 0.2) * 40 / 200;
  assert.ok(Math.abs(t[1] - expectedNext) < 128 / 48000, `next beat at ${t[1]}, expected ≈${expectedNext}`);
  for (let i = 2; i < t.length; i++) assert.ok(Math.abs(t[i] - t[i - 1] - 0.3) < 1e-6);
});

test('mute tier emits the visual beat but no sound', () => {
  const h = started({ start: { tiers: ['high', 'mute', 'mid', 'mid'] } });
  h.run(1.2);
  const muted = h.beats().find((b) => b.beatInBar === 1);
  assert.equal(muted.tier, 'mute');
  assert.ok(h.levelAround(muted.time, 20).after < 1e-6);
});

test('stop fades within 3 ms; an immediate restart plays its first click at full level', () => {
  const h = started({ sound: 'cowbell' });
  h.run(0.09); // first click (accent) just started ringing
  h.send({ type: 'stop' });
  const stopAt = h.time;
  h.run(0.02);
  assert.ok(h.levelAround(stopAt + 0.0035, 10).after < 1e-6, 'tail not released');
  h.send({ type: 'start', bpm: 120, perBeat: 1, beatsPerBar: 4, tiers: TIERS });
  h.run(0.2);
  const first = h.beats().at(-1);
  assert.ok(h.levelAround(first.time).after > 0.05, 'first click after restart was faded');
});

test('buffers are rendered when the sound is chosen, not on the first click', () => {
  const h = createWorkletHarness({ sound: 'cowbell' });
  const keys = [...h.processor.buffers.keys()].filter((k) => k.startsWith('cowbell:'));
  assert.deepEqual(keys.sort(), ['cowbell:0:high', 'cowbell:0:low', 'cowbell:0:mid', 'cowbell:1:high']);
});

test('a full voice pool steals the oldest voice instead of throwing or dropping', () => {
  const h = started();
  for (let i = 0; i < 40; i++) h.send({ type: 'preview', tier: 'mid' });
  h.run(0.2);
  assert.ok(h.processor.voices.length === 16);
  assert.ok(h.levelAround(h.beats()[0].time).after > 0.05);
});

test('coach inner clock: muted bars are silent from their first click, audible bars start at full level', () => {
  const h = started({ start: { perBeat: 2 } });
  h.run(0.3); // mid bar 0: the program starts on bar 1
  h.send({ type: 'muteProgram', program: { audible: 2, muted: 1, random: false } });
  h.run(8.2); // bars 0..4
  const beats = h.beats();
  const expectMuted = (bar) => bar >= 1 && (bar - 1) % 3 === 2; // bars 3, 6, ...
  for (const b of beats) {
    assert.equal(b.muted, expectMuted(b.bar), `bar ${b.bar} muted flag`);
    const level = h.levelAround(b.time).after;
    if (expectMuted(b.bar)) assert.ok(level < 1e-6, `click leaked in muted bar ${b.bar} at ${b.time}`);
    else assert.ok(level > 0.05, `click missing in audible bar ${b.bar} at ${b.time}`);
  }
  assert.equal(beats.find((b) => b.bar === 0).mutePhase, null, 'program must not start mid-bar');
  const firstBack = beats.find((b) => b.bar === 4 && b.isBeatStart);
  const reference = beats.find((b) => b.bar === 1 && b.isBeatStart);
  assert.ok(Math.abs(h.levelAround(firstBack.time).after - h.levelAround(reference.time).after) < 1e-6, 'first click after the gap was faded');
  h.send({ type: 'muteProgram', program: null });
  h.run(2.0);
  for (const b of h.beats().slice(beats.length)) assert.equal(b.muted, false);
});
