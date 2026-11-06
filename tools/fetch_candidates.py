#!/usr/bin/env python3
"""Cerca su Wikimedia Commons illustrazioni di pubblico dominio candidate (miniature) per scegliere le nuove carte.
Legge tools/candidates.json: {"dest": "...", "queries": ["...", ...], "per": 30}. Scrive le miniature e un index.json."""
import json, os, sys, time, urllib.parse, urllib.request
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(root, 'tools', 'candidates.json'), encoding='utf-8'))
dest = os.path.join(root, cfg['dest']); os.makedirs(dest, exist_ok=True)
ua = 'BoardGamesAssetBot/1.0 (https://github.com/alessandrop95/board-games)'
def get(url):
    for a in range(4):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': ua}), timeout=60).read()
        except Exception as e: print('ERRORE', url[:120], e, file=sys.stderr); time.sleep(3 + 4 * a)
    return None
index, seen, n = [], set(), 0
for q in cfg['queries']:
    params = {'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': q, 'gsrnamespace': 6, 'gsrlimit': cfg.get('per', 30),
              'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size', 'iiurlwidth': 360}
    data = get('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params))
    if not data: continue
    pages = sorted(json.loads(data).get('query', {}).get('pages', {}).values(), key=lambda p: p.get('index', 0))
    for p in pages:
        t = p['title']
        if t in seen or not p.get('imageinfo'): continue
        ii = p['imageinfo'][0]; md = ii.get('extmetadata', {})
        lic = md.get('LicenseShortName', {}).get('value', '')
        if 'public domain' not in lic.lower() and lic.upper() not in ('PD', 'CC0'): continue
        if not ii.get('thumburl') or not ii.get('mime', 'image/jpeg').startswith('image') or t.lower().endswith(('.pdf', '.djvu', '.tif', '.tiff', '.svg')): continue
        seen.add(t); n += 1
        img = get(ii['thumburl'])
        if not img: continue
        key = 'k%03d' % n
        open(os.path.join(dest, key + '.jpg'), 'wb').write(img)
        index.append({'key': key, 'q': q, 'title': t[5:], 'lic': lic, 'w': ii.get('width'), 'h': ii.get('height'),
                      'artist': md.get('Artist', {}).get('value', '')[:200], 'date': md.get('DateTimeOriginal', {}).get('value', '')[:80]})
        time.sleep(0.4)
    print(q, '→', len(index))
json.dump(index, open(os.path.join(dest, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('totale', len(index))
