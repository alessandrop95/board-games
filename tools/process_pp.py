#!/usr/bin/env python3
"""Prepara le illustrazioni di Polvere & Piombo restando fedeli agli originali antichi:
le incisioni in bianco e nero prendono solo un leggero tono seppia (inchiostro bruno su carta),
i dipinti e le cartoline a colori restano a colori. Si ritaglia e si ridimensiona per le carte.
Uso: python3 tools/process_pp.py"""
import os
from PIL import Image, ImageOps, ImageFilter, ImageStat
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'polvere-e-piombo', 'img', 'src')
OUT = os.path.join(ROOT, 'polvere-e-piombo', 'img')
INK, PAPER = (38, 24, 14), (243, 232, 208)

def load(n):
    im = Image.open(os.path.join(SRC, n + '.jpg'))
    if im.mode in ('P', 'LA', 'RGBA'):
        im = im.convert('RGBA'); bg = Image.new('RGBA', im.size, PAPER + (255,)); bg.alpha_composite(im); im = bg
    return im.convert('RGB')

def is_mono(im):
    small = im.resize((96, 96)); hsv = np.asarray(small.convert('HSV'), dtype=np.float32)
    return hsv[..., 1].mean() < 38  # poca saturazione: incisione o disegno (anche se la carta è ingiallita)

def treat(im, mono=None, cut=1, gamma=1.0):
    if mono is None: mono = is_mono(im)
    if mono:
        g = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=cut)
        if gamma != 1.0:
            g = Image.fromarray(((np.asarray(g, dtype=np.float32) / 255.0) ** gamma * 255).clip(0, 255).astype(np.uint8), 'L')
        a = np.asarray(g, dtype=np.float32)[..., None] / 255.0
        out = np.array(INK, dtype=np.float32) * (1 - a) + np.array(PAPER, dtype=np.float32) * a
        return Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGB')
    im = ImageOps.autocontrast(im, cutoff=cut)
    arr = np.asarray(im, dtype=np.float32) * np.array([1.03, 1.0, 0.95])  # appena più caldo, come una stampa d'epoca
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), 'RGB')

def crop_ratio(im, box, ratio, pad=PAPER):
    """Ritaglia attorno al riquadro (frazioni) allargandolo al rapporto voluto; se esce dall'immagine riempie col colore carta."""
    W, H = im.size
    x0, y0, x1, y1 = box[0] * W, box[1] * H, box[2] * W, box[3] * H
    w, h = x1 - x0, y1 - y0; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    if w / h > ratio: h = w / ratio
    else: w = h * ratio
    L, T = int(round(cx - w / 2)), int(round(cy - h / 2)); R, B = L + int(round(w)), T + int(round(h))
    canvas = Image.new('RGB', (R - L, B - T), pad)
    canvas.paste(im.crop((max(0, L), max(0, T), min(W, R), min(H, B))), (max(0, -L), max(0, -T)))
    return canvas

def crop_inside(im, box, ratio):
    """Ritaglia dentro al riquadro, al rapporto voluto, senza uscire dall'immagine."""
    W, H = im.size
    x0, y0, x1, y1 = box[0] * W, box[1] * H, box[2] * W, box[3] * H
    w, h = x1 - x0, y1 - y0; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    if w / h > ratio: w = h * ratio
    else: h = w / ratio
    return im.crop((int(cx - w / 2), int(cy - h / 2), int(cx + w / 2), int(cy + h / 2)))

