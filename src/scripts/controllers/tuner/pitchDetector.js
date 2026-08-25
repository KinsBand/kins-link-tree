import { DETECT } from '../../../settings/tuner.config';

const MIN_HZ = DETECT.MIN_DETECT_HZ;
const MAX_HZ = DETECT.MAX_DETECT_HZ;
const FFT_SIZE = 4096;

function makeFft(n) {
  const rev = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    let r = 0;
    let x = i;
    for (let b = 1; b < n; b <<= 1) {
      r = (r << 1) | (x & 1);
      x >>= 1;
    }
    rev[i] = r;
  }
  const cosT = new Float32Array(n / 2);
  const sinT = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    const a = (-2 * Math.PI * i) / n;
    cosT[i] = Math.cos(a);
    sinT[i] = Math.sin(a);
  }
  return { n, rev, cosT, sinT };
}

function fftMagnitudes(mag, re, im, fft) {
  const { n, rev, cosT, sinT } = fft;
  for (let i = 0; i < n; i++) {
    const j = rev[i];
    if (j > i) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const step = n / size;
    for (let i = 0; i < n; i += size) {
      for (let j = i, k = 0; j < i + half; j++, k += step) {
        const l = j + half;
        const tre = re[l] * cosT[k] - im[l] * sinT[k];
        const tim = re[l] * sinT[k] + im[l] * cosT[k];
        re[l] = re[j] - tre;
        im[l] = im[j] - tim;
        re[j] += tre;
        im[j] += tim;
      }
    }
  }
  for (let i = 0; i < n / 2; i++) {
    mag[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
  }
}

export function createPitchDetector() {
  const fft = makeFft(FFT_SIZE);
  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);
  const mag = new Float32Array(FFT_SIZE / 2);
  const corrBuf = new Float32Array(2048);

  let dcPrevX = 0;
  let dcPrevY = 0;
  let gateActive = false;
  let silentFrames = 0;
  let onsetAt = 0;
  let lockFrames = 0;
  let locked = false;
  let prevFreq = 0;
  let prevConfident = false;
  let jitterEma = 0;
  let lastActiveAt = -1e9;
  let pendingOnset = false;
  let fftCounter = 0;
  let lastCheckedFreq = 0;

  const result = { status: 'silent', freq: 0, clarity: 0, conf: 0, locked: false, onset: false };

  function reset() {
    dcPrevX = 0; dcPrevY = 0;
    gateActive = false; silentFrames = 0; onsetAt = 0;
    lockFrames = 0; locked = false; prevFreq = 0; prevConfident = false; jitterEma = 0;
    lastActiveAt = -1e9; pendingOnset = false;
    fftCounter = 0; lastCheckedFreq = 0;
  }

  /* Adaptive YIN acceptance threshold (Tuneo-style): healthy signal uses the
     strict base threshold; as RMS decays toward the release floor the
     threshold relaxes on a log curve so the true lag keeps winning the CMNDF
     search through the ring-out instead of losing to noise/octave errors. */
  function adaptiveYinThreshold(rms) {
    const lo = DETECT.RMS_RELEASE;
    const hi = DETECT.YIN_ADAPT_FULL_RMS;
    if (rms >= hi) return DETECT.YIN_THRESHOLD;
    if (rms <= lo) return DETECT.YIN_THRESH_MAX;
    const t = Math.log(rms / lo) / Math.log(hi / lo);
    return DETECT.YIN_THRESHOLD + (DETECT.YIN_THRESH_MAX - DETECT.YIN_THRESHOLD) * t;
  }

  function yin(buf, W, minLag, maxLag, thr) {
    let cum = 0;
    let globalMin = Infinity;
    let globalMinLag = -1;
    let chosenLag = -1;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < W; i += 2) {
        const diff = buf[i] - buf[i + lag];
        sum += diff * diff;
      }
      cum += sum;
      const cmndf = cum > 0 ? (sum * (lag - minLag + 1)) / cum : 1;
      if (cmndf < globalMin) {
        globalMin = cmndf;
        globalMinLag = lag;
      }
      if (chosenLag < 0 && cmndf < thr) {
        chosenLag = lag;
      }
      corrBuf[lag] = cmndf;
    }
    const lag = chosenLag > 0 ? chosenLag : globalMinLag;
    if (lag < 0) return { lag: -1, cmndfMin: 1 };
    const x2 = corrBuf[lag];
    const x1 = lag > minLag ? corrBuf[lag - 1] : x2;
    const x3 = lag < maxLag ? corrBuf[lag + 1] : x2;
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    const refined = a !== 0 ? lag - b / (2 * a) : lag;
    return { lag: refined, cmndfMin: globalMin };
  }

  function magNear(f, binHz) {
    const idx = Math.round(f / binHz);
    if (idx < 1 || idx >= mag.length - 1) return 0;
    let m = mag[idx];
    if (mag[idx - 1] > m) m = mag[idx - 1];
    if (mag[idx + 1] > m) m = mag[idx + 1];
    return m;
  }

  function harmonicCheck(freq, sampleRate) {
    const binHz = sampleRate / FFT_SIZE;
    const main = magNear(freq, binHz);
    let f = freq;
    const half = magNear(freq / 2, binHz);
    if (freq / 2 >= MIN_HZ && half >= DETECT.SUBHARMONIC_RATIO * Math.max(main, 1e-9)) {
      f = freq / 2;
    }
    const maxMag = Math.max(main, 1e-9);
    let nonHarmonicPeaks = 0;
    const lo = Math.max(1, Math.floor(80 / binHz));
    const hi = Math.min(mag.length - 2, Math.ceil(MAX_HZ / binHz));
    let i = lo;
    while (i <= hi) {
      if (mag[i] > mag[i - 1] && mag[i] >= mag[i + 1] && mag[i] >= DETECT.POLYPHONY_PEAK_RATIO * maxMag) {
        const peakF = i * binHz;
        let harmonic = false;
        for (let k = 1; k <= 8; k++) {
          if (Math.abs(peakF - (f * k)) / (f * k) < 0.015) {
            harmonic = true;
            break;
          }
        }
        if (!harmonic) {
          nonHarmonicPeaks++;
          if (nonHarmonicPeaks >= DETECT.POLYPHONY_MAX) break;
        }
        i += 2;
      } else {
        i++;
      }
    }
    return { freq: f, polyphonic: nonHarmonicPeaks >= DETECT.POLYPHONY_MAX };
  }

  function process(buf, size, sampleRate, nowMs) {
    let clipCount = 0;
    let rms = 0;
    for (let i = 0; i < size; i++) {
      const x = buf[i];
      const y = x - dcPrevX + 0.996 * dcPrevY;
      dcPrevX = x;
      dcPrevY = y;
      buf[i] = y;
      rms += y * y;
      if (x >= DETECT.CLIP_LEVEL || x <= -DETECT.CLIP_LEVEL) clipCount++;
    }
    rms = Math.sqrt(rms / size);

    if (!gateActive && rms >= DETECT.RMS_WAKE) {
      gateActive = true;
      onsetAt = nowMs;
      silentFrames = 0;
    } else if (gateActive && rms < DETECT.RMS_RELEASE) {
      gateActive = false;
      silentFrames++;
    }

    result.status = 'silent';
    result.freq = 0;
    result.clarity = 0;
    result.conf = 0;
    result.locked = locked;
    result.onset = false;

    if (!gateActive) {
      silentFrames++;
      if (silentFrames > DETECT.CONF_SILENT_FRAMES) {
        locked = false;
        result.locked = false;
        prevConfident = false;
      }
      return result;
    }
    // Fresh pluck after a gap: flag once so the caller resets its smoothers
    // and the new attack is measured clean instead of blending with the
    // decaying resonance of the previous note.
    // Quality upgrade: a genuine new pluck must re-establish lock from
    // scratch — the previous note's lock must NOT carry over into the
    // attack, otherwise the first noisy frames would be treated as trusted
    // and would flicker the held display. Clearing locked/jitter/prevConfident
    // forces CONF_LOCK_FRAMES of stable frames before the new pitch is
    // considered reliable, which implements the requested "skip the start"
    // behaviour at the detector level.
    if (nowMs - lastActiveAt > DETECT.ONSET_GAP_MS) {
      pendingOnset = true;
      locked = false;
      lockFrames = 0;
      jitterEma = 0;
      prevConfident = false;
      // Force a full YIN search window and an immediate harmonic check for
      // the new note instead of reusing the previous frequency's narrowed
      // window and stale FFT cache.
      lastCheckedFreq = 0;
      fftCounter = 0;
    }
    lastActiveAt = nowMs;
    if (nowMs - onsetAt < DETECT.ATTACK_FREEZE_MS) {
      result.status = 'transient';
      result.onset = pendingOnset;
      pendingOnset = false;
      return result;
    }
    if (clipCount / size > DETECT.CLIP_RATIO) {
      result.status = 'clipped';
      result.onset = pendingOnset;
      pendingOnset = false;
      return result;
    }

    const W = prevFreq > 0 && prevFreq < 110 ? 4096 : prevFreq >= 900 ? 1024 : 2048;
    let minLag = Math.max(2, Math.floor(sampleRate / MAX_HZ));
    let maxLag = Math.min(Math.floor(sampleRate / MIN_HZ), 2046);
    if (W === 4096) maxLag = Math.min(maxLag, size - W - 2);
    else maxLag = Math.min(maxLag, Math.floor(W * 1.7));
    if (maxLag <= minLag + 2) {
      result.status = 'silent';
      return result;
    }

    let searchMin = minLag;
    let searchMax = maxLag;
    if (W === 4096 && prevConfident && prevFreq > 0) {
      const tauPrev = sampleRate / prevFreq;
      searchMin = Math.max(minLag, Math.floor(tauPrev * 0.67));
      searchMax = Math.min(maxLag, Math.ceil(tauPrev * 1.5));
      if (searchMax - searchMin < 8) {
        searchMin = minLag;
        searchMax = maxLag;
      }
    }

    const thrEff = adaptiveYinThreshold(rms);
    const { lag, cmndfMin } = yin(buf, W, searchMin, searchMax, thrEff);
    if (lag <= 0) {
      result.status = 'silent';
      return result;
    }
    let freq = sampleRate / lag;
    if (!(freq >= MIN_HZ && freq <= MAX_HZ)) {
      result.status = 'silent';
      return result;
    }

    /* Harmonic/polyphony verification via FFT runs on a cadence instead of
       every frame: always while unlocked, always after a >3% pitch move
       (catches octave corrections), otherwise every HARMONIC_CHECK_EVERY'th
       confident frame. Between checks the YIN estimate is trusted as-is. */
    fftCounter++;
    const jumped =
      lastCheckedFreq > 0 &&
      Math.abs(freq - lastCheckedFreq) / lastCheckedFreq > DETECT.HARMONIC_CHECK_JUMP;
    if (!locked || jumped || fftCounter % DETECT.HARMONIC_CHECK_EVERY === 0) {
      for (let i = 0; i < FFT_SIZE; i++) {
        re[i] = i < size ? buf[i] : 0;
        im[i] = 0;
      }
      fftMagnitudes(mag, re, im, fft);
      const checked = harmonicCheck(freq, sampleRate);
      if (checked.polyphonic) {
        result.status = 'polyphonic';
        return result;
      }
      freq = checked.freq;
      if (!(freq >= MIN_HZ && freq <= MAX_HZ)) {
        result.status = 'silent';
        return result;
      }
      lastCheckedFreq = freq;
    }

    const clarity = Math.max(0, Math.min(1, 1 - cmndfMin));
    const conf = Math.max(0, Math.min(1, clarity * Math.sqrt(Math.min(1, rms / 0.02))));

    if (prevFreq > 0) {
      const deltaCents = Math.abs(1200 * Math.log2(freq / prevFreq));
      jitterEma = jitterEma === 0 ? deltaCents : jitterEma * 0.7 + deltaCents * 0.3;
    }
    prevFreq = freq;

    if (locked) {
      if (conf < DETECT.CONF_UNLOCK) {
        locked = false;
        lockFrames = 0;
      }
    } else if (conf >= DETECT.CONF_LOCK && jitterEma < DETECT.JITTER_CENTS) {
      lockFrames++;
      if (lockFrames >= DETECT.CONF_LOCK_FRAMES) locked = true;
    } else {
      lockFrames = 0;
    }

    prevConfident = conf >= DETECT.CONF_LOCK;
    result.status = 'ok';
    result.freq = freq;
    result.clarity = clarity;
    result.conf = conf;
    result.locked = locked;
    result.onset = pendingOnset;
    pendingOnset = false;
    return result;
  }

  return { process, reset };
}

