// Client-side IndexedDB storage fallback for GitHub Pages or offline demo mode
const DB_NAME = 'quickshare_db';
const DB_VERSION = 1;
const STORE_NAME = 'transfers';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveClientTransfer(fileRecord, fileBlob) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = {
        ...fileRecord,
        id: fileRecord.transferId || fileRecord.id,
        blob: fileBlob,
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed:', err);
    return null;
  }
}

export async function getClientTransfer(idOrCode) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        const found = all.find((f) => f.id === idOrCode || f.transferId === idOrCode || f.shortCode === idOrCode);
        resolve(found || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('IndexedDB get failed:', err);
    return null;
  }
}

export async function getAllClientTransfers() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        const now = Date.now();
        // Filter out expired items
        const valid = all.filter((item) => {
          if (!item.expiresAt) return true;
          return new Date(item.expiresAt).getTime() > now;
        });
        resolve(valid.map(({ blob, ...meta }) => meta));
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

export async function deleteClientTransfer(id) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}
