"""Lista dei tavoli aperti dopo che l'app è rimasta «addormentata» (in background i messaggi non arrivano):
al risveglio la lista si richiede da sola al server ogni 5 secondi, quindi compaiono i tavoli aperti nel frattempo
e spariscono quelli chiusi, senza aspettare il segnale dell'host (20 s) o la scadenza (150 s).
Vale per la home di un gioco e per la home della raccolta. Serve: broker su 8897 (vedi tests/run.sh)."""
import json, os, sys, time, random
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))
from check import t, done
from playwright.sync_api import sync_playwright
BR = 'broker=ws://localhost:8897/'
G = 'http://localhost:8897/skyjo/?' + BR
HOME = 'http://localhost:8897/?' + BR
errs = []
NB, NC = 'Ugo%03d' % random.randint(0, 999), 'Ivo%03d' % random.randint(0, 999)   # nomi unici: altre prove lasciano tavoli aperti
# «addormenta» la connessione: i messaggi in arrivo si perdono, come con l'app in background
FREEZE = "(function(){var c=Net._debug().clients[0]; c._om=c.ws.onmessage; c.ws.onmessage=function(){}; })()"
WAKE = "(function(){var c=Net._debug().clients[0]; c.ws.onmessage=c._om; c.lastRx=Date.now(); document.dispatchEvent(new Event('visibilitychange')); })()"
with sync_playwright() as p:
    br = p.chromium.launch()
    def page(nick, url):
        c = br.new_context(viewport={'width': 390, 'height': 844})
        c.add_init_script("try{localStorage.setItem('pp-nick',%s);localStorage.setItem('sk-intro-done','1')}catch(e){}" % json.dumps(nick))
        pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(nick + ': ' + str(e))); pg.goto(url)
        return pg
    def wait_text(P, sel, txt, present, limit):
        t0 = time.time()
        while time.time() - t0 < limit:
            s = P.inner_text(sel)
            if (txt in s) == present: return time.time() - t0
            P.wait_for_timeout(250)
        return None

    L = page('Ale', G); L.wait_for_function("document.querySelector('#olist') && !/Cerco/.test(document.querySelector('#olist').innerText)", timeout=15000)
    t('la lista si carica', NB not in L.inner_text('#olist'), L.inner_text('#olist'))
    Hm = page('Ale', HOME); Hm.wait_for_function("!/Cerco/.test(document.getElementById('open-tables').innerText)", timeout=15000)

    # --- un tavolo aperto mentre la lista dorme ---
    L.evaluate(FREEZE); Hm.evaluate(FREEZE)
    B = page(NB, G); B.wait_for_timeout(800)
    B.click('[data-act=create]'); B.wait_for_function('App.doc && App.doc.code', timeout=15000); code = B.evaluate('App.code')
    B.wait_for_timeout(2500)
    t('mentre dorme la lista non sa niente del nuovo tavolo', NB not in L.inner_text('#olist') and NB not in Hm.inner_text('#open-tables'))
    L.evaluate(WAKE); Hm.evaluate(WAKE)
    s1 = wait_text(L, '#olist', 'Tavolo di ' + NB, True, 9)
    t('al risveglio il tavolo compare da solo in pochi secondi (gioco)', s1 is not None, s1)
    s2 = wait_text(Hm, '#open-tables', NB, True, 9)
    t('al risveglio il tavolo compare anche nella home della raccolta', s2 is not None, s2)

    # --- un tavolo chiuso mentre la lista dorme ---
    L.evaluate(FREEZE); Hm.evaluate(FREEZE)
    B.evaluate('Net.closeTable()'); B.wait_for_timeout(2500)
    t('mentre dorme il tavolo chiuso resta in lista', 'Tavolo di ' + NB in L.inner_text('#olist'))
    L.evaluate(WAKE); Hm.evaluate(WAKE)
    s3 = wait_text(L, '#olist', 'Tavolo di ' + NB, False, 10)
    t('al risveglio il tavolo chiuso sparisce da solo (gioco)', s3 is not None, s3)
    s4 = wait_text(Hm, '#open-tables', NB, False, 10)
    t('al risveglio il tavolo chiuso sparisce anche dalla home', s4 is not None, s4)

    # --- senza «risveglio» esplicito: basta l'aggiornamento ogni 5 secondi ---
    B2 = page(NC, G); B2.wait_for_timeout(800)
    L.evaluate(FREEZE)
    B2.click('[data-act=create]'); B2.wait_for_function('App.doc && App.doc.code', timeout=15000); B2.wait_for_timeout(1500)
    L.evaluate("(function(){var c=Net._debug().clients[0]; c.ws.onmessage=c._om; c.lastRx=Date.now(); })()")
    s5 = wait_text(L, '#olist', 'Tavolo di ' + NC, True, 8)
    t('la lista si aggiorna da sola ogni 5 secondi', s5 is not None, s5)
    B2.evaluate('Net.closeTable()'); B2.wait_for_timeout(800)
    br.close()
t('nessun errore nelle pagine', not errs, errs[:4])
done()
