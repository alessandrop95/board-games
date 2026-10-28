"""Ticket to Ride Italy (cartella binari-italia) nel browser: 5 biglietti iniziali, carta Traghetto pescata dal mucchio,
traghetto pagato con le carte Traghetto, valichi dei Paesi confinanti, vista e scheda delle regioni, punteggio finale.
Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
U = 'http://localhost:8897/binari-italia/?broker=ws://localhost:8897/'
OUT = os.environ.get('OUT', '/tmp')
FAST = "(function(){var st=window.setTimeout;window.setTimeout=function(f,ms){if(ms>=500&&ms<=12000)ms=ms*0.1;return st.apply(window,[f,ms].concat([].slice.call(arguments,2)))}})();"
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    c.add_init_script("try{localStorage.setItem('pp-nick','Ale')}catch(e){}" + FAST)
    A = c.new_page(); A.on('pageerror', lambda e: errs.append(str(e)))
    A.goto(U); A.wait_for_timeout(1200)
    t('nome del gioco', 'Ticket to Ride' in A.inner_text('h1') and A.title() == 'Ticket to Ride Italy', A.title())
    A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000)
    A.click('[data-act=addbot]'); A.wait_for_timeout(400); A.click('[data-act=start]')
    A.wait_for_selector('.sh-intro', timeout=10000)
    t('presentazione con Paesi confinanti e regioni', A.evaluate("(function(){var s=App.sheet;s.page=2;renderSheet();return document.querySelector('.sheet').innerText})()").find('Paesi confinanti') >= 0)
    A.locator('[data-act=introdone]').first.click(); A.wait_for_selector('.sh-keep', timeout=10000)
    n = A.locator('.kt').count(); t('5 biglietti di partenza', n == 5, n)
    A.evaluate("App.sheet.sel=[]; renderSheet()"); A.locator('.kt-t').nth(0).click(); A.locator('.kt-t').nth(1).click()
    t('con 2 biglietti non si conferma', A.locator('[data-act=keepok][disabled]').count() == 1)
    A.locator('.kt-t').nth(2).click(); A.click('[data-act=keepok]')
    A.wait_for_function("G().stage === 'act'", timeout=15000)
    me = A.evaluate('myIdx()')
    t('3 biglietti tenuti', len(A.evaluate('G().players[myIdx()].tickets')) == 3)
    # carta Traghetto dal mucchio
    A.evaluate("Net.hostApply(function(cur){var g=cur.game;g.turn=%d;g.stage='act';return true})" % me); A.wait_for_timeout(700)
    t('mucchio Traghetti con 10 carte', A.inner_text('.mk-fe .cnt') == '10')
    A.click('[data-act=drawferry]'); A.wait_for_selector('.sh-ferryconfirm'); A.click('[data-act=ferryyes]'); A.wait_for_timeout(900)
    t('carta Traghetto presa: turno finito', A.evaluate('G().players[myIdx()].ferry') == 1 and A.evaluate("G().log.some(function(l){return /prende una carta Traghetto/.test(l.t)})") and A.evaluate('E.ferryPile(G()) + G().players.reduce(function(s,P){return s+(P.ferry||0)},0)') == 10)
    t('carta Traghetto nella mano e tra i dati del giocatore', A.locator('.hd-fe').count() == 1 and A.locator('.pchip.me .fe').count() == 1)
    # traghetto Cagliari–Palermo con 2 carte Traghetto + 1 carta
    A.wait_for_function("G().turn === myIdx() && G().stage === 'act'", timeout=20000)
    A.evaluate("Net.hostApply(function(cur){var g=cur.game,P=g.players[%d];P.ferry=2;g.fdeck=10-g.players.reduce(function(s,Q){return s+(Q.ferry||0)},0);Object.keys(P.hand).forEach(function(k){P.hand[k]=0});P.hand.R=1;P.hand.L=2;return true})" % me); A.wait_for_timeout(700)
    rid = A.evaluate("D.routes.filter(function(r){return r.a==='cagliari'&&r.b==='palermo'})[0].id")
    A.evaluate("App.sel=%d;App.sheet={kind:'route',r:%d,seq:G().seq};renderSheet();Game.render()" % (rid, rid)); A.wait_for_timeout(300)
    s = A.inner_text('.sh-route')
    t('scheda del traghetto: onde e carte Traghetto', '4 spazi con l’onda' in s and 'Carte Traghetto da usare' in s, s[:300])
    t('si giocano 2 carte Traghetto e 1 rossa', A.locator('.use .bcard.ferry').count() == 2 and A.locator('.use .bcard').count() == 3)
    A.click('[data-act=claimok]'); A.wait_for_timeout(900)
    t('traghetto conquistato, carte Traghetto tornate nel mucchio', A.evaluate('G().claims[%d]' % rid) == me and A.evaluate('G().players[myIdx()].ferry') == 0 and A.evaluate('E.ferryPile(G()) + G().players.reduce(function(s,P){return s+(P.ferry||0)},0)') == 10, A.evaluate('[G().claims[%d], G().players[myIdx()].ferry, E.ferryPile(G()), G().log.slice(-3).map(function(l){return l.t})]' % rid))
    # valichi e regioni
    t('10 valichi sulla mappa', A.locator('.bd-gate').count() == 10)
    A.evaluate("App.sheet={kind:'city',c:'si-trieste'};renderSheet()"); A.wait_for_timeout(200)
    t('scheda del valico', 'vicolo cieco' in A.inner_text('.sheet') and 'Slovenia' in A.inner_text('.sheet'))
    A.evaluate("App.sheet={kind:'city',c:'bari'};renderSheet()"); A.wait_for_timeout(200)
    t('scheda della città con la regione', 'Puglia' in A.inner_text('.sheet') and 'vale 2 regioni' in A.inner_text('.sheet'))
    A.evaluate("App.sheet=null;renderSheet()"); A.click('[data-act=togglereg]'); A.wait_for_timeout(400)
    t('vista Regioni sulla mappa', A.evaluate("document.querySelector('.bd-svg').classList.contains('show-reg')") and A.locator('.bd-reg').count() == 19)
    A.screenshot(path=os.path.join(OUT, 'ttr-italy-regioni.png'))
    A.locator('.gv-legend [data-act=regions]').click(); A.wait_for_timeout(300)
    s = A.inner_text('.sheet'); t('scheda regioni: rete e tabella', 'Regioni' in s and 'Bonus attuale' in s and 'Punti' in s, s[:300])
    A.evaluate("App.sheet=null;renderSheet()")
    # fine partita forzata: bonus regioni nel conteggio
    A.evaluate("Net.hostApply(function(cur){var g=cur.game;g.turn=%d;g.stage='act';g.last={by:%d,rem:1};return true})" % (me, me)); A.wait_for_timeout(700)
    A.evaluate("act({a:'draw',i:'deck'})"); A.wait_for_timeout(600); A.evaluate("act({a:'draw',i:'deck'})")
    A.wait_for_function("G().phase === 'over'", timeout=15000); A.wait_for_timeout(800)
    if not A.locator('.sh-over').count(): A.evaluate("App.sheet={kind:'over'};renderSheet()")
    A.wait_for_timeout(500); s = A.inner_text('.sheet')
    t('classifica con il bonus delle regioni, senza percorso più lungo', 'Regioni' in s and 'Linea' not in s, s[:300])
    br.close()
t('nessun errore nella pagina', not errs, errs[:4])
done()
