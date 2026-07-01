/**
 * BASE DE DATOS LOCAL (IndexedDB) — guarda las fichas del casting con
 * sus FOTOS (como Blobs) en el navegador. Sobrevive recargas y cierres.
 * Es por dispositivo/navegador (no se comparte entre equipos); para eso
 * haría falta una base en la nube.
 */
const DB = 'castellano-casting';
const STORE = 'models';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const out = fn(store);
    t.oncomplete = () => resolve(out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

/** Guarda/actualiza una ficha. Serializa solo lo persistible (blobs). */
export function saveModel(m) {
  const rec = {
    id: m.id, ord: m.ord ?? 0,
    instagram: m.instagram || '', nombre: m.nombre || '', telefono: m.telefono || '',
    altura: m.altura || '', edad: m.edad || '',
    photos: m.photos.map((p) => ({ file: p.file, name: p.name })).filter((p) => p.file),
  };
  return tx('readwrite', (s) => s.put(rec));
}

export function deleteModel(id) {
  return tx('readwrite', (s) => s.delete(id));
}

export function clearAll() {
  return tx('readwrite', (s) => s.clear());
}

/** Devuelve los registros crudos (con blobs), ordenados. */
export async function loadAll() {
  const recs = await tx('readonly', (s) => {
    const acc = [];
    s.openCursor().onsuccess = (e) => { const c = e.target.result; if (c) { acc.push(c.value); c.continue(); } };
    return acc;
  });
  recs.sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));
  return recs;
}
