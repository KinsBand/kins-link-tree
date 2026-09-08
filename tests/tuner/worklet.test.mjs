import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

function capture(channel = 0) {
  const packets = [];
  let Processor;
  vm.runInNewContext(fs.readFileSync(new URL('../../public/tuner-worklet.js', import.meta.url), 'utf8'), {
    Float32Array,
    AudioWorkletProcessor: class {
      port = { onmessage: null, postMessage(packet, transfer) { packets.push(structuredClone(packet, { transfer })); } };
    },
    registerProcessor(name, implementation) { assert.equal(name, 'tuner-capture'); Processor = implementation; }
  });
  return { node: new Processor({ processorOptions: { channel, chunk: 512 } }), packets };
}

test('worklet preserves exact sample order, channel selection and frame positions', () => {
  const { node, packets } = capture(1);
  for (let block = 0; block < 4; block++) {
    node.process([[new Float32Array(128), Float32Array.from({ length: 128 }, (_, i) => block * 128 + i)]]);
  }
  assert.equal(packets.length, 1);
  assert.equal(packets[0].protocol, 2);
  assert.equal(packets[0].frame, 0);
  assert.deepEqual(packets[0].samples, Float32Array.from({ length: 512 }, (_, i) => i));
});

test('worklet starvation and missing channels create detectable gaps rather than invented audio', () => {
  const { node, packets } = capture();
  const block = [[new Float32Array(128).fill(.2)]];
  for (let i = 0; i < 20; i++) node.process(block);
  assert.equal(packets.length, 4); // Four-buffer transfer pool is exhausted.
  node.port.onmessage({ data: packets[0].samples });
  node.process([[]]); // Missing input advances time, never falls back to another channel.
  for (let i = 0; i < 4; i++) node.process(block);
  assert.equal(packets.length, 5);
  assert.equal(packets[4].frame, 2688);
});
