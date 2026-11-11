// "My own voice": record a meditation script and play it back during the session.
// Recordings stay on this device, in IndexedDB.

const DB = "spiritlotto-voice";
const STORE = "recordings";

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(r?.result);
    t.onerror = () => reject(t.error);
  });
}

export const getRecording = (id) => tx("readonly", (s) => s.get(id)).catch(() => null);
export const saveRecording = (id, blob) => tx("readwrite", (s) => s.put(blob, id));
export const deleteRecording = (id) => tx("readwrite", (s) => s.delete(id));

export const canRecord = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

// Starts recording; returns { stop(): Promise<Blob> }.
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start();
  return {
    stop: () => new Promise((resolve) => {
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        resolve(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
      };
      rec.stop();
    }),
  };
}
