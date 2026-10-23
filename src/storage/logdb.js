// 오늘 기록: on-device IndexedDB ('hoohaa-log'). Photos are kept as Blobs here and never leave the device
// (the only way out is the user's own backup zip).
import { makeZip, readZip } from './zip.js';

export const LOG_DB = 'hoohaa-log';
const STORES = ['profile', 'logs', 'races', 'gear', 'photos'];
let dbp = null;
function open() {
  return dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open(LOG_DB, 1);
    r.onupgradeneeded = () => { const db = r.result; for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' }); };
    r.onsuccess = () => res(r.result); r.onerror = () => { dbp = null; rej(r.error); };
  }));
}
const req = q => new Promise((res, rej) => { q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
async function run(store, mode, f) { const db = await open(); return new Promise((res, rej) => { const t = db.transaction(store, mode); let out; Promise.resolve(f(t.objectStore(store))).then(v => { out = v; }); t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); }

export const uid = p => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const all = s => run(s, 'readonly', st => req(st.getAll()));
export const get = (s, id) => run(s, 'readonly', st => req(st.get(id)));
export const put = (s, v) => run(s, 'readwrite', st => req(st.put(v)));
export const del = (s, id) => run(s, 'readwrite', st => req(st.delete(id)));

export const PROFILE0 = { id: 'me', startDate: '', dayCountMode: 'custom', defaultTemplateId: '', handle: '' };
export async function getProfile() { return { ...PROFILE0, ...((await get('profile', 'me')) || {}) }; }
export const saveProfile = p => put('profile', { ...PROFILE0, ...p, id: 'me' });
export async function loadAll() { const [profile, logs, races, gear] = await Promise.all([getProfile(), all('logs'), all('races'), all('gear')]); return { profile, logs, races, gear }; }

// photo: { id, blob, cutoutBlob? }
export async function addPhoto(blob) { const id = uid('ph'); await put('photos', { id, blob }); return id; }
export async function deleteLog(log) { for (const id of log.photoIds || []) await del('photos', id); await del('logs', log.id); }

// ---- backup: one zip = backup.json (all records) + photos/<id>.<ext> (+ photos/<id>.cutout.png) ----
const ext = t => /png/.test(t) ? 'png' : /webp/.test(t) ? 'webp' : 'jpg';
export async function exportZip() {
  const { profile, logs, races, gear } = await loadAll(), photos = await all('photos'), files = [], meta = [];
  for (const p of photos) {
    const e = { id: p.id, file: `photos/${p.id}.${ext(p.blob && p.blob.type)}`, type: p.blob ? p.blob.type : '' };
    if (p.blob) files.push({ name: e.file, data: new Uint8Array(await p.blob.arrayBuffer()) });
    if (p.cutoutBlob) { e.cutout = `photos/${p.id}.cutout.png`; files.push({ name: e.cutout, data: new Uint8Array(await p.cutoutBlob.arrayBuffer()) }); }
    meta.push(e);
  }
  const json = { app: 'hoohaa', kind: 'log-backup', version: 1, exportedAt: new Date().toISOString(), profile, logs, races, gear, photos: meta };
  return makeZip([{ name: 'backup.json', data: new TextEncoder().encode(JSON.stringify(json, null, 1)) }, ...files]);
}
// merge by id (existing records with the same id are replaced); returns counts
export async function importZip(file) {
  const u8 = new Uint8Array(await file.arrayBuffer()), entries = readZip(u8), by = Object.fromEntries(entries.map(e => [e.name, e.data]));
  if (!by['backup.json']) throw new Error('backup.json이 없어요');
  const j = JSON.parse(new TextDecoder().decode(by['backup.json']));
  if (j.kind !== 'log-backup') throw new Error('hoohaa 기록 백업 파일이 아니에요');
  if (j.profile) await saveProfile(j.profile);
  for (const s of ['logs', 'races', 'gear']) for (const v of j[s] || []) if (v && v.id) await put(s, v);
  let n = 0; for (const p of j.photos || []) { const d = by[p.file]; if (!d) continue; const rec = { id: p.id, blob: new Blob([d], { type: p.type || 'image/jpeg' }) }; if (p.cutout && by[p.cutout]) rec.cutoutBlob = new Blob([by[p.cutout]], { type: 'image/png' }); await put('photos', rec); n++; }
  return { logs: (j.logs || []).length, races: (j.races || []).length, gear: (j.gear || []).length, photos: n };
}
export function wipeLogDb() { return new Promise(res => { try { if (dbp) dbp.then(db => db.close()).catch(() => {}); dbp = null; const r = indexedDB.deleteDatabase(LOG_DB); r.onsuccess = r.onerror = r.onblocked = () => res(); } catch { res(); } }); }
