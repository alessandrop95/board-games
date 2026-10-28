"""Catan nel browser, con due telefoni veri (Ale host e Bea) e un giocatore automatico:
fondazione toccando l'isola, scambio tra giocatori, il 7 con lo scarto e il ladro, costruzione, nessun errore nelle pagine.
Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/catan/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
# i tempi d'attesa lunghi (giocatori automatici, animazioni) diventano brevi
FAST = "(function(){var st=window.setTimeout;window.setTimeout=function(f,ms){if(ms>=700&&ms<=12000)ms=ms*0.15;return st.apply(window,[f,ms].concat([].slice.call(arguments,2)))}})();"
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('ct-intro-done','1')}catch(e){}" % json.dumps(nick) + FAST)
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    A = phone('Ale'); A.goto(U); A.wait_for_timeout(1200)
    t('home del gioco con il titolo', 'Catan' in A.inner_text('h1'))
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = A.evaluate('App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    t('con 2 giocatori non si parte', A.locator('[data-act=start][disabled]').count() == 1)
    A.click('[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === 3', timeout=10000)
    A.select_option('#opt-vp', '12'); A.check('#opt-gentle'); A.wait_for_timeout(600)
    t('opzioni del tavolo viste da Bea', '12 punti' in B.inner_text('.panel >> nth=1') and 'ladro gentile' in B.inner_text('.panel >> nth=1'), B.inner_text('.panel >> nth=1')[:300])
    A.click('[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    g = A.evaluate('G()')
    t('isola: 19 tessere, 18 numeri, 9 porti, ladro nel deserto', len(g['hex']) == 19 and A.locator('.bd-token').count() == 18 and A.locator('.bd-harbor').count() == 9 and g['hex'][g['robber']]['t'] == 'desert')
    t('opzioni nella partita', g['opts'] == {'vp': 12, 'gentle': True}, g['opts'])
    t('lo stesso tabellone su tutti i telefoni', B.evaluate('JSON.stringify(G().hex)') == json.dumps(g['hex'], separators=(',', ':')))

    # ---- fondazione: si tocca l'isola (o, se il posto è coperto, si sceglie dal codice) e si conferma ----
    taps = 0
    def mine(P): return P.evaluate('(function(){var g=G();return g.phase==="play"&&CTEngine.decider(g)===myIdx()})()')
    def place(P):
        global taps
        mv = P.evaluate('CTBot.decide(clone(G()),myIdx(),{})'); tid = mv.get('v', mv.get('e', mv.get('h')))
        try: P.locator('.bd-spots [data-id="%d"]' % tid).click(timeout=2000); taps += 1
        except Exception: P.evaluate('App.pickSel=%d;Game.render()' % tid)
        P.wait_for_selector('[data-act=pickok]', timeout=4000); P.click('[data-act=pickok]')
    shot = False; t0 = time.time()
    while A.evaluate('G().stage') == 'setup' and time.time() - t0 < 90:
        for P in (A, B):
            if mine(P):
                if not shot:
                    n = P.locator('.bd-spots circle').count(); t('fondazione: gli incroci validi lampeggiano', n > 20, n); shot = True
                    t('riga dorata: istruzioni della fondazione', 'Fondazione' in P.inner_text('#gv-prompt'), P.inner_text('#gv-prompt'))
                place(P); P.wait_for_timeout(300)
        A.wait_for_timeout(200)
    g = A.evaluate('G()')
    t('fondazione finita: 2 colonie e 2 strade a testa', g['stage'] == 'roll' and all(sum(1 for v in g['vown'].values() if v['p'] == i) == 2 for i in range(3)) and len(g['eown']) == 6, g['stage'])
    t('fondazione con tocchi veri sull’isola', taps >= 2, taps)
    t('seconda colonia: risorse ricevute', sum(sum(P['res'].values()) for P in g['players']) >= 3, [P['res'] for P in g['players']])
    A.screenshot(path=os.path.join(OUT, 'catan-dopo-fondazione.png'))

    # ---- scambio tra Ale e Bea ----
    a, b = A.evaluate('myIdx()'), B.evaluate('myIdx()')
    A.evaluate("Net.hostApply(function(cur){var g=cur.game;g.turn=%d;g.stage='roll';g.rolled=false;g.trade=null;g.players[%d].res={brick:1,wood:1,wool:2,grain:1,ore:0};g.players[%d].res={brick:0,wood:0,wool:0,grain:1,ore:2};g.players.forEach(function(P){P.devs=[]});return true})" % (a, a, b))
    A.wait_for_timeout(800)
    A.evaluate('CTEngine.setRandom(function(){return 0.4})'); A.click('[data-act=roll]'); A.wait_for_timeout(900); A.evaluate('CTEngine.setRandom(null)')
    t('Ale lancia i dadi (3+3)', A.evaluate('JSON.stringify(G().dice)') == '[3,3]' and A.evaluate('G().stage') == 'main')
    t('Bea vede i dadi', B.locator('#gv-prompt .die').count() == 2)
    A.evaluate("Net.hostApply(function(cur){var g=cur.game;g.players[%d].res={brick:1,wood:1,wool:2,grain:1,ore:0};g.players[%d].res={brick:0,wood:0,wool:0,grain:1,ore:2};g.players.forEach(function(P,i){if(i!==%d&&i!==%d)P.res={brick:0,wood:0,wool:0,grain:0,ore:0}});return true})" % (a, b, a, b))
    A.wait_for_timeout(600)
    A.click('[data-act=trade]'); A.wait_for_selector('.sh-trade')
    A.click('[data-act=tgive][data-r=wool][data-d="1"]'); A.click('[data-act=tget][data-r=ore][data-d="1"]'); A.click('[data-act=tpropose]')
    B.wait_for_selector('.tr.in [data-act=respond][data-ok="1"]', timeout=8000)
    t('Bea riceve la proposta con Accetto/Rifiuto', 'Ale' in B.inner_text('.tr.in') and 'chiede' in B.inner_text('.tr.in'), B.inner_text('.tr.in'))
    B.click('[data-act=respond][data-ok="1"]')
    A.wait_for_selector('[data-act=deal][data-p="%d"]' % b, timeout=8000); A.click('[data-act=deal][data-p="%d"]' % b); A.wait_for_timeout(900)
    pa, pb = A.evaluate('G().players[%d].res' % a), A.evaluate('G().players[%d].res' % b)
    t('scambio fatto: Ale dà lana e riceve minerale', pa['wool'] == 1 and pa['ore'] == 1 and pb['wool'] == 1 and pb['ore'] == 1, [pa, pb])
    t('niente più barra dello scambio', B.locator('.tr').count() == 0)

    # ---- costruzione di una strada dal menu Costruisci ----
    A.click('[data-act=build]'); A.wait_for_selector('.sh-build'); A.click('[data-act=buildpick][data-k=road]'); A.wait_for_timeout(300)
    n = A.locator('.bd-spots line').count(); t('strada: i lati validi lampeggiano', n >= 2, n)
    e = A.evaluate('CTEngine.legalRoads(G(),myIdx())[0]'); A.evaluate('App.pickSel=%d;Game.render()' % e); A.click('[data-act=pickok]'); A.wait_for_timeout(900)
    t('strada costruita e pagata', A.evaluate('G().eown[%d]' % e) == a and A.evaluate('G().players[%d].res.brick' % a) == 0)
    t('Bea vede la nuova strada', B.evaluate('G().eown[%d]' % e) == a)

    # ---- il 7: Bea scarta, Ale sposta il ladro ----
    A.evaluate("Net.hostApply(function(cur){var g=cur.game;g.turn=%d;g.stage='roll';g.rolled=false;g.players[%d].res={brick:2,wood:2,wool:2,grain:2,ore:1};return true})" % (a, b)); A.wait_for_timeout(800)
    A.evaluate('(function(){var s=[0.4,0.55],i=0;CTEngine.setRandom(function(){return i<2?s[i++]:Math.random()})})()'); A.click('[data-act=roll]'); A.wait_for_timeout(300); A.evaluate('CTEngine.setRandom(null)')
    B.wait_for_selector('.sh-discard', timeout=8000)
    t('col 7 Bea deve scartare 4 carte', 'scartarne 4' in B.inner_text('.sh-discard'), B.inner_text('.sh-discard')[:200])
    B.click('[data-act=discardauto]'); B.click('[data-act=discardok]'); B.wait_for_timeout(1200)
    t('Bea ha scartato metà delle carte', A.evaluate('CTEngine.total(G().players[%d].res)' % b) == 5)
    A.wait_for_function("G().stage === 'robber'", timeout=10000)
    n = A.locator('.bd-spots path').count(); t('ladro: le tessere possibili lampeggiano (col ladro gentile non quelle di chi ha 2 punti)', n >= 1 and n == A.evaluate('CTEngine.robberTargets(G(),myIdx()).length'), n)
    h = A.evaluate("(function(){var g=G(),me=myIdx();var l=CTEngine.robberTargets(g,me).filter(function(h){return CTEngine.victimsAt(g,me,h).length});return l.length?l[0]:CTEngine.robberTargets(g,me)[0]})()")
    A.evaluate('App.pickSel=%d;Game.render()' % h); A.click('[data-act=pickok]'); A.wait_for_timeout(900)
    if A.evaluate("G().stage") == 'steal':
        A.wait_for_selector('[data-act=stealp]', timeout=5000); A.locator('[data-act=stealp]').first.click(); A.wait_for_timeout(800)
    t('ladro spostato e turno che continua', A.evaluate('G().robber') == h and A.evaluate('G().stage') == 'main')
    t('tessera del ladro scurita su tutti i telefoni', B.locator('.bd-token.robbed[data-hex="%d"]' % h).count() == 1 or A.evaluate('G().hex[%d].n' % h) is None)
    A.screenshot(path=os.path.join(OUT, 'catan-ladro.png'))

    # ---- fine turno, la partita va avanti con l'automatico ----
    A.click('[data-act=end]'); A.wait_for_timeout(1500)
    t('fine turno: tocca a un altro', A.evaluate('G().turn') != a)
    B.click('[data-act=rules]'); B.wait_for_selector('.sh-rules'); t('regole complete', all(k in B.inner_text('.sh-rules') for k in ['fondazione', 'ladro', 'Strada più lunga', 'Monopolio', 'porto'])); B.click('[data-act=close]')
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
