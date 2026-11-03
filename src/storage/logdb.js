// 오늘 기록: on-device IndexedDB ('hoohaa-log'). Photos are kept as Blobs here and never leave the device
// (the only way out is the user's own backup zip).
import { makeZip, readZip, ZipError } from './zip.js';

export const LOG_DB = 'hoohaa-log';
const STORES = ['profile', 'logs', 'races', 'gear', 'photos'];
let dbp = null;
function open() {
  return dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open(LOG_DB, 1);
    r.onupgradeneeded = () => { const db = r.result; for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' }); };
    // another tab deleting / upgrading the DB: let go so it isn't blocked, and reopen on the next call
    r.onsuccess = () => { const db = r.result; db.onversionchange = () => { db.close(); dbp = null; }; res(db); }; r.onerror = () => { dbp = null; rej(r.error); };
  }));
}
const req = q => new Promise((res, rej) => { q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
async function run(store, mode, f) { const db = await open(); return new Promise((res, rej) => { const t = db.transaction(store, mode); let out; Promise.resolve(f(t.objectStore(store))).then(v => { out = v; }); t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); }

// one readwrite transaction over several stores: every write lands, or none does.
// f(stores) must only queue IndexedDB requests (no awaiting other promises inside).
async function tx(names, f) {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(names, 'readwrite'), st = Object.fromEntries(names.map(n => [n, t.objectStore(n)]));
    t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('transaction aborted'));
    try { f(st); } catch (e) { try { t.abort(); } catch { /* already finished */ } rej(e); }
  });
}

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
// save a new or edited record together with its race and photo in one transaction (no half-saved record,
// no orphan race or photo when something fails). dropPhotoIds: photos the edit replaced.
export function saveLog({ log, race = null, photo = null, dropPhotoIds = [] }) {
  return tx(['logs', 'races', 'photos'], s => { if (photo) s.photos.put(photo); if (race) s.races.put(race); for (const id of dropPhotoIds) s.photos.delete(id); s.logs.put(log); });
}
// removes the record, its photos and its race (unless another record still points at that race)
export function deleteLog(log) {
  return tx(['logs', 'races', 'photos'], s => {
    for (const id of log.photoIds || []) s.photos.delete(id);
    s.logs.delete(log.id);
    const rid = log.data && log.data.raceId; if (!rid) return;
    const q = s.logs.getAll(); q.onsuccess = () => { if (!q.result.some(l => l.data && l.data.raceId === rid)) s.races.delete(rid); };
  });
}

