import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./node-hooks.mjs', import.meta.url);

/* Minimal Web Audio stand-in for the legacy (no AudioWorklet) path. */
const param = () => ({ value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelAndHoldAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} });
let ctx = null;
const oscillators = [];
class FakeContext {
  constructor() { ctx = this; this.currentTime = 0; this.state = 'running'; this.sampleRate = 48000; this.destination = {}; }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
  createBiquadFilter() { return { frequency: param(), Q: param(), connect() {}, disconnect() {} }; }
  createWaveShaper() { return { connect() {}, disconnect() {} }; }
  createGain() { return { gain: param(), connect() {}, disconnect() {} }; }
  createBuffer() { return {}; }
  createBufferSource() { return { connect() {}, start() {} }; }
  createOscillator() {
    const osc = { frequency: param(), cancelled: false, connect() {}, disconnect() {},
      start(t) { osc.t = t; oscillators.push(osc); }, stop(t) { if (t < osc.t + 0.01) osc.cancelled = true; } };
    return osc;
  }
}
Object.assign(globalThis, {
  window: globalThis, AudioContext: FakeContext,
  requestAnimationFrame: () => 1, cancelAnimationFrame: () => {},
  Worker: class { constructor() { throw new Error('unavailable'); } },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  document: { hidden: false, addEventListener() {}, removeEventListener() {}, body: { appendChild() {} },
    createElement: () => ({ setAttribute() {}, style: {}, play: () => Promise.resolve(), pause() {} }) }
});

const { createMetroEngine } = await import('../../src/scripts/controllers/metronome/audioEngine.js');

test('legacy scheduler: live changes rewind to the grid, stalls skip with phase kept, stop is silent', async () => {
  const engine = createMetroEngine();
  await engine.start({ bpm: 120, perBeat: 1, beatsPerBar: 4, tiers: ['high', 'mid', 'mid', 'mid'], vibrate: false });
  assert.equal(engine.mode, 'legacy');
  const advance = (sec) => { for (let t = 0; t < sec - 1e-9; t += 0.025) { ctx.currentTime += 0.025; engine.sync(); } };
  advance(1.3); engine.updateOptions({ beatsPerBar: 3 }); engine.updateTiers(['high', 'mid', 'mid']);
  advance(1.0); engine.updateBpm(240);
  advance(1.0); engine.updateOptions({ perBeat: 2 });
  advance(1.0);
  ctx.currentTime += 5; advance(0.5);
  const heard = oscillators.filter((o) => !o.cancelled).map((o) => Math.round(o.t * 1000) / 1000);
  assert.deepEqual(heard.slice(0, 17), [0.08, 0.58, 1.08, 1.58, 2.08, 2.44, 2.69, 2.94, 3.19, 3.44, 3.565, 3.69, 3.815, 3.94, 4.065, 4.19, 4.315]);
  for (const t of heard.slice(17)) assert.ok(Math.abs(((t - 4.315) / 0.125) % 1) < 1e-6 || Math.abs(((t - 4.315) / 0.125) % 1 - 1) < 1e-6, `off grid after stall: ${t}`);
  const scheduled = oscillators.length;
  engine.stop();
  assert.ok(oscillators.every((o) => o.t <= ctx.currentTime || o.cancelled), 'future click survived stop');
  advance(0.5);
  assert.equal(oscillators.length, scheduled, 'clicks scheduled after stop');
  engine.destroy();
});
