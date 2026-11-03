import assert from 'node:assert/strict';
import { makeZip, readZip, crc32, ZipError, ZIP_MSG } from './zip.js';
import { importZip, BackupError } from './logdb.js';
const te = new TextEncoder(), u8 = async b => new Uint8Array(await b.arrayBuffer());
const rejects = (p, msg, Cls = ZipError) => assert.rejects(p, e => e instanceof Cls && (!msg || e.message === msg) && /요/.test(e.message));

assert.equal(crc32(te.encode('123456789')), 0xCBF43926);
const files = [{ name: 'backup.json', data: te.encode('{"a":"한글"}') }, { name: 'photos/p1.jpg', data: new Uint8Array([1, 2, 3, 255]) }];
const z = await u8(makeZip(files)), back = await readZip(z);
assert.deepEqual(back.map(f => f.name), ['backup.json', 'photos/p1.jpg']); assert.equal(new TextDecoder().decode(back[0].data), '{"a":"한글"}'); assert.deepEqual([...back[1].data], [1, 2, 3, 255]);
// big binary round trip (a photo-sized blob, every byte value)
const big = new Uint8Array(3 * 1024 * 1024); for (let i = 0; i < big.length; i++) big[i] = (i * 31 + (i >> 9)) & 255;
const bb = await readZip(await u8(makeZip([{ name: 'photos/big.jpg', data: big }]))); assert.equal(bb[0].data.length, big.length); assert.equal(crc32(bb[0].data), crc32(big));
// a subarray view (byteOffset ≠ 0) reads the same
const pad = new Uint8Array(z.length + 7); pad.set(z, 7); assert.equal((await readZip(pad.subarray(7))).length, 2);

// ---- 깨진 zip / 빈 파일 / zip 아님 → 한국어(해요체) ZipError, never a RangeError ----
await rejects(readZip(new Uint8Array(0)), ZIP_MSG.notZip);
await rejects(readZip(te.encode('hello, this is not a zip file at all, really')), ZIP_MSG.notZip);
await rejects(readZip(z.slice(0, z.length - 30)), ZIP_MSG.broken); // cut off at the end (download stopped)
for (let cut = 1; cut < z.length; cut += 7) await assert.rejects(readZip(z.slice(0, cut)), ZipError); // any truncation
const flip = z.slice(); flip[30 + 11 + 3] ^= 0xFF; await rejects(readZip(flip), ZIP_MSG.broken); // one byte damaged → CRC mismatch
const badOff = z.slice(), ev = new DataView(badOff.buffer), eo = badOff.length - 22; ev.setUint32(eo + 16, 0xFFFFFF, true); await rejects(readZip(badOff), ZIP_MSG.broken); // central dir out of range
const badLocal = z.slice(), cv = new DataView(badLocal.buffer); cv.setUint32(cv.getUint32(eo + 16, true) + 42, 0xFFFFFF, true); await rejects(readZip(badLocal), ZIP_MSG.broken);

// ---- 빈 zip: 읽기는 되고 entry 0개 ----
assert.deepEqual(await readZip(await u8(makeZip([]))), []);

// ---- 다른 앱 zip: deflate entry, folders, encrypted, unknown method ----
async function zipWith(name, data, { method = 0, flags = 0x0800, size = data.length, crcOf = data } = {}) {
  const n = te.encode(name), h = new DataView(new ArrayBuffer(30)), c = new DataView(new ArrayBuffer(46)), e = new DataView(new ArrayBuffer(22)), crc = crc32(crcOf);
  h.setUint32(0, 0x04034b50, true); h.setUint16(6, flags, true); h.setUint16(8, method, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, size, true); h.setUint16(26, n.length, true);
  c.setUint32(0, 0x02014b50, true); c.setUint16(8, flags, true); c.setUint16(10, method, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, size, true); c.setUint16(28, n.length, true);
  const off = 30 + n.length + data.length; e.setUint32(0, 0x06054b50, true); e.setUint16(8, 1, true); e.setUint16(10, 1, true); e.setUint32(12, 46 + n.length, true); e.setUint32(16, off, true);
  return u8(new Blob([h, n, data, c, n, e]));
}
const plain = te.encode('{"kind":"log-backup","version":1,"logs":[]} '.repeat(50));
const deflated = await u8(new Response(new Blob([plain]).stream().pipeThrough(new CompressionStream('deflate-raw'))));
const dz = await readZip(await zipWith('backup.json', deflated, { method: 8, size: plain.length, crcOf: plain }));
assert.equal(new TextDecoder().decode(dz[0].data), new TextDecoder().decode(plain)); // macOS/Windows "압축하기"로 다시 묶은 백업도 읽음
await rejects(readZip(await zipWith('backup.json', deflated.slice(0, 10), { method: 8, size: plain.length, crcOf: plain })), ZIP_MSG.broken);
assert.deepEqual(await readZip(await zipWith('photos/', new Uint8Array(0))), []); // folder entry skipped
await rejects(readZip(await zipWith('a.txt', te.encode('x'), { flags: 1 })), ZIP_MSG.method); // encrypted
await rejects(readZip(await zipWith('a.txt', te.encode('x'), { method: 12 })), ZIP_MSG.method); // bzip2
console.log('zip ok');

// ---- importZip: every bad file is refused before anything is written (no IndexedDB needed to reach these) ----
const zipOf = async (fs) => makeZip(fs.map(([name, s]) => ({ name, data: typeof s === 'string' ? te.encode(s) : s })));
const imp = async (blob, msg) => rejects(importZip(blob), msg, BackupError);
await imp(new Blob([]), ZIP_MSG.notZip);
await imp(new Blob(['PK garbage']), ZIP_MSG.notZip);
await imp(new Blob([z.slice(0, z.length - 30)]), ZIP_MSG.broken);
await imp(await zipOf([]), '빈 zip 파일이에요. hoohaa에서 내보낸 백업 zip을 골라 주세요');
await imp(await zipOf([['__MACOSX/._backup.json', 'x']]), '빈 zip 파일이에요. hoohaa에서 내보낸 백업 zip을 골라 주세요');
await imp(await zipOf([['readme.txt', 'other app'], ['img/a.png', new Uint8Array([1])]]), 'hoohaa 기록 백업이 아니에요. zip 안에 backup.json이 없어요');
await imp(await zipOf([['a/b/backup.json', '{}']]), 'hoohaa 기록 백업이 아니에요. zip 안에 backup.json이 없어요'); // too deep: not ours
await imp(await zipOf([['backup.json', '{not json']]), 'backup.json이 깨져 있어서 읽지 못했어요');
await imp(await zipOf([['backup.json', 'null']]), 'hoohaa 기록 백업 파일이 아니에요');
await imp(await zipOf([['backup.json', '{"kind":"something-else"}']]), 'hoohaa 기록 백업 파일이 아니에요');
await imp(await zipOf([['backup.json', '{"kind":"log-backup","version":99}']]), '더 새로운 버전에서 만든 백업이에요. 앱을 새로고침한 뒤 다시 가져와 주세요');
await imp(await zipOf([['backup.json', '{"kind":"log-backup","version":1,"logs":{"id":"x"}}']]), 'backup.json 내용이 올바르지 않아요');
console.log('import guards ok');
