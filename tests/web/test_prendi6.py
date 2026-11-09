# gioco: prendi6
"""Prendi 6! nel browser, con due telefoni (Ale host e Bea) e un terzo giocatore: opzioni (fine a 33 teste,
mazzo tattico), scelta segreta di una carta e cambio d'idea, carte scoperte tutte insieme e messe in fila
dalla più bassa, sesta carta che fa prendere la fila, carta più bassa di tutte che fa scegliere una fila,
punti della manche e fine della partita. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/prendi6/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('p6-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def idle(P): P.wait_for_function('Game.idle() && !document.querySelector(".flyer")', timeout=20000); P.wait_for_timeout(200)
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il nome e le regole in breve', 'Prendi 6!' in A.inner_text('h1') and 'sesta' in A.inner_text('.lobby'))
    t('la barra in alto della home resta una riga semplice', A.evaluate("getComputedStyle(document.querySelector('.lobby > .row')).display") == 'flex')
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    click(A, '[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === 3', timeout=10000)
    A.select_option('#opt-target', '33'); B.wait_for_function('App.doc.opts.target === 33', timeout=10000)
    A.select_option('#opt-tactic', '1'); B.wait_for_function('App.doc.opts.tactic', timeout=10000)
    t('Bea vede le opzioni', '33 teste' in B.inner_text('.lobby') and 'tattica' in B.inner_text('.lobby'))
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    g = js(A, 'G()')
    t('10 carte a testa e 4 file', all(len(P['hand']) == 10 for P in g['players']) and len(g['rows']) == 4)
    allc = sum([P['hand'] for P in g['players']], []) + [r[0] for r in g['rows']]
    t('mazzo tattico: carte da 1 a 34, tutte in gioco', sorted(allc) == list(range(1, 35)), sorted(allc)[-3:])
    idle(A)
    a = js(A, 'myIdx()'); b = js(B, 'myIdx()'); bot = 3 - a - b
    host(A, "g.rows=[[3,4,5,6,7],[20],[30],[40]];g.players[%d].hand=[8,12,13,14,15,16,17,18,19,21];g.players[%d].hand=[1,22,23,24,25,26,27,28,29,31];g.players[%d].hand=[2,32,33,34,35,36,37,38,39,41];g.players[%d].bot=false" % (a, b, bot, bot))
    A.wait_for_function('G().players[myIdx()].hand[0] === 8', timeout=10000); idle(A)
    t('vedo la mia mano e le file', A.locator('.hcard').count() == 10 and A.locator('.frow').count() == 4 and 'Scegli' in A.inner_text('#gv-prompt'))
    t('l’8 andrebbe come sesta carta: c’è l’avviso', '6ª' in A.inner_text('.hcard[data-v="8"]'))
    click(A, '.hcard[data-v="12"]'); click(A, '.hcard[data-v="8"]')
    t('tocco un’altra carta: cambia la scelta', A.locator('.hcard.sel').count() == 1 and js(A, 'App.sel[0]') == 8)
    A.screenshot(path=os.path.join(OUT, 'prendi6-mano.png'))
    click(A, '[data-act=dopick]'); A.wait_for_function('G().players[myIdx()].pick === 8', timeout=10000)
    t('scelta fatta: aspetto gli altri', 'spett' in A.inner_text('#gv-prompt').lower())
    B.wait_for_function('G().players[%d].pick != null' % a, timeout=10000)
    t('Bea vede che Ale ha scelto (ma non cosa)', 'scelto' in B.inner_text('.opp[data-p="%d"]' % a).lower() and '8' not in B.inner_text('.opp[data-p="%d"]' % a))
    click(A, '[data-act=unpick]'); A.wait_for_function('G().players[myIdx()].pick == null', timeout=10000)
    click(A, '.hcard[data-v="8"]'); click(A, '[data-act=dopick]'); A.wait_for_function('G().players[myIdx()].pick === 8', timeout=10000)
    t('si può cambiare idea finché gli altri scelgono', True)
    click(B, '.hcard[data-v="22"]'); click(B, '[data-act=dopick]')
    host(A, "P6Engine.act(g,%d,{a:'pick',v:41})" % bot)
    A.wait_for_function('G().players[myIdx()].hand.length === 9 && G().phase === "pick"', timeout=15000)
    rows = js(A, 'G().rows')
    t('sesta carta: Ale prende la fila e l’8 resta da solo', rows[0] == [8] and sorted(js(A, 'G().players[myIdx()].pile')) == [3, 4, 5, 6, 7])
    t('le altre carte vanno in fila dalla più bassa', rows[1] == [20, 22] and rows[3] == [40, 41])
    t('teste di Ale: 1+1+2+1+1 = 6', js(A, 'P6Engine.sum(G().players[myIdx()].pile)') == 6)
    idle(A); A.screenshot(path=os.path.join(OUT, 'prendi6-file.png'))
    t('nella striscia in alto le teste prese', '6' in A.inner_text('.mine-h'))
    # carta più bassa di tutte: Bea sceglie la fila
    click(B, '.hcard[data-v="1"]'); click(B, '[data-act=dopick]')
    click(A, '.hcard[data-v="12"]'); click(A, '[data-act=dopick]')
    host(A, "P6Engine.act(g,%d,{a:'pick',v:32})" % bot)
    B.wait_for_function("G().phase === 'choose'", timeout=15000); idle(B)
    t('l’1 è più basso di tutte le file: Bea sceglie quale prendere', B.locator('.frow.pick').count() == 4 and 'fila' in B.inner_text('#gv-prompt').lower())
    t('Ale aspetta la scelta di Bea', A.locator('.frow.pick').count() == 0 and 'Bea' in A.inner_text('#gv-prompt'))
    B.screenshot(path=os.path.join(OUT, 'prendi6-scegli.png'))
    click(B, '.frow[data-r="0"]')
    A.wait_for_function("G().phase === 'pick' && G().players[%d].hand.length === 8" % a, timeout=15000)
    rows = js(A, 'G().rows')
    t('Bea prende la fila dell’8, l’1 apre la fila, poi si continua', js(A, 'G().players[%d].pile' % b) == [8] and rows[0] == [1, 12])
    # fine della manche e della partita
    idle(A); idle(B)
    host(A, "g.players.forEach(function(Q){Q.hand=[Q.hand[Q.hand.length-1]];Q.pick=null});g.players[%d].total=30;g.rows=[[1,12],[20,22,23,24,25],[30],[40,41]];g.players[%d].hand=[26];g.players[%d].hand=[50];g.players[%d].hand=[51]" % (a, a, b, bot))
    A.wait_for_function('G().players[myIdx()].hand.length === 1', timeout=10000); idle(A); B.wait_for_function('G().players[myIdx()].hand.length === 1', timeout=10000); idle(B)
    click(A, '.hcard[data-v="26"]'); click(A, '[data-act=dopick]'); click(B, '.hcard[data-v="50"]'); click(B, '[data-act=dopick]')
    host(A, "P6Engine.act(g,%d,{a:'pick',v:51})" % bot)
    for P in (A, B): P.wait_for_function("G().phase === 'over'", timeout=20000)
    t('Ale arriva a 33 teste o più: partita finita', js(A, 'G().players[myIdx()].total') >= 33)
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=20000)
    t('Ale non vince: la vittoria va a chi ha meno teste', a not in js(A, 'G().winners'))
    t('classifica nella schermata finale', A.locator('.sh-over .pod').count() == 3)
    A.screenshot(path=os.path.join(OUT, 'prendi6-fine.png'))
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
