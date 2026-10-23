import assert from 'node:assert/strict';
import { makeZip, readZip, crc32 } from './zip.js';
assert.equal(crc32(new TextEncoder().encode('123456789')), 0xCBF43926);
const files = [{ name: 'backup.json', data: new TextEncoder().encode('{"a":"한글"}') }, { name: 'photos/p1.jpg', data: new Uint8Array([1, 2, 3, 255]) }];
const z = new Uint8Array(await makeZip(files).arrayBuffer()), back = readZip(z);
assert.deepEqual(back.map(f => f.name), ['backup.json', 'photos/p1.jpg']); assert.equal(new TextDecoder().decode(back[0].data), '{"a":"한글"}'); assert.deepEqual([...back[1].data], [1, 2, 3, 255]);
console.log('zip ok');
