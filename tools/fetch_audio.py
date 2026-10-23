#!/usr/bin/env python3
"""Scarica da Wikimedia Commons la musica e i suoni elencati in tools/audio.json (solo licenze libere).
Ogni voce ha un titolo esatto ("file") oppure una ricerca ("search"): si prende il primo audio con licenza ammessa."""
import json, os, sys, time, urllib.parse, urllib.request
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(root, 'tools', 'audio.json'), encoding='utf-8'))
UA = 'BoardGamesAssetBot/1.0 (https://github.com/alessandrop95/board-games)'
API = 'https://commons.wikimedia.org/w/api.php?'
OK = ('public domain', 'cc0', 'cc by ', 'cc by-sa', 'cc-by', 'pd')
def get(url, binary=False):
    for k in range(4):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=90).read()
            return r if binary else json.loads(r)
        except Exception as e:
            print('retry', url[:100], e, file=sys.stderr); time.sleep(3 + 5 * k)
    return None
def info(title):
    j = get(API + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata|mediatype', 'iiextmetadatafilter': 'LicenseShortName|Artist|ImageDescription', 'titles': 'File:' + title}))
    for p in (j or {}).get('query', {}).get('pages', {}).values():
        if 'imageinfo' in p:
            ii = p['imageinfo'][0]; m = ii.get('extmetadata', {})
            return {'title': title, 'url': ii['url'], 'size': ii['size'], 'duration': ii.get('duration'), 'mediatype': ii.get('mediatype'),
                    'license': m.get('LicenseShortName', {}).get('value', ''), 'artist': m.get('Artist', {}).get('value', '')}
    return None
def search(q):
    j = get(API + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'list': 'search', 'srnamespace': 6, 'srlimit': 20, 'srsearch': q + ' filetype:audio'}))
    return [x['title'][5:] for x in (j or {}).get('query', {}).get('search', [])]
report = {}
for game, items in cfg.items():
    dest = os.path.join(root, game, 'audio', 'src'); os.makedirs(dest, exist_ok=True)
    for key, spec in items.items():
        cands = [spec['file']] if 'file' in spec else search(spec['search'])
        chosen = None
        for t in cands:
            if t.lower().endswith(('.mid', '.midi')): continue
            i = info(t)
            if i and i['mediatype'] == 'AUDIO' and any(o in (i['license'] or '').lower() for o in OK) and (i['duration'] or 0) <= spec.get('maxdur', 400):
                chosen = i; break
        if not chosen: print('NESSUN FILE per', game, key, file=sys.stderr); continue
        ext = os.path.splitext(chosen['title'])[1].lower()
        out = os.path.join(dest, key + ext)
        data = get(chosen['url'], True)
        if data: open(out, 'wb').write(data); print(game, key, '<-', chosen['title'], chosen['license'], len(data))
        chosen['file'] = key + ext; report[game + '/' + key] = chosen
        time.sleep(1)
json.dump(report, open(os.path.join(root, 'tools', 'audio-report.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
