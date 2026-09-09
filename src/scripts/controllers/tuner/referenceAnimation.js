/** SVG playback follows the AudioContext clock, including staggered strums. */
export function createReferenceAnimation() {
  let frame = null, figure = null, observer = null;
  const active = new Map();
  function stop() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    observer?.disconnect(); observer = null;
    for (const elements of active.values()) elements.forEach(el => el.classList.remove('reference-vibrating'));
    active.clear();
    figure?.classList.remove('reference-offscreen'); figure = null;
  }
  function play(container, { timeline, currentTime }) {
    stop(); figure = container;
    figure.setAttribute('data-anim-gated', '');
    observer = new IntersectionObserver(([entry]) => figure?.classList.toggle('reference-offscreen', !entry.isIntersecting));
    observer.observe(figure);
    const strings = timeline.map(voice => ({ ...voice, elements: [
      ...figure.querySelectorAll(`.tuner-peg[data-string-index="${voice.stringIndex}"], .str-s${voice.stringIndex}`),
    ] }));
    function tick() {
      frame = null;
      const now = currentTime();
      for (const voice of strings) {
        const playing = now >= voice.start && now < voice.end;
        if (playing && !active.has(voice)) {
          voice.elements.forEach(el => el.classList.add('reference-vibrating'));
          active.set(voice, voice.elements);
        } else if (!playing && active.has(voice)) {
          voice.elements.forEach(el => el.classList.remove('reference-vibrating'));
          active.delete(voice);
        }
      }
      if (strings.some(voice => now < voice.end)) frame = requestAnimationFrame(tick);
      else stop();
    }
    frame = requestAnimationFrame(tick);
  }
  return { play, stop };
}
