// 건강 앱을 읽는 자리. 화면은 이 인터페이스만 본다.
//
// 지금은 샘플을 돌려주는 가짜 구현만 있다. 실제 구현은 개발 빌드가 있는 폰이 생기면 붙인다:
//   - 아이폰: @kingstinct/react-native-healthkit로 마지막 운동과 경로·통계·심박을 읽어 appleHealthToRecord에 넘긴다.
//   - 안드로이드: react-native-health-connect로 마지막 ExerciseSession과 그 시간대 Distance·HeartRate를 읽어
//     healthConnectToRecord에 넘긴다.
// 권한 요청, 저장, 서버 호출은 여기 없다.
import { appleHealthToRecord } from './apple-health';
import { appleHealthRun } from './fixtures/apple-health-run';
import { healthConnectRun } from './fixtures/health-connect-run';
import { healthConnectToRecord } from './health-connect';
import type { WorkoutRecord } from './types';

export interface HealthReader {
  /** 가장 최근에 끝난 운동 하나. 없으면 null. */
  readLatestWorkout(): Promise<WorkoutRecord | null>;
}

export type HealthPlatform = 'apple_health' | 'health_connect';

/** 샘플 원본을 실제 변환 함수에 통과시켜 돌려주는 가짜 건강 앱. now는 가져온 시각을 정한다(테스트용). */
export function createFakeHealthReader(platform: HealthPlatform, now: () => Date = () => new Date()): HealthReader {
  return {
    async readLatestWorkout() {
      const importedAt = now().toISOString();
      return platform === 'apple_health'
        ? appleHealthToRecord(appleHealthRun, importedAt)
        : healthConnectToRecord(healthConnectRun, importedAt);
    },
  };
}
