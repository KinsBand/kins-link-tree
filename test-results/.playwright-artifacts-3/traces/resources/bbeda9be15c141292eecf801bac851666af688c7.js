// Protocol changes must also change the versioned URL in audioEngine.js.
class TunerCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.chunk = options.processorOptions?.chunk || 512;
    this.channel = options.processorOptions?.channel || 0;
    this.pool = Array.from({ length: 4 }, () => new Float32Array(this.chunk));
    this.current = null;
    this.fill = 0;
    this.frame = 0;
    this.startFrame = 0;
    this.port.onmessage = event => {
      const data = event.data;
      if (data instanceof Float32Array && data.length === this.chunk && this.pool.length < 4) this.pool.push(data);
    };
  }
  process(inputs) {
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
        this.port.postMessage({ protocol: 2, frame: this.startFrame, samples: this.current }, [this.current.buffer]);
        this.current = null; this.fill = 0;
      }
    }
    return true;
  }
}
registerProcessor('tuner-capture', TunerCaptureProcessor);
