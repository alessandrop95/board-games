# gioco: miniera
"""La Miniera nel browser, con due telefoni (Ale host e Bea) e due giocatori automatici: sala d'attesa, scelta
segreta (gli altri vedono solo che hai scelto), galleria scoperta quando hanno scelto tutti, ritorno al campo con le
pepite nella cassa, pericolo doppio che fa scappare chi è dentro, fine della partita. Serve: broker su 8897."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/miniera/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('mn-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il titolo e le regole in breve', 'Miniera' in A.inner_text('h1') and 'pepite' in A.inner_text('.lobby'))
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    t('in 2 non si parte: servono 3 giocatori', A.locator('[data-act=start][disabled]').count() == 1)
    for i in range(2): click(A, '[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === %d' % (3 + i), timeout=10000)
    A.select_option('#opt-time', '25'); A.wait_for_function('App.doc.opts.time === 25', timeout=10000)
    A.select_option('#opt-exps', '3'); A.wait_for_function('App.doc.opts.exps === 3', timeout=10000)
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    a = js(A, 'myIdx()'); b = js(B, 'myIdx()')
    # i giocatori automatici restano fermi: decide la prova
    host(A, "g.players.forEach(function(Q){Q.bot=false});g.path=[{c:'g7',left:1}];g.players.forEach(function(Q){Q.carry=2;Q.ch=null});g.deck=['g5','hfrana','hfrana','g9']")
    B.wait_for_function('G().path.length === 1 && G().deck.length === 4', timeout=10000)
    t('una galleria scoperta e i due pulsanti', B.locator('.gal.gem').count() == 1 and B.locator('[data-act=go]').count() == 1 and B.locator('[data-act=back]').count() == 1)
    t('tasca e pepite per terra in chiaro', '2' in B.inner_text('.pocket') and 'per terra' in B.inner_text('.pocket'))
    click(B, '[data-act=go]')
    A.wait_for_function('G().players[%d].ch === "go"' % b, timeout=10000)
    t('gli altri vedono solo che Bea ha scelto', A.locator('.pl.chose').count() == 1)
    others = [i for i in range(4) if i not in (a, b)]
    # Ale torna al campo, gli automatici vanno avanti: la nuova galleria si divide tra chi resta
    host(A, ''.join("E.act(g,%d,{a:'go'},Date.now());" % i for i in others))
    click(A, '[data-act=back]')
    A.wait_for_function('G().step === 2', timeout=10000)
    g = js(A, 'G()')
    t('Ale al campo: tasca e pepita per terra nella cassa', g['players'][a]['chest'] == 3 and not g['players'][a]['in'])
    t('chi resta si divide le 9 pepite in 3', all(g['players'][i]['carry'] == 5 for i in [b] + others))
    t('chi è al campo non ha i pulsanti', A.locator('[data-act=go]').count() == 0 and 'Sei al campo' in A.inner_text('.gv-me'))
    # il primo pericolo spaventa e basta, il secondo fa scappare
    host(A, ''.join("E.act(g,%d,{a:'go'},Date.now());" % i for i in others) + "E.act(g,%d,{a:'go'},Date.now())" % b)
    B.wait_for_function('G().step === 3', timeout=10000)
    t('una Frana: si vede tra i pericoli già visti', 'Frana' in B.inner_text('.mid-h') and B.locator('.gal.haz').count() == 1)
    host(A, ''.join("E.act(g,%d,{a:'go'},Date.now());" % i for i in others) + "E.act(g,%d,{a:'go'},Date.now())" % b)
    B.wait_for_function("G().phase === 'camp'", timeout=10000)
    t('ancora Frana: chi era dentro scappa a mani vuote', js(B, 'G().players[myIdx()].carry') == 0 and 'Frana' in B.inner_text('.camp-h') and B.locator('.cr.lost').count() == 3)
    B.screenshot(path=os.path.join(OUT, 'miniera-campo.png'))
    t('al campo: «Prossima spedizione»', B.locator('[data-act=next]').count() == 1)
    for P in (A, B): click(P, '[data-act=next]')
    host(A, "g.players.forEach(function(Q,i){if(i!==%d&&i!==%d)Q.ready=true});if(g.phase==='camp'&&g.players.every(function(Q){return Q.ready}))E.forceNext(g,Date.now())" % (a, b))
    A.wait_for_function('G().exp === 2 && G().phase === "choose"', timeout=10000)
    t('seconda spedizione: tutti di nuovo dentro', all(P['in'] for P in js(A, 'G().players')))
    # fine partita
    host(A, "g.exp=3;g.players[%d].chest=40;g.path=[{c:'g3',left:0}];g.players.forEach(function(Q){Q.carry=0;Q.ch=null});g.deck=['g4'];g.players.forEach(function(Q,i){E.act(g,i,{a:'back'},Date.now())});if(g.phase==='over')cur.phase='over'" % b)
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=10000)
    t('fine partita: vince chi ha più pepite', 'Hai vinto' in B.inner_text('.sh-over h2') and 'Bea' in A.inner_text('.sh-over h2'))
    t('l’host può rigiocare', A.locator('.sh-over [data-act=rematch]').count() == 1)
    br.close()
t('nessun errore nelle pagine', not errs, '; '.join(errs[:3]))
done()
