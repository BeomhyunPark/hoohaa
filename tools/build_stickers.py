#!/usr/bin/env python3
"""Build the v5 static stickers (STK_SVG / STK_NAMES in src/editor/assets.js).

Design source: Figma "인스타 디자인" → page "Share v5 — redesign" → frame "Stickers v5 — export".
Text is outlined with the fonts the app already ships (so the SVG renders the same as an <img>):
  Anton + JetBrains Mono (embedded in src/styles/card.css), Inter (fonts/lazy/inter-0.woff2, wght 700),
  Pretendard Korean (fonts/lazy/pretendardk-1.woff2, 700).

Usage: pip install fonttools brotli && python3 tools/build_stickers.py [--preview out.html]
Sticker keys stay the same as v4 so saved docs and "내 템플릿" keep working.
"""
import base64, io, json, re, sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'src/editor/assets.js'

# ---------- fonts ----------
def css_font(fam):
    css = (ROOT / 'src/styles/card.css').read_text()
    m = re.search(r'font-family:"' + re.escape(fam) + r'";src:url\("data:font/woff2;base64,([^"]+)"\)', css)
    return TTFont(io.BytesIO(base64.b64decode(m.group(1))))

def var_font(path, wght):
    f = TTFont(path)
    if 'fvar' in f:
        from fontTools.varLib.instancer import instantiateVariableFont
        f = instantiateVariableFont(f, {'wght': wght})
    return f

class Face:
    def __init__(self, font):
        self.f, self.gs, self.cmap = font, font.getGlyphSet(), font.getBestCmap()
        self.upm = font['head'].unitsPerEm
        self.hmtx = font['hmtx']

FACES = {
    'anton': Face(css_font('OV Anton')),
    'mono': Face(css_font('OV Mono')),
    'inter': Face(var_font(ROOT / 'fonts/lazy/inter-0.woff2', 700)),
    'pre': Face(TTFont(ROOT / 'fonts/lazy/pretendardk-1.woff2')),
}

def r1(v):
    s = f'{v:.1f}'
    return s[:-2] if s.endswith('.0') else s

def shape_text(face, s, size, ls):
    """glyph runs -> (path data, ink bounds, advance) at origin baseline (0,0)."""
    k = size / face.upm
    x, parts, bounds = 0.0, [], None
    for ch in s:
        gn = face.cmap.get(ord(ch))
        if gn is None:
            raise SystemExit(f'missing glyph {ch!r} in font')
        pen = SVGPathPen(face.gs, ntos=r1)
        face.gs[gn].draw(TransformPen(pen, (k, 0, 0, -k, x, 0)))
        d = pen.getCommands()
        if d:
            parts.append(d)
        bp = BoundsPen(face.gs)
        face.gs[gn].draw(TransformPen(bp, (k, 0, 0, -k, x, 0)))
        if bp.bounds:
            b = bp.bounds
            bounds = b if bounds is None else (min(bounds[0], b[0]), min(bounds[1], b[1]), max(bounds[2], b[2]), max(bounds[3], b[3]))
        x += face.hmtx[gn][0] * k + size * ls / 100
    return ' '.join(parts), bounds or (0, 0, 0, 0), x - size * ls / 100

def text(s, font, size, x, cy, fill='#ECEBE6', ls=0, anchor='l', op=1, flt=None):
    """Outlined text: x = left ink edge ('l'), centre ('c') or right edge ('r'); cy = vertical centre of the ink box."""
    d, (x0, y0, x1, y1), _ = shape_text(FACES[font], s, size, ls)
    w = x1 - x0
    left = x if anchor == 'l' else x - w / 2 if anchor == 'c' else x - w
    tx, ty = left - x0, cy - (y0 + y1) / 2
    a = f' fill-opacity="{op}"' if op != 1 else ''
    f = f' filter="url(#{flt})"' if flt else ''
    return f'<path transform="translate({r1(tx)} {r1(ty)})" d="{d}" fill="{fill}"{a}{f}/>'

def ink_w(s, font, size, ls=0):
    _, (x0, _, x1, _), _ = shape_text(FACES[font], s, size, ls)
    return x1 - x0

# ---------- palette (same tokens as the 오늘 기록 cards, logtpl.js TOKENS) ----------
PAPER, CREAM, INK, GLASS = '#ECEBE6', '#F4F2EC', '#17181B', '#111214'
RUN, RACE, GEAR, DIET = '#B5C96A', '#E08A62', '#7FA8C9', '#6FB894'
MEDAL_INK = '#3B3018'

DEFS = ('<filter id="s" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity=".28"/></filter>'
        '<filter id="t" x="-20%" y="-40%" width="140%" height="190%"><feDropShadow dx="0" dy="3" stdDeviation="8" flood-color="#000" flood-opacity=".5"/></filter>')
