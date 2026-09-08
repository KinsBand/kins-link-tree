import { DETECT } from '../../../settings/tuner.config.ts';

const abortError = () => Object.assign(new Error('Microphone start cancelled'), { name: 'AbortError' });
const unavailable = (code) => Object.assign(new Error(code), { code });

export function createAudioEngine() {
  let session = null;
  let generation = 0;
  let micLost = null;
  let samplesReady = null;
  const ring = new Float32Array(DETECT.RING_SAMPLES);
  let writeIndex = 0, valid = 0, fresh = false, sampleEnd = 0, epoch = 0;

  function clearSamples() { ring.fill(0); writeIndex = 0; valid = 0; fresh = false; sampleEnd = 0; epoch++; }
  function release(current) {
    if (!current) return;
    current.closed = true;
    current.events.abort();
    current.stream?.getTracks().forEach(track => track.stop());
    if (current.node) {
      current.node.port.onmessage = null;
      current.node.port.close?.();
      try { current.node.disconnect(); } catch {}
    }
    try { current.source?.disconnect(); } catch {}
    if (current.ctx && current.ctx.state !== 'closed') current.ctx.close().catch(() => {});
  }
  function stop() {
    generation++;
    const old = session; session = null;
    release(old); clearSamples();
  }
  async function start(options = {}) {
    stop();
    if (!navigator.mediaDevices?.getUserMedia) throw unavailable('unsupported');
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) throw unavailable('unsupported');
    const current = { id: generation, ctx: null, stream: null, source: null, node: null, events: new AbortController(), closed: false, bluetooth: false, expectedFrame: null };
    session = current;
    const assertCurrent = () => { if (session !== current || current.closed) throw abortError(); };
    try {
      // Create/resume during the initiating gesture, before permission resolves.
      current.ctx = new Context({ latencyHint: 'interactive' });
      const resume = current.ctx.state === 'suspended' ? current.ctx.resume() : Promise.resolve();
      // Attach rejection handling immediately while permission may remain pending.
      const resumed = resume.then(() => null, error => error);
      const constraints = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
      if (options.deviceId) constraints['deviceId'] = { exact: options.deviceId };
      current.stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
      assertCurrent();
      const resumeError = await resumed;
      assertCurrent();
      if (resumeError) throw resumeError;
      if (current.ctx.state !== 'running') throw unavailable('interrupted');
      const track = current.stream.getAudioTracks()[0];
      if (!track || track.readyState === 'ended') throw unavailable('mic-lost');
      const lost = () => { if (session === current && !current.closed) micLost?.(); };
      track.addEventListener('ended', lost, { signal: current.events.signal });
      track.addEventListener('mute', lost, { signal: current.events.signal });
      current.bluetooth = /bluetooth|airpod|handsfree|galaxy buds/i.test(track.label || '');
      if (!current.ctx.audioWorklet || typeof AudioWorkletNode === 'undefined') throw unavailable('worklet-unavailable');
      await current.ctx.audioWorklet.addModule('/tuner-worklet.js?v=2');
      assertCurrent();
      current.source = current.ctx.createMediaStreamSource(current.stream);
      current.node = new AudioWorkletNode(current.ctx, 'tuner-capture', { numberOfOutputs: 0, processorOptions: { chunk: DETECT.WORKLET_CHUNK, channel: options.channel ?? 0, protocol: 2 } });
      current.node.addEventListener('processorerror', lost, { signal: current.events.signal });
      current.node.port.onmessage = event => {
        if (session !== current || current.closed) return;
        const packet = event.data;
        if (packet?.protocol !== 2 || !(packet.samples instanceof Float32Array)) { lost(); return; }
        const data = packet.samples;
        if (current.expectedFrame !== null && packet.frame !== current.expectedFrame) clearSamples();
        current.expectedFrame = packet.frame + data.length;
        sampleEnd = current.expectedFrame;
        for (let i = 0; i < data.length; i++) {
          ring[writeIndex] = data[i]; writeIndex = (writeIndex + 1) % ring.length;
        }
        valid = Math.min(ring.length, valid + data.length); fresh = true;
        current.node.port.postMessage(data, [data.buffer]);
        samplesReady?.();
      };
      current.source.connect(current.node);
      return current.ctx;
    } catch (error) {
      release(current);
      if (session === current) { session = null; clearSamples(); }
      throw error;
    }
  }
  function readLatest(target) {
    const window = Math.ceil((session?.ctx.sampleRate ?? 48000) * DETECT.ANALYSIS_WINDOW_MS / 1000);
    const size = Math.min(target.length, valid, window);
    let position = (writeIndex - size + ring.length) % ring.length;
    for (let i = 0; i < size; i++) { target[i] = ring[position]; position = (position + 1) % ring.length; }
    return size;
  }
  return {
    start, stop, readLatest,
    takeFresh() { const result = fresh; fresh = false; return result; },
    onMicLost(callback) { micLost = callback; },
    onSamples(callback) { samplesReady = callback; },
    get sampleRate() { return session?.ctx.sampleRate ?? 48000; },
    get sampleTime() { return sampleEnd / (session?.ctx.sampleRate ?? 48000) * 1000; },
    get epoch() { return epoch; },
    get bluetooth() { return session?.bluetooth ?? false; },
    get running() { return session?.ctx.state === 'running' && !session.closed; }
  };
}