export function createCentsSmoother() {
  const buf = [];
  let ema = null;
  let jumpRun = 0;

  function reset() {
    buf.length = 0;
    ema = null;
    jumpRun = 0;
  }

  /* `fine` = detector lock engaged: slow the EMA down so the needle holds
     sub-cent steady on a ringing string instead of tracking micro-noise
     (TomSchimansky-style high-stability display mode). */
  function push(rawCents, fine) {
    if (ema !== null && Math.abs(rawCents - ema) > DETECT.OCTAVE_JUMP_CENTS) {
      jumpRun++;
      if (jumpRun < DETECT.OCTAVE_JUMP_FRAMES) {
        return { cents: ema, held: true };
      }
    } else {
      jumpRun = 0;
    }
    buf.push(rawCents);
    if (buf.length > DETECT.MEDIAN_WINDOW) buf.shift();
    const sorted = buf.slice().sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const alpha = fine ? DETECT.EMA_ALPHA_FINE : DETECT.EMA_ALPHA;
    ema = ema === null ? median : ema + alpha * (median - ema);
    return { cents: ema, held: false };
  }

  return { push, reset };
}

export function createNoteStabilizer() {
  let current = null;
  let candidate = null;
  let candidateSince = 0;

  function reset() {
    current = null;
    candidate = null;
    candidateSince = 0;
  }

  function update(midi, nowMs) {
    if (current === null) {
      current = midi;
      candidate = null;
      return current;
    }
    if (midi === current) {
      candidate = null;
      return current;
    }
    if (midi === candidate) {
      if (nowMs - candidateSince >= DETECT.LABEL_HYSTERESIS_MS) {
        current = midi;
        candidate = null;
      }
    } else {
      candidate = midi;
      candidateSince = nowMs;
    }
    return current;
  }

  return { update, reset };
}
