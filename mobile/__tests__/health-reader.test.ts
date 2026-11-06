import { createFakeHealthReader } from '../src/record/health-reader';

const now = () => new Date('2026-11-05T22:05:00.000Z');

test.each([
  ['apple_health', '6F1C2A8E-3B4D-4E5F-9A0B-1C2D3E4F5A6B'],
  ['health_connect', '3f2a9c1e-7b4d-4e8a-9f10-2c3d4e5f6a7b'],
] as const)('가짜 건강 앱(%s)은 샘플 기록 하나를 돌려준다', async (platform, id) => {
  const record = await createFakeHealthReader(platform, now).readLatestWorkout();
  expect(record?.origin).toEqual({ source: platform, sourceRecordId: id, importedAt: '2026-11-05T22:05:00.000Z' });
  expect(record?.userInput).toEqual({ perceivedExertion: null, memo: null });
});
