/* ==========================================================================
   KINS Metronome — Dedicated Worker Ticker (cwilso "A Tale of Two Clocks")

   Runs on a separate thread so its setInterval stays at 25ms even when
   the main thread is throttled to 1000ms backgrounded (Chrome/Safari
   intensive throttling). The audio scheduling itself stays on the main
   thread (AudioContext lives there) — only wake-ups are delegated.

   Protocol:
     main -> worker: "start" | "stop" | { interval: number } | { type:"start"|"stop", interval? }
     worker -> main: "tick" (every interval ms) + "hi there" handshake

   Hardened against stacked intervals (classic Wilson bug: double start
   stacks setInterval). Always clear before start.

   Fallback: if this file fails CSP / import, audioEngine.js falls back
   to main-thread setInterval seamlessly.
   ========================================================================== */

var timerID = null;
var interval = 25;

function tick() {
  postMessage('tick');
}

function startTimer() {
  stopTimer();
  timerID = setInterval(tick, interval);
}

function stopTimer() {
  if (timerID !== null) {
    clearInterval(timerID);
    timerID = null;
  }
}

self.onmessage = function (e) {
  var data = e.data;
  // Support string protocol ("start"/"stop") and object protocol ({interval} / {type:"start"})
  if (data === 'start' || (data && data.type === 'start') || (data && data.cmd === 'start')) {
    if (data && typeof data.interval === 'number' && data.interval > 0) {
      interval = data.interval;
    }
    startTimer();
    return;
  }
  if (data === 'stop' || (data && data.type === 'stop') || (data && data.cmd === 'stop')) {
    stopTimer();
    return;
  }
  // { interval: 25 } live update (Wilson original)
  if (data && typeof data.interval === 'number' && data.interval > 0) {
    interval = data.interval;
    if (timerID !== null) {
      // Restart with new cadence — no stacking
      startTimer();
    }
    return;
  }
};

// Handshake — matches Wilson original "hi there" for onmessage else branch logging
postMessage('hi there');
