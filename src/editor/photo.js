// Photo processing for the share-image editor: filters, rotate/flip/crop, adjustments, cut-out outline,
// background geometry, adding a photo file (downscaled to 1600px) and on-device person segmentation (MediaPipe).
// Moved out of editor.js. Shared editor state is passed in: photos (pid -> image, 'mask:'+pid -> mask) and H_ (canvas height).
// fcache, pcache, segP, segBusy and segErr are module-level; mountEditor runs once per page, so this behaves like the closure did.
import { idb } from '../storage/device.js';
import { W_ } from './util.js';
// ---- photo filters (pixel ops: same result in every browser, incl. Safari without ctx.filter) ----
export const fcache = new Map();
export function filtered(im, f, key) {
  if (!f || f === 'none') return im; const ck = key && key + ':' + f; if (ck && fcache.has(ck)) return fcache.get(ck);
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
  const id = g.getImageData(0, 0, c.width, c.height), p = id.data;
  for (let i = 0; i < p.length; i += 4) { let r = p[i], gg = p[i + 1], b = p[i + 2]; const l = .299 * r + .587 * gg + .114 * b;
    if (f === 'bw') r = gg = b = l;
    else if (f === 'warm') { r = r * 1.08 + 12; gg = gg * 1.02 + 4; b = b * .88; }
    else if (f === 'cool') { r = r * .9; gg = gg * 1.0 + 2; b = b * 1.1 + 14; }
    else if (f === 'fade') { r = l + (r - l) * .6; gg = l + (gg - l) * .6; b = l + (b - l) * .6; r = r * .85 + 30; gg = gg * .85 + 28; b = b * .85 + 22; }
    else if (f === 'golden') { r = r * 1.1 + 14; gg = gg * 1.03 + 6; b = b * .82; r = l + (r - l) * 1.12; }
    else if (f === 'morning') { r = r * .92 + 22; gg = gg * .95 + 24; b = b * .98 + 30; const m = (r + gg + b) / 3; r = m + (r - m) * .8; gg = m + (gg - m) * .8; b = m + (b - m) * .8; }
    else if (f === 'teal') { const t = l / 255; r = r + (t - .5) * 40 + 6; gg = gg + 2; b = b - (t - .5) * 46 + 8; }
    else if (f === 'film') { r = (r - 128) * .92 + 128 + 10; gg = (gg - 128) * .92 + 128 + 4; b = (b - 128) * .88 + 128 - 6; r = Math.max(r, 22); gg = Math.max(gg, 20); b = Math.max(b, 26); }
    else if (f === 'noir') { r = gg = b = Math.min(255, Math.max(0, (l - 128) * 1.45 + 120)); }
    else if (f === 'vivid') { r = l + (r - l) * 1.45; gg = l + (gg - l) * 1.45; b = l + (b - l) * 1.45; r = (r - 128) * 1.08 + 128; gg = (gg - 128) * 1.08 + 128; b = (b - 128) * 1.08 + 128; }
    p[i] = r; p[i + 1] = gg; p[i + 2] = b; }
  g.putImageData(id, 0, 0); if (ck) { if (fcache.size > 24) fcache.clear(); fcache.set(ck, c); } return c;
}
// ---- non-destructive photo pipeline: rotate/flip -> crop -> filter + 밝기/대비/채도/따뜻함 -> 배경 지우기 (mask) -> 누끼 테두리 ----
// P (photo layer or doc.bg): rot 0..3 (×90°), flip, crop {x,y,w,h} (0..1 of the rotated image), filter, adj {br,ct,sa,wa} (-100..100), cut, ol {on,col,w}
export const pcache = new Map();
export const peKey = P => JSON.stringify([P.rot || 0, !!P.flip, P.crop || 0, P.filter || 'none', P.adj || 0, !!P.cut, P.cut && P.ol && P.ol.on ? P.ol : 0]);
export const hasPE = P => !!(P.rot || P.flip || P.crop || P.adj || P.cut || (P.filter && P.filter !== 'none'));
export function orient(src, P, crop = true) { // same geometry for photo + mask so they always line up
  const rot = (P.rot || 0) & 3, sw = rot & 1 ? src.height : src.width, sh = rot & 1 ? src.width : src.height, cr = crop && P.crop || { x: 0, y: 0, w: 1, h: 1 };
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(sw * cr.w)); c.height = Math.max(1, Math.round(sh * cr.h)); const g = c.getContext('2d');
  g.translate(-cr.x * sw, -cr.y * sh); g.translate(sw / 2, sh / 2); g.rotate(rot * Math.PI / 2); if (P.flip) g.scale(-1, 1); g.drawImage(src, -src.width / 2, -src.height / 2, src.width, src.height); g.setTransform(1, 0, 0, 1, 0, 0); return c; } // reset: later passes (mask destination-in, outline) draw on this context in pixel space
