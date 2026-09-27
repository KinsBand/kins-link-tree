import fs from 'node:fs';
import vm from 'node:vm';

export const WORKLET_PATH = new URL('../../public/worklets/click-worklet.js', import.meta.url);
export const CLOCK_PATH = new URL('../../src/scripts/controllers/metronome/metroClock.js', import.meta.url);

export const SOUNDS = [
  { id: 'click', type: 'square', freq: 1100, accentFreq: 1750, decay: 0.04, gain: 0.5 },
  { id: 'woodblock', type: 'triangle', freq: 820, accentFreq: 1240, decay: 0.065, gain: 0.55 },
  { id: 'cowbell', type: 'sine', freq: 580, accentFreq: 840, decay: 0.075, gain: 0.45 }
];

/** Runs the real 'kins-click' processor offline: an AudioWorkletGlobalScope
 * stand-in drives process() in 128-frame quanta and records every output
 * sample plus every message posted back to the main thread. */
export function createWorkletHarness({ rate = 48000, sound = 'woodblock' } = {}) {
  const scope = { sampleRate: rate, currentTime: 0, messages: [], console };
  scope.AudioWorkletProcessor = class { constructor() { this.port = { postMessage: (m) => scope.messages.push(structuredClone(m)) }; } };
  scope.registerProcessor = (name, ctor) => { scope.registered = { name, ctor }; };
  vm.createContext(scope);
  vm.runInContext(fs.readFileSync(WORKLET_PATH, 'utf8'), scope, { filename: 'click-worklet.js' });
  const processor = new scope.registered.ctor();
  const audio = [];
  let frame = 0;
  const send = (m) => processor.port.onmessage({ data: m });
  const gains = { accentGain: [0.8], beatGain: [0.6], subGain: [0.4] };
  send({ type: 'sounds', sounds: SOUNDS });
  send({ type: 'sound', id: sound });
  return {
    scope, processor, send, audio,
    get time() { return frame / rate; },
    /** Render `sec` seconds of audio. */
    run(sec) {
      const blocks = Math.round(sec * rate / 128);
      for (let b = 0; b < blocks; b++) {
        scope.currentTime = frame / rate;
        const out = new Float32Array(128);
        processor.process([], [[out]], gains);
        for (let i = 0; i < 128; i++) audio.push(out[i]);
        frame += 128;
      }
    },
    /** Simulate a suspended context: the clock jumps, nothing renders. */
    skip(sec) {
      const frames = Math.round(sec * rate / 128) * 128;
      for (let i = 0; i < frames; i++) audio.push(0);
      frame += frames;
    },
    beats() { return scope.messages.filter((m) => m.type === 'beat'); },
    /** Peak level in the first `ms` after a frame, and in the `ms` before it. */
    levelAround(time, ms = 2) {
      const f = Math.round(time * rate), n = Math.round(ms * rate / 1000);
      let after = 0, before = 0;
      for (let i = f; i < f + n && i < audio.length; i++) after = Math.max(after, Math.abs(audio[i]));
      for (let i = Math.max(0, f - n); i < f; i++) before = Math.max(before, Math.abs(audio[i]));
      return { after, before };
    }
  };
}

export const round = (t) => Math.round(t * 1e4) / 1e4;
