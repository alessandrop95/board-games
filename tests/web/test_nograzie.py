# gioco: nograzie
"""No Grazie! nel browser, con due telefoni (Ale host e Bea) e un giocatore automatico: opzioni della sala
d'attesa (partite di fila, gettoni nascosti o visibili), «No grazie!» che sposta un gettone sul pacco, prendere
la carta con i gettoni, le scale che contano solo per la più bassa, l'obbligo di prendere senza gettoni, i punti
della partita con le carte tolte, e la fine della serie. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/nograzie/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('ng-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def idle(P): P.wait_for_function('Game.idle() && !document.querySelector(".flyer")', timeout=20000); P.wait_for_timeout(200)
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)
    def myturn(P, a, extra=''):
        host(P, "g.turn=%d;g.turnN++;%s" % (a, extra))
        P.wait_for_function('G().turn === myIdx()', timeout=10000); idle(P)

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il nome e le regole in breve', 'No Grazie!' in A.inner_text('h1') and 'scala' in A.inner_text('.lobby'))
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    t('in due non si comincia', js(A, "document.querySelector('[data-act=start]').disabled") and 'almeno 3' in A.inner_text('.lobby'))
    click(A, '[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === 3', timeout=10000)
    A.select_option('#opt-rounds', '3'); B.wait_for_function('App.doc.opts.rounds === 3', timeout=10000)
    t('Bea vede le opzioni', '3 partite' in B.inner_text('.lobby') and 'nascosti' in B.inner_text('.lobby'))
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    g = js(A, 'G()')
    t('24 carte, 11 gettoni a testa, una carta al centro', len(g['deck']) == 23 and g['cur'] is not None and all(P['chips'] == 11 for P in g['players']))
    idle(A)
    a = js(A, 'myIdx()'); b = js(B, 'myIdx()'); bot = 3 - a - b
    t('i gettoni degli altri sono nascosti', '?' in A.inner_text('.opp[data-p="%d"] .chipc' % b) and '11' in A.inner_text('.mine .chipc'))
    # «No grazie!»
    myturn(A, a, "g.cur=30;g.pot=0;g.players[%d].cards=[];g.players[%d].chips=11" % (a, a))
    t('i due pulsanti grandi', A.locator('.bigbtn.take').count() == 1 and A.locator('.bigbtn.pass').count() == 1 and B.locator('.bigbtn').count() == 0)
    A.screenshot(path=os.path.join(OUT, 'nograzie-turno.png'))
    click(A, '[data-act=pass]'); A.wait_for_function('G().pot === 1 && G().turn !== %d' % a, timeout=10000)
    t('«No grazie!»: un gettone sul pacco', js(A, 'G().players[%d].chips' % a) == 10)
    B.wait_for_function('document.querySelectorAll("#pot .pc").length === 1', timeout=10000)
    t('Bea vede il gettone sul pacco', B.locator('#pot .pc').count() == 1)
    # prendere con i gettoni
    myturn(A, a, "g.cur=12;g.pot=4;g.players[%d].cards=[10,11];g.players[%d].chips=6" % (a, a))
    t('il pulsante dice quanto costa davvero', 'scala' in A.inner_text('.bigbtn.take') and '+4 gettoni' in A.inner_text('.bigbtn.take'))
    click(A, '[data-act=take]'); A.wait_for_function('G().players[%d].cards.indexOf(12) >= 0' % a, timeout=10000)
    t('presa la carta e i 4 gettoni; giro la carta dopo e tocca ancora a me', js(A, 'G().players[%d].chips' % a) == 10 and js(A, 'G().turn') == a and js(A, 'G().pot') == 0)
    idle(A)
    t('la scala 10-11-12 è raggruppata e vale 10', A.locator('.mine .run.long .rc').count() == 3 and '0 pt' in A.inner_text('.mine .ptsc'))
    A.screenshot(path=os.path.join(OUT, 'nograzie-scala.png'))
    # senza gettoni si deve prendere
    myturn(A, a, "g.players[%d].chips=0" % a)
    t('senza gettoni «No grazie» è spento', js(A, "document.querySelector('.bigbtn.pass').disabled"))
    # fine della prima partita
    myturn(A, a, "g.deck=[];g.cur=33;g.pot=2;g.players[%d].cards=[10,11,12];g.players[%d].chips=5;g.players[%d].cards=[20];g.players[%d].chips=11;g.players[%d].cards=[3,35];g.players[%d].chips=4" % (a, a, b, b, bot, bot))
    click(A, '[data-act=take]')
    for P in (A, B): P.wait_for_function("G().phase === 'scores'", timeout=20000)
    for P in (A, B): P.wait_for_selector('.sh-round', timeout=20000)
    rr = js(A, 'G().roundRes')
    t('punti: carte (scala = la più bassa) meno gettoni', rr['pts'][a] == 10 + 33 - 7 and rr['pts'][b] == 9 and rr['pts'][bot] == 34, rr['pts'])
    t('si scoprono le carte tolte', B.locator('.sh-round .removed .skc').count() == 9 and 'tolte' in B.inner_text('.sh-round'))
    t('a fine partita i gettoni si vedono', '11' in A.inner_text('.opp[data-p="%d"] .chipc' % b))
    B.screenshot(path=os.path.join(OUT, 'nograzie-punti.png'))
    click(A, '.sh-round [data-act=next]'); click(B, '.sh-round [data-act=next]')
    A.wait_for_function("G().round === 2 && G().phase === 'play'", timeout=15000)
    t('seconda partita: carte e gettoni da capo', js(A, 'G().players.every(function(P){return P.cards.length===0||P.cards.length===1}) && G().players[%d].hist.length === 1' % a))
    # fine della serie
    host(A, "g.round=3;g.deck=[];g.players[%d].cards=[5];g.players[%d].chips=11;g.players[%d].cards=[30];g.players[%d].chips=0;g.players[%d].cards=[25];g.players[%d].chips=2;g.turn=%d" % (a, a, b, b, bot, bot, a))
    A.wait_for_function('G().turn === myIdx()', timeout=10000); idle(A); click(A, '[data-act=take]')
    for P in (A, B): P.wait_for_function("G().phase === 'over'", timeout=20000)
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=20000)
    t('fine delle 3 partite: classifica sui totali', js(A, 'G().players[%d].hist.length' % a) == 2 and len(js(A, 'G().winners')) >= 1 and ('Hai vinto' in A.inner_text('.sh-over') or 'Vince' in A.inner_text('.sh-over')))
    A.screenshot(path=os.path.join(OUT, 'nograzie-fine.png'))
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
