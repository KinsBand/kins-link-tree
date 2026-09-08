**KINS tuner: complete repair and quality plan**

Prepared 8 September 2026 from the current working tree. The baseline below records the original audit. Core repairs have since been implemented; see [implementation and verification](TUNER_IMPLEMENTATION_2026-09-08.md). The source feature flag was enabled on 9 September 2026; physical-device qualification remains an explicit follow-up release check.

The objective is a dependable musical instrument: correct pitch and octave, useful response while turning a peg, clear uncertainty when the input cannot be measured, reliable microphone operation, and a polished accessible interface. Accuracy, availability of readings, response time, and resource cleanup must all pass independently. A stable-looking needle alone is insufficient evidence.

**1. Scope and release standard**

The first certified release should cover monophonic chromatic tuning and guided acoustic guitar, electric guitar, and bass tuning. Preserve the tuning library and instrument artwork, but audit every advertised target. Build and verify the core range A0–C7 (27.5–2093 Hz), including five-string bass B0. Include at least ±50 cents of analysis headroom outside these boundary targets, so a flat A0 or sharp C7 remains measurable. Lower extended-range targets need a separately qualified bass path; identify unsupported targets before starting instead of presenting a valid-looking result. Never infer a missing low fundamental solely from the selected preset.

Drums require a separate measurement workflow and qualification phase. Keep the existing reference material, clearly identified as references, until drum measurements pass their own tests. Reference pitches, overall drum pitch, and pitch near a lug must be distinguished. The manufacturer's [tune-bot instructions](https://tune-bot.com/instructions/) explicitly distinguish center strikes for fundamental pitch from lug measurements.

