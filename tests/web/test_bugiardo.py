# gioco: bugiardo
"""Dadi del bugiardo nel browser, con due telefoni (Ale host e Bea) e un giocatore automatico: sala d'attesa con le
opzioni, dadi visti solo dal proprio telefono, dichiarazione scelta con valore e quantità, rilancio obbligato,
«Dubito!» con i bicchieri alzati per tutti, dado perso, «Esatto!» e fine della partita. Serve: broker su 8897."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/bugiardo/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('lb-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il titolo e le regole in breve', 'bugiardo' in A.inner_text('h1') and 'Dubito' in A.inner_text('.lobby'))
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    click(A, '[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === 3', timeout=10000)
    A.select_option('#opt-timer', '0'); A.wait_for_function('App.doc.opts.timer === 0', timeout=10000)
    t('le opzioni del tavolo: dadi, jolly ed «Esatto!»', A.locator('#opt-dice').count() == 1 and A.locator('#opt-ones').count() == 1 and A.locator('#opt-exact').count() == 1)
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    a = js(A, 'myIdx()'); b = js(B, 'myIdx()'); c = 3 - a - b
    host(A, "g.players.forEach(function(Q){Q.bot=false});g.players[%d].dice=[2,2,3,5,6];g.players[%d].dice=[1,4,4,5,6];g.players[%d].dice=[1,2,3,3,6];g.turn=%d;g.bid=null;g.bids=[]" % (a, b, c, a))
    A.wait_for_function('G().turn === %d && document.querySelector("[data-act=bid]")' % a, timeout=10000)
    t('ognuno vede solo i suoi dadi', A.locator('.myd-d .die').count() == 5 and B.locator('.myd-d .die').count() == 5 and B.locator('[data-act=bid]').count() == 0)
    t('in gioco 15 dadi', '15' in A.inner_text('.mid-top'))
    t('non si apre sugli 1 (jolly)', A.locator('.face[data-f="1"][disabled]').count() == 1)
    # Ale dichiara «tre 2»: tocca 2, porta la quantità a 3
    click(A, '.face[data-f="2"]')
    while js(A, 'Game.picked().q') < 3: click(A, '[data-act=qplus]')
    while js(A, 'Game.picked().q') > 3: click(A, '[data-act=qminus]')
    click(A, '[data-act=bid]')
    B.wait_for_function('G().bid && G().bid.q === 3 && G().bid.f === 2', timeout=10000)
    t('la dichiarazione si vede per tutti', '«tre 2»' in B.inner_text('.gv-mid'))
    # tocca al giocatore dopo Ale; facciamo giocare Bea
    host(A, "g.turn=%d" % b)
    B.wait_for_selector('[data-act=doubt]', timeout=10000)
    t('il telefono propone il rilancio più basso valido', js(B, 'E.higher(G(), Game.picked(), G().bid)'))
    t('i dadi che contano sono evidenziati', B.locator('.myd-d .die.hit').count() == 1)
    click(B, '[data-act=doubt]')
    for P in (A, B): P.wait_for_function("G().phase === 'show'", timeout=10000)
    # i 2 con i jolly: 2+0+1(2)+1+1(jolly)... Ale [2,2,3,5,6]=2, Bea [1,...]=1, terzo [1,2,...]=2 → 5 ≥ 3: perde Bea
    t('bicchieri alzati: tutti i dadi scoperti per tutti', A.locator('.rv').count() == 3 and A.locator('.rv .die.hit').count() == 5)
    t('la dichiarazione era vera: perde un dado chi ha dubitato', js(A, 'G().players[%d].n' % b) == 4 and 'Era vero' in B.inner_text('.res'))
    A.screenshot(path=os.path.join(OUT, 'bugiardo-dubito.png'))
    for P in (A, B): click(P, '[data-act=next]')
    host(A, "g.players[%d].ready=true;if(g.phase==='show'&&g.players.every(function(Q){return Q.ready||Q.out}))E.forceNext(g,Date.now())" % c)
    B.wait_for_function("G().phase === 'bid' && G().round === 2", timeout=10000)
    t('nuovo giro: lo apre Bea, con 4 dadi', js(B, 'G().turn') == b and B.locator('.myd-d .die').count() == 4)
    # Esatto!
    host(A, "g.players[%d].dice=[2,2,3,5,6];g.players[%d].dice=[1,4,4,5];g.players[%d].dice=[1,2,3,3,6];g.turn=%d;g.bid={q:5,f:3,p:%d};g.bids=[g.bid]" % (a, b, c, b, a))
    B.wait_for_selector('[data-act=exact]', timeout=10000)
    click(B, '[data-act=exact]')
    B.wait_for_function("G().phase === 'show'", timeout=10000)
    t('«Esatto!» giusto: Bea riprende il dado', js(B, 'G().players[%d].n' % b) == 5 and 'riprende un dado' in B.inner_text('.res'))
    # fine: Ale ha un dado solo e sbaglia
    host(A, "g.players[%d].n=1;g.players[%d].out=true;g.players[%d].n=0;E.forceNext(g,Date.now());g.players[%d].dice=[2];g.players[%d].dice=[4,4,4,4,4];g.turn=%d;g.bid={q:5,f:6,p:%d};g.bids=[g.bid];E.act(g,%d,{a:'doubt'},Date.now());if(g.phase==='over')cur.phase='over'" % (a, c, c, a, b, b, a, b))
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=10000)
    t('fine partita: vince l’ultimo con i dadi', 'Hai vinto' in B.inner_text('.sh-over h2') and 'Bea' in A.inner_text('.sh-over h2'))
    t('l’host può rigiocare', A.locator('.sh-over [data-act=rematch]').count() == 1)
    br.close()
t('nessun errore nelle pagine', not errs, '; '.join(errs[:3]))
done()
