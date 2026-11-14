# gioco: burraco
"""Burraco nel browser: Ale (host) contro Bea. Pesca dal mazzo e presa degli scarti, scelta di più carte, scala
calata con il jolly, carta attaccata, scarto, pozzetto preso calando tutto, chiusura con il burraco e punti della
mano, fine della partita. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/burraco/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('bu-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def idle(P): P.wait_for_function('Game.idle()', timeout=20000); P.wait_for_timeout(200)
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)
    def C(r, s, d=0): return d * 52 + s * 13 + r - 1
    J = 104

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il nome e le regole in breve', 'Burraco' in A.inner_text('h1') and 'pozzetto' in A.inner_text('.lobby').lower())
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    A.select_option('#opt-target', '1005'); B.wait_for_function('App.doc.opts.target === 1005', timeout=10000)
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    t('11 carte a testa, due pozzetti, una carta sugli scarti', js(A, 'G().players.every(function(P){return P.hand.length===11}) && G().pozzo[0].length===11 && G().pile.length===1'))
    a = js(A, 'myIdx()'); b = 1 - a
    host(A, "g.turn=%d; g.step='draw'; g.players[%d].hand=[%d,%d,%d,%d,%d]; g.pile=[%d]" % (a, a, C(5, 1), C(6, 1), J, C(9, 2), C(3, 0), C(8, 1)))
    A.wait_for_function('G().turn === myIdx() && G().players[myIdx()].hand.length === 5', timeout=10000); idle(A)
    t('prima si pesca: mazzo e scarti si accendono', A.locator('.piles .can').count() == 2)
    click(A, '[data-act=pile]'); A.wait_for_function("G().step === 'play' && G().players[myIdx()].hand.length === 6", timeout=10000)
    t('presi gli scarti', js(A, 'G().pile.length') == 0)
    for c in (C(5, 1), C(6, 1), J): click(A, '.hcard[data-c="%d"]' % c)
    t('tre carte scelte: si può calare la scala', 'scala' in A.inner_text('#gv-prompt') and A.locator('[data-act=meld]').count() == 1)
    click(A, '[data-act=meld]'); A.wait_for_function('G().melds[%d].length === 1' % a, timeout=10000)
    t('la scala con il jolly è sul tavolo (sporca)', js(A, 'G().melds[%d][0].cards.length' % a) == 3 and not js(A, 'G().melds[%d][0].clean' % a))
    B.wait_for_function('G().melds[%d].length === 1' % a, timeout=10000)
    t('Bea la vede', B.locator('.mside .meld').count() == 1)
    click(A, '.hcard[data-c="%d"]' % C(8, 1)); A.wait_for_timeout(200)
    t('la scala si illumina: ci si può attaccare l’8', A.locator('.meld.can').count() == 1)
    click(A, '.meld.can'); A.wait_for_function('G().melds[%d][0].cards.length === 4' % a, timeout=10000)
    t('8 attaccato: il jolly fa da 7', js(A, 'G().melds[%d][0].cards.join()' % a) == ','.join(str(x) for x in [C(5, 1), C(6, 1), J, C(8, 1)]))
    click(A, '.hcard[data-c="%d"]' % C(3, 0)); click(A, '[data-act=discard]')
    A.wait_for_function('G().turn === %d' % b, timeout=10000)
    t('scartato il 3: tocca a Bea', js(A, 'G().pile[G().pile.length-1]') == C(3, 0))
    A.screenshot(path=os.path.join(OUT, 'burraco-tavolo.png'))
    # pozzetto calando tutto
    host(A, "g.turn=%d; g.step='play'; g.players[%d].hand=[%d,%d,%d]" % (a, a, C(10, 3), C(10, 2), C(10, 0)))
    A.wait_for_function('G().turn === myIdx() && G().players[myIdx()].hand.length === 3', timeout=10000); idle(A)
    for c in (C(10, 3), C(10, 2), C(10, 0)): click(A, '.hcard[data-c="%d"]' % c)
    click(A, '[data-act=meld]'); A.wait_for_function('G().took[%d]' % a, timeout=10000)
    t('calando tutto si prende il pozzetto al volo', js(A, 'G().players[myIdx()].hand.length') == 11)
    # chiusura
    host(A, "g.players[%d].hand=[%d]; g.melds[%d][0].cards=[%d,%d,%d,%d,%d,%d,%d]; g.melds[%d][0].clean=true; g.totals=[%d,%d]" % (a, C(4, 3), a, C(5, 1), C(6, 1), C(7, 1), C(8, 1), C(9, 1), C(10, 1), C(11, 1), a, 900 if a == 0 else 0, 0 if a == 0 else 900))
    A.wait_for_function('G().players[myIdx()].hand.length === 1', timeout=10000); idle(A)
    click(A, '.hcard[data-c="%d"]' % C(4, 3)); click(A, '[data-act=discard]')
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=15000)
    t('chiusura con il burraco: +100, burraco pulito +200, la partita è finita', js(A, 'G().res.closer') == a and js(A, 'G().res.s[%d].bur' % a) == 200 and js(A, 'G().res.s[%d].close' % a) == 100)
    t('la classifica', 'Hai vinto' in A.inner_text('.sh-over') and 'Vince Ale' in B.inner_text('.sh-over'))
    t('nessun errore nelle pagine', not errs, errs)
    br.close()
done()
