// Recorded instruments from tonejs-instruments (CC BY 3.0).
// Measured median pitch, not just filename pitch: see public/audio/tuner/measurements.json.
// The low Cs1 recording is omitted because its measured pitch drift exceeded 20 cents.
export const TUNER_SAMPLES = {
  acoustic: { folder: 'guitar-acoustic', notes: [
    ['D2', 73.2996], ['E2', 82.2991], ['A2', 109.9642], ['D3', 146.745],
    ['G3', 195.7348], ['B3', 246.7893], ['E4', 329.8141],
  ] },
  electric: { folder: 'guitar-electric', notes: [
    ['Cs2', 69.2933], ['E2', 82.3846], ['Fs2', 92.497], ['A2', 110.0035],
    ['C3', 130.8037], ['Ds3', 155.5732], ['Fs3', 184.8395], ['A3', 220.1726],
    ['C4', 261.2179], ['Ds4', 311.0215], ['Fs4', 369.9339],
  ] },
  bass: { folder: 'bass-electric', notes: [
    ['E1', 41.3065], ['G1', 48.8824], ['As1', 58.2408], ['Cs2', 69.2988],
    ['E2', 82.3541], ['G2', 97.9406], ['As2', 116.4972], ['Cs3', 138.5644],
  ] },
} as const;
export const TUNER_SAMPLE_CREDITS = {
  source: 'https://github.com/nbrosowsky/tonejs-instruments',
  license: 'https://creativecommons.org/licenses/by/3.0/',
  revision: '622c2f1c32c8cfce4158ddc3eb26e518ddef37e5',
};
