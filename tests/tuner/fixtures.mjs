export function tone(hz, rate, size, offset = 0, amplitude = 0.2, harmonics = [1], dc = 0) {
  return Float32Array.from({ length: size }, (_, i) => {
    const phase = 2 * Math.PI * hz * (offset + i) / rate;
    return dc + amplitude * harmonics.reduce((sum, gain, h) => sum + gain * Math.sin(phase * (h + 1)), 0);
  });
}

export const centsError = (actual, expected) => 1200 * Math.log2(actual / expected);

export function seededNoise(size, amplitude = 0.1) {
  let seed = 1729;
  return Float32Array.from({ length: size }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return amplitude * (2 * seed / 4294967296 - 1);
  });
}
