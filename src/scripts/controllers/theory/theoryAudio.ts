/**
 * KINS THEORY AUDIO ENGINE
 * Web Audio synthesizer featuring Karplus-Strong physical modeling string pluck
 * with guitar body resonance filter chain and acoustic drum synthesis.
 */

let theoryAudioCtx: AudioContext | null = null;
let theoryAudioAnalyser: AnalyserNode | null = null;
let bodyFiltersConnected = false;
let bodyInputGain: GainNode | null = null;

export function getTheoryAudioContext(): { ctx: AudioContext; analyser: AnalyserNode } {
  if (!theoryAudioCtx || theoryAudioCtx.state === 'closed') {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    theoryAudioCtx = new AudioContextClass();

    theoryAudioAnalyser = theoryAudioCtx.createAnalyser();
    theoryAudioAnalyser.fftSize = 64;
    theoryAudioAnalyser.smoothingTimeConstant = 0.78;
    theoryAudioAnalyser.connect(theoryAudioCtx.destination);
  }
  if (theoryAudioCtx.state === 'suspended') {
    theoryAudioCtx.resume();
  }
  return { ctx: theoryAudioCtx, analyser: theoryAudioAnalyser! };
}

function getGuitarBodyGraph(ctx: AudioContext, analyser: AnalyserNode): GainNode {
  if (bodyInputGain && bodyFiltersConnected) {
    return bodyInputGain;
  }

  bodyInputGain = ctx.createGain();
  bodyInputGain.gain.value = 1.0;

  // 1. Helmholtz Air Cavity Resonance (102 Hz, Q = 4.0, +6dB)
  const helmholtz = ctx.createBiquadFilter();
  helmholtz.type = 'peaking';
  helmholtz.frequency.value = 102;
  helmholtz.Q.value = 4.0;
  helmholtz.gain.value = 6.0;

  // 2. Main Soundboard Wood Resonance (204 Hz, Q = 3.2, +5dB)
  const soundboard = ctx.createBiquadFilter();
  soundboard.type = 'peaking';
  soundboard.frequency.value = 204;
  soundboard.Q.value = 3.2;
  soundboard.gain.value = 5.0;

  // 3. Upper Wood Body Formant (410 Hz, Q = 2.5, +3dB)
  const upperPlate = ctx.createBiquadFilter();
  upperPlate.type = 'peaking';
  upperPlate.frequency.value = 410;
  upperPlate.Q.value = 2.5;
  upperPlate.gain.value = 3.0;

  // 4. Smooth Air/Bridge Damping Filter (6.5 kHz Lowpass)
  const airDamp = ctx.createBiquadFilter();
  airDamp.type = 'lowpass';
  airDamp.frequency.value = 6500;
  airDamp.Q.value = 0.7;

  // Connect filter chain: bodyInput -> helmholtz -> soundboard -> upperPlate -> airDamp -> analyser
  bodyInputGain.connect(helmholtz);
  helmholtz.connect(soundboard);
  soundboard.connect(upperPlate);
  upperPlate.connect(airDamp);
  airDamp.connect(analyser);

  bodyFiltersConnected = true;
  return bodyInputGain;
}

export function playGuitarPluck(
  freq: number,
  duration: number = 2.2,
  delay: number = 0,
  velocity: number = 0.85,
  strIdx: number = -1
): void {
  try {
    const { ctx, analyser } = getTheoryAudioContext();
    const now = ctx.currentTime + delay;
    const sampleRate = ctx.sampleRate;

    const N = Math.max(8, Math.round(sampleRate / freq));
    const totalSamples = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
    const output = buffer.getChannelData(0);

    const stringBuffer = new Float32Array(N);
    const pickBrightness = Math.max(0.2, Math.min(0.85, 0.35 + freq / 900));
    let lastExcitation = 0;

    for (let i = 0; i < N; i++) {
      const white = Math.random() * 2 - 1;
      lastExcitation = lastExcitation * (1 - pickBrightness) + white * pickBrightness;
      stringBuffer[i] = lastExcitation;
    }

    const damping = Math.max(0.991, Math.min(0.997, 0.996 - 0.003 * (freq / 440)));
    let prevSample = 0;
    let bufIdx = 0;

    for (let i = 0; i < totalSamples; i++) {
      const current = stringBuffer[bufIdx];
      const filtered = 0.5 * (current + prevSample) * damping;
      stringBuffer[bufIdx] = filtered;
      prevSample = current;
      output[i] = filtered;
      bufIdx = (bufIdx + 1) % N;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const noteGain = ctx.createGain();
    const peakGain = Math.max(0.1, Math.min(0.65, velocity * 0.45));

    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(peakGain, now + 0.004);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const bodyGraph = getGuitarBodyGraph(ctx, analyser);
    source.connect(noteGain);
    noteGain.connect(bodyGraph);

    source.start(now);
    source.stop(now + duration + 0.05);

    if (strIdx >= 0) {
      setTimeout(() => {
        const strElems = document.querySelectorAll(`.fret-string-wire[data-str-idx="${strIdx}"]`);
        strElems.forEach((strElem) => {
          strElem.classList.remove('is-vibrating');
          void (strElem as HTMLElement).offsetWidth;
          strElem.classList.add('is-vibrating');
          setTimeout(() => strElem.classList.remove('is-vibrating'), 450);
        });
      }, delay * 1000);
    }
  } catch {}
}

export function playTone(freq: number, duration: number = 2.0, delay: number = 0, strIdx: number = -1): void {
  playGuitarPluck(freq, duration, delay, 0.85, strIdx);
}

function triggerDrumPadHit(pieceType: string): void {
  const pad = document.querySelector(`.drum-pad-piece[data-drum-piece="${pieceType}"]`);
  if (!pad) return;
  pad.classList.remove('is-struck');
  void (pad as HTMLElement).offsetWidth;
  pad.classList.add('is-struck');
  setTimeout(() => pad.classList.remove('is-struck'), 220);
}

export function playDrumSound(type: string, delay: number = 0): void {
  try {
    const { ctx, analyser } = getTheoryAudioContext();
    const now = ctx.currentTime + delay;

    setTimeout(() => triggerDrumPadHit(type), delay * 1000);

    if (type === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.14);
      gain.gain.setValueAtTime(0.68, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(analyser);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'snare' || type === 'ghost') {
      const isGhost = type === 'ghost';
      const bufferSize = ctx.sampleRate * (isGhost ? 0.1 : 0.2);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1100;
      const noiseGain = ctx.createGain();
      const vol = isGhost ? 0.14 : 0.5;
      noiseGain.gain.setValueAtTime(vol, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + (isGhost ? 0.09 : 0.22));
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(analyser);
      noise.start(now);
      noise.stop(now + 0.24);

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.08);
      oscGain.gain.setValueAtTime(isGhost ? 0.1 : 0.35, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(oscGain);
      oscGain.connect(analyser);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'hihat' || type === 'ride') {
      const isRide = type === 'ride';
      const bufferSize = ctx.sampleRate * (isRide ? 0.35 : 0.06);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = isRide ? 5500 : 8500;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(isRide ? 0.28 : 0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isRide ? 0.32 : 0.07));
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(analyser);
      noise.start(now);
      noise.stop(now + (isRide ? 0.35 : 0.08));
    }
  } catch {}
}

export function teardownTheoryAudio(): void {
  if (theoryAudioCtx && theoryAudioCtx.state !== 'closed') {
    try {
      theoryAudioCtx.close();
    } catch {}
    theoryAudioCtx = null;
    theoryAudioAnalyser = null;
    bodyFiltersConnected = false;
    bodyInputGain = null;
  }
}
