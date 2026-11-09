# gioco: cabo
"""Cabo nel browser, con due telefoni (Ale host e Bea) e un giocatore automatico: opzioni della sala d'attesa,
le due carte iniziali viste solo da chi le guarda, pescare e scambiare, scartare più carte uguali (e sbagliare),
prendere dagli scarti, i poteri Sbircia, Spia e Scambia, la chiamata di Cabo, i punti della manche, la memoria
facile e la fine della partita. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/cabo/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('cb-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def idle(P): P.wait_for_function('Game.idle() && !document.querySelector(".flyer")', timeout=20000); P.wait_for_timeout(200)
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)
    def line(vals, up='false'): return '[' + ','.join('{id:%d,v:%d,up:%s}' % (900 + i * 7 + v, v, up) for i, v in enumerate(vals)) + ']'
    def myturn(P, a, extra=''):
        host(P, "g.turn=%d;g.drawn=null;g.power=null;g.caller=null;g.turnN++;%s" % (a, extra))
        P.wait_for_function('G().turn === myIdx() && !G().drawn && !G().power', timeout=10000); idle(P)

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il nome e le regole in breve', 'Cabo' in A.inner_text('h1') and 'Cabo' in A.inner_text('.lobby'))
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    click(A, '[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === 3', timeout=10000)
    t('opzioni: memoria classica e soglia 100', js(A, 'App.doc.opts.memo') == 'classic' and js(A, 'App.doc.opts.target') == 100)
    A.select_option('#opt-target', '50'); B.wait_for_function('App.doc.opts.target === 50', timeout=10000)
    t('Bea vede le opzioni', '50 punti' in B.inner_text('.lobby') and 'classica' in B.inner_text('.lobby'))
    A.select_option('#opt-target', '100'); A.wait_for_function('App.doc.opts.target === 100', timeout=10000)
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    g = js(A, 'G()')
    t('4 carte coperte a testa, uno scarto', all(len(P['line']) == 4 for P in g['players']) and len(g['disc']) == 1 and g['phase'] == 'peek')
    idle(A)
    a = js(A, 'myIdx()'); b = js(B, 'myIdx()'); bot = 3 - a - b
    t('si guardano due carte', 'Guarda 2' in A.inner_text('#gv-prompt') and A.locator('.board.big .slot.can').count() == 4)
    v1 = js(A, 'G().players[myIdx()].line[1].v')
    click(A, '.board.big .slot[data-i="1"]'); A.wait_for_function('G().players[myIdx()].looks === 1', timeout=10000); A.wait_for_timeout(500)
    t('la carta guardata si vede solo sul mio telefono', A.locator('.board.big .slot[data-i="1"] .skc.up.secret').count() == 1 and B.locator('.opp[data-p="%d"] .slot[data-i="1"] .skc.up' % a).count() == 0)
    A.screenshot(path=os.path.join(OUT, 'cabo-guardo.png'))
    click(A, '.board.big .slot[data-i="2"]'); A.wait_for_function('G().players[myIdx()].looks === 2', timeout=10000)
    A.wait_for_function('!document.querySelector(".board.big .skc.secret")', timeout=12000)
    t('dopo qualche secondo torna coperta, con l’occhio', A.locator('.board.big .slot[data-i="1"] .skc.up').count() == 0 and A.locator('.board.big .slot[data-i="1"] .peek.eye').count() == 1)
    for i in (0, 3): click(B, '.board.big .slot[data-i="%d"]' % i); B.wait_for_timeout(300)
    A.wait_for_function("G().phase === 'play'", timeout=20000)

    # pescare e tenere una carta
    myturn(A, a, "g.players[%d].line=%s;g.deck.push({id:990,v:2})" % (a, line([9, 3, 5, 12])))
    t('nel mio turno c’è il pulsante Cabo', A.locator('.cabobtn').count() == 1 and B.locator('.cabobtn').count() == 0)
    click(A, '[data-act=deck]'); A.wait_for_function('G().drawn', timeout=10000); idle(A)
    t('vedo la carta pescata, Bea no', A.locator('#hand .skc.up').count() == 1 and B.locator('#hand .skc.up').count() == 0)
    click(A, '.board.big .slot[data-i="3"]'); A.wait_for_timeout(200)
    t('scelgo la carta da sostituire', A.locator('.board.big .slot.sel').count() == 1 and A.locator('[data-act=doswap]').count() == 1)
    click(A, '[data-act=doswap]'); A.wait_for_function('G().players[%d].line[3].v === 2 && G().turn !== %d' % (a, a), timeout=10000)
    t('il 12 va negli scarti', js(A, 'G().disc[G().disc.length-1].v') == 12)
    # due carte uguali insieme
    myturn(A, a, "g.players[%d].line=%s;g.deck.push({id:991,v:1})" % (a, line([7, 4, 7, 10])))
    click(A, '[data-act=deck]'); A.wait_for_function('G().drawn', timeout=10000); idle(A)
    click(A, '.board.big .slot[data-i="0"]'); click(A, '.board.big .slot[data-i="2"]')
    t('Scambia (2)', 'Scambia (2)' in A.inner_text('#gv-prompt'))
    click(A, '[data-act=doswap]'); A.wait_for_function('G().players[%d].line.length === 3' % a, timeout=10000)
    t('due 7 insieme: una carta in meno', js(A, 'G().players[%d].line.map(function(c){return c.v}).join()' % a) == '1,4,10')
    # tentativo sbagliato
    myturn(A, a, "g.players[%d].line=%s;g.deck.push({id:992,v:0})" % (a, line([7, 4, 8, 10])))
    click(A, '[data-act=deck]'); A.wait_for_function('G().drawn', timeout=10000); idle(A)
    click(A, '.board.big .slot[data-i="0"]'); click(A, '.board.big .slot[data-i="2"]'); click(A, '[data-act=doswap]')
    A.wait_for_function('G().players[%d].line.length === 5' % a, timeout=10000)
    t('non uguali: restano scoperte e la carta va in fondo', js(A, 'G().players[%d].line[0].up && G().players[%d].line[2].up' % (a, a)))
    idle(A); A.screenshot(path=os.path.join(OUT, 'cabo-sbagliato.png'))
    # prendere dagli scarti
    myturn(A, a, "g.players[%d].line=%s;g.disc.push({id:993,v:0})" % (a, line([9, 3, 5, 12])))
    click(A, '[data-act=disc]'); idle(A)
    t('tocco gli scarti: scelgo dove metterlo', 'Prendi il <b>0</b>' in js(A, "document.getElementById('gv-prompt').innerHTML") or 'Prendi il 0' in A.inner_text('#gv-prompt'))
    click(A, '.board.big .slot[data-i="0"]'); click(A, '[data-act=doswap]')
    A.wait_for_function('G().players[%d].line[0].v === 0 && G().players[%d].line[0].up' % (a, a), timeout=10000)
    t('lo 0 preso dagli scarti resta scoperto', True)
    # Sbircia
    myturn(A, a, "g.players[%d].line=%s;g.deck.push({id:994,v:8})" % (a, line([9, 3, 5, 12])))
    click(A, '[data-act=deck]'); A.wait_for_function('G().drawn', timeout=10000); idle(A)
    click(A, '[data-act=disc]'); A.wait_for_function('G().power && G().power.k === "peek"', timeout=10000); idle(A)
    t('scarto l’8: posso sbirciare', 'Sbircia' in A.inner_text('#gv-prompt'))
    click(A, '.board.big .slot[data-i="3"]'); A.wait_for_function('!G().power', timeout=10000); A.wait_for_timeout(500)
    t('vedo la mia carta per qualche secondo', A.locator('.board.big .slot[data-i="3"] .skc.up.secret').count() == 1)
    # Spia
    myturn(A, a, "g.deck.push({id:995,v:10});g.players[%d].line=%s" % (b, line([6, 6, 2, 11])))
    click(A, '[data-act=deck]'); A.wait_for_function('G().drawn', timeout=10000); idle(A)
    click(A, '[data-act=disc]'); A.wait_for_selector('.sh-power', timeout=10000)
    t('Spia: si sceglie la carta di un altro', A.locator('.sh-power .tb').count() == 2)
    click(A, '.sh-power [data-act=pcell][data-p="%d"][data-i="2"]' % b); click(A, '.sh-power [data-act=pgo]')
    A.wait_for_function('!G().power', timeout=10000); A.wait_for_timeout(600)
    t('vedo la carta di Bea solo io', A.locator('.opp[data-p="%d"] .slot[data-i="2"] .skc.up.secret' % b).count() == 1 and js(A, 'G().players[myIdx()].know[%d]' % (900 + 14 + 2)) == 1)
    A.screenshot(path=os.path.join(OUT, 'cabo-spia.png'))
    # Scambia
    myturn(A, a, "g.deck.push({id:996,v:12});g.players[%d].line=%s;g.players[%d].line=%s" % (a, line([13, 3, 5, 6]), b, line([0, 6, 2, 11])))
    click(A, '[data-act=deck]'); A.wait_for_function('G().drawn', timeout=10000); idle(A)
    click(A, '[data-act=disc]'); A.wait_for_selector('.sh-power', timeout=10000)
    click(A, '.sh-power [data-act=pcell][data-p="%d"][data-i="0"]' % a); click(A, '.sh-power [data-act=pcell][data-p="%d"][data-i="0"]' % b)
    A.screenshot(path=os.path.join(OUT, 'cabo-scambia.png'))
    click(A, '.sh-power [data-act=pgo]')
    A.wait_for_function('G().players[%d].line[0].v === 0 && G().players[%d].line[0].v === 13' % (a, b), timeout=10000)
    t('Scambia: il mio 13 a Bea, il suo 0 a me', True)
    # Cabo
    myturn(A, a, "g.players[%d].line=%s;g.players[%d].line=%s;g.players[%d].line=%s;g.players[%d].total=0;g.players[%d].total=0;g.players[%d].total=0" % (a, line([0, 1, 2]), b, line([5, 5, 5, 5]), bot, line([9, 9, 9, 9]), a, b, bot))
    click(A, '[data-act=cabo]'); A.wait_for_function('G().caller === myIdx()', timeout=10000)
    B.wait_for_selector('.lastbar', timeout=10000); t('per gli altri è l’ultimo giro', 'Cabo' in B.inner_text('.lastbar'))
    for k in range(4):
        B.wait_for_function("G().turn === myIdx() || G().phase !== 'play'", timeout=20000)
        if js(B, 'G().phase') != 'play': break
        idle(B); click(B, '[data-act=deck]'); B.wait_for_function('G().drawn', timeout=10000); idle(B); click(B, '[data-act=disc]')
        B.wait_for_function('!G().drawn', timeout=10000)
        if js(B, 'G().power'): B.wait_for_selector('[data-act=pskip]', timeout=10000); click(B, '[data-act=pskip]')
    for P in (A, B): P.wait_for_function("G().phase === 'scores'", timeout=40000)
    for P in (A, B): P.wait_for_selector('.sh-round', timeout=20000)
    rr = js(A, 'G().roundRes')
    t('Cabo riuscito: 0 punti per Ale', rr['callerOk'] and rr['pts'][a] == 0 and 'cabo riuscito' in A.inner_text('.sh-round').lower(), rr)
    t('alla fine tutte le carte scoperte', js(A, 'G().players.every(function(P){return P.line.every(function(c){return c.up})})'))
    A.screenshot(path=os.path.join(OUT, 'cabo-manche.png'))
    click(A, '.sh-round [data-act=next]'); click(B, '.sh-round [data-act=next]')
    A.wait_for_function("G().round === 2 && G().phase === 'peek'", timeout=15000)
    # memoria facile: il valore delle carte che conosco resta scritto
    host(A, "g.opts.memo='easy'")
    click(A, '.board.big .slot[data-i="0"]'); A.wait_for_function('G().players[myIdx()].looks === 1', timeout=10000)
    A.wait_for_function('!document.querySelector(\'.board.big .slot[data-i="0"] .skc.secret\') && Game.idle()', timeout=12000)
    t('memoria facile: il valore resta segnato', A.locator('.board.big .slot[data-i="0"] .peek:not(.eye)').count() == 1, [js(A, 'G().opts.memo'), A.inner_html('.board.big .slot[data-i="0"]')[-300:]])
    # fine partita
    click(A, '.board.big .slot[data-i="1"]')
    for i in (0, 1): click(B, '.board.big .slot[data-i="%d"]' % i); B.wait_for_timeout(250)
    A.wait_for_function("G().phase === 'play'", timeout=20000)
    myturn(A, a, "g.players[%d].line=%s;g.players[%d].total=98;g.players[%d].line=%s;g.players[%d].total=10;g.players[%d].line=%s;g.players[%d].total=20;g.deck.length=1" % (a, line([3, 3]), a, b, line([1]), b, bot, line([2]), bot))
    click(A, '[data-act=deck]'); A.wait_for_function('G().drawn', timeout=10000); idle(A); click(A, '[data-act=disc]')
    A.wait_for_function('G().power || G().phase !== "play"', timeout=10000)
    if js(A, 'G().power'): A.wait_for_selector('[data-act=pskip]', timeout=10000); click(A, '[data-act=pskip]')
    for P in (A, B): P.wait_for_function("G().phase === 'over'", timeout=40000)
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=20000)
    t('Ale supera 100: vince Bea', js(A, 'G().winners') == [b] and 'Hai vinto' in B.inner_text('.sh-over') and 'superato' in A.inner_text('.sh-over'))
    B.screenshot(path=os.path.join(OUT, 'cabo-fine.png'))
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