export function adjust(c, a) { if (!a || !(a.br || a.ct || a.sa || a.wa)) return c; const g = c.getContext('2d'), id = g.getImageData(0, 0, c.width, c.height), p = id.data;
  const br = (a.br || 0) * 1.1, ct = 1 + (a.ct || 0) / 110, sa = 1 + (a.sa || 0) / 100, wa = (a.wa || 0) * .32;
  for (let i = 0; i < p.length; i += 4) { let r = p[i] + br, gg = p[i + 1] + br, b = p[i + 2] + br; r = (r - 128) * ct + 128; gg = (gg - 128) * ct + 128; b = (b - 128) * ct + 128;
    const l = .299 * r + .587 * gg + .114 * b; r = l + (r - l) * sa + wa; gg = l + (gg - l) * sa + wa * .25; b = l + (b - l) * sa - wa; p[i] = r; p[i + 1] = gg; p[i + 2] = b; }
  g.putImageData(id, 0, 0); return c; }
// The silhouette stroke used to be clipped where the person meets the bitmap edge. Pad by the stroke width so it can extend outside, and stroke the photo rectangle in the same colour.
export function applyOutline(c, P) {
  const w = Math.max(1, (P.ol.w || 12) * Math.max(c.width, c.height) / 1080), pad = Math.ceil(w);
  const o = document.createElement('canvas'); o.width = c.width + pad * 2; o.height = c.height + pad * 2; const og = o.getContext('2d');
  for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; og.drawImage(c, pad + Math.cos(a) * w, pad + Math.sin(a) * w); }
  og.globalCompositeOperation = 'source-in'; og.fillStyle = P.ol.col || '#ffffff'; og.fillRect(0, 0, o.width, o.height);
  og.globalCompositeOperation = 'source-over'; og.drawImage(c, pad, pad);
  og.strokeStyle = P.ol.col || '#ffffff'; og.lineWidth = w * 2; og.lineJoin = 'round'; og.strokeRect(pad, pad, c.width, c.height);
  o._olPad = pad; return o;
}
export function photoSrc(photos, pid, P) { const im = photos[pid]; if (!im) return null; if (!hasPE(P)) return im;
  const mask = P.cut ? photos['mask:' + pid] : null, k = pid + peKey(P) + (mask ? 'm' : ''); if (pcache.has(k)) return pcache.get(k);
  let c = orient(im, P); c = adjust(filtered(c, P.filter, null), P.adj); if (c === im) { const t = document.createElement('canvas'); t.width = c.width; t.height = c.height; t.getContext('2d').drawImage(c, 0, 0); c = t; }
  if (mask) { const ms = document.createElement('canvas'); ms.width = im.width; ms.height = im.height; ms.getContext('2d').drawImage(mask, 0, 0, im.width, im.height);
    const mo = orient(ms, P), g = c.getContext('2d'); g.globalCompositeOperation = 'destination-in'; g.drawImage(mo, 0, 0); g.globalCompositeOperation = 'source-over';
    if (P.ol && P.ol.on) c = applyOutline(c, P); }
  if (pcache.size > 16) pcache.clear(); pcache.set(k, c); return c; }
// bg photo geometry (shared by background + subject cut-out so they line up exactly)
export function imContent(im) { const pad = im && im._olPad || 0; return { pad, w: Math.max(1, (im ? im.width : 1) - pad * 2), h: Math.max(1, (im ? im.height : 1) - pad * 2) }; }
export function bgRect(b, im, H_) { const { pad, w, h } = imContent(im), sc = Math.max(W_ / w, H_ / h) * (b.pz || 1), iw = im.width * sc, ih = im.height * sc, mx = (w * sc - W_) / 2, my = (h * sc - H_) / 2; return [-mx + Math.max(-1, Math.min(1, b.px || 0)) * mx - pad * sc, -my + Math.max(-1, Math.min(1, b.py || 0)) * my - pad * sc, iw, ih]; }
export function subjectLayer(doc, photos, H_) { const b = doc.bg, im = b.type === 'photo' && photos[b.pid], mk2 = im && photos['mask:' + b.pid]; if (!mk2) return null;
  const cut = photoSrc(photos, b.pid, { ...b, cut: true }); return [cut, bgRect(b, cut, H_)]; }
// ---- photos stay on the device: IndexedDB only ----
export const blobToImg = b => new Promise((res, rej) => { const u = URL.createObjectURL(b), im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = u; });
export async function addPhotoFile(photos, f) { // downscale to ≤1600px, keep on device
  const im = await blobToImg(f), k = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  const pid = 'P' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); photos[pid] = c;
  c.toBlob(b => b && idb.put(pid, b), 'image/jpeg', .88); return pid; }
