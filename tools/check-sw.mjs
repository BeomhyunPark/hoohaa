// Checks sw.js cache lists against the repo. Usage: node tools/check-sw.mjs
// 1. Every path in SHELL and ON_USE exists.
// 2. Every local module reachable by import from src/editor/editor.js and
//    src/app/*.js (static or dynamic, followed transitively) is in SHELL or ON_USE.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const errors = [];

function list(name) {
  const m = sw.match(new RegExp(`const ${name}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
  if (!m) { errors.push(`sw.js: ${name} list not found`); return []; }
  return [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
}

const shell = list('SHELL');
const onUse = list('ON_USE');
const cached = new Set([...shell, ...onUse]);

// 1. Listed files exist. A path ending in '/' means its index.html.
for (const [name, paths] of [['SHELL', shell], ['ON_USE', onUse]]) {
  for (const p of paths) {
    const file = join(root, p.endsWith('/') ? p + 'index.html' : p);
    if (!existsSync(file) || !statSync(file).isFile()) errors.push(`sw.js ${name}: ${p} does not exist`);
  }
}

// 2. Local imports are cached.
const importRe = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"`])([^'"`]+)\1/g;
const toUrl = (abs) => '/' + relative(root, abs).split(sep).join('/');

const entries = [
  join(root, 'src/editor/editor.js'),
  ...readdirSync(join(root, 'src/app')).filter((f) => f.endsWith('.js')).map((f) => join(root, 'src/app', f)),
];
const seen = new Set();
const queue = entries.map((f) => ({ file: f, from: null }));
while (queue.length) {
  const { file, from } = queue.shift();
  if (seen.has(file)) continue;
  seen.add(file);
  const url = toUrl(file);
  if (!existsSync(file)) { errors.push(`${from}: imports ${url}, which does not exist`); continue; }
  if (!cached.has(url)) errors.push(`${url}${from ? ` (imported by ${from})` : ''} is not in sw.js SHELL or ON_USE`);
  const src = readFileSync(file, 'utf8');
  for (const [, , spec] of src.matchAll(importRe)) {
    if (spec.includes('${')) continue;
    let target;
    if (spec.startsWith('./') || spec.startsWith('../')) target = resolve(dirname(file), spec);
    else if (spec.startsWith('/') && !spec.startsWith('//')) target = join(root, spec);
    else continue; // bare or remote specifier
    queue.push({ file: target, from: url });
  }
}

if (errors.length) {
  console.error(errors.map((e) => '✗ ' + e).join('\n'));
  console.error(`\ncheck-sw: ${errors.length} problem(s)`);
  process.exit(1);
}
console.log(`check-sw ok · ${shell.length} SHELL + ${onUse.length} ON_USE paths exist · ${seen.size} imported modules cached`);
