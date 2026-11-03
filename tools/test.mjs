// Runs every *.test.mjs under src/ with node, one process per file.
// Exits 1 if any file fails. Usage: node tools/test.mjs
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function find(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return find(p);
    return e.name.endsWith('.test.mjs') ? [p] : [];
  });
}

const files = find(join(root, 'src')).sort();
if (!files.length) { console.error('no *.test.mjs files found'); process.exit(1); }

const failed = [];
for (const f of files) {
  const name = relative(root, f);
  console.log(`\n▶ ${name}`);
  const r = spawnSync(process.execPath, [f], { stdio: 'inherit', cwd: root });
  if (r.status !== 0) failed.push(name);
}

console.log(`\n${files.length - failed.length}/${files.length} test files passed`);
if (failed.length) {
  console.error('failed:\n' + failed.map((n) => '  ' + n).join('\n'));
  process.exit(1);
}
