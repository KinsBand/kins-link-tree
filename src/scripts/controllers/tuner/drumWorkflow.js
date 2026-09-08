import { DRUM_DEFAULTS, DRUM_DETECT, DRUM_STEPS } from '../../../settings/drumTuner.config.ts';
import { createReferenceTone } from './referenceTone.js';
import { drumReferenceSample } from './drumReference.js';
import { showToast } from '../toast.js';

const KEY = 'kins-tuner-drum-kit-v1';
export function crossingOrder(count) {
  const result = [], used = new Set();
  for (let i = 0; i < count; i++) for (const index of [i, (i + Math.floor(count / 2)) % count]) {
    if (!used.has(index)) { used.add(index); result.push(index); }
  }
  return result;
}
export function validKit(value) {
  return Array.isArray(value) && value.length > 0 && value.length <= 12 &&
    new Set(value.map(d => d?.id)).size === value.length && value.every(d => d &&
      typeof d.id === 'string' && /^[a-z0-9-]{1,30}$/.test(d.id) && typeof d.label === 'string' && d.label.length <= 40 &&
      ['tom', 'snare', 'kick'].includes(d.kind) && Number.isInteger(d.diameter) && d.diameter >= 6 && d.diameter <= 30 &&
      Number.isInteger(d.lugs) && d.lugs >= 4 && d.lugs <= 12 && ['batter', 'resonant', 'whole'].every(key => Number.isFinite(d[key]) && d[key] >= 45 && d[key] <= 500));
}
export function createDrumWorkflow(onChange, beforePreview = () => {}) {
  const events = new AbortController();
  const root = document.getElementById('drumWorkflow');
  const get = id => document.getElementById(id);
  let kit = DRUM_DEFAULTS.map(d => ({ ...d }));
  try { const saved = JSON.parse(localStorage.getItem(KEY)); if (validKit(saved)) kit = saved; } catch {}
  let selected = kit[0].id, step = 'batter', lug = 0, last = null, records = {}, listening = false;
  const reference = createReferenceTone(status => {
    root.classList.toggle('drum-reference-loading', status === 'loading');
    get('drumAudioStatus').textContent = status === 'loading' ? 'Loading drum recording…' : status === 'playing' ? `Playing ${drum()[step]} Hz reference` : 'Tap a lug to hear the target. Start to measure.';
  }, drumReferenceSample);
  const drum = () => kit.find(d => d.id === selected);
  function preview() {
    beforePreview();
    reference.play(drum().kind, drum()[step]).catch(() => {
      get('drumAudioStatus').textContent = 'Recording unavailable. Tap the lug to retry.';
      showToast('Drum recording could not play. Tap the lug to retry.', 'error');
    });
  }
  const recordKey = () => `${selected}:${step}`;
  function selectOptions() {
    get('drumSelect').replaceChildren(...kit.map(d => new Option(d.label, d.id)));
    get('drumSelect').value = selected;
  }
  function clearReading() { last = null; get('drumReading').innerHTML = '—<small>Hz · last tap</small>'; get('drumUseReading').disabled = true; }
  function changed() { reference.stop(); clearReading(); onChange(); render(); }
  function renderDiagram() {
    const current = drum(), readings = records[recordKey()] || {};
    const order = crossingOrder(current.lugs);
    const diagram = get('drumLugDiagram');
    diagram.replaceChildren();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 300 300'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<circle class="drum-hoop" cx="150" cy="150" r="105"/><circle class="drum-head" cx="150" cy="150" r="95"/><circle class="drum-hit" cx="150" cy="150" r="8"/>';
    diagram.append(svg);
    const center = document.createElement('span'); center.className = 'drum-diagram-label';
    center.textContent = step === 'whole' ? 'TAP CENTRE' : `${current.diameter}″ · ${current.lugs} LUGS`;
    diagram.append(center);
    if (step === 'whole') {
      const play = document.createElement('button'); play.type = 'button';
      play.className = 'drum-preview-center brutal-press'; play.id = 'drumPreview';
      play.textContent = '▶'; play.setAttribute('aria-label', 'Play whole drum target');
      diagram.append(play); return;
    }
    for (let i = 0; i < current.lugs; i++) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'drum-lug brutal-press';
      button.textContent = String(i + 1); button.dataset.lug = String(i);
      button.setAttribute('aria-label', `Lug ${i + 1}, step ${order.indexOf(i) + 1} in crossing order`);
      button.setAttribute('aria-pressed', String(i === lug));
      const matched = readings[i] && Math.abs(1200 * Math.log2(readings[i] / current[step])) <= DRUM_DETECT.toleranceCents;
      button.classList.toggle('matched', !!matched);
      if (matched) button.setAttribute('aria-label', button.getAttribute('aria-label') + ', matched on last tap');
      const angle = 2 * Math.PI * i / current.lugs - Math.PI / 2;
      button.style.left = `${50 + 40 * Math.cos(angle)}%`; button.style.top = `${50 + 40 * Math.sin(angle)}%`;
      diagram.append(button);
    }
  }
  function render() {
    const current = drum(), whole = step === 'whole';
    get('drumDiameter').value = current.diameter;
    get('drumLugCount').textContent = String(current.lugs);
    get('drumLugsMinus').disabled = current.lugs <= 4;
    get('drumLugsPlus').disabled = current.lugs >= 12;
    get('drumRemove').disabled = kit.length <= 1;
    get('drumRemove').setAttribute('aria-label', `Remove ${current.label}`);
    get('drumTargetHz').value = current[step];
    get('drumTargetField').firstChild.textContent = whole ? 'Whole-drum target (Hz)' : 'Lug target (Hz)';
    root.querySelectorAll('[data-drum-step]').forEach(button => {
      button.setAttribute('aria-current', button.dataset.drumStep === step ? 'step' : 'false');
    });
    get('drumNextLug').hidden = whole;
    get('drumNextStep').textContent = whole ? 'Next drum →' : step === 'batter' ? 'Next head →' : 'Check whole drum →';
    get('drumFeedback').textContent = listening ? (whole ? 'Strike centre.' : `Tap lug ${lug + 1}.`) : 'Tap to tune.';
    get('drumAdd').disabled = kit.length >= 12;
    renderDiagram(); progress();
  }
  function progress() {
    const readings = Object.values(records[recordKey()] || {});
    const matched = readings.filter(freq => Math.abs(1200 * Math.log2(freq / drum()[step])) <= DRUM_DETECT.toleranceCents).length;
    get('drumProgress').textContent = step === 'whole' ? '' : `${matched} / ${drum().lugs} matched`;
  }
  function update(reading) {
    const feedback = get('drumFeedback');
    if (reading.status === 'ok') {
      last = reading.freq;
      (records[recordKey()] ||= {})[step === 'whole' ? 'whole' : lug] = last;
      const cents = 1200 * Math.log2(last / drum()[step]);
      get('drumReading').innerHTML = `${last.toFixed(1)}<small>Hz · last tap</small>`;
      feedback.textContent = Math.abs(cents) <= DRUM_DETECT.toleranceCents ? 'Matched on last tap' : `${cents < 0 ? 'Tighten' : 'Loosen'} · ${Math.abs(cents).toFixed(0)}¢`;
      get('drumUseReading').disabled = false;
      const focused = document.activeElement?.getAttribute('data-lug');
      renderDiagram(); progress();
      if (focused !== null) root.querySelector(`[data-lug="${focused}"]`)?.focus({ preventScroll: true });
    } else if (reading.status === 'clipped') feedback.textContent = 'Too loud — tap gently.';
    else if (reading.status === 'uncertain') feedback.textContent = 'No clear pitch. Tap again.';
    else if (reading.status === 'settling') feedback.textContent = 'Listening…';
  }
  root.addEventListener('change', event => {
    const input = event.target, current = drum();
    if (input.id === 'drumSelect') { selected = input.value; lug = 0; step = 'batter'; }
    else if (input.id === 'drumDiameter' || input.id === 'drumTargetHz') {
      if (!input.checkValidity() || !Number.isFinite(input.valueAsNumber)) { input.reportValidity(); input.value = input.id === 'drumDiameter' ? current.diameter : current[step]; return; }
      if (input.id === 'drumDiameter') current.diameter = input.valueAsNumber;
      else current[step] = input.valueAsNumber;
    } else return;
    const notice = get('drumNotice'); if (notice) notice.textContent = 'Unsaved changes';
    changed();
  }, { signal: events.signal });
  function handleClick(event) {
    const button = event.target.closest('button'); if (!button || button.disabled) return;
    if (button.dataset.lug !== undefined) { lug = Number(button.dataset.lug); changed(); preview(); root.querySelector(`[data-lug="${lug}"]`)?.focus({ preventScroll: true }); }
    else if (button.id === 'drumPreview') preview();
    else if (button.id === 'drumLugsMinus' || button.id === 'drumLugsPlus') {
      drum().lugs = Math.max(4, Math.min(12, drum().lugs + (button.id === 'drumLugsPlus' ? 1 : -1)));
      lug = 0; delete records[`${selected}:batter`]; delete records[`${selected}:resonant`];
      changed(); get('drumNotice').textContent = 'Unsaved changes';
    } else if (button.id === 'drumRemove' && kit.length > 1) {
      const index = kit.findIndex(d => d.id === selected), removed = drum().label;
      for (const key of Object.keys(records)) if (key.startsWith(selected + ':')) delete records[key];
      kit.splice(index, 1); selected = kit[Math.min(index, kit.length - 1)].id; step = 'batter'; lug = 0;
      selectOptions(); changed(); get('drumNotice').textContent = `${removed} removed · Save to keep changes`;
      get('drumSelect').focus();
    }
    else if (button.dataset.drumStep) { step = button.dataset.drumStep; lug = 0; changed(); }
    else if (button.id === 'drumNextLug') { const order = crossingOrder(drum().lugs); lug = order[(order.indexOf(lug) + 1) % order.length]; changed(); }
    else if (button.id === 'drumNextStep') {
      if (step === 'whole') { selected = kit[(kit.findIndex(d => d.id === selected) + 1) % kit.length].id; step = 'batter'; selectOptions(); }
      else step = DRUM_STEPS[DRUM_STEPS.indexOf(step) + 1];
      lug = 0; changed();
    } else if (button.id === 'drumUseReading' && last) {
      drum()[step] = Math.round(last * 2) / 2;
      const notice = get('drumNotice'); if (notice) notice.textContent = 'Target updated'; changed();
    } else if (button.id === 'drumAdd') {
      if (kit.length >= 12) return;
      let number = 1;
      while (kit.some(d => d.id === `tom-${number}` || d.label === `Tom ${number}`)) number++;
      kit.push({ ...DRUM_DEFAULTS[0], id: `tom-${number}`, label: `Tom ${number}` });
      selected = kit[kit.length - 1].id; step = 'batter'; lug = 0; selectOptions(); changed();
      const notice = get('drumNotice'); if (notice) notice.textContent = 'Tom added';
    } else if (button.id === 'drumSave') {
      try { localStorage.setItem(KEY, JSON.stringify(kit)); showToast('Kit saved', 'success'); const notice = get('drumNotice'); if (notice) notice.textContent = 'Kit saved'; }
      catch { showToast('Your browser could not save this kit. Allow site storage and retry.', 'error'); }
    }
  }
  root.addEventListener('click', handleClick, { signal: events.signal });
  for (const id of ['drumAdd', 'drumSave']) get(id).addEventListener('click', handleClick, { signal: events.signal });
  selectOptions(); render();
  return {
    update, target: () => drum()[step],
    setListening(value) { if (value) reference.stop(); listening = value; clearReading(); render(); },
    show(value) { if (!value) reference.stop(); root.hidden = !value; },
    stopReference() { reference.stop(); },
    destroy() { reference.destroy(); events.abort(); },
  };
}
