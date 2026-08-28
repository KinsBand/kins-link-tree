/**
 * Safe Storage Abstraction — Kins Official
 * Gracefully handles localStorage / sessionStorage in SSR, private browsing,
 * and restricted iframe sandbox environments with an in-memory fallback.
 */

const memoryStore = new Map();

function getStorage(type = 'local') {
  if (typeof window === 'undefined') return null;
  try {
    const storage = type === 'session' ? window.sessionStorage : window.localStorage;
    // Probe check for security restrictions
    const testKey = '__kins_storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return storage;
  } catch (e) {
    return null;
  }
}

export function safeGet(key, fallback = null, type = 'local') {
  const storage = getStorage(type);
  if (storage) {
    try {
      const val = storage.getItem(key);
      return val !== null ? val : fallback;
    } catch (e) {
      // Fall through to memoryStore
    }
  }
  return memoryStore.has(`${type}:${key}`) ? memoryStore.get(`${type}:${key}`) : fallback;
}

export function safeSet(key, value, type = 'local') {
  const storage = getStorage(type);
  const strVal = String(value);
  if (storage) {
    try {
      storage.setItem(key, strVal);
      return true;
    } catch (e) {
      // Fall through to memoryStore
    }
  }
  memoryStore.set(`${type}:${key}`, strVal);
  return true;
}

export function safeRemove(key, type = 'local') {
  const storage = getStorage(type);
  if (storage) {
    try {
      storage.removeItem(key);
    } catch (e) {
      // Fall through
    }
  }
  memoryStore.delete(`${type}:${key}`);
}

export function safeClear(type = 'local') {
  const storage = getStorage(type);
  if (storage) {
    try {
      storage.clear();
    } catch (e) {
      // Fall through
    }
  }
  for (const k of memoryStore.keys()) {
    if (k.startsWith(`${type}:`)) {
      memoryStore.delete(k);
    }
  }
}

export default {
  getItem: safeGet,
  setItem: safeSet,
  removeItem: safeRemove,
  clear: safeClear
};
