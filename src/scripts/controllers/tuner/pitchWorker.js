import { createPitchDetector } from './pitchDetector.js';
import { createDrumDetector } from './drumDetector.js';

const detector = createPitchDetector();
const drums = createDrumDetector();
let epoch = -1;
let revision = -1;
self.onmessage = ({ data }) => {
  if (data.epoch !== epoch || data.revision !== revision) {
    detector.reset();
    drums.reset();
    epoch = data.epoch;
    revision = data.revision;
  }
  const started = performance.now();
  const reading = data.instrument === 'drums'
    ? drums.process(data.samples, data.size, data.rate, data.time, data.targetHz)
    : detector.process(data.samples, data.size, data.rate, data.time);
  self.postMessage({ reading, revision, epoch, durationMs: performance.now() - started, samples: data.samples }, [data.samples.buffer]);
};
