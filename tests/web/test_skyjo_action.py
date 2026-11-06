"""Skyjo Action e variante a eliminazione nel browser, con due telefoni (Ale host e Bea) e un giocatore automatico:
opzioni della sala d'attesa, stella scoperta che dà una carta Azione, fila delle Azioni, Scambio con i bersagli,
Pesca tre, Sbircia, Spazzata contro lo Scudo, Furto, penalità di +10 per le Azioni in mano, eliminazione a 100 punti
e vittoria dell'ultimo rimasto. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/skyjo/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('sk-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def idle(P): P.wait_for_function('Game.idle() && !document.querySelector(".flyer")', timeout=20000); P.wait_for_timeout(200)
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)
    def myturn(P, a, extra=''):
        host(P, "g.turn=%d;g.drawn=null;g.pick=null;g.chain=null;g.extra=0;g.hold=false;g.ender=null;g.players.forEach(function(Q){Q.bonus=0});g.turnN++;%s" % (a, extra))
        P.wait_for_function('G().turn === myIdx() && !G().drawn', timeout=10000); idle(P)
        P.wait_for_function('!document.querySelector(".played")', timeout=5000)

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    click(A, '[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === 3', timeout=10000)
    A.select_option('#opt-variant', 'action'); A.wait_for_function('App.doc.opts.action === true', timeout=10000)
    A.select_option('#opt-elim', '1'); B.wait_for_function('App.doc.opts.elim === true && App.doc.opts.action === true', timeout=10000)
    tx = B.inner_text('.lobby')
    t('Bea vede le varianti scelte', 'Skyjo Action' in tx and 'eliminazione' in tx, tx[:300])
    t('le regole delle varianti in sala d’attesa', 'stella' in tx and 'eliminato' in tx)
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    g = js(A, 'G()')
    t('Action: 120 carte, fila di 4 Azioni', g['opts']['action'] and len(g['deck']) == 120 - 36 - 1 and len([k for k in g['arow'] if k]) == 4 and len(g['adeck']) == 23)
    idle(A)
    t('la fila delle Azioni si vede', A.locator('.astrip .arc .skc.ac').count() == 4 and A.locator('.astrip .apile').count() == 1)
    t('in alto il nome della variante', 'Skyjo Action' in A.inner_text('#gv-info') and 'eliminazione' in A.inner_text('#gv-info'))
    a = js(A, 'myIdx()'); b = js(B, 'myIdx()'); bot = 3 - a - b
    # una stella scoperta all'inizio dà una carta Azione
    host(A, "g.players[%d].grid[0]={v:'*',up:false};g.players[%d].grid[5]={v:4,up:false}" % (a, a)); A.wait_for_timeout(400)
    click(A, '.board.big .slot[data-i="0"]'); A.wait_for_function('G().players[myIdx()].bonus === 1', timeout=10000); idle(A)
    t('stella scoperta: si sceglie una carta Azione', 'Una stella' in A.inner_text('#gv-prompt') and A.locator('.astrip.bonus .arc.can').count() == 4)
    A.screenshot(path=os.path.join(OUT, 'skyjo-action-stella.png'))
    k1 = js(A, 'G().arow[2]')
    click(A, '.arc[data-r="2"]'); A.wait_for_selector('.sh-acard', timeout=5000)
    t('la scheda spiega la carta', js(A, 'E.ACTS[%s][0]' % json.dumps(k1)) in A.inner_text('.sh-acard'))
    click(A, '.sh-acard [data-act=abonus]'); A.wait_for_function('G().players[myIdx()].acts.length === 1', timeout=10000)
    t('la carta va in mano e la fila si riempie', js(A, 'G().players[myIdx()].acts[0].k') == k1 and js(A, 'G().arow.every(Boolean)'))
    idle(A); t('la mia carta Azione si vede sotto la griglia', A.locator('.mine .ahand .achip').count() == 1 and '+10' in A.inner_text('.mine .ahand'))
    click(A, '.board.big .slot[data-i="5"]'); A.wait_for_function('E.flips(G().players[myIdx()]) === 2', timeout=10000)
    host(A, "var Q=g.players[%d];Q.grid[2].v=3;Q.grid[9].v=7" % b); B.wait_for_timeout(300)
    for i in (2, 9): click(B, '.board.big .slot[data-i="%d"]' % i); B.wait_for_timeout(300)
    A.wait_for_function("G().phase === 'play'", timeout=20000)
    t('Bea vede le carte Azione di Ale', B.locator('.opp[data-p="%d"] .achip-s' % a).count() == 1)

    # Scambio: una mia carta con una di Bea
    myturn(A, a, "var P=g.players[%d],Q=g.players[%d];P.acts=[{k:'exch',t:0}];P.grid[3]={v:12,up:true};Q.grid[4]={v:-2,up:true};g.players[%d].acts=[]" % (a, b, bot))
    t('nel mio turno la carta Azione si può giocare', A.locator('.mine .ahand .achip.ok').count() == 1)
    click(A, '.mine .ahand .achip'); A.wait_for_selector('.sh-acard [data-act=ause]', timeout=5000)
    click(A, '.sh-acard [data-act=ause]'); A.wait_for_selector('.sh-tgt', timeout=5000)
    t('si scelgono i bersagli tra tutte le griglie', A.locator('.sh-tgt .tb').count() == 3 and js(A, "document.querySelector('.sh-tgt [data-act=tgo]').disabled"))
    click(A, '.sh-tgt .slot[data-p="%d"][data-i="3"]' % a); click(A, '.sh-tgt .slot[data-p="%d"][data-i="4"]' % b)
    t('due carte scelte: si può scambiare', A.locator('.sh-tgt .slot.sel').count() == 2 and not js(A, "document.querySelector('.sh-tgt [data-act=tgo]').disabled"))
    A.screenshot(path=os.path.join(OUT, 'skyjo-action-bersagli.png'))
    click(A, '.sh-tgt [data-act=tgo]')
    A.wait_for_function('G().players[%d].grid[3].v === -2 && G().players[%d].grid[4].v === 12' % (a, b), timeout=10000)
    t('Scambio fatto: il −2 è mio, il 12 di Bea', js(A, 'G().turn') != a and js(A, 'G().adisc.indexOf("exch")') >= 0)
    B.wait_for_selector('.played', timeout=5000); t('Bea vede la carta giocata al centro', 'Scambio' in B.inner_text('.played'))
    B.screenshot(path=os.path.join(OUT, 'skyjo-action-giocata.png'))

    # Pesca tre
    myturn(A, a, "var P=g.players[%d];P.acts=[{k:'draw3',t:0}];P.grid[6]={v:11,up:true};g.deck.push(9,-1,5)" % a)
    click(A, '.mine .ahand .achip'); A.wait_for_selector('.sh-acard [data-act=ause]', timeout=5000); click(A, '.sh-acard [data-act=ause]')
    A.wait_for_function('G().pick', timeout=10000); idle(A)
    t('tre carte pescate al centro', A.locator('.pick3 .pk').count() == 3 and 'tenere' in A.inner_text('#gv-prompt'))
    click(A, '.pick3 .pk:nth-child(2)'); A.wait_for_function('App.pickC === 1', timeout=3000)
    A.screenshot(path=os.path.join(OUT, 'skyjo-action-pesca3.png'))
    click(A, '.board.big .slot[data-i="6"]'); A.wait_for_function('G().players[%d].grid[6].v === -1 && !G().pick' % a, timeout=10000)
    t('tengo il −1 al posto dell’11', js(A, 'G().disc.slice(-3).join()') == '5,9,11', js(A, 'G().disc.slice(-3).join()'))

    # Sbircia una colonna di Bea
    myturn(A, a, "g.players[%d].acts=[{k:'look',t:0}];var Q=g.players[%d];Q.grid[1]={v:8,up:false};Q.grid[5]={v:-2,up:false};Q.grid[9]={v:1,up:false}" % (a, b))
    click(A, '.mine .ahand .achip'); A.wait_for_selector('.sh-acard [data-act=ause]', timeout=5000); click(A, '.sh-acard [data-act=ause]'); A.wait_for_selector('.sh-tgt', timeout=5000)
    click(A, '.sh-tgt .slot[data-p="%d"][data-i="5"]' % b)
    t('si illumina tutta la colonna', A.locator('.sh-tgt .slot.sel').count() == 3)
    click(A, '.sh-tgt [data-act=tgo]'); A.wait_for_selector('.sh-peek', timeout=10000)
    t('vedo le carte sbirciate solo io', A.locator('.sh-peek .peekrow .skc').count() == 3 and B.locator('.sh-peek').count() == 0)
    click(A, '.sh-peek [data-act=close]'); idle(A)
    t('sulla griglia di Bea restano segnate per me', A.locator('.opp[data-p="%d"] .peek' % b).count() == 3 and B.locator('.peek').count() == 0)

    # Spazzata: il giocatore automatico ha lo Scudo
    myturn(A, a, "g.players[%d].acts=[{k:'rmall',t:0}];g.players[%d].acts=[{k:'prot',t:0}];var Q=g.players[%d];Q.grid[0]={v:-2,up:true}" % (a, bot, b))
    click(A, '.mine .ahand .achip'); A.wait_for_selector('.sh-acard [data-act=ause]', timeout=5000); click(A, '.sh-acard [data-act=ause]'); A.wait_for_selector('.sh-tgt', timeout=5000)
    t('chi ha lo Scudo è segnato', 'ha lo Scudo' in A.inner_text('.sh-tgt'))
    click(A, '.sh-tgt .slot[data-p="%d"][data-i="0"]' % b)
    t('basta una carta di Bea (lo Scudo protegge l’altro)', not js(A, "document.querySelector('.sh-tgt [data-act=tgo]').disabled"))
    click(A, '.sh-tgt [data-act=tgo]')
    A.wait_for_function('!G().players[%d].grid[0].up && G().players[%d].acts.length === 0' % (b, bot), timeout=10000)
    t('il −2 di Bea se ne va (al suo posto una coperta) e lo Scudo si consuma', js(A, 'G().disc[G().disc.length-1]') == -2)

    # Furto: Ale ruba «Doppio turno» a Bea e gioca altri due turni
    myturn(A, a, "g.players[%d].acts=[{k:'steal',t:0}];g.players[%d].acts=[{k:'two',t:0}]" % (a, b))
    click(A, '.mine .ahand .achip'); A.wait_for_selector('.sh-acard [data-act=ause]', timeout=5000); click(A, '.sh-acard [data-act=ause]'); A.wait_for_selector('.sh-tgt', timeout=5000)
    click(A, '.sh-tgt [data-act=tact][data-p="%d"]' % b); click(A, '.sh-tgt [data-act=tgo]')
    A.wait_for_function('G().players[%d].acts.length === 0 && G().turn === myIdx() && G().extra === 1' % b, timeout=10000)
    t('Furto: tocca ancora ad Ale per due turni', True)

    # stella pescata durante il gioco: si può rinunciare
    myturn(A, a, "g.players[%d].acts=[];g.deck.push('*')" % a)
    click(A, '[data-act=deck]'); A.wait_for_function('G().players[myIdx()].bonus === 1', timeout=10000); idle(A)
    t('stella pescata: prima la carta Azione', 'Una stella' in A.inner_text('#gv-prompt'))
    click(A, '[data-act=bonusskip]'); A.wait_for_function('G().players[myIdx()].bonus === 0', timeout=10000); idle(A)
    t('dopo la rinuncia si gioca la stella', 'stella' in A.inner_text('#gv-prompt'))
    click(A, '.board.big .slot[data-i="7"]'); A.wait_for_function('G().players[%d].grid[7].v === "*"' % a, timeout=10000)

    # fine manche: Bea arriva a 100 ed è eliminata; Ale ha una carta Azione in mano (+10)
    myturn(A, a, "var P=g.players[%d];P.acts=[{k:'look',t:0}];P.grid=[];for(var i=0;i<12;i++)P.grid.push({v:1,up:i<11});P.total=10;"
                 "var Q=g.players[%d];Q.total=95;Q.grid=[];for(var j=0;j<12;j++)Q.grid.push({v:(j+Math.floor(j/4))%%2?3:4,up:true});"
                 "var R=g.players[%d];R.total=20;R.grid=[];for(var k=0;k<12;k++)R.grid.push({v:k?0:2,up:true});g.deck.push(2)" % (a, b, bot))
    click(A, '[data-act=deck]'); A.wait_for_function('G().drawn', timeout=10000); idle(A)
    click(A, '[data-act=disc]'); click(A, '.board.big .slot[data-i="11"]')
    A.wait_for_function('G().ender === myIdx()', timeout=10000)
    t('dopo la chiusura le carte Azione non si giocano più', A.locator('.mine .ahand .achip.ok').count() == 0)
    B.wait_for_function("G().turn === myIdx() || G().phase !== 'play'", timeout=20000)
    if js(B, "G().phase") == 'play':
        idle(B); click(B, '[data-act=deck]'); B.wait_for_function('G().drawn', timeout=10000); idle(B); click(B, '.board.big .slot[data-i="0"]')
    for P in (A, B): P.wait_for_function("G().phase === 'scores'", timeout=40000)
    for P in (A, B): P.wait_for_selector('.sh-round', timeout=20000)
    rr = js(A, 'G().roundRes')
    t('carta Azione in mano: +10', rr['pen'][a] == 10 and 'azioni +10' in A.inner_text('.sh-round').lower(), rr)
    t('Bea arriva a 100 ed è eliminata', js(A, 'G().players[%d].out' % b) and 'eliminat' in B.inner_text('.sh-round'))
    B.screenshot(path=os.path.join(OUT, 'skyjo-elim-manche.png'))
    click(A, '.sh-round [data-act=next]')
    t('Bea non deve dare il via', B.locator('.sh-round [data-act=next]').count() == 0)
    A.wait_for_function("G().phase === 'reveal' && G().round === 2", timeout=15000)
    B.wait_for_function("G().round === 2", timeout=15000); idle(B)
    t('Bea guarda la partita da eliminata', 'eliminato' in B.inner_text('#gv-prompt') and B.locator('.mine.out').count() == 1)
    t('per gli altri Bea è spenta', A.locator('.opp.out[data-p="%d"]' % b).count() == 1 and js(A, 'G().players[%d].grid.length' % b) == 0)
    B.screenshot(path=os.path.join(OUT, 'skyjo-elim-fuori.png'))
    # anche il giocatore automatico arriva a 100: vince Ale, l'ultimo rimasto
    click(A, '.board.big .slot[data-i="0"]'); click(A, '.board.big .slot[data-i="1"]')
    A.wait_for_function("G().phase === 'play'", timeout=20000)
    myturn(A, a, "var P=g.players[%d];P.acts=[];P.grid=[];for(var i=0;i<12;i++)P.grid.push({v:0,up:i<11});"
                 "var R=g.players[%d];R.acts=[];R.total=98;R.grid=[];for(var k=0;k<12;k++)R.grid.push({v:5,up:true});g.deck.push(0)" % (a, bot))
    click(A, '[data-act=deck]'); A.wait_for_function('G().drawn', timeout=10000); idle(A)
    click(A, '[data-act=disc]'); click(A, '.board.big .slot[data-i="11"]')
    for P in (A, B): P.wait_for_function("G().phase === 'over'", timeout=40000)
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=20000)
    t('vince Ale, l’ultimo rimasto', js(A, 'G().winners') == [a] and 'Hai vinto' in A.inner_text('.sh-over') and 'ultimo rimasto' in A.inner_text('.sh-over'))
    t('classifica: Bea uscita per prima è ultima', js(A, 'G().final.place[%d]' % b) == 3 and js(A, 'G().final.place[%d]' % bot) == 2)
    A.screenshot(path=os.path.join(OUT, 'skyjo-elim-fine.png'))
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
