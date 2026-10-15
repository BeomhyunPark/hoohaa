export const LS = (k, v) => {
  try {
    if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null');
    if (v === null) { localStorage.removeItem(k); return true; }
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch {
    return null;
  }
};

export const idb = (() => {
  let p;
  const open = () => p || (p = new Promise((res, rej) => {
    const r = indexedDB.open('hoohaa', 1);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains('photos')) r.result.createObjectStore('photos');
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = (m, f) => open().then(db => new Promise((res, rej) => {
    const t = db.transaction('photos', m), s = t.objectStore('photos'), q = f(s);
    t.oncomplete = () => res(q && q.result);
    t.onerror = () => rej(t.error);
  }));
  return {
    put: (k, v) => tx('readwrite', s => s.put(v, k)).catch(() => {}),
    get: k => tx('readonly', s => s.get(k)).catch(() => null),
    del: k => tx('readwrite', s => s.delete(k)).catch(() => {}),
    clear: () => tx('readwrite', s => s.clear()).catch(() => {}),
  };
})();

const WIPE_TEXT = '이 기기에 저장된 입력, 편집 내용, 템플릿, 앱 안의 사진을 지울까요?\n사진 앱에 이미 저장한 이미지는 지워지지 않아요.';

export async function wipeDevice() {
  if (!confirm(WIPE_TEXT)) return false;
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('runtier:')) keys.push(k);
    }
    for (const k of keys) localStorage.removeItem(k);
  } catch { /* storage unavailable */ }
  try { await idb.clear(); } catch { /* database unavailable */ }
  location.reload();
  return true;
}
