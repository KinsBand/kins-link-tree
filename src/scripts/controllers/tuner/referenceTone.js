import { noteToFreq } from '../../../settings/tuner.config.ts';
import { TUNER_SAMPLES } from '../../../settings/tunerSamples.config.ts';

export function referenceSample(instrument, midi, a4) {
  const bank = TUNER_SAMPLES[instrument];
  if (!bank || !Number.isFinite(midi) || !Number.isFinite(a4) || a4 <= 0) throw new Error('Invalid reference');
  const target = noteToFreq(midi, a4);
  const [name, hz] = [...bank.notes].sort((a, b) => Math.abs(Math.log2(target / a[1])) - Math.abs(Math.log2(target / b[1])))[0];
  return { url: `/audio/tuner/${bank.folder}/${name}.mp3`, playbackRate: target / hz };
}

/** Actual recorded plucks, transposed to the selected tuning and calibration.
 * Samples load on a selection gesture. Up to twelve scheduled voices, four cached buffers. */
export function createReferenceTone(onStatus = () => {}, resolveSample = referenceSample) {
  let context = null, voices = [], generation = 0, request = null;
  const cache = new Map();
  function stop() {
    generation++; request?.abort(); request = null;
    const old = context; context = null;
    for (const voice of voices) { try { voice.stop(); } catch {} voice.disconnect(); }
    voices = [];
    if (old && old.state !== 'closed') old.close().catch(() => {});
    onStatus('idle');
  }
  async function play(instrument, midi, a4) {
    return playSequence(instrument, [midi], a4);
  }
  async function playSequence(instrument, notes, a4) {
    stop();
    const id = generation;
    const Context = window.AudioContext || window['webkitAudioContext'];
    if (!Context) throw new Error('Audio playback is unavailable in this browser.');
    const current = context = new Context();
    request = new AbortController();
    const signal = request.signal;
    try {
      if (current.state === 'suspended') await current.resume();
      if (id !== generation) return;
      if (!Array.isArray(notes) || !notes.length || notes.length > 12) throw new Error('Invalid reference sequence');
      const samples = notes.map(note => resolveSample(instrument, note, a4));
      const pending = new Map();
      onStatus('loading');
      const buffers = await Promise.all(samples.map(sample => {
        if (cache.has(sample.url)) return cache.get(sample.url);
        if (!pending.has(sample.url)) pending.set(sample.url, (async () => {
          const response = await fetch(sample.url, { signal });
          if (!response.ok) throw new Error('Reference recording unavailable');
          const buffer = await current.decodeAudioData(await response.arrayBuffer());
          if (id !== generation || signal.aborted) return null;
          cache.set(sample.url, buffer);
          while (cache.size > 4) cache.delete(cache.keys().next().value);
          return buffer;
        })());
        return pending.get(sample.url);
      }));
      if (id !== generation || current !== context || signal.aborted) return;
      // Use the audio clock, not JS timers, for a relaxed top-to-bottom strum.
      const startTime = current.currentTime + 0.025;
      let remaining = samples.length;
      samples.forEach((sample, index) => {
        const source = current.createBufferSource(), gain = current.createGain();
        voices.push(source);
        const buffer = buffers[index];
        source.buffer = buffer; source.playbackRate.value = sample.playbackRate;
        const time = startTime + index * 0.42;
        const duration = Math.min(3.5, buffer.duration / sample.playbackRate);
        const level = samples.length > 1 ? 0.3 : 0.65;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(level, time + 0.008);
        gain.gain.setValueAtTime(level, time + Math.max(0.01, duration - 0.18));
        gain.gain.linearRampToValueAtTime(0, time + duration);
        source.connect(gain); gain.connect(current.destination);
        source.onended = () => { gain.disconnect(); if (id === generation && --remaining === 0) stop(); };
        source.start(time); source.stop(time + duration);
      });
      onStatus('playing');
    } catch (error) {
      if (id !== generation || signal.aborted) return;
      stop(); throw error;
    }
  }
  return { play, playSequence, stop, destroy() { stop(); cache.clear(); } };
}
