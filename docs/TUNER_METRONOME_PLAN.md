# Tuner & Metronome — World-Class Reliability Plan

Status: **In progress** · Scope: `/tuner`, `/metronome` · Date: 2026-09-27

## Progress

| Plan item | State | Evidence |
| --- | --- | --- |
| 0.1 Metronome offline test harness | ✅ Done | `npm run test:metronome` (18 tests: worklet PCM render, clock, legacy engine) |
| 0.2 Tuner realistic corpus | ✅ Done | `tests/tuner/realistic.test.mjs`, `stream.test.mjs` |
| 1.1 No grid re-seat on tab return / resume (M1) | ✅ Done | suspension-gap test: grid and bar phase kept |
| 1.2 Position model, phase-preserving tempo (M2) | ✅ Done | `metroClock.js`; no double downbeat, beats stay on grid |
| 1.5 Zero-alloc worklet (M6, M7) | ✅ Done | prewarmed buffers, voice pool with stealing, one message per click |
| 1.6 Resume inside the play gesture (M8) | ✅ Done (verify on iOS device) | |
| 1.7 Dead paths removed (M9) | ✅ Done | `metronome-processor`, sample-rate check, forced 48 kHz, speech count |
| 2.1 Worklet → Worker direct stream (T2) | ✅ Done | `analysisStream.js`, protocol v3 |
| 2.2 Pre-conditioning + hum notch (T1) | ✅ Done | band-limit per window; streaming 50/60 Hz notch comb |
| 2.3/2.4 Robust dip search + weak fallback (T1) | ✅ Partial | full-dip search, continuity-gated fallback; FFT core still open |
| 3.1 Chromatic: no blanking, visible cents (T3, T4) | ✅ Done | ±60 ct note hysteresis; cents in the pitch pill; throttled SR announcements |
| 3.2 Confirmation hysteresis, tolerance options (T5, T9) | ✅ Done | 0.5/1/2/3/5 ct |
| 1.3 Bar program in worklet — coach muted bars | ✅ Done | mute program in `MetroClock`; bar-exact silence test |
| 1.3 Bar program — speed-trainer steps, setlist sections, count-in | ⏳ Next | still applied from the visual beat |
| Free mode stage (dial, pitch trace, nearest string) | ✅ Done | `TunerFreeStage.astro`, `freeStage.js` |
| Ear-training tension marker | ✅ Done | `tensionPosition()` |
| 1.4 Output-latency compensation + calibration | ⏳ | |
| 1.8 Tap tempo, 3.3 needle spring, 3.6 safety monitor, 3.7 reference context | ⏳ | |
| 2.5–2.7 Precision stage, inharmonicity, attack gating; 3.4 strobe | ⏳ | |

Measured after the detector work (accepted frames, before → after): E2 white
noise 10 dB 8% → 92%, A4 10 dB 15% → 100%, A2 6 dB 0% → 79%; E2 20 dB p95
error 39 → 2.6 ct; note under −20 dB mains hum 30/30 frames within 3 ct.
Clean benchmark p95 0.046 ct.

