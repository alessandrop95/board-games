"""Piccolo aiuto per le prove: stampa OK/NO e alla fine esce con errore se qualcosa non va."""
import sys
_res = []
def t(name, cond, extra=''):
    _res.append(bool(cond)); print(('OK  ' if cond else 'NO  ') + name, '' if cond else extra, flush=True)
def done():
    ok = sum(_res); print('%d/%d prove superate' % (ok, len(_res)), flush=True)
    sys.exit(0 if ok == len(_res) else 1)
