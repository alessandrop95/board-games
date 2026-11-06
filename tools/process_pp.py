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

def paperize(im, lo=200):
    """Fondo bianco o grigio chiaro delle foto d'oggetto → colore carta, con passaggio morbido."""
    a = np.asarray(im, dtype=np.float32); m = ((a.min(axis=2) - lo) / (255 - lo)).clip(0, 1)[..., None]
    return Image.fromarray((a * (1 - m) + np.array(PAPER, dtype=np.float32) * m).clip(0, 255).astype(np.uint8), 'RGB')

def object_card(key, box=(0, 0, 1, 1), rotate=0, fill=0.86, paper=0, **kw):
    """Oggetti (armi da catalogo): l'incisione intera su carta, eventualmente inclinata."""
    im = treat(load('c-' + key), **kw)
    if paper: im = paperize(im, paper)
    W, H = im.size; im = im.crop((int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)))
    if rotate:
        mask = Image.new('L', im.size, 255)
        im = im.rotate(rotate, resample=Image.BICUBIC, expand=True, fillcolor=PAPER)
    canvas = Image.new('RGB', ART, PAPER)
    im.thumbnail((int(ART[0] * fill), int(ART[1] * fill)), Image.LANCZOS)
    canvas.paste(im, ((ART[0] - im.width) // 2, (ART[1] - im.height) // 2))
    save(canvas, 'c-%s.jpg' % key, ART)

TALL = (500, 700)  # personaggi e ruoli: carta intera
def tall(src, out, box, face=None, inside=False, **kw):
    t = treat(load(src), **kw)
    im = (crop_inside(t, box, TALL[0] / TALL[1]) if inside else crop_ratio(t, box, TALL[0] / TALL[1])).resize(TALL, Image.LANCZOS)
    save(im, out + '.jpg', TALL)
    if face:  # miniatura del volto per le schede dei giocatori (coordinate sulla carta finita)
        fx, fy, fs = face; W, H = im.size; s = fs * W
        f = crop_ratio(im, ((fx * W - s / 2) / W, (fy * H - s / 2) / H, (fx * W + s / 2) / W, (fy * H + s / 2) / H), 1.0)
        save(f, 'f-' + out[2:] + '.jpg', (180, 180), 78)

def dodge_city(faces=True):
    """Dodge City: 22 carte nuove e 15 personaggi."""
    card('pugno', (.03, .03, .97, .97))
    card('tuffo', (.05, .06, .95, .86))
    card('ragtime', (.04, .0, .96, .74))
    card('rissa')
    object_card('springfield', rotate=18, fill=.96)
    card('tequila', (0, .04, 1, .86))
    object_card('liquore', fill=.9)
    card('binocolo', (0, .1, 1, .9))
    card('rifugio', (0, .12, 1, 1))
    card('bibbia', (0, .06, .93, .94))
    card('cappello')
    card('placca', (.04, .08, .96, .92))
    object_card('sombrero', (0, .22, 1, .78), fill=.95)
    object_card('pugnale', (0, 0, 1, .62), rotate=14, fill=.95)
    object_card('derringer', fill=.9, paper=200)
    card('borraccia', (0, 0, .66, 1))
    card('cancan', (0, 0, 1, .6))
    card('conestoga', (0, .08, 1, .92))
    card('fucile', (0, .08, 1, .9))
    card('ponyexpress', (0, .04, 1, .8))
    object_card('pepperbox', fill=.9, paper=165)
    card('howitzer')
    F = FACES if faces else {}
    tall('p-apache', 'p-apache', (.3, .1, .95, .86), F.get('apache'))
    tall('p-belle', 'p-belle', (.32, .04, 1, .645), F.get('belle'), inside=True)
    tall('p-bill', 'p-bill', (0, .11, .576, .65), F.get('bill'), inside=True)
    tall('p-chuck', 'p-chuck', (.1, .12, .64, .8), F.get('chuck'), inside=True)
    tall('p-docholy', 'p-docholy', (.3, .27, .95, .92), F.get('docholy'), inside=True)
    tall('p-elena', 'p-elena', (0, .04, 1, .76), F.get('elena'), inside=True)
    tall('p-greg', 'p-greg', (.14, .24, .86, .7), F.get('greg'), inside=True)
    tall('p-herb', 'p-herb', (0, .06, 1, .78), F.get('herb'), inside=True)
    tall('p-jose', 'p-jose', (.04, 0, .96, 1), F.get('jose'))
    tall('p-molly', 'p-molly', (.04, 0, .96, 1), F.get('molly'))
    tall('p-pat', 'p-pat', (.16, .04, 1, .76), F.get('pat'), inside=True)
    tall('p-pixie', 'p-pixie', (.08, 0, .92, .76), F.get('pixie'), inside=True)
    tall('p-sean', 'p-sean', (.45, .218, .95, .705), F.get('sean'), inside=True)
    tall('p-tequilajoe', 'p-tequilajoe', (.45, .16, 1, .694), F.get('tequilajoe'), inside=True)
    tall('p-vera', 'p-vera', (0, 0, 1, 1), F.get('vera'), inside=True)

# volti delle miniature (x, y del centro e lato, in frazioni della carta finita 500x700)
FACES = {
    'apache': (0.33, 0.27, 0.24), 'belle': (0.4, 0.2, 0.3), 'bill': (0.43, 0.24, 0.34), 'chuck': (0.56, 0.12, 0.26), 'docholy': (0.42, 0.42, 0.5),
    'elena': (0.33, 0.28, 0.26), 'greg': (0.6, 0.47, 0.3), 'herb': (0.71, 0.33, 0.24), 'jose': (0.5, 0.5, 0.56), 'molly': (0.5, 0.53, 0.5),
    'pat': (0.5, 0.24, 0.24), 'pixie': (0.53, 0.27, 0.24), 'sean': (0.5, 0.15, 0.26), 'tequilajoe': (0.31, 0.16, 0.28), 'vera': (0.45, 0.26, 0.28)}

if __name__ == '__main__':
    import sys
    if sys.argv[1:] == ['dc']: dodge_city(); sys.exit()
    dodge_city()
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
    card('schioppo', (.38, .3, 1, 1))
    card('bisonte', (0, .27, 1, .82))
    object_card('ripetitore', (0, 0, 1, .7), fill=.94)
    object_card('revolver', (.02, .28, 1, .78), fill=.92)
    object_card('carabina', (0, 0, 1, 1), rotate=24, fill=.96)
    tall('p-abner', 'p-abner', (0, .02, 1, .97), (0.5, 0.095, 0.28))
    tall('p-cascabel', 'p-cascabel', (0, 0, 1, .98), (0.47, 0.12, 0.28))
    tall('p-clem', 'p-clem', (0, 0, 1, 1), (0.5, 0.07, 0.3))
    tall('p-crowe', 'p-crowe', (.05, .08, .95, .92), (0.47, 0.15, 0.26))
    tall('p-doc', 'p-doc', (.05, .05, .95, .95), (0.5, 0.135, 0.26))
    tall('p-dolly', 'p-dolly', (.05, .04, .95, .92), (0.52, 0.245, 0.24))
    tall('p-faro', 'p-faro', (.05, .04, .95, .72), (0.58, 0.3, 0.34))
    tall('p-fortuna', 'p-fortuna', (.05, 0, .95, .97), (0.46, 0.095, 0.26))
    tall('p-gazza', 'p-gazza', (.28, 0, .64, 1), (0.31, 0.29, 0.26))
    tall('p-hattie', 'p-hattie', (0, 0, 1, .95), (0.48, 0.17, 0.28))
    tall('p-lark', 'p-lark', (.1, .12, .9, .95), (0.55, 0.13, 0.3))
    tall('p-maggie', 'p-maggie', (.05, .08, .95, .86), (0.52, 0.18, 0.24))
    tall('p-nate', 'p-nate', (0, .02, 1, .98), (0.47, 0.07, 0.3))
    tall('p-padre', 'p-padre', (.05, .02, .95, .98), (0.5, 0.52, 0.6))
    tall('p-thorne', 'p-thorne', (0, .03, 1, .98), (0.37, 0.18, 0.24))
    tall('p-wren', 'p-wren', (0, 0, 1, .97), (0.47, 0.17, 0.28))
    tall('r-sceriffo', 'r-sceriffo', (0, 0, 1, 1))
    tall('r-vice', 'r-vice', (0, 0, 1, .92))
    tall('r-bandito', 'r-bandito', (0, 0, .62, 1))
    tall('r-traditore', 'r-traditore', (.05, 0, .95, 1))
    # home, sfondo del tavolo, lapide
    h = treat(load('c-mitraglia')); save(crop_inside(h, (.02, .1, .98, .9), 1.35), 'hero.jpg', (1080, 800), 74)
    t = treat(load('town')); save(t.crop((0, int(t.height * .12), t.width, int(t.height * .9))), 'town.jpg', (1400, int(1400 * (t.height * .78) / t.width)), 66)
    tb = treat(load('tomb')); save(crop_inside(tb, (.08, .05, .92, .95), .95), 'tomb.jpg', (380, 400), 74)