GOLD = '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E2CC92"/><stop offset=".55" stop-color="#BFA262"/><stop offset="1" stop-color="#86703A"/></linearGradient>'

def rect(x, y, w, h, fill, r=0, op=1, stroke=None, sw=2, sop=1, flt=None, extra=''):
    a = f' rx="{r}"' if r else ''
    a += f' fill-opacity="{op}"' if op != 1 else ''
    if stroke:  # inside stroke like Figma: inset by half the width
        x, y, w, h, r = x + sw / 2, y + sw / 2, w - sw, h - sw, max(0, r - sw / 2)
        a = (f' rx="{r1(r)}"' if r else '') + (f' fill-opacity="{op}"' if op != 1 else '')
        a += f' stroke="{stroke}" stroke-width="{sw}"' + (f' stroke-opacity="{sop}"' if sop != 1 else '')
    f = f' filter="url(#{flt})"' if flt else ''
    return f'<rect x="{r1(x)}" y="{r1(y)}" width="{r1(w)}" height="{r1(h)}"{a} fill="{fill}"{f}{extra}/>'

def circ(cx, cy, r, fill='none', op=1, stroke=None, sw=2, sop=1, dash=None, flt=None):
    a = f' fill-opacity="{op}"' if op != 1 else ''
    if stroke:
        r -= sw / 2
        a += f' stroke="{stroke}" stroke-width="{sw}"' + (f' stroke-opacity="{sop}"' if sop != 1 else '') + (f' stroke-dasharray="{dash}"' if dash else '')
    f = f' filter="url(#{flt})"' if flt else ''
    return f'<circle cx="{r1(cx)}" cy="{r1(cy)}" r="{r1(r)}" fill="{fill}"{a}{f}/>'

def top_band(x, y, w, h, r, fill):  # band with only the top corners rounded
    return f'<path d="M{x} {y + h}V{y + r}a{r} {r} 0 0 1 {r}-{r}h{w - 2 * r}a{r} {r} 0 0 1 {r} {r}V{y + h}z" fill="{fill}"/>'

ICONS = {  # 48×48 line icons (stroke 3.5) — same as the Figma board
    'check': '<path d="M12 25l8 8 16-17" stroke-width="5"/>',
    'dawn': '<path d="M13 32a11 11 0 0 1 22 0M6 38h36M24 9v6M9.5 18.5l4 3M38.5 18.5l-4 3"/>',
    'drop': '<path d="M24 6c6 8 12 15 12 22a12 12 0 0 1-24 0c0-7 6-14 12-22z"/>',
    'heart': '<path d="M24 40S7 30 7 18a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 12-17 22-17 22z"/>',
    'spark': '<path d="M24 5l4 13 13 4-13 4-4 13-4-13-13-4 13-4z"/>',
    'cup': '<path d="M13 12h22l-3 29H16zM14.5 24h19M28 12l4-8"/>',
    'shoe': '<path d="M5 33V18c4 0 7-2 9-6l9 7c3 2 7 3 11 4 5 1 9 3 9 7v3zM5 39h38M17 20l-3 4M21 23l-3 4"/>',
}
def icon(k, x, y, s, col):
    return f'<g transform="translate({x} {y}) scale({s / 48:.4g})" fill="none" stroke="{col}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">{ICONS[k]}</g>'

def star(cx, cy, R, fill):
    import math
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = R if i % 2 == 0 else R * .45
        pts.append(f'{r1(cx + rr * math.cos(a))} {r1(cy + rr * math.sin(a))}')
    return f'<path d="M{"L".join(pts)}z" fill="{fill}"/>'

# ---------- builders (coordinates in the 512 frame, as in Figma) ----------
def pill(ic, label, sub, col):
    sz = 46
    while 40 + 56 + 22 + ink_w(label, 'mono', sz, 4) + 48 > 470:  # long labels shrink to stay inside the 512 frame
        sz -= 1
    w = 40 + 56 + 22 + ink_w(label, 'mono', sz, 4) + 48
    x = 256 - w / 2
    out = rect(x, 196, w, 120, GLASS, r=60, op=.66, flt='s') + rect(x, 196, w, 120, 'none', r=60, stroke=PAPER, sw=2, sop=.22)
    out += icon(ic, r1(x + 40), 228, 56, col) + text(label, 'mono', sz, x + 118, 256, ls=4)
    if sub:
        out += text(sub, 'mono', 22, 256, 352, ls=14, anchor='c', op=.9, flt='t')
    return out

def chip(big, tag):
    out = rect(66, 166, 380, 180, GLASS, r=36, op=.66, flt='s') + rect(66, 166, 380, 180, 'none', r=36, stroke=PAPER, sw=2, sop=.22)
    out += circ(112, 256, 13, stroke=PAPER, sw=3, sop=.7)
    out += text(big, 'anton', 112 if len(big) > 3 else 124, 150, 256)
    out += text(tag, 'mono', 22, 256, 138, ls=16, anchor='c', flt='t')
    return out

