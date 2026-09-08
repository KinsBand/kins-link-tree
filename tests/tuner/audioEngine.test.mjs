import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudioEngine } from '../../src/scripts/controllers/tuner/audioEngine.js';

function environment() {
  const pending = [];
  const contexts = [];
  const node = () => ({ connect() {}, disconnect() {} });
  class Context {
    state = 'running'; sampleRate = 48000; destination = {};
    audioWorklet = { async addModule() {} };
    constructor() { contexts.push(this); }
    createMediaStreamSource() { return node(); }
    createScriptProcessor() { return node(); }
    createGain() { return { ...node(), gain: { value: 1 } }; }
    async resume() { this.state = 'running'; }
    async close() { this.state = 'closed'; }
  }
  globalThis.window = { AudioContext: Context };
  globalThis.AudioWorkletNode = class { port = { onmessage: null, postMessage() {}, close() {} }; connect() {} disconnect() {} addEventListener() {} removeEventListener() {} };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: {
    getUserMedia() { return new Promise((resolve, reject) => pending.push({ resolve, reject })); },
    async enumerateDevices() { return []; }
  } } });
  function stream() {
    const track = { label: 'Test input', stopped: false, readyState: 'live', stop() { this.stopped = true; this.readyState = 'ended'; },
      getSettings() { return {}; }, async applyConstraints() {}, addEventListener() {}, removeEventListener() {} };
    return { getTracks: () => [track], getAudioTracks: () => [track], track };
  }
  return { pending, stream, contexts };
}

test('cancel pending permission: late tracks are released and capture stays stopped', async () => {
  const env = environment(); const engine = createAudioEngine();
  const start = engine.start(); const outcome = start.catch(error => error);
  engine.stop(); const stream = env.stream(); env.pending[0].resolve(stream);
  await outcome;
  assert.equal(engine.running, false);
  assert.equal(stream.track.stopped, true);
  assert.ok(env.contexts.every(context => context.state === 'closed'));
});

test('an older permission completion cannot replace or stop a newer session', async () => {
  const env = environment(); const engine = createAudioEngine();
  const oldStart = engine.start().catch(error => error); engine.stop();
  const newStart = engine.start(); const newer = env.stream(); env.pending[1].resolve(newer); await newStart;
  const older = env.stream(); env.pending[0].resolve(older); await oldStart;
  assert.equal(older.track.stopped, true);
  assert.equal(newer.track.stopped, false);
  assert.equal(engine.running, true);
  engine.stop(); engine.stop();
  assert.equal(newer.track.stopped, true);
});

test('a fresh engine never reports uncaptured samples as valid', () => {
  const engine = createAudioEngine();
  assert.equal(engine.readLatest(new Float32Array(6144)), 0);
});
