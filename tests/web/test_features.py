"""Funzioni per giocare con gli amici: amici online e «Raggiungi», tavoli «solo amici», serie di partite, statistiche,
reazioni rapide, partita guidata contro i bot (tutti i giochi), «Continua la partita» in home.
Serve: broker su 8897 e Supabase simulato su 8898 (vedi tests/run.sh)."""
import json, os, sys, time, urllib.request
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from pg import q, admin
from check import t, done
from playwright.sync_api import sync_playwright
S = 'http://localhost:8898/'; BR = 'broker=ws://localhost:8897/&annunci=1'
admin('delete from players; delete from notify_log; delete from login_fail; delete from results;')
def reg(u): return json.loads(q("select register('%s','segreto1')" % u)[0])
def sent(): return json.loads(urllib.request.urlopen(S + '__sent').read())
A, B, C = reg('Ale'), reg('Bea'), reg('Ciro')
q("select srv_friend('%s','Bea')" % A['token'], 'service_role'); q("select friend_respond('%s','Ale',true)" % B['token'])
import subprocess
K = json.loads(subprocess.run(['node', '-e', "crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']).then(async k=>{const r=new Uint8Array(await crypto.subtle.exportKey('raw',k.publicKey));const b=x=>Buffer.from(x).toString('base64url');console.log(JSON.stringify({p:b(r),a:b(crypto.getRandomValues(new Uint8Array(16)))}))})"], capture_output=True, text=True).stdout)
for U, ep in ((B, 'bea'), (C, 'ciro')):
    q("select save_push('%s','https://push.example/%s','%s','%s',array['gattomina']::text[],true,'test')" % (U['token'], ep, K['p'], K['a']))
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def ctx(session=None, nick=None):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        if session: c.add_init_script("try{if(!localStorage.getItem('pp-session'))localStorage.setItem('pp-session',%s);localStorage.setItem('pp-nick',%s)}catch(e){}" % (json.dumps(json.dumps(session)), json.dumps(nick or session['username'])))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        return pg
    def go(pg, path, extra=''): pg.goto(S + path + '?' + BR + extra); pg.wait_for_timeout(1500)
    Ap, Bp, Cp = ctx(A), ctx(B), ctx(C)

    # ---- amici online ----
    go(Ap, 'gattomina/'); go(Bp, 'gattomina/'); go(Cp, 'gattomina/')
    Bp.evaluate('Account.presence()'); time.sleep(1); Ap.evaluate('Account.presence()'); time.sleep(1.2)
    Bp.click('[data-pa="open"][data-v="account"]'); Bp.wait_for_timeout(900)
    s = Bp.inner_text('.pa-sheet'); t('Bea vede Ale collegato a Exploding Kittens', 'sta guardando Exploding Kittens' in s, s[:400])
    Bp.click('[data-pa="close"]')

    # ---- tavolo «solo amici» ----
    t('opzione «Solo amici» quando hai l’account', Ap.locator('input[name=vis][value=friends]').count() == 1)
    N = ctx(); go(N, 'gattomina/'); t('…ma non senza account', N.locator('input[name=vis][value=friends]').count() == 0); N.context.close()
    Ap.check('input[name=vis][value=friends]'); n0 = len(sent())
    Ap.fill('#nick', 'Ale'); Ap.click('[data-act=create]'); Ap.wait_for_function('App.doc && App.doc.code', timeout=15000); code = Ap.evaluate('App.code')
    t('tavolo creato «solo amici»', Ap.evaluate('App.doc.vis') == 'friends')
    time.sleep(6)
    news = sent()[n0:]; t('notifica solo all’amica Bea', [x['to'] for x in news] == ['https://push.example/bea'], news)
    Bp.evaluate('Account.refreshFriends(true).then(()=>Lobby.paint())'); Bp.wait_for_timeout(1500)
    t('Bea vede il tavolo di Ale nella lista', 'Tavolo di Ale' in Bp.inner_text('#olist') and 'Solo amici' in Bp.inner_text('#olist'), Bp.inner_text('#olist'))
    Cp.evaluate('Lobby.paint()'); Cp.wait_for_timeout(500)
    t('Ciro (non amico) non lo vede', 'Tavolo di Ale' not in Cp.inner_text('#olist'), Cp.inner_text('#olist'))
    Bp.locator('#olist [data-act=lobbyjoin]').first.click(); Bp.wait_for_function("App.doc && App.doc.code === '%s'" % code, timeout=10000)
    if Bp.locator('#nick').count() and Bp.locator('[data-act=join]').count(): Bp.fill('#nick', 'Bea'); Bp.click('[data-act=join]')
    Ap.wait_for_function('App.doc.seats.length === 2', timeout=10000); t('Bea si siede con un tocco', True)
    # «Raggiungi» nella lista amici
    Ap.evaluate('Account.presence()'); time.sleep(1.5); Cp.evaluate('0')
    go(Cp, 'gattomina/')
    Bp.evaluate('Account.presence()'); time.sleep(1); Ap.evaluate('Account.refreshFriends(true)'); time.sleep(1)
    Ap.click('[data-pa="openinvite"]') if Ap.locator('[data-pa="openinvite"]').count() else None; Ap.wait_for_timeout(800)
    s = Ap.inner_text('.pa-sheet') if Ap.locator('.pa-sheet').count() else ''
    t('invito: si vede dov’è l’amica', 'è al tavolo di Exploding Kittens' in s, s[:300])
    Ap.evaluate('Account.close()')

    # ---- serie di partite + statistiche ----
    Ap.select_option('#opt-series', '3'); Ap.wait_for_timeout(600)
    t('serie al meglio di 3', Ap.evaluate('App.doc.series && App.doc.series.target') == 3)
    Ap.evaluate("Net.send({t:'start'})"); Ap.wait_for_function('App.doc.phase === "play"', timeout=10000)
    aidx = Ap.evaluate('myIdx()'); bidx = Bp.evaluate('myIdx()')
    def finish(w):
        Ap.evaluate("w => Net.hostApply(d => { d.game.phase = 'over'; d.game.winner = w; d.phase = 'over'; return true; })", w); Ap.wait_for_timeout(800)
    finish(aidx)
    t('serie: Ale 1, Bea 0', Ap.evaluate('App.doc.series.wins[Net.uid]') == 1 and Ap.evaluate('App.doc.series.n') == 1)
    time.sleep(4)
    r = admin("select string_agg(p.username || ':' || r.won, ',' order by p.username) from results r join players p on p.id = r.player_id")
    t('risultati registrati da entrambi', r == 'Ale:true,Bea:false', r)
    Ap.evaluate("Net.send({t:'rematch'})"); Ap.wait_for_timeout(500); Ap.evaluate("Net.send({t:'start'})"); Ap.wait_for_function('App.doc.phase === "play"', timeout=10000)
    finish(Ap.evaluate('myIdx()'))
    t('serie vinta da Ale (2 su 3)', Ap.evaluate("App.doc.series.champ === Net.uid") and 'vince la serie' in Ap.evaluate('Score.standings(App.doc)'))
    Bp.wait_for_timeout(3500); Bp.evaluate("App.sheet = { kind: 'over' }; renderSheet()"); Bp.wait_for_timeout(400)
    t('schermata finale con la serie', 'vince la serie' in (Bp.inner_text('.sc-box') if Bp.locator('.sc-box').count() else ''))
    Bp.screenshot(path=os.path.join(os.environ.get('OUT', '/tmp'), 'series.png'))
    time.sleep(4)
    Bp.evaluate("App.sheet = null; renderSheet && renderSheet()"); Bp.wait_for_timeout(300)
    Bp.evaluate("Account.open('stats')")
    try: Bp.wait_for_function("document.querySelector('.pa-sheet') && document.querySelector('.pa-sheet').textContent.includes('Ultime partite')", timeout=8000)
    except Exception: pass
    s = Bp.inner_text('.pa-sheet'); t('statistiche di Bea', '0 vinte su 2' in s and 'Ale' in s and 'ultime partite' in s.lower(), s[:600])
    Bp.screenshot(path=os.path.join(os.environ.get('OUT', '/tmp'), 'stats.png'))
    Bp.evaluate('Account.close()')

    # ---- reazioni rapide ----
    Ap.evaluate("Net.send({t:'rematch'})"); Ap.wait_for_timeout(500); Ap.evaluate("Net.send({t:'start'})"); Ap.wait_for_function('App.doc.phase === "play"', timeout=10000); Bp.wait_for_timeout(800)
    Bp.evaluate("App.sheet = null; renderSheet && renderSheet()")
    btn = Ap.locator('[data-rx=open]'); t('pulsante reazioni nella barra in alto', btn.count() >= 1)
    btn.first.click(); Ap.wait_for_timeout(200); Ap.click('[data-rx=send][data-e="😂"]')
    try: Bp.wait_for_function("[...document.querySelectorAll('.rx-b')].some(b => b.textContent.includes('😂') && b.textContent.includes('Ale'))", timeout=5000); t('Bea vede la reazione di Ale', True)
    except Exception: t('Bea vede la reazione di Ale', False)
    Ap.screenshot(path=os.path.join(os.environ.get('OUT', '/tmp'), 'react.png'))

    # ---- «Continua la partita» in home ----
    Hp = Ap.context.new_page(); Hp.on('pageerror', lambda e: errs.append(str(e))); Hp.goto(S + '?' + BR); Hp.wait_for_timeout(4500)
    s = Hp.inner_text('#continue-slot'); t('home: «Continua la partita» con il tavolo in corso', 'Exploding Kittens' in s and code in s and 'Bea' in s, s)
    Hp.close()

    # ---- partita guidata in tutti i giochi ----
    for path in ['gattomina/', 'presagio/', 'polvere-e-piombo/', 'binari-italia/', 'campi-acciaio/']:
        G = ctx(); G.goto('http://localhost:8897/' + path + '?broker=ws://localhost:8897/'); G.wait_for_timeout(1200)
        G.fill('#nick', 'Prova'); G.click('[data-coach=start]')
        try: G.wait_for_function('App.doc && App.doc.practice && App.doc.phase === "play"', timeout=20000)
        except Exception: t(path + ' partita guidata avviata', False, G.evaluate('App.doc && [App.doc.phase, App.doc.seats.length]')); continue
        t(path + ' partita guidata avviata con i bot', G.evaluate('App.doc.seats.filter(s => s.bot).length') >= 2)
        t0 = time.time()
        while time.time() - t0 < 12 and not G.locator('.cx-bar').count():
            G.evaluate("App.sheet && (typeof closeSheet === 'function' ? closeSheet() : (App.sheet = null, renderSheet()))"); G.wait_for_timeout(500)
        t(path + ' guida nascosta sopra le finestre del gioco', G.evaluate("App.sheet = { kind: 'rules' }; (typeof renderSheet === 'function' ? renderSheet() : render()); 1") and (G.wait_for_timeout(900) or True) and G.locator('.cx-bar').count() == 0)
        G.evaluate("typeof closeSheet === 'function' ? closeSheet() : (App.sheet = null, renderSheet())"); G.wait_for_timeout(900)
        G.wait_for_selector('.cx-bar', timeout=5000); t(path + ' barra della guida', len(G.inner_text('.cx-bar')) > 20, G.inner_text('.cx-bar'))
        try:
            t0 = time.time()
            while time.time() - t0 < 45 and not G.locator('[data-coach=suggest]').count():
                G.evaluate("App.sheet && (typeof closeSheet === 'function' ? closeSheet() : (App.sheet = null, renderSheet()))"); G.wait_for_timeout(700)
            G.wait_for_selector('[data-coach=suggest]', timeout=3000)
            tip = G.inner_text('.cx-bar'); seq = G.evaluate('App.doc.rev')
            G.click('[data-coach=suggest]'); G.wait_for_timeout(2500)
            t(path + ' mossa consigliata giocata', 'mossa consigliata' in G.inner_text('.cx-bar') and G.evaluate('App.doc.rev') != seq, tip)
        except Exception as e: t(path + ' mossa consigliata giocata', False, str(e)[:120])
        G.screenshot(path=os.path.join(os.environ.get('OUT', '/tmp'), 'coach-' + path.strip('/') + '.png'))
        H = ctx(); H.goto('http://localhost:8897/' + path + '?broker=ws://localhost:8897/'); H.wait_for_timeout(3500)
        t(path + ' la prova non compare nella lista', 'Prova' not in H.inner_text('#olist'), H.inner_text('#olist'))
        H.context.close(); G.context.close()
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
