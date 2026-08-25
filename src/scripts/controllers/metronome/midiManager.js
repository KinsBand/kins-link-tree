import { setMidiDeviceId, setMidiStatus } from './metroState.js';

let midiAccess = null;
let connectGen = 0;
let inputsCache = [];
let activeInput = null;

function dispatchMidiTap(detail) {
  try {
    window.dispatchEvent(new CustomEvent('kins:midi-tap', { detail }));
  } catch (e) {}
}

function dispatchMidiState(detail) {
  try {
    window.dispatchEvent(new CustomEvent('kins:midi-state', { detail }));
  } catch (e) {}
}

function onMidiMessage(msg) {
  const data = msg.data;
  if (!data || data.length < 3) return;
  const status = data[0] & 0xf0;
  const vel = data[2];
  if (status === 0x90 && vel > 0) {
    const note = data[1];
    if (note >= 35 && note <= 81) {
      dispatchMidiTap({ note, velocity: vel, source: 'midi', time: performance.now() });
    }
  }
}

function bindInput(input) {
  if (activeInput) {
    try { activeInput.onmidimessage = null; } catch (e) {}
  }
  activeInput = input;
  if (input) {
    input.onmidimessage = onMidiMessage;
    setMidiDeviceId(input.id);
  }
}

function enumerateInputs() {
  if (!midiAccess) return [];
  const list = [];
  try {
    for (const inp of midiAccess.inputs.values()) {
      list.push({ id: inp.id, name: inp.name || 'Unknown', manufacturer: inp.manufacturer || '' });
    }
  } catch (e) {}
  inputsCache = list;
  return list;
}

function handleStateChange() {
  enumerateInputs();
  dispatchMidiState({ inputs: inputsCache.slice(), activeId: activeInput ? activeInput.id : null });
  if (activeInput) {
    try {
      const still = midiAccess.inputs.get(activeInput.id);
      if (!still) {
        setMidiStatus('disconnected');
        activeInput = null;
        dispatchMidiState({ inputs: inputsCache.slice(), activeId: null, status: 'disconnected' });
      }
    } catch (e) {}
  }
}

export async function connectMidi(preferredId) {
  const gen = ++connectGen;
  if (!navigator.requestMIDIAccess) {
    setMidiStatus('unsupported');
    dispatchMidiState({ status: 'unsupported', inputs: [] });
    return { status: 'unsupported' };
  }
  setMidiStatus('connecting');
  dispatchMidiState({ status: 'connecting' });
  try {
    const access = await navigator.requestMIDIAccess({ sysex: false });
    if (gen !== connectGen) return { status: 'stale' };
    midiAccess = access;
    try { midiAccess.onstatechange = handleStateChange; } catch (e) {}
    const inputs = enumerateInputs();
    if (!inputs.length) {
      setMidiStatus('disconnected');
      dispatchMidiState({ status: 'disconnected', inputs });
      return { status: 'no-inputs', inputs };
    }
    let target = null;
    if (preferredId) {
      try { target = midiAccess.inputs.get(preferredId) || null; } catch (e) {}
    }
    if (!target) target = midiAccess.inputs.values().next().value || null;
    if (target) {
      bindInput(target);
      setMidiStatus('connected');
      dispatchMidiState({ status: 'connected', inputs, activeId: target.id });
      return { status: 'connected', inputs, activeId: target.id };
    }
    setMidiStatus('disconnected');
    return { status: 'disconnected', inputs };
  } catch (err) {
    if (gen !== connectGen) return { status: 'stale' };
    setMidiStatus('disconnected');
    dispatchMidiState({ status: 'disconnected', error: String(err) });
    return { status: 'error', error: err };
  }
}

export function selectMidiInput(id) {
  if (!midiAccess) return false;
  try {
    const inp = midiAccess.inputs.get(id);
    if (!inp) return false;
    bindInput(inp);
    setMidiStatus('connected');
    dispatchMidiState({ status: 'connected', inputs: inputsCache.slice(), activeId: id });
    return true;
  } catch (e) { return false; }
}

export function getMidiInputs() {
  return inputsCache.slice();
}

export function getActiveMidiId() {
  return activeInput ? activeInput.id : null;
}

export function disconnectMidi() {
  connectGen++;
  if (activeInput) {
    try { activeInput.onmidimessage = null; } catch (e) {}
    activeInput = null;
  }
  setMidiStatus('disconnected');
  setMidiDeviceId(null);
  dispatchMidiState({ status: 'disconnected', inputs: inputsCache.slice(), activeId: null });
}

export function isMidiSupported() {
  return !!navigator.requestMIDIAccess;
}
