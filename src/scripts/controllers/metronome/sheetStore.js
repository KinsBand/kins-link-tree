const DB_NAME = 'kins-metro-sheets';
const STORE = 'sheets';
const DB_VERSION = 1;

let dbPromise = null;

function keyFor(songKey, instrument) {
  return `${songKey}|${instrument}`;
}

export function isSheetStoreAvailable() {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch (e) {
    return false;
  }
}

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('idb open failed'));
    } catch (e) {
      reject(e);
    }
  });
  return dbPromise;
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function requestToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('idb request failed'));
  });
}

export async function putSheetFile(songKey, instrument, file) {
  if (!isSheetStoreAvailable()) throw new Error('idb unavailable');
  const db = await openDb();
  const record = {
    blob: file,
    name: file.name,
    mime: file.type || '',
    size: file.size,
    instrument,
    savedAt: Date.now()
  };
  await requestToPromise(tx(db, 'readwrite').put(record, keyFor(songKey, instrument)));
  return record;
}

export async function getSheetFile(songKey, instrument) {
  if (!isSheetStoreAvailable()) return null;
  const db = await openDb();
  const rec = await requestToPromise(tx(db, 'readonly').get(keyFor(songKey, instrument)));
  return rec || null;
}

export async function deleteSheetFile(songKey, instrument) {
  if (!isSheetStoreAvailable()) return;
  const db = await openDb();
  await requestToPromise(tx(db, 'readwrite').delete(keyFor(songKey, instrument)));
}

export async function estimateUsage() {
  if (!isSheetStoreAvailable()) return null;
  const db = await openDb();
  return requestToPromise(tx(db, 'readonly').count());
}
