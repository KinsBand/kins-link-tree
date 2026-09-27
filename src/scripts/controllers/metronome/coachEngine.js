import { COACH_PRIMER_MAELZEL, METRO_SUBDIVISIONS } from '../../../settings/metronome.config';
import { metroState, clampBpm } from './metroState.js';

let generation = 0;
let live = null;
let callbacks = null;
let barCount = 0;
let beatCount = 0;
let beatInBarCounter = 0;

function subdivIdToPerBeat(id) {
  const hit = METRO_SUBDIVISIONS.find((s) => s.id === id);
  return hit ? hit.perBeat : 1;
}

export function quantizeBpmForDifficulty(bpm, diff, minLimit = 30, maxLimit = 250) {
  bpm = Math.max(minLimit, Math.min(maxLimit, bpm));
  if (diff === 'easy') {
    return Math.round(bpm / 10) * 10;
  }
  if (diff === 'medium') {
    return Math.round(bpm / 5) * 5;
  }
  if (diff === 'hard') {
    let closest = COACH_PRIMER_MAELZEL[0];
    let minDiff = Math.abs(bpm - closest);
    for (const m of COACH_PRIMER_MAELZEL) {
      const d = Math.abs(bpm - m);
      if (d < minDiff) {
        minDiff = d;
        closest = m;
      }
    }
    return closest;
  }
  return Math.round(bpm);
}

