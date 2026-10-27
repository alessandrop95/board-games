"""Identità al tavolo per dispositivo, interruttore degli avvisi nella pagina, avvisi durante la partita,
iscrizione alle notifiche riparata da sola. Broker su 8897 e Supabase simulato su 8898."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
OUT = os.environ.get('OUT', '/tmp')
from playwright.sync_api import sync_playwright
import json, subprocess
B8 = 'http://localhost:8898/'; Q = 'broker=ws://localhost:8897/&annunci=1'
from pg import admin as sql
sql('delete from players; delete from notify_log; delete from login_fail;')
res = []
def t(n, c, x=''):
    res.append(c); print(('OK  ' if c else 'NO  ') + n, '' if c else x)
keys = json.loads(subprocess.run(['node', '-e', "crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']).then(async k=>{const r=new Uint8Array(await crypto.subtle.exportKey('raw',k.publicKey));const b=x=>Buffer.from(x).toString('base64url');console.log(JSON.stringify({p:b(r),a:b(crypto.getRandomValues(new Uint8Array(16)))}))})"], capture_output=True, text=True).stdout)
# finta iscrizione push del browser (Chromium senza servizio di notifiche): serve per provare la riparazione
FAKE = """
(() => {
  const saved = localStorage.getItem('__fakesub');
  const st = { sub: saved !== null ? (saved || null) : %s };
  Object.defineProperty(Notification, 'permission', { get: () => 'granted' });
  window.__fake = st;
  const mk = ep => ep && { endpoint: ep, options: {}, toJSON: () => ({ endpoint: ep, keys: { p256dh: '%s', auth: '%s' } }), unsubscribe: () => Promise.resolve(true) };
  const reg = { pushManager: { getSubscription: () => Promise.resolve(mk(st.sub)), subscribe: () => { st.sub = 'https://push.example/rinnovata'; localStorage.setItem('__fakesub', st.sub); return Promise.resolve(mk(st.sub)); } }, showNotification: () => Promise.resolve() };
  Object.defineProperty(ServiceWorkerContainer.prototype, 'ready', { get: () => Promise.resolve(reg) });
})();
"""
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def ctx(sub='null'):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.grant_permissions(['notifications'], origin='http://localhost:8898')
        c.add_init_script(FAKE % (sub, keys['p'], keys['a']))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        return pg
    def register(pg, name, login=False):
        pg.goto(B8 + '?' + Q); pg.wait_for_timeout(1000)
        pg.click('[data-pa="open"][data-v="login"]')
        if not login: pg.click('[data-pa="tab"][data-v="register"]')
        pg.fill('[name=u]', name); pg.fill('[name=p]', 'segreto1')
        if not login: pg.fill('[name=p2]', 'segreto1')
        pg.click('form [type=submit]'); pg.wait_for_load_state('load'); pg.wait_for_timeout(1300)

    # 1) identità per dispositivo
    A = ctx(); A.goto(B8 + 'binari-italia/?' + Q); A.wait_for_timeout(800); before = A.evaluate('Net.uid')
    register(A, 'Ale'); A.goto(B8 + 'binari-italia/?' + Q); A.wait_for_timeout(800)
    t('accedere non cambia l’identità al tavolo', A.evaluate('Net.uid') == before, (before, A.evaluate('Net.uid')))
    A2 = ctx(); register(A2, 'Ale', login=True); A2.goto(B8 + 'binari-italia/?' + Q); A2.wait_for_timeout(800)
    t('stesso account, due dispositivi: identità diverse', A2.evaluate('Net.uid') != A.evaluate('Net.uid') and A2.evaluate('Account.user() && Account.user().username') == 'Ale')
    # migrazione dalla versione precedente (pp-uid = account, pp-uid-dev = dispositivo)
    A2.evaluate("localStorage.setItem('pp-uid-dev','uvecchio123'); localStorage.setItem('pp-uid','p0123456789abcdef01234567')")
    A2.reload(); A2.wait_for_timeout(600); A2.reload(); A2.wait_for_timeout(800)
    t('identità del dispositivo ripristinata dopo l’aggiornamento', A2.evaluate('Net.uid') == 'uvecchio123' and A2.evaluate("localStorage.getItem('pp-uid-dev')") is None, A2.evaluate('Net.uid'))

    # 2) interruttore degli avvisi nella pagina
    A.evaluate("localStorage.setItem('pp-alerts','off')"); A.reload(); A.wait_for_timeout(900)
    A.click('[data-pa="open"][data-v="account"]'); A.wait_for_timeout(500)
    box = A.locator('[data-pp="inapp"]')
    t('interruttore «anche dentro l’app» presente e spento', box.count() == 1 and not box.is_checked())
    box.check(); A.wait_for_timeout(200)
    t('riaccendendolo gli avvisi tornano attivi', A.evaluate("localStorage.getItem('pp-alerts')") == 'on')
    A.click('[data-pa="close"]')

    # 3) iscrizione push riparata all'apertura
    B = ctx("'https://push.example/vecchia'"); register(B, 'Bea')
    tokB = B.evaluate('Account.token')
    sql("select save_push('%s','https://push.example/vecchia','%s','%s',array['binari-italia']::text[],true,'test')" % (tokB, keys['p'], keys['a']))
    B.evaluate("localStorage.setItem('pp-push','https://push.example/vecchia'); localStorage.removeItem('pp-push-sync'); localStorage.setItem('__fakesub', '')")
    B.reload(); B.wait_for_timeout(3500)
    eps = sql("select string_agg(endpoint, ' ') from push_subs")
    t('iscrizione persa dal browser: rifatta e salvata sul server', 'push.example/rinnovata' in eps and 'push.example/vecchia' not in eps, eps)
    t('…e ricordata sul dispositivo', B.evaluate("localStorage.getItem('pp-push')") == 'https://push.example/rinnovata')
    sql("delete from push_subs")
    B.reload(); B.wait_for_timeout(3000)
    t('stessa iscrizione, appena salvata: nessuna richiesta inutile', sql("select count(*) from push_subs") == '0')
    B.evaluate("localStorage.setItem('pp-push-sync','1')"); B.reload(); B.wait_for_timeout(3000)
    t('dopo un giorno la risalva (il server l’aveva scartata)', sql("select count(*) from push_subs") == '1')

    # F) notifiche con l'app aperta mentre si gioca
    B.goto(B8 + 'binari-italia/?' + Q); B.wait_for_timeout(1000)
    B.fill('#nick', 'Bea'); B.click('[data-act=create]'); B.wait_for_function('App.doc && App.doc.code', timeout=15000); B.wait_for_timeout(500)
    def push(kind):
        B.evaluate("""k => navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { type: 'push', data: { title: k === 'table' ? 'Nuovo tavolo: Wizard' : 'Ale ti invita a giocare', body: 'prova', url: '/presagio/?t=ABCD', kind: k } } }))""", kind)
        B.wait_for_timeout(300)
    push('table'); t('seduta al tavolo: nessun avviso di nuovo tavolo', B.locator('.ppa-banner').count() == 0)
    push('invite'); t('…ma l’invito di un amico compare', B.locator('.ppa-banner').count() == 1)
    B.evaluate("document.querySelector('.ppa-banner').remove()")
    B.goto(B8 + '?' + Q); B.wait_for_timeout(800)
    push('table'); t('in home: l’avviso di nuovo tavolo compare', B.locator('.ppa-banner').count() == 1)
    br.close()
print('errori pagina:', errs[:5])
print('%d/%d prove superate' % (sum(res), len(res)))
sys.exit(0 if all(res) else 1)