def save(im, name, size, q=74):
    im = im.resize(size, Image.LANCZOS)
    p = os.path.join(OUT, name); im.save(p, quality=q, optimize=True, progressive=True)
    print(name, im.size, os.path.getsize(p) // 1024, 'KB')

ART = (720, 600)  # illustrazione delle carte del mazzo (1.2:1)
def card(key, box=(0, 0, 1, 1), inside=True, **kw):
    im = treat(load('c-' + key), **kw)
    im = crop_inside(im, box, ART[0] / ART[1]) if inside else crop_ratio(im, box, ART[0] / ART[1])
    save(im, 'c-%s.jpg' % key, ART)

def object_card(key, box=(0, 0, 1, 1), rotate=0, fill=0.86, **kw):
    """Oggetti (armi da catalogo): l'incisione intera su carta, eventualmente inclinata."""
    im = treat(load('c-' + key), **kw)
    W, H = im.size; im = im.crop((int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)))
    if rotate:
        mask = Image.new('L', im.size, 255)
        im = im.rotate(rotate, resample=Image.BICUBIC, expand=True, fillcolor=PAPER)
    canvas = Image.new('RGB', ART, PAPER)
    im.thumbnail((int(ART[0] * fill), int(ART[1] * fill)), Image.LANCZOS)
    canvas.paste(im, ((ART[0] - im.width) // 2, (ART[1] - im.height) // 2))
    save(canvas, 'c-%s.jpg' % key, ART)

TALL = (500, 700)  # personaggi e ruoli: carta intera
def tall(src, out, box, face=None, **kw):
    im = crop_ratio(treat(load(src), **kw), box, TALL[0] / TALL[1]).resize(TALL, Image.LANCZOS)
    save(im, out + '.jpg', TALL)
    if face:  # miniatura del volto per le schede dei giocatori (coordinate sulla carta finita)
        fx, fy, fs = face; W, H = im.size; s = fs * W
        f = crop_ratio(im, ((fx * W - s / 2) / W, (fy * H - s / 2) / H, (fx * W + s / 2) / W, (fy * H + s / 2) / H), 1.0)
        save(f, 'f-' + out[2:] + '.jpg', (180, 180), 78)

if __name__ == '__main__':
    card('sparo', (0, 0, 1, .95))
    card('schivata')
    card('whisky')
    card('giro', (0, 0, 1, .92))
    card('posta')
    card('cassaforte', (0, .04, .62, .62))
    card('bottega', (0, 0, 1, .92))
    card('borseggio', (.3, .3, 1, 1))
    card('sabotaggio')
    card('sfida', (.09, .14, .91, .8))
    card('stampede', (0, .08, 1, .82))
    card('mitraglia', (.03, .1, .97, .9))
    card('riparo', (.05, .02, .97, .92))
    card('cavallo', (0, .1, 1, .92))
    card('cannocchiale', (.15, 0, 1, .82))
    card('gattabuia', (0, .15, 1, .95))
    card('candelotto', (0, .06, 1, .88))
    card('schioppo', (0, .14, 1, 1))
    card('bisonte', (0, .27, 1, .82))
    object_card('ripetitore', (0, 0, 1, .7), fill=.94)
    object_card('revolver', (.02, .28, 1, .78), fill=.92)
    object_card('carabina', (0, 0, 1, 1), rotate=24, fill=.96)
    tall('p-abner', 'p-abner', (0, .02, 1, .97), (0.53, 0.075, 0.28))
    tall('p-cascabel', 'p-cascabel', (0, 0, 1, .98), (0.48, 0.085, 0.28))
    tall('p-clem', 'p-clem', (0, 0, 1, 1), (0.5, 0.07, 0.3))
    tall('p-crowe', 'p-crowe', (.05, .08, .95, .92), (0.47, 0.12, 0.28))
    tall('p-doc', 'p-doc', (.05, .05, .95, .95), (0.48, 0.1, 0.28))
    tall('p-dolly', 'p-dolly', (.05, .04, .95, .92), (0.52, 0.12, 0.24))
    tall('p-faro', 'p-faro', (.05, .04, .95, .72), (0.6, 0.18, 0.36))
    tall('p-fortuna', 'p-fortuna', (.05, 0, .95, .97), (0.46, 0.07, 0.28))
    tall('p-gazza', 'p-gazza', (.28, 0, .64, 1), (0.33, 0.11, 0.3))
    tall('p-hattie', 'p-hattie', (0, 0, 1, .95), (0.4, 0.11, 0.28))
    tall('p-lark', 'p-lark', (.1, .12, .9, .95), (0.55, 0.12, 0.3))
    tall('p-maggie', 'p-maggie', (.05, .08, .95, .86), (0.52, 0.13, 0.26))
    tall('p-nate', 'p-nate', (0, .02, 1, .98), (0.47, 0.07, 0.3))
    tall('p-padre', 'p-padre', (.05, .02, .95, .98), (0.5, 0.52, 0.6))
    tall('p-thorne', 'p-thorne', (0, .03, 1, .98), (0.37, 0.11, 0.26))
    tall('p-wren', 'p-wren', (0, 0, 1, .97), (0.48, 0.09, 0.3))
    tall('r-sceriffo', 'r-sceriffo', (0, 0, 1, 1))
    tall('r-vice', 'r-vice', (0, 0, 1, .92))
    tall('r-bandito', 'r-bandito', (0, 0, .62, 1))
    tall('r-traditore', 'r-traditore', (.05, 0, .95, 1))
    # home, sfondo del tavolo, lapide
    h = treat(load('hero')); save(crop_inside(h, (.52, .06, .975, .9), 1.35), 'hero.jpg', (1080, 800), 72)
    t = treat(load('town')); save(t.crop((0, int(t.height * .12), t.width, int(t.height * .9))), 'town.jpg', (1400, int(1400 * (t.height * .78) / t.width)), 66)
    tb = treat(load('tomb')); save(crop_inside(tb, (.08, .05, .92, .95), .95), 'tomb.jpg', (380, 400), 74)
