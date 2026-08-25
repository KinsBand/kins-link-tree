import { TUNER_COPY } from '../../../settings/tuner.config';
import { showToast } from '../toast.js';
import { isAvgMaterial } from './tunerState.js';

const STRESS_WINDOW_MS = 60000;
const DEAD_TOAST_GAP_MS = 8000;

export function createSafetyMonitor() {
  let lastZone = null;
  let wrongOctaveLatched = false;
  let stressTimes = [];
  let stressWarned = false;
  let deadWarnedAt = 0;

  function reset() {
    lastZone = null;
    wrongOctaveLatched = false;
    stressTimes = [];
    stressWarned = false;
    deadWarnedAt = 0;
  }

  function zoneFor(offsetCents, profile) {
    if (offsetCents >= profile.dangerUp * 100) return 'danger';
    if (offsetCents >= profile.warnUp * 100) return 'warn-up';
    if (offsetCents <= profile.deadDown * 100) return 'dead';
    if (offsetCents <= profile.warnDown * 100) return 'warn-down';
    return 'safe';
  }

  function update(offsetCents, rawCents, profile, nowMs) {
    if (!profile) {
      lastZone = null;
      return { zone: null, color: null };
    }

    if (Math.abs(rawCents) > 600) {
      if (!wrongOctaveLatched) {
        wrongOctaveLatched = true;
        showToast(TUNER_COPY.wrongOctave, 'warning');
      }
      lastZone = 'wrong-octave';
      return { zone: 'wrong-octave', color: 'grey' };
    }
    wrongOctaveLatched = false;

    const zone = zoneFor(offsetCents, profile);

    if (zone === 'danger') {
      stressTimes.push(nowMs);
      stressTimes = stressTimes.filter((t) => nowMs - t < STRESS_WINDOW_MS);
      if (stressTimes.length >= 2 && !stressWarned) {
        stressWarned = true;
        showToast(TUNER_COPY.stress, 'warning');
      }
      if (lastZone !== 'danger') {
        showToast(isAvgMaterial() ? TUNER_COPY.breakageAvg : TUNER_COPY.breakageKnown, 'warning');
      }
    } else if (zone === 'dead') {
      if (lastZone !== 'dead' && nowMs - deadWarnedAt > DEAD_TOAST_GAP_MS) {
        deadWarnedAt = nowMs;
        showToast(TUNER_COPY.deadLoose, 'info');
      }
    } else if (zone === 'safe') {
      stressWarned = false;
    }

    lastZone = zone;
    const color =
      zone === 'danger' ? 'red' :
      zone === 'warn-up' ? 'red-soft' :
      zone === 'warn-down' ? 'green-soft' :
      zone === 'dead' ? 'green' : 'grey';
    return { zone, color };
  }

  return { update, reset };
}
