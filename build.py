#!/usr/bin/env python3
"""Genera le pagine dei giochi (un unico index.html autonomo per gioco) dai file in src/.
Uso: python3 build.py"""
import os
ROOT = os.path.dirname(os.path.abspath(__file__))
def r(*p): return open(os.path.join(ROOT, *p), encoding='utf-8').read()

def page(title, desc, theme, fonts, css, js, short):
    return f'''<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="{theme}">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="{short}">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="pwa-sw" content="../sw.js" data-scope="../">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{fonts}&display=swap">
<style>
{css}
</style>
</head>
<body>
<div id="app"></div>
<div id="sheet"></div>
<script>
{js}
</script>
</body>
</html>
'''

net = r('src', 'shared', 'net.js') + '\n' + r('src', 'shared', 'turns.js') + '\n' + r('src', 'shared', 'install.js') + '\n' + r('src', 'shared', 'lobby.js') + '\n' + r('src', 'shared', 'nav.js') + '\n' + r('src', 'shared', 'chat.js') + '\n' + r('src', 'shared', 'audio.js') + '\n' + r('src', 'shared', 'alerts.js') + '\n' + r('src', 'shared', 'account.js')

def build_pp():
    pp = 'src/polvere-e-piombo/'
    pp_css = 'html{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}\n' + r(pp, 'style.css')
    pp_js = "window.GAME_PREFIX = 'polvere-piombo/v1/';\n" + '\n'.join(r(pp, f) for f in ['data.js', 'engine.js', 'bot.js', 'cards.js', 'fx.js']) + '\n' + net + '\n' + r(pp, 'sound.js') + '\n' + r(pp, 'ui.js')
    open(os.path.join(ROOT, 'polvere-e-piombo', 'index.html'), 'w', encoding='utf-8').write(page(
        'Bang!', 'Gioco di carte western a ruoli segreti, da 4 a 7 giocatori, ognuno dal proprio telefono.', '#1d140e',
        'family=Courier+Prime:wght@400;700&family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&family=Rye', pp_css, pp_js, 'Polvere&amp;Piombo'))

def build_pr():
    pr = 'src/presagio/'
    pr_js = "window.GAME_PREFIX = 'presagio/v1/';\n" + net + '\n' + '\n'.join(r(pr, f) for f in ['engine.js', 'bot.js', 'cards.js', 'table.js', 'sound.js', 'ui.js'])
    open(os.path.join(ROOT, 'presagio', 'index.html'), 'w', encoding='utf-8').write(page(
        'Wizard', 'Gioco di carte a prese con previsione, da 3 a 6 giocatori, ognuno dal proprio telefono.', '#06050d',
        'family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=Cormorant+Garamond:wght@500;600;700', r(pr, 'style.css'), pr_js, 'Presagio'))

def build_gm():
    gm = 'src/gattomina/'
    gm_js = "window.GAME_PREFIX = 'gattomina/v1/';\n" + net + '\n' + '\n'.join(r(gm, f) for f in ['engine.js', 'bot.js', 'cards.js', 'table.js', 'sound.js', 'ui.js'])
    open(os.path.join(ROOT, 'gattomina', 'index.html'), 'w', encoding='utf-8').write(page(
        'Exploding Kittens', 'Gioco di carte esplosivo con i gatti, da 2 a 5 giocatori, ognuno dal proprio telefono.', '#2a1446',
        'family=Fredoka:wght@400;500;600;700&family=Luckiest+Guy', r(gm, 'style.css'), gm_js, 'Gattomina'))

def build_ca():
    ca = 'src/campi-acciaio/'
    ca_js = "window.GAME_PREFIX = 'campi-acciaio/v1/';\n" + '\n'.join(r(ca, f) for f in ['data.js', 'engine.js', 'bot.js', 'terrain.js', 'art.js', 'board.js', 'rules.js']) + '\n' + net + '\n' + '\n'.join(r(ca, f) for f in ['sound.js', 'ui.js', 'view.js', 'sheets.js'])
    open(os.path.join(ROOT, 'campi-acciaio', 'index.html'), 'w', encoding='utf-8').write(page(
        'Scythe', 'Strategia dieselpunk: cinque fazioni si contendono le campagne intorno a una Fabbrica di mech. Da 2 a 5 giocatori, ognuno dal proprio telefono.', '#1c1915',
        'family=Big+Shoulders+Display:wght@600;700;800&family=Alegreya+Sans:ital,wght@0,400;0,500;0,700;1,400', r(ca, 'style.css'), ca_js, 'Campi d’Acciaio'))

def build_bi():
    bi = 'src/binari-italia/'
    bi_js = "window.GAME_PREFIX = 'binari-italia/v1/';\n" + '\n'.join(r(bi, f) for f in ['data.js', 'engine.js', 'bot.js', 'painter.js', 'art.js', 'board.js', 'rules.js']) + '\n' + net + '\n' + '\n'.join(r(bi, f) for f in ['sound.js', 'ui.js', 'view.js', 'sheets.js'])
    open(os.path.join(ROOT, 'binari-italia', 'index.html'), 'w', encoding='utf-8').write(page(
        'Binari d’Italia', 'Gioco di treni e tratte ferroviarie sulla mappa d’Italia: collega le città dei tuoi biglietti. Da 2 a 5 giocatori, ognuno dal proprio telefono.', '#102027',
        'family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;0,6..96,700;0,6..96,800;1,6..96,500&family=Barlow:wght@400;500;600;700;800', r(bi, 'style.css'), bi_js, 'Binari d’Italia'))

# Uso: python3 build.py [giochi…]  (senza argomenti li ricostruisce tutti)
# Nomi: polvere-e-piombo, presagio, gattomina, campi-acciaio, binari-italia
GAMES = {'polvere-e-piombo': build_pp, 'presagio': build_pr, 'gattomina': build_gm, 'campi-acciaio': build_ca, 'binari-italia': build_bi}
import sys
for name in (sys.argv[1:] or list(GAMES)):
    GAMES[name]()
print('ok')
