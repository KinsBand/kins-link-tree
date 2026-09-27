/* KINS Metronome — musical position clock.

   Pure, allocation-free beat/bar arithmetic shared by both click paths:
   the AudioWorklet (public/worklets/click-worklet.js carries a verbatim
   copy between the METRO-CLOCK markers — worklet modules are served
   unbundled, so they cannot import from src/) and the legacy main-thread
   scheduler (audioEngine.js imports this module). tests/metronome
   asserts both copies are identical.

   Position is tracked explicitly as (bar, beat, sub) for the NEXT click
   instead of being derived from a running click counter, so changes made
   while playing never corrupt the grid:
     - tempo:       phase-preserving; the time left until the next click is
                    rescaled, so the change is felt immediately.
     - subdivision: applied at the next beat boundary.
     - meter:       applied at the next bar boundary — or immediately while
                    the bar has not yet passed beat 1, so a change made on a
                    downbeat (setlist sections) re-reads that bar.
     - tiers:       immediate, unless a meter change is pending, in which
                    case they travel with it. */

/* METRO-CLOCK:BEGIN */
class MetroClock {
  constructor() {
    this.event = { time: 0, bar: 0, beatInBar: 0, sub: 0, isBeatStart: true, tier: 'mid', isAccent: false, n: 0 };
    this.reset(0, {});
  }

  reset(time, cfg) {
    const c = cfg || {};
    this.bpm = MetroClock.validBpm(c.bpm) ? c.bpm : 120;
    this.perBeat = MetroClock.validCount(c.perBeat) ? Math.round(c.perBeat) : 1;
    this.beatsPerBar = MetroClock.validCount(c.beatsPerBar) ? Math.round(c.beatsPerBar) : 4;
    this.tiers = Array.isArray(c.tiers) ? c.tiers.slice() : [];
    this.bar = 0;
    this.beat = 0;
    this.sub = 0;
    this.nextTime = time;
    this.lastTime = -Infinity;
    this.count = 0;
    this.pendingPerBeat = 0;
    this.pendingBeatsPerBar = 0;
    this.pendingTiers = null;
  }

  static validBpm(v) { return typeof v === 'number' && v > 0 && v < 2000; }
  static validCount(v) { return typeof v === 'number' && v >= 1 && v <= 64; }

  interval() { return 60 / this.bpm / this.perBeat; }

  /* Emit the click at nextTime and advance. Returns a reused object:
     copy fields out before calling next() again. */
  next() {
    const e = this.event;
    const tier = this.tiers[this.beat] || 'mid';
    e.time = this.nextTime;
    e.bar = this.bar;
    e.beatInBar = this.beat;
    e.sub = this.sub;
    e.isBeatStart = this.sub === 0;
    e.tier = tier;
    e.isAccent = e.isBeatStart && tier === 'high';
    e.n = ++this.count;
    this.lastTime = this.nextTime;
    this.nextTime += this.interval();
    this.sub++;
    if (this.sub >= this.perBeat) {
      this.sub = 0;
      if (this.pendingPerBeat) { this.perBeat = this.pendingPerBeat; this.pendingPerBeat = 0; }
      this.beat++;
      if (this.beat >= this.beatsPerBar) {
        this.beat = 0;
        this.bar++;
        this.applyPendingMeter();
      }
    }
    return e;
  }

  setBpm(bpm, now) {
    if (!MetroClock.validBpm(bpm) || bpm === this.bpm) return;
    /* Anchor on the last emitted click when it is still in the future
       (already committed to the output) so the rescale is exact. */
    const anchor = Math.max(now, this.lastTime);
    if (this.nextTime > anchor) this.nextTime = anchor + (this.nextTime - anchor) * (this.bpm / bpm);
    this.bpm = bpm;
  }

  setPerBeat(value) {
    if (!MetroClock.validCount(value)) return;
    const n = Math.round(value);
    if (n === (this.pendingPerBeat || this.perBeat)) return;
    if (n === this.perBeat) { this.pendingPerBeat = 0; return; }
    if (this.sub === 0) { this.perBeat = n; this.pendingPerBeat = 0; }
    else this.pendingPerBeat = n;
  }

  setMeter(value) {
    if (!MetroClock.validCount(value)) return;
    const n = Math.round(value);
    if (n === (this.pendingBeatsPerBar || this.beatsPerBar)) return;
    if (n === this.beatsPerBar) {
      this.pendingBeatsPerBar = 0;
      if (this.pendingTiers) { this.tiers = this.pendingTiers; this.pendingTiers = null; }
      return;
    }
    this.pendingBeatsPerBar = n;
    if (this.beat === 0 || (this.beat === 1 && this.sub === 0)) {
      this.applyPendingMeter();
      if (this.beat >= this.beatsPerBar) { this.beat = 0; this.bar++; }
    }
  }

  setTiers(tiers) {
    if (!Array.isArray(tiers)) return;
    if (this.pendingBeatsPerBar) this.pendingTiers = tiers.slice();
    else this.tiers = tiers.slice();
  }

  applyPendingMeter() {
    if (this.pendingBeatsPerBar) { this.beatsPerBar = this.pendingBeatsPerBar; this.pendingBeatsPerBar = 0; }
    if (this.pendingTiers) { this.tiers = this.pendingTiers; this.pendingTiers = null; }
  }

  /* Phase-preserving catch-up after a stall: advance whole clicks until
     nextTime >= time, jumping whole bars in bulk after a long gap. */
  skipTo(time) {
    let steps = 0;
    while (this.nextTime < time) {
      if (++steps > 256 && this.beat === 0 && this.sub === 0 && !this.pendingPerBeat) {
        const barSec = this.beatsPerBar * 60 / this.bpm;
        const bars = Math.floor((time - this.nextTime) / barSec);
        if (bars > 0) { this.nextTime += bars * barSec; this.bar += bars; this.count += bars * this.beatsPerBar * this.perBeat; }
        steps = 0;
        if (this.nextTime >= time) break;
      }
      this.next();
    }
  }

  snapshot() {
    return {
      bpm: this.bpm, perBeat: this.perBeat, beatsPerBar: this.beatsPerBar, tiers: this.tiers,
      bar: this.bar, beat: this.beat, sub: this.sub, nextTime: this.nextTime, lastTime: this.lastTime,
      count: this.count, pendingPerBeat: this.pendingPerBeat, pendingBeatsPerBar: this.pendingBeatsPerBar,
      pendingTiers: this.pendingTiers
    };
  }

  restore(s) {
    this.bpm = s.bpm; this.perBeat = s.perBeat; this.beatsPerBar = s.beatsPerBar; this.tiers = s.tiers;
    this.bar = s.bar; this.beat = s.beat; this.sub = s.sub; this.nextTime = s.nextTime; this.lastTime = s.lastTime;
    this.count = s.count; this.pendingPerBeat = s.pendingPerBeat; this.pendingBeatsPerBar = s.pendingBeatsPerBar;
    this.pendingTiers = s.pendingTiers;
  }
}
/* METRO-CLOCK:END */

export { MetroClock };
