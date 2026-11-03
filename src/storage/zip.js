// Minimal ZIP writer (STORE, no compression) + reader for the record backup. Photos are already JPEG/PNG,
// so deflate would gain little; keeping it dependency-free fits the no-build app.
// The reader also takes deflate entries (a backup unzipped and re-zipped by the OS) and checks every CRC,
// so a cut-off or damaged file is reported instead of being half-restored.
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
const enc = new TextEncoder(), dec = new TextDecoder();

// errors whose message can be shown to the user as is (해요체)
export class ZipError extends Error { constructor(msg) { super(msg); this.name = 'ZipError'; } }
export const ZIP_MSG = {
  notZip: 'zip 파일이 아니에요. hoohaa에서 내보낸 백업 zip을 골라 주세요',
  broken: 'zip 파일이 깨져 있어요. 내려받기가 끝까지 됐는지 확인하고 다시 해 보세요',
  method: '이 zip은 지원하지 않는 방식으로 압축돼 있어요. hoohaa에서 내보낸 백업 zip을 그대로 골라 주세요',
};

// files: [{ name, data: Uint8Array }] → Blob (application/zip)
export function makeZip(files) {
  const parts = [], central = []; let off = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = f.data, crc = crc32(data), h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), name); off += 30 + name.length + data.length;
  }
  const cs = central.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
}

async function inflateRaw(u8) {
  if (typeof DecompressionStream !== 'function') throw new ZipError(ZIP_MSG.method);
  try { return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()); }
  catch { throw new ZipError(ZIP_MSG.broken); }
}

// Uint8Array → Promise<[{ name, data }]> (file entries only; folders are skipped).
// Throws ZipError (Korean message) for anything that is not a readable zip.
export async function readZip(u8) {
  if (!(u8 instanceof Uint8Array) || u8.length < 22) throw new ZipError(ZIP_MSG.notZip);
  const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), len = u8.length; let e = -1;
  for (let i = len - 22; i >= Math.max(0, len - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new ZipError(v.getUint32(0, true) === 0x04034b50 ? ZIP_MSG.broken : ZIP_MSG.notZip);
  const n = v.getUint16(e + 10, true); let p = v.getUint32(e + 16, true); const out = [];
  const fits = (at, size) => at >= 0 && at + size <= len;
  for (let k = 0; k < n; k++) {
    if (!fits(p, 46) || v.getUint32(p, true) !== 0x02014b50) throw new ZipError(ZIP_MSG.broken);
    const flags = v.getUint16(p + 8, true), method = v.getUint16(p + 10, true), crc = v.getUint32(p + 16, true), csize = v.getUint32(p + 20, true), size = v.getUint32(p + 24, true);
    const nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
    if (!fits(p + 46, nl)) throw new ZipError(ZIP_MSG.broken);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nl)); p += 46 + nl + xl + cl;
    if (name.endsWith('/')) continue;
    if (flags & 1) throw new ZipError(ZIP_MSG.method); // encrypted
    if (!fits(lo, 30) || v.getUint32(lo, true) !== 0x04034b50) throw new ZipError(ZIP_MSG.broken);
    const ds = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true);
    if (!fits(ds, csize)) throw new ZipError(ZIP_MSG.broken);
    const raw = u8.slice(ds, ds + csize);
    let data;
    if (method === 0) data = raw; else if (method === 8) data = await inflateRaw(raw); else throw new ZipError(ZIP_MSG.method);
    if (data.length !== size || crc32(data) !== crc) throw new ZipError(ZIP_MSG.broken);
    out.push({ name, data });
  }
  return out;
}
