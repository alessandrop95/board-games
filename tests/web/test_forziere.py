# gioco: forziere
"""Il Forziere Maledetto nel browser, con due telefoni (Ale host e Bea) e tre giocatori automatici: sala d'attesa
(servono 4 giocatori), ruoli segreti visti solo dal proprio telefono, una Bordata giocata dalla mano scegliendo il
bersaglio, la risposta fuori turno con una Virata, la scelta della nave, il Vascello spettrale, lo scarto a fine
turno e la fine della partita. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/forziere/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
# sposta una carta (per tipo) nella mano di un giocatore, ovunque si trovi
GIVE = """function idOf(t,k){var n=0;for(var i=0;i<E.CARDS.length;i++)if(E.CARDS[i].t===t&&n++===(k||0))return i;return -1}
function give(p,t,k){var id=idOf(t,k);[g.deck,g.disc].forEach(function(a){var i=a.indexOf(id);if(i>=0)a.splice(i,1)});g.players.forEach(function(P){[P.hand,P.eq].forEach(function(a){var i=a.indexOf(id);if(i>=0)a.splice(i,1)})});g.players[p].hand.push(id);return id}
function clear(p){var P=g.players[p];while(P.hand.length)g.disc.push(P.hand.pop())}"""
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('fz-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def idle(P): P.wait_for_function('Game.idle()', timeout=20000); P.wait_for_timeout(200)
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;%s;g.seq++;return true})" % (GIVE, code))
    def turn_of(P, who, extra=''):
        host(P, "g.turn=%d;g.step='play';g.pend=null;g.shots=0;g.spectre=null;g.gorgo=null;g.players.forEach(function(Q){Q.bot=false});%s" % (who, extra))

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il titolo e le regole in breve', 'Forziere' in A.inner_text('h1') and 'Levante' in A.inner_text('.lobby'))
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 2', timeout=10000)
    t('in 2 non si parte: servono 4 giocatori', A.locator('[data-act=start][disabled]').count() == 1 and 'almeno 4' in A.inner_text('.lobby'))
    for i in range(3): click(A, '[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === %d' % (3 + i), timeout=10000)
    t('in 5: il Pirata è in gioco', 'Pirata' in A.inner_text('.lobby'))
    A.select_option('#opt-timer', '0'); A.wait_for_function('App.doc.opts.timer === 0', timeout=10000)   # nessuno passa in automatico durante la prova
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('#gv', timeout=15000)
    # i bot restano fermi: le mosse le decide la prova
    host(A, "g.players.forEach(function(Q){Q.bot=false})")
    idle(A)
    a = js(A, 'myIdx()'); b = js(B, 'myIdx()')
    g = js(A, 'G()')
    t('5 capitani, ognuno con la sua nave e i barili', len(g['players']) == 5 and all(P['ship'] is not None and P['bar'] > 0 for P in g['players']))
    ra, rb = g['players'][a]['role'], g['players'][b]['role']
    names = {'AL': 'Ammiraglio di Levante', 'AP': 'Ammiraglio di Ponente', 'UL': 'Ufficiale di Levante', 'UP': 'Ufficiale di Ponente', 'PI': 'Pirata'}
    t('ognuno vede il proprio ruolo', names[ra] in A.inner_text('.mrole') and names[rb] in B.inner_text('.mrole'))
    hidden_b = ra != 'AL' and rb != 'AL'
    if hidden_b:
        t('il ruolo di Bea è segreto sul telefono di Ale', A.locator('.opp[data-p="%d"] .rb.unk' % b).count() == 1)
    al = [i for i, P in enumerate(g['players']) if P['role'] == 'AL'][0]
    if al != a: t('l’Ammiraglio di Levante è scoperto per tutti', A.locator('.opp[data-p="%d"] .rb.r-AL' % al).count() == 1)
    A.screenshot(path=os.path.join(OUT, 'forziere-tavolo.png'))

    # una Bordata dalla mano, scegliendo il bersaglio: Bea non ha difese
    turn_of(A, a, "clear(%d);clear(%d);g.players[%d].ship=4;g.players[%d].eq=[];g.players[%d].eq=[];g.players[%d].cap=1;g.players[%d].cap=5;give(%d,'bordata',0);g.players[%d].bar=3" % (a, b, a, a, b, a, b, a, b))
    A.wait_for_function('G().turn === myIdx() && G().step === "play"', timeout=10000); idle(A)
    t('nel mio turno: Fine turno e la Bordata giocabile', A.locator('[data-act=end]').count() == 1 and A.locator('.hand .hc.can').count() == 1)
    click(A, '.hand .hc'); A.wait_for_selector('.sh-card .tgtb', timeout=5000)
    t('la carta mostra chi si può colpire', A.locator('.sh-card .tgtb[data-p="%d"]' % b).count() == 1)
    click(A, '.sh-card .tgtb[data-p="%d"]' % b)
    B.wait_for_function('G().players[myIdx()].bar === 2', timeout=10000)
    t('Bea perde un barile', js(B, 'G().players[myIdx()].bar') == 2 and 'Bordata' in js(A, "G().log.slice(-3).map(function(l){return l.t}).join(' ')"))

    # risposta fuori turno: Bea ha una Virata
    host(A, "g.shots=0;give(%d,'bordata',1);give(%d,'virata',0)" % (a, b))
    A.wait_for_function('G().players[myIdx()].hand.length === 1', timeout=10000); idle(A)
    click(A, '.hand .hc'); A.wait_for_selector('.sh-card .tgtb', timeout=5000); click(A, '.sh-card .tgtb[data-p="%d"]' % b)
    B.wait_for_selector('.sh-resp [data-act=resp]', timeout=10000)
    t('Bea deve rispondere: le viene proposta la Virata', 'colpo' in B.inner_text('.sh-resp') and B.locator('.sh-resp [data-act=resp]').count() == 1)
    t('Ale aspetta la risposta di Bea', 'deve rispondere' in A.inner_text('#gv-prompt'))
    B.screenshot(path=os.path.join(OUT, 'forziere-risposta.png'))
    click(B, '.sh-resp [data-act=resp]')
    A.wait_for_function('!G().pend', timeout=10000)
    t('la Virata evita il colpo', js(B, 'G().players[myIdx()].bar') == 2 and 'evita' in js(A, "G().log.slice(-3).map(function(l){return l.t}).join(' ')"))

    # fine turno con più di 5 carte: si scelgono quelle da scartare
    host(A, "clear(%d);['rum','rum','rum','rum','rum','vedetta','vedetta'].forEach(function(t,i){give(%d,t,i<5?i:i-5)})" % (a, a))
    A.wait_for_function('G().players[myIdx()].hand.length === 7', timeout=10000); idle(A)
    click(A, '[data-act=end]')
    t('si devono scartare 2 carte', A.locator('.hand.dropping').count() == 1)
    click(A, '.hand .hc:nth-child(1)'); click(A, '.hand .hc:nth-child(2)')
    click(A, '[data-act=dodrop]')
    A.wait_for_function('G().turn !== myIdx()', timeout=10000)
    t('ne restano 5 e il turno passa', js(A, 'G().players[myIdx()].hand.length') == 5)

    # nave nuova: Bea è senza nave
    pre = (b + 4) % 5
    host(A, "g.turn=%d;g.step='play';g.pend=null;g.shots=0;clear(%d);give(%d,'rum',0);g.players[%d].ship=null;g.players[%d].bar=0;E.act(g,%d,{a:'end'})" % (pre, pre, pre, b, b, pre))
    B.wait_for_selector('.sh-ships [data-act=ship]', timeout=10000)
    t('a Bea senza nave si apre la scelta della nave', B.locator('.sh-ships .shipb').count() == 3)
    click(B, '.sh-ships [data-act=ship][data-i="0"]')
    B.wait_for_function('G().players[myIdx()].ship != null && G().step === "play"', timeout=10000)
    t('Bea prende la nave e pesca', js(B, 'G().players[myIdx()].bar') > 0)

    # Vascello spettrale su Bea, che non risponde
    barB = js(B, 'G().players[myIdx()].bar')
    host(A, "g.turn=%d;g.step='play';g.pend=null;g.gorgo=null;g.spectre={on:%d};clear(%d);give(%d,'rum',1);clear(%d);" % (pre, b, pre, pre, b) +
         "var xs=g.deck.filter(function(i){return E.CARDS[i].s==='X'});var top=xs[0],mine=xs[1];g.deck.splice(g.deck.indexOf(top),1);g.deck.push(top);g.deck.splice(g.deck.indexOf(mine),1);g.players[%d].hand.push(mine);E.act(g,%d,{a:'end'})" % (b, pre))
    B.wait_for_selector('.sh-spectre', timeout=10000)
    t('il Vascello spettrale chiede a Bea di rispondere', 'Vascello spettrale' in B.inner_text('.sh-spectre') and B.locator('.sh-spectre [data-act=answer]').count() >= 1)
    click(B, '.sh-spectre [data-act=noanswer]')
    B.wait_for_function('G().step === "play" && !G().spectre', timeout=10000)
    t('chi non risponde perde 2 barili', js(B, 'G().players[myIdx()].bar') == max(0, barB - 2) or js(B, 'G().players[myIdx()].ship') is None)

    # fine della partita: Ale affonda la nave di Bea e il Forziere arriva su una bandiera
    en = b
    turn_of(A, a, "var R=g.players[%d].role,d=R==='PI'?(E.nat(g.players[%d].role)==='L'?-1:1):(E.nat(R)==='L'?1:-1);g.chest=d*(g.flag-1);g.players[%d].bar=1;g.players[%d].eq=[];clear(%d);clear(%d);g.players[%d].ship=10;give(%d,'bordata',2)" % (b, a, b, b, b, a, a, a))
    A.wait_for_function('G().players[myIdx()].hand.length === 1', timeout=10000); idle(A)
    click(A, '.hand .hc'); A.wait_for_selector('.sh-card .tgtb', timeout=5000); click(A, '.sh-card .tgtb[data-p="%d"]' % en)
    for P in (A, B): P.wait_for_function("G().phase === 'over'", timeout=10000)
    for P in (A, B): P.wait_for_selector('.sh-over', timeout=10000)
    h2 = B.inner_text('.sh-over h2')
    t('fine partita: tutti i ruoli scoperti e chi vince', B.locator('.sh-over .orow').count() == 5 and B.locator('.sh-over .orow.win').count() >= 1 and ('Vince' in h2 or 'Hai vinto' in h2), h2)
    B.screenshot(path=os.path.join(OUT, 'forziere-fine.png'))
    t('l’host può rigiocare', A.locator('.sh-over [data-act=rematch]').count() == 1)
    br.close()
t('nessun errore nelle pagine', not errs, '; '.join(errs[:3]))
done()
