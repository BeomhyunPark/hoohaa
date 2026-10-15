// Point-workout copy for the result card. Paces come from the calculated VDOT.
// Caps match the /pace/ page: T 10% of weekly km, I min(8%, 10km), R 5%.

export function parseWeekly(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function parsePaceSec(pace) {
  const m = String(pace).replace(/\/km/g, '').trim().match(/^(\d+):(\d{2})$/);
  if (!m) return null;
  return (+m[1]) * 60 + (+m[2]);
}

export function fmtSplit(sec) {
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}초`;
  return r ? `${m}분 ${r}초` : `${m}분`;
}

function paceToken(pace) {
  return String(pace).replace(/\/km/g, '').replace(/\s*~\s*/g, '~').trim();
}

function easyEnds(pace) {
  const [lo, hi] = paceToken(pace).split('~');
  return [lo, hi || lo];
}

function clipReps(lo, hi, maxReps) {
  if (maxReps == null) return { lo, hi };
  const top = Math.floor(maxReps + 1e-9);
  if (top >= hi) return { lo, hi };
  if (top >= lo) return { lo, hi: top };
  return { lo: top, hi: top };
}

function repsLabel(range) {
  if (!range || range.hi < 1) return null;
  return range.lo === range.hi ? `${range.lo}회` : `${range.lo}~${range.hi}회`;
}

export function paceGuide(paces, weeklyKm) {
  const weekly = parseWeekly(weeklyKm);
  const [eLo, eHi] = easyEnds(paces.E);
  const e = `${eLo}~${eHi}`;
  const m = paceToken(paces.M);
  const t = paceToken(paces.T);
  const i = paceToken(paces.I);
  const r = paceToken(paces.R);
  const tSec = parsePaceSec(paces.T);
  const iSec = parsePaceSec(paces.I);
  const rSec = parsePaceSec(paces.R);
  const iDist = iSec != null && iSec > 300 ? '800m' : '1km';
  const iLen = iDist === '800m' ? 0.8 : 1;
  const tCap = weekly == null ? null : weekly * 0.10;
  const iCap = weekly == null ? null : Math.min(weekly * 0.08, 10);
  const rCap = weekly == null ? null : weekly * 0.05;
  const tReps = repsLabel(clipReps(4, 6, tCap == null ? null : tCap / 1));
  const iReps = repsLabel(clipReps(3, 5, iCap == null ? null : iCap / iLen));
  const rMax = rCap == null ? null : rCap / 0.2;
  const stride = rMax != null && Math.floor(rMax + 1e-9) < 4;
  const rReps = stride ? null : repsLabel(clipReps(6, 8, rMax));
  const tempoKm = tSec ? (20 * 60) / tSec : null;
  const showTempo = tReps && (tCap == null || (tempoKm != null && tempoKm <= tCap + 1e-9));

  const tLines = [`T · 역치 (${t}/km)`];
  if (tReps) tLines.push(`${t}/km로 1km × ${tReps}${showTempo ? ', 또는 20분 템포' : ''}`, '사이에는 1분 조깅');
  tLines.push('T 구간 합은 주간거리의 10%까지');

  const iLines = [`I · 인터벌 (${i}/km)`];
  if (iReps) iLines.push(`${i}/km로 ${iDist} × ${iReps}`, '사이에는 2~3분 조깅');
  iLines.push('I 구간 합은 주간거리의 8%와 10km 중 작은 쪽까지');

  const rHead = `R · 리피티션 (${r}/km, 200m ${fmtSplit(rSec * 0.2)} · 400m ${fmtSplit(rSec * 0.4)})`;
  const rLines = stride
    ? [rHead,
      '주간거리가 적으면 20초 스트라이드 × 4~6회로 대신해요.',
      '20초 동안 점점 빨라졌다가 빠른 속도를 잠깐 유지하고 부드럽게 멈추는 짧은 달리기예요. 전력 질주가 아니라 가볍고 빠른 느낌이에요. 4~6번 하고, 사이에는 1분 정도 걷거나 천천히 조깅해요.']
    : [rHead,
      `200m나 400m 반복 (예: 200m × ${rReps})`,
      '사이에는 숨이 돌아올 때까지 걷거나 천천히 조깅',
      'R 구간 합은 주간거리의 5%까지',
      '주간거리가 적으면 20초 스트라이드 × 4~6회로 대신해요.'];

  return {
    E: `E · 이지 (${e}/km)\n대화가 되는 속도예요. 처음이라면 대부분의 러닝을 이 페이스로 달려요. 페이스가 기억나지 않아도 이 화면의 숫자를 기준으로 보면 돼요.`,
    M: `M · 마라톤 (${m}/km)\n긴 조깅 중간에 20~40분을 ${m}/km로 넣어요. 앞과 뒤는 E (${e}/km)로 달려요.`,
    T: tLines.join('\n'),
    I: iLines.join('\n'),
    R: rLines.join('\n'),
    foot: '계산된 페이스를 그대로 따라가세요. 더 빠르게 달릴 필요는 없어요.',
  };
}
