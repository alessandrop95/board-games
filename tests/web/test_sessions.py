"""Sessioni dei tavoli: presenza, host offline e ritorno, subentro, doppia scheda, giocatore offline al suo turno,
passaggio del comando all'uscita, avvisi dei nuovi tavoli. Broker su 8897 (sito senza server)."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
OUT = os.environ.get('OUT', '/tmp')
from playwright.sync_api import sync_playwright
import time, sys
B = 'ws://localhost:8897/'
FAST = 'broker=' + B + '&hostTimeout=4000&autoTakeover=6000&stagger=2000&presMs=6000&offMs=8000&lobbyBeat=4000'
BASE = 'http://localhost:8897/'
res = []
def ok(name, cond, extra=''):
    res.append((name, bool(cond))); print(('OK  ' if cond else 'NO  ') + name, extra)

BLOCK = """() => { if (window.__blk) return; window.__blk = true; const o = MQ.prototype._open;
  MQ.prototype._open = function () { if (window.__off) { this.ws = null; this._down(); return; } return o.call(this); };
  window.__goOff = () => { window.__off = true; Object.values(Net._debug().clients).forEach(c => c._drop()); };
  window.__goOn = () => { window.__off = false; Object.values(Net._debug().clients).forEach(c => c.wake()); }; }"""

with sync_playwright() as p:
    br = p.chromium.launch(); errs = []
    def page(ctx=None, q=FAST, path='gattomina/'):
        ctx = ctx or br.new_context(viewport={'width': 390, 'height': 844})
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(BASE + path + '?' + q); pg.evaluate(BLOCK) if path != '' else None
        return pg
    # --- tavolo con 2 persone ---
    H = page(path='')  # home con la lista di tutti i tavoli e gli avvisi
    time.sleep(1.5)
    A = page(); A.fill('#nick', 'Ale'); A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000)
    code = A.evaluate('App.code')
    Bp = page(q=FAST + '&t=' + code); Bp.wait_for_selector('#nick'); Bp.fill('#nick', 'Bea'); Bp.click('[data-act=join]')
    A.wait_for_function('App.doc.seats.length===2', timeout=10000)
    # avvisi: la home vede il tavolo nuovo
    try:
        H.wait_for_function("document.querySelector('.ppa-banner') && document.querySelector('.ppa-banner').textContent.includes('Ale')", timeout=8000); ok('avviso nuovo tavolo in home', True)
    except Exception as e: ok('avviso nuovo tavolo in home', False, str(e)[:100])
    try:
        H.wait_for_function("document.getElementById('open-tables').textContent.includes('Ale')", timeout=8000); ok('lista tavoli in home', True)
    except Exception: ok('lista tavoli in home', False, H.evaluate("document.getElementById('open-tables').textContent"))
    ok('nessun avviso a chi ha creato il tavolo', A.evaluate("!document.querySelector('.ppa-banner')"))
    # presenza
    time.sleep(2.5)
    ok('A vede B collegato', A.evaluate("Net.presence(App.doc.seats[1].uid)") == 'on')
    ok('pallino nella stanza', A.evaluate("!!document.querySelector('.seat .pres-on')"))
    Bp.evaluate('__goOff()'); time.sleep(8)
    ok('A vede B offline', A.evaluate("Net.presence(App.doc.seats[1].uid)") == 'off', A.evaluate("Net.presence(App.doc.seats[1].uid)"))
    ok('scritta offline nella stanza', 'offline' in A.evaluate("document.querySelector('.seats').textContent"))
    Bp.evaluate('__goOn()'); time.sleep(3)
    ok('B torna collegato', A.evaluate("Net.presence(App.doc.seats[1].uid)") == 'on')
    # partita con un automatico, nessun limite di tempo
    A.click('[data-act=addbot]'); A.wait_for_function('App.doc.seats.length===3')
    A.evaluate("Net.send({t:'opt',timer:0})"); time.sleep(.5); A.click('[data-act=start]')
    for pg in (A, Bp): pg.wait_for_function('App.doc && App.doc.game', timeout=10000)
    # --- giocatore offline al suo turno (timer spento): dopo un po' gioca l'automatico ---
    buid = Bp.evaluate('Net.uid')
    t0 = time.time()
    while time.time() - t0 < 40:
        d = A.evaluate("(()=>{const g=App.doc.game, d=E.decider(g); return d==null?null:g.players[d].uid})()")
        if d == buid: break
        if d == A.evaluate('Net.uid'):
            A.evaluate("(()=>{const g=App.doc.game; const a=BOT.decide(g,myIdx())||{a:'draw'}; act(a)})()")
        time.sleep(.6)
    ok('arriva il turno di B', d == buid)
    Bp.evaluate('__goOff()')
    try:
        A.wait_for_function("(()=>{const g=App.doc.game; const P=g.players.find(P=>P.uid==='%s'); return P.bot && P.away})()" % buid, timeout=40000); ok('B offline al suo turno: gioca l’automatico', True)
    except Exception: ok('B offline al suo turno: gioca l’automatico', False)
    Bp.evaluate('__goOn()'); time.sleep(4)
    # --- host offline: B subentra; A intanto applica mosse in locale; al ritorno vale lo stato di B ---
    revB0 = Bp.evaluate('App.doc.rev')
    A.evaluate('__goOff()')
    # mentre è offline l'host forza mosse locali (gli automatici vanno avanti da soli sul suo telefono)
    for i in range(6):
        A.evaluate("Net.hostApply(w=>{w.game.log.push({n:++w.game.logN,t:'mossa offline %d',k:'sys'}); return true})" % i); time.sleep(.3)
    try:
        Bp.wait_for_function('Net.isHost', timeout=30000); ok('B prende il comando', True)
    except Exception: ok('B prende il comando', False)
    time.sleep(3)
    revB = Bp.evaluate('App.doc.rev')
    A.evaluate('__goOn()')
    try:
        A.wait_for_function('!Net.isHost && App.doc.host === "%s"' % buid, timeout=15000); ok('A al ritorno accetta B come host', True)
    except Exception: ok('A al ritorno accetta B come host', False, str(A.evaluate('({h:App.doc.host,isH:Net.isHost,rev:App.doc.rev})')))
    time.sleep(3)
    sa = A.evaluate('JSON.stringify(App.doc.game)'); sb = Bp.evaluate('JSON.stringify(App.doc.game)')
    ok('A e B vedono la stessa partita', sa == sb)
    ok('mosse fatte offline da A scartate', 'mossa offline' not in sb)
    # --- host senza rivali ritorna: le sue mosse offline vengono pubblicate ---
    Bp.evaluate("Net.hostApply(w=>{w.game.log.push({n:++w.game.logN,t:'B ok',k:'sys'}); return true})")
    # --- uscita dell'host durante la partita: il comando passa subito a chi è collegato ---
    Bp.evaluate("leaveTable()")
    try:
        A.wait_for_function('Net.isHost', timeout=4000); ok('uscita host: comando passato subito', True)
    except Exception: ok('uscita host: comando passato subito', False)
    # --- doppia scheda: stessa identità, stesso tavolo ---
    ctxA = A.context
    A2 = ctxA.new_page(); A2.on('pageerror', lambda e: errs.append(str(e))); A2.goto(BASE + 'gattomina/?' + FAST + '&t=' + code)
    A2.wait_for_function('App.doc && App.doc.game', timeout=15000)
    try:
        A.wait_for_selector('#pp-displaced', timeout=5000); ok('vecchia scheda messa in pausa', True)
    except Exception: ok('vecchia scheda messa in pausa', False)
    ok('nuova scheda è l’host', A2.evaluate('Net.isHost'))
    # --- tavolo su invito: nessun avviso ---
    H.evaluate("document.querySelectorAll('.ppa-banner').forEach(b=>b.remove())")
    C = page(); C.fill('#nick', 'Cleo'); C.evaluate("document.querySelector('input[name=vis][value=invite]').checked=true"); C.click('[data-act=create]'); C.wait_for_function('App.doc && App.doc.code', timeout=15000)
    time.sleep(4)
    ok('nessun avviso per i tavoli su invito', H.evaluate("!document.querySelector('.ppa-banner')"))
    # --- avviso di sistema quando la pagina è in sottofondo ---
    ok('interruttore avvisi nella lista dei tavoli', C.evaluate("(()=>{leaveTable(); return new Promise(r=>setTimeout(()=>r(!!document.querySelector('.ppa-ctl')),600))})()"))
    print('errori pagina', errs[:6])
    br.close()
print('%d/%d prove superate' % (sum(1 for _, c in res if c), len(res)))
sys.exit(0 if all(c for _, c in res) else 1)
