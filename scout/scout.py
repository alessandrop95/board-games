#!/usr/bin/env python3
"""Cerca su Wikimedia Commons e crea fogli di provini (contact sheet) per scegliere le illustrazioni."""
import json, os, sys, time, urllib.parse, urllib.request, io
from PIL import Image, ImageDraw, ImageFont
UA = 'BoardGamesAssetBot/1.0 (https://github.com/alessandrop95/board-games)'
API = 'https://commons.wikimedia.org/w/api.php?'
def get(url, binary=False):
    for k in range(4):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60).read()
            return r if binary else json.loads(r)
        except Exception as e:
            print('retry', url[:120], e); time.sleep(2 + 3 * k)
    return None
def search(q, n):
    j = get(API + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'list': 'search', 'srnamespace': 6, 'srlimit': n, 'srsearch': q}))
    return [x['title'][5:] for x in (j or {}).get('query', {}).get('search', [])]
def catm(c, n):
    j = get(API + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'list': 'categorymembers', 'cmtype': 'file', 'cmlimit': n, 'cmtitle': 'Category:' + c}))
    return [x['title'][5:] for x in (j or {}).get('query', {}).get('categorymembers', [])]
def info(titles):
    out = {}
    for i in range(0, len(titles), 40):
        j = get(API + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'prop': 'imageinfo', 'iiprop': 'size|extmetadata|url', 'iiurlwidth': 520,
              'iiextmetadatafilter': 'LicenseShortName|DateTimeOriginal|Artist|ImageDescription', 'titles': '|'.join('File:' + t for t in titles[i:i + 40])}))
        for p in (j or {}).get('query', {}).get('pages', {}).values():
            if 'imageinfo' not in p: continue
            ii = p['imageinfo'][0]; m = ii.get('extmetadata', {})
            g = lambda k: str(m.get(k, {}).get('value', ''))[:200]
            out[p['title'][5:]] = {'w': ii['width'], 'h': ii['height'], 'thumb': ii.get('thumburl'), 'lic': g('LicenseShortName'), 'date': g('DateTimeOriginal'), 'artist': g('Artist')}
    return out
cfg = json.load(open('scout/queries.json', encoding='utf-8'))
os.makedirs('scout/out', exist_ok=True)
font = ImageFont.load_default()
index = {}
for name, spec in cfg.items():
    titles = []
    for q in spec.get('search', []): titles += search(q + ' filetype:bitmap', spec.get('n', 12))
    for c in spec.get('cat', []): titles += catm(c, spec.get('n', 60))
    titles += spec.get('files', [])
    titles = [t for i, t in enumerate(titles) if t not in titles[:i] and not t.lower().endswith(('.pdf', '.djvu', '.svg', '.tif', '.tiff', '.webm', '.ogv'))]
    meta = info(titles)
    titles = [t for t in titles if t in meta]
    cols = spec.get('cols', 6); tw, th = spec.get('tw', 220), spec.get('th', 200); rows = (len(titles) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * tw, max(1, rows) * (th + 30)), 'white'); d = ImageDraw.Draw(sheet)
    for i, t in enumerate(titles):
        x, y = (i % cols) * tw, (i // cols) * (th + 30)
        b = get(meta[t]['thumb'], True) if meta[t]['thumb'] else None
        if b:
            try:
                im = Image.open(io.BytesIO(b)).convert('RGB'); im.thumbnail((tw - 6, th - 4)); sheet.paste(im, (x + 3 + (tw - 6 - im.width) // 2, y + 2))
            except Exception as e: print('img', t, e)
        d.text((x + 4, y + th + 2), str(i) + ' ' + t[:30], fill='black', font=font)
        d.text((x + 4, y + th + 14), (meta[t]['lic'][:14] + ' ' + meta[t]['date'][:12]), fill=(120, 0, 0), font=font)
    sheet.save('scout/out/%s.jpg' % name, quality=80)
    index[name] = [dict(meta[t], title=t, i=i) for i, t in enumerate(titles)]
    print(name, len(titles))
json.dump(index, open('scout/out/index.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
