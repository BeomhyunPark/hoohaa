# Makes tools/snap/fixtures/runner.jpg: python3 tools/snap/fixtures/make_runner.py tools/snap/fixtures/runner.jpg (Pillow).
# The committed JPEG is the reference; a different Pillow version may encode slightly different bytes.
# Synthetic test photo: a runner-ish figure (skin head, shirt, arms, legs) on a park-like background. 2000x2500 so addPhotoFile downscales it.
import sys
from PIL import Image, ImageDraw, ImageFilter
W, H = 2000, 2500
im = Image.new('RGB', (W, H))
d = ImageDraw.Draw(im)
for y in range(H):  # sky -> grass gradient
    t = y / H
    c = (int(120 + 80 * (1 - t)), int(170 + 40 * (1 - t)), int(220 - 120 * t)) if t < .62 else (int(70 + 30 * t), int(130 - 20 * t), int(60))
    d.line([(0, y), (W, y)], fill=c)
for i, x in enumerate(range(-100, W, 260)):  # trees
    d.ellipse([x, 1250 - (i % 3) * 60, x + 320, 1650], fill=(40 + (i % 3) * 15, 100, 50))
d.rectangle([0, 1700, W, 1820], fill=(150, 140, 125))  # path
skin, shirt, short, shoe = (214, 170, 140), (220, 60, 60), (30, 35, 45), (240, 240, 240)
cx = 1000
d.ellipse([cx - 150, 420, cx + 150, 780], fill=skin)         # head
d.ellipse([cx - 160, 380, cx + 160, 560], fill=(40, 30, 25))  # hair
d.rectangle([cx - 60, 760, cx + 60, 840], fill=skin)          # neck
d.rounded_rectangle([cx - 260, 820, cx + 260, 1500], 120, fill=shirt)  # torso
d.line([(cx - 230, 900), (cx - 420, 1250), (cx - 360, 1500)], fill=skin, width=110, joint='curve')  # arms
d.line([(cx + 230, 900), (cx + 420, 1200), (cx + 520, 1000)], fill=skin, width=110, joint='curve')
d.rounded_rectangle([cx - 240, 1450, cx + 240, 1720], 60, fill=short)
d.line([(cx - 130, 1700), (cx - 220, 2100), (cx - 180, 2380)], fill=skin, width=140, joint='curve')  # legs
d.line([(cx + 130, 1700), (cx + 260, 2050), (cx + 420, 2250)], fill=skin, width=140, joint='curve')
d.ellipse([cx - 290, 2330, cx - 60, 2440], fill=shoe); d.ellipse([cx + 340, 2200, cx + 560, 2310], fill=shoe)
for ex in (-60, 60): d.ellipse([cx + ex - 18, 590, cx + ex + 18, 626], fill=(30, 25, 20))  # eyes
d.arc([cx - 60, 640, cx + 60, 720], 20, 160, fill=(120, 40, 40), width=10)
im = im.filter(ImageFilter.GaussianBlur(1.2))
im.save(sys.argv[1], 'JPEG', quality=82, optimize=True)
