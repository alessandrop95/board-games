# gioco: scopa
"""Scopa nel browser: Ale (host) contro Bea. Opzioni (partita a 21, scopone solo in 4), carte in tavola, presa
obbligata della carta uguale, scelta tra più prese toccando la tavola, scopa, carte calate, fine della mano con i
punti (carte, denari, settebello, primiera) e fine della partita. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/scopa/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('sc-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def idle(P): P.wait_for_function('Game.idle() && !document.querySelector(".flyer")', timeout=20000); P.wait_for_timeout(200)
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)
    def C(r, s): return s * 10 + r - 1

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il nome e le regole in breve', 'Scopa' in A.inner_text('h1') and 'settebello' in A.inner_text('.lobby').lower())
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    A.select_option('#opt-target', '21'); B.wait_for_function('App.doc.opts.target === 21', timeout=10000)
    A.select_option('#opt-variant', 'scopone'); B.wait_for_function("App.doc.opts.variant === 'scopone'", timeout=10000)
    t('Bea vede le opzioni', '21 punti' in B.inner_text('.lobby') and 'Scopone' in B.inner_text('.lobby'))
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    t('in 2 lo scopone non vale: 3 carte a testa e 4 in tavola', js(A, 'G().players.every(function(P){return P.hand.length===3}) && G().table.length===4 && !G().opts.scopone'))
    a = js(A, 'myIdx()'); b = 1 - a
    host(A, "g.table=[%d,%d,%d,%d]; g.players[%d].hand=[%d,%d,%d]; g.players[%d].hand=[%d,%d,%d]; g.turn=%d" % (C(3, 0), C(4, 1), C(2, 2), C(5, 3), a, C(7, 1), C(9, 0), C(1, 0), b, C(10, 2), C(8, 3), C(6, 0), a))
    A.wait_for_function('G().players[myIdx()].hand.indexOf(%d) >= 0 && G().turn === myIdx()' % C(7, 1), timeout=10000); idle(A)
    click(A, '.hcard[data-c="%d"]' % C(7, 1))
    t('tocco il 7: si illuminano le carte che posso prendere', A.locator('.tcard.can').count() == 4 and 'Più modi' in A.inner_text('#gv-prompt'))
    click(A, '[data-act=doplay]'); A.wait_for_timeout(400)
    t('con più modi di prendere bisogna scegliere', js(A, 'G().table.length') == 4)
    click(A, '.tcard[data-c="%d"]' % C(3, 0)); click(A, '.tcard[data-c="%d"]' % C(4, 1))
    t('le carte scelte si alzano', A.locator('.tcard.pick').count() == 2)
    A.screenshot(path=os.path.join(OUT, 'scopa-presa.png'))
    click(A, '[data-act=doplay]'); A.wait_for_function('G().table.length === 2', timeout=10000)
    t('prendo 3 e 4 con il 7', js(A, 'G().taken[%d].length' % a) == 3 and js(A, 'G().turn') == b)
    B.wait_for_function('G().turn === myIdx()', timeout=10000); idle(B)
    click(B, '.hcard[data-c="%d"]' % C(10, 2)); click(B, '.hcard[data-c="%d"]' % C(10, 2))
    A.wait_for_function('G().table.length === 3', timeout=10000)
    t('il re non prende niente e resta in tavola', js(A, 'G().table.indexOf(%d) >= 0' % C(10, 2)))
    host(A, "g.table=[%d,%d]; g.turn=%d" % (C(5, 3), C(2, 2), a)); A.wait_for_function('G().table.length === 2 && G().turn === myIdx()', timeout=10000); idle(A)
    click(A, '.hcard[data-c="%d"]' % C(9, 0)); click(A, '.hcard[data-c="%d"]' % C(9, 0))
    A.wait_for_function('G().table.length === 3', timeout=10000)
    t('il 9 non prende 5 e 2 (fanno 7): resta in tavola', js(A, 'G().table.indexOf(%d) >= 0' % C(9, 0)))
    host(A, "g.table=[%d,%d]; g.turn=%d" % (C(5, 3), C(4, 2), a)); A.wait_for_function('G().table.length === 2 && G().turn === myIdx()', timeout=10000); idle(A)
    host(A, "g.players[%d].hand=[%d]" % (a, C(9, 2))); A.wait_for_function('G().players[myIdx()].hand[0] === %d' % C(9, 2), timeout=10000); idle(A)
    click(A, '.hcard[data-c="%d"]' % C(9, 2)); click(A, '.hcard[data-c="%d"]' % C(9, 2))
    A.wait_for_function('G().last && G().last.scopa', timeout=10000)
    t('porto via tutto: scopa', js(A, 'G().scope[%d]' % a) == 1)
    # fine della mano e della partita
    host(A, "g.deck=[]; g.table=[]; g.players[%d].hand=[]; g.players[%d].hand=[%d]; g.turn=%d; g.totals=[%d,%d]; g.taken[%d]=g.taken[%d].concat([16,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d])" % (
        a, b, C(6, 0), b, 20 if a == 0 else 0, 0 if a == 0 else 20, a, a, C(7, 0), C(7, 2), C(7, 3), C(1, 1), C(2, 1), C(3, 1), C(4, 1), C(5, 1), C(1, 2), C(1, 3), C(2, 0), C(2, 3), C(3, 3), C(4, 3), C(5, 0), C(6, 3), C(8, 0), C(10, 0)))
    B.wait_for_function('G().turn === myIdx() && G().players[myIdx()].hand.length === 1', timeout=10000); idle(B)
    click(B, '.hcard[data-c="%d"]' % C(6, 0)); click(B, '.hcard[data-c="%d"]' % C(6, 0))
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=15000)
    t('punti della mano: carte, denari, settebello, primiera e la scopa', js(A, 'G().res.items[%d].join()' % a) == 'carte,denari,settebello,primiera' and js(A, 'G().res.pts[%d]' % a) == 5)
    t('a 21 punti la partita è finita', 'Hai vinto' in A.inner_text('.sh-over') and 'Vince Ale' in B.inner_text('.sh-over'))
    t('nessun errore nelle pagine', not errs, errs)
    br.close()
done()
