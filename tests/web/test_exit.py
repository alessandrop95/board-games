"""Uscita dal tavolo: host che chiude o passa il comando, solo automatici, giocatore che lascia la partita o esce per ora.
Broker su 8897 (sito senza server)."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
OUT = os.environ.get('OUT', '/tmp')
from playwright.sync_api import sync_playwright
import time
B = 'ws://localhost:8897/'
FAST = 'broker=' + B + '&presMs=6000&offMs=8000&lobbyBeat=4000'
BASE = 'http://localhost:8897/'
res = []
def ok(name, cond, extra=''):
    res.append(bool(cond)); print(('OK  ' if cond else 'NO  ') + name, '' if cond else extra)

with sync_playwright() as p:
    br = p.chromium.launch(); errs = []
    def page(path='gattomina/', q=FAST):
        ctx = br.new_context(viewport={'width': 390, 'height': 844})
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(path + ': ' + str(e)))
        pg.goto(BASE + path + '?' + q); return pg
    def table(pg, nick):
        pg.fill('#nick', nick); pg.click('[data-act=create]'); pg.wait_for_function('App.doc && App.doc.code', timeout=15000); return pg.evaluate('App.code')
    def join(code, nick, path='gattomina/'):
        pg = page(path, FAST + '&t=' + code); pg.wait_for_selector('#nick'); pg.fill('#nick', nick); pg.click('[data-act=join]')
        pg.wait_for_function('App.doc && App.doc.seats.some(s => s.uid === Net.uid)', timeout=10000); return pg
    def gone(pg): return pg.evaluate('App.screen') == 'lobby' and pg.evaluate('App.code') is None
    def esci(pg): pg.click('.topbar [data-act=leave]'); pg.wait_for_timeout(300)
    def sheet(pg): return pg.inner_text('.px-sheet') if pg.locator('.px-sheet').count() else ''

    # 1) host da solo con un automatico, in sala d'attesa: si può solo chiudere
    A = page(); c1 = table(A, 'Ale'); A.click('[data-act=addbot]'); A.wait_for_function('App.doc.seats.length===2')
    esci(A); s = sheet(A)
    ok('solo automatici: propone soltanto di chiudere', 'solo giocatori automatici' in s and 'comando' not in s, s)
    A.click('[data-px=cancel]'); A.wait_for_timeout(200)
    ok('«Resta al tavolo» annulla', A.locator('.px-sheet').count() == 0 and A.evaluate('App.code') == c1)
    esci(A); A.click('[data-px=close]'); A.wait_for_timeout(1500)
    ok('il tavolo si chiude e si torna alla schermata iniziale', gone(A))

    # 2) sala d'attesa con un amico: l'host esce e lascia il comando
    c2 = table(A, 'Ale'); Bp = join(c2, 'Bea'); A.wait_for_function('App.doc.seats.length===2')
    time.sleep(2.5)
    esci(A); s = sheet(A)
    ok('host con un amico: due scelte', 'lascia il comando a Bea' in s and 'Chiudi il tavolo per tutti' in s, s)
    A.click('[data-px=pass]'); A.wait_for_timeout(1500)
    ok('l’host esce', gone(A))
    ok('Bea diventa host e il posto di Ale si libera', Bp.evaluate('Net.isHost') and Bp.evaluate('App.doc.seats.length') == 1, Bp.evaluate('[Net.isHost, App.doc.seats.length]'))
    # Bea ora è sola: chiude
    esci(Bp); ok('Bea da sola: solo chiusura', 'Sei l’unico al tavolo' in sheet(Bp), sheet(Bp)); Bp.click('[data-px=close]'); Bp.wait_for_timeout(1200)
    ok('tavolo di Bea chiuso', gone(Bp))

    # 3) partita in corso: host esce e passa il comando, al suo posto gioca l'automatico
    c3 = table(A, 'Ale'); Bp = join(c3, 'Bea'); A.wait_for_function('App.doc.seats.length===2')
    A.click('[data-act=addbot]'); A.wait_for_function('App.doc.seats.length===3')
    A.evaluate("Net.send({t:'opt',timer:0})"); time.sleep(.5); A.click('[data-act=start]')
    for pg in (A, Bp): pg.wait_for_function('App.doc && App.doc.game', timeout=10000)
    time.sleep(2.5)
    auid = A.evaluate('Net.uid')
    A.click('[data-act=menu]') if A.locator('[data-act=menu]').count() else None
    A.wait_for_timeout(300)
    if A.locator('[data-act=leave]').count(): A.locator('[data-act=leave]').first.click()
    A.wait_for_timeout(300); s = sheet(A)
    ok('in partita l’host vede le due scelte', 'lascia il comando a Bea' in s and 'La partita finisce' in s, s)
    A.click('[data-px=pass]'); A.wait_for_timeout(1500)
    ok('l’host esce dalla partita', gone(A), A.evaluate("[App.screen, App.code, [...document.querySelectorAll('.px-toast')].map(x=>x.textContent).join('|'), document.querySelectorAll('.px-sheet').length]"))
    d = Bp.evaluate('App.doc')
    pl = [P for P in d['game']['players'] if P['nick'] == 'Ale'][0]
    ok('Bea guida il tavolo', Bp.evaluate('Net.isHost'))
    ok('al posto di Ale gioca l’automatico (nuova identità)', pl['bot'] and pl['uid'].startswith('bot-') and auid not in [s_['uid'] for s_ in d['seats']], pl)
    ok('nel registro: «ha lasciato la partita»', any('ha lasciato la partita' in l['t'] for l in d['game']['log']))
    # la partita continua: avanza anche quando tocca all'automatico che ha preso il posto di Ale
    seq0 = Bp.evaluate('App.doc.game.seq'); t0 = time.time()
    while time.time() - t0 < 25:
        dec = Bp.evaluate("(()=>{const g=App.doc.game, d=E.decider(g); return d==null?null:g.players[d].uid})()")
        if dec == Bp.evaluate('Net.uid'):
            Bp.evaluate("(()=>{const g=App.doc.game; const a=BOT.decide(g,myIdx())||{a:'draw'}; act(a)})()")
        if Bp.evaluate('App.doc.phase') != 'play' or Bp.evaluate('App.doc.game.seq') > seq0 + 6: break
        time.sleep(.6)
    ok('la partita va avanti', Bp.evaluate('App.doc.phase') != 'play' or Bp.evaluate('App.doc.game.seq') > seq0 + 3, Bp.evaluate('App.doc.game.seq'))
    # Ale rientra dal link: guarda soltanto, non riprende il posto
    A.goto(BASE + 'gattomina/?' + FAST + '&t=' + c3); A.wait_for_timeout(2500)
    ok('rientrando Ale guarda soltanto', A.evaluate('App.doc && !App.doc.seats.some(s => s.uid === Net.uid)'))
    A.goto(BASE + 'gattomina/?' + FAST); A.wait_for_timeout(800)
    # ora restano Bea e due automatici: Bea esce → solo chiusura, la partita finisce
    Bp.click('[data-act=menu]') if Bp.locator('[data-act=menu]').count() else None
    Bp.wait_for_timeout(300); Bp.locator('[data-act=leave]').first.click(); Bp.wait_for_timeout(300)
    s = sheet(Bp); ok('partita con soli automatici: solo chiusura', 'solo giocatori automatici' in s and 'la partita finisce' in s and 'comando' not in s, s)
    Bp.click('[data-px=close]'); Bp.wait_for_timeout(1500); ok('chiuso: partita finita', gone(Bp))

    # 4) chi non è host: lascia la partita / esce per ora
    c4 = table(A, 'Ale'); Bp = join(c4, 'Bea'); Cp = join(c4, 'Ciro'); A.wait_for_function('App.doc.seats.length===3')
    esci(Bp); ok('sala d’attesa, non host: esce subito senza domande', gone(Bp) and Bp.locator('.px-sheet').count() == 0)
    Bp = join(c4, 'Bea'); A.wait_for_function('App.doc.seats.length===3')
    A.evaluate("Net.send({t:'opt',timer:0})"); time.sleep(.5); A.click('[data-act=start]')
    for pg in (A, Bp, Cp): pg.wait_for_function('App.doc && App.doc.game', timeout=10000)
    Bp.click('[data-act=menu]') if Bp.locator('[data-act=menu]').count() else None
    Bp.wait_for_timeout(300); Bp.locator('[data-act=leave]').first.click(); Bp.wait_for_timeout(300)
    s = sheet(Bp); ok('in partita, non host: lascia o esci per ora', 'Lascia la partita' in s and 'Esci per ora' in s, s)
    Bp.click('[data-px=later]'); Bp.wait_for_timeout(1200)
    buid = Bp.evaluate('Net.uid')
    ok('«Esci per ora»: il posto resta suo', gone(Bp) and A.evaluate("App.doc.seats.some(s => s.uid === '%s')" % buid))
    Cp.click('[data-act=menu]') if Cp.locator('[data-act=menu]').count() else None
    Cp.wait_for_timeout(300); Cp.locator('[data-act=leave]').first.click(); Cp.wait_for_timeout(300); Cp.click('[data-px=quit]'); Cp.wait_for_timeout(1500)
    pl = [P for P in A.evaluate('App.doc.game.players') if P['nick'] == 'Ciro'][0]
    ok('«Lascia la partita»: Ciro sostituito dall’automatico', gone(Cp) and pl['bot'] and pl['uid'].startswith('bot-'), pl)
    ok('l’host resta Ale', A.evaluate('Net.isHost'))

    # 5) gli altri giochi aprono la stessa scelta
    for path in ['polvere-e-piombo/', 'presagio/', 'campi-acciaio/', 'binari-italia/', 'catan/']:
        G = page(path); table(G, 'Ale'); G.click('[data-act=addbot]'); G.wait_for_timeout(600)
        esci(G); s = sheet(G)
        ok(path + ': scelta all’uscita dell’host', 'solo giocatori automatici' in s, s[:80])
        G.click('[data-px=close]'); G.wait_for_timeout(1200); ok(path + ': tavolo chiuso', gone(G))
    print('errori pagina:', errs[:5])
    br.close()
print('%d/%d prove superate' % (sum(res), len(res)))
sys.exit(0 if all(res) else 1)
