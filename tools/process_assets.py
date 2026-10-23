#!/usr/bin/env python3
"""Trasforma le incisioni antiche (presagio/img/src) nello stile "fantasy moderno" di Presagio:
ombre in nero profondo, luci accese nel colore della casata, bagliore morbido.
Uso: python3 tools/process_assets.py"""
import os
from PIL import Image, ImageFilter, ImageOps, ImageChops, ImageDraw
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'presagio', 'img', 'src')
OUT = os.path.join(ROOT, 'presagio', 'img')

def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

# tavolozze: posizione (0-1) -> colore
PAL = {
    'fiamme':   [(0, '#050102'), (.30, '#3a0702'), (.52, '#d1340a'), (.74, '#ff9a3a'), (1, '#fff7dc')],
    'maree':    [(0, '#02040a'), (.30, '#061428'), (.55, '#124f8a'), (.80, '#45b6ff'), (1, '#e6f8ff')],
    'foreste':  [(0, '#020604'), (.30, '#06180e'), (.55, '#16613a'), (.80, '#4fe08f'), (1, '#e9ffe0')],
    'sabbie':   [(0, '#060403'), (.30, '#1f1406'), (.55, '#7a5313'), (.80, '#f2b640'), (1, '#fff6d6')],
    'arcimago': [(0, '#040312'), (.30, '#140b33'), (.55, '#4a2a9c'), (.80, '#b48cff'), (1, '#ffe7a8')],
    'giullare': [(0, '#05030a'), (.35, '#2a0b2c'), (.60, '#a8306e'), (.82, '#ff79b8'), (1, '#c8fff4')],
    'cielo':    [(0, '#05041a'), (.35, '#140f3d'), (.62, '#55459c'), (.85, '#e7c26b'), (1, '#fff3cf')],
    'flammarion': [(0, '#04030f'), (.35, '#120c33'), (.62, '#4f3d98'), (.85, '#d9b45f'), (1, '#fff3cf')],
}

def gradient_map(gray, stops):
    g = np.asarray(gray, dtype=np.float32) / 255.0
    xs = [s[0] for s in stops]; cols = [hexrgb(s[1]) for s in stops]
    out = np.zeros(g.shape + (3,), dtype=np.float32)
    for c in range(3):
        out[..., c] = np.interp(g, xs, [col[c] for col in cols])
    return Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGB')

def stylize(im, key, invert=False, gamma=1.0, bloom=0.55, contrast_cut=1):
    g = ImageOps.grayscale(im)
    g = ImageOps.autocontrast(g, cutoff=contrast_cut)
    if invert: g = ImageOps.invert(g)
    if gamma != 1.0:
        arr = (np.asarray(g, dtype=np.float32) / 255.0) ** gamma
        g = Image.fromarray((arr * 255).clip(0, 255).astype(np.uint8), 'L')
    col = gradient_map(g, PAL[key])
    # bagliore: le parti chiare sfocate e sommate in modalità "screen"
    hi = g.point(lambda v: 0 if v < 150 else int((v - 150) * 255 / 105))
    glow = gradient_map(hi.filter(ImageFilter.GaussianBlur(max(4, im.width // 90))), PAL[key])
    glow = Image.blend(Image.new('RGB', col.size, (0, 0, 0)), glow, bloom)
    col = ImageChops.screen(col, glow)
    return col

def vignette(im, strength=0.65):
    w, h = im.size
    y, x = np.ogrid[:h, :w]
    d = np.sqrt(((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2)
    m = (1 - strength * np.clip(d - 0.55, 0, 1) / 0.45).clip(0, 1)
    arr = np.asarray(im, dtype=np.float32) * m[..., None]
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), 'RGB')

def crop_box(im, box):  # box in frazioni (x0, y0, x1, y1)
    w, h = im.size
    return im.crop((int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)))

def fit_ratio(im, ratio, anchor=(0.5, 0.5)):  # ritaglia al rapporto larghezza/altezza voluto
    w, h = im.size
    if w / h > ratio:
        nw = int(h * ratio); x0 = int((w - nw) * anchor[0]); return im.crop((x0, 0, x0 + nw, h))
    nh = int(w / ratio); y0 = int((h - nh) * anchor[1]); return im.crop((0, y0, w, y0 + nh))

def load(name): return Image.open(os.path.join(SRC, name + '.jpg')).convert('RGB')

def save(im, name, size, q=80):
    im = im.resize(size, Image.LANCZOS)
    im.save(os.path.join(OUT, name), quality=q, optimize=True, progressive=True)
    print(name, im.size, os.path.getsize(os.path.join(OUT, name)) // 1024, 'KB')

CARD = (640, 896)  # rapporto 5:7, un po' più grande della carta per poter variare l'inquadratura

def card(key, box, anchor=(0.5, 0.5), invert=False, gamma=1.0, bloom=0.55, cut=1):
    im = fit_ratio(crop_box(load(key), box), 5 / 7, anchor)
    save(vignette(stylize(im, key, invert, gamma, bloom, cut), 0.55), 'card-%s.jpg' % key, CARD)

if __name__ == '__main__':
    card('fiamme', (0.10, 0.11, 0.90, 0.855), anchor=(0.75, 0.5), gamma=1.7, bloom=0.9, cut=2)
    card('maree', (0.0, 0.0, 1.0, 1.0), gamma=0.9)
    card('foreste', (0.03, 0.02, 0.97, 0.875), gamma=0.8)
    card('sabbie', (0.0, 0.0, 1.0, 1.0), gamma=2.2, bloom=0.6, cut=2)
    card('arcimago', (0.0, 0.22, 0.78, 1.0), anchor=(0.0, 0.5), gamma=1.15, bloom=0.85, cut=2)
    card('giullare', (0.0, 0.06, 1.0, 0.93), invert=True, gamma=1.5, bloom=0.45)
    # dorso: il planisfero ritagliato a cerchio
    cielo = load('cielo'); w, h = cielo.size
    disc = cielo.crop((int(w * 0.255), int(h * 0.165), int(w * 0.745), int(h * 0.165) + int(w * 0.49)))
    st = stylize(disc, 'cielo', invert=True, gamma=1.7, bloom=0.5)
    save(st, 'cielo-disc.jpg', (900, 900), 78)
    # home: Flammarion senza didascalia
    fl = crop_box(load('flammarion'), (0.0, 0.0, 1.0, 0.86))
    save(vignette(stylize(fl, 'flammarion', invert=True, gamma=1.6, bloom=0.45), 0.5), 'hero.jpg', (1200, int(1200 * fl.height / fl.width)), 76)
