# gioco: disegna
"""Disegna e indovina nel browser con tre telefoni: Ale (host) e Bea nella stessa squadra, Cri nell'altra con un
giocatore automatico. Scelta della parola, disegno con il dito che arriva in diretta agli altri, risposte sbagliate
e giuste, furto degli avversari a tempo scaduto, fine della partita. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/disegna/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('dg-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def js(P, s): return P.evaluate(s)
    def click(P, sel): P.evaluate("(function(){var e=document.querySelector(%s); if(!e) throw new Error('manca '+%s); e.dispatchEvent(new MouseEvent('click',{bubbles:true}));})()" % (json.dumps(sel), json.dumps(sel)))
    def host(P, code): js(P, "Net.hostApply(function(cur){var g=cur.game;%s;g.seq++;return true})" % code)
    def guess(P, w): P.evaluate("(function(){var i=document.getElementById('gin'); i.value=%s; document.getElementById('gform').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));})()" % json.dumps(w))
    def stroke(P, pts):
        P.evaluate("""(function(pts){var cv=document.getElementById('cv'), r=cv.getBoundingClientRect();
          function ev(type,x,y){cv.dispatchEvent(new PointerEvent(type,{bubbles:true,clientX:r.left+x*r.width,clientY:r.top+y*r.height,pointerId:1,pointerType:'touch'}));}
          ev('pointerdown',pts[0][0],pts[0][1]); pts.slice(1).forEach(function(q){ev('pointermove',q[0],q[1]);}); ev('pointerup',pts[pts.length-1][0],pts[pts.length-1][1]);})(%s)""" % json.dumps(pts))

    A = phone('Ale'); A.goto(U); A.wait_for_timeout(800)
    t('nella home del gioco il nome e le regole in breve', 'Disegna e indovina' in A.inner_text('h1') and 'rubar' in A.inner_text('.lobby'))
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = js(A, 'App.code')
    B = phone('Bea'); B.goto(U + '&t=' + code); B.wait_for_function('App.doc && App.doc.seats.length === 2', timeout=15000)
    C = phone('Cri'); C.goto(U + '&t=' + code); C.wait_for_function('App.doc && App.doc.seats.length === 3', timeout=15000)
    A.wait_for_function('App.doc.seats.length === 3', timeout=10000)
    click(A, '[data-act=start]'); A.wait_for_timeout(800)
    t('con squadre da un giocatore non si comincia', js(A, 'App.doc.phase') == 'lobby')
    click(A, '[data-act=addbot]'); A.wait_for_function('App.doc.seats.length === 4', timeout=10000)
    teams = js(A, 'App.doc.seats.map(function(s){return s.team})')
    if teams[1] != teams[0]: click(B, '[data-act=team][data-uid="%s"]' % js(B, 'Net.uid')); A.wait_for_function('App.doc.seats[1].team === App.doc.seats[0].team', timeout=10000)
    if js(A, 'App.doc.seats[2].team === App.doc.seats[0].team'): click(C, '[data-act=team][data-uid="%s"]' % js(C, 'Net.uid')); A.wait_for_function('App.doc.seats[2].team !== App.doc.seats[0].team', timeout=10000)
    if js(A, 'App.doc.seats[3].team === App.doc.seats[0].team'): click(A, '[data-act=team][data-uid="%s"]' % js(A, 'App.doc.seats[3].uid')); A.wait_for_function('App.doc.seats[3].team !== App.doc.seats[0].team', timeout=10000)
    A.select_option('#opt-rounds', '1'); B.wait_for_function('App.doc.opts.rounds === 1', timeout=10000)
    t('Bea vede le opzioni', '1 giro' in B.inner_text('.lobby'))
    click(A, '[data-act=start]')
    for P in (A, B, C): P.wait_for_selector('#gv', timeout=15000)
    g = js(A, 'G()')
    t('turni: ogni persona disegna una volta', [o['p'] for o in g['order']] == [0, 2, 1], g['order'])
    A.wait_for_selector('[data-act=choose]', timeout=10000)
    t('chi disegna sceglie tra due parole, gli altri aspettano', A.locator('[data-act=choose]').count() == 2 and B.locator('[data-act=choose]').count() == 0 and 'sceglie' in B.inner_text('#gv-mid'))
    click(A, '[data-act=choose][data-i="1"]'); A.wait_for_function("G().phase === 'draw'", timeout=10000)
    word = js(A, 'G().word')
    t('la parola la vede solo chi disegna', word in A.inner_text('#gv-mid') and word not in B.inner_text('#gv-mid') and B.locator('.mask i').count() == len(word.replace(' ', '')))
    t('chi disegna ha i colori, gli altri no', A.locator('.tools .sw').count() >= 8 and B.locator('.tools .sw').count() == 0)
    t('indovina solo la squadra di chi disegna', B.locator('#gin').count() == 1 and C.locator('#gin').count() == 0)
    stroke(A, [[.2, .3], [.3, .4], [.4, .5], [.5, .4], [.6, .3]])
    B.wait_for_function('Game.strokes().length === 1 && Game.strokes()[0].length >= 8', timeout=10000)
    t('il disegno arriva in diretta a compagni e avversari', js(C, 'Game.strokes().length') == 1)
    A.wait_for_function('G().pic.s.length === 1', timeout=10000)
    t('e viene salvato nel tavolo', js(A, 'G().pic.s[0].length') >= 8)
    click(A, '[data-act=undo]'); B.wait_for_function('Game.strokes().length === 0', timeout=10000)
    t('annulla: il tratto sparisce anche dagli altri', js(C, 'Game.strokes().length') == 0)
    stroke(A, [[.1, .1], [.9, .9]])
    A.screenshot(path=os.path.join(OUT, 'disegna-lavagna.png'))
    guess(B, 'pippo'); A.wait_for_function('G().guesses.length === 1', timeout=10000)
    t('le risposte sbagliate restano in vista', 'pippo' in C.inner_text('#feed'))
    guess(B, word.upper()); A.wait_for_function("G().phase === 'reveal'", timeout=10000)
    t('risposta giusta in fretta: 2 punti +1', js(A, 'G().hit.pts') == 3 and js(A, 'G().teams[G().players[0].team].total') == 3)
    t('poi tutti vedono la parola', word in C.inner_text('#gv-mid'))
    B.screenshot(path=os.path.join(OUT, 'disegna-indovinata.png'))
    host(A, "g.until=Date.now()"); A.wait_for_function("G().phase === 'choose' && G().drawer === 2", timeout=15000)
    C.wait_for_selector('[data-act=choose]', timeout=10000); click(C, '[data-act=choose][data-i="0"]'); A.wait_for_function("G().phase === 'draw'", timeout=10000)
    host(A, "g.players.forEach(function(P){P.bot=false}); g.until=Date.now()"); A.wait_for_function("G().phase === 'steal'", timeout=15000)
    t('tempo finito: gli avversari possono rubare', A.locator('#gin').count() == 1 and C.locator('#gin').count() == 0)
    guess(A, js(A, 'G().word')); A.wait_for_function("G().phase === 'reveal' && G().hit", timeout=10000)
    t('furto: punti della parola senza bonus', js(A, 'G().hit.steal') and js(A, 'G().hit.pts') == 1)
    host(A, "g.until=Date.now()"); A.wait_for_function("G().drawer === 1", timeout=15000)
    B.wait_for_selector('[data-act=choose]', timeout=10000); click(B, '[data-act=choose][data-i="0"]'); A.wait_for_function("G().phase === 'draw'", timeout=10000)
    click(B, '[data-act=skip]'); A.wait_for_function("G().phase === 'steal'", timeout=10000)
    host(A, "g.until=Date.now()"); A.wait_for_function("G().phase === 'reveal'", timeout=15000)
    host(A, "g.until=Date.now()")
    for P in (A, B, C): P.wait_for_selector('.sh-over', timeout=15000)
    t('fine della partita con la classifica delle squadre', 'Avete vinto' in A.inner_text('.sh-over') and 'Vincono' in C.inner_text('.sh-over'))
    t('nessun errore nelle pagine', not errs, errs)
    br.close()
done()
