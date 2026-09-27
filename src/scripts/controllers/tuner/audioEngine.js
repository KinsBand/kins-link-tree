import { DETECT } from '../../../settings/tuner.config.ts';

const abortError = () => Object.assign(new Error('Microphone start cancelled'), { name: 'AbortError' });
const unavailable = (code) => Object.assign(new Error(code), { code });

/** Microphone capture. PCM flows AudioWorklet -> analysis Worker over a
 * MessagePort created here; the main thread never touches samples. */
export function createAudioEngine() {
  let session = null;
  let generation = 0;
  let micLost = null;

  function release(current) {
    if (!current) return;
    current.closed = true;
    current.events.abort();
    current.stream?.getTracks().forEach(track => track.stop());
    current.channel?.port1.close();
    current.channel?.port2.close();
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
    release(old);
  }
  /** options.worker receives { type: 'connect', port, rate, config }. */
  async function start(options = {}) {
    stop();
    if (!navigator.mediaDevices?.getUserMedia) throw unavailable('unsupported');
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) throw unavailable('unsupported');
    const current = { id: generation, ctx: null, stream: null, source: null, node: null, channel: null, events: new AbortController(), closed: false, bluetooth: false };
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
      await current.ctx.audioWorklet.addModule('/tuner-worklet.js?v=3');
      assertCurrent();
      current.source = current.ctx.createMediaStreamSource(current.stream);
      current.node = new AudioWorkletNode(current.ctx, 'tuner-capture', { numberOfOutputs: 0, processorOptions: { chunk: DETECT.WORKLET_CHUNK, channel: options.channel ?? 0, pool: DETECT.WORKLET_POOL } });
      current.node.addEventListener('processorerror', lost, { signal: current.events.signal });
      current.channel = new MessageChannel();
      current.node.port.postMessage({ type: 'connect', port: current.channel.port1 }, [current.channel.port1]);
      options.worker?.postMessage({ type: 'connect', port: current.channel.port2, rate: current.ctx.sampleRate, config: options.config }, [current.channel.port2]);
      current.source.connect(current.node);
      return current.ctx;
    } catch (error) {
      release(current);
      if (session === current) session = null;
      throw error;
    }
  }
  return {
    start, stop,
    onMicLost(callback) { micLost = callback; },
    get sampleRate() { return session?.ctx.sampleRate ?? 48000; },
    /** Audio clock in ms, the same timebase as reading timestamps. */
    get audioTime() { return session ? session.ctx.currentTime * 1000 : 0; },
    get bluetooth() { return session?.bluetooth ?? false; },
    get running() { return session?.ctx.state === 'running' && !session.closed; }
  };
}
