# gioco: comuni
"""Accessi: password dimenticata con il codice di recupero, avviso a chi non ha il codice, dispositivi collegati ed
uscita dagli altri, accesso/uscita che si propagano alle altre schede, il «Siediti» che riprende da solo dopo l'accesso,
notifica «tocca a te» mandata dall'host a chi ha l'app in secondo piano.
Servono: broker su 8897, server finto su 8898 e database di prova (vedi tests/run.sh)."""
import json, os, sys, time, urllib.request, subprocess
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from pg import q, admin
from check import t, done
from playwright.sync_api import sync_playwright
S = 'http://localhost:8898/'; OUT = os.environ.get('OUT', '/tmp')
BR = 'broker=ws://localhost:8897/&annunci=1&presMs=6000&offMs=60000&turnPushMs=1500&hostTimeout=4000'
admin('delete from players; delete from notify_log; delete from login_fail;')
def reg(u): return json.loads(q("select register('%s','segreto1','Prova')" % u)[0])
def sent(): return json.loads(urllib.request.urlopen(S + '__sent').read())
VIS = """
window.__vis = 'visible';
Object.defineProperty(document, 'visibilityState', { configurable: true, get: function () { return window.__vis; } });
window.__hide = function () { window.__vis = 'hidden'; document.dispatchEvent(new Event('visibilitychange')); };
window.__show = function () { window.__vis = 'visible'; document.dispatchEvent(new Event('visibilitychange')); };
"""
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def ctx(session=None, vis=False):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        init = "try{localStorage.setItem('ng-intro-done','1')}catch(e){}"
        if session: init += "try{if(!localStorage.getItem('pp-session')&&!sessionStorage.getItem('out'))localStorage.setItem('pp-session',%s);localStorage.setItem('pp-nick',%s)}catch(e){}" % (json.dumps(json.dumps({k: session[k] for k in ('token', 'id', 'username')})), json.dumps(session['username']))
        c.add_init_script(init + (VIS if vis else ''))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        return pg
    def go(pg, path, extra=''): pg.goto(S + path + '?' + BR + extra); pg.wait_for_timeout(1300)
    def wait(pg, js, ms=12000):
        try: pg.wait_for_function(js, timeout=ms); return True
        except Exception: return False

    # ---------- password dimenticata ----------
    A = ctx(); go(A, '')
    A.click('[data-pa="open"][data-v="login"]'); A.click('[data-pa="tab"][data-v="register"]')
    A.fill('[name=u]', 'Ale'); A.fill('[name=p]', 'segreto1'); A.fill('[name=p2]', 'segreto1'); A.click('form [type=submit]')
    A.wait_for_selector('.pa-code'); code = A.inner_text('.pa-code').strip()
    A.click('[data-pa="close"]'); A.wait_for_load_state('load'); A.wait_for_timeout(1200)
    t('registrata', 'Ale' in A.inner_text('#account-slot'))
    A.click('#account-slot .pa-chip'); A.wait_for_timeout(900)
    s = A.inner_text('.pa-sheet')
    t('scheda account: dispositivo collegato', 'questo dispositivo' in s and 'Sei collegato solo da qui' in s, s[-500:])
    t('nessun avviso se il codice c’è', 'Non hai ancora un codice' not in s)
    A.screenshot(path=os.path.join(OUT, 'account-dispositivi.png'))
    A.click('[data-pa="logout"]'); A.wait_for_load_state('load'); A.wait_for_timeout(1000)
    A.click('[data-pa="open"][data-v="login"]'); A.click('[data-pa="go"][data-v="recover"]')
    t('«Password dimenticata?» apre il recupero', 'codice di recupero' in A.inner_text('.pa-sheet'))
    A.fill('[name=u]', 'ale'); A.fill('[name=c]', 'AAAA-BBBB-CCCC'); A.fill('[name=p]', 'nuova123'); A.click('form [type=submit]'); A.wait_for_timeout(900)
    t('codice sbagliato: errore chiaro', 'sbagliati' in A.inner_text('.pa-sheet'), A.inner_text('.pa-sheet')[:300])
    A.screenshot(path=os.path.join(OUT, 'recupero.png'))
    A.fill('[name=c]', code.lower()); A.click('form [type=submit]'); A.wait_for_selector('.pa-code', timeout=8000)
    code2 = A.inner_text('.pa-code').strip()
    t('codice giusto: password cambiata e codice nuovo', code2 != code and len(code2) == 14, code2)
    A.click('[data-pa="close"]'); A.wait_for_load_state('load'); A.wait_for_timeout(1200)
    t('…e si è già dentro', 'Ale' in A.inner_text('#account-slot'))
    t('la nuova password funziona, la vecchia no', 'token' in q("select login('ale','nuova123')")[0] and 'sbagliati' in q("select login('ale','segreto1')")[0])

    # ---------- account senza codice: avviso e creazione ----------
    admin("update players set recovery_hash = null where uname = 'ale'")
    A.reload(); A.wait_for_timeout(1300); A.click('#account-slot .pa-chip'); A.wait_for_timeout(900)
    t('account senza codice: avviso nella scheda', 'Non hai ancora un codice di recupero' in A.inner_text('.pa-sheet'))
    A.click('.pa-warn [data-pa="rec"]'); A.fill('[name=r]', 'sbagliata'); A.click('[data-pa-form="recovery"] [type=submit]'); A.wait_for_timeout(700)
    t('per creare il codice serve la password', 'Password sbagliata' in A.inner_text('.pa-sheet'))
    A.fill('[name=r]', 'nuova123'); A.click('[data-pa-form="recovery"] [type=submit]'); A.wait_for_selector('.pa-code', timeout=8000)
    t('codice creato', len(A.inner_text('.pa-code').strip()) == 14)
    A.click('[data-pa="close"]'); A.wait_for_timeout(600)
    t('dopo averlo visto si resta nella pagina (niente ricarica)', A.locator('.pa-sheet').count() == 0 and 'Ale' in A.inner_text('#account-slot'))

    # ---------- dispositivi: un secondo telefono, poi «Esci dagli altri» ----------
    A2 = ctx(); go(A2, '')
    A2.click('[data-pa="open"][data-v="login"]'); A2.fill('[name=u]', 'Ale'); A2.fill('[name=p]', 'nuova123'); A2.click('form [type=submit]'); A2.wait_for_load_state('load'); A2.wait_for_timeout(1300)
    t('secondo dispositivo collegato', 'Ale' in A2.inner_text('#account-slot'))
    A.click('#account-slot .pa-chip'); A.wait_for_timeout(1000)
    t('due dispositivi in elenco', A.locator('.pa-sheet .pa-list .pa-row').count() >= 2 and 'ultimo uso' in A.inner_text('.pa-sheet') and A.locator('[data-pa="others"]').count() == 1, A.inner_text('.pa-sheet')[-400:])
    A.click('[data-pa="others"]'); A.wait_for_timeout(1000)
    t('uscita dagli altri dispositivi', 'dovranno accedere di nuovo' in A.inner_text('.pa-sheet') and A.locator('[data-pa="others"]').count() == 0, A.inner_text('.pa-sheet')[:300])
    A.click('[data-pa="close"]')
    A2.reload(); A2.wait_for_timeout(1800)
    t('l’altro dispositivo torna ad «Accedi»', A2.locator('[data-pa="open"][data-v="login"]').count() >= 1)

    # ---------- due schede dello stesso telefono ----------
    T2 = A.context.new_page(); T2.goto(S + 'nograzie/?' + BR); T2.wait_for_timeout(1300)
    t('seconda scheda: già dentro', 'Ale' in T2.inner_text('[data-pa-chip]'))
    A.click('#account-slot .pa-chip'); A.wait_for_timeout(600); A.click('[data-pa="logout"]'); A.wait_for_load_state('load')
    t('esco in una scheda: l’altra se ne accorge da sola', wait(T2, "document.querySelector('[data-pa=\"open\"][data-v=\"login\"]') && !Account.user()", 6000))
    T2.close()

    # ---------- «Siediti» a un tavolo → accesso → ci si siede da soli ----------
    H = reg('Rita'); Hp = ctx(H, vis=True); go(Hp, 'nograzie/')
    Hp.click('[data-act=create]'); wait(Hp, 'App.doc && App.doc.code'); tcode = Hp.evaluate('App.code')
    N = ctx(vis=True); go(N, 'nograzie/'); N.wait_for_timeout(1500)
    ok = wait(N, "!!document.querySelector('#olist [data-act=lobbyjoin]')", 10000)
    t('il tavolo di Rita è nella lista', ok, N.inner_text('#olist') if N.locator('#olist').count() else '')
    N.locator('#olist [data-act=lobbyjoin]').first.click(); N.wait_for_selector('.pa-sheet')
    N.click('[data-pa="tab"][data-v="register"]')
    t('passando da Accedi a Registrati il motivo resta', 'serve un account' in N.inner_text('.pa-sheet'))
    N.fill('[name=u]', 'Sam'); N.fill('[name=p]', 'segreto1'); N.fill('[name=p2]', 'segreto1'); N.click('form [type=submit]')
    N.wait_for_selector('.pa-code'); N.click('[data-pa="close"]'); N.wait_for_load_state('load')
    t('dopo l’accesso Sam si ritrova seduto al tavolo scelto', wait(N, "window.App && App.doc && App.doc.code === '%s' && App.doc.seats.some(function (s) { return s.uid === Net.uid && s.acct === 'Sam' })" % tcode, 15000), N.evaluate('location.href'))

    # ---------- «tocca a te» a chi ha l'app in secondo piano ----------
    Sm = json.loads(q("select login('sam','segreto1')")[0])
    K = json.loads(subprocess.run(['node', '-e', "crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']).then(async k=>{const r=new Uint8Array(await crypto.subtle.exportKey('raw',k.publicKey));const b=x=>Buffer.from(x).toString('base64url');console.log(JSON.stringify({p:b(r),a:b(crypto.getRandomValues(new Uint8Array(16)))}))})"], capture_output=True, text=True).stdout)
    q("select save_push('%s','https://push.example/sam','%s','%s',array[]::text[],true,'test')" % (Sm['token'], K['p'], K['a']))
    wait(Hp, 'App.doc.seats.length === 2'); Hp.click('[data-act=addbot]'); wait(Hp, 'App.doc.seats.length === 3')
    Hp.evaluate("Net.send({t:'opt',timer:0})"); Hp.wait_for_timeout(300); Hp.click('[data-act=start]')
    for pg in (Hp, N): wait(pg, 'App.doc && App.doc.game')
    Hp.evaluate('Account.presence()'); N.evaluate('Account.presence()'); time.sleep(1.5)
    isam = N.evaluate('myIdx()'); irita = Hp.evaluate('myIdx()')
    Hp.evaluate("Net.hostApply(function(cur){cur.game.turn=%d;cur.game.seq++;return true})" % irita); wait(Hp, 'G().turn === myIdx()')
    n0 = len(sent())
    N.evaluate('__hide()'); wait(Hp, "Net.presence(App.doc.game.players[%d].uid) === 'away'" % isam, 8000)
    time.sleep(3)
    t('finché non tocca a lui, nessuna notifica', len(sent()) == n0, sent()[n0:])
    Hp.evaluate("act({a:'take'})"); Hp.wait_for_timeout(300)
    Hp.evaluate("Net.hostApply(function(cur){cur.game.turn=%d;cur.game.seq++;return true})" % isam)
    time.sleep(5)
    news = sent()[n0:]
    t('tocca a Sam che ha l’app in secondo piano: gli arriva «Tocca a te»', [x['to'] for x in news] == ['https://push.example/sam'], news)
    time.sleep(4)
    t('…una volta sola', len(sent()) == n0 + 1, sent()[n0:])
    N.evaluate('__show()')
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
