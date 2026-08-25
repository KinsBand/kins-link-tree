import { DETECT } from '../../../settings/tuner.config';

const RING_SAMPLES = DETECT.RING_SAMPLES;
const CHUNK = DETECT.WORKLET_CHUNK;

export function createAudioEngine() {
  let ctx = null;
  let stream = null;
  let sourceNode = null;
  let workletNode = null;
  let scriptNode = null;
  let muteGain = null;
  let usingWorklet = false;
  let micLostCb = null;
  /* Guards the 'ended' listener against firing during our own teardown
     (track.stop() doesn't fire 'ended', but device unplug/OS revocation does). */
  let closing = false;

  const ring = new Float32Array(RING_SAMPLES);
  let writeIdx = 0;
  let fresh = false;
  let bluetoothDetected = false;

  function handleTrackEnded() {
    if (!closing && micLostCb) micLostCb();
  }

  function writeSamples(data) {
    const n = data.length;
    let pos = writeIdx % RING_SAMPLES;
    for (let i = 0; i < n; i++) {
      ring[pos] = data[i];
      pos = pos + 1 === RING_SAMPLES ? 0 : pos + 1;
    }
    writeIdx += n;
    fresh = true;
  }

  function onWorkletMessage(e) {
    const data = e.data;
    if (data instanceof Float32Array) {
      writeSamples(data);
      if (workletNode) workletNode.port.postMessage(data, [data.buffer]);
    }
  }

  function onScriptProcess(e) {
    writeSamples(e.inputBuffer.getChannelData(0));
  }

  async function looksBluetooth(track) {
    try {
      const settings = track && track.getSettings ? track.getSettings() : {};
      const devices = await navigator.mediaDevices.enumerateDevices();
      const device = devices.find((d) => d.deviceId === settings.deviceId);
      const label = ((device && device.label) || track.label || '').toLowerCase();
      return /bluetooth|airpod|headset|earpod|handsfree|wh-|wf-|galaxy buds|buds/i.test(label);
    } catch (e) {
      return false;
    }
  }

  async function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = new Error('unsupported');
      err.code = 'unsupported';
      throw err;
    }

    closing = false;
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        googEchoCancellation: false,
        googNoiseSuppression: false,
        googAutoGainControl: false
      }
    });

    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      ctx = new Ctx({ idealSampleRate: 48000 });
      if (ctx.state === 'suspended') await ctx.resume();

      const track = stream.getAudioTracks()[0];
      if (track && track.getSettings) {
        try { await track.applyConstraints({ echoCancellation: false, noiseSuppression: false, autoGainControl: false }); } catch (e) {}
      }
      if (track && track.addEventListener) {
        track.addEventListener('ended', handleTrackEnded);
      }
      bluetoothDetected = await looksBluetooth(track);

      sourceNode = ctx.createMediaStreamSource(stream);
      usingWorklet = false;
      if (ctx.audioWorklet) {
        try {
          await ctx.audioWorklet.addModule('/tuner-worklet.js');
          workletNode = new AudioWorkletNode(ctx, 'tuner-capture', { numberOfOutputs: 0 });
          workletNode.port.onmessage = onWorkletMessage;
          sourceNode.connect(workletNode);
          usingWorklet = true;
        } catch (e) {
          workletNode = null;
        }
      }
      if (!usingWorklet) {
        scriptNode = ctx.createScriptProcessor(CHUNK, 1, 1);
        scriptNode.onaudioprocess = onScriptProcess;
        muteGain = ctx.createGain();
        muteGain.gain.value = 0;
        sourceNode.connect(scriptNode);
        scriptNode.connect(muteGain);
        muteGain.connect(ctx.destination);
      }
      return ctx;
    } catch (err) {
      stop();
      throw err;
    }
  }

  function readLatest(target) {
    const size = Math.min(target.length, RING_SAMPLES);
    let pos = ((writeIdx - size) % RING_SAMPLES + RING_SAMPLES) % RING_SAMPLES;
    for (let j = 0; j < size; j++) {
      target[j] = ring[pos];
      pos = pos + 1 === RING_SAMPLES ? 0 : pos + 1;
    }
    return size;
  }

  function takeFresh() {
    const wasFresh = fresh;
    fresh = false;
    return wasFresh;
  }

  async function resume() {
    if (ctx && ctx.state === 'suspended') {
      try { await ctx.resume(); return true; } catch (e) { return false; }
    }
    return true;
  }

  function suspend() {
    if (ctx && ctx.state === 'running') {
      try { ctx.suspend(); } catch (e) {}
    }
  }

  function stop() {
    closing = true;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    if (workletNode) {
      workletNode.port.onmessage = null;
      try { workletNode.disconnect(); } catch (e) {}
      workletNode = null;
    }
    if (scriptNode) {
      scriptNode.onaudioprocess = null;
      try { scriptNode.disconnect(); } catch (e) {}
      scriptNode = null;
    }
    if (muteGain) {
      try { muteGain.disconnect(); } catch (e) {}
      muteGain = null;
    }
    if (sourceNode) {
      try { sourceNode.disconnect(); } catch (e) {}
      sourceNode = null;
    }
    if (ctx) {
      try { ctx.close(); } catch (e) {}
      ctx = null;
    }
    usingWorklet = false;
    fresh = false;
    writeIdx = 0;
  }

  return {
    start,
    stop,
    resume,
    suspend,
    readLatest,
    takeFresh,
    onMicLost(cb) { micLostCb = typeof cb === 'function' ? cb : null; },
    get sampleRate() { return ctx ? ctx.sampleRate : 48000; },
    get bluetooth() { return bluetoothDetected; },
    get running() { return !!ctx && ctx.state === 'running'; }
  };
}