Use these proposed engineering acceptance targets. They are requirements for future verification, not claims about the present implementation or universal industry certification. For context, Peterson specifies 0.1-cent accuracy for its dedicated [StroboStomp HD](https://www.petersontuners.com/products/strobostomphd/); matching that across arbitrary browser microphones would require separate evidence.

| Quality dimension | Required release gate | Measurement |
| --- | --- | --- |
| Clean digital pitch accuracy | Absolute error p95 ≤0.5 cent; maximum ≤1 cent for accepted steady readings across the certified range | Deterministic tones at 44.1, 48, and 96 kHz, multiple phases/amplitudes and detunings; score each frequency/sample-rate group, not only pooled results |
| Availability and octave correctness | ≥99% of eligible steady clean frames produce correct usable pitch; zero octave errors in the clean regression corpus | Count missing/unlocked results as failures of availability, never omit them from the denominator |
| Instrument recordings | Median absolute error ≤1 cent and p95 ≤3 cents on qualified stable segments; ≥95% availability and <0.1% octave-error frames | Licensed or self-recorded clean guitar/bass corpus, independently labeled; report separately by instrument and pitch band |
| Background noise | At SNR ≥20 dB, ≥95% availability and p95 error ≤3 cents on the defined harmonic test set | Controlled noise mixtures; at worse SNR, score false confident results and rejection separately |
| Initial acquisition | p95 ≤350 ms for E2 and above; ≤600 ms for A0–D#2 | Audio onset to first correct, visibly live reading, including capture, analysis and display; exclude human permission-prompt delay |
| Response to tuning adjustment | A sustained 20-cent change settles within 2 cents in ≤250 ms above E2, ≤450 ms for bass | Full pipeline step/glide tests; require the correct direction without a wrong-octave excursion |
| Green correctness zone & 2s dwell alignment confirmation | Meter shows the active tolerance (default ±3 cents; precision ±1 cent). Require 2,000 ms of continuously fresh, confident in-range audio for confirmation. Out-of-range or unusable audio resets progress on the next analysis hop, within 50 ms. Confirmation enables a 400 ms auto-advance dispatch debounce; live capture and pitch feedback continue | Audio-timestamp fixtures at 1,900/2,000/2,100 ms, boundaries for both tolerance settings, dropout/decay tests and slow-rendering tests; rAF is not the confirmation clock |
| Silence and stale input | Mark retained readings as held within 300 ms of lost usable input; remove live “in tune” status and reset dwell timer within 500 ms | Silence, stalled packets, disconnect and ambiguous audio after a valid note |
| False success | Zero confident “in tune” or alignment-confirmed results in the deterministic silence/noise-only/clipping/ambiguous-chord regression set | Long negative fixtures plus transitions from a previously tuned note |
| Calibration and display | Signed fractional cents preserved internally; calibration visible; never turn a nonzero reading into “0” merely because it meets tolerance | Formula tests, UI assertions and saved-setting migrations |
| Cleanup | Stop every owned track immediately on Stop/teardown; late permission results are stopped on arrival; no accumulating listeners/workers/contexts | 50 automated start/stop and route cycles, delayed async completions, plus real-device mic indicators |
| Responsiveness | Tuner main-thread render work p95 <4 ms; no tuner-caused >50 ms tasks; smooth interaction on named reference phones | Device profiling after warmup, during a 10-minute tuning session; separately record worker timing and audio overruns |
| Accessibility | WCAG AA contrast; keyboard-complete flow; 44 px touch targets; all five interactive states; dwell progress conveyed via non-color cues (progress arc/bar + live region) | Automated checks and manual keyboard, screen-reader, light/dark, zoom and reduced-motion review |

Define an eligible steady segment before examining results: exclude a fixed annotated attack interval and recording regions whose reference frequency is genuinely ambiguous. Record acquisition performance on the excluded attacks separately. Require minimum coverage per pitch band so a detector cannot “pass” by rejecting difficult inputs. A cent is one hundredth of a semitone; calculate error as `1200 * log2(measuredHz / referenceHz)`.

**2. Confirmed baseline and faults**

| Priority | Finding | Evidence and consequence |
| --- | --- | --- |
| P0 | Tuner unavailable and tests skipped | [functionality.config.ts](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/settings/functionality.config.ts:18) sets `enableTunerPage: false`; the route redirects to home. All seven tuner smoke tests skipped in this audit. |
| P0 | Large pitch errors on ideal signals | At 48 kHz, 440 Hz measured a median 33.75 cents flat; 329.6276 Hz measured 39.45 cents flat. Both were locked for all 16 late frames. At 44.1 kHz, 2093 Hz was reported about two octaves low. |
| P0 | Low notes fail to lock | B0, E1 and E2 produced zero locked readings in the last 16 frames of the 48 kHz probe. At 96 kHz, B0 produced no late valid reading. |
| P0 | Stop can be undone by a pending start | In a mocked engine test, call `start()`, call `stop()` while permission is unresolved, then resolve permission: `runningAfterStop: true`, `tracksStopped: 0`. The engine has no generation guard around async acquisition. |
| P0 | Hidden calibration changes the answer | [tunerState.js](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/tuner/tunerState.js) restores saved A4. A saved `kins-tuner-a4=432` restored 432 in the probe. The UI hides calibration and describes it in comments as fixed at 440. |
| P1 | Display conceals pitch error & lacks green zone feedback | [uiBindings.js](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/tuner/uiBindings.js:1348) and its guided/chromatic branches display `0 ct` throughout ±5 cents. [index.js](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/tuner/index.js:305) rounds raw cents before smoothing. The meter has a static yellow band (`.tuner-meter-zone`) with no calibrated green correctness zone and zero visual indication of dwell confirmation progress. |
| P1 | Fragile auto-advance without 2s dwell verification | `autoAdvanceTick` in `index.js:139` uses an unindicated 1,500 ms check (`AUTO_ADVANCE_LOCK_MS: 1500`) with no dwell progress feedback, no reset on signal decay, and no debounce lockout. A transient pluck or ringing tail can falsely trigger advancement. |
| P1 | Excessive smoothing delay | The current median filter plus locked EMA took 2,050 ms to get within 2 cents after a 20-to-0-cent step at 20 Hz. Reduced motion halves detection cadence and increases frame-based delays further. |
| P1 | Held and live readings are insufficiently distinguished | `lastGood` is retained indefinitely. Held updates add a CSS class and return, preserving earlier in-tune classes and status text. A retained result can outlive the sound that supported it. |
| P1 | Lifecycle cleanup incomplete | Controller installs an anonymous visibility listener; UI installs document/window listeners with no destroy method; the page has additional global footer listeners. Initialization lacks a route-root guard and complete async invalidation. |
| P1 | Presets exceed detector range | The config contains 530 presets / 3,274 target entries, including 16 targets below the current 28 Hz floor. Custom string generators can extend lower still. |
| P1 | Auto-advance bypasses custom presets | `getPresetInternal()` reads the group array directly instead of `getPreset()`, so custom-preset length/order can diverge from the sequence it advances through. |
| P1 | Safety claims exceed measured information | Material-specific semitone thresholds are presented as snap-risk/unsafe limits. A continuous danger condition also adds a stress event every analysis frame, so one sustained event can be called repeated over-tightening. |
| P2 | Theme, motion and markup debt | Tuner page contains raw colors, legacy aliases and non-transform transitions. It is over 3,000 lines; `uiBindings.js` is over 1,600 lines. Large hidden legacy control trees remain. |

The detector probe called the existing bundled `createPitchDetector()` directly with fresh 6,144-sample Float32 windows of a peak-amplitude 0.2 sine, 32 frames per tone, 50 ms hops, and actual sample rates 44,100/48,000/96,000. The late measurement interval was frames 16–31. This isolates software math from the microphone and browser; it does not certify hardware performance. Timing numbers from this run are not device benchmarks because the build and smoke suite were running concurrently.

| Sample rate | Input | Late median error | Locked / late valid frames |
| --- | --- | --- | --- |
| 48 kHz | B0, 30.8677 Hz | +13.04 cents | 0 / 16 |
| 48 kHz | E1, 41.2034 Hz | −40.68 cents | 0 / 16 |
| 48 kHz | E2, 82.4069 Hz | −41.43 cents | 0 / 16 |
| 48 kHz | E4, 329.6276 Hz | −39.45 cents | 16 / 16 |
| 48 kHz | A4, 440 Hz | −33.75 cents | 16 / 16 |
| 44.1 kHz | C7, 2093.0045 Hz | −2404.79 cents | 16 / 16 |
| 96 kHz | B0, 30.8677 Hz | No late valid result | 0 / 0 |

Code inspection identifies likely contributors to the measured failures: YIN interpolation around the first threshold crossing rather than a local minimum; cumulative normalization beginning at the search minimum; confidence taken from a different global minimum than the selected lag; inverted/discontinuous adaptive-threshold interpolation; stateful DC filtering applied repeatedly to overlapping windows; and a 2,046-sample lag cap independent of actual sample rate. These contributions must be isolated with regression tests rather than assuming one patch resolves every observed error. The cap alone puts the longest candidate period at about 46.9 Hz at 96 kHz.

**3. Implementation order and completion gates**

**Phase 0 — Make tuner quality observable.**

Establish a private development/CI path that explicitly enables the tuner, while retaining the existing public gate until qualification is complete. Test the enabled route and disabled redirect as separate scenarios. Have CI fail if expected tuner tests are skipped or the enabled test project receives the redirect. Avoid a public query parameter that bypasses availability controls.

Create a repeatable Node DSP harness using a pinned development dependency/runtime and generated PCM fixtures with recorded metadata. Capture the existing failures as regressions before changing the math. Add a browser fixture source that injects PCM upstream of the actual AudioWorklet; never inject final pitch values for accuracy tests. Keep UI-only state mocks as a separate test layer.

Record frequency, confidence/quality score, reason for rejection, lock state, sample index, analysis duration, input level, clipping and result age. Use local debug instrumentation, disabled by default, with no audio upload or production console spam. Record fixture hashes and source revision with benchmark results.

Completion: the 440 Hz error, low-note failures, hidden calibration, slow smoothing, stale display and pending-start race can each be reproduced by a named test. Required audio cases run when the public feature is gated.

**Phase 1 — Correct the detector and sample pipeline.**

1. Extract a pure DSP core with explicit inputs: contiguous PCM, actual analysis sample rate, sample timestamp and supported frequency bounds. Return unrounded frequency, selected-candidate quality, signal metrics and rejection reason. Separate pitch estimation from UI lock, note selection and animation.
2. Implement a correct baseline YIN difference function and cumulative normalization over lags starting at 1; constrain candidate selection separately. Descend to the local minimum, interpolate within valid neighbors, guard the denominator and bounds, and score confidence at the chosen candidate. Maintain a fresh full-range search path for new notes. Use the algorithm behavior in [aubio's upstream YIN implementation](https://raw.githubusercontent.com/aubio/aubio/master/src/pitch/pitchyin.c) as a cross-check; this plan does not propose copying or adding that dependency.
3. Make the adaptive threshold continuous and monotonic: stricter for strong clean input, cautiously more permissive near decay. Test endpoints and intermediate values. Treat a quality score as a score, not a calibrated probability.
4. Filter each chronological sample once before the overlapping analysis windows are formed. Maintain filter history over continuous input, reset on sample discontinuities, and select a sample-rate-aware DC-removal cutoff that preserves bass. Never carry streaming filter state through replayed overlapping windows.
5. Size lag buffers and windows from frequency range and sample rate. Start with enough cycles for bass, use a shorter path for high notes, and ensure `window + maxLag` fits valid captured samples. Analyze the newest appropriate window rather than the oldest portion of a larger buffer. Do not let an old low-note estimate permanently constrain detection of a new high note.
6. If resampling/downsampling is necessary for CPU budgets, use an anti-alias filter, preserve continuity and sample timestamps, and account for filter delay in accuracy/latency tests. Merely skipping samples is not a resampler.
7. Replace single-bin octave heuristics with candidate comparison using periodicity and harmonic evidence. Window the FFT used for spectral verification, interpolate peaks, and choose tolerances based on spectral resolution. The current fixed percentage tolerance can misclassify low-frequency peaks. Preserve a corrected candidate between spectral checks instead of alternating corrected and uncorrected values.
8. Test strong second/third harmonics, weak or missing fundamentals, mains hum, pickup tone changes, pluck attacks and natural pitch decay. Reject genuinely ambiguous signals instead of forcibly mapping them to a target. Automatic notch filtering must not erase a valid 50/60 Hz musical input.

Completion: clean-signal accuracy, availability and octave gates pass across the full rate/range matrix before adjusting display smoothing. Compare any optimized candidate against this correct reference implementation. Add WASM or another algorithm only if measured failures justify it.

**Phase 2 — Make audio capture and teardown reliable.**

Introduce a session generation ID and explicit states: idle, requesting permission, starting audio, listening, paused/interrupted, error, stopping. Store resources per session. After every async boundary, check whether that session is still current; immediately stop tracks returned for a cancelled session. Never let an old error handler stop or overwrite a newer session.

Create/resume the AudioContext from the user action, handle rejection, and use supported options. The current `idealSampleRate` option is not an AudioContext option; the documented property is `sampleRate`, and the effective rate must still be read from the context. Prefer the native rate with `latencyHint: 'interactive'` unless measurements justify conversion. See [AudioContext constructor documentation](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext).

Request appropriate microphone constraints for unprocessed audio; inspect effective settings and expose an input selector after permission. Handle multi-channel interfaces deliberately so an instrument connected to channel 2 is not missed. Base advice on effective input quality, not only a Bluetooth-name regex. Preserve all processing on the device.

Support cancel while waiting for permission. Permission requests can remain pending indefinitely, so a timeout must invalidate the session rather than assume the browser cancelled capture. Provide distinct retryable messages for blocked permission, no device, busy input, unsupported/insecure context, failed worklet and interrupted audio. The pending-promise behavior is documented by [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

Keep the AudioWorklet capture path small and bounded. Move expensive analysis to a dedicated Worker connected by a MessagePort, with sequence numbers, sample timestamps and a bounded transferable-buffer pool. On dropped packets or backpressure, report discontinuity and reset analysis; never silently concatenate samples separated by a gap. Do not require SharedArrayBuffer/cross-origin isolation for the first release.

Choose a fixed analysis hop initially around 20–30 ms, decoupled from rendering. Profile worklet capture against its actual render-quantum deadline and require substantial headroom, initially p99 <25% of that deadline on the slowest supported device. Require worker processing to finish within the selected hop at p95, with no growing queue. If a device misses the budget, reduce analysis cost or explicitly qualify a slower bass mode; do not hide stale estimates behind a fast animation.

Remove the silent `ScriptProcessorNode` fallback once supported-browser coverage is verified. It is [deprecated in favor of AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode). Retry a failed worklet load once when appropriate and then show a clear recovery state. A legacy fallback, if retained for a named supported browser, needs an explicit degraded state and the same correctness tests.

Add heartbeat/no-samples detection, `processorerror`, track ended/mute/unmute, device change and AudioContext state handling. Make Stop/teardown idempotent: stop tracks, disconnect nodes, close ports, terminate worker, close context with handled promises, cancel rAF/timers and abort listeners. Track valid sample counts and clear ring buffers so a restart cannot read previous audio.

Centralize page lifecycle setup and disposal. Check the tuner root before initialization; invalidate pending imports on route departure; recover from failed imports without leaving the initialized latch stuck. Register `astro:page-load`/`astro:before-swap`, normal pagehide and back/forward restoration. Add `ui.destroy()` with an AbortController or explicit removals, including footer triggers and sheet drag handlers. Current BaseLayout does not visibly install a ClientRouter; test actual navigation and the required lifecycle contract rather than assuming transitions are active.

Default to stopping capture on hidden/pagehide and displaying a clear tap-to-resume state when the user returns. Any future keep-awake mode must be explicit and separately tested. Repeated microphone initialization must never clear unrelated players' MediaSession handlers indiscriminately.

Completion: all async-race and cleanup tests pass; no stuck listening state after a disconnect, cancelled permission, navigation or screen lock; no live owned resources after teardown.

**Phase 3 — Make the readout responsive and truthful, add the green correctness area, and enforce 2-second dwell confirmation.**

Keep three distinct layers: raw accepted frequency, musical target selection, and smoothed presentation. Preserve floating-point cents. Use time-based smoothing and hysteresis so measurement behavior is independent of display refresh rate, low-power mode and reduced-motion preferences.

Replace the overlapping attack freeze, frame lock, label debounce, note-change hold and slow locked EMA with one measured acquisition/tracking policy. Use fast response for deliberate peg changes and note changes, then moderate smoothing for stable sustain. Change octave/note only when supported by consecutive fresh evidence; invalidate candidate confirmation across silence or stale packets. Do not solve wrong readings by making the display hold longer.

Display the actual signed cents value even inside tolerance. Always provide clear, truthful numerical feedback rather than forcing "0 ct".

*Green Correctness Area for the current string:*
The tuning meter must visually and mathematically delineate the green correctness zone for the active target string under the selected tuning preset:
1. **Calibrated Visual Geometry:** Map the target band to the active tolerance (standard ±3 cents; precision ±1 cent) using the same cents-to-position function as the needle. Define semantic `--tuner-target-zone-fill` and `--tuner-target-zone-border` tokens in both themes, derived from the in-tune role. Keep raw colors and dimensions in token definitions. Verify that a narrow precision band remains discernible without falsely widening its mathematical boundaries.
2. **Dynamic Centering:** In guided mode, the green correctness zone represents the exact target frequency of the selected string on the current tuning preset (e.g. String 6 = E2 @ 82.41 Hz with A4=440). The needle enters the green zone when $|\Delta \text{cents}| \le \text{TOLERANCE\_CENTS}$.
3. **Chromatic Parity:** In chromatic mode, the green zone dynamically centers on the nearest semitone when confident, providing identical precision feedback.

*Two-second confirmation window:*
Treat two seconds as a product choice for guided-string confirmation, independent of the fast acquisition and adjustment targets above. Show live pitch and “In range — confirming” immediately when supported by audio. A pluck briefly passing through the target must not mark the string complete. Keep this duration configurable in the SSOT and qualify it on real instrument sustain:
1. **Continuous 2,000 ms Dwell Requirement:** String alignment is confirmed strictly when the detected pitch continuously dwells within the green correctness zone for 2,000 ms ($2.0\text{ s}$) of fresh, confident audio.
2. **Immediate Invalidation on Excursion or Dropout:** Check the accepted current pitch against the selected tolerance, not a lagging display needle. Reset on out-of-range pitch, insufficient quality, clipped/ambiguous input, a sample gap or a target/calibration change, within one analysis hop (≤50 ms). Do not credit silence or held frames. A grace period would change the continuous-dwell contract and is excluded from the initial implementation.
3. **Real-Time Visual Dwell Progress Feedback:** Derive progress from accepted audio timestamps and animate a bar with `transform: scaleX(...)`; opacity may communicate state changes. A peg progress treatment may use transform-based geometry, but do not animate SVG `stroke-dashoffset`, width or paint-heavy properties. Rendering pauses must not advance confirmation.
4. **Accessible Non-Color Cues:** Provide numeric progress and restrained live announcements on entry/completion. An optional haptic cue may be feature-detected and user-controlled; the visible and spoken result must work without vibration support.

A short hold should preserve context between plucks, with visible “Last reading” text and no active in-tune success. Clear or dim it on the defined stale deadline. An optional long-hold preference may retain the historical value, but must never imply ongoing measurement. Fresh input, not repeated held frames, drives the 2-second dwell accumulator and auto-advance.

Keep the main screen focused on Start/Stop, note, cents, flat/sharp direction and string targets. Put input selection, A4, tolerance and display options in settings. Avoid making the entire readout an accidental microphone toggle. Surface “Play one string,” clipping and microphone errors visibly; these are currently often routed into an `sr-only` status line.

Retain a clear needle display for initial release. A scrolling note rail is not a calibrated strobe. Add a strobe-inspired display only after core gates pass, with drift direction/speed derived from measured error, time-based animation and an explicit reduced-motion alternative. It must not imply extra accuracy merely through animation.

Completion: green correctness zone renders to calibrated scale; 2-second continuous dwell reliably confirms string alignment; boundary drift immediately resets the timer; visual progress is fluid and accessible; response and stale-reading gates pass end to end.

**Phase 4 — Correct targets, calibration, guidance, and debounced auto-advance.**

Audit all 530 presets against note/MIDI/frequency identities, unique stable IDs, intended octaves, string counts and instrument conventions. Flag suspicious bass octave sequences for manual review; do not impose a monotonically ascending rule on re-entrant or doubled-course tunings. Verify artist-attributed tunings against reliable sources or remove the attribution while preserving a neutrally named tuning.

Restore an explicit A4 control, default 440 Hz, using the current supported 410–470 Hz range with 0.1 Hz resolution, common presets and reset. Always display nondefault calibration near the readout. Migrate existing stored settings with validation; do not silently force a saved 432 Hz user to 440 or continue hiding 432. Calibration changes reset target-dependent state, recalculate green zone bounds, reset any active dwell progress, and apply equally to built-in and custom string presets.

Persist preset IDs rather than fragile array indices. Validate stored instrument, preset, mode, reference, material/guidance preference and custom targets through one schema, with safe storage fallbacks. Restore calibration before deriving custom frequencies.

Make all selection and auto-advance paths use the resolved active preset. Add explicit Auto versus Manual string selection:
1. **Manual Selection:** Stays selected until Auto is chosen or another string is tapped. The 2-second dwell confirmation marks the selected string as "Aligned" (with persistent checkmark) and holds state without forcing unwanted advancement.
2. **Auto Selection & Debounced Auto-Advance:**
   - Auto-advance triggers strictly upon fulfillment of the **2-second dwell confirmation in the green zone**.
   - **400 ms Post-Confirmation Dispatch Debounce:** Show success and delay the single auto-advance action by 400 ms while capture and live analysis continue. A fixed delay alone cannot prevent long ring-down errors: retain the completed-string identity, suppress automatic return to it, and require new-onset/next-target evidence before confirming another string.
   - Once advanced to the next string, the dwell accumulator is initialized to $0\text{ ms}$, the needle returns to real-time tracking of the new target, and the peg view highlights the new string.
   - If all strings have passed confirmation, show “All strings checked — play through once more” with a completion indicator. These are sequential measurements, so avoid promising that every string is simultaneously still in tune. Keep the completed state until the user starts another pass or fresh measurements invalidate it.

Auto identification must also work for realistically detuned strings, using candidate separation and history rather than only accepting notes already within 40 cents. If two strings/courses are indistinguishable by pitch, preserve manual selection or ask for a string tap. Cover custom and 12-string presets explicitly; changing target, preset or calibration resets the affected confirmation state.

Replace unsupported material-based “safe,” “unsafe” and breakage-limit claims with conservative pitch guidance: check the selected string/peg, confirm the target octave, and make small adjustments. Pitch and material alone do not establish physical breakage risk; even calculating tension needs unit weight, scale length and frequency, as explained in [D'Addario's technical reference](https://www.daddario.com/globalassets/pdfs/accessories/tension_chart_13934.pdf). Keep wrong-target/high-offset guidance, require trusted readings, and count actual zone-entry events rather than frames. A tension calculator would be a separate feature needing appropriate instrument data.

Completion: every selectable target is qualified or explicitly marked reference-only/outside supported capture range; storage migrations and custom/12-string flows pass; 2-second dwell cleanly drives debounced auto-advance without double-stepping or ring-down false triggers; no unsupported safety assurances remain.

**Phase 5 — Bring the page into the KINS design system.**

Extract coherent Astro components for the readout, string targets, tuning library and settings sheet, retaining browser-only dynamic loading for hardware controllers. Split UI binding responsibilities by lifecycle and view without replacing the plain CSS/vanilla-module architecture. Remove hidden legacy controls only after selector and accessibility coverage has moved to the replacement interface.

Move raw colors, layout dimensions, focus/press values and motion values to semantic tokens with explicit light/dark parity:

- **Target zone:** `--tuner-target-zone-fill` and `--tuner-target-zone-border`, derived from the in-tune role with measured contrast in both themes.
- **Confirmation progress:** `--tuner-dwell-progress` and the existing brand/in-tune roles. Change state colors without animating paint properties; use opacity for a state crossfade if needed.
- **Card and shell surfaces:** Existing surface, brutal-border and offset-shadow tokens. Keep raw values inside token definitions.

Animate transform/opacity only, use one backdrop-filter layer at most, and obey reduced motion without reducing measurement accuracy or responsiveness:
- For `prefers-reduced-motion: reduce`, replace animated sweeps with an instant fill and high-contrast numerical/icon checkmark indicators.
- 60fps mobile budget: strictly avoid layout reflows during the 2-second dwell animation.

Verify Default, Hover, Active via `.brutal-press`, Focus-visible and Disabled states for every control. Provide semantic button/selection roles for strings and presets; label the note with its octave; use focus trapping, Escape/outside dismissal and focus restoration in dialogs. Announce meaningful state or note changes, not every rapidly changing fractional cent. Visual status must remain understandable without color.

Review 320 px phones, standard mobile portrait/landscape, tablet and desktop through the 1,280 px content cap, plus 200% zoom, virtual keyboard, long preset names, safe areas and both themes. Keep the meter and Start/Stop reachable without artwork pushing the primary task offscreen. Verify contrast with measured token pairs rather than assuming the supplied palette automatically passes on every surface.

Completion: screenshot and interaction review passes the viewport/theme/state matrix with no clipping, inaccessible controls, color-only dependency, or layout-driven audio stalls.

**Phase 6 — Qualify drum measurements separately.**

Implement an explicit choice between overall drum fundamental and lug matching, with strike-position/muting instructions. Use a short onset-aware analysis path, frequency-band selection and repeatable spectral-peak matching appropriate to an inharmonic decaying signal. Do not apply the string harmonic-rejection policy unchanged.

For lug matching, capture a reference lug frequency and show subsequent deviation from that reference. Keep overall note suggestions optional and clearly separate from lug targets. Qualify on recordings and physical kicks, toms and snares, including snare-wire noise and short decay. Define an initial supported lug range of 80–400 Hz and target repeated-strike p95 error ≤3 cents against independently labeled stable peaks, with ≥90% usable strikes in controlled conditions. Expand the range only after evidence supports it.

If a drum case cannot be measured reliably on the supported input, show a reference/measurement-unavailable state. Do not apply string-safety warnings or the string 2-second dwell auto-advance mechanic to drums (drums use per-strike transient peak capture, not continuous harmonic dwell).

Completion: drum acceptance report passes independently; until then, drum content remains explicitly reference-only.

**Phase 7 — Browser, device, performance and release verification.**

| Test layer | Required cases |
| --- | --- |
| Pure math/DSP | Known tones over the full range, cent offsets, random phases, 44.1/48/96 kHz, threshold boundaries, non-finite/short input, silence, weak signals, DC offset, clipping, noise, harmonic dominance, missing fundamentals and deliberate ambiguity |
| Green zone & 2s dwell | Confirm after 2,000–2,050 ms of accepted continuous audio; excursions beyond the selected ±3/±1-cent boundary at 1,900 ms reset progress; signal loss at 1,500 ms resets progress; re-plucks require fresh qualification; 400 ms dispatch debounce plus completed-target/new-onset gating prevents ring-down double-triggering |
| Musical transitions | Silence→pluck→decay, ±20-cent steps/glides, adjacent note boundaries, octave changes, rapid string changes, two ringing strings, vibrato, target/calibration changes and recovery from signal gaps |
| Capture integration | Deterministic PCM through actual worklet→worker→detector→UI, packet loss/backpressure, worklet failure, device/channel changes, actual sample-rate handling and absence of audible mic monitoring |
| Lifecycle | Denial/retry, indefinitely pending permission, allow after cancel/navigation, repeated start/stop, muted/ended tracks, failed resume, background/foreground, pagehide/pageshow, route revisit and Astro teardown |
| Product | All preset counts, search, Auto/Manual selection, custom targets, 12-string courses, calibration migration, 2s dwell auto-advance sequence, visible errors, settings sheet, themes and footer modals |
| Platform | Desktop Chrome/Edge/Firefox/Safari; physical iPhone Safari and Android Chrome; current stable plus previous supported major where available |
| Input hardware | Built-in laptop and phone mics, USB mic, audio-interface instrument input including non-first channel, wired headset; Bluetooth behavior documented from observed settings |
| Real music | Electric/acoustic guitar and four/five-string bass, standard/drop tuning, low B, quiet/noisy room and multiple mic distances; drum corpus separately |
| Endurance/PWA | 10-minute device profiles, 30-minute representative soak, 50 lifecycle cycles, offline revisit after installation, old-cache upgrade and rollback |

Add Chromium and actual WebKit/Firefox browser projects; Pixel 7 emulation alone is not a physical Android test, and Playwright WebKit is not a substitute for an iPhone microphone test. Use Chromium's WAV fake-capture option for applicable capture tests and a test-only PCM source feeding the real processing graph for cross-browser deterministic coverage. Test fixtures must never silently replace the production estimator with expected answers.

Ground-truth real recordings with a calibrated reference signal or simultaneous known-quality measurement and documented uncertainty. A signal generated and measured on the same audio clock cannot prove absolute hardware clock accuracy. Compare hardware results with an independent reference before publishing sub-cent device claims. Exclude ambiguous reference segments by annotation, not after seeing detector errors.

Version the worklet/worker protocol and asset URL together; update service-worker cache handling so a new controller cannot receive an old processor. Prefer build-versioned assets; if the public path remains stable, use a coordinated cache version and protocol handshake. Test actual upgrades from a previous cache, including offline behavior. Preserve the existing exclusion of `/api/*` from caching and verify there are no raw-audio network requests.

Release sequence: enabled local/CI build → private preview with real hardware report → full production build and smoke/security checks → enable `enableTunerPage` and verify navigation → release → verify deployed audio assets and capture on a real phone. Keep the previous known-good build and feature gate for rollback. This plan does not deploy or enable the feature.

Completion: all declared supported modes and environments meet their gates; publish measured range, accuracy conditions and known limitations with the release report. Any failed gate remains a tracked release blocker for that advertised capability.

**4. File ownership and planned changes**

| Existing file | Intended responsibility/change |
| --- | --- |
| [pitchDetector.js](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/tuner/pitchDetector.js) | Correct DSP baseline; extract pure estimator; verify quality score and octave handling |
| [audioEngine.js](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/tuner/audioEngine.js) | Session-safe capture, input selection, worklet/worker transport and complete cleanup |
| [tuner-worklet.js](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/public/tuner-worklet.js) | Bounded chronological capture, protocol metadata, drops/health reporting |
| [index.js](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/tuner/index.js) | Explicit session lifecycle, current-result ownership, 2-second continuous dwell state machine (`dwellStartAt`, `dwellAccumulatedMs`), boundary-drift resets, 400 ms post-lockout auto-advance dispatch |
| [tunerState.js](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/tuner/tunerState.js) | Validated settings/migrations, stable preset IDs, string completion state map, correct resolved target state |
| [uiBindings.js](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/tuner/uiBindings.js) | Truthful readout, calibrated green correctness area rendering, 60fps 2-second dwell progress arc/bar animation, string alignment confirmation celebration, accessible live-region announcements |
| [safetyMonitor.js](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/tuner/safetyMonitor.js) | Replace unsupported risk estimates with trusted pitch guidance and event-based debouncing |
| [tuner.config.ts](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/settings/tuner.config.ts) | Audited preset data, supported ranges, calibration, `DWELL_LOCK_MS: 2000`, `GREEN_ZONE_CENTS: 3.0`, `AUTO_ADVANCE_COOLDOWN_MS: 400`, time-based thresholds and accurate copy |
| [tuner.astro](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/pages/tuner.astro) | Component structure, calibrated green zone element, dwell progress bar/ring markup, string alignment checkmarks, visible status and route-aware dynamic initialization |
| [instrumentArt.js](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/scripts/controllers/tuner/instrumentArt.js) | Accessible string/course mapping, alignment confirmation checkmarks, and semantic-token styling |
| [variables.css](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/styles/tokens/variables.css) | Explicit tuner semantic roles (`--tuner-target-zone-fill`, `--tuner-target-zone-border`, `--tuner-dwell-progress`) in both themes |
| [functionality.config.ts](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/src/settings/functionality.config.ts) | Private verification enablement and final public release gate |
| [sw.js](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/public/sw.js) | Version-compatible audio assets and upgrade behavior |
| [playwright.config.ts](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/playwright.config.ts), [tuner.spec.ts](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/e2e/tier1-smoke/tuner.spec.ts) | Enabled tuner coverage, 2-second dwell confirmation tests, boundary drift tests, auto-advance debounce assertions |
| [package.json](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/package.json), [PAGE_FILE_MAP.md](C:/Users/trai/.gemini/antigravity/scratch/kins-official-website/docs/PAGE_FILE_MAP.md) | Explicit DSP/integration test commands and updated architecture map |

Proposed additions: a pure DSP module, a pitch-analysis Worker, a presentation/tracking module, small tuner Astro components, deterministic PCM generators, fixture metadata, DSP/integration suites and a repeatable benchmark report. Their exact file names can follow repository conventions during implementation. No backend pitch service or new API endpoint is required.

**5. Work packages, effort and dependencies**

| Package | Estimate | Depends on | Reviewable deliverable |
| --- | --- | --- | --- |
| Baseline fixtures and enabled CI | 1–2 engineering days | None | Reproduced failures, deterministic runner and explicit gate coverage |
| Correct detector and range handling | 3–5 days | Baseline | Passing numerical suite with before/after metrics |
| Capture, worker and lifecycle | 2–4 days | Baseline; final integration after detector | Passing race/cleanup suite and capture trace |
| Responsive display, green correctness zone & 2s dwell confirmation | 2–4 days | Correct detector and lifecycle | Calibrated green area, fluid 2s dwell progress animation, passing drift-reset and debounced auto-advance tests |
| UI/token/accessibility refinement | 2–3 days | Settled behavior | Reviewed viewport/theme/state matrix, WCAG AA compliance, non-color dwell indicators |
| Physical-device qualification and release | 3–5 days | All core packages | Hardware report, performance evidence, release/rollback checklist |
| Dedicated drum qualification | 3–5 additional days | Correct shared capture pipeline | Independent drum measurement report or explicitly reference-only scope |

Planning allowance: approximately 13–23 engineering days for a certified string/chromatic release, with drum certification additional. Device availability and octave-error investigation are the largest uncertainties. Re-estimate after the deterministic baseline and first detector correction. These are effort estimates, not a scheduled commitment. Do not trade away accuracy or hardware testing to hit a date.

**6. Baseline verification performed for this plan**

- `npm.cmd run build`: passed, with existing warnings/hints. This was the gated configuration, so it does not establish that the enabled tuner UI works.
- Full tier-one smoke suite: 33 passed, 19 skipped, 2 failed. All 7 tuner tests were among the skips. The failures were the home share-modal PWA installed-state test and the metronome dynamic-island stop/cancel test. They were observed before any application changes in this task; isolate them during release verification rather than treating the suite as green.
- Static output webhook-URL scan: zero matching files. This is the repository's specified scan, not proof that every possible secret pattern was exhaustively audited.
- `transition: all` scan: zero matching source files. Other non-transform animations/transitions still require tuner-specific review.
- Storage scan: matches in 11 client-script files; tuner storage access is wrapped in try/catch. No claim of a completed unrelated-site storage audit.
- Deterministic detector, smoothing, hidden-calibration, preset-range and cancelled-start probes produced the findings above.
- Runtime used locally: Node v26.3.0. The project declares Node 24.x; repeat the implementation acceptance suite on the declared runtime.
- No enabled-page visual review, physical microphone validation, calibrated hardware comparison or mobile performance certification was performed in this planning task. These remain explicit implementation gates.
- Additional UI animation changes appeared in the shared working tree during the final document review. They were not made by this planning task. The detector, configuration and audio-engine hashes below remained unchanged; rerun enabled UI/lifecycle checks against the final integrated implementation.

Audit source SHA-256 values: `pitchDetector.js` = `5632000C37ACB890101642ABCDC7B44ECF606A9FCB764227316B0E0D82D3F913`; `tuner.config.ts` = `151315B5528F15357ACF7F4E03CF1BC4EC5AA864238C2AA7A869CD6E95D3CAAF`; `audioEngine.js` = `C7A161384703FD3ED721340F3832EC6643CE5B079F24C71327A34E70C01F1A25`.

**7. Definition of done**

The work is complete when the enabled tuner passes numerical accuracy and availability gates, responds within the latency budget, accurately identifies notes/octaves on qualified instruments, shows uncertainty and retained readings honestly, releases microphone resources across every tested lifecycle path, and passes the physical-device/accessibility matrix. 

Specifically for guided tuning: the meter must render a calibrated **green correctness zone** for the current string on the current tuning preset; the **2-second dwell confirmation mechanic** must accurately track continuous in-tune audio, display a real-time progress indicator, reset immediately upon boundary drift or signal dropout, confirm string alignment with visual/haptic/live-region feedback, and drive auto-advance with a 400 ms debounce lockout to prevent ringing-string false triggers.

All supported presets and calibration settings must agree with the detector and displayed target. The production artifact must load compatible cached audio modules and run actual tuner tests rather than skips. A polished preview, a successful build, or a passing microphone-toggle test alone does not meet this definition.
