"""Tavolo «Invita amico» (privato): non compare nella lista, col solo codice non si entra,
ogni invito personale vale per una sola persona (che può rientrare), e tornando «aperto a tutti» si entra di nuovo.
Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
BASE = 'http://localhost:8897/'
Q = '?broker=ws://localhost:8897/'
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def phone(nick):
        c = br.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('ul-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e)))
        return pg
    def seated(P, nick): return P.evaluate("!!(App.doc && App.doc.seats.some(function(s){return s.nick===%s && s.uid===Net.uid}))" % json.dumps(nick))

    # la nuova scelta c'è in tutti i giochi
    for g in ['catan/', 'machiavelli/', 'gattomina/']:
        G = phone('Prova'); G.goto(BASE + g + Q); G.wait_for_timeout(800)
        t(g + ' scelta «Invita amico» all’apertura', G.locator('input[name=vis][value=direct]').count() == 1 and 'Invita amico' in G.inner_text('.vis-pick'))
        G.context.close()

    U = BASE + 'unlock/' + Q
    import random; HN = 'Host' + str(random.randint(1000, 9999))   # nome unico: nella lista possono restare tavoli di prove precedenti
    A = phone(HN); A.goto(U); A.wait_for_timeout(1000)
    A.check('input[name=vis][value=direct]'); A.click('[data-act=create]')
    A.wait_for_function('App.doc && App.doc.code', timeout=15000); code = A.evaluate('App.code')
    t('tavolo privato creato', A.evaluate('App.doc.vis') == 'direct' and 'solo chi riceve da te un invito personale' in A.inner_text('#app'))
    B = phone('Bea'); B.goto(U); B.wait_for_timeout(5000)
    t('nella lista dei tavoli non compare', HN not in B.inner_text('#olist'), B.inner_text('#olist')[:120])
    B.goto(U + '&t=' + code)
    try: B.wait_for_function("document.body.innerText.indexOf('privato') >= 0", timeout=10000); said = True
    except Exception: said = False
    t('col solo codice non si entra', not seated(B, 'Bea') and B.evaluate('App.screen') == 'lobby')
    t('…e lo dice', said)
    t('Ale non vede Bea al tavolo', A.evaluate('App.doc.seats.length') == 1)
    # invito personale dal pulsante della sala
    A.click('[data-act=invite]'); A.wait_for_selector('.pi-sheet', timeout=10000)
    link = A.evaluate('Lobby.lastInvite')
    t('invito personale con la chiave nel link', ('?t=' + code + '&k=') in link and 'una sola persona' in A.inner_text('.pi-sheet'))
    A.click('[data-pi=close]')
    t('nello stato del tavolo c’è solo l’impronta della chiave', link.split('&k=')[1] not in json.dumps(A.evaluate('App.doc')))
    C = phone('Cleo'); C.goto(link.replace('/unlock/?', '/unlock/' + Q + '&')); C.wait_for_function("App.doc && App.doc.seats.length === 2", timeout=15000); C.wait_for_timeout(500)
    t('Cleo entra con l’invito', seated(C, 'Cleo'))
    A.wait_for_function("App.doc.seats.length === 2", timeout=10000); A.wait_for_timeout(400)
    t('Ale vede l’invito usato', 'già usati: 1' in A.inner_text('.pinv'))
    D = phone('Dario'); D.goto(link.replace('/unlock/?', '/unlock/' + Q + '&')); D.wait_for_timeout(5000)
    t('lo stesso link non vale per Dario', not seated(D, 'Dario') and A.evaluate('App.doc.seats.length') == 2)
    C.goto(link.replace('/unlock/?', '/unlock/' + Q + '&')); C.wait_for_function("App.doc && App.doc.code", timeout=15000); C.wait_for_timeout(800)   # riapre il link (nelle prove la pagina ricaricata perderebbe il broker locale)
    t('Cleo rientra quando vuole', seated(C, 'Cleo'))
    # Cleo non può invitare
    C.evaluate("document.querySelector('[data-act=invite]').click()"); C.wait_for_timeout(400)
    t('solo l’host invita', C.locator('.pi-sheet').count() == 0 and 'solo chi l’ha aperto' in C.inner_text('body'))
    # di nuovo aperto a tutti
    A.select_option('#opt-vis', 'public'); A.wait_for_function("App.doc.vis === 'public'", timeout=10000)
    D.goto(U + '&t=' + code); D.wait_for_function("App.doc && App.doc.seats.length === 3", timeout=15000)
    t('aperto a tutti: Dario entra col codice', seated(D, 'Dario'))
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