// ---- '인물 뒤로': on-device subject segmentation (MediaPipe, Apache-2.0), lazy-loaded only when used ----
export const SEG = new URL('/seg/', location.origin).href; export let segP = null; export const segBusy = new Map();
export const getSeg = () => segP || (segP = (async () => { const m = await import(SEG + 'vision_bundle.mjs'); const fs = await m.FilesetResolver.forVisionTasks(SEG.replace(/\/$/, ''));
  return m.ImageSegmenter.createFromOptions(fs, { baseOptions: { modelAssetPath: SEG + 'selfie_segmenter.tflite', delegate: 'CPU' }, runningMode: 'IMAGE', outputConfidenceMasks: true, outputCategoryMask: false }); })().catch(e => { segP = null; throw e; }));
export let segErr = ''; // 'load' when the on-device model could not be loaded (offline / blocked), 'none' when no person was found
export async function segRun(seg, cv) { const r = seg.segment(cv), m = r.confidenceMasks[0], a = Float32Array.from(m.getAsFloat32Array()), w = m.width, h = m.height; r.close && r.close(); return { a, w, h }; }
export function ensureMask(photos, pid) { if (photos['mask:' + pid]) return Promise.resolve(true); if (segBusy.has(pid)) return segBusy.get(pid);
  const pr = (async () => { segErr = ''; const im = photos[pid], t0 = performance.now(); let seg; try { seg = await getSeg(); } catch (e) { segErr = 'load'; throw e; }
    const W = im.width, H = im.height, src = document.createElement('canvas'); src.width = W; src.height = H; src.getContext('2d').drawImage(im, 0, 0);
    let { a, w, h } = await segRun(seg, src); const sx = W / w, sy = H / h;
    // pass 2: re-segment a crop around the person (more model pixels on the subject → cleaner limbs/edges in full-body shots)
    let x0 = w, y0 = h, x1 = -1, y1 = -1, on = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a[y * w + x] > .5) { on++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (on < a.length * .01) { segErr = 'none'; throw new Error('no subject'); }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    if (bw * bh < w * h * .55) { const mx = bw * .18, my = bh * .12, cx0 = Math.max(0, Math.floor((x0 - mx) * sx)), cy0 = Math.max(0, Math.floor((y0 - my) * sy)), cx1 = Math.min(W, Math.ceil((x1 + 1 + mx) * sx)), cy1 = Math.min(H, Math.ceil((y1 + 1 + my) * sy)), cw = cx1 - cx0, ch = cy1 - cy0;
      const cc = document.createElement('canvas'); cc.width = cw; cc.height = ch; cc.getContext('2d').drawImage(src, cx0, cy0, cw, ch, 0, 0, cw, ch); const r2 = await segRun(seg, cc);
      for (let y = Math.floor(cy0 / sy); y < Math.min(h, Math.ceil(cy1 / sy)); y++) for (let x = Math.floor(cx0 / sx); x < Math.min(w, Math.ceil(cx1 / sx)); x++) { const u = Math.min(r2.w - 1, Math.floor((x * sx - cx0) * r2.w / cw)), v = Math.min(r2.h - 1, Math.floor((y * sy - cy0) * r2.h / ch)); if (u >= 0 && v >= 0) a[y * w + x] = Math.max(a[y * w + x] * .35, r2.a[v * r2.w + u]); } }
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), id = g.createImageData(w, h); on = 0;
    for (let i = 0; i < a.length; i++) { const v = Math.max(0, Math.min(1, (a[i] - .3) / .4)); id.data[i * 4 + 3] = v * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = 255; if (v > .5) on++; }
    g.putImageData(id, 0, 0); if (on < a.length * .01) { segErr = 'none'; throw new Error('no subject'); }
    // feathered edge at photo resolution (never an empty/near-empty mask: checked above)
    const f = document.createElement('canvas'); f.width = W; f.height = H; const fg = f.getContext('2d'); fg.filter = `blur(${Math.max(1, Math.round(Math.max(W, H) / 900))}px)`; fg.drawImage(c, 0, 0, W, H); fg.filter = 'none';
    photos['mask:' + pid] = f; window.__segMs = Math.round(performance.now() - t0); return true; })().catch(e => { console.warn('segmentation', e); if (!segErr) segErr = 'fail'; return false; }).finally(() => segBusy.delete(pid));
  segBusy.set(pid, pr); return pr; }
export const segFailMsg = keep => segErr === 'load' ? '인물 인식 모델을 불러오지 못했어요 · 인터넷 연결을 확인하고 다시 눌러 주세요' : segErr === 'none' ? `인물을 찾지 못했어요 · ${keep}` : `인물 인식에 실패했어요 · ${keep}`;
