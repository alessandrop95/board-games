# gioco: polvere-e-piombo
"""Bang! nel browser con le espansioni: sala d'attesa con Dodge City, Mezzogiorno di Fuoco e Per un Pugno di Carte,
tavolo ovale in 8 (tu in basso, gli altri nell'ordine vero del giro, freccia dorata verso il prossimo, distanze nel mirino),
mira con le linee e il motivo di chi è fuori tiro, carte con scarto in più, carte verdi, evento al centro, risposte (Bibbia, Peyote),
galleria con le carte nuove e disposizione del computer senza posti sovrapposti.
Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/polvere-e-piombo/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick, w=390, h=844):
        c = br.new_context(viewport={'width': w, 'height': h}, is_mobile=w < 600, has_touch=w < 600)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s)}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def host(P, body):  # modifica lo stato della partita sul dispositivo host
        js(P, "Net.hostApply(function(cur){var g=cur.game, E=PPEngine, D=PPData; %s; g.seq++; return true})" % body)
        P.wait_for_timeout(700)
    # prende una carta del tipo voluto da dove si trova (mazzo, scarti o davanti a un bot) e la dà a un giocatore
    GIVE = """function give(t, who, where){ var mine=g.players[who].hand.concat(g.players[who].eq); var all=D.CARDS.filter(function(c){return c.t===t}), id=(all.filter(function(c){return mine.indexOf(c.id)<0})[0]||all[0]).id;
      [g.deck, g.disc].forEach(function(a){var i=a.indexOf(id); if(i>=0) a.splice(i,1)}); g.players.forEach(function(P){['hand','eq'].forEach(function(k){var i=P[k].indexOf(id); if(i>=0) P[k].splice(i,1)})});
      g.players[who][where||'hand'].push(id); return id; }"""

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('home: il gioco presenta le espansioni', 'Dodge City' in A.inner_text('.hero'))
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    t('sala d’attesa: tre espansioni da scegliere, spente', A.locator('.xp input').count() == 3 and A.locator('.xp.on').count() == 0)
    for k in ['dc', 'hn', 'fc']:
        A.click('#opt-' + k); A.wait_for_function("App.doc.opts && App.doc.opts.%s === true" % k, timeout=8000)
    t('attivate tutte e tre', A.locator('.xp.on').count() == 3 and js(A, 'JSON.stringify(expOf(App.doc))') == '{"dc":true,"hn":true,"fc":true}')
    t('con entrambi i mazzi di eventi si spiega il mazzo da 12', 'se ne pescano 12' in A.inner_text('.lobby'))
    t('con Dodge City il tavolo arriva a 8 posti', A.locator('.seats .seat-l').count() == 8 and '(1/8)' in A.inner_text('.lobby'))
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    t('Bea vede le espansioni scelte ma non può cambiarle', B.locator('.xp input:checked').count() == 3 and B.locator('.xp input:disabled').count() == 3)
    click(A, '[data-act=xpinfo]'); A.wait_for_timeout(300)
    t('si spiega come vanno insieme le espansioni', 'Lazo' in A.inner_text('.sheet') and 'carte verdi' in A.inner_text('.sheet'))
    click(A, '[data-act=close]')
    for i in range(6): click(A, '[data-act=addbot]'); A.wait_for_timeout(250)
    A.wait_for_function('App.doc.seats.length === 8', timeout=8000)
    t('otto al tavolo', A.locator('.seats .seat-l.full').count() == 8)
    click(A, '#opt-dc'); A.wait_for_function('App.doc.opts.dc === false', timeout=8000)
    t('senza Dodge City in 8 non si parte', A.locator('[data-act=start][disabled]').count() == 1 and 'solo con Dodge City' in A.inner_text('.lobby'))
    click(A, '#opt-dc'); A.wait_for_function('App.doc.opts.dc === true', timeout=8000)
    click(A, '[data-act=start]')
    for P in (A, B): P.wait_for_selector('.ring', timeout=15000)
    js(A, 'window.driveBots = function () {}')   # i bot li muove il test
    A.wait_for_timeout(2500)

    # ---------- il tavolo ovale ----------
    me = js(A, 'myIdx()')
    t('otto posti attorno al tavolo', A.locator('.ring .seat').count() == 8)
    t('io sono in basso al centro', js(A, "(function(){var s=document.querySelector('.seat.mine');return parseFloat(s.style.top)>99 && Math.abs(parseFloat(s.style.left)-50)<1})()"))
    t('il prossimo nel giro siede in basso a sinistra', js(A, "(function(){var n=(myIdx()+1)%8, s=document.querySelector('[data-plate=\"'+n+'\"]');return parseFloat(s.style.left)<40 && parseFloat(s.style.top)>60})()"))
    t('freccia dorata dal mio posto al prossimo', A.locator('.arw.gold').count() == 1 and A.locator('.arw').count() == 8)
    t('accanto a ogni avversario la distanza da me, come per il motore',
      js(A, "(function(){var g=App.doc.game, me=myIdx(), ok=true; document.querySelectorAll('.seat:not(.mine):not(.dead)').forEach(function(s){var i=+s.dataset.plate; var d=s.querySelector('.dd'); if(!d||+d.textContent!==PPEngine.distance(g,me,i)) ok=false;}); return ok})()"))
    t('nessuno sborda dallo schermo del telefono', js(A, 'document.documentElement.scrollWidth') <= 390 and js(A, "Array.from(document.querySelectorAll('.seat')).every(function(s){var r=s.getBoundingClientRect();return r.left>=-2 && r.right<=392})"))
    t('il mazzo degli eventi aspetta il secondo giro', A.locator('.evslot .evc.back').count() == 1 and 'dal 2° giro' in js(A, "document.querySelector('.evslot').textContent"))

    # ---------- turno truccato: tocca a me, evento Sbornia ----------
    host(A, GIVE + """; var me=%d; g.turn=me; g.step='play'; g.stack=[]; g.bangs=0; g.ev.cur='sbornia'; g.ev.pile=['sbornia'];
      g.players.forEach(function(P){P.alive=true; P.hp=P.max; P.char='thorne';});
      g.players[me].hand.forEach(function(c){g.deck.push(c)}); g.players[me].hand=[]; g.players[me].eq.forEach(function(c){g.deck.push(c)}); g.players[me].eq=[];
      give('sparo', me); give('revolver', me, 'eq')""" % me)
    t('al centro l’evento del giro', 'Sbornia' in A.inner_text('.evslot') and 'Mezzogiorno di Fuoco' in A.inner_text('.evslot .set'))
    click(A, '[data-act=evinfo]'); A.wait_for_timeout(300)
    t('toccando l’evento si legge per intero', 'Nessun personaggio può usare' in A.inner_text('.sheet') and 'Ne restano' in A.inner_text('.sheet'))
    click(A, '[data-act=close]')
    names = js(A, "(function(){var g=App.doc.game, me=myIdx(); return PPEngine.playInfo(g,me,g.players[me].hand[0]).targets.map(function(i){return g.players[i].nick})})()")
    hint = A.inner_text('.dock .now')
    t('la barra «adesso» dice a chi posso sparare', 'Puoi sparare a' in hint and all(n in hint for n in names), hint)
    A.screenshot(path=os.path.join(OUT, 'bang-tavolo.png'))

    # ---------- mira ----------
    click(A, '.hand .card'); A.wait_for_timeout(300); click(A, '[data-act=playsel]'); A.wait_for_timeout(500)
    tg = js(A, 'App.sel.info.targets.length')
    t('in mira: i bersagli si illuminano e ricevono la linea di tiro', A.locator('.seat.target').count() == tg and A.locator('.aim line').count() == tg)
    reasons = A.locator('.seat.notarget:not(.mine) .tg').all_inner_texts()
    t('chi è fuori tiro dice perché', len(reasons) > 0 and all('posti' in r and 'arrivi a 2' in r for r in reasons), str(reasons))
    A.screenshot(path=os.path.join(OUT, 'bang-mira.png'))
    out = js(A, "(function(){var s=document.querySelector('.seat.notarget:not(.mine)'); return +s.dataset.plate})()")
    click(A, '.seat.notarget:not(.mine)'); A.wait_for_timeout(300)
    t('toccando chi è fuori tiro arriva la spiegazione', 'arrivi a' in A.inner_text('.toast'))
    target = js(A, 'App.sel.info.targets[0]')
    click(A, '[data-plate="%d"]' % target); A.wait_for_timeout(900)
    t('il Bang! parte verso il bersaglio scelto', js(A, "(function(){var g=App.doc.game;return g.log.slice(-6).some(function(l){return l.t.indexOf(' spara a '+g.players[%d].nick)>0})})()" % target))
    host(A, "g.stack=[]")

    # ---------- Springfield: scarti anche un'altra carta ----------
    host(A, GIVE + "; var me=%d; window.__sp=give('springfield', me); window.__x=give('giro', me)" % me)
    sp = js(A, "App.doc.game.players[myIdx()].hand.filter(function(c){return PPEngine.ty(c)==='springfield'})[0]")
    x = js(A, "App.doc.game.players[myIdx()].hand.filter(function(c){return PPEngine.ty(c)==='giro'})[0]")
    click(A, '.hand [data-card="%d"]' % sp); A.wait_for_timeout(300)
    t('la carta avvisa che si scarta anche un’altra carta', 'scarti anche' in A.inner_text('.sheet'))
    click(A, '[data-act=playsel]'); A.wait_for_timeout(400)
    far = js(A, "(function(){var g=App.doc.game, me=myIdx(); return App.sel.info.targets.filter(function(i){return PPEngine.distance(g,me,i)>2})[0]})()")
    click(A, '[data-plate="%d"]' % far); A.wait_for_timeout(400)
    t('poi si sceglie la carta da scartare insieme', js(A, "App.mode") == 'pick' and 'Scegli l’altra carta' in A.inner_text('.dock'))
    click(A, '.hand [data-card="%d"]' % x); A.wait_for_timeout(200); click(A, '[data-act=pickok]'); A.wait_for_timeout(900)
    t('Springfield colpisce lontano e scarta tutte e due le carte', js(A, "(function(){var g=App.doc.game;return g.disc.indexOf(%d)>=0 && g.disc.indexOf(%d)>=0 && g.log.slice(-6).some(function(l){return l.t.indexOf('Springfield contro '+g.players[%d].nick)>0})})()" % (sp, x, far)))
    host(A, "g.stack=[]")

    # ---------- carta verde: Derringer pronto ----------
    host(A, GIVE + "; var me=%d; var d=give('derringer', me, 'eq'); g.green[d]=0" % me)
    t('la carta verde mostra che è pronta', A.locator('.me .eqc.k-g.ready').count() == 1)
    click(A, '.me .eqc.k-g'); A.wait_for_timeout(300)
    t('dalla carta verde: «Usa Derringer»', 'Usa Derringer' in A.inner_text('.sheet'))
    click(A, '[data-act=usegreen]'); A.wait_for_timeout(400)
    near = js(A, 'App.sel.info.targets[0]'); nh = js(A, 'App.doc.game.players[myIdx()].hand.length')
    click(A, '[data-plate="%d"]' % near); A.wait_for_timeout(900)
    t('il Derringer colpisce a distanza 1 e fa pescare', js(A, "(function(){var g=App.doc.game;return g.players[myIdx()].hand.length===%d && g.log.slice(-6).some(function(l){return l.t.indexOf('Derringer contro '+g.players[%d].nick)>0})})()" % (nh + 1, near)))
    host(A, "g.stack=[]")

    # ---------- risposta con la Bibbia ----------
    host(A, GIVE + """; var me=%d, b=(me+1)%%8; var bi=give('bibbia', me, 'eq'); g.green[bi]=0; g.turn=b; g.step='play'; g.bangs=0; g.ev.cur=null;
      g.players[b].char='thorne'; var s=give('sparo', b); g.players[b].eq=[]; E.act(g, b, {a:'play', card:s, target:me})""" % me)
    A.wait_for_selector('.sheet [data-act=respgreen]', timeout=8000)
    hp = js(A, 'App.doc.game.players[myIdx()].hp'); nh = js(A, 'App.doc.game.players[myIdx()].hand.length')
    t('quando mi sparano posso usare la Bibbia che ho in gioco', 'Bibbia' in A.inner_text('.sheet'))
    click(A, '[data-act=respgreen]'); A.wait_for_timeout(900)
    t('Bibbia: colpo annullato e una carta pescata', js(A, 'App.doc.game.players[myIdx()].hp') == hp and js(A, 'App.doc.game.players[myIdx()].hand.length') == nh + 1)

    # ---------- Peyote ----------
    host(A, "var me=%d; g.turn=me; g.step='play'; g.stack=[{type:'peyote', who:me, got:0}]; g.ev.cur='peyote'" % me)
    A.wait_for_selector('.sheet [data-act=peyote]', timeout=8000)
    t('Peyote: si sceglie rosso o nero', A.locator('.sheet [data-act=peyote]').count() == 2)
    click(A, '.sheet [data-act=peyote][data-c=R]'); A.wait_for_timeout(800)
    t('la scelta finisce nel registro', 'dice rosso' in js(A, "App.doc.game.log.slice(-2).map(function(l){return l.t}).join(' ')"))
    host(A, "g.stack=[]")
    B.wait_for_timeout(500)
    t('Bea vede lo stesso tavolo dal suo posto, in basso', js(B, "+document.querySelector('.seat.mine').dataset.plate") == js(B, 'myIdx()'))

    # ---------- galleria e computer ----------
    G = phone('Gil', 1280, 860)
    G.goto(U); G.wait_for_timeout(600); click(G, '[data-act=gallery]'); G.wait_for_timeout(400)
    t('galleria: 22 tipi di carte di Dodge City, 15 personaggi nuovi e 28 eventi', G.locator('.gitem.ev').count() == 28 and 'Dodge City: 40 carte' in G.inner_text('.gallery'))
    D2 = phone('Ale', 1280, 860); D2.goto(U + '&t=' + code); D2.wait_for_selector('.ring', timeout=15000); D2.wait_for_timeout(1500)
    ov = js(D2, """(function(){var r=Array.from(document.querySelectorAll('.ring .seat')).map(function(s){return s.getBoundingClientRect()}), worst=0;
      for(var i=0;i<r.length;i++)for(var j=i+1;j<r.length;j++){var w=Math.min(r[i].right,r[j].right)-Math.max(r[i].left,r[j].left), h=Math.min(r[i].bottom,r[j].bottom)-Math.max(r[i].top,r[j].top); if(w>0&&h>0) worst=Math.max(worst, w*h/(r[i].width*r[i].height));} return worst})()""")
    t('computer: i cartoncini dei posti non si coprono', ov < 0.08, str(ov))
    t('computer: registro a destra del tavolo', js(D2, "document.querySelector('.side').getBoundingClientRect().left > document.querySelector('.ring').getBoundingClientRect().right - 5"))
    D2.screenshot(path=os.path.join(OUT, 'bang-computer.png'))
    br.close()
t('nessun errore nelle pagine', not errs, '; '.join(errs[:3]))
done()
