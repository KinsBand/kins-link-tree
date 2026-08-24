const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Sanitizes user-provided text before it is embedded into Discord payloads:
 * - strips control characters
 * - neutralizes @everyone / @here pings with a zero-width space
 * - caps length
 */
export function sanitizeText(input: unknown, maxLen = 1000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(CONTROL_CHARS, '')
    .replace(/@everyone/gi, '@\u200beveryone')
    .replace(/@here/gi, '@\u200bhere')
    .slice(0, maxLen)
    .trim();
}

export function isValidHttpUrl(input: unknown, maxLen = 500): boolean {
  if (typeof input !== 'string' || input.length === 0 || input.length > maxLen) return false;
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
