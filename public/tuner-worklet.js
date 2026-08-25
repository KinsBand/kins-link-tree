const CHUNK = 1024;
const POOL_SIZE = 4;

class TunerCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._pool = [];
    for (let i = 0; i < POOL_SIZE; i++) this._pool.push(new Float32Array(CHUNK));
    this._current = null;
    this._fill = 0;
    this.port.onmessage = (e) => {
      const data = e.data;
      if (data instanceof Float32Array && data.length === CHUNK && this._pool.length < POOL_SIZE) {
        this._pool.push(data);
      }
    };
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const ch = input[0];
    const n = ch.length;
    let i = 0;
    while (i < n) {
      if (!this._current) {
        this._current = this._pool.pop() || null;
        if (!this._current) return true;
        this._fill = 0;
      }
      const take = Math.min(CHUNK - this._fill, n - i);
      this._current.set(ch.subarray(i, i + take), this._fill);
      this._fill += take;
      i += take;
      if (this._fill === CHUNK) {
        this.port.postMessage(this._current, [this._current.buffer]);
        this._current = null;
      }
    }
    return true;
  }
}

registerProcessor('tuner-capture', TunerCaptureProcessor);
