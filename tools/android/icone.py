"""Crea le icone dell'app Android partendo da quelle del sito.
Uso (dalla cartella del repository):  python3 tools/android/icone.py
Scrive in android/app/src/main/res/ e aggiorna badge-96.png (icona piccola delle notifiche nel sito)."""
import os
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}


def save(img, folder, name, px):
    d = os.path.join(RES, folder)
    os.makedirs(d, exist_ok=True)
    img.resize((px, px), Image.LANCZOS).save(os.path.join(d, name), optimize=True)


def cards(size=384):
    """Due carte sovrapposte, bianche su trasparente: l'icona piccola della barra di stato."""
    big = Image.new('L', (size, size), 0)
    s = size / 96

    def card(cx, cy, w, h, ang, cut=None):
        layer = Image.new('L', (size, size), 0)
        d = ImageDraw.Draw(layer)
        d.rounded_rectangle([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], radius=7 * s, fill=255)
        if cut:  # occhio sulla carta davanti, come nell'icona dell'app
            r = cut * s
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=0)
            d.ellipse([cx - r * .45, cy - r * .45, cx + r * .45, cy + r * .45], fill=255)
        return layer.rotate(ang, resample=Image.BICUBIC, center=(cx, cy))

    back = card(36 * s, 50 * s, 40 * s, 58 * s, 14)
    front = card(58 * s, 46 * s, 40 * s, 58 * s, -12, cut=11)
    # bordo trasparente attorno alla carta davanti, così le due carte restano distinte
    edge = front.point(lambda v: 255 if v else 0).resize((size, size))
    from PIL import ImageFilter
    edge = edge.filter(ImageFilter.MaxFilter(int(9 * s) | 1))
    big.paste(back, (0, 0), back)
    big.paste(0, (0, 0), edge)
    big.paste(front, (0, 0), front)
    out = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    out.putalpha(big)
    return out


def main():
    icon = Image.open(os.path.join(ROOT, 'icon-512.png')).convert('RGBA')
    mask = Image.open(os.path.join(ROOT, 'icon-maskable-512.png')).convert('RGBA')
    for k, f in DENS.items():
        save(icon, 'mipmap-' + k, 'ic_launcher.png', int(48 * f))
        save(mask, 'mipmap-' + k, 'ic_maskable.png', round(82 * f))
    save(icon, 'drawable-xxhdpi', 'splash.png', 432)
    small = cards()
    for k, f in DENS.items():
        save(small, 'drawable-' + k, 'ic_notification_icon.png', int(24 * f))
    small.resize((96, 96), Image.LANCZOS).save(os.path.join(ROOT, 'badge-96.png'), optimize=True)
    print('icone pronte')


if __name__ == '__main__':
    main()
