# gioco: sintonia
"""Sintonia nel browser con quattro telefoni: Ale (host) e Cri contro Bea e Dan. Squadre da due, tema, risposte
nascoste finché non rispondono tutti, punti per le risposte uguali (con il bonus se tutta la squadra è in
sintonia), tema successivo e fine della partita. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/sintonia/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('st-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)
    def answer(P, w): P.evaluate("(function(){var i=document.getElementById('ain'); i.value=%s; document.getElementById('aform').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));})()" % json.dumps(w))

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il nome e le regole in breve', 'Sintonia' in A.inner_text('h1') and 'tema' in A.inner_text('.lobby').lower())
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    P2 = []
    for i, n in enumerate(('Bea', 'Cri', 'Dan')):
        X = phone(n); X.goto(U + '&t=' + code); X.wait_for_function('App.doc && App.doc.seats.length === %d' % (i + 2), timeout=15000); P2.append(X)
    B, C, Dn = P2
    A.wait_for_function('App.doc.seats.length === 4', timeout=10000)
    t('squadre a due a due', js(A, 'App.doc.seats.map(function(s){return s.team}).join()') == '0,1,0,1')
    click(A, '[data-act=start]')
    for X in (A, B, C, Dn): X.wait_for_selector('#ain', timeout=15000)
    t('il tema è in vista', len(A.inner_text('.theme')) > 3)
    answer(A, 'Fragola'); answer(C, 'fragole'); answer(B, 'mela')
    A.wait_for_function('G().players.filter(function(P){return P.ans}).length === 3', timeout=10000)
    t('le risposte restano nascoste finché non rispondono tutti', 'mela' not in A.inner_text('#gv-main') and A.locator('.wa.on').count() == 3)
    answer(Dn, 'ciliegia')
    for X in (A, B, C, Dn): X.wait_for_function("G().phase === 'show'", timeout=10000)
    t('Ale e Cri in sintonia: 2 punti + 2 di bonus', js(A, 'G().res.teams[0].pts') == 4 and js(A, 'G().res.teams[0].full'))
    t('Bea e Dan diversi: 0 punti', js(A, 'G().res.teams[1].pts') == 0)
    t('si vedono le risposte di tutti', 'mela' in A.inner_text('#gv-main') and 'ciliegia' in A.inner_text('#gv-main'))
    A.screenshot(path=os.path.join(OUT, 'sintonia-risposte.png'))
    host(A, "g.opts.rounds=2")
    for X in (A, B, C, Dn): click(X, '[data-act=next]')
    A.wait_for_function("G().phase === 'write' && G().round === 2", timeout=10000)
    t('nuovo tema', js(A, 'G().round') == 2)
    host(A, "g.until=Date.now()"); A.wait_for_function("G().phase === 'show'", timeout=10000)
    t('tempo scaduto: si scopre anche senza risposte', js(A, 'G().res.teams[0].pts') == 0)
    host(A, "g.until=Date.now()")
    for X in (A, B, C, Dn): X.wait_for_selector('.sh-over', timeout=15000)
    t('classifica finale', 'Avete vinto' in A.inner_text('.sh-over') or 'Hai vinto' in A.inner_text('.sh-over'))
    t('nessun errore nelle pagine', not errs, errs)
    br.close()
done()
