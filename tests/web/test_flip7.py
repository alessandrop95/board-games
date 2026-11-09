# gioco: flip7
"""Flip 7 nel browser con due telefoni (Ale host e Bea) e un giocatore automatico: distribuzione, PESCA e STOP,
Congela dato a un altro con la finestra di scelta, doppione che fa sballare, Seconda possibilità che salva,
Flip Three automatico, Flip 7 che chiude la manche, punti della manche, «Prossima manche» e fine della partita.
Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/flip7/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('f7-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def idle(P): P.wait_for_function('Game.idle() && !document.querySelector(".flyer:not(.spotlit)")', timeout=30000); P.wait_for_timeout(250)
    # nuova manche con il mazzo truccato: le carte escono nell'ordine dato
    def rig(P, cards, dealer, extra=''):
        js(P, """Net.hostApply(function(cur){var g=cur.game, rest=E.fullDeck(), cs=%s;
          cs.forEach(function(c){var i=rest.indexOf(c); rest.splice(i,1);});
          g.deck=rest.concat(cs.slice().reverse()); g.disc=[]; g.round--; g.dealer=%d-1; if(g.dealer<0) g.dealer+=g.players.length;
          E.startRound(g); %s; g.seq++; cur.phase='play'; return true})""" % (json.dumps(cards), dealer, extra))

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(1000)
    t('home del gioco', 'Flip' in A.inner_text('h1') and A.locator('.hero-art .f7c').count() >= 7)
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    click(A, '[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === 3', timeout=10000)
    A.select_option('#opt-target', '100'); B.wait_for_function('App.doc.opts.target === 100', timeout=10000)
    t('Bea vede la soglia scelta dall’host', '100 punti' in B.inner_text('.lobby'))
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    a = js(A, 'myIdx()'); b = js(B, 'myIdx()')
    t('Ale e Bea ai posti 0 e 1, il bot al 2', a == 0 and b == 1)

    # ---------- manche truccata 1: Ale 5, Bea 9, bot 2; Ale pesca 7, Bea pesca Congela ----------
    rig(A, [5, 9, 2, 7, 'FRZ'], 2)
    A.wait_for_function("G().stage === 'turn' && G().turn === 0 && G().players[0].nums.join() === '5'", timeout=10000); idle(A)
    t('una carta scoperta a testa', js(A, "G().players.map(function(P){return P.nums.join()}).join('|')") == '5|9|2')
    t('tocca ad Ale: PESCA e STOP, e il rischio', A.locator('.acts .btn.hit').count() == 1 and A.locator('.acts .btn.stop').count() == 1 and A.locator('.risk').count() == 1)
    B.wait_for_function("G().stage === 'turn'", timeout=10000); idle(B)
    t('Bea non ha i bottoni e vede di chi è il turno', B.locator('.acts').count() == 0 and 'Ale' in B.inner_text('#gv-prompt'))
    A.screenshot(path=os.path.join(OUT, 'flip7-turno.png'))
    click(A, '.acts .btn.hit'); A.wait_for_function("G().players[0].nums.join() === '5,7'", timeout=10000)
    t('PESCA: un numero nuovo in fila, il turno passa', js(A, 'G().turn') == 1)
    B.wait_for_function('G().turn === 1', timeout=10000); idle(B)
    click(B, '.acts .btn.hit'); B.wait_for_function("G().choice && G().choice.c === 'FRZ' && G().choice.p === 1", timeout=10000)
    B.wait_for_selector('.sh-choose', timeout=15000)
    t('Congela: si apre la scelta con tutti i giocatori in gioco', B.locator('.ch-p').count() == 3 and 'Congela' in B.inner_text('.sh-choose'))
    A.wait_for_timeout(500)
    t('Ale vede che Bea sta scegliendo', 'Bea' in A.inner_text('#gv-prompt') and 'Congela' in A.inner_text('#gv-prompt'))
    B.screenshot(path=os.path.join(OUT, 'flip7-scelta.png'))
    click(B, '.ch-p[data-t="0"]'); A.wait_for_function("G().players[0].st === 'frozen'", timeout=10000)
    t('Ale congelato: 12 punti al sicuro', js(A, 'E.score(G().players[0])') == 12)
    B.wait_for_function("G().players[0].st === 'frozen'", timeout=10000); idle(B)
    t('Bea vede il ghiaccio sul pannello di Ale', B.locator('.opp.st-frozen .ovl.ice').count() == 1)
    # Bea si ferma quando tocca a lei (il bot gioca da solo)
    B.wait_for_function("G().phase !== 'play' || (G().stage === 'turn' && G().turn === 1) || G().players[1].st !== 'in'", timeout=30000)
    if js(B, "G().phase === 'play' && G().turn === 1 && G().players[1].st === 'in'"):
        idle(B); click(B, '.acts .btn.stop'); B.wait_for_function("G().players[1].st === 'stay'", timeout=10000)
        t('STOP: Bea si ferma', True)
    A.wait_for_function("G().phase === 'scores'", timeout=40000)
    A.wait_for_selector('.sh-round', timeout=20000)
    t('fine manche: i punti di tutti', A.locator('.rr-row').count() == 3 and 'congelato' in A.inner_text('.sh-round').lower())
    t('Ale ha 12 punti', js(A, 'G().players[0].total') == 12)
    click(A, '[data-act=next]'); B.wait_for_selector('.sh-round [data-act=next]', timeout=20000); click(B, '[data-act=next]')
    A.wait_for_function("G().round === 2", timeout=15000)
    t('prossima manche quando sono tutti pronti', True)

    # ---------- manche truccata 2: il bot è fermo; Seconda possibilità, sballo, Flip Three, Flip 7 e vittoria ----------
    rig(A, [3, 8, 11, 'SC', 8, 3, 'F3', 0, 1, 2, 4, 6, 9], 2, "g.players[2].st='stay'; g.players[0].total=95")
    A.wait_for_function("G().round === 2 && G().stage === 'turn' && G().turn === 0", timeout=10000); idle(A)
    click(A, '.acts .btn.hit'); A.wait_for_function('G().players[0].sc', timeout=10000)
    t('Ale pesca la Seconda possibilità e la tiene', js(A, "G().players[0].nums.join()") == '3')
    B.wait_for_function('G().turn === 1 && G().players[0].sc', timeout=10000); idle(B)
    click(B, '.acts .btn.hit'); B.wait_for_function("G().players[1].st === 'bust'", timeout=10000)
    t('Bea pesca un altro 8 e sballa', js(B, 'E.score(G().players[1])') == 0)
    A.wait_for_function("G().turn === 0 && G().players[1].st === 'bust'", timeout=10000); idle(A)
    t('Ale vede Bea sballata', A.locator('.opp.st-bust').count() == 1)
    click(A, '.acts .btn.hit'); A.wait_for_function("!G().players[0].sc", timeout=10000)
    t('il doppione 3 viene annullato dalla Seconda possibilità', js(A, "G().players[0].st") == 'in' and js(A, "G().players[0].nums.join()") == '3')
    idle(A)
    click(A, '.acts .btn.hit'); A.wait_for_function("G().players[0].nums.length === 4", timeout=10000)
    t('Flip Three (unico in gioco: va ad Ale) fa pescare tre carte', js(A, "G().players[0].nums.join()") == '3,0,1,2')
    idle(A)
    for want in (5, 6):
        A.wait_for_function("G().turn === 0 && G().stage === 'turn'", timeout=10000); idle(A)
        click(A, '.acts .btn.hit'); A.wait_for_function("G().players[0].nums.length === %d" % want, timeout=10000)
    idle(A); A.screenshot(path=os.path.join(OUT, 'flip7-sei.png'))
    t('a sei numeri lo slot del settimo è evidenziato', A.locator('.tab.big .ghost-slot').count() == 1)
    click(A, '.acts .btn.hit'); A.wait_for_function("G().phase === 'over'", timeout=10000)
    t('sette numeri diversi: Flip 7, +15 e la manche finisce', js(A, 'G().roundRes.f7') == 0 and js(A, 'G().roundRes.pts[0]') == 3 + 0 + 1 + 2 + 4 + 6 + 9 + 15)
    t('Ale supera i 100 e vince', js(A, 'G().winners.join()') == '0' and js(A, 'G().players[0].total') == 95 + 40)
    A.wait_for_selector('.sh-over', timeout=30000); B.wait_for_selector('.sh-over', timeout=30000)
    t('classifica finale', 'Hai vinto' in A.inner_text('.sh-over') and 'Vince Ale' in B.inner_text('.sh-over') and A.locator('.pod').count() == 3)
    A.wait_for_timeout(1200); A.screenshot(path=os.path.join(OUT, 'flip7-fine.png'))
    click(A, '.sh-over [data-act=rematch]'); A.wait_for_function("App.doc.phase === 'lobby'", timeout=10000)
    t('nuova partita con lo stesso tavolo', A.locator('[data-act=start]').count() == 1)
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
