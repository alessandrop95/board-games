# gioco: tressette
"""Tressette nel browser: Ale (host) e Bea in coppia contro due giocatori automatici, a vincere. Coppie in sala d'attesa,
dieci carte a testa, apertura con il segnale «Busso» che vedono tutti, obbligo di rispondere al seme (le carte che non
si possono giocare restano in grigio e non partono), presa della carta più alta del seme, punti in terzi, fine della mano.
Poi la variante a perdere con quattro giocatori, ognuno per sé. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/tressette/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
def C(r, s): return s * 10 + r - 1   # carta: valore (1-10) e seme (0 coppe, 1 denari, 2 spade, 3 bastoni)
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('ts-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def idle(P): P.wait_for_function('Game.idle() && !document.querySelector(".flyer")', timeout=20000); P.wait_for_timeout(200)
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il nome e le regole in breve', 'Tressette' in A.inner_text('h1') and 'a perdere' in A.inner_text('.lobby').lower())
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    click(A, '[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === 3', timeout=10000)
    click(A, '[data-act=start]'); A.wait_for_timeout(600)
    t('a vincere in 3 non si comincia', js(A, 'App.doc.phase') == 'lobby')
    click(A, '[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === 4', timeout=10000)
    if js(A, 'App.doc.seats[1].team !== App.doc.seats[0].team'):
        click(B, '[data-act=team][data-uid="%s"]' % js(B, 'Net.uid')); A.wait_for_function('App.doc.seats[1].team === App.doc.seats[0].team', timeout=10000)
    if js(A, 'App.doc.seats.filter(function(s){return s.team===App.doc.seats[0].team}).length') > 2:
        bot = js(A, 'App.doc.seats.filter(function(s,i){return i>1 && s.team===App.doc.seats[0].team})[0].uid'); click(A, '[data-act=team][data-uid="%s"]' % bot)
        A.wait_for_function('App.doc.seats.filter(function(s){return s.team===App.doc.seats[0].team}).length === 2', timeout=10000)
    t('Ale e Bea nella stessa coppia', 'Bea' in A.inner_text('.tbox:nth-child(%d)' % (js(A, 'App.doc.seats[0].team') + 1)))
    t('le varianti in sala d’attesa', A.locator('#opt-mode').count() == 1 and A.locator('#opt-accuse').count() == 1 and A.locator('#opt-signals').count() == 1 and 'a vincere' in B.inner_text('.lobby').lower())
    A.select_option('#opt-target', '21'); B.wait_for_function('App.doc.opts.target === 21', timeout=10000)
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    a = js(A, 'myIdx()'); b = js(B, 'myIdx()')
    t('i compagni sono seduti di fronte', (a + 2) % 4 == b, [a, b])
    t('10 carte a testa, niente tallone', js(A, 'G().players.every(function(P){return P.hand.length===10}) && G().deck.length===0 && G().opts.target===21'))
    t('vedo le mie 10 carte e il compagno di fronte', A.locator('.hcard').count() == 10 and 'Bea' in A.inner_text('.seat-t.n') and 'compagno' in A.inner_text('.seat-t.n'))
    # una mano controllata: apre Ale con «Busso» a coppe
    o1, o2 = (a + 1) % 4, (a + 3) % 4
    host(A, "g.players.forEach(function(P){P.bot=false}); g.acc={}; g.trick=[]; g.turn=g.lead=%d; g.players[%d].hand=[%d,%d]; g.players[%d].hand=[%d,%d]; g.players[%d].hand=[%d,%d]; g.players[%d].hand=[%d,%d]" % (
        a, a, C(5, 0), C(2, 1), o1, C(3, 0), C(3, 1), b, C(1, 0), C(4, 2), o2, C(7, 1), C(8, 2)))
    A.wait_for_function('G().players[myIdx()].hand.length === 2 && G().turn === myIdx()', timeout=10000); idle(A)
    click(A, '.hcard[data-c="%d"]' % C(5, 0))
    t('scelta la carta di apertura, ci sono i segnali', A.locator('[data-act=doplay][data-s]').count() == 3 and 'Busso' in A.inner_text('#gv-prompt'))
    click(A, '[data-act=doplay][data-s=busso]'); A.wait_for_function('G().trick.length === 1', timeout=10000)
    t('la carta è giocata con «Busso»', js(A, 'G().trick[0].s') == 'busso')
    B.wait_for_function('G().trick.length === 1', timeout=10000); B.wait_for_timeout(600)
    t('il segnale lo vedono tutti', 'Busso' in B.inner_text('.trick'))
    host(A, "E.act(g, %d, {a:'play', c:%d}); g.seq--" % (o1, C(3, 0)))
    B.wait_for_function('G().turn === myIdx()', timeout=10000); idle(B)
    t('Bea deve rispondere a coppe: il 4 di spade è in grigio', B.locator('.hcard.no').count() == 1 and B.locator('.hcard.no[data-c="%d"]' % C(4, 2)).count() == 1)
    click(B, '.hcard[data-c="%d"]' % C(4, 2)); B.wait_for_timeout(500)
    t('…e non parte', js(A, 'G().trick.length') == 2)
    click(B, '.hcard[data-c="%d"]' % C(1, 0)); click(B, '.hcard[data-c="%d"]' % C(1, 0)); A.wait_for_function('G().trick.length === 3', timeout=10000)
    host(A, "E.act(g, %d, {a:'play', c:%d}); g.seq--" % (o2, C(7, 1)))
    A.wait_for_function('G().last && G().last.trick.length === 4', timeout=10000)
    t('il 3 di coppe prende: asso e 3 fanno 4 terzi agli avversari', js(A, 'G().last.w') == o1 and js(A, 'G().last.th') == 4)
    t('chi prende comincia la mano dopo', js(A, 'G().turn') == o1)
    A.screenshot(path=os.path.join(OUT, 'tressette-tavolo.png'))
    # fine della mano: l'ultima presa vale un punto
    host(A, "E.act(g, %d, {a:'play', c:%d}); E.act(g, %d, {a:'play', c:%d}); E.act(g, %d, {a:'play', c:%d}); E.act(g, %d, {a:'play', c:%d}); g.seq-=4; if(g.phase==='over') cur.phase='over'" % (o1, C(3, 1), b, C(4, 2), o2, C(8, 2), a, C(2, 1)))
    for P in (A, B): P.wait_for_selector('.sh-round', timeout=15000)
    t('fine della mano: l’ultima presa conta un punto in più', js(A, 'G().res.th[%d]' % (o1 % 2)) == 4 + 3 + 3 and js(A, 'G().res.pts[%d]' % (o1 % 2)) == 3 and 'con l’ultima' in A.inner_text('.sh-round'))
    t('i punti della mano li vedono tutti', 'Mano 1 finita' in B.inner_text('.sh-round'))
    # a perdere: ognuno per sé
    click(A, '[data-act=close]'); click(A, '[data-act=menu]'); A.wait_for_selector('.sh-menu', timeout=5000); click(A, '[data-act=rematch]')
    A.wait_for_function('App.doc.phase === "lobby"', timeout=10000); A.wait_for_selector('#opt-mode', timeout=10000)
    A.select_option('#opt-mode', 'perdere'); B.wait_for_function('App.doc.opts.mode === "perdere"', timeout=10000)
    t('a perdere niente coppie in sala d’attesa e c’è il cappotto', A.locator('.tbox').count() == 0 and A.locator('#opt-cappotto').count() == 1 and A.locator('#opt-accuse').count() == 0)
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_function('App.doc.phase === "play" && G() && G().opts.mode === "perdere"', timeout=15000)
    B.wait_for_selector('#gv', timeout=10000); B.wait_for_timeout(600)
    t('a perdere in 4: 10 carte a testa, un punteggio per giocatore, nessun compagno', js(B, 'G().players.every(function(P){return P.hand.length===10}) && G().totals.length===4') and B.locator('.score .sc-p').count() == 4 and B.locator('.tag.ok').count() == 0)
    t('nessun errore nelle pagine', not errs, errs)
    br.close()
done()
