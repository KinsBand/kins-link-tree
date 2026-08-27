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

function randomTargetForDifficulty(diff, current) {
  if (diff === 'easy') {
    const v = 40 + Math.floor(Math.random() * 17) * 10;
    return clampBpm(v);
  }
  if (diff === 'medium') {
    const v = 40 + Math.floor(Math.random() * 33) * 5;
    return clampBpm(v);
  }
  if (diff === 'hard') {
    return COACH_PRIMER_MAELZEL[Math.floor(Math.random() * COACH_PRIMER_MAELZEL.length)];
  }
  // expert 40-208 1-bpm
  return clampBpm(40 + Math.floor(Math.random() * 169));
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
        // generate target if not set? keep existing unless zero
        if (!live.primerTarget || live.primerTarget < 40) live.primerTarget = randomTargetForDifficulty(d);
        live.primerTaps = [];
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
    handleBeat(beatInBar, isAccent, isBeatStart) {
      if (!live || !live.running) return;
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
      live.primerTaps = [];
      live.primerResult = null;
      if (callbacks.onCoachTick) callbacks.onCoachTick(getLiveSnapshot());
    },
    primerNewTarget() {
      if (!live) return;
      const d = metroState.coachPrimer.difficulty;
      let nt = randomTargetForDifficulty(d, live.primerTarget);
      let tries = 0;
      while (nt === live.primerTarget && tries < 10) { nt = randomTargetForDifficulty(d, live.primerTarget); tries++; }
      live.primerTarget = nt;
      live.primerTaps = [];
      live.primerResult = null;
      if (callbacks.onCoachTick) callbacks.onCoachTick(getLiveSnapshot());
      return nt;
    }
  };
}

function stopInternal() {
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
    const cfg = metroState.coachInner;
    let audible = cfg.audibleBars;
    let muted = cfg.mutedBars;
    if (cfg.random) {
      const jitter = Math.floor(Math.random() * 3) - 1; // -1,0,1
      if (live.phase === 'audible') {
        const nm = Math.min(8, Math.max(1, muted + jitter));
        live.nextMuted = nm;
      } else {
        const na = Math.min(8, Math.max(1, audible + jitter));
        live.nextAudible = na;
      }
      audible = live.nextAudible || audible;
      muted = live.nextMuted || muted;
    }
    live.phaseBar++;
    if (live.phase === 'audible' && live.phaseBar >= audible) {
      live.phase = 'muted';
      live.phaseBar = 0;
      if (callbacks.setMuted) callbacks.setMuted(true);
    } else if (live.phase === 'muted' && live.phaseBar >= muted) {
      live.phase = 'audible';
      live.phaseBar = 0;
      if (callbacks.setMuted) callbacks.setMuted(false);
    }
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
