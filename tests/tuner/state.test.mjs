import test from 'node:test';
import assert from 'node:assert/strict';
import { state, setInstrument, setPreset, setCustomStringCount, getPreset, restore, getStringGauges, setStringGauge } from '../../src/scripts/controllers/tuner/tunerState.js';
import { TUNER_INSTRUMENTS, noteToFreq } from '../../src/settings/tuner.config.ts';

const saved = new Map();
globalThis.localStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };

test('all instruments and string counts have gauges; custom gauges stay isolated and survive restoration', () => {
  saved.clear();
  for (const instrument of ['electric', 'acoustic', 'bass']) {
    setInstrument(instrument);
    for (let count = 1; count <= 12; count++) {
      setCustomStringCount(count);
      const gauges = getStringGauges();
      assert.equal(gauges.length, count);
      assert.ok(gauges.every(gauge => Number.isFinite(gauge) && gauge > 0 && gauge <= 200));
    }
  }
  setInstrument('electric'); setCustomStringCount(6);
  assert.equal(getStringGauges()[0], 52);
  assert.ok(setStringGauge(0, 54)); restore();
  assert.equal(getStringGauges()[0], 54);
  setCustomStringCount(7); assert.equal(getStringGauges()[0], 64);
  setInstrument('acoustic'); setCustomStringCount(6); assert.equal(getStringGauges()[0], 53);
  setInstrument('electric'); setCustomStringCount(6); assert.equal(getStringGauges()[0], 54);
});

test('custom string counts are strict, complete, and survive restoration', () => {
  for (const instrument of ['acoustic', 'electric', 'bass']) {
    saved.clear(); setInstrument(instrument);
    for (let count = 1; count <= 12; count++) {
      assert.ok(setCustomStringCount(count));
      assert.equal(getPreset().strings.length, count, `${instrument} ${count}`);
      restore();
      assert.equal(getPreset().id, `custom-${instrument}-${count}`);
      assert.equal(getPreset().strings.length, count);
    }
    for (const invalid of [3.9, '4x', Infinity, NaN, 0, 13]) assert.equal(setCustomStringCount(invalid), false);
  }
});

test('stable preset identity takes priority over the legacy array index', () => {
  saved.clear(); setInstrument('electric'); setPreset(1);
  const id = getPreset().id;
  saved.set('kins-tuner-preset-electric', '0');
  restore();
  assert.equal(getPreset().id, id);
  assert.equal(state.presetIndex, 1);
});

test('preset catalog has unique instrument-local IDs and internally consistent pitch data', () => {
  for (const instrument of TUNER_INSTRUMENTS) {
    const ids = new Set();
    for (const preset of instrument.presets) {
      assert.ok(!ids.has(preset.id), `${instrument.id}: duplicate ${preset.id}`);
      ids.add(preset.id);
      assert.ok(preset.strings.length > 0);
      for (const string of preset.strings) {
        assert.ok(Number.isInteger(string.midi));
        assert.ok(Number.isFinite(string.freq) && string.freq > 0);
        if (instrument.id !== 'drums') assert.ok(Math.abs(noteToFreq(string.midi) - string.freq) <= .006);
      }
    }
  }
});


test('every instrument/count has catalog coverage and guitars have exact parity', () => {
  const electric = TUNER_INSTRUMENTS.find(g => g.id === 'electric');
  const acoustic = TUNER_INSTRUMENTS.find(g => g.id === 'acoustic');
  assert.deepEqual(acoustic.presets, electric.presets);
  for (const group of TUNER_INSTRUMENTS.filter(g => g.id !== 'drums')) {
    const patterns = new Set(group.presets.filter(p => !p.id.startsWith('adapted-')).map(p => p.strings.map(s => s.midi).join(',')));
    for (const preset of group.presets.filter(p => p.id.startsWith('adapted-'))) {
      const pattern = preset.strings.map(s => s.midi).join(',');
      assert.equal(patterns.has(pattern), false, `${group.id}: duplicate adapted pitches`);
      patterns.add(pattern);
      assert.match(preset.name, /adapted/);
      assert.ok(preset.strings.every(s => s.midi >= 21 && s.midi <= 96));
    }
    for (let count = 1; count <= 12; count++) {
      assert.ok(group.presets.filter(p => p.strings.length === count).length >= 25, `${group.id}/${count}: insufficient coverage`);
    }
  }
});
