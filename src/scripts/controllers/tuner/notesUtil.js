/* Shared note-naming helpers for the tuner controller set — one definition
   instead of the previous three per-module copies. */

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/* "A4" -> "A" (strips octave digits, keeps #/b accidentals) */
export function noteLetter(note) {
  return String(note).replace(/[0-9]/g, '');
}

/* 69 -> "A4" */
export function midiToNoteName(midi) {
  return NOTE_NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}

/* 69 -> "A" */
export function midiToPitchClass(midi) {
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}