def tape(ko, en, fill, op=.94):
    return rect(46, 181, 420, 150, fill, op=op, flt='s') + text(ko, 'pre', 54, 78, 230, fill=INK, ls=-2) + text(en, 'mono', 20, 80, 292, fill=INK, ls=8, op=.65)

def quote(a, b, tag, col):
    return (text(a, 'pre', 62, 70, 192, ls=-3, flt='t') + text(b, 'pre', 62, 70, 274, ls=-3, flt='t')
            + rect(74, 340, 64, 4, col) + text(tag, 'mono', 20, 152, 342, ls=16, op=.9, flt='t'))

def dark_card(x, y, w, h):
    return rect(x, y, w, h, INK, r=32, op=.9, flt='s')

def pacer():
    w5 = ink_w('5:00', 'inter', 96, -4)
    return (dark_card(86, 156, 340, 200) + text('PACER', 'mono', 20, 118, 196, fill=RACE, ls=16)
            + text('5:00', 'inter', 96, 112, 282, ls=-4) + text('/km', 'mono', 26, 112 + w5 + 14, 304, op=.7))

def streak():
    out = dark_card(56, 156, 400, 200) + text('10', 'inter', 84, 88, 218, ls=-4) + text('DAYS IN A ROW', 'mono', 20, 186, 218, ls=10, op=.7)
    for i in range(10):
        out += circ(104 + i * 34, 306, 10, RUN if i < 9 else PAPER, op=1 if i < 9 else .25)
    return out

def splits():
    out = dark_card(76, 116, 360, 280) + text('NEGATIVE SPLIT', 'mono', 20, 108, 158, ls=10, op=.7)
    for i, h in enumerate([150, 138, 128, 116, 100]):
        out += rect(112 + i * 60, 360 - h, 36, h, RUN if i == 4 else GEAR, r=6, op=1 if i == 4 else .8)
    return out

def medal():
    return (f'<path d="M170 40h66l40 160h-66z" fill="{RACE}"/><path d="M276 40h66l-40 160h-66z" fill="{INK}"/>'
            + circ(256, 300, 135, 'url(#g)', flt='s') + circ(256, 300, 112, stroke=MEDAL_INK, sw=3, sop=.45)
            + text('10K', 'anton', 96, 256, 290, fill=MEDAL_INK, anchor='c') + text('FINISHER', 'mono', 20, 256, 366, fill=MEDAL_INK, ls=16, anchor='c'))

def stamp():
    g = (circ(256, 256, 165, CREAM, op=.92, flt='s') + circ(256, 256, 165, stroke=RACE, sw=5) + circ(256, 256, 145, stroke=RACE, sw=2)
         + rect(150, 200, 212, 3, RACE) + rect(150, 318, 212, 3, RACE)
         + text('FINISHED', 'mono', 44, 256, 240, fill=RACE, ls=8, anchor='c') + text('WELL DONE', 'mono', 26, 256, 288, fill=RACE, ls=10, anchor='c'))
    return f'<g transform="rotate(-10 256 256)">{g}</g>'