function randomTargetForDifficulty(diff, current, minBpm = 60, maxBpm = 180) {
  const min = Math.min(minBpm, maxBpm);
  const max = Math.max(minBpm, maxBpm);

  if (diff === 'easy') {
    const candidates = [];
    const start = Math.ceil(min / 10) * 10;
    for (let b = start; b <= max; b += 10) {
      candidates.push(b);
    }
    if (candidates.length === 0) candidates.push(clampBpm(Math.round(min / 10) * 10));
    const filtered = candidates.filter((c) => c !== current);
    const pool = filtered.length > 0 ? filtered : candidates;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  if (diff === 'medium') {
    const candidates = [];
    const start = Math.ceil(min / 5) * 5;
    for (let b = start; b <= max; b += 5) {
      candidates.push(b);
    }
    if (candidates.length === 0) candidates.push(clampBpm(Math.round(min / 5) * 5));
    const filtered = candidates.filter((c) => c !== current);
    const pool = filtered.length > 0 ? filtered : candidates;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  if (diff === 'hard') {
    const candidates = COACH_PRIMER_MAELZEL.filter((m) => m >= min && m <= max);
    if (candidates.length === 0) candidates.push(quantizeBpmForDifficulty(min, 'hard'));
    const filtered = candidates.filter((c) => c !== current);
    const pool = filtered.length > 0 ? filtered : candidates;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // expert: exact 1-bpm in [min, max]
  const candidates = [];
  for (let b = min; b <= max; b++) candidates.push(b);
  if (candidates.length === 0) candidates.push(clampBpm(min));
  const filtered = candidates.filter((c) => c !== current);
  const pool = filtered.length > 0 ? filtered : candidates;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function createCoachEngine(cbs) {
  callbacks = cbs;
  return {
    start(tabId) {
      const gen = ++generation;
      if (live && live.running) stopInternal();
      live = {
        tabId,
        generation: gen,
        running: true,
        barCount: 0,
        beatCount: 0,
        phase: 'audible',
        phaseBar: 0,
        currentBpm: metroState.bpm,
        speedStepIdx: 0,
        rhythmIdx: 0,
        primerTaps: [],
        primerTarget: metroState.coachPrimer.target,
        speedSteps: 0,
        innerMuted: false
      };
      barCount = 0;
      beatCount = 0;
      beatInBarCounter = -1;
      const now = performance.now();
      live.startTime = now;
      live.lastStepTime = now;
      if (tabId === 'inner-clock') {
        live.currentBpm = metroState.bpm;
        live.phase = 'audible';
        live.phaseBar = 0;
        // The audio clock owns the phases so muted bars are click-exact;
        // this module only mirrors them from beat events.
        if (callbacks.setMuteProgram) callbacks.setMuteProgram(innerProgram());
        if (callbacks.onCoachTick) callbacks.onCoachTick(getLiveSnapshot());
      } else if (tabId === 'speed-trainer') {
        const s = metroState.coachSpeed;
        if (!s.direction || (s.direction !== 'asc' && s.direction !== 'desc')) s.direction = 'asc';
        live.currentBpm = s.start;
        live.speedSteps = Math.max(1, Math.ceil(Math.abs(s.target - s.start) / Math.max(1, s.step)));
        live.speedStepIdx = 0;
        live.dir = s.direction === 'desc' ? -1 : 1;
        live.currentBoundTarget = s.target;
        live.repeatPending = false;
        // Validate dir matches bounds: if asc but target < start, flip dir to reach target (legacy fix)
        if (live.dir === 1 && s.target < s.start) live.dir = -1;
        if (live.dir === -1 && s.target > s.start) live.dir = 1;
        if (callbacks.applyBpm) callbacks.applyBpm(live.currentBpm, false);
        if (callbacks.onCoachTick) callbacks.onCoachTick(getLiveSnapshot());
      } else if (tabId === 'rhythm-step') {
        const pat = metroState.coachRhythm.pattern;
        live.rhythmIdx = 0;
        const first = pat[0] || '1-4';
        if (callbacks.applySubdivision) callbacks.applySubdivision(first);
        if (callbacks.onCoachTick) callbacks.onCoachTick(getLiveSnapshot());
      } else if (tabId === 'tempo-primer') {
        const d = metroState.coachPrimer.difficulty;
        const minB = metroState.coachPrimer.minBpm || 60;
        const maxB = metroState.coachPrimer.maxBpm || 180;
        live.primerTarget = randomTargetForDifficulty(d, metroState.coachPrimer.target, minB, maxB);
        metroState.coachPrimer.target = live.primerTarget;
        live.primerTaps = [];
        live.primerResult = null;
        if (callbacks.applyBpm) callbacks.applyBpm(live.primerTarget, false);
        if (callbacks.onCoachTick) callbacks.onCoachTick(getLiveSnapshot());
      }
      return gen;
    },
    stop() {
      generation++;
      stopInternal();
    },
    isRunning() {
      return !!(live && live.running);
    },
    getLive() {
      return live;
    },
    getGeneration() { return generation; },
    /** Inner-clock settings changed mid-run: restart the phases on the next bar. */
    updateInnerProgram() {
      if (live && live.running && live.tabId === 'inner-clock' && callbacks.setMuteProgram) callbacks.setMuteProgram(innerProgram());
    },
    handleBeat(beatInBar, isAccent, isBeatStart, evt) {
      if (!live || !live.running) return;
      if (live.tabId === 'inner-clock' && evt && evt.mutePhase) {
        live.phase = evt.mutePhase;
        live.phaseBar = evt.mutePhaseBar;
        live.innerMuted = !!evt.muted;
      }
      const isBeat = isBeatStart !== false;
      // Only count physical beats, not subdivision clicks — otherwise bars
      // advance N× per beat when perBeat > 1 (e.g. 1/8 = 2 clicks/beat)
      // and speed-trainer 'beats' unit advances at click rate instead of beat rate.
      if (isBeat) {
        beatCount++;
        live.beatCount = beatCount;
      }

      /* A bar boundary is any wrap/restart of the beat position: 0 after
         a higher beat, equal values under 1-beat meters, or a drop after
         a mid-run time-signature change. Only evaluate on beat starts. */
      const isNewBar = isBeat && (beatInBarCounter < 0 || beatInBar <= beatInBarCounter);
      if (isBeat) beatInBarCounter = beatInBar;

      if (live.tabId === 'speed-trainer') {
        const s = metroState.coachSpeed;
        const unit = s.unit || 'bars';
        if (unit === 'beats') {
          const every = Math.max(1, s.everyBars);
          if (beatCount % every === 0) {
            advanceSpeedTrainerStep();
          }
        } else if (unit === 'seconds') {
          const now = performance.now();
          const elapsed = (now - (live.lastStepTime || now)) / 1000;
          const everySec = Math.max(1, s.everyBars);
          if (elapsed >= everySec) {
            live.lastStepTime = now;
            advanceSpeedTrainerStep();
          }
        } else {
          // unit === 'bars'
          if (isNewBar && beatInBar === 0) {
            barCount++;
            live.barCount = barCount;
            const every = Math.max(1, s.everyBars);
            if (barCount % every === 0) {
              advanceSpeedTrainerStep();
            }
          }
        }
      } else {
        if (isNewBar && beatInBar === 0) {
          barCount++;
          live.barCount = barCount;
          handleBarBoundary();
        }
      }

      if (callbacks.onCoachTick) callbacks.onCoachTick(getLiveSnapshot());
    },
    handlePrimerTap(tapTime) {
      if (!live || !live.running || live.tabId !== 'tempo-primer') return;
      const now = tapTime || performance.now();
      if (live.primerResult) {
        const d = metroState.coachPrimer.difficulty;
        const minB = metroState.coachPrimer.minBpm || 60;
        const maxB = metroState.coachPrimer.maxBpm || 180;
        live.primerTarget = randomTargetForDifficulty(d, live.primerTarget, minB, maxB);
        metroState.coachPrimer.target = live.primerTarget;
        live.primerTaps = [];
        live.primerResult = null;
        if (callbacks.applyBpm) callbacks.applyBpm(live.primerTarget, false);
      }
      live.primerTaps.push(now);
      if (live.primerTaps.length > 4) live.primerTaps.shift();
      if (live.primerTaps.length === 4) {
        const intervals = [];
        for (let i = 1; i < 4; i++) intervals.push(live.primerTaps[i] - live.primerTaps[i - 1]);
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const recalled = clampBpm(60000 / avg);
        const target = live.primerTarget;
        const delta = recalled - target;
        const absPct = Math.abs(delta) / Math.max(1, target);
        let grade = 'TRY AGAIN';
        if (Math.abs(delta) <= 1) grade = 'PERFECT';
        else if (absPct <= 0.02) grade = 'GREAT';
        else if (absPct <= 0.04) grade = 'GOOD';
        else if (absPct <= 0.07) grade = 'CLOSE';
        live.primerResult = { recalled, delta, pct: absPct, grade, intervals };
        if (callbacks.onCoachTick) callbacks.onCoachTick(getLiveSnapshot());
        return live.primerResult;
      }
      if (callbacks.onCoachTick) callbacks.onCoachTick(getLiveSnapshot());
      return null;
    },
    primerRetry() {
      if (!live) return;
      const hadResult = !!live.primerResult;
      const hadTaps = live.primerTaps && live.primerTaps.length > 0;
      live.primerTaps = [];
      live.primerResult = null;
      if (hadResult || !hadTaps) {
        const d = metroState.coachPrimer.difficulty;
        const minB = metroState.coachPrimer.minBpm || 60;
        const maxB = metroState.coachPrimer.maxBpm || 180;
        live.primerTarget = randomTargetForDifficulty(d, live.primerTarget, minB, maxB);
        metroState.coachPrimer.target = live.primerTarget;
        if (callbacks.applyBpm) callbacks.applyBpm(live.primerTarget, false);
      }
      if (callbacks.onCoachTick) callbacks.onCoachTick(getLiveSnapshot());
    },
    primerNewTarget() {
      if (!live) return;
      const d = metroState.coachPrimer.difficulty;
      const minB = metroState.coachPrimer.minBpm || 60;
      const maxB = metroState.coachPrimer.maxBpm || 180;
      const nt = randomTargetForDifficulty(d, live.primerTarget, minB, maxB);
      live.primerTarget = nt;
      metroState.coachPrimer.target = nt;
      live.primerTaps = [];
      live.primerResult = null;
      if (callbacks.applyBpm) callbacks.applyBpm(nt, false);
      if (callbacks.onCoachTick) callbacks.onCoachTick(getLiveSnapshot());
      return nt;
    }
  };
}

function innerProgram() {
  const cfg = metroState.coachInner;
  return { audible: cfg.audibleBars, muted: cfg.mutedBars, random: !!cfg.random };
}

function stopInternal() {
  if (live && live.running && live.tabId === 'inner-clock' && callbacks.setMuteProgram) callbacks.setMuteProgram(null);
  if (live) live.running = false;
}

function advanceSpeedTrainerStep() {
  if (!live || !live.running) return;
  const s = metroState.coachSpeed;
  // Ensure direction field exists
  if (!s.direction || (s.direction !== 'asc' && s.direction !== 'desc')) s.direction = 'asc';
  // Use live.dir which reflects current traversal direction (may have flipped for ping-pong)
  let dir = typeof live.dir === 'number' ? live.dir : (s.direction === 'desc' ? -1 : 1);
  // Sync dir with configured direction if live.dir not yet flipped and bounds suggest opposite
  // (initial dir already validated at start)
  const step = Math.max(1, s.step) * dir;
  const boundTarget = live.currentBoundTarget != null ? live.currentBoundTarget : s.target;
  let next = live.currentBpm + step;
  const reached = dir > 0 ? next >= boundTarget : next <= boundTarget;
  if (reached) {
    next = boundTarget;
    // Update step index to reflect edge
    if (dir > 0) live.speedStepIdx = live.speedSteps;
    else live.speedStepIdx = 0;
    live.currentBpm = next;
    if (callbacks.applyBpm) callbacks.applyBpm(next, false);
    if (s.repeat) {
      // Ping-pong: reverse direction and swap bound target for next leg
      // Same step size is used for the descent (spec: "same count up but in the count down")
      live.dir = dir * -1;
      // Toggle bound between start and target
      live.currentBoundTarget = boundTarget === s.target ? s.start : s.target;
      live.lastStepTime = performance.now();
      // Reset step index for next leg (so progress reflects position within range)
      if (live.dir > 0) live.speedStepIdx = 0;
      else live.speedStepIdx = live.speedSteps;
      // Do not return early — keep at bound this tick, next tick will move away
    } else {
      // No repeat: stay at bound, keep dir unchanged (future ticks will keep clamping)
      live.dir = dir;
    }
  } else {
    live.currentBpm = next;
    // Update step index proportionally: count steps from start
    const travelled = Math.abs(next - s.start);
    const total = Math.max(1, Math.abs(s.target - s.start));
    const approxIdx = Math.round((travelled / total) * live.speedSteps);
    live.speedStepIdx = Math.min(live.speedSteps, Math.max(0, approxIdx));
    // Keep dir and bound unchanged
    live.dir = dir;
    if (callbacks.applyBpm) callbacks.applyBpm(next, false);
  }
}

function handleBarBoundary() {
  if (!live || !live.running) return;
  if (live.tabId === 'inner-clock') {
    // Phases come from the audio clock via handleBeat(evt).
    return;
  } else if (live.tabId === 'rhythm-step') {
    const cfg = metroState.coachRhythm;
    const every = Math.max(1, cfg.everyBars);
    if (barCount % every !== 0) return;
    live.rhythmIdx = (live.rhythmIdx + 1) % cfg.pattern.length;
    const id = cfg.pattern[live.rhythmIdx];
    if (callbacks.applySubdivision) callbacks.applySubdivision(id);
  }
}

function getLiveSnapshot() {
  if (!live) return null;
  return {
    tabId: live.tabId,
    barCount,
    phase: live.phase,
    phaseBar: live.phaseBar,
    currentBpm: live.currentBpm,
    speedStepIdx: live.speedStepIdx,
    speedSteps: live.speedSteps,
    rhythmIdx: live.rhythmIdx,
    primerTarget: live.primerTarget,
    primerTaps: live.primerTaps ? live.primerTaps.slice() : [],
    primerResult: live.primerResult || null,
    generation: live.generation
  };
}

export function getGeneration() { return generation; }
