# gioco: comuni
"""Rivincita con le stesse persone: dopo «Nuova partita con lo stesso tavolo» animazioni e suoni devono ripartire
in tutti i giochi, sia per l'host sia per gli altri giocatori. (Prima i contatori degli effetti della partita vecchia
restavano più alti di quelli della nuova e Skyjo, Flip 7 e Citadels restavano muti e fermi.)
Per simulare una partita lunga si alzano i contatori della prima partita prima della rivincita.
Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
BOTS = {'forziere': 3, 'conquista': 3, 'fune': 3, 'sintonia': 3, 'burraco': 2, 'scopa': 2, 'briscola': 2, 'disegna': 3, 'nomicose': 3, 'prendi6': 3, 'sushigo': 2, 'nograzie': 2, 'cabo': 2, 'skyjo': 2, 'flip7': 2, 'citadels': 3, 'presagio': 2, 'gattomina': 2, 'polvere-e-piombo': 3, 'catan': 2, 'machiavelli': 1, 'binari-italia': 1, 'campi-acciaio': 1}
SPY = "window.__snd=0; if(window.Sound&&!Sound.__w){var o=Sound.play; Sound.play=function(){window.__snd++; return o.apply(this,arguments)}; Sound.__w=1}"
LONG = """Net.hostApply(function(cur){var g=cur.game; if(!g) return false; if(g.fxN!=null){g.fxN+=500; (g.fx||[]).forEach(function(e){if(e.n!=null)e.n+=500})}
  if(g.flash&&g.flash.n!=null) g.flash.n+=500; if(g.logN!=null){g.logN+=500; (g.log||[]).forEach(function(l){if(l.n!=null)l.n+=500})} g.seq=(g.seq||0)+500; return true})"""
AUTO = "Net.hostApply(function(cur){var g=cur.game; if(!g||!g.players) return false; g.players.forEach(function(P){P.bot=true}); return true})"
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    for gm in BOTS:
        U = 'http://localhost:8897/%s/?broker=ws://localhost:8897/' % gm
        ctxs = []
        def phone(nick):
            c = br.new_context(viewport={'width': 390, 'height': 844}); ctxs.append(c)
            c.add_init_script("try{for(var k of ['pp','pr','gm','ca','bi','ct','mc','sk','f7','cd','cb','ng','sg','p6','nc','dg','br','sc','bu','st','fn','cq','fz']){localStorage.setItem(k+'-nick',%s);localStorage.setItem(k+'-intro-done','1')}}catch(e){}" % json.dumps(nick))
            pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(gm + ' ' + nick + ': ' + str(e))); return pg
        A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
        if A.locator('#nick').count(): A.fill('#nick', 'Ale')
        A.evaluate("document.querySelector('[data-act=create]').click()")
        A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = A.evaluate('App.code')
        B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length >= 2', timeout=15000)
        for i in range(BOTS[gm]): A.evaluate("Net.send({t:'addbot'})"); A.wait_for_timeout(250)
        A.evaluate("Net.send({t:'start'})"); A.wait_for_timeout(600); A.evaluate(AUTO); A.wait_for_timeout(3500)
        A.evaluate(LONG); A.wait_for_timeout(2000)
        A.evaluate("Net.send({t:'rematch'})"); A.wait_for_timeout(1500)
        for P in (A, B): P.evaluate(SPY)
        A.evaluate("Net.send({t:'start'})"); A.wait_for_timeout(600); A.evaluate(AUTO); A.wait_for_timeout(7000)
        a, b = A.evaluate('window.__snd'), B.evaluate('window.__snd')
        t('%s: dopo la rivincita si sentono i suoni (host %d, ospite %d)' % (gm, a, b), a > 0 and b > 0)
        if gm in ('skyjo', 'flip7', 'citadels', 'cabo', 'nograzie', 'sushigo', 'prendi6', 'nomicose'):
            t('%s: l’ospite segue gli effetti della partita nuova' % gm, B.evaluate('App.lastFxN === App.doc.game.fxN'))
        for c in ctxs: c.close()
    br.close()
t('nessun errore nelle pagine', not errs, '; '.join(errs[:3]))
done()
