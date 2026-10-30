"""Machiavelli nel browser con due telefoni (Ale host e Bea): carte trascinate sul tavolo con i posti giusti evidenziati,
mossa sbagliata rifiutata, bozza vista in diretta dall'altro telefono, fine turno, pesca, vittoria.
Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/machiavelli/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
def C(r, s, d=0): return d * 52 + s * 13 + r - 1
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('mc-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    A = phone('Ale'); A.goto(U); A.wait_for_timeout(1200)
    t('home del gioco', 'Machiavelli' in A.inner_text('h1'))
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = A.evaluate('App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    A.evaluate("document.querySelector('[data-act=start]').click()")
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    g = A.evaluate('G()')
    t('13 carte a testa e mazzo da 78', all(len(P['hand']) == 13 for P in g['players']) and len(g['deck']) == 78)
    a = A.evaluate('myIdx()'); b = 1 - a
    # mano e tavolo preparati: tocca ad Ale
    A.evaluate("Net.hostApply(function(cur){var g=cur.game;g.turn=%d;g.turnN++;g.table=[{id:1,c:[%d,%d,%d]},{id:2,c:[%d,%d,%d,%d]}];g.gidN=2;g.players[%d].hand=%s;return true})" %
               (a, C(7, 0), C(7, 2), C(7, 3), C(5, 3), C(6, 3), C(7, 3, 1), C(8, 3), a, json.dumps([C(5, 1), C(6, 1), C(7, 1), C(9, 3), C(2, 0)])))
    A.wait_for_function('Work.active() && Work.get().hand.length === 5', timeout=10000)
    def center(P, sel):
        bb = P.locator(sel).first.bounding_box(); return bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2
    def drag(P, src, dst, check=None):
        x, y = center(P, src); P.mouse.move(x, y); P.mouse.down(); P.mouse.move(x + 12, y - 12, steps=2)
        tx, ty = center(P, dst); P.mouse.move(tx, ty, steps=6)
        r = P.evaluate(check) if check else None
        P.mouse.up(); P.wait_for_timeout(300); return r
    hl = drag(A, '#gv-hand .cw[data-c="%d"]' % C(7, 1), '[data-drop=g1]', "[document.querySelector('[data-drop=g1]').classList.contains('dz-can'), document.querySelector('[data-drop=g2]').classList.contains('dz-nope'), !!document.querySelector('.dragghost')]")
    t('trascinando il 7♥ il tris si accende di verde e la scala di fiori no', hl == [True, True, True], hl)
    t('7♥ aggiunto al tris: poker', A.evaluate("Work.get().groups[0].c.length") == 4)
    drag(A, '#gv-hand .cw[data-c="%d"]' % C(2, 0), '[data-drop=g2]')
    t('2♠ sulla scala di fiori: rifiutato, resta in mano', A.evaluate("Work.get().hand.indexOf(%d) >= 0" % C(2, 0)))
    drag(A, '#gv-hand .cw[data-c="%d"]' % C(9, 3), '[data-drop=g2]')
    t('9♣ in fondo alla scala', A.evaluate("Work.get().groups[1].c.length") == 5)
    # nuova combinazione con selezione a tocchi
    A.locator('#gv-hand .cw[data-c="%d"]' % C(5, 1)).click(); A.locator('#gv-hand .cw[data-c="%d"]' % C(6, 1)).click(); A.wait_for_timeout(200)
    t('due carte selezionate', A.evaluate('Work.get().sel.length') == 2 and 'selezionate' in A.inner_text('#gv-prompt'))
    A.click('[data-act=newg]'); A.wait_for_timeout(300)
    t('combinazione incompleta in rosso, Fine turno spento', A.locator('.grp.bad').count() == 1 and A.locator('[data-act=done][aria-disabled]').count() == 1)
    # prende il 7♥ dal poker (resta un tris valido) per completare 5-6-7♥
    drag(A, '#gv-table .cw[data-c="%d"]' % C(7, 1), '.grp.bad')
    t('5♥6♥7♥ completata con la carta presa dal poker', A.locator('.grp.bad').count() == 0 and A.evaluate("Work.allValid()"))
    A.wait_for_timeout(1500)
    t('Bea vede la bozza in diretta', B.evaluate("!!(G().draft && G().draft.t.length === 3)") and 'riorganizzando' in B.inner_text('#gv-table'), B.inner_text('#gv-table')[:120])
    A.screenshot(path=os.path.join(OUT, 'machiavelli-turno.png'))
    A.click('[data-act=done]'); A.wait_for_timeout(1200)
    g = A.evaluate('G()')
    t('giocata accettata: tavolo valido e 2♠ ancora in mano', g['turn'] == b and len(g['table']) == 3 and g['players'][a]['hand'] == [C(2, 0)])
    t('Bea vede il tavolo nuovo', B.evaluate('G().table.length') == 3)
    # tocca a Bea: annulla e pesca
    B.wait_for_function('Work.active()', timeout=10000)
    n0 = B.evaluate('G().players[myIdx()].hand.length')
    B.click('[data-act=draw]'); B.wait_for_timeout(1200)
    t('Bea pesca una carta', B.evaluate('G().players[myIdx()].hand.length') == n0 + 1 and A.evaluate('G().turn') == a)
    # Ale chiude: 2♠ con un tris di 2 preparato
    A.evaluate("Net.hostApply(function(cur){var g=cur.game;g.turnN++;g.players[%d].hand=[%d,%d,%d];return true})" % (a, C(2, 0), C(2, 1), C(2, 2)))
    A.wait_for_function('Work.active() && Work.get().hand.length === 3', timeout=10000)
    for c in (C(2, 0), C(2, 1), C(2, 2)): A.locator('#gv-hand .cw[data-c="%d"]' % c).click()
    A.click('[data-act=newg]'); A.wait_for_timeout(300); A.click('[data-act=done]')
    A.wait_for_function("G().phase === 'over'", timeout=10000); A.wait_for_timeout(800)
    t('Ale finisce le carte e vince', A.evaluate('G().winner') == a and 'Hai vinto' in A.inner_text('.sheet'))
    t('Bea vede la classifica', B.locator('.sh-over').count() == 1 or B.evaluate("G().phase") == 'over')
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
