// Running tier calculator (v4.3 logic). Dependency-free ES module.
import { D } from './data.js';

const STD = [['5K', 5000], ['10K', 10000], ['half', 21097.5], ['full', 42195]];
const TIER_NAMES = D.tierNames;

// ---------- math ----------
function erfc(x) { // Numerical Recipes erfc, rel. err < 1.2e-7
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
    t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
const normCdf = z => 0.5 * erfc(-z / Math.SQRT2);
function normInv(p) { // Acklam
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425; let q, r;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
  if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1); }
  q = p - 0.5; r = q * q;
  return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
}

// Daniels/Gilbert VDOT; d meters, t minutes
function vdot(d, tMin) {
  const v = d / tMin, vo2 = -4.60 + 0.182258 * v + 0.000104 * v * v;
  return vo2 / (0.8 + 0.1894393 * Math.exp(-0.012778 * tMin) + 0.2989558 * Math.exp(-0.1932605 * tMin));
}
function bis(f, a, b) { let fa = f(a); for (let i = 0; i < 100; i++) { const m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }
const timeForVdot = (dMeters, V) => bis(t => vdot(dMeters, t) - V, 1, 3000) * 60; // seconds
const velForVo2 = vo2 => (-0.182258 + Math.sqrt(0.182258 ** 2 + 4 * 0.000104 * (vo2 + 4.60))) / (2 * 0.000104); // m/min

// ---------- formatting / parsing ----------
function fmtTime(sec) { const s = Math.round(sec); return `${Math.floor(s / 3600)}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
function fmtGapKo(sec) { // 77 -> '1분 17초', 4659 -> '1시간 17분 39초'
  const s = Math.max(0, Math.round(sec)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return [h && `${h}시간`, m && `${m}분`, (x || (!h && !m)) && `${x}초`].filter(Boolean).join(' ');
}
function fmtPace(secPerKm) { const s = Math.round(secPerKm); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}/km`; }
function parseTime(str) {
  if (typeof str === 'number') return str;
  const parts = String(str).trim().split(':');
  if (parts.length < 1 || parts.length > 3 || parts.some(p => !/^\d+(\.\d+)?$/.test(p.trim()))) return NaN;
  const a = parts.map(Number); while (a.length < 3) a.unshift(0);
  return a[0] * 3600 + a[1] * 60 + a[2];
}
function parseBirthdate(s, today = new Date()) {
  s = String(s).trim().replace(/[-./]/g, '');
  let y, m, d;
  if (/^\d{8}$/.test(s)) { y = +s.slice(0, 4); m = +s.slice(4, 6); d = +s.slice(6, 8); }
  else if (/^\d{6}$/.test(s)) { const yy = +s.slice(0, 2); const cy = today.getFullYear() % 100; y = (yy > cy ? 1900 : 2000) + yy; m = +s.slice(2, 4); d = +s.slice(4, 6); }
  else return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return { y, m, d };
}
function fullAge(b, today = new Date()) { // 만 나이
  let age = today.getFullYear() - b.y;
  if (today.getMonth() + 1 < b.m || (today.getMonth() + 1 === b.m && today.getDate() < b.d)) age--;
  return age;
}
function ageGroup(age) { return age < 30 ? '20s_and_under' : age < 40 ? '30s' : age < 50 ? '40s' : age < 60 ? '50s' : '60plus'; }
const AGE_LABEL = { '20s_and_under': '20대 이하', '30s': '30대', '40s': '40대', '50s': '50대', '60plus': '60대 이상' };

// ---------- population percentile (v4.3 z_of: probit vs ln t, piecewise linear, linear extrapolation) ----------
const ZP = D.popPct.map(p => normInv(1 - p / 100));
function zOf(lt, x) {
  const n = lt.length;
  if (x < lt[0]) return ZP[0] + (x - lt[0]) * (ZP[1] - ZP[0]) / (lt[1] - lt[0]);
  if (x > lt[n - 1]) return ZP[n - 1] + (x - lt[n - 1]) * (ZP[n - 1] - ZP[n - 2]) / (lt[n - 1] - lt[n - 2]);
  for (let i = 0; i < n - 1; i++) if (x <= lt[i + 1]) return ZP[i] + (x - lt[i]) * (ZP[i + 1] - ZP[i]) / (lt[i + 1] - lt[i]);
}
function topPctStd(dist, sex, ag, tSec) { // % of group at or faster (top %)
  const lt = D.population[sex][ag][dist].map(Math.log);
  return 100 * (1 - normCdf(zOf(lt, Math.log(tSec))));
}

// neighbours in log-distance; below 5K -> 5K only, above full -> full only
function neighbours(dM) {
  if (dM <= 5000) return [[STD[0], 1]];
  if (dM >= 42195) return [[STD[3], 1]];
  for (let i = 0; i < 3; i++) {
    const [, a] = STD[i], [, b] = STD[i + 1];
    if (dM <= b) { const w = Math.log(dM / a) / Math.log(b / a); return w === 0 ? [[STD[i], 1]] : w === 1 ? [[STD[i + 1], 1]] : [[STD[i], 1 - w], [STD[i + 1], w]]; }
  }
}
// world-record check time (log-log interpolation per validation_rules.json)
function wrTime(sex, dM) {
  const w = D.wrCheck[sex], pts = STD.map(([, d]) => [d, w[String(d)]]);
  let i = dM < 10000 ? 0 : dM <= 21097.5 ? 1 : 2;
  const [d1, t1] = pts[i], [d2, t2] = pts[i + 1], k = Math.log(t2 / t1) / Math.log(d2 / d1);
  return t1 * Math.pow(dM / d1, k);
}

const EVENTS = { '5K': 5, '10K': 10, 'HALF': 21.0975, 'FULL': 42.195, '하프': 21.0975, '풀': 42.195 };

/**
 * calculate({ birthdate, sex, event, distanceKm?, time, today? })
 * returns { ok:true, ... } or { ok:false, errors:[{code,message}] }
 */
function calculate({ birthYear, birthdate, sex, event, distanceKm, time, today = new Date() }) {
  const errors = [], notes = [];
  let b = null, age = null;
  if (birthYear != null && birthYear !== '') {
    // birth-year mode: age = this year - birth year (assumption; ignores whether birthday has passed)
    const y = String(birthYear).trim();
    if (/^\d{4}$/.test(y) && +y >= 1900 && +y <= today.getFullYear()) b = { y: +y, yearOnly: true };
  } else b = parseBirthdate(birthdate, today);
  if (!b) errors.push({ code: 'birthdate', message: birthYear != null && birthYear !== '' ? '출생연도 형식 오류 (4자리)' : '생년월일 형식 오류 (YYYYMMDD 또는 YYMMDD)' });
  else { age = b.yearOnly ? today.getFullYear() - b.y : fullAge(b, today); if (age < 10 || age > 100) errors.push({ code: 'age_range', message: '나이는 10~100세만 지원' }); }
  sex = String(sex || '').trim().toUpperCase();
  if (sex !== 'M' && sex !== 'F') errors.push({ code: 'sex', message: '성별은 M 또는 F' });
  let km = distanceKm != null && distanceKm !== '' ? Number(distanceKm) : EVENTS[String(event || '').trim().toUpperCase()] ?? Number(String(event || '').replace(/km$/i, ''));
  if (!Number.isFinite(km) || km <= 0) errors.push({ code: 'distance_nonpositive', message: '거리 오류' });
  else if (km < 1.5 || km > 100) errors.push({ code: 'distance_range', message: '거리는 1.5~100km만 지원' });
  const tSec = parseTime(time);
  if (!Number.isFinite(tSec) || tSec <= 0) errors.push({ code: 'time_nonpositive', message: '기록 오류 (0 이하 또는 형식 오류)' });
  if (errors.length) return { ok: false, errors };

  const dM = km * 1000, tMin = tSec / 60;
  const V = vdot(dM, tMin);
  const wr = wrTime(sex, dM);
  if (tSec < D.wrFactor * wr || V > D.vdotMax)
    return { ok: false, errors: [{ code: 'faster_than_wr', message: `세계기록 수준보다 빠른 기록입니다 (기준 ${fmtTime(wr)} × ${D.wrFactor})` }] };
  if (tSec < D.nearWrFactor * wr) notes.push('near_wr: 세계기록급 기록 — 확인 필요');
  if (km < 3 || km > 42.195) notes.push('distance_extrapolated: 표준거리 범위 밖, 외삽(신뢰도 낮음)');

  const ag = ageGroup(age), nb = neighbours(dM);
  // age multiplier (v4.3: 30s thresholds × max(1, median smoothed multiplier)), log-distance interpolated
  const mult = Math.exp(nb.reduce((s, [[d], w]) => s + w * Math.log(D.ageMult[sex][ag][d]), 0));
  // boundary VDOTs at this distance: thresholds converted to VDOT per neighbour, log-distance interpolated.
  // At a standard distance this equals direct time comparison against the v4.3 table.
  const bounds = D.thresholds30s[sex]['5K'].map((_, i) => nb.reduce((s, [[d, dd], w]) => s + w * vdot(dd, D.thresholds30s[sex][d][i] / 60), 0));
  // threshold times at this distance (age-adjusted), boundary i = lower bound of tier i+1
  const isStd = nb.length === 1 && Math.abs(nb[0][0][1] - dM) < 1e-6;
  const T = bounds.map((bv, i) => (isStd ? D.thresholds30s[sex][nb[0][0][0]][i] : timeForVdot(dM, bv)) * mult);
  let idx = 0; while (idx < 23 && tSec <= T[idx]) idx++;
  let next = null;
  if (idx < 23) { const g = Math.max(1, Math.ceil(tSec - T[idx] - 1e-9)); next = { tier: TIER_NAMES[idx + 1], targetTime: fmtTime(Math.floor(T[idx] + 1e-9)), targetSec: Math.floor(T[idx] + 1e-9), gapSec: g, gap: fmtTime(g), gapText: fmtGapKo(g) }; }

  // topPercent on the tier scale: log-time vs probit(pct) through (T_i, targetTopPct_i)
  const P = D.targetTopPct, Zb = P.map(p => normInv(1 - p / 100)), L = T.map(Math.log), x = Math.log(tSec);
  let j = idx <= 0 ? 0 : idx >= 23 ? 21 : idx - 1; // segment [j, j+1]
  const z = Zb[j] + (x - L[j]) * (Zb[j + 1] - Zb[j]) / (L[j + 1] - L[j]);
  let top = 100 * (1 - normCdf(z));
  const hi = idx === 0 ? 99.9 : P[idx - 1], lo = idx === 23 ? 0.01 : P[idx]; // band of this tier
  top = Math.round(Math.min(hi, Math.max(lo, top)) * 100) / 100;
  if (idx < 23 && top <= lo) top = Math.min(hi, Math.round(lo * 100 + 1) / 100); // strictly slower than next boundary
  let top1 = Math.round(top * 10) / 10;
  if (top1 > hi) top1 = Math.floor(hi * 10) / 10;
  if (idx < 23 && top1 <= lo) top1 = Math.min(Math.floor(hi * 10) / 10, Math.floor(lo * 10 + 1) / 10);
  const topLabel = top < 0.1 ? '상위 0.1% 이내' : `상위 ${top1.toFixed(1)}%`;
  const prevBound = idx > 0 ? T[idx - 1] : null;
  // population percentile within own sex x age group (v3 tables), kept as secondary info
  let popTop = nb.reduce((s, [[d, dd], w]) => s + w * topPctStd(d, sex, ag, Math.abs(dd - dM) < 1e-6 ? tSec : timeForVdot(dd, V)), 0);
  popTop = Math.min(99.9, Math.max(0.1, popTop));

  const pred = {}, predPace = {}; for (const [n, d] of STD) { const ts = timeForVdot(d, V); pred[n] = fmtTime(ts); predPace[n] = fmtPace(ts / (d / 1000)); }
  const paceAt = pct => 60000 / velForVo2(pct * V); // sec/km
  const iPace = paceAt(0.975);
  const paces = {
    E: `${fmtPace(paceAt(0.74))} ~ ${fmtPace(paceAt(0.59))}`,
    M: fmtPace(timeForVdot(42195, V) / 42.195),
    T: fmtPace(paceAt(0.88)),
    I: fmtPace(iPace),
    R: fmtPace(iPace - 15), // ≈ I − 6s/400m
  };
  return {
    ok: true,
    input: { ...(b.yearOnly ? { birthYear: b.y } : { birthdate: `${b.y}-${String(b.m).padStart(2, '0')}-${String(b.d).padStart(2, '0')}` }), age, ageMode: b.yearOnly ? 'year_minus_birthyear' : 'full_age', ageGroup: ag, ageGroupLabel: AGE_LABEL[ag], sex, distanceKm: km, time: fmtTime(tSec) },
    tier: TIER_NAMES[idx], tierIndex: idx,
    vdot: +V.toFixed(1), vo2maxEstimate: +V.toFixed(1),
    pace: fmtPace(tSec / km),
    topPercent: top, topPercent1: top < 0.1 ? null : top1, topPercentLabel: topLabel, currentTierBoundSec: prevBound == null ? null : Math.round(prevBound), tierBandPct: { from: hi, to: lo },
    populationTopPercent: +popTop.toFixed(1),
    ageTimeMultiplier: +mult.toFixed(4),
    nextTier: next,
    tierLadder: TIER_NAMES.map((n, i) => ({ tier: n, index: i, minSec: i ? Math.floor(T[i - 1] + 1e-9) : null, minTime: i ? fmtTime(Math.floor(T[i - 1] + 1e-9)) : null, topPct: i ? P[i - 1] : 100 })),
    predicted: pred, predictedPace: predPace, trainingPaces: paces, notes,
  };
}

export { calculate, vdot, timeForVdot, fmtTime, fmtPace, parseTime };
