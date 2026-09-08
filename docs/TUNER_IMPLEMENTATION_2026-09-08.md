# Tuner repair: implementation and verification

The core tuner repair is implemented in the working tree and the tuner is enabled in KINS TOOLS. Microphone capture still requires an explicit user action and audio remains on the device.

## What changed

- Replaced the faulty YIN normalization/minimum selection and overlapping-frame filtering with a pure fixed-window detector. It preserves input PCM, uses the actual sample rate, supports 26–2160 Hz analysis headroom, interpolates pitch without rounding before smoothing, and rejects silent, clipped, nonfinite and uncertain input.
- Moved detection into a dedicated worker. The AudioWorklet only captures PCM using a four-buffer transferable pool. Audio-frame sequence numbers expose missing packets; generations and revisions prevent late results from affecting a new session or target. The main thread maintains one analysis request in flight.
- Added explicit ownership to microphone sessions. Cancellation, late permission resolution, repeated starts, disconnects, navigation, backgrounding and teardown release the session's tracks, nodes, context, worker, UI listeners and timers. No ScriptProcessor fallback silently changes analysis quality.
- Replaced frame-count smoothing and confirmation with audio-time tracking. Standard tolerance is ±3 cents, with a ±1-cent option. The live meter remains responsive while a separate progress bar requires two seconds of fresh in-range audio before checking a string. Silence, uncertainty, excursions, gaps and target changes reset progress. Held values are visibly labelled and cleared after a bounded interval.
- Preserved fractional cents and frequency readouts. Small offsets are no longer displayed as a fabricated zero. The target zone follows the selected tolerance. Fixed chromatic-rail alignment and resize handling.
- Added visible A4 calibration (410–470 Hz, 0.1 Hz increments, reset to 440), precision selection, microphone selection and channel selection. Device changes stop capture before reconnecting. Calibration is also shown alongside the target.
- Hardened guided tuning: target identification requires proximity and separation from competing targets; manual selection cancels automation; auto advance follows confirmation plus a separate debounce, stops after all strings are checked, and asks for separate selection at unison courses. Unsupported low targets are labelled reference only. Drums remain references. Material-based breakage predictions no longer drive the tuner.
- Migrated saved preset selection to stable IDs with legacy-index fallback. Custom counts are strictly validated and restored, and generated bass layouts contain the requested number of strings.
- Added semantic theme styles, visible status, readable settings labels, keyboard focus containment, an explicit close button, a centered desktop dialog, mobile sheet behavior, reduced-motion handling and disposable resize observation.
- Versioned capture protocol URLs and advanced the service-worker cache generation so old PCM packet formats are not reused.

## Automated evidence

The deterministic benchmark covers 165 clean-signal scenarios: eleven pitches from A0 through C7, five offsets from −40 to +40 cents, and sample rates of 44.1, 48 and 96 kHz. It scores four steady readings per scenario, with no missing or incorrectly accepted steady readings in the measured run:

| Measurement | Result |
| --- | --- |
| Accepted steady readings | 660 / 660 |
| Absolute pitch error, p95 | 0.050 cent |
| Absolute pitch error, maximum | 0.107 cent |
| Analysis duration, host p95 | 20–25 ms across repeated runs |

These numbers describe synthetic PCM, not physical microphone accuracy or end-to-end latency. CPU durations vary with hardware and concurrent load. The benchmark asserts coverage and pitch-error thresholds; it does not silently omit rejected cases.

Run `npm run test:tuner` for deterministic tests, `npm run test:tuner:benchmark` for the scored matrix, and `npm run test:tuner:browser` for browser verification. The dedicated Playwright configuration enables the tuner on its own local server and fails if the route redirects away. It does not inherit the public smoke suite's disabled-route skips. Test capture uses generated audio connected to a MediaStream; the actual AudioWorklet, worker, controller and DOM are exercised.

Browser cases cover A4, low B0, fractional offsets, meter alignment, fresh confirmation and silence, calibration restoration, pending-permission cancellation, Astro teardown/reinitialization, permission denial/retry, auto advance, unsupported APIs, theme layouts and keyboard focus.

On this Windows host, Playwright WebKit exposes no `AudioContext`. Its project explicitly runs layout, calibration and unsupported-API recovery cases; its audio cases must run on a host with Web Audio support. Chromium and Firefox exercise the full audio pipeline. Mobile Chromium is viewport emulation, not an Android hardware qualification.

## Remaining release gates

The original quality plan remains the release checklist. This implementation must not be described as universally certified or as matching a dedicated hardware tuner's advertised accuracy.

1. Test actual Safari/iOS audio, Android microphones, built-in laptop inputs and stereo USB interfaces. Verify sample-clock error, permissions, interruptions and supported channels on each.
2. Score annotated real plucks, decays, vibrato, room noise, strong harmonics, ambiguous chords and low-bass recordings. Quantify end-to-end acquisition, release and response latency, coverage by pitch band, CPU/power use and sustained runs on slower devices. Synthetic accuracy does not establish these results.
3. Complete musical review of every artist/alternate preset against authoritative references; the added catalog checks establish structural consistency, not that every named artist tuning is historically correct. Frequencies below the supported range remain reference only.
4. Complete screen-reader, zoom and physical touch testing. Automated layout and focus checks are not a full WCAG conformance audit.
5. Qualify offline/PWA updating across an already-installed older release and repeat the production pipeline on the repository's pinned Node 24 runtime before public rollout.

No deployment or physical microphone qualification was performed by these edits. The source feature flag is enabled so the tuner will be available from KINS TOOLS in the next deployed build.