// ---- backup: one zip = backup.json (all records) + photos/<id>.<ext> (+ photos/<id>.cutout.png) ----
const ext = t => /png/.test(t) ? 'png' : /webp/.test(t) ? 'webp' : 'jpg';
export async function exportZip() {
  const { profile, logs, races, gear } = await loadAll(), photos = await all('photos'), files = [], meta = [];
  for (const p of photos) {
    if (!p.blob) continue; // nothing to restore from
    const e = { id: p.id, file: `photos/${p.id}.${ext(p.blob && p.blob.type)}`, type: p.blob ? p.blob.type : '' };
    files.push({ name: e.file, data: new Uint8Array(await p.blob.arrayBuffer()) });
    if (p.cutoutBlob) { e.cutout = `photos/${p.id}.cutout.png`; files.push({ name: e.cutout, data: new Uint8Array(await p.cutoutBlob.arrayBuffer()) }); }
    meta.push(e);
  }
  const json = { app: 'hoohaa', kind: 'log-backup', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), profile, logs, races, gear, photos: meta };
  return makeZip([{ name: 'backup.json', data: new TextEncoder().encode(JSON.stringify(json, null, 1)) }, ...files]);
}
// errors whose message can be shown to the user as is (해요체)
export class BackupError extends Error { constructor(msg) { super(msg); this.name = 'BackupError'; } }
export const BACKUP_VERSION = 1;
const isId = v => typeof v === 'string' && v.length > 0;
// merge by id (existing records with the same id are replaced); returns counts.
// Everything is checked first and written in one transaction, so a bad file changes nothing.
export async function importZip(file) {
  let entries;
  try { entries = await readZip(new Uint8Array(await file.arrayBuffer())); }
  catch (e) { if (e instanceof ZipError) throw new BackupError(e.message); throw new BackupError('파일을 읽지 못했어요. 다시 골라 주세요'); }
  entries = entries.filter(e => !/(^|\/)__MACOSX\//.test(e.name));
  if (!entries.length) throw new BackupError('빈 zip 파일이에요. hoohaa에서 내보낸 백업 zip을 골라 주세요');
  // backup.json at the root, or one folder down when the backup was unzipped and zipped again as a folder
  const bj = entries.filter(e => e.name === 'backup.json' || /^[^/]+\/backup\.json$/.test(e.name)).sort((a, b) => a.name.length - b.name.length)[0];
  if (!bj) throw new BackupError('hoohaa 기록 백업이 아니에요. zip 안에 backup.json이 없어요');
  const pre = bj.name.slice(0, -'backup.json'.length), by = Object.fromEntries(entries.filter(e => e.name.startsWith(pre)).map(e => [e.name.slice(pre.length), e.data]));
  let j; try { j = JSON.parse(new TextDecoder().decode(bj.data)); } catch { throw new BackupError('backup.json이 깨져 있어서 읽지 못했어요'); }
  if (!j || typeof j !== 'object' || j.kind !== 'log-backup') throw new BackupError('hoohaa 기록 백업 파일이 아니에요');
  if (+j.version > BACKUP_VERSION) throw new BackupError('더 새로운 버전에서 만든 백업이에요. 앱을 새로고침한 뒤 다시 가져와 주세요');
  const list = k => { if (j[k] == null) return []; if (!Array.isArray(j[k])) throw new BackupError('backup.json 내용이 올바르지 않아요'); return j[k].filter(v => v && typeof v === 'object' && isId(v.id)); };
  const recs = { logs: list('logs'), races: list('races'), gear: list('gear') }, photos = []; let missing = 0;
  for (const p of list('photos')) {
    const d = isId(p.file) && by[p.file]; if (!d) { missing++; continue; }
    const rec = { id: p.id, blob: new Blob([d], { type: p.type || 'image/jpeg' }) };
    if (isId(p.cutout) && by[p.cutout]) rec.cutoutBlob = new Blob([by[p.cutout]], { type: 'image/png' });
    photos.push(rec);
  }
  const profile = j.profile && typeof j.profile === 'object' ? { ...PROFILE0, ...j.profile, id: 'me' } : null;
  try {
    await tx(['profile', 'logs', 'races', 'gear', 'photos'], s => {
      if (profile) s.profile.put(profile);
      for (const k of ['logs', 'races', 'gear']) for (const v of recs[k]) s[k].put(v);
      for (const p of photos) s.photos.put(p);
    });
  } catch (e) {
    console.error(e);
    throw new BackupError(e && e.name === 'QuotaExceededError' ? '기기 저장 공간이 부족해서 가져오지 못했어요. 아무것도 바뀌지 않았어요' : '기기 저장소에 쓰지 못했어요. 아무것도 바뀌지 않았어요');
  }
  const types = {}; for (const l of recs.logs) types[l.type] = (types[l.type] || 0) + 1;
  return { logs: recs.logs.length, types, races: recs.races.length, gear: recs.gear.length, photos: photos.length, missingPhotos: missing };
}
export function wipeLogDb() { return new Promise(res => { try { if (dbp) dbp.then(db => db.close()).catch(() => {}); dbp = null; const r = indexedDB.deleteDatabase(LOG_DB); r.onsuccess = r.onerror = r.onblocked = () => res(); } catch { res(); } }); }
