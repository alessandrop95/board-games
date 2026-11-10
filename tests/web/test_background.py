# gioco: comuni
"""App in secondo piano e tavoli che non si bloccano: chi regge la partita e nasconde l'app passa subito il comando a chi
guarda e lo riprende al ritorno; se sparisce del tutto un altro subentra e il titolare riavrà il tavolo; presenza «in pausa»;
chi arriva mentre l'host è muto si siede da solo; una mossa fatta mentre l'host è sparito arriva al nuovo host; chiusura
del tavolo da offline; tavolo finito che si chiude quando esce l'ultimo; tavoli abbandonati da giorni; schermo sempre
acceso; richiamo «tocca a te». Broker su 8897 (sito senza server)."""
import json, os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
OUT = os.environ.get('OUT', '/tmp')
B = 'ws://localhost:8897/'
FAST = 'broker=' + B + '&hostTimeout=4000&autoTakeover=5000&stagger=2000&presMs=6000&offMs=8000&lobbyBeat=4000&giveBack=2500&proxyMs=3000'
BASE = 'http://localhost:8897/'
# rete finta (spegni/accendi) e visibilità finta della pagina (come quando si passa a un'altra app)
INIT = """
window.__wl = { n: 0, held: 0 };
try { Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: function () { window.__wl.n++; window.__wl.held++; var l = { release: function () { window.__wl.held--; return Promise.resolve(); }, addEventListener: function () {} }; return Promise.resolve(l); } } }); } catch (e) {}
window.__vis = 'visible';
Object.defineProperty(document, 'visibilityState', { configurable: true, get: function () { return window.__vis; } });
Object.defineProperty(document, 'hidden', { configurable: true, get: function () { return window.__vis === 'hidden'; } });
window.__hide = function () { window.__vis = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); };
window.__show = function () { window.__vis = 'visible'; document.dispatchEvent(new Event('visibilitychange')); };
"""
BLOCK = """() => { if (window.__blk) return; window.__blk = true; const o = MQ.prototype._open;
  MQ.prototype._open = function () { if (window.__off) { this.ws = null; this._down(); return; } return o.call(this); };
  window.__goOff = () => { window.__off = true; Object.values(Net._debug().clients).forEach(c => c._drop()); };
  window.__goOn = () => { window.__off = false; Object.values(Net._debug().clients).forEach(c => c.wake()); }; }"""
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def page(game='nograzie/', q=FAST, nick=None):
        ctx = br.new_context(viewport={'width': 390, 'height': 844})
        ctx.add_init_script(INIT + ("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('ng-intro-done','1');localStorage.setItem('sk-intro-done','1')}catch(e){}" % json.dumps(nick) if nick else ''))
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(BASE + game + '?' + q); pg.wait_for_function('window.Net && window.App'); pg.evaluate(BLOCK); return pg
    def create(pg): pg.click('[data-act=create]'); pg.wait_for_function('App.doc && App.doc.code', timeout=15000); return pg.evaluate('App.code')
    def join(code, nick, game='nograzie/'):
        pg = page(game, FAST + '&t=' + code, nick); pg.wait_for_function('App.doc && App.doc.seats.some(s => s.uid === Net.uid)', timeout=15000); return pg
    def wait(pg, js, ms=15000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    def host(pg, code): pg.evaluate("Net.hostApply(function(cur){%s;return true})" % code)

    # ---------- tavolo: Ale (titolare) + Bea + un automatico ----------
    A = page(nick='Ale'); code = create(A)
    t('chi apre il tavolo ne è il titolare', A.evaluate('App.doc.owner === Net.uid && Net.isOwner'))
    t('al tavolo il battito non rallenta in secondo piano (Web Worker)', A.evaluate('Beat.boosted'))
    Bp = join(code, 'Bea')
    ua = A.evaluate('Net.uid'); ub = Bp.evaluate('Net.uid')
    wait(A, 'App.doc.seats.length === 2')
    t('schermo sempre acceso: richiesto appena seduti', wait(A, '__wl.held === 1', 6000), A.evaluate('JSON.stringify(__wl)'))

    # sala d'attesa: Ale passa a un'altra app (per mandare l'invito) → resta lui a reggere il tavolo, gli altri lo vedono «in pausa»
    A.evaluate('__hide()')
    t('in pausa: gli altri lo vedono distinto da offline', wait(Bp, "Net.presence('%s') === 'away'" % ua, 6000), Bp.evaluate("Net.presence('%s')" % ua))
    t('…con la scritta nella sala', wait(Bp, "document.querySelector('.seats').textContent.includes('in pausa') && !!document.querySelector('.pres-away')", 4000))
    Bp.wait_for_timeout(1500)
    t('in sala d’attesa il comando non si sposta', Bp.evaluate("App.doc.host === '%s' && !Net.isHost" % ua))
    t('schermo: con l’app nascosta il blocco si rilascia', wait(A, '__wl.held === 0', 5000))
    A.evaluate('__show()')
    t('al ritorno torna «collegato»', wait(Bp, "Net.presence('%s') === 'on'" % ua, 6000))

    # si gioca (senza timer): Ale, Bea e un automatico
    A.click('[data-act=addbot]'); wait(A, 'App.doc.seats.length === 3')
    A.evaluate("Net.send({t:'opt',timer:0})"); A.wait_for_timeout(300); A.click('[data-act=start]')
    for pg in (A, Bp): wait(pg, 'App.doc && App.doc.game')
    ia = A.evaluate('myIdx()'); ib = Bp.evaluate('myIdx()')
    host(A, "cur.game.turn=%d;cur.game.seq++" % ib); wait(Bp, 'G().turn === myIdx()')

    # ---------- in partita: chi regge il tavolo nasconde l'app → comando subito a chi guarda, e ritorno ----------
    A.evaluate('__hide()')
    t('host in secondo piano: il comando passa subito a Bea', wait(Bp, 'Net.isHost', 3000), Bp.evaluate('JSON.stringify({h:App.doc.host,o:App.doc.owner})'))
    t('…ma il titolare resta Ale', Bp.evaluate("App.doc.owner === '%s'" % ua))
    # tocca ad Ale mentre ha l'app nascosta: richiamo nel titolo
    Bp.evaluate("act({a:'take'})"); wait(Bp, 'G().turn !== myIdx()')
    host(Bp, "cur.game.turn=%d;cur.game.seq++" % ia)
    t('tocca a me con l’app nascosta: il titolo della scheda mi richiama', wait(A, "document.title.includes('Tocca a te')", 5000), A.evaluate('document.title'))
    A.evaluate('__show()')
    t('…e torna normale quando guardo', wait(A, "!document.title.includes('Tocca a te')", 3000))
    t('il titolare è tornato: Bea gli rende il comando da sola', wait(A, 'Net.isHost', 12000) and wait(Bp, '!Net.isHost', 4000), A.evaluate('JSON.stringify({h:App.doc.host,o:App.doc.owner,me:Net.uid})'))
    t('nessun avviso di subentro per questi passaggi', A.locator('.toast').count() == 0 and Bp.locator('.toast').count() == 0)

    # ---------- l'host sparisce del tutto: una mossa fatta intanto non va persa ----------
    wait(A, 'G().turn === myIdx()'); A.evaluate("act({a:'take'})"); A.wait_for_timeout(400)
    host(A, "cur.game.turn=%d;cur.game.seq++" % ib); wait(Bp, 'G().turn === myIdx()')
    chips0 = Bp.evaluate('G().players[myIdx()].chips'); seq0 = Bp.evaluate('G().seq')
    A.evaluate('__goOff()'); Bp.wait_for_timeout(300)
    Bp.evaluate("window.__mv = null; Net.send({t:'act',a:{a:'take'}}).then(function(){window.__mv='ok'}, function(e){window.__mv='err:'+e})")
    t('host sparito: Bea subentra', wait(Bp, 'Net.isHost', 20000))
    t('…e la mossa che aveva fatto intanto arriva a destinazione', wait(Bp, "window.__mv === 'ok'", 12000) and Bp.evaluate('G().seq') > seq0, Bp.evaluate('window.__mv'))
    t('avviso di subentro a chi ha preso il comando', wait(Bp, "!!document.querySelector('.toast') && document.querySelector('.toast').textContent.includes('reggi tu')", 3000))
    t('il titolare resta Ale anche dopo il subentro', Bp.evaluate("App.doc.owner === '%s'" % ua))
    A.evaluate('__goOn()')
    t('Ale torna: prima accetta Bea, poi riceve indietro il tavolo', wait(A, 'Net.isHost && App.doc.owner === Net.uid', 20000), A.evaluate('JSON.stringify({h:App.doc.host,o:App.doc.owner,me:Net.uid,isH:Net.isHost})'))
    t('Ale e Bea vedono la stessa partita', wait(Bp, '!Net.isHost', 4000) and A.evaluate('JSON.stringify(App.doc.game)') == Bp.evaluate('JSON.stringify(App.doc.game)'))

    # ---------- «Prendi il comando» premuto apposta: il tavolo diventa di chi lo prende ----------
    Bp.evaluate('Net.takeHost()')
    t('comando preso apposta: Bea diventa titolare', wait(A, "App.doc.owner === '%s' && !Net.isHost" % ub, 5000))
    A.wait_for_timeout(4500)
    t('…e nessuno glielo toglie', Bp.evaluate('Net.isHost') and not A.evaluate('Net.isHost'))

    # ---------- menu del tavolo: schermo sempre acceso sì/no ----------
    A.click('[data-act=menu]'); A.wait_for_selector('[data-awake]')
    t('voce «Schermo sempre acceso» nel menu', 'sì' in A.inner_text('[data-awake]') and A.evaluate('__wl.held') == 1)
    A.click('[data-awake]')
    t('spento dal menu: il blocco si rilascia e la scelta resta', wait(A, '__wl.held === 0', 3000) and 'no' in A.inner_text('[data-awake]') and A.evaluate("localStorage.getItem('pp-awake')") == 'off')
    A.click('[data-awake]'); t('riacceso', wait(A, '__wl.held === 1', 6000))
    A.screenshot(path=os.path.join(OUT, 'menu-schermo.png'))
    A.evaluate('App.sheet = null; renderSheet()')

    # ---------- partita finita: chi non è host esce senza domande; l'ultimo che esce chiude il tavolo ----------
    host(Bp, "cur.phase='over';cur.game.phase='over';cur.game.winners=[0]")
    for pg in (A, Bp): wait(pg, "App.doc.phase === 'over'")
    A.evaluate("App.sheet = null; renderSheet(); document.querySelector('[data-act=leave]') ? null : (App.sheet = {kind:'menu'}, renderSheet())"); A.wait_for_timeout(200)
    A.evaluate("document.querySelector('[data-act=leave]').dispatchEvent(new MouseEvent('click', {bubbles: true}))"); A.wait_for_timeout(700)
    t('partita finita: chi non regge il tavolo esce senza la scelta «lascia la partita»', A.locator('.px-sheet').count() == 0 and A.evaluate('App.code') is None)
    t('Bea vede Ale offline dopo un po’', wait(Bp, "Net.presence('%s') === 'off'" % ua, 15000))
    Bp.evaluate('leaveTable()'); Bp.wait_for_timeout(1500)
    C = page(nick='Cleo')
    r = C.evaluate("Net.peek('%s').then(function (f) { return f && f.closed ? 'closed' : f && f.doc ? 'open' : 'none' })" % code)
    t('uscito anche l’ultimo, il tavolo finito si chiude da solo', r == 'closed', r)

    # ---------- chi arriva mentre l'host è muto si siede da solo ----------
    H = page(nick='Dora'); c2 = create(H); uh = H.evaluate('Net.uid')
    H.evaluate('__goOff()'); time.sleep(.5)      # il telefono di Dora ha sospeso l'app (è andata su WhatsApp a mandare l'invito)
    t0 = time.time(); G1 = page(q=FAST + '&t=' + c2, nick='Gino')
    ok = wait(G1, 'App.doc && App.doc.seats.some(function (s) { return s.uid === Net.uid })', 20000)
    t('host muto: l’invitato si siede comunque', ok, G1.evaluate('JSON.stringify(App.doc && App.doc.seats)'))
    t('…in pochi secondi', time.time() - t0 < 14, round(time.time() - t0, 1))
    t('…senza togliere il tavolo a chi l’ha aperto', G1.evaluate("App.doc.host === '%s' && App.doc.owner === '%s' && !Net.isHost" % (uh, uh)))
    H.evaluate('__goOn()')
    t('al ritorno Dora trova Gino seduto ed è ancora lei a reggere il tavolo', wait(H, 'App.doc.seats.length === 2 && Net.isHost', 12000), H.evaluate('JSON.stringify({s:App.doc.seats.length,h:Net.isHost})'))
    H.click('[data-act=addbot]')
    t('…e il tavolo funziona come prima', wait(G1, 'App.doc.seats.length === 3', 6000))

    # ---------- chiudere il tavolo da offline ----------
    H.evaluate('__goOff()'); H.wait_for_timeout(400)
    r = H.evaluate('App.closing = true, Net.closeTable()')
    t('chiusura da offline: si chiude appena torna la rete', r == 'later', r)
    t('…intanto chi l’ha chiuso torna alla schermata iniziale, con l’avviso', wait(H, "App.code === null && App.screen === 'lobby'", 4000) and 'appena torna la connessione' in H.inner_text('body'))
    H.evaluate('__goOn()')
    t('tornata la rete, il tavolo si chiude per tutti', wait(G1, "App.code === null", 15000))

    # ---------- tavolo abbandonato da più di una settimana ----------
    X = page(nick='Zeno'); c3 = create(X)
    host(X, "cur.note='vecchio'"); X.wait_for_timeout(300)
    X.evaluate("(function(){ var T = Net._debug().T, d = JSON.parse(JSON.stringify(T.doc)); d.updated = Date.now() - 8 * 24 * 3600e3; d.rev++; T.c.publish(Net.prefix + d.code + '/state', JSON.stringify(d), true); })()")
    X.wait_for_timeout(400)
    r = C.evaluate("Net.peek('%s').then(function (f) { return f && f.closed ? 'closed' : f && f.doc ? 'open' : 'none' })" % c3)
    t('un tavolo fermo da più di una settimana risulta chiuso', r == 'closed', r)

    A.screenshot(path=os.path.join(OUT, 'background.png'))
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
