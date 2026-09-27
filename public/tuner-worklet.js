// Protocol changes must also change the versioned URL in audioEngine.js.
// v3: chunks go straight to the analysis Worker over a MessagePort handed in
// with { type: 'connect', port }; frames are absolute context frames.
class TunerCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = options.processorOptions || {};
    this.chunk = opts.chunk || 512;
    this.channel = opts.channel || 0;
    this.poolSize = opts.pool || 24;
    this.pool = Array.from({ length: this.poolSize }, () => new Float32Array(this.chunk));
    this.current = null;
    this.fill = 0;
    this.frame = null;
    this.startFrame = 0;
    this.out = this.port;
    const recycle = event => {
      const data = event.data;
      if (data instanceof Float32Array && data.length === this.chunk && this.pool.length < this.poolSize) this.pool.push(data);
    };
    this.port.onmessage = event => {
      const data = event.data;
      if (data && data.type === 'connect' && data.port) {
        this.out = data.port;
        this.out.onmessage = recycle;
        return;
      }
      recycle(event);
    };
  }
  process(inputs) {
    if (this.frame === null) this.frame = typeof currentFrame === 'number' ? currentFrame : 0;
    const channels = inputs[0];
    const input = channels?.[this.channel];
    const count = channels?.[0]?.length || 128;
    if (!input) { this.frame += count; this.fill = 0; return true; }
    let offset = 0;
    while (offset < input.length) {
      if (!this.current) {
        this.current = this.pool.pop(); this.fill = 0;
        if (!this.current) { this.frame += input.length - offset; return true; }
      }
      if (this.fill === 0) this.startFrame = this.frame;
      const take = Math.min(this.chunk - this.fill, input.length - offset);
      this.current.set(input.subarray(offset, offset + take), this.fill);
      offset += take; this.fill += take; this.frame += take;
      if (this.fill === this.chunk) {
        this.out.postMessage({ protocol: 3, frame: this.startFrame, samples: this.current }, [this.current.buffer]);
        this.current = null; this.fill = 0;
      }
    }
    return true;
  }
}
registerProcessor('tuner-capture', TunerCaptureProcessor);
