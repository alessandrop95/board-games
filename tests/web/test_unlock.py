"""Unlock! nel browser con due telefoni (Ale host e Bea): tutorial «La soffitta del nonno» giocato dall'interfaccia,
con numeri visibili e nascosti, chi guarda cosa, unioni giuste e sbagliate, carta penalità, macchina, lucchetto,
indizi, pausa e fine con le stelle. Poi un pezzo di «Abisso» con il modificatore +20 e la radio in Morse.
Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/unlock/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('ul-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def idle(P): P.wait_for_function('Game.idle() && !document.querySelector(".ov")', timeout=30000); P.wait_for_timeout(250)
    def settle(P): idle(P); js(P, 'Game.closeView()'); P.wait_for_timeout(250)

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(1000)
    t('home del gioco', 'Unlock!' in A.inner_text('h1') and A.locator('.scn').count() == 2)
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    t('niente giocatori automatici: è cooperativo', A.locator('[data-act=addbot]').count() == 0)
    click(A, '[data-act=scen][data-s=soffitta]'); B.wait_for_function("App.doc.opts.scen === 'soffitta'", timeout=10000)
    t('Bea vede l’avventura scelta', 'La soffitta del nonno' in B.inner_text('.scns'))
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    t('timer da 10 minuti', js(A, 'G().limit') == 600 and js(B, "document.getElementById('tdig').textContent").startswith(('10:00', '09:5')))
    t('in tavola solo la carta iniziale', js(A, 'E.table(G()).join()') == 'start')

    # Ale apre la carta iniziale e tocca la A
    click(A, '.tc[data-id=start]'); A.wait_for_selector('.vw .uc-spot[data-id=A]')
    t('carta in grande con i numeri da scoprire', A.locator('#vw-panel .ref').count() == 1)
    click(A, '.vw .uc-spot[data-id=A]')
    B.wait_for_function("E.onTable(G(), 'A')", timeout=10000)
    t('Bea vede l’annuncio della nuova stanza', B.locator('.mini').count() >= 1)
    A.wait_for_selector('.ov-rev', timeout=5000); t('Ale vede la carta girarsi', A.locator('.ov-rev .rv-flip').count() == 1)
    idle(A)
    t('dopo l’animazione la stanza si apre in grande', js(A, 'App.view') == 'A')
    js(A, 'Game.closeView()')
    # Bea guarda la stanza: Ale lo vede
    B.wait_for_timeout(500); click(B, '.tc[data-id=A]'); A.wait_for_function("G().look[1] === 'A'", timeout=10000); A.wait_for_timeout(300)
    t('Ale vede che Bea guarda la stanza', A.locator('.tc[data-id=A] .tc-look').count() == 1)
    # numero nascosto: la chiavetta
    t('il numero nascosto non è tra quelli elencati', B.locator('#vw-panel .ref[data-id="4"]').count() == 0 and B.locator('.vw .uc-spot.uc-hid[data-id="4"]').count() == 1)
    click(B, '.vw .uc-spot.uc-hid[data-id="4"]')
    A.wait_for_function("E.onTable(G(), '4')", timeout=10000); A.wait_for_timeout(400)
    t('per Ale la chiavetta è NUOVA', A.locator('.tc[data-id="4"] .tc-new').count() == 1)
    settle(B)
    for n in ('11', '23', '9'): js(B, "Net.send({t:'act',a:{a:'reveal',id:'%s'}})" % n); B.wait_for_timeout(200)
    A.wait_for_function("E.onTable(G(), '9')", timeout=10000); settle(A); settle(B)
    # unione sbagliata con carta penalità (chiavetta nel cassettone)
    click(A, '[data-act=comb]'); click(A, '.tc[data-id="23"]'); click(A, '.tc[data-id="4"]')
    t('barra dell’unione con la somma', '27' in A.inner_text('.comb') and A.locator('.tc.dim').count() >= 2)
    click(A, '[data-act=combgo]')
    B.wait_for_selector('.ov-pen', timeout=10000)
    t('carta penalità per tutti: −1 minuto', js(B, 'G().pen') == 60 and js(B, "G().st['27']") == 'gone')
    A.screenshot(path=os.path.join(OUT, 'unlock-penalita.png'))
    settle(A); settle(B)
    # unione giusta: baule + chiavetta
    click(B, '[data-act=comb]'); click(B, '.tc[data-id="11"]'); click(B, '.tc[data-id="4"]'); click(B, '[data-act=combgo]')
    A.wait_for_function("E.onTable(G(), '15')", timeout=10000)
    t('baule aperto: baule e chiavetta scartati', js(A, "G().st['11']") == 'gone' and js(A, "G().st['4']") == 'gone')
    settle(B); settle(A)
    js(A, "Net.send({t:'act',a:{a:'reveal',id:'20'}})"); js(A, "Net.send({t:'act',a:{a:'reveal',id:'8'}})"); A.wait_for_function("E.onTable(G(), '8')", timeout=10000); settle(A)
    # macchina: grammofono
    click(A, '.tc[data-id="20"]'); A.wait_for_selector('#vw-panel [data-act=mac]'); click(A, '#vw-panel [data-act=mac]')
    click(A, '[data-act=mopt][data-v="33"]'); click(A, '[data-act=mgo]'); A.wait_for_selector('.mac.err', timeout=10000)
    t('velocità sbagliata: −1 minuto', js(A, 'G().pen') == 120)
    click(A, '[data-act=mopt][data-v="45"]'); click(A, '[data-act=mgo]')
    A.wait_for_function("E.onTable(G(), '13')", timeout=10000)
    B.wait_for_function("E.onTable(G(), '13')", timeout=10000); t('anche Bea sente la canzone del nonno', js(B, "G().st['8']") == 'gone')
    settle(A)
    # indizio sulla botola
    click(B, '.tc[data-id="9"]'); B.wait_for_selector('#vw-panel [data-act=hintask]'); click(B, '#vw-panel [data-act=hintask]'); click(B, '#vw-panel [data-act=hint]')
    A.wait_for_function("G().hintN === 1", timeout=10000)
    B.wait_for_function('G().hintN === 1', timeout=10000); B.wait_for_timeout(300)
    t('indizio visibile a Bea', B.locator('#vw-panel .hint.h1').count() == 1)
    settle(B)
    # pausa
    click(A, '[data-act=pause]'); B.wait_for_function('G().paused', timeout=10000); B.wait_for_timeout(400)
    t('pausa per tutti', 'paused' in B.get_attribute('#timer', 'class') and 'IN PAUSA' in B.inner_text('.hud'))
    click(B, '[data-act=pause]'); A.wait_for_function('!G().paused', timeout=10000)
    # codice sbagliato e giusto dalla tastiera
    click(A, '.tc[data-id="9"]'); A.wait_for_selector('#vw-panel [data-act=code]'); click(A, '#vw-panel [data-act=code]')
    for k in '1234': click(A, '[data-act=kp][data-k="%s"]' % k)
    t('le cifre sul display', A.locator('.kp-lcd span.on').count() == 4)
    click(A, '[data-act=kpok]'); A.wait_for_selector('.kp.err', timeout=10000)
    t('codice sbagliato: ERRORE e −2 minuti', js(A, 'G().pen') == 240 and 'ERRORE' in A.inner_text('.kp-lcd'))
    for k in '1973': click(A, '[data-act=kp][data-k="%s"]' % k)
    click(A, '[data-act=kpok]')
    for P in (A, B): P.wait_for_function("G().phase === 'over'", timeout=10000)
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=20000)
    g = js(A, 'G()')
    t('fuori dalla soffitta: vinta, stelle 1-5', g['won'] and 1 <= g['stars'] <= 5)
    t('risultato con stelle e tempi', B.locator('.stars .st.on').count() == g['stars'] and 'penalità' in B.inner_text('.ostats'))
    A.screenshot(path=os.path.join(OUT, 'unlock-fine.png'))

    # Abisso: modificatore +20 e radio
    click(A, '.sh-over [data-act=rematch]'); A.wait_for_function("App.doc.phase === 'lobby'", timeout=10000)
    click(A, '[data-act=scen][data-s=abisso]'); A.wait_for_function("App.doc.opts.scen === 'abisso'", timeout=10000); click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_function("G() && G().scen === 'abisso' && G().phase === 'play'", timeout=15000)
    t('Abisso: 60 minuti', js(B, 'G().limit') == 3600)
    D = phone('Dario'); D.goto(U + '&t=' + code); D.wait_for_function("G() && myIdx() >= 0", timeout=15000)
    t('ci si unisce alla squadra anche ad avventura iniziata', js(A, 'G().players.length') == 3 and D.locator('[data-act=comb]').count() == 1)
    sol = js(A, 'UScen.S.abisso.solution')
    k = [i for i, s in enumerate(sol) if s['a'] == 'machine' and s['id'] == '47'][0]
    for s in sol[:k]: js(A, "Net.send({t:'act',a:%s})" % json.dumps(s)); A.wait_for_timeout(120)
    A.wait_for_function("E.onTable(G(), '47') && E.onTable(G(), '42')", timeout=20000); settle(A); settle(B)
    t('il +20 della sala macchine compare nella barra', (click(A, '[data-act=comb]') or True) and A.locator('.modchip').count() == 1)
    click(A, '[data-act=combx]')
    t('Bea vede la sala macchine asciutta con la stella', js(B, "G().st['42']") == 'table')
    click(B, '.tc[data-id="47"]'); B.wait_for_selector('#vw-panel [data-act=mac]'); click(B, '#vw-panel [data-act=mac]')
    for kk in ['-', ' ', '.', '-', '.', '.', ' ', '.', '.', '.']: click(B, '[data-act=mz][data-k="%s"]' % kk)
    t('nastro Morse decodificato: TLS', B.inner_text('#mz-tape').replace('\n', '').endswith('S') and 'L' in B.inner_text('#mz-tape'))
    B.screenshot(path=os.path.join(OUT, 'unlock-radio.png'))
    click(B, '[data-act=mgo]')
    A.wait_for_function("E.onTable(G(), '70')", timeout=10000)
    t('la base risponde', js(A, "G().st['70']") == 'table')
    settle(A); A.screenshot(path=os.path.join(OUT, 'unlock-tavolo.png'))
    # partita guidata da soli: tutorial con i passi consigliati
    C = phone('Cate'); C.goto(U); C.wait_for_timeout(1000)
    t('invito al tutorial guidato', 'tutorial guidato' in C.inner_text('.cx-start'))
    C.click('[data-coach=start]'); C.wait_for_function("G() && G().phase === 'play'", timeout=20000)
    t('la partita guidata parte dal tutorial', js(C, 'G().scen') == 'soffitta' and js(C, 'App.doc.practice') is True)
    C.wait_for_selector('.cx-bar', timeout=5000)
    t('la guida suggerisce cosa fare', 'Cerca un numero' in C.inner_text('.cx-bar'))
    for i in range(14):
        if js(C, "G().phase") == 'over': break
        idle(C); js(C, 'Game.closeView()'); C.wait_for_selector('[data-coach=suggest]', timeout=10000); click(C, '[data-coach=suggest]'); C.wait_for_timeout(700)
    C.wait_for_function("G().phase === 'over'", timeout=20000)
    t('con i passi consigliati si esce dalla soffitta', js(C, 'G().won') is True)
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
