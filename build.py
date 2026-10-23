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

net = r('src', 'shared', 'net.js') + '\n' + r('src', 'shared', 'turns.js') + '\n' + r('src', 'shared', 'install.js') + '\n' + r('src', 'shared', 'lobby.js') + '\n' + r('src', 'shared', 'nav.js') + '\n' + r('src', 'shared', 'chat.js')

pp = 'src/polvere-e-piombo/'
pp_css = 'html{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}\n' + r(pp, 'style.css')
pp_js = "window.GAME_PREFIX = 'polvere-piombo/v1/';\n" + '\n'.join(r(pp, f) for f in ['data.js', 'engine.js', 'bot.js', 'art.js']) + '\n' + net + '\n' + r(pp, 'ui.js')
open(os.path.join(ROOT, 'polvere-e-piombo', 'index.html'), 'w', encoding='utf-8').write(page(
    'Polvere &amp; Piombo', 'Gioco di carte western a ruoli segreti, da 4 a 7 giocatori, ognuno dal proprio telefono.', '#1d140e',
    'family=Courier+Prime:wght@400;700&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Sancreek', pp_css, pp_js, 'Polvere&amp;Piombo'))

pr = 'src/presagio/'
pr_js = "window.GAME_PREFIX = 'presagio/v1/';\n" + net + '\n' + '\n'.join(r(pr, f) for f in ['engine.js', 'bot.js', 'art.js', 'ui.js'])
open(os.path.join(ROOT, 'presagio', 'index.html'), 'w', encoding='utf-8').write(page(
    'Presagio', 'Gioco di carte a prese con previsione, da 3 a 6 giocatori, ognuno dal proprio telefono.', '#12142a',
    'family=Cinzel:wght@400;700&family=EB+Garamond:wght@400;600;700&family=Uncial+Antiqua', r(pr, 'style.css'), pr_js, 'Presagio'))
print('ok')
