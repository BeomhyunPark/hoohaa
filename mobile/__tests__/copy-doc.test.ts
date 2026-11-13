/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterRunCopy, exertionButtonLabel } from '../src/copy/after-run';
import { manualEntryCopy } from '../src/copy/manual-entry';
import { recordListCopy } from '../src/copy/record-list';

// 화면 문장의 기준은 docs/v4/features/copy.md다. 코드의 문장이 그 문서에 그대로 있는지 본다.
// 한쪽만 고치면 여기서 걸린다.
const doc = readFileSync(join(__dirname, '../../docs/v4/features/copy.md'), 'utf8');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

test.each([...new Set([...strings(afterRunCopy), ...strings(manualEntryCopy), ...strings(recordListCopy)])])('copy.md에 "%s"가 있다', (sentence) => {
  expect(doc).toContain(`| ${sentence} |`);
});

test.each([1, 5, 10])('copy.md에 피로 버튼 %i의 읽어 줄 이름이 있다', (value) => {
  expect(doc).toContain(exertionButtonLabel(value));
});
