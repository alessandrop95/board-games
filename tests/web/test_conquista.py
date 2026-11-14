# gioco: conquista
"""Conquista l'Italia nel browser: Ale (host) contro Bea. Domanda a scelta (chi risponde giusto per primo vince),
scelta di una regione sulla mappa, regioni confinanti dopo la prima, stima numerica (vince il più vicino),
conquista di una regione avversaria a regioni finite e fine della partita. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/conquista/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('cq-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)
    def setq(P, kind): host(P, "g.q=CQData.Q.findIndex(function(q){return q.k==='%s'}); g.order=[2,0,3,1]; g.players.forEach(function(X){X.ans=null}); g.start=Date.now(); g.until=Date.now()+20000; g.phase='q'" % kind)

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il nome e le regole in breve', 'Conquista' in A.inner_text('h1') and 'regione' in A.inner_text('.lobby'))
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('.cqmap', timeout=15000)
    t('la mappa con 20 regioni', A.locator('.cqmap .rg').count() == 20)
    setq(A, 'c'); A.wait_for_function("G().phase === 'q' && G().order.join() === '2,0,3,1'", timeout=10000); B.wait_for_selector('.opt', timeout=10000); A.wait_for_timeout(300)
    t('quattro risposte da toccare', A.locator('.opt').count() == 4 and B.locator('.opt').count() == 4)
    click(B, '.opt[data-i="1"]'); A.wait_for_function('G().players[1].ans', timeout=10000)
    t('risposta sbagliata: si continua', js(A, "G().phase") == 'q')
    click(A, '.opt[data-i="0"]'); A.wait_for_function("G().phase === 'claim'", timeout=10000)
    t('Ale risponde giusto e sceglie una regione', js(A, 'G().chooser') == 0 and A.locator('.rg.can').count() == 20 and B.locator('.rg.can').count() == 0)
    laz = js(A, "CQData.R.findIndex(function(r){return r.id==='laz'})")
    click(A, '.rg.can[data-r="%d"]' % laz); B.wait_for_function('G().own[%d] === 0' % laz, timeout=10000)
    t('il Lazio è di Ale per tutti', js(B, 'E.count(G(), 0)') == 1)
    A.screenshot(path=os.path.join(OUT, 'conquista-mappa.png'))
    setq(A, 'n'); A.wait_for_selector('#nin', timeout=10000); B.wait_for_selector('#nin', timeout=10000)
    v = js(A, 'CQData.Q[G().q].v')
    js(B, "document.getElementById('nin').value=%s; document.getElementById('numf').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))" % json.dumps(str(v + 1)))
    js(A, "document.getElementById('nin').value=%s; document.getElementById('numf').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))" % json.dumps(str(v + 50)))
    A.wait_for_function("G().phase === 'claim'", timeout=10000)
    t('stima: vince il più vicino', js(A, 'G().chooser') == 1)
    t('Bea può prendere qualsiasi regione libera (non ne ha ancora)', B.locator('.rg.can').count() == 19)
    click(B, '.rg.can[data-r="0"]'); A.wait_for_function('G().own[0] === 1', timeout=10000)
    host(A, "g.own=g.own.map(function(o,i){return i<10?0:1})"); setq(A, 'c'); A.wait_for_selector('.opt', timeout=10000); A.wait_for_timeout(300)
    click(A, '.opt[data-i="0"]'); A.wait_for_function("G().phase === 'claim'", timeout=10000); A.wait_for_timeout(300)
    t('regioni finite: si conquistano quelle avversarie confinanti', A.locator('.rg.can').count() > 0 and js(A, "Array.prototype.every.call(document.querySelectorAll('.rg.can'), function(n){return G().own[+n.getAttribute('data-r')] === 1})"))
    r = js(A, "+document.querySelector('.rg.can').getAttribute('data-r')"); click(A, '.rg.can[data-r="%d"]' % r)
    A.wait_for_function('G().own[%d] === 0' % r, timeout=10000)
    host(A, "g.round=g.opts.questions; g.until=Date.now()")
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=15000)
    t('fine della partita: vince chi ha più regioni', js(A, 'G().winners.join()') == '0' and 'vinto' in A.inner_text('.sh-over'))
    t('nessun errore nelle pagine', not errs, errs)
    br.close()
done()
