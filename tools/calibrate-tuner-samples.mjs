// Run against a local Astro dev server. Measures the actual recorded pitches;
// the checked-in manifest uses these instead of trusting filename tuning.
import { chromium } from '@playwright/test';
import { readdir, writeFile } from 'node:fs/promises';
const root = new URL('../public/audio/tuner/', import.meta.url);
const files = [];
for (const instrument of ['guitar-acoustic', 'guitar-electric', 'bass-electric']) {
  for (const file of await readdir(new URL(instrument + '/', root))) if (file.endsWith('.mp3')) files.push(`${instrument}/${file}`);
}
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(process.argv[2] || 'http://127.0.0.1:4336/tuner');
  const readings = await page.evaluate(async files => {
    const { createPitchDetector } = await import('/src/scripts/controllers/tuner/pitchDetector.js');
    const ctx = new AudioContext({ sampleRate: 48000 });
    const output = [];
    for (const file of files) {
      const response = await fetch('/audio/tuner/' + file);
      const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
      const samples = buffer.getChannelData(0), detector = createPitchDetector(), frequencies = [];
      for (let ms = 150; ms < Math.min(1500, buffer.duration * 1000 - 128); ms += 25) {
        const start = Math.round(ms / 1000 * buffer.sampleRate);
        const input = samples.slice(start, start + Math.round(buffer.sampleRate * 0.128));
        const reading = detector.process(input, input.length, buffer.sampleRate, ms);
        if (reading.locked && reading.status === 'ok') frequencies.push(reading.freq);
      }
      frequencies.sort((a, b) => a - b);
      const hz = frequencies[Math.floor(frequencies.length / 2)];
      if (!hz) throw new Error('No stable pitch: ' + file);
      output.push({ file, hz: Math.round(hz * 10000) / 10000, duration: buffer.duration, count: frequencies.length,
        spreadCents: Math.round(1200 * Math.log2(frequencies.at(-1) / frequencies[0])) });
    }
    await ctx.close(); return output;
  }, files);
  await writeFile(new URL('../public/audio/tuner/measurements.json', import.meta.url), JSON.stringify(readings, null, 2) + '\n');
  console.log(JSON.stringify(readings, null, 2));
} finally { await browser.close(); }
