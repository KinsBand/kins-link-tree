import { createPitchDetector } from './pitchDetector.js';
import { createDrumDetector } from './drumDetector.js';
import { createAnalysisStream } from './analysisStream.js';

/* Receives capture chunks directly from the AudioWorklet over a transferred
   MessagePort, so main-thread jank cannot drop audio. Posts one message per
   analysis; the main thread only renders. Protocol (main -> worker):
     { type: 'connect', port, rate }
     { type: 'config', instrument, targetHz, revision } */
let stream = null;
let capture = null;

self.onmessage = ({ data }) => {
  if (data?.type === 'connect') {
    capture?.close();
    capture = data.port;
    stream = createAnalysisStream({ rate: data.rate, detectors: { pitch: createPitchDetector(), drums: createDrumDetector() } });
    if (data.config) stream.setConfig(data.config);
    capture.onmessage = ({ data: packet }) => {
      if (packet?.protocol !== 3 || !(packet.samples instanceof Float32Array)) { self.postMessage({ type: 'error' }); return; }
      const result = stream.push(packet.frame, packet.samples);
      capture.postMessage(packet.samples, [packet.samples.buffer]); // recycle to the worklet pool
      if (result) self.postMessage({ type: 'reading', ...result });
    };
  } else if (data?.type === 'config') {
    stream?.setConfig(data);
  }
};
