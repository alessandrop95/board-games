# gioco: sushigo
"""Sushi Go! nel browser, con due telefoni (Ale host e Bea) e un giocatore automatico: opzione del passaggio
delle mani, scelta segreta di una carta e cambio d'idea, carte scoperte tutte insieme sui vassoi, mani che
passano al vicino, Wasabi con il Nigiri sopra, Bacchette per prendere due carte, punti della manche
e fine della partita con i budini. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/sushigo/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('sg-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def idle(P): P.wait_for_function('Game.idle() && !document.querySelector(".flyer")', timeout=20000); P.wait_for_timeout(200)
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il nome e le regole in breve', 'Sushi Go!' in A.inner_text('h1') and 'Sashimi' in A.inner_text('.lobby'))
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    click(A, '[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === 3', timeout=10000)
    A.select_option('#opt-pass', 'alt'); B.wait_for_function("App.doc.opts.pass === 'alt'", timeout=10000)
    t('Bea vede l’opzione', 'a destra nella seconda manche' in B.inner_text('.lobby'))
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    t('9 carte a testa con 3 giocatori', all(len(P['hand']) == 9 for P in js(A, 'G()')['players']))
    idle(A)
    a = js(A, 'myIdx()'); b = js(B, 'myIdx()'); bot = 3 - a - b
    host(A, "g.players[%d].hand=['was','nsq','tem','tem','sas','sas','sas','cho','pud'];g.players[%d].hand=['dum','dum','dum','mk3','mk2','mk1','neg','nsa','pud'];g.players[%d].bot=false" % (a, b, bot))
    A.wait_for_function('G().players[myIdx()].hand[0] === "was"', timeout=10000); idle(A)
    t('vedo la mia mano', A.locator('.hcard').count() == 9 and 'Scegli una carta' in A.inner_text('#gv-prompt'))
    click(A, '.hcard[data-i="2"]'); click(A, '.hcard[data-i="0"]')
    t('tocco un’altra carta: cambia la scelta', A.locator('.hcard.sel').count() == 1 and js(A, 'App.sel[0]') == 0)
    A.screenshot(path=os.path.join(OUT, 'sushigo-mano.png'))
    click(A, '[data-act=dopick]'); A.wait_for_function('G().players[myIdx()].pick', timeout=10000)
    t('scelta fatta: aspetto gli altri', 'Aspetto' in A.inner_text('#gv-prompt') and len(js(A, 'G().players[myIdx()].hand')) == 9)
    B.wait_for_function('G().players[%d].pick' % a, timeout=10000)
    t('Bea vede che Ale ha scelto (ma non cosa)', 'scelto' in B.inner_text('.opp[data-p="%d"]' % a).lower())
    click(A, '[data-act=unpick]'); A.wait_for_function('!G().players[myIdx()].pick', timeout=10000)
    click(A, '.hcard[data-i="0"]'); click(A, '[data-act=dopick]'); A.wait_for_function('G().players[myIdx()].pick', timeout=10000)
    t('si può cambiare idea finché gli altri scelgono', True)
    click(B, '.hcard[data-i="0"]'); click(B, '[data-act=dopick]')
    host(A, "SGEngine.act(g,%d,{a:'pick',cards:[0]});g.players[%d].bot=true" % (bot, bot))   # il terzo sceglie dall'host
    A.wait_for_function('G().players[myIdx()].table.length === 1 && G().players[myIdx()].hand.length === 8', timeout=15000)
    t('tutti hanno scelto: le carte vanno sui vassoi', js(A, 'G().players[myIdx()].table[0].k') == 'was' and js(A, 'G().players[%d].table[0].k' % b) == 'dum')
    t('le mani passano a sinistra', js(A, 'G().players[%d].hand.indexOf("nsq")' % ((a + 1) % 3)) >= 0)
    idle(A)
    t('il mio vassoio mostra il Wasabi che aspetta un nigiri', A.locator('.tray.big .tg[data-k="was"]').count() == 1 and 'aspetta' in A.inner_text('.tray.big'))
    # Wasabi + calamaro, Bacchette
    host(A, "var P=g.players[%d];P.hand=['nsq','cho','tem','tem','sas','sas','pud','mk1'];P.pick=null;g.players.forEach(function(Q){Q.pick=null;Q.bot=true});P.bot=false;g.players[%d].bot=false" % (a, b))
    A.wait_for_function('G().players[myIdx()].hand[0] === "nsq"', timeout=10000); idle(A)
    click(A, '.hcard[data-i="0"]'); click(A, '[data-act=dopick]')
    click(B, '.hcard[data-i="0"]'); click(B, '[data-act=dopick]')
    A.wait_for_function('G().players[myIdx()].table[0].nig === "nsq"', timeout=15000)
    t('il calamaro va sul wasabi: 9 punti', js(A, 'SGEngine.partScore(G().players[myIdx()].table).nig') == 9)
    idle(A); A.screenshot(path=os.path.join(OUT, 'sushigo-wasabi.png'))
    host(A, "var P=g.players[%d];P.table.push({k:'cho'});P.hand=['sas','sas','tem','tem','pud','mk1','neg'];g.players.forEach(function(Q){Q.pick=null})" % a)
    A.wait_for_function('G().players[myIdx()].hand.length === 7 && G().players[myIdx()].table.length === 2', timeout=10000); idle(A)
    t('con le bacchette sul tavolo c’è il pulsante', A.locator('[data-act=cho]').count() == 1)
    click(A, '[data-act=cho]'); click(A, '.hcard[data-i="0"]'); click(A, '.hcard[data-i="1"]')
    t('due carte scelte', A.locator('.hcard.sel').count() == 2 and A.locator('[data-act=dopick]').count() == 1)
    click(A, '[data-act=dopick]'); click(B, '.hcard[data-i="0"]'); click(B, '[data-act=dopick]')
    A.wait_for_function('G().players[myIdx()].table.filter(function(c){return c.k==="sas"}).length === 2', timeout=15000)
    t('Bacchette: due sashimi insieme, le bacchette passano via', not js(A, 'G().players[myIdx()].table.some(function(c){return c.k==="cho"})'))
    # fine della manche e della partita
    host(A, "g.round=3;g.players.forEach(function(Q){Q.hand=[Q.hand[0]||'tem'];Q.pick=null});g.players[%d].hand=['pud'];g.players[%d].pud=2;g.players[%d].pud=0;g.players[%d].pud=1" % (a, a, b, bot))
    A.wait_for_function('G().players[myIdx()].hand.length === 1', timeout=10000); idle(A)
    click(A, '.hcard[data-i="0"]'); click(A, '[data-act=dopick]'); B.wait_for_function('G().players[myIdx()].hand.length === 1', timeout=10000); idle(B); click(B, '.hcard[data-i="0"]'); click(B, '[data-act=dopick]')
    for P in (A, B): P.wait_for_function("G().phase === 'over'", timeout=20000)
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=20000)
    rr = js(A, 'G().roundRes')
    t('budini a fine partita: +6 a chi ne ha di più, −6 a chi ne ha meno', rr['pudPts'][a] == 6 and rr['pudPts'][b] == -6, rr['pudPts'])
    t('classifica e budini nella schermata finale', 'Budini' in A.inner_text('.sh-over') and A.locator('.sh-over .pod').count() == 3)
    A.screenshot(path=os.path.join(OUT, 'sushigo-fine.png'))
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
