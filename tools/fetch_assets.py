#!/usr/bin/env python3
"""Scarica da Wikimedia Commons le illustrazioni di pubblico dominio elencate in tools/assets.json."""
import json, os, sys, time, urllib.parse, urllib.request
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import glob
ua = 'BoardGamesAssetBot/1.0 (https://github.com/alessandrop95/board-games)'
for cfgpath in sorted(glob.glob(os.path.join(root, 'tools', 'assets*.json'))):
  cfg = json.load(open(cfgpath, encoding='utf-8'))
  dest = os.path.join(root, cfg['dest']); os.makedirs(dest, exist_ok=True)
  ok = 0
  for key, name in cfg['files'].items():
      out = os.path.join(dest, key + '.jpg')
      if os.path.exists(out) and os.path.getsize(out) > 10000:
          print('già presente', key); ok += 1; continue
      url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + urllib.parse.quote(name.replace(' ', '_')) + '?width=' + str(cfg['maxWidth'])
      for attempt in range(4):
          try:
              req = urllib.request.Request(url, headers={'User-Agent': ua})
              data = urllib.request.urlopen(req, timeout=60).read()
              open(out, 'wb').write(data); ok += 1
              print('scaricato', key, len(data), 'byte'); break
          except Exception as e:
              print('ERRORE', key, name, e, file=sys.stderr); time.sleep(3 + 5 * attempt)
      time.sleep(1)
  open(os.path.join(dest, 'CREDITS.txt'), 'w', encoding='utf-8').write('\n'.join(k + ': ' + v for k, v in cfg['credits'].items()) + '\n')
  print(ok, 'su', len(cfg['files']))
