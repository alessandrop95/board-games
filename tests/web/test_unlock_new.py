"""Unlock! nel browser, le due avventure aggiunte: «Il teatro dell’illusionista» (3/4) e «Stazione Polare» (4/4).
Lucchetto a carte (scelta semplice con le icone), messaggio cifrato da cercare, radio a manopole, modificatore +50 usato due volte,
selettore della pista. Serve: broker su 8897 (vedi tests/run.sh)."""
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
    def act(P, a): js(P, "Net.send({t:'act',a:%s})" % json.dumps(a)); P.wait_for_timeout(250)
    def put(P, ids): js(P, "Net.hostApply(function(cur){var g=cur.game;%s.forEach(function(id){if(!g.st[id]){g.st[id]='table';g.order.push(id);}});return true})" % json.dumps(ids)); P.wait_for_function("E.onTable(G(), %s)" % json.dumps(ids[-1]), timeout=10000)

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(1000)
    names = A.inner_text('.scns')
    t('in elenco il teatro (3/4) e la stazione polare (4/4)', 'Il teatro dell’illusionista' in names and 'Stazione Polare' in names)
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    t('le carte della lobby sono disegnate', A.locator('.scn .uc-svg').count() == 6)

    # ---------------- teatro ----------------
    click(A, '[data-act=scen][data-s=teatro]'); B.wait_for_function("App.doc.opts.scen === 'teatro'", timeout=10000); click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    t('teatro: livello 3, 2 indizi', js(A, "UScen.get(G().scen).level") == 3 and '2/2' in B.inner_text('.hud') and js(B, "document.body.getAttribute('data-th')") == 'theatre')
    for s in ['A', '33', '24']: act(A, {'a': 'reveal', 'id': s})
    act(A, {'a': 'code', 'id': '24', 'v': '7139'}); A.wait_for_function("E.onTable(G(),'45')", timeout=10000)
    t('il baule si apre con le carte segnate (7139)', js(A, "G().pen") == 0)
    idle(A); idle(B)
    put(A, ['B', 'C', '55', '47', '73', '62'])
    click(B, '[data-act=search]'); B.wait_for_selector('.kp.srch')
    for k in '23': click(B, '[data-act=kp][data-k="%s"]' % k)
    click(B, '[data-act=srok]'); A.wait_for_function("E.onTable(G(),'23')", timeout=10000)
    t('PALCO VENTITRE: il palco 23 si trova con Cerca', js(A, "G().pen") == 0)
    idle(A); idle(B); js(B, 'Game.closeView()')
    js(B, "Game.openView('62')"); B.wait_for_selector('#vw-panel [data-act=mac]'); click(B, '#vw-panel [data-act=mac]')
    t('lucchetto delle carte: sei carte disegnate, bloccato finché scorre l’acqua', B.locator('.chp .ch-ic').count() == 6 and 'valvola' in B.inner_text('.mac-off'))
    click(B, '[data-act=close]')
    put(A, ['60'])
    js(B, "Game.openView('62')"); B.wait_for_selector('#vw-panel [data-act=mac]'); click(B, '#vw-panel [data-act=mac]')
    click(B, '.chp[data-v="Regina di quadri"]'); pen0 = js(B, 'G().pen'); click(B, '[data-act=mgo]'); B.wait_for_function('G().pen > %d' % pen0, timeout=10000)
    t('carta sbagliata: −2 minuti', js(B, 'G().pen') == pen0 + 120)
    click(B, '.chp[data-v="Regina di cuori"]'); B.wait_for_timeout(1200)
    B.screenshot(path=os.path.join(OUT, 'unlock-carte.png'))
    click(B, '[data-act=mgo]'); A.wait_for_function("G().phase === 'over'", timeout=15000)
    t('la regina di cuori libera Zambrini', js(A, 'G().won') is True)
    A.wait_for_selector('.sh-over', timeout=20000); click(A, '.sh-over [data-act=rematch]'); A.wait_for_function("App.doc.phase === 'lobby'", timeout=10000)

    # ---------------- stazione polare ----------------
    click(A, '[data-act=scen][data-s=polare]'); A.wait_for_function("App.doc.opts.scen === 'polare'", timeout=10000); click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_function("G() && G().scen === 'polare' && G().phase === 'play'", timeout=15000)
    t('polare: livello 4, un solo indizio, tema del ghiaccio', '1/1' in B.inner_text('.hud') and js(B, "document.body.getAttribute('data-th')") == 'ice')
    put(A, ['A', 'B', '32', '51'])
    idle(B); js(B, "Game.openView('51')"); B.wait_for_selector('#vw-panel [data-act=mac]'); click(B, '#vw-panel [data-act=mac]')
    t('radio: quattro manopole e il tasto Trasmetti', B.locator('.dcol').count() == 4 and 'Trasmetti' in B.inner_text('.mac') and 'frequenza' in B.inner_text('.mac'))
    for i, n in enumerate([4, 8, 0, 5]):
        for _ in range(n): click(B, '[data-act=dial][data-i="%d"][data-d="1"]' % i)
    click(B, '[data-act=mgo]'); A.wait_for_function("E.onTable(G(),'64')", timeout=10000)
    t('4805 kHz: arriva il Morse del capo', js(A, 'G().pen') == 0)
    idle(A); idle(B); js(B, 'Game.closeView()')
    p0 = js(A, 'G().pen'); act(A, {'a': 'search', 'id': '62'}); A.wait_for_function('G().pen > %d' % p0, timeout=10000)
    t('il palo «in alto sulla mappa» (62) non è quello giusto: −3 minuti', js(A, 'G().pen') == p0 + 180)
    act(A, {'a': 'search', 'id': '26'}); A.wait_for_function("E.onTable(G(),'26')", timeout=10000)
    t('il palo a nord è il 26', True)
    put(A, ['C', 'D', '21', '29', '81'])
    act(A, {'a': 'combine', 'r': '21', 'b': '+50'}); act(A, {'a': 'combine', 'r': '29', 'b': '+50'})
    A.wait_for_function("E.onTable(G(),'71') && E.onTable(G(),'79')", timeout=10000)
    t('il +50 del generatore apre il portellone e accende il quadro', True)
    idle(A); idle(B)
    js(B, "Game.openView('79')"); B.wait_for_selector('#vw-panel [data-act=mac]'); click(B, '#vw-panel [data-act=mac]')
    t('selettore della pista: quattro testate con la freccia', B.locator('.chp .ch-ic').count() == 4)
    click(B, '.chp[data-v="Pista 27"]'); pen0 = js(B, 'G().pen'); click(B, '[data-act=mgo]'); B.wait_for_function('G().pen > %d' % pen0, timeout=10000)
    t('pista sbagliata (col vento in coda): −3 minuti', js(B, 'G().pen') == pen0 + 180)
    click(B, '.chp[data-v="Pista 09"]'); B.wait_for_timeout(1200); B.screenshot(path=os.path.join(OUT, 'unlock-pista.png'))
    click(B, '[data-act=mgo]'); A.wait_for_function("G().phase === 'over'", timeout=15000)
    t('pista 09: il Norseman atterra', js(A, 'G().won') is True)
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