STICKERS = {
    'ohunwan': ('오운완', lambda: rect(46, 186, 420, 140, CREAM, r=70, flt='s') + circ(120, 256, 44, RUN) + icon('check', 92, 228, 56, INK)
                + text('오운완', 'pre', 76, 182, 256, fill=INK, ls=-2) + text('WORKOUT DONE', 'mono', 22, 256, 366, ls=16, anchor='c', flt='t')),
    'pb': ('PB 개인 기록', lambda: circ(256, 256, 200, INK, flt='s') + circ(256, 256, 178, stroke=PAPER, sw=2, sop=.3) + star(256, 128, 15, 'url(#g)')
           + text('PB', 'anton', 190, 256, 240, anchor='c') + text('PERSONAL BEST', 'mono', 22, 256, 362, ls=14, anchor='c', op=.7)),
    'runlini': ('런린이', lambda: tape('런린이', 'LV.1', RUN)),
    'crew': ('러닝 크루', lambda: circ(256, 256, 180, GLASS, op=.66, flt='s') + circ(256, 256, 180, stroke=PAPER, sw=3, sop=.9) + circ(256, 256, 158, stroke=PAPER, sw=2, sop=.35, dash='4 8')
             + text('RUN', 'anton', 84, 256, 206, anchor='c') + text('CREW', 'anton', 84, 256, 292, fill=RUN, anchor='c') + text('EST. 2026', 'mono', 18, 256, 358, ls=14, anchor='c', op=.7)),
    'bib': ('배번', lambda: rect(56, 136, 400, 260, CREAM, r=14, flt='s') + top_band(56, 136, 400, 60, 14, GEAR) + text('SEOUL 10K', 'mono', 24, 80, 166, fill=CREAM, ls=10)
            + ''.join(circ(x, y, 7, '#D9D5CA') for x, y in [(78, 214), (434, 214), (78, 374), (434, 374)]) + text('1031', 'anton', 150, 256, 296, fill=INK, anchor='c')),
    'dawnrun': ('새벽런', lambda: pill('dawn', 'DAWN RUN', '05:30 AM', '#F2B48A')),
    'rainrun': ('비런', lambda: pill('drop', 'RAIN RUN', 'STILL RAN', GEAR)),
    'hangang': ('한강런', lambda: tape('한강런', 'HAN RIVER RUN', CREAM)),
    'marathon': ('풀코스 42.195', lambda: rect(46, 176, 420, 160, CREAM, r=28, flt='s') + top_band(46, 176, 420, 44, 28, INK)
                 + text('FULL MARATHON', 'mono', 20, 256, 198, ls=16, anchor='c') + text('42.195', 'anton', 96, 256, 280, fill=INK, anchor='c')),
    'shoe': ('새 러닝화', lambda: pill('shoe', 'NEW KICKS', 'RUNNING SHOES', PAPER)),
    'medal': ('완주 메달', medal),
    'splits': ('네거티브 스플릿', splits),
    'tiredhappy': ('힘들었지만 좋았다', lambda: quote('힘들었지만,', '좋았다.', 'TODAY', RACE)),
    'stamp': ('완주 도장', stamp),
    'chip5k': ('5K 칩', lambda: chip('5K', 'FIRST')),
    'chip10k': ('10K 칩', lambda: chip('10K', 'FIRST')),
    'chiphalf': ('하프 칩', lambda: chip('HALF', '21.0975')),
    'heart': ('RUN LOVER', lambda: pill('heart', 'RUN LOVER', '', RACE)),
    'handwritten': ('오늘도 달렸다', lambda: quote('오늘도', '달렸다.', 'DAY BY DAY', RUN)),
    'streak': ('연속 기록', streak),
    'runnershigh': ('러너스 하이', lambda: pill('spark', "RUNNER'S HIGH", '', '#F2D38A')),
    'fuel': ('급수 완료', lambda: pill('cup', 'HYDRATED', 'WATER STOP', GEAR)),
    'pacer': ('페이서', pacer),
    'together': ('같이 뛰자', lambda: tape('같이 뛰자', 'RUN TOGETHER', CREAM)),
    'proud': ('나 칭찬해', lambda: tape('나 칭찬해', 'PROUD OF ME', RACE)),
    'wordmark': ('hoohaa 워드마크', lambda: rect(86, 216, 340, 80, INK, r=40, op=.85, flt='s') + circ(128, 256, 9, RUN) + text('hoohaa.run', 'mono', 36, 150, 256)),
}

def svg(body):
    defs = DEFS + (GOLD if 'url(#g)' in body else '')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs>{defs}</defs>{body}</svg>'

def main():
    out = {k: svg(fn()) for k, (_, fn) in STICKERS.items()}
    src = ASSETS.read_text().split('\n')
    old_names = json.loads(next(l for l in src if l.startswith('export const STK_NAMES')).split('=', 1)[1].strip().rstrip(';'))
    names = {k: n for k, (n, _) in STICKERS.items()}
    names.update({k: v for k, v in old_names.items() if k.startswith('data_')})  # data stickers are drawn in editor.js
    for i, l in enumerate(src):
        if l.startswith('// generated by build_v4_templates.py — 26 static stickers'):
            src[i] = '// generated by tools/build_stickers.py — 26 static stickers, v5 (Figma "Share v5 — redesign"; text outlined)'
        elif l.startswith('export const STK_NAMES'):
            src[i] = 'export const STK_NAMES = ' + json.dumps(names, ensure_ascii=False) + ';'
        elif l.startswith('export const STK_SVG'):
            src[i] = 'export const STK_SVG = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';'
    ASSETS.write_text('\n'.join(src))
    print(f'{len(out)} stickers, {sum(map(len, out.values())) // 1024} KB')
    if '--preview' in sys.argv:
        p = Path(sys.argv[sys.argv.index('--preview') + 1])
        cells = ''.join(f'<figure><img src="data:image/svg+xml;base64,{base64.b64encode(v.encode()).decode()}"><figcaption>{k}</figcaption></figure>' for k, v in out.items())
        p.write_text('<body style="margin:0;background:#2a2622 linear-gradient(#5a5f78,#c0573a 60%,#1b1d22);display:grid;grid-template-columns:repeat(7,1fr);gap:8px;padding:16px;font:12px monospace;color:#ddd">'
                     '<style>img{width:100%}figure{margin:0;text-align:center}</style>' + cells + '</body>')

if __name__ == '__main__':
    main()