Known unrelated failure: `e2e/tuner/strum.spec.ts` ("strum on the audio
clock…") fails on the pre-change code too.

The architecture is already good. The metronome renders its clicks on the audio
thread (AudioWorklet), and the tuner captures audio in a worklet and runs YIN
pitch detection in a Worker. The problems are in how the pieces work together at
the edges: noisy rooms, tab switches, tempo, subdivision and time-signature
changes, coach and setlist automation, Bluetooth latency, and a few UI gaps.
This plan fixes those areas, proves each fix with tests, and then adds the
features that separate a pro tuner from a good one: strobe mode, sub-cent
precision and handling of string inharmonicity.

---

## 1. Evidence — what was measured

### 1.1 Tuner stress test (realistic signals, 48 kHz, 80 frames each)

The unit suite passes all 35 tests, but it only uses clean synthetic tones. A
scratch harness fed `createPitchDetector()` plucked-string signals instead: a
decaying harmonic series, phone-mic bass roll-off, inharmonicity and white noise.

| Scenario | Locked OK | Dropouts | p95 error |
| --- | --- | --- | --- |
| Low E2, clean | 76/76 | 0 | 0.20 ct |
| Low E2, phone mic (fundamental −20 dB) | 65/76 | **11** | 0.08 ct |
| Bass E1, phone mic (1st + 2nd partial weak) | 54/76 | **22** | 0.29 ct |
| Bass B0, phone mic | 52/76 | **24** | 0.44 ct |
| Bass E1, inharmonic (B = 4e-4) | 74/76 | 2 | **3.05 ct** |
| A4 with noise, SNR ≈ 10 dB | **5/76** | **71** | 3.03 ct |
| E2 with noise, SNR ≈ 6 dB | **0/76** | **76** | n/a |

No test produced an octave error, so octave safety is already solid. The real
weaknesses:

- **Noise.** The tuner stops reading in a normal rehearsal room: amp hiss, fans,
  other players.
- **Weak fundamentals.** Phone mics roll off the bass fundamental, so low
  strings drop 15–30% of frames.
- **Inharmonicity bias.** On low bass strings the reading is off by about 3 ct.
  That equals the default ±3 ct confirmation tolerance, so the "TUNED" progress
  keeps resetting.

### 1.2 Metronome worklet simulation (`kins-click` run offline in Node `vm`)

| Test | Result | Severity |
| --- | --- | --- |
| Return to tab (or audio resume) mid-bar → `engine.sync()` | Beat 4 is skipped. The next click comes **201 ms early**, off the grid, and the **bar restarts at beat 1**. | 🔴 Audible hiccup every tab switch |
| Time signature 4/4 → 3/4 right after a downbeat (the setlist section change path) | **Two accented downbeats in a row** (`4.08:1!` then `4.58:1!`) | 🔴 Wrong accent |
| Subdivision eighths → triplets mid-beat | Beat 4 lands **80 ms early**. Beat position comes from `clickCounter % perBeat`. | 🔴 Timing error |
| Tempo 40 → 200 BPM | The new tempo starts only after the old 1.5 s interval ends | 🟠 Sluggish |

### 1.3 Code review findings

**Metronome**

| # | Finding | Location |
| --- | --- | --- |
| M1 | `sync()` sends `sync` and `RESET_PHASE` to the worklet. The worklet clock never stops, so this re-seat is unnecessary and breaks the beat grid. Called from `visibilitychange` and `onAudioInterruption('resumed')`. | `audioEngine.js:980-985`, `index.js:152,847` |
| M2 | Beat and bar position are derived from `clickCounter % perBeat` and `beatCounter % beatsPerBar`. Any mid-bar change to subdivision or meter corrupts the phase. The legacy path has the same flaw. | `click-worklet.js:330-366`, `audioEngine.js` `schedulerTick` |
| M3 | Coach "muted bars" call `setVolume(0)` from the **visual** rAF drain. `setTargetAtTime` has τ = 15 ms, so the first click of a muted bar still plays almost at full volume, and the first click after the mute is too quiet. | `index.js:747`, `audioEngine.js` `setVolume` |
| M4 | Coach speed steps, count-in and setlist section changes are all applied from the visual drain after the downbeat has already been scheduled. They take effect one beat late, and meter changes cause M2. | `index.js:60-110, 508, 722` |
| M5 | No output-latency compensation. Visual flashes and haptics use raw `ctx.currentTime` and ignore `outputLatency`. On Bluetooth (150–300 ms) the flash comes well **before** the sound. | `audioEngine.js:664` (`drainVisualQueue`) |
| M6 | `getBuffer()` builds click PCM **on the audio thread** the first time each sound/tier/accent combination is used. That is allocation plus trig inside `process()`, which risks a glitch when you change sound while playing. | `click-worklet.js:339` |
| M7 | Two `postMessage` calls per click (`beat` + unused `TICK_EVENT`). Each one allocates on the audio thread. | `click-worklet.js:358` |
| M8 | On the first run, `start()` awaits `addModule()` before `ctx.resume()`. The user-gesture activation can expire first (strict iOS Safari), so the first tap may fail with `audio-blocked`. Needs verification on a real device. | `audioEngine.js:690` |
| M9 | Dead or misleading code: `handleHardwareAdaptation` compares `ctx.sampleRate` with itself, but a context's rate can never change. `metronome-processor` is a second engine that is never used. `speakVoiceCount` is unreachable because `voice-count` is not in `METRO_SOUNDS`. `sampleRate: 48000` is forced, making 44.1 kHz devices resample. | `audioEngine.js:246, 302, 328`, `click-worklet.js:437+` |
| M10 | Tap tempo uses `performance.now()` at handler time instead of `event.timeStamp`, and a plain mean with no outlier rejection. Jittery input gives jittery BPM. | `index.js:300` |

**Tuner**

| # | Finding | Location |
| --- | --- | --- |
| T1 | Poor noise robustness (§1.1). There is no pre-filtering (no HPF, hum notch or band-limit), a fixed RMS gate, and a hard `CONF_LOCK = 0.82` cut-off. | `pitchDetector.js`, `tuner.config.ts` `DETECT` |
| T2 | Audio chunks travel worklet → **main thread** → Worker. The worklet pool is only 4 × 512 samples (about 43 ms). A main-thread stall longer than that drops chunks. The frame gap then triggers `clearSamples()`, and detection re-acquires from scratch. | `tuner-worklet.js:7`, `audioEngine.js:72` |
| T3 | Chromatic mode blanks near note boundaries. When the rounded MIDI note differs from the stabilised one, the reading is held instead of shown relative to the stable note. | `tuner/index.js:64` |
| T4 | The numeric cents readout (`#tunerCentsReadout`) is `hidden` and `sr-only`, so **no one** sees it, including screen-reader users. Chromatic mode also pins the needle at 0. | `tuner.astro:92`, `uiBindings.js:1463, 1578` |
| T5 | Confirmation uses **raw** cents against a hard ±3 ct band with no exit hysteresis. With 1–3 ct jitter (inharmonic bass, noise) the TUNED progress keeps resetting. | `tuner/index.js:71` |
| T6 | The needle moves only when a Worker result arrives (about every 25 ms, uneven). There is no rAF interpolation, so motion is steppy. | `uiBindings.js` `setNeedle` |
| T7 | `safetyMonitor.js` (snap-risk and over-tightening detection) is **not imported anywhere**. The feature is dead. | `tuner/safetyMonitor.js` |
| T8 | The reference tone creates a **new AudioContext for every tap**. That adds latency, and browsers cap live contexts at about 6. | `referenceTone.js:118` |
| T9 | Changing tolerance calls `onA4Select`, a hack that resets the whole pipeline. Only ±1 and ±3 ct are offered. | `uiBindings.js:1630` |
| T10 | The YIN difference function is O(N²) (about 3.4 M multiply-adds per frame at 26 Hz). That caps window length for bass and hop rate on low-end phones. | `pitchDetector.js:56-71` |

---

## 2. Targets (definition of "world class")

| Metric | Target | Today |
| --- | --- | --- |
| Tuner accuracy, clean signal | ≤ 0.1 ct p95 | 0.2 ct ✅ close |
| Tuner accuracy, inharmonic bass | ≤ 0.5 ct p95 of the true fundamental | 3.05 ct ❌ |
| Frame dropout at 10 dB SNR | ≤ 5% | 93% ❌ |
| Frame dropout, phone-mic bass | ≤ 5% | 15–32% ❌ |
| Time to first stable reading (guitar / bass) | ≤ 150 ms / ≤ 300 ms after the pluck | ~100 ms+ / unstable |
| Octave errors | 0 | 0 ✅ keep |
| Chromatic readout blanking at note edges | never | yes ❌ |
| Needle animation | 60 fps, smooth, reduced-motion aware | ~40 Hz stepped |
| Metronome click timing | sample-exact, 0 dropped clicks under main-thread stalls | ✅ (worklet) |
| Grid continuity across tab switch / resume | 0 phase error | 201 ms error ❌ |
| Subdivision / meter / tempo changes | land on the next beat or bar boundary, grid intact | corrupted ❌ |
| Coach mute bars | sample-exact silence for whole bars | leaky ❌ |
| Visual/haptic vs audible (incl. Bluetooth) | ±10 ms after calibration | −150 to −300 ms on BT ❌ |
| First tap produces sound (iOS/Android/desktop) | 100% | unverified on iOS |

---

## 3. The plan

Work is ordered by user-visible impact per unit of effort. Each phase ships on
its own with tests.

### Phase 0 — Measurement first (makes every later claim provable)

1. **`tests/metronome/worklet.test.mjs`**: formalise the offline `vm` harness
   used for §1.2. Render the worklet to PCM and assert click onsets to the
   sample, accent positions, and grid continuity across `sync`, tempo,
   subdivision and meter changes, stop/start, and a sound change mid-play.
   Add `npm run test:metronome`.
2. **`tests/tuner/realistic.test.mjs` + `benchmark.mjs` upgrade**: a signal
   corpus generator covering plucked strings with decay, inharmonicity B,
   phone-mic roll-off, pink/white noise at 20/10/6 dB, 50/60 Hz hum and
   harmonics, attack transients, and vibrato. Report dropout %, p95 cents and
   ms/frame. Start with lenient thresholds and tighten them as each phase lands.
3. **Recorded corpus** (optional, high value): 30–60 short WAVs (guitar, bass,
   acoustic; phone and interface; quiet and noisy rooms) in `tests/fixtures/audio/`.
   Play them through Chromium's `--use-file-for-fake-audio-capture` in
   Playwright to test the whole pipeline end to end.
4. **Debug overlays**: extend `?metrodebug=1` with output latency, worklet
   click count vs heard, and phase error. Add `?tunerdebug=1` with confidence,
   noise floor, analysis ms, dropped chunks and window size.

### Phase 1 — Metronome: never stutter, never lose the grid (highest priority)

1. **Remove the grid-breaking re-sync (M1).** On the worklet path `sync()`
   becomes a no-op apart from pruning stale visual events. Delete
   `RESET_PHASE` from `sync()`. Only the legacy scheduler keeps its
   phase-preserving catch-up, which already exists.
2. **Musical position model (M2).** Replace `clickCounter % perBeat` with
   explicit `bar`, `beat` and `sub` counters, and put the logic in one pure
   module, `metroClock.js`. The worklet (which can `import` ES modules via
   `addModule`) and the legacy scheduler both use it, and Node unit-tests it.
   Change semantics:
   - **Tempo**: phase-preserving. The remaining time to the next click is
     scaled by `oldBpm/newBpm`, so a change is felt immediately without a
     phase jump.
   - **Subdivision**: applied at the next **beat** boundary.
   - **Meter / tiers**: applied at the next **bar** boundary, with an optional
     "apply now → restart at beat 1 on the next click" for manual edits while
     stopped.
3. **Bar program in the worklet (M3, M4).** The main thread sends a
   declarative program: count-in bars, per-bar mute flags (coach gap
   training), a speed-trainer BPM schedule, and setlist sections with bar
   counts, meter and tempo. The worklet applies it **exactly at bar
   boundaries** and emits `bar` events. Mutes silence whole bars to the
   sample, with no volume ramps. The main thread only renders UI, and
   `setCoachMuted`/`applyCoachBpm` stop driving audio.
4. **Output-latency compensation (M5).** Visual beat time =
   `evt.time + (ctx.outputLatency || ctx.baseLatency || 0)`, mapped through
   `ctx.getOutputTimestamp()` where it is available. Add a **latency
   calibration** screen: tap along to 8 clicks, take the median offset, and
   store it per output device. Use the same offset for haptics.
5. **Zero allocation on the audio thread (M6, M7).** Render all click PCM for
   every sound × tier × accent combination on the main thread (or once at
   `sounds` time), then transfer the buffers. Remove `TICK_EVENT`. Send one
   compact `beat` message per click, or batch them. When the pool of 16 is
   full, steal the oldest voice with a short fade instead of dropping the
   click.
6. **Reliable first tap (M8).** In the play-button handler, create the
   context and call `ctx.resume()` **synchronously**, before any `await`.
   Preload the worklet module during idle time after page load so the first
   `start()` rarely waits.
7. **Clean up dead paths (M9).** Remove `metronome-processor`, the
   impossible sample-rate check and the forced `sampleRate: 48000`. For
   voice count, either delete the Speech Synthesis code or implement it
   properly: pre-recorded "1-2-3-4" samples scheduled by the worklet.
   Speech Synthesis latency varies by 100–500 ms and can never be in time.
8. **Tap tempo (M10).** Use `event.timeStamp` and the median of the last 4–6
   intervals, reject outliers beyond ±25%, reset automatically after a pause,
   and optionally re-phase the grid so beat 1 lands on the last tap.
9. **Stop and volume.** Let the worklet do the de-click (it already has a
   3 ms release). Remove the master-gain `setTimeout` restore dance and set
   volume only through one smoothed AudioParam.
10. **Background play.** Check the silent `<audio>` keep-alive on iOS 17/18.
    Move the direct `localStorage` read to `safeStorage` (AGENTS.md audit 4).

### Phase 2 — Tuner: signal chain & detection

1. **Take the main thread out of the audio path (T2).** Pass a
   `MessagePort` from the Worker to the worklet, or use a
   SharedArrayBuffer ring where COOP/COEP allow it, so PCM goes straight
   from the worklet to the Worker. The main thread receives only results.
   Also increase the pool to about 250 ms of headroom.
2. **Pre-conditioning.** DC blocker, a 20 Hz high-pass, and an adaptive
   50/60 Hz hum notch (detected automatically, with 2–3 harmonics). In
   guided mode, add a **target-aware band-pass** around the selected
   string's fundamental and first partials. This single change fixes most of
   the noise failures.
3. **Faster core, longer windows (T10).** Compute the YIN/NSDF difference
   function with an FFT (O(N log N)). The CPU budget freed up pays for:
   - **Register-adaptive windows**: about 250 ms for ≤ 60 Hz (bass B0/E1)
     and 40–60 ms for treble strings, chosen from the guided target or from
     a coarse first pass in chromatic mode.
   - **Hybrid detection with voting**: YIN (CMNDF) combined with a McLeod
     NSDF peak pick, plus a harmonic-sum check. A result is accepted when
     they agree, which lets confidence thresholds be relaxed safely.
4. **Adaptive gate and confidence (T1).** Track the noise floor with a slow
   minimum-statistics estimator. Set the wake and release thresholds relative
   to that floor instead of fixed RMS. Replace the hard `CONF_LOCK` cut with
   a continuous confidence score. Low confidence is displayed as "weak
   signal" with the needle dimmed, never as a blank.
5. **Precision stage (strobe-grade).** Once locked, refine frequency from
   the **phase advance** of the fundamental (or strongest partial) across
   successive frames, the phase-vocoder method. That gives ±0.1 ct and far
   less jitter than period interpolation, and it drives the strobe (Phase 3).
6. **Inharmonicity model.** Fit B per string from the partial frequencies
   (`f_n = n·f0·√(1 + B·n²)`) and report the true f0. The fit is
   remembered per preset and string. This fixes the 3 ct bass bias.
7. **Attack handling.** Plucks start sharp. Gate the first 40–80 ms after an
   onset (scaled by register) before accepting readings, and weight
   confirmation toward the sustain.
8. **Octave safety stays.** Keep the current harmonic-substitution guard in
   `pitchSmoothing.js`. Add the guided-target prior as a tie-breaker, and add
   octave continuity in chromatic mode.

### Phase 3 — Tuner: modes & display

1. **Chromatic mode (T3, T4).** Compute cents against the *stabilised* note
   with a ±60 ct hysteresis band, so there is no blanking at note edges.
   Show the needle and a **visible numeric cents readout** (e.g. `+2.4 ct`),
   and fix the hidden `sr-only` element so assistive technology announces
   readings at a sensible rate.
2. **Guided mode (T5, T9).** Confirm on **smoothed** cents with hysteresis:
   enter at ±tol, exit at ±(tol + 1.5 ct). Offer tolerances of 0.5, 1, 2, 3
   and 5 ct. The tolerance change gets its own handler instead of calling
   `onA4Select`.
3. **Needle rendering (T6).** A rAF loop draws a critically damped spring
   toward the latest target, giving sub-pixel movement at display rate
   independent of the analysis rate. It snaps when reduced motion is
   requested and pauses when there is no signal. Only `transform` is
   animated.
4. **Strobe mode (new).** A rotating-band strobe driven by the precision
   stage's phase: it stands still when in tune and drifts at a speed
   proportional to the cents error. This is the reference display for pros
   and luthiers.
5. **Tuning power features.** Per-string **cent offsets** (sweetened
   tunings), capo and transposing-instrument offsets, drop and open-tuning
   quick switch, and a 12-string course workflow (octave and unison pairs
   handled together rather than stopping auto-advance).
6. **Safety monitor (T7).** Either wire `safetyMonitor.js` into
   `handleReading` (snap risk and repeated over-tightening, already
   debounced) or delete it. Recommendation: wire it in, because it's a
   differentiator.
7. **Reference tone (T8).** Use one long-lived AudioContext, created on the
   first gesture and reused. Add a **sustained** reference option (looped or
   synthesised drone) for ear mode, following A4 calibration exactly.
8. **Drums.** Keep the separate spectral path. Add a lug-by-lug evenness
   view and reuse the Phase 2 pre-conditioning.
9. **Stretch goal: strum check.** A polyphonic FFT pass that shows all six
   strings' deviation from a single strum. Clearly labelled as a quick
   check, not a precision reading.

### Phase 4 — Hardening (both tools)

- **Device matrix**: iOS Safari 17/18, Android Chrome (low-end and
  flagship), desktop Chrome/Firefox/Safari. Test the built-in mic, a USB
  interface and Bluetooth output. Keep warning when Bluetooth *input* is in
  use.
- **Device changes mid-session**: on `devicechange` or a track `ended`
  event, reconnect the tuner automatically with the same settings and
  recover the metronome output route.
- **CPU and battery budget**: ≤ 2 ms per tuner analysis on a mid-range
  phone (measured in `?tunerdebug`), no rAF loops while idle, worklets
  idle when stopped.
- **Lifecycle**: keep the existing `astro:page-load` / `astro:before-swap`
  contract. Add a test that ten init/teardown cycles leave no AudioContexts,
  microphone tracks or Workers alive.
- **AGENTS.md compliance**: semantic tokens only, 5 interaction states on
  new controls (strobe toggle, tolerance, calibration), no
  `transition: all`, and `safeStorage` for all persistence.

### Phase 5 — Verification & release gates

Every phase must pass all of these before merge:

1. `npm run test:tuner`, the new `npm run test:metronome`, and the benchmark,
   with the Phase 2 targets from §2 enforced as assertions.
2. `npm run build` (includes `astro check`) and the AGENTS.md §10 audits.
3. Playwright: `e2e/tier1-smoke`, `e2e/tuner/*`, and new fake-mic corpus
   runs.
4. A manual on-device checklist (one page per phase):
   - first tap plays
   - tab-away/return keeps the grid
   - Bluetooth calibration works
   - coach mute bars are silent
   - noisy-room tuning holds a reading
   - low B on a phone reads steadily

---

## 4. Sequencing & effort

| Order | Work | Effort | Why this order |
| --- | --- | --- | --- |
| 1 | Phase 0.1 metronome harness + Phase 1.1 (remove re-sync) | S | Removes the most frequent audible glitch; the test proves it |
| 2 | Phase 1.2 position model + phase-preserving tempo | M | Fixes double downbeats and early beats |
| 3 | Phase 3.1 + 3.2 (chromatic blanking, visible cents, hysteresis) | S | Big perceived-quality win with minimal risk |
| 4 | Phase 0.2 tuner corpus + Phase 2.1–2.2 (direct port, pre-filtering) | M | Fixes most noise failures |
| 5 | Phase 1.3 bar program (coach/setlist in worklet) + 1.5 zero-alloc | M | Sample-exact practice tools |
| 6 | Phase 1.4 latency calibration + 1.6 first-tap unlock + 1.8 tap tempo | S–M | Bluetooth and iOS polish |
| 7 | Phase 2.3–2.4 FFT core, adaptive windows, voting, adaptive gate | L | Bass and noisy-room robustness to target |
| 8 | Phase 3.3 needle spring + 3.6 safety monitor + 3.7 reference context | S | Feel and completeness |
| 9 | Phase 2.5–2.7 precision stage, inharmonicity, attack gating | L | Sub-cent, true-fundamental accuracy |
| 10 | Phase 3.4–3.5 strobe mode + sweetened/capo/12-string | M | Pro features on top of the precision stage |
| 11 | Phase 1.7 cleanup, Phase 4 hardening, 3.8–3.9 stretch | M | Debt and breadth |

S ≈ under half a day, M ≈ 1–2 days, L ≈ 3+ days.

---

## 5. Risks & mitigations

- **Detector changes could introduce octave errors.** Mitigation: the
  realistic corpus asserts zero octave errors, and the existing harmonic
  guard stays as a final gate.
- **SharedArrayBuffer needs COOP/COEP headers**, which can break
  third-party embeds. Mitigation: default to the direct MessagePort
  approach, which needs no headers. Treat SAB as a later option.
- **Worklet ES-module imports on old Safari.** Mitigation: bundle
  `metroClock.js` into the worklet file at build time if needed, or keep a
  copied implementation that the unit test checks is identical.
- **`outputLatency` is unreliable on some browsers.** Mitigation: user
  calibration always takes precedence, stored per output device.
- **Scope creep (strobe, strum check).** Mitigation: these come after the
  reliability phases and are gated behind the precision-stage metrics.
