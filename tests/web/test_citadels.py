"""Citadels nel browser con due telefoni (Ale host e Bea) e giocatori automatici: posti riempiti fino a 4,
scelta segreta dei personaggi (la finestra si apre da sola, gli altri non vedono la scelta), riga «Adesso» che spiega
cosa succede, Assassino che uccide, Ladro che deruba, risorse, costruzione, avviso di fine turno, Mago, Condottiero,
fine della partita con la classifica voce per voce.
Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/citadels/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('cd-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def idle(P): P.wait_for_function('Game.idle() && !document.querySelector(".flyer,.reveal")', timeout=30000); P.wait_for_timeout(250)
    def now(P): return P.inner_text('#gv-now')
    # turni truccati: personaggi dati, i bot restano fermi (li muove il test)
    def turns(chars, extra=''):
        js(A, """Net.hostApply(function(cur){var g=cur.game, ch=%s; g.players.forEach(function(P,i){P.char=ch[i]; P.away=false;});
          g.phase='turns'; g.call=0; g.killed=null; g.robbed=null; g.revealed={}; g.pick.up=[]; g.pick.i=g.players.length; %s; E._next(g); g.seq++; cur.phase='play'; return true})""" % (json.dumps(chars), extra))

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(1000)
    t('home del gioco', 'Citadels' in A.inner_text('h1') and A.locator('.hero-art .ctc').count() == 5)
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    t('in sala d’attesa si spiega che arriveranno 2 automatici', 'arriveranno 2' in A.inner_text('.lobby'))
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    t('i posti mancanti sono riempiti fino a 4', js(A, 'G().players.length') == 4 and js(A, 'G().players[2].bot && G().players[3].bot'))
    js(A, 'window.driveBots = function () {}')   # i bot li muove il test
    t('2 oro e 4 carte a testa', js(A, 'G().players.every(function(P){return P.gold===2 && P.hand.length===4})'))
    t('la corte mostra gli 8 personaggi', A.locator('.ctk').count() == 8)

    # ---------- scelta dei personaggi: Ale ha la corona ----------
    js(A, "Net.hostApply(function(cur){var g=cur.game; g.crown=0; g.round--; E.startRound(g); g.seq++; return true})")
    A.wait_for_function("G().phase==='pick' && E.decider(G())===0", timeout=10000); idle(A)
    A.wait_for_selector('.sh-pick', timeout=15000)
    t('la finestra di scelta si apre da sola', A.locator('.sh-pick .pk').count() == 5)
    t('4 giocatori: 2 personaggi scartati scoperti e spiegati', js(A, 'G().pick.up.length') == 2 and 'Scartati scoperti' in A.inner_text('.sh-pick'))
    t('ogni personaggio dice cosa renderebbe', A.locator('.sh-pick .pk-h').count() == 5)
    B.wait_for_function("G().phase==='pick'", timeout=10000); idle(B)
    t('Bea legge che Ale sta scegliendo e quando toccherà a lei', 'Ale sta scegliendo' in now(B) and 'subito dopo' in now(B))
    A.screenshot(path=os.path.join(OUT, 'citadels-scelta.png'))
    pick = js(A, 'E.choices(G())[0]'); name = js(A, 'E.CH[%d].n' % pick)
    click(A, '.pk[data-r="%d"]' % pick)
    B.wait_for_function('E.decider(G())===1', timeout=10000); B.wait_for_selector('.sh-pick', timeout=15000)
    t('Ale ha scelto: tocca a Bea, con la sua finestra', js(B, 'E.choices(G()).indexOf(%d)' % pick) < 0)
    t('Ale vede il suo personaggio segreto', name in A.inner_text('.mych'))
    t('Bea non vede quale personaggio ha preso Ale', name not in B.inner_text('.opp[data-p="0"]') and B.locator('.opp[data-p="0"] .cb.hid').count() == 1)

    # ---------- Ale Assassino, Bea Ladro, bot Re e Mercante ----------
    turns([1, 2, 4, 6], "g.players[0].gold=6; g.players[3].gold=5")
    A.wait_for_function("G().turn && G().turn.p===0", timeout=10000); idle(A); B.wait_for_function("G().turn && G().turn.p===0", timeout=10000); idle(B)
    t('«Adesso»: Ale sa che tocca a lui e cosa fare', 'Tocca a te' in now(A) and 'Uccidi' in now(A))
    t('Bea legge di chi è il turno', 'Assassino' in now(B) and 'Ale' in now(B) and 'Ladro' in now(B))
    t('la corte illumina il personaggio di turno', B.locator('.ctk.s-now[data-r="1"]').count() == 1)
    A.screenshot(path=os.path.join(OUT, 'citadels-assassino.png'))
    click(A, '[data-act=pw][data-k=kill]'); A.wait_for_selector('.sh-kill', timeout=5000)
    t('l’Assassino sceglie tra i personaggi dal 2 all’8', A.locator('.tg-c').count() == 7)
    click(A, '.tg-c[data-r="6"]'); A.wait_for_function('G().killed===6', timeout=10000)
    B.wait_for_function('G().killed===6', timeout=10000); idle(B)
    t('Bea vede il pugnale sul Mercante', B.locator('.ctk[data-r="6"] .mk.kill').count() == 1)
    click(A, '[data-act=gold]'); A.wait_for_function('G().turn.gathered', timeout=10000); idle(A)
    t('dopo le risorse si spiega come costruire', 'Costruisci' in now(A) and ('illuminata' in now(A) or 'oro' in now(A)))
    js(A, "Net.hostApply(function(cur){var g=cur.game,P=g.players[0]; var id=E.DIST.filter(function(d){return d.n==='Chiesa'})[0].id; var k=g.deck.indexOf(id); if(k>=0){g.deck.splice(k,1);} else {g.players.forEach(function(Q){[Q.hand,Q.city].forEach(function(L){var j=L.indexOf(id); if(j>=0) L.splice(j,1);});});} P.hand.push(id); g.seq++; return true})")
    A.wait_for_function("G().players[0].hand.some(function(id){return E.D(id).n==='Chiesa'})", timeout=10000); idle(A)
    church = js(A, "G().players[0].hand.filter(function(id){return E.D(id).n==='Chiesa'})[0]")
    t('le carte che si possono pagare si illuminano', A.locator('.hand .hc.can[data-id="%d"]' % church).count() == 1)
    click(A, '.hand .hc[data-id="%d"]' % church); A.wait_for_selector('.sh-card [data-act=build]', timeout=5000)
    click(A, '.sh-card [data-act=build]'); A.wait_for_function('G().players[0].city.length===1', timeout=10000)
    B.wait_for_function('G().players[0].city.length===1', timeout=10000); idle(B)
    t('costruita la Chiesa: Bea la vede nella città di Ale', B.locator('.opp[data-p="0"] .pip.t-r').count() == 1 and js(B, 'G().players[0].gold') == 6)
    click(A, '[data-act=endturn]'); A.wait_for_function('G().turn.p===1', timeout=10000)
    t('fine turno: si chiama il Ladro (Bea)', js(A, 'G().turn.r') == 2)

    # ---------- Bea Ladro ----------
    B.wait_for_function('G().turn.p===1', timeout=10000); idle(B)
    click(B, '[data-act=pw][data-k=rob]'); B.wait_for_selector('.sh-rob', timeout=5000)
    t('il Ladro non può derubare il personaggio ucciso', B.locator('.tg-c.off[data-r="6"]').count() == 1)
    click(B, '.tg-c[data-r="4"]'); B.wait_for_function('G().robbed===4', timeout=10000)
    click(B, '[data-act=draw]'); B.wait_for_function('G().turn.drawn', timeout=10000)
    B.wait_for_selector('.sh-keep', timeout=15000)
    t('pescate 2 carte: si sceglie quale tenere', B.locator('.kp-c').count() == 2)
    click(B, '.kp-c'); B.wait_for_function('!G().turn.drawn && G().players[1].hand.length===5', timeout=10000); idle(B)
    js(B, "App.sheet=null; renderSheet()")
    click(B, '[data-act=endturn]')
    B.wait_for_timeout(400)
    if js(B, "App.sheet && App.sheet.kind==='endconfirm'"):
        t('avviso: puoi ancora costruire', 'costruire' in B.inner_text('.sh-endconfirm')); click(B, '[data-act=endyes]')
    A.wait_for_function('G().turn && G().turn.r===4', timeout=10000)
    js(A, "Net.hostApply(function(cur){var g=cur.game; E.act(g,2,{a:'gold'}); g.seq++; return true})")
    A.wait_for_function('G().turn.gathered', timeout=10000)
    t('il Re rivelato è stato derubato dal Ladro', js(A, 'G().players[2].gold') == 2 and js(A, 'G().players[1].gold') >= 4)
    js(A, "Net.hostApply(function(cur){var g=cur.game; E.act(g,2,{a:'end'}); g.seq++; return true})")
    A.wait_for_function("G().phase==='pick'", timeout=10000)
    t('il Mercante ucciso salta il turno: nuovo round', js(A, 'G().round') == 2 and js(A, 'G().crown') == 2)
    B.wait_for_function("G().phase==='pick'", timeout=10000); idle(B)

    # ---------- Ale Mago e Condottiero ----------
    turns([3, 5, 7, 8], "g.players[1].hand.push(g.deck.pop(), g.deck.pop())")
    A.wait_for_function("G().turn && G().turn.p===0 && G().turn.r===3", timeout=10000); idle(A)
    click(A, '[data-act=pw][data-k=magic]'); A.wait_for_selector('.sh-magic', timeout=5000)
    t('il Mago può scambiare con tutti o ripescare', A.locator('.sw-p').count() == 3 and A.locator('.selhand .sh').count() == js(A, 'G().players[0].hand.length'))
    nb = js(A, 'G().players[1].hand.length')
    click(A, '.sw-p[data-t="1"]'); A.wait_for_function('G().players[0].hand.length===%d' % nb, timeout=10000)
    t('mani scambiate con Bea', True)
    click(A, '[data-act=gold]'); A.wait_for_function('G().turn.gathered', timeout=10000)
    js(A, "App.sheet=null; renderSheet()")
    js(A, "Net.hostApply(function(cur){var g=cur.game; E.act(g,0,{a:'end'}); g.seq++; return true})")
    # Vescovo (Bea), Architetto (bot) passano
    for r in (5, 7):
        A.wait_for_function('G().turn && G().turn.r===%d' % r, timeout=10000)
        js(A, "Net.hostApply(function(cur){var g=cur.game,p=g.turn.p; E.act(g,p,{a:'gold'}); E.act(g,p,{a:'end'}); g.seq++; return true})")
    turns([8, 1, 2, 3], "g.players[0].gold=9; g.players[2].city=[g.deck.pop(),g.deck.pop()]; g.call=7")
    A.wait_for_function("G().turn && G().turn.p===0 && G().turn.r===8", timeout=10000); idle(A)
    click(A, '[data-act=gold]'); A.wait_for_function('G().turn.gathered', timeout=10000); idle(A)
    click(A, '[data-act=pw][data-k=destroy]'); A.wait_for_selector('.sh-destroy', timeout=5000)
    victim = js(A, 'G().players[2].city[0]')
    click(A, '.dc[data-t="2"][data-id="%d"]' % victim); A.wait_for_selector('.sh-destroy [data-act=destroy]', timeout=5000)
    A.screenshot(path=os.path.join(OUT, 'citadels-condottiero.png'))
    click(A, '.sh-destroy [data-act=destroy]'); A.wait_for_function('G().players[2].city.length===1', timeout=10000)
    t('il Condottiero distrugge pagando 1 oro in meno', js(A, 'G().players[0].gold') == 11 - max(0, js(A, 'E.D(%d).c' % victim) - 1))

    # ---------- fine partita ----------
    js(A, "Net.hostApply(function(cur){var g=cur.game; g.players.forEach(function(P,i){while(P.city.length<3+i) P.city.push(g.deck.pop());}); g.first=3; E._endGame(g); cur.phase='over'; g.seq++; return true})")
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=20000)
    t('classifica con i punti voce per voce', B.locator('.fs tr').count() == 5 and 'Quartieri' in B.inner_text('.sh-over'))
    t('vince chi ha più punti', js(B, 'G().winners[0] === G().final.order[0]'))
    B.wait_for_timeout(2500); B.screenshot(path=os.path.join(OUT, 'citadels-fine.png'))
    t('«Adesso» dice chi ha vinto', 'Vince' in now(B) or 'Hai vinto' in now(B))
    t('nessun errore nella pagina', not errs, errs)
    br.close()
done()
