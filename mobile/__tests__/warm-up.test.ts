// test-utils/warm-up.ts의 목록이 화면이 실제로 쓰는 부품을 다 담고 있는지 본다.
// 빠진 것이 있으면 그 부품을 불러오는 시간이 다시 화면 테스트 파일의 첫 테스트에 얹힌다(CI에서 5초 제한을 넘긴 원인).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { WARMED } from '../test-utils/warm-up';

const root = join(__dirname, '..');

/** 화면을 그리는 소스 파일(.tsx): App.tsx와 src/ 아래 전부. */
function screenFiles(dir = join(root, 'src')): string[] {
  const found = dir === join(root, 'src') ? [join(root, 'App.tsx')] : [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...screenFiles(path));
    else if (entry.name.endsWith('.tsx')) found.push(path);
  }
  return found;
}

/** 파일이 'react-native'에서 값으로 가져오는 이름들. `type X`는 뺀다(불러올 것이 없다). */
function reactNativeImports(source: string): string[] {
  const names: string[] = [];
  for (const match of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*'react-native'/g)) {
    for (const part of match[1].split(',')) {
      const name = part.trim();
      if (name && !name.startsWith('type ')) names.push(name.split(/\s+as\s+/)[0]);
    }
  }
  return names;
}

test('화면이 react-native에서 가져다 쓰는 부품은 모두 미리 불러 두는 목록에 있다', () => {
  const files = screenFiles();
  expect(files.length).toBeGreaterThan(1);
  const missing = new Set<string>();
  for (const file of files) {
    for (const name of reactNativeImports(readFileSync(file, 'utf8'))) {
      if (!(WARMED as readonly string[]).includes(name)) missing.add(name);
    }
  }
  expect([...missing]).toEqual([]);
});

test('가져오는 이름을 읽는 법: 여러 줄, type, as를 다룬다', () => {
  const source = "import {\n  View,\n  type ViewStyle,\n  Text as T,\n} from 'react-native';\nimport { x } from './x';";
  expect(reactNativeImports(source)).toEqual(['View', 'Text']);
});
