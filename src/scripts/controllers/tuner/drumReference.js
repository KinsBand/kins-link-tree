import { DRUM_SAMPLES } from '../../../settings/drumSamples.config.ts';

export function drumReferenceSample(kind, targetHz) {
  const samples = DRUM_SAMPLES[kind];
  if (!samples || !Number.isFinite(targetHz) || targetHz < 45 || targetHz > 500) throw new Error('Invalid drum reference');
  const [file, measuredHz] = [...samples].sort((a, b) => Math.abs(Math.log2(targetHz / a[1])) - Math.abs(Math.log2(targetHz / b[1])))[0];
  return { url: `/audio/tuner/drums/${file}.wav`, playbackRate: targetHz / measuredHz };
}
