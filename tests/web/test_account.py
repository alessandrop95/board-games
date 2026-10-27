"""Account: accesso obbligatorio, registrazione, amici, inviti, annuncio dei tavoli, notifica mostrata dalla pagina, uscita.
Broker su 8897 e Supabase simulato su 8898."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
OUT = os.environ.get('OUT', '/tmp')
from playwright.sync_api import sync_playwright
import time, json, subprocess
S = OUT + '/'
B8 = 'http://localhost:8898/'; Q = 'broker=ws://localhost:8897/&annunci=1'
from pg import admin as sql
sql('delete from players; delete from notify_log; delete from login_fail;')
res = []
GET=lambda: json.loads(subprocess.run(['curl','-s',B8+'__sent'],capture_output=True,text=True).stdout)
BASE=len(GET())
def t(n, c, x=''):
    res.append(c); print(('OK  ' if c else 'NO  ') + n, x if not c else '')
with sync_playwright() as p:
    br = p.chromium.launch(); errs = []
    def ctx():
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        pg = c.new_page(); pg.on('response', lambda r: r.status >= 400 and print('HTTP', r.status, r.url)); pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and 'net::' not in m.text and 'fonts' not in m.text and errs.append(m.text))
        return pg
    A = ctx(); B = ctx()
    A.goto(B8 + 'binari-italia/?' + Q); A.wait_for_timeout(1200)
    uid0 = A.evaluate('Net.uid')
    t('pulsante Accedi nella lista tavoli', A.locator('[data-pa="open"][data-v="login"]').count() == 1)
    A.fill('#nick', 'Ale'); A.click('[data-act=create]'); A.wait_for_timeout(400)
    t('per aprire un tavolo serve l’account', A.locator('.pa-sheet').count() == 1 and 'serve un account' in A.inner_text('.pa-sheet'))
    A.screenshot(path=S + 'login.png')
    A.click('[data-pa="tab"][data-v="register"]'); A.fill('[name=u]', 'Ale'); A.fill('[name=p]', 'segreto1'); A.fill('[name=p2]', 'segreto2'); A.click('form [type=submit]'); A.wait_for_timeout(300)
    t('password diverse', 'non coincidono' in A.inner_text('.pa-sheet'))
    A.fill('[name=p2]', 'segreto1'); A.click('form [type=submit]'); A.wait_for_load_state('load'); A.wait_for_timeout(1500)
    t('registrato e ricaricato', 'Ale' in A.inner_text('[data-pa-chip]'), A.inner_text('body')[:200])
    uidA = A.evaluate("Net.uid"); t('identità del tavolo invariata dopo l’accesso', uidA == uid0, (uid0, uidA))
    # Bea dalla home
    B.goto(B8 + '?' + Q); B.wait_for_timeout(1200)
    B.click('[data-pa="open"][data-v="login"]'); B.click('[data-pa="tab"][data-v="register"]')
    B.fill('[name=u]', 'Ale'); B.fill('[name=p]', 'segreto1'); B.fill('[name=p2]', 'segreto1'); B.click('form [type=submit]'); B.wait_for_timeout(600)
    t('nome già preso', 'già preso' in B.inner_text('.pa-sheet'))
    B.fill('[name=u]', 'Bea'); B.click('form [type=submit]'); B.wait_for_load_state('load'); B.wait_for_timeout(1500)
    t('Bea registrata dalla home', 'Bea' in B.inner_text('#account-slot'))
    # Ale chiede l'amicizia a Bea
    A.click('[data-pa="open"][data-v="account"]'); A.wait_for_timeout(600)
    A.fill('[name=f]', 'bea'); A.click('[data-pa-form="friend"] [type=submit]'); A.wait_for_timeout(800)
    t('richiesta inviata', 'Richiesta inviata a Bea' in A.inner_text('.pa-sheet'), A.inner_text('.pa-sheet')[:300])
    A.screenshot(path=S + 'account.png'); A.click('[data-pa="close"]')
    B.reload(); B.wait_for_timeout(1800)
    t('Bea vede il numerino delle richieste', B.locator('[data-pa-chip] .n').count() == 1)
    B.click('#account-slot .pa-chip'); B.wait_for_timeout(700)
    t('richiesta in lista', 'Ale vuole essere tuo amico' in B.inner_text('.pa-sheet'))
    B.click('[data-pa="accept"][data-u="Ale"]'); B.wait_for_timeout(900)
    t('amici', 'Tu e Ale ora siete amici' in B.inner_text('.pa-sheet'), B.inner_text('.pa-sheet')[:300])
    B.screenshot(path=S + 'friends.png'); B.click('[data-pa="close"]')
    # iscrizione push finta per Bea (il servizio di notifiche vero non è raggiungibile da qui)
    keys = json.loads(subprocess.run(['node', '-e', "crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']).then(async k=>{const r=new Uint8Array(await crypto.subtle.exportKey('raw',k.publicKey));const b=x=>Buffer.from(x).toString('base64url');console.log(JSON.stringify({p:b(r),a:b(crypto.getRandomValues(new Uint8Array(16)))}))})"], capture_output=True, text=True).stdout)
    tokB = B.evaluate("Account.token")
    sql("select save_push('%s','https://push.example/bea','%s','%s',array['binari-italia']::text[],true,'test')" % (tokB, keys['p'], keys['a']))
    # Ale apre un tavolo pubblico: annuncio a Bea
    A.fill('#nick', 'Ale'); A.click('[data-act=create]'); A.wait_for_function('App.doc && App.doc.code', timeout=15000); A.wait_for_timeout(1500)
    sent = GET()[BASE:]
    t('nuovo tavolo annunciato a Bea', len(sent) == 1 and sent[0]['to'] == 'https://push.example/bea', sent)
    code = A.evaluate('App.code')
    t('pulsante «Invita un amico» nella sala', A.locator('[data-pa="openinvite"]').count() == 1)
    A.click('[data-pa="openinvite"]'); A.wait_for_timeout(800)
    A.screenshot(path=S + 'invite.png')
    A.click('[data-pa="invite"][data-u="Bea"]'); A.wait_for_timeout(900)
    t('invito mandato', 'Invito mandato a Bea' in A.inner_text('.pa-sheet'), A.inner_text('.pa-sheet')[:200])
    sent = GET()[BASE:]
    t('…arrivato al servizio di notifiche di Bea', len(sent) == 2)
    A.click('[data-pa="close"]')
    # una notifica arriva mentre l'app di Bea è aperta: la pagina mostra l'avviso
    B.evaluate("navigator.serviceWorker.register('/sw.js',{scope:'/'})"); B.wait_for_timeout(1500)
    cdp = B.context.new_cdp_session(B); regs = []
    cdp.on('ServiceWorker.workerRegistrationUpdated', lambda e: regs.extend(e['registrations']))
    cdp.send('ServiceWorker.enable'); B.wait_for_timeout(800)
    rid = [r['registrationId'] for r in regs if not r.get('isDeleted')][0]
    B.reload(); B.wait_for_timeout(1500)
    cdp.send('ServiceWorker.deliverPushMessage', {'origin': 'http://localhost:8898', 'registrationId': rid, 'data': json.dumps({'title': 'Ale ti invita a giocare', 'body': 'Tavolo ' + code + ' di Binari d’Italia: tocca per sederti.', 'url': B8 + 'binari-italia/?t=' + code + '&' + Q, 'kind': 'invite'})})
    B.wait_for_timeout(1200)
    t('avviso dentro la pagina aperta', B.locator('.ppa-banner').count() == 1 and 'ti invita' in B.inner_text('.ppa-banner'))
    B.screenshot(path=S + 'banner.png')
    B.click('.ppa-banner .ppa-go'); B.wait_for_timeout(2500)
    t('toccando l’avviso Bea si siede al tavolo', B.evaluate("App.doc && App.doc.seats.length") == 2, B.evaluate("location.href"))
    # uscita
    A.goto(B8 + 'binari-italia/?' + Q); A.wait_for_timeout(1000)
    devA = A.evaluate("Net.uid")
    A.evaluate("App.screen='lobby'; render()"); A.wait_for_timeout(300)
    A.click('[data-pa="open"][data-v="account"]'); A.wait_for_timeout(500); A.click('[data-pa="logout"]'); A.wait_for_load_state('load'); A.wait_for_timeout(1500)
    t('uscito: torna il pulsante Accedi', A.locator('[data-pa="open"][data-v="login"]').count() >= 1)
    t('identità del dispositivo ripristinata', A.evaluate("Net.uid") == devA and not devA.startswith('p'), (A.evaluate("Net.uid"), devA))
    print('errori pagina', errs[:6])
    br.close()
print('%d/%d prove superate' % (sum(res), len(res)))
sys.exit(0 if all(res) else 1)
