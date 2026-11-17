# gioco: comuni
"""Ritorno dal background veloce: connessione «zombie» (il browser la crede aperta ma non passa più niente, come su
iPhone dopo il background) sostituita da una nuova quasi subito e senza mostrare «Riconnessione…»; connessione sana
lasciata com'è; mossa fatta con la connessione morta che arriva appena torna; chi regge la partita ha l'app sospesa
e nessuno guardava: chi torna prende il comando in pochi secondi (non più 15-20); versione nuova del gioco: avviso
e ricaricamento automatico al ritorno in primo piano, una volta sola. Broker su 8897 (sito senza server)."""
import json, os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
OUT = os.environ.get('OUT', '/tmp')
BASE = 'http://localhost:8897/bugiardo/?broker=ws://localhost:8897/'
INIT = """
window.__vis = 'visible';
Object.defineProperty(document, 'visibilityState', { configurable: true, get: function () { return window.__vis; } });
Object.defineProperty(document, 'hidden', { configurable: true, get: function () { return window.__vis === 'hidden'; } });
window.__hide = function () { window.__vis = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); };
window.__show = function () { window.__vis = 'visible'; document.dispatchEvent(new Event('visibilitychange')); };
"""
# la connessione del tavolo smette di funzionare senza che il browser se ne accorga
ZOMBIE = "var c = Net._debug().T.c; window.__old = c.ws; c.ws.send = function () {}; c.ws.onmessage = function () {}; c.ws.onclose = function () {};"
# il telefono sospende la pagina: niente rete, niente battito
SUSPEND = """(function () { MQ.prototype._open = function () {}; var T = Net._debug().T, c = T.c; T.stops.forEach(function (f) { f(); });
  if (c.pinger) c.pinger(); c.pinger = null; c.ws.send = function () {}; c.ws.onmessage = function () {}; c.ws.onclose = function () {}; })()"""
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def page(nick, url=BASE, ctx=None):
        ctx = ctx or br.new_context(viewport={'width': 390, 'height': 844})
        ctx.add_init_script(INIT + "try{localStorage.setItem('pp-nick',%s);localStorage.setItem('lb-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        pg.goto(url); pg.wait_for_function('window.Net && window.App'); return pg
    def wait(pg, js, ms=15000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False
    def host(pg, code): pg.evaluate("Net.hostApply(function(cur){%s;return true})" % code)

    A = page('Ale'); A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = A.evaluate('App.code')
    B = page('Bea', BASE + '&t=' + code); wait(B, 'App.doc && App.doc.seats.some(s => s.uid === Net.uid)')
    ua = A.evaluate('Net.uid')
    A.evaluate("document.querySelector('[data-act=addbot]').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); wait(A, 'App.doc.seats.length === 3')
    A.evaluate("Net.send({t:'opt',timer:0})"); A.wait_for_timeout(300)
    A.evaluate("document.querySelector('[data-act=start]').dispatchEvent(new MouseEvent('click',{bubbles:true}))")
    for P in (A, B): wait(P, 'App.doc && App.doc.game')
    a = A.evaluate('myIdx()'); b = B.evaluate('myIdx()')
    host(A, "cur.game.players.forEach(function(Q){Q.bot=false});cur.game.turn=%d;cur.game.seq++" % a)
    B.wait_for_timeout(1500)

    # ---------- connessione zombie dopo un lungo sonno: la nuova parte subito, senza «Riconnessione…» ----------
    B.evaluate("window.__flash = false; window.__mo = setInterval(function () { if (!Net.connected) window.__flash = true; }, 20);")
    t0 = time.time()
    B.evaluate("(function(){" + ZOMBIE + " c.lastRx = Date.now() - 40000; document.dispatchEvent(new Event('visibilitychange')); })()")
    ok = wait(B, 'Net._debug().T.c.ws !== window.__old && Net.connected', 3000)
    t('sonno lungo: nuova connessione quasi subito', ok and time.time() - t0 < 1.5, round(time.time() - t0, 2))
    t('…senza passare da «Riconnessione…»', not B.evaluate('window.__flash'))
    t('…e la vecchia connessione è chiusa', wait(B, 'window.__old.readyState >= 2', 3000))

    # ---------- pausa breve: si verifica, e se il server tace si apre una connessione nuova in parallelo ----------
    B.wait_for_timeout(1500); t0 = time.time()
    B.evaluate("(function(){" + ZOMBIE + " c.lastRx = Date.now() - 3000; document.dispatchEvent(new Event('visibilitychange')); })()")
    ok = wait(B, 'Net._debug().T.c.ws !== window.__old && Net.connected', 4000)
    t('pausa breve con connessione morta: nuova in circa un secondo (non più 3-4)', ok and time.time() - t0 < 2.2, round(time.time() - t0, 2))

    # ---------- connessione sana: nessuna riconnessione inutile ----------
    B.wait_for_timeout(1500)
    B.evaluate("window.__keep = Net._debug().T.c.ws; Net._debug().T.c.lastRx = Date.now() - 3000; document.dispatchEvent(new Event('visibilitychange'))")
    B.wait_for_timeout(1500)
    t('connessione sana: resta la stessa', B.evaluate('Net._debug().T.c.ws === window.__keep && Net._debug().T.c.att.length === 0'))

    # ---------- mossa fatta con la connessione morta: arriva appena torna ----------
    host(A, "cur.game.turn=%d;cur.game.bid=null;cur.game.bids=[];cur.game.seq++" % b)
    wait(B, 'G().turn === myIdx() && !G().bid')
    t0 = time.time()
    B.evaluate("(function(){" + ZOMBIE + " c.lastRx = Date.now() - 3000; window.__mv = null; Net.send({t:'act',a:{a:'bid',q:1,f:3}}).then(function(){window.__mv='ok'}, function(e){window.__mv='err:'+e}); document.dispatchEvent(new Event('visibilitychange')); })()")
    ok = wait(B, "window.__mv === 'ok' && G().bids.length === 1", 6000)
    t('mossa fatta con la connessione morta: arriva in un paio di secondi', ok and time.time() - t0 < 3, (round(time.time() - t0, 2), B.evaluate('window.__mv')))
    t('…ed è arrivata una volta sola', A.evaluate('G().bids.length') == 1)

    # ---------- chi regge la partita ha l'app sospesa e nessuno guardava ----------
    B.evaluate('clearInterval(window.__mo); __hide()'); B.wait_for_timeout(1500)
    A.evaluate('__hide()'); A.wait_for_timeout(1000)
    t('nessuno guarda il tavolo: il comando resta ad Ale', A.evaluate('Net.isHost'))
    A.evaluate(SUSPEND)
    B.wait_for_timeout(6000)
    t0 = time.time(); B.evaluate('__show()')
    ok = wait(B, 'Net.isHost', 12000)
    t('host sospeso: chi torna prende il comando in pochi secondi', ok and time.time() - t0 < 8, round(time.time() - t0, 1))
    t('…e il tavolo resta di Ale (al ritorno gli viene reso)', B.evaluate("App.doc.owner === '%s'" % ua))
    B.screenshot(path=os.path.join(OUT, 'reconnect.png'))

    # ---------- versione nuova del gioco ----------
    ctx = br.new_context(viewport={'width': 390, 'height': 844})
    ctx.route('**/version.json*', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps({'bugiardo': 'nuovissima01'})))
    C = page('Cleo', BASE, ctx)
    t('la pagina sa la sua versione', bool(C.evaluate("document.querySelector('meta[name=pp-build]').content")))
    C.evaluate('Fresh.check(true)')
    t('versione nuova pubblicata: avviso con «Aggiorna»', wait(C, "!!document.getElementById('pp-fresh') && document.getElementById('pp-fresh').textContent.includes('Aggiorna')", 5000))
    C.evaluate('window.__mark = 1; __hide()'); C.evaluate('__show()')
    t('al ritorno dall’app la pagina si ricarica da sola', wait(C, 'window.Net && window.App && !window.__mark', 10000))
    C.wait_for_timeout(1000)
    C.evaluate("Fresh.check(true)"); C.wait_for_timeout(800)
    C.evaluate('window.__mark = 2; __hide()'); C.evaluate('__show()'); C.wait_for_timeout(1500)
    t('…una volta sola: se la copia è ancora vecchia non ricarica all’infinito', C.evaluate('window.__mark') == 2)
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
