const DEVICE_ID_KEY = 'kins_device_id';

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (_) {}
}

let cachedDeviceId = null;

export function getDeviceId() {
  if (cachedDeviceId) return cachedDeviceId;

  let existing = storageGet(DEVICE_ID_KEY);
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) {
    cachedDeviceId = existing;
    return cachedDeviceId;
  }

  const fresh =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });

  storageSet(DEVICE_ID_KEY, fresh);
  cachedDeviceId = fresh;
  return cachedDeviceId;
}
