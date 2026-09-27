export function tone(hz, rate, size, offset = 0, amplitude = 0.2, harmonics = [1], dc = 0) {
  return Float32Array.from({ length: size }, (_, i) => {
    const phase = 2 * Math.PI * hz * (offset + i) / rate;
    return dc + amplitude * harmonics.reduce((sum, gain, h) => sum + gain * Math.sin(phase * (h + 1)), 0);
  });
}

export const centsError = (actual, expected) => 1200 * Math.log2(actual / expected);

export function seededNoise(size, amplitude = 0.1) {
  let seed = 1729;
  return Float32Array.from({ length: size }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return amplitude * (2 * seed / 4294967296 - 1);
  });
}

/* ---------- Realistic corpus (plucked strings, microphones, rooms) ---------- */

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return 2 * s / 4294967296 - 1; };
}

/** A decaying plucked string rendered as one continuous take.
 *  partials: relative amplitudes of harmonics 1..n (index 0 = fundamental)
 *  B: inharmonicity (f_n = n f0 sqrt(1 + B n^2)), decay: 1/s for the fundamental
 *  vibrato: { cents, hz }, noise: { snrDb, color: 'white'|'pink' }, hum: { hz, db } */
export function renderTake({ f0, rate = 48000, seconds = 2.2, partials = [1, 0.8, 0.6, 0.4, 0.3, 0.2], B = 0, decay = 1.2,
  vibrato = null, noise = null, hum = null, level = 0.15, seed = 11 }) {
  const n = Math.round(seconds * rate);
  const out = new Float32Array(n);
  const phases = partials.map(() => 0);
  const freqs = partials.map((_, h) => (h + 1) * f0 * Math.sqrt(1 + B * (h + 1) ** 2));
  const norm = Math.sqrt(partials.reduce((sum, g) => sum + g * g / 2, 0)) || 1;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const bend = vibrato ? 2 ** (vibrato.cents * Math.sin(2 * Math.PI * vibrato.hz * t) / 1200) : 1;
    let s = 0;
    for (let h = 0; h < partials.length; h++) {
      phases[h] += 2 * Math.PI * freqs[h] * bend / rate;
      s += partials[h] * Math.sin(phases[h]) * Math.exp(-t * decay * (1 + 0.35 * h));
    }
    out[i] = level * s / norm;
  }
  if (noise) {
    const random = rng(seed);
    const rms = level / Math.SQRT2 * 0 + level * 0.7071; // initial signal RMS (normalised above)
    const target = rms / 10 ** (noise.snrDb / 20);
    const raw = new Float32Array(n);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, sq = 0;
    for (let i = 0; i < n; i++) {
      const w = random();
      if (noise.color === 'pink') { // Paul Kellet's refined pink filter
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856; b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
        raw[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
      } else raw[i] = w;
      sq += raw[i] * raw[i];
    }
    const scale = target / Math.sqrt(sq / n);
    for (let i = 0; i < n; i++) out[i] += raw[i] * scale;
  }
  if (hum) {
    const amp = level * 0.7071 * 10 ** (hum.db / 20) * Math.SQRT2;
    for (let i = 0; i < n; i++) {
      const t = i / rate;
      out[i] += amp * (Math.sin(2 * Math.PI * hum.hz * t) + 0.5 * Math.sin(4 * Math.PI * hum.hz * t) + 0.3 * Math.sin(6 * Math.PI * hum.hz * t));
    }
  }
  return out;
}

const PHONE_BASS = [0.05, 0.2, 1, 0.8, 0.6, 0.4, 0.3, 0.2];
const hz = midi => 440 * 2 ** ((midi - 69) / 12);

export const REALISTIC_CORPUS = [
  { name: 'guitar E2 clean', f0: hz(40) },
  { name: 'guitar A2 clean', f0: hz(45) },
  { name: 'guitar G3 clean', f0: hz(55) },
  { name: 'guitar E4 clean', f0: hz(64), partials: [1, 0.5, 0.3, 0.15] },
  { name: 'guitar E2 phone mic', f0: hz(40), partials: [0.1, 1, 0.8, 0.5, 0.3, 0.2] },
  { name: 'guitar E2 strong 2nd', f0: hz(40), partials: [0.4, 1, 0.3, 0.2] },
  { name: 'bass E1 phone mic', f0: hz(28), partials: PHONE_BASS },
  { name: 'bass B0 phone mic', f0: hz(23), partials: PHONE_BASS },
  { name: 'bass E1 inharmonic', f0: hz(28), partials: [0.5, 1, 0.8, 0.6], B: 4e-4 },
  { name: 'guitar G3 vibrato', f0: hz(55), vibrato: { cents: 12, hz: 5 }, precision: false },
  { name: 'guitar E2 white 20dB', f0: hz(40), noise: { snrDb: 20 } },
  { name: 'guitar E2 white 10dB', f0: hz(40), noise: { snrDb: 10 } },
  { name: 'guitar A4 white 10dB', f0: 440, partials: [1, 0.5, 0.3], noise: { snrDb: 10 } },
  { name: 'guitar E2 pink 10dB', f0: hz(40), noise: { snrDb: 10, color: 'pink' } },
  { name: 'guitar A2 white 6dB', f0: hz(45), noise: { snrDb: 6 } },
  { name: 'guitar A2 hum 50Hz -20dB', f0: hz(45), hum: { hz: 50, db: -20 } },
  { name: 'bass E1 hum 60Hz -20dB', f0: hz(28), partials: [0.5, 1, 0.8, 0.6], hum: { hz: 60, db: -20 } },
  { name: 'guitar A2 hum 50Hz -10dB', f0: hz(45), hum: { hz: 50, db: -10 } },
];

/** Run a detector over a take the way the app does: 128 ms windows every
 * 25 ms. Scored frames cover the sustain a player tunes on: from 100 ms
 * after the window fills (attack/acquire) to 1.2 s into the take. The noise
 * level is fixed while the note decays, so SNR falls ~10 dB over that span. */
export function scoreTake(createDetector, spec, rate = 48000) {
  const take = renderTake({ ...spec, rate });
  const detector = createDetector();
  const size = Math.ceil(rate * 0.128), hop = Math.round(rate * 0.025);
  let frames = 0, accepted = 0, octave = 0, worstMs = 0;
  const errors = [];
  for (let end = size, k = 0; end <= take.length; end += hop, k++) {
    const window = take.subarray(end - size, end);
    const started = performance.now();
    const reading = detector.process(window, window.length, rate, k * 25);
    worstMs = Math.max(worstMs, performance.now() - started);
    if (end < size + Math.round(rate * 0.1) || end > Math.round(rate * 1.2)) continue;
    frames++;
    if (reading.status !== 'ok' || !reading.locked) continue;
    const cents = 1200 * Math.log2(reading.freq / spec.f0);
    if (Math.abs(cents) > 300) { octave++; continue; }
    accepted++;
    errors.push(Math.abs(cents));
  }
  errors.sort((a, b) => a - b);
  return { name: spec.name, frames, acceptedPct: 100 * accepted / frames, octave,
    p95: errors.length ? errors[Math.min(errors.length - 1, Math.floor(errors.length * 0.95))] : NaN, worstMs };
}
