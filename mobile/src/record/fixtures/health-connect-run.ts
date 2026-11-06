// 헬스 커넥트 샘플: 갤럭시 워치(삼성 헬스)로 잰 5km 야외 러닝 하나(2026-11-06 06:30 서울).
//
// 기준: react-native-health-connect 4.1.3의 readRecords() 반환값. 타입 정의(lib/typescript/types/*.d.ts)와
// 실제로 값을 만드는 Kotlin(android/.../records/ReactExerciseSessionRecord.kt, ReactDistanceRecord.kt,
// ReactHeartRateRecord.kt, utils/HealthConnectUtils.kt)이 다른 곳은 Kotlin을 따랐다.
//   - session: readRecords('ExerciseSession'). ExerciseSessionRecord(exerciseType 56 = RUNNING),
//     laps, segments(segmentType 46 = RUNNING, 39 = PAUSE), exerciseRoute { type: "DATA", route }.
//   - distance: 같은 시간대 readRecords('Distance'). 길이는 { inMeters, inKilometers, inMiles, inInches, inFeet }.
//   - heartRate: 같은 시간대 readRecords('HeartRate'). samples[].beatsPerMinute.
//   - 시각은 Kotlin Instant.toString()(초 단위가 0이면 소수점이 없다), zone offset은 { id, totalSeconds }.
//   - metadata는 convertMetadataToJSMap: id, clientRecordId, clientRecordVersion, dataOrigin(패키지 이름),
//     lastModifiedTime, device { type, manufacturer, model }, recordingMethod, 그리고 manufacturer, model 한 번 더.
//   헬스 커넥트 문서: ExerciseSessionRecord, DistanceRecord, HeartRateRecord, ExerciseRoute, Metadata
//   (developer.android.com/reference/kotlin/androidx/health/connect/client/records).
// 값은 지어낸 것이다. 실제 기기에서 읽은 값과 한 번 비교해 봐야 한다(개발 빌드가 있는 폰이 생기면).
import type { HCLengthResult, HCMetadata, HealthConnectWorkoutRaw } from '../health-connect';

function len(m: number): HCLengthResult {
  return { inMeters: m, inKilometers: m / 1000, inMiles: m / 1609.344, inInches: m / 0.0254, inFeet: m / 0.3048 };
}

const seoul = { id: '+09:00', totalSeconds: 32400 };

function meta(id: string, lastModifiedTime: string): HCMetadata {
  return {
    id,
    clientRecordId: null,
    clientRecordVersion: 0,
    dataOrigin: 'com.sec.android.app.shealth',
    lastModifiedTime,
    device: { type: 1, manufacturer: 'samsung', model: 'SM-L705N' },
    recordingMethod: 1,
    manufacturer: 'samsung',
    model: 'SM-L705N',
  };
}

export const healthConnectRun: HealthConnectWorkoutRaw = {
  session: {
    startTime: '2026-11-05T21:30:00Z',
    startZoneOffset: seoul,
    endTime: '2026-11-05T21:59:32.400Z',
    endZoneOffset: seoul,
    notes: null,
    title: '러닝',
    exerciseType: 56,
    laps: [
      { startTime: '2026-11-05T21:30:00Z', endTime: '2026-11-05T21:35:41Z', length: len(1000) },
      { startTime: '2026-11-05T21:35:41Z', endTime: '2026-11-05T21:41:20Z', length: len(1000) },
    ],
    segments: [
      { startTime: '2026-11-05T21:30:00Z', endTime: '2026-11-05T21:44:10Z', repetitions: 0, segmentType: 46 },
      { startTime: '2026-11-05T21:44:10Z', endTime: '2026-11-05T21:45:10Z', repetitions: 0, segmentType: 39 },
      { startTime: '2026-11-05T21:45:10Z', endTime: '2026-11-05T21:59:32.400Z', repetitions: 0, segmentType: 46 },
    ],
    exerciseRoute: {
      type: 'DATA',
      route: [
        {
          time: '2026-11-05T21:30:00Z',
          latitude: 37.52834,
          longitude: 126.93412,
          horizontalAccuracy: len(4.7),
          verticalAccuracy: len(3.2),
          altitude: len(12.3),
        },
        {
          time: '2026-11-05T21:30:01Z',
          latitude: 37.52837,
          longitude: 126.93415,
          horizontalAccuracy: len(4.1),
          verticalAccuracy: len(3),
          altitude: len(12.4),
        },
        {
          time: '2026-11-05T21:30:02Z',
          latitude: 37.5284,
          longitude: 126.93418,
          horizontalAccuracy: len(3.9),
          verticalAccuracy: len(2.9),
          altitude: len(12.6),
        },
      ],
    },
    metadata: meta('3f2a9c1e-7b4d-4e8a-9f10-2c3d4e5f6a7b', '2026-11-05T22:00:03.118Z'),
  },
  distance: [
    {
      startTime: '2026-11-05T21:30:00Z',
      endTime: '2026-11-05T21:44:10Z',
      startZoneOffset: seoul,
      endZoneOffset: seoul,
      distance: len(2481.5),
      metadata: meta('b1c2d3e4-0001-4a5b-8c9d-0e1f2a3b4c5d', '2026-11-05T22:00:03.204Z'),
    },
    {
      startTime: '2026-11-05T21:45:10Z',
      endTime: '2026-11-05T21:59:32.400Z',
      startZoneOffset: seoul,
      endZoneOffset: seoul,
      distance: len(2530.87),
      metadata: meta('b1c2d3e4-0002-4a5b-8c9d-0e1f2a3b4c5d', '2026-11-05T22:00:03.205Z'),
    },
  ],
  heartRate: [
    {
      startTime: '2026-11-05T21:30:05Z',
      endTime: '2026-11-05T21:59:30Z',
      startZoneOffset: seoul,
      endZoneOffset: seoul,
      samples: [
        { time: '2026-11-05T21:30:05Z', beatsPerMinute: 98 },
        { time: '2026-11-05T21:40:05Z', beatsPerMinute: 154 },
        { time: '2026-11-05T21:50:05Z', beatsPerMinute: 162 },
        { time: '2026-11-05T21:59:30Z', beatsPerMinute: 168 },
      ],
      metadata: meta('c9d8e7f6-0001-4b5a-9c8d-7e6f5a4b3c2d', '2026-11-05T22:00:03.311Z'),
    },
  ],
};
