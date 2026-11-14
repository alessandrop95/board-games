# gioco: briscola
"""Briscola nel browser: Ale (host) e Bea in coppia contro due giocatori automatici. Coppie in sala d'attesa,
carte giocate a turno, mano presa da chi ha la carta più forte, pesca, segni che vede solo il compagno, carte del
compagno scoperte a mazzo finito, fine della mano con i punti e fine della partita. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/briscola/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('br-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def idle(P): P.wait_for_function('Game.idle() && !document.querySelector(".flyer")', timeout=20000); P.wait_for_timeout(200)
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il nome e le regole in breve', 'Briscola' in A.inner_text('h1') and 'briscola' in A.inner_text('.lobby').lower())
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    click(A, '[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === 3', timeout=10000)
    click(A, '[data-act=start]'); A.wait_for_timeout(600)
    t('in 3 non si comincia', js(A, 'App.doc.phase') == 'lobby')
    click(A, '[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === 4', timeout=10000)
    if js(A, 'App.doc.seats[1].team !== App.doc.seats[0].team'):
        click(B, '[data-act=team][data-uid="%s"]' % js(B, 'Net.uid')); A.wait_for_function('App.doc.seats[1].team === App.doc.seats[0].team', timeout=10000)
    if js(A, 'App.doc.seats.filter(function(s){return s.team===App.doc.seats[0].team}).length') > 2:
        bot = js(A, 'App.doc.seats.filter(function(s,i){return i>1 && s.team===App.doc.seats[0].team})[0].uid'); click(A, '[data-act=team][data-uid="%s"]' % bot)
        A.wait_for_function('App.doc.seats.filter(function(s){return s.team===App.doc.seats[0].team}).length === 2', timeout=10000)
    t('Ale e Bea nella stessa coppia', 'Bea' in A.inner_text('.tbox:nth-child(%d)' % (js(A, 'App.doc.seats[0].team') + 1)))
    A.select_option('#opt-match', '1'); B.wait_for_function('App.doc.opts.match === 1', timeout=10000)
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    a = js(A, 'myIdx()'); b = js(B, 'myIdx()')
    t('i compagni sono seduti di fronte', (a + 2) % 4 == b, [a, b])
    t('3 carte a testa, 28 nel mazzo con la briscola in fondo', js(A, 'G().players.every(function(P){return P.hand.length===3}) && G().deck.length===28 && G().deck[0]===G().bris'))
    host(A, "g.players.forEach(function(P){P.bot=false}); g.turn=g.lead=%d" % a); A.wait_for_function('G().turn === myIdx()', timeout=10000); idle(A)
    t('vedo la mia mano e il compagno di fronte', A.locator('.hcard').count() == 3 and A.locator('.seat-t.n').count() == 1 and 'Bea' in A.inner_text('.seat-t.n'))
    c = js(A, 'G().players[myIdx()].hand[0]')
    click(A, '.hcard[data-c="%d"]' % c); t('tocco una carta: si alza', A.locator('.hcard.sel').count() == 1)
    click(A, '.hcard[data-c="%d"]' % c); A.wait_for_function('G().trick.length === 1', timeout=10000)
    t('la tocco di nuovo: è sul tavolo e tocca al prossimo', js(A, 'G().turn') == (a + 1) % 4)
    t('Bea non può giocare fuori turno', (click(B, '.hcard') or True) and B.wait_for_timeout(300) is None and js(A, 'G().trick.length') == 1)
    # segni
    click(B, '[data-act=signs]'); B.wait_for_selector('.sh-signs', timeout=5000); click(B, '[data-act=sign][data-k="liscio"]')
    A.wait_for_function('G().signs[%d]' % b, timeout=10000); A.wait_for_timeout(400)
    t('il segno lo vede il compagno', 'solo lisci' in A.inner_text('.seat-t.n'))
    # una mano controllata: briscola denari, il 2 di denari prende
    host(A, "g.bris=15; g.trick=[]; g.turn=g.lead=%d; g.players[%d].hand=[0,1,2]; g.players[%d].hand=[3,4,5]; g.players[%d].hand=[6,7,8]; g.players[%d].hand=[11,12,13]" % (a, a, (a + 1) % 4, b, (a + 3) % 4))
    A.wait_for_function('G().players[myIdx()].hand[0] === 0', timeout=10000); idle(A)
    for who, card in ((A, 0), (None, 3), (B, 6), (None, 11)):
        if who: click(who, '.hcard[data-c="%d"]' % card); click(who, '.hcard[data-c="%d"]' % card)
        else: host(A, "E.act(g, g.turn, {a:'play', c:%d}); g.seq--" % card)
        A.wait_for_function('G().players.reduce(function(s,P){return s+P.hand.length},0) >= 0', timeout=5000); A.wait_for_timeout(500)
    A.wait_for_function('G().last && G().last.trick.length === 4', timeout=10000)
    t('il 2 di briscola prende l’asso: 11 punti agli avversari', js(A, 'G().last.w') == (a + 3) % 4 and js(A, 'G().last.pts') == 11)
    t('chi prende comincia la mano dopo', js(A, 'G().turn') == (a + 3) % 4)
    # mazzo finito: le carte del compagno si vedono
    host(A, "g.deck=[]; g.open=true")
    A.wait_for_function('G().open', timeout=10000); A.wait_for_timeout(300)
    t('a mazzo finito vedo le carte del compagno (gli avversari no)', A.locator('.seat-t.n .oh.open').count() == 1 and A.locator('.seat-t.w .oh.open').count() == 0)
    A.screenshot(path=os.path.join(OUT, 'briscola-tavolo.png'))
    # fine della mano
    host(A, "g.players.forEach(function(P){P.hand=[]}); g.players[g.turn].hand=[39]; g.taken=[[0,10,20,30,2,12,22],[1]]; g.trick=[{p:(g.turn+1)%4,c:5},{p:(g.turn+2)%4,c:6},{p:(g.turn+3)%4,c:7}]")
    host(A, "E.act(g, g.turn, {a:'play', c:39}); g.seq--; if(g.phase==='over') cur.phase='over'")
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=15000)
    t('fine della mano: più di 60 punti, partita finita', js(A, 'G().res.pts[%d]' % (a % 2)) > 60 and 'Avete vinto' in A.inner_text('.sh-over') and 'Avete vinto' in B.inner_text('.sh-over'))
    t('nessun errore nelle pagine', not errs, errs)
    br.close()
done()
