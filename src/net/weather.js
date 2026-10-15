// Open-Meteo weather auto-fill (no key, client-side). Only lat/lon + date/hour leave the device; nothing is stored.
const wxPad = n => String(n).padStart(2, '0');
export const isoDay = (d = new Date()) => `${d.getFullYear()}-${wxPad(d.getMonth() + 1)}-${wxPad(d.getDate())}`;
// WMO weather code → [Korean description, sticker icon]
function wmo(code, day = true) {
  const c = +code;
  if (c === 0) return ['맑음', day ? 'sun' : 'night'];
  if (c === 1) return ['대체로 맑음', day ? 'partly' : 'night'];
  if (c === 2) return ['구름 조금', 'partly'];
  if (c === 3) return ['흐림', 'cloud'];
  if (c === 45 || c === 48) return ['안개', 'cloud'];
  if (c >= 51 && c <= 57) return ['이슬비', 'rain'];
  if (c >= 61 && c <= 67) return ['비', 'rain'];
  if (c >= 71 && c <= 77) return ['눈', 'snow'];
  if (c >= 80 && c <= 82) return ['소나기', 'rain'];
  if (c === 85 || c === 86) return ['눈', 'snow'];
  if (c >= 95) return ['뇌우', 'rain'];
  return ['흐림', 'cloud'];
}
const windWord = ms => ms < 4 ? '약함' : ms < 9 ? '보통' : '강함';
async function wxJSON(u) { const r = await fetch(u, { cache: 'no-store' }); if (!r.ok) throw new Error('http ' + r.status); return r.json(); }
const WX_H = 'temperature_2m,weather_code,wind_speed_10m,is_day';
// date: 'YYYY-MM-DD' (record date), hour 0-23 (local time at the place)
export async function fetchWeather(lat, lon, date, hour) {
  const q = `latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&hourly=${WX_H}&wind_speed_unit=ms&timezone=auto&start_date=${date}&end_date=${date}`;
  const past = date < isoDay(); let j = null;
  if (past) { try { j = await wxJSON(`https://archive-api.open-meteo.com/v1/archive?${q}`); } catch { j = null; } }
  const ok = x => x && x.hourly && x.hourly.temperature_2m && x.hourly.temperature_2m[hour] != null;
  if (!ok(j)) j = await wxJSON(`https://api.open-meteo.com/v1/forecast?${q}`); // today (and the last few days the archive doesn't have yet)
  if (!ok(j)) throw new Error('no data');
  const h = j.hourly, t = h.temperature_2m[hour], [desc, icon] = wmo(h.weather_code[hour], h.is_day ? !!h.is_day[hour] : hour >= 6 && hour < 19), w = h.wind_speed_10m[hour];
  return { icon, temp: `${Math.round(t)}°C`, label: `${desc} · 바람 ${windWord(w ?? 0)}` };
}
export async function searchPlace(name) {
  const j = await wxJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=ko&format=json`);
  return (j.results || []).map(r => ({ name: [r.name, r.admin1, r.country_code === 'KR' ? '' : r.country].filter(Boolean).join(' · '), lat: r.latitude, lon: r.longitude }));
}
export const wxHere = () => new Promise((res, rej) => { if (!navigator.geolocation) return rej(new Error('unsupported')); navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lon: p.coords.longitude }), rej, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }); });
