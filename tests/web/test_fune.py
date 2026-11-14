# gioco: fune
"""Tiro alla fune di parole nel browser: Ale (host) contro Bea. Griglia uguale per tutti, parola composta toccando
lettere vicine, corda che si sposta, parola ripetuta dalla squadra rifiutata, controllo con contestazione di una
parola inventata, round vinto e fine della partita. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/fune/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
GR = 'casaeortinlemolpanersotuv'
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('fn-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)
    def spell(P, w):
        for i in js(P, 'FNEngine.path(G().grid, %s)' % json.dumps(w)): click(P, '.cell[data-i="%d"]' % i)

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il nome e le regole in breve', 'Tiro alla fune' in A.inner_text('h1') and 'corda' in A.inner_text('.lobby'))
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    t('una squadra a testa', js(A, 'App.doc.seats.map(function(s){return s.team}).join()') == '0,1')
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('.cell', timeout=15000)
    t('griglia 5×5', A.locator('.cell').count() == 25)
    host(A, "g.grid=%s" % json.dumps(GR)); A.wait_for_function("G().grid === %s" % json.dumps(GR), timeout=10000); A.wait_for_timeout(300)
    spell(A, 'casa'); t('le lettere toccate formano la parola', 'CASA' in A.inner_text('.cw'))
    click(A, '[data-act=back]'); t('la freccia toglie l’ultima lettera', 'CAS' in A.inner_text('.cw') and 'CASA' not in A.inner_text('.cw'))
    click(A, '.cell[data-i="24"]'); t('una lettera lontana fa ripartire la parola', js(A, 'App.path.length') == 1)
    click(A, '.cell[data-i="24"]'); spell(A, 'casa'); click(A, '[data-act=send]')
    B.wait_for_function('G().words.length === 1', timeout=10000)
    t('la parola tira la corda per tutti', js(B, 'FNEngine.pull(G()).join()') == '2,0')
    spell(A, 'casa'); click(A, '[data-act=send]'); A.wait_for_timeout(600)
    t('la stessa parola non conta due volte', js(A, 'G().words.length') == 1)
    spell(B, 'rtine'); click(B, '[data-act=send]'); A.wait_for_function('G().words.length === 2', timeout=10000)
    A.screenshot(path=os.path.join(OUT, 'fune-griglia.png'))
    host(A, "g.until=Date.now()")
    for P in (A, B): P.wait_for_function("G().phase === 'review'", timeout=15000)
    t('a tempo scaduto si controllano le parole', A.locator('[data-act=flag]').count() == 1 and B.locator('[data-act=flag]').count() == 0)
    click(A, '[data-act=flag]'); A.wait_for_function('Object.keys(G().flags).length === 1', timeout=10000)
    for P in (A, B): click(P, '[data-act=ready]')
    A.wait_for_function("G().phase === 'scores' || G().phase === 'over'", timeout=10000)
    t('la parola inventata non vale: round ad Ale', js(A, 'G().res.pts.join()') == '2,0' and js(A, 'G().teams[0].wins') == 1)
    host(A, "g.teams[0].wins=1; g.opts.rounds=1")
    for P in (A, B):
        if P.locator('[data-act=next]').count(): click(P, '[data-act=next]')
    A.wait_for_function("G().phase === 'play' && G().round === 2", timeout=10000)
    host(A, "g.grid=%s" % json.dumps(GR)); A.wait_for_function("G().grid === %s" % json.dumps(GR), timeout=10000); A.wait_for_timeout(300)
    spell(A, 'pane'); click(A, '[data-act=send]'); A.wait_for_function('G().words.length === 1', timeout=10000)
    host(A, "g.until=Date.now()")
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=15000)
    t('fine della partita', 'Avete vinto' in A.inner_text('.sh-over') and 'Vincono' in B.inner_text('.sh-over'))
    t('nessun errore nelle pagine', not errs, errs)
    br.close()
done()
