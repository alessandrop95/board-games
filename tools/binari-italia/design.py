"""Rete di Binari d'Italia: città (coordinate reali, con piccoli spostamenti per la leggibilità),
tratte con lunghezza, colore, doppie e traghetti. Produce net.json e un'anteprima SVG."""
import os
import json, math, sys, collections
D = os.path.dirname(os.path.abspath(__file__)) + '/'
geo = json.load(open(D + 'geo.json')); W, H = geo['W'], geo['H']
LON0, LAT1 = 6.3, 47.4; K = math.cos(math.radians(42)); S = 100.0
def P(lat, lon): return ((lon - LON0) * K * S, (LAT1 - lat) * S)

# id: (nome, lat, lon, spostamento dx, dy in px per leggibilità)
CITIES = {
 'aosta': ('Aosta', 45.737, 7.320, 0, 0),
 'torino': ('Torino', 45.070, 7.687, 0, 0),
 'cuneo': ('Cuneo', 44.384, 7.543, 0, 0),
 'ventimiglia': ('Ventimiglia', 43.790, 7.608, 0, 0),
 'genova': ('Genova', 44.405, 8.946, 0, 0),
 'laspezia': ('La Spezia', 44.103, 9.824, 0, 0),
 'milano': ('Milano', 45.464, 9.190, 0, 0),
 'domodossola': ('Domodossola', 46.115, 8.292, 0, 0),
 'brescia': ('Brescia', 45.541, 10.212, 0, 0),
 'verona': ('Verona', 45.438, 10.992, 0, 0),
 'trento': ('Trento', 46.067, 11.121, 0, 0),
 'bolzano': ('Bolzano', 46.498, 11.354, 0, 0),
 'venezia': ('Venezia', 45.440, 12.316, 0, 0),
 'udine': ('Udine', 46.071, 13.235, 0, 0),
 'trieste': ('Trieste', 45.650, 13.777, 0, 0),
 'parma': ('Parma', 44.801, 10.328, 0, 0),
 'bologna': ('Bologna', 44.494, 11.343, 0, 0),
 'rimini': ('Rimini', 44.059, 12.568, 0, 0),
 'firenze': ('Firenze', 43.769, 11.256, 0, 0),
 'pisa': ('Pisa', 43.716, 10.402, 0, 0),
 'grosseto': ('Grosseto', 42.760, 11.113, 0, 0),
 'perugia': ('Perugia', 43.110, 12.389, 0, 0),
 'ancona': ('Ancona', 43.616, 13.519, 0, 0),
 'pescara': ('Pescara', 42.462, 14.214, 0, 0),
 'laquila': ("L'Aquila", 42.350, 13.399, 0, 0),
 'roma': ('Roma', 41.903, 12.496, 0, 0),
 'civitavecchia': ('Civitavecchia', 42.093, 11.797, 0, 0),
 'napoli': ('Napoli', 40.852, 14.268, 0, 0),
 'salerno': ('Salerno', 40.683, 14.768, 0, 0),
 'foggia': ('Foggia', 41.462, 15.545, 0, 0),
 'bari': ('Bari', 41.117, 16.872, 0, 0),
 'potenza': ('Potenza', 40.640, 15.806, 0, 0),
 'taranto': ('Taranto', 40.464, 17.247, 0, 0),
 'lecce': ('Lecce', 40.352, 18.175, 0, 0),
 'cosenza': ('Cosenza', 39.299, 16.254, 0, 0),
 'reggio': ('Reggio Calabria', 38.111, 15.647, 14, 12),
 'messina': ('Messina', 38.193, 15.554, -22, -8),
 'palermo': ('Palermo', 38.116, 13.361, 0, 0),
 'catania': ('Catania', 37.502, 15.087, 0, 0),
 'agrigento': ('Agrigento', 37.311, 13.577, 0, 0),
 'olbia': ('Olbia', 40.923, 9.498, 0, 0),
 'sassari': ('Sassari', 40.727, 8.560, 0, 0),
 'cagliari': ('Cagliari', 39.224, 9.122, 0, 0),
}
pos = {k: (round(P(v[1], v[2])[0] + v[3], 1), round(P(v[1], v[2])[1] + v[4], 1)) for k, v in CITIES.items()}

# Paesi confinanti (regole di Ticket to Ride Italy): ogni tratta verso un Paese finisce in un suo «valico»,
# un vicolo cieco; valichi diversi dello stesso Paese non sono collegati tra loro. Posizioni in px sulla carta.
ZONES = {'francia': 'Francia', 'svizzera': 'Svizzera', 'austria': 'Austria', 'slovenia': 'Slovenia'}
GATES = {  # id: (paese, x, y)
 'fr-aosta': ('francia', 40, 210), 'fr-torino': ('francia', 42, 268), 'fr-ventimiglia': ('francia', 46, 404),
 'ch-aosta': ('svizzera', 108, 96), 'ch-domodossola': ('svizzera', 186, 58), 'ch-milano': ('svizzera', 262, 104),
 'at-bolzano': ('austria', 410, 30), 'at-udine': ('austria', 520, 58),
 'si-udine': ('slovenia', 606, 122), 'si-trieste': ('slovenia', 628, 214),
}
for k, (z, x, y) in GATES.items(): pos[k] = (float(x), float(y))

# Regioni (bonus a fine partita): ogni città appartiene a una regione
REGIONS = {
 'valledaosta': ("Valle d'Aosta", ['aosta']), 'piemonte': ('Piemonte', ['torino', 'cuneo', 'domodossola']),
 'liguria': ('Liguria', ['ventimiglia', 'genova', 'laspezia']), 'lombardia': ('Lombardia', ['milano', 'brescia']),
 'trentino': ('Trentino-Alto Adige', ['trento', 'bolzano']), 'veneto': ('Veneto', ['verona', 'venezia']),
 'friuli': ('Friuli-Venezia Giulia', ['udine', 'trieste']), 'emilia': ('Emilia-Romagna', ['parma', 'bologna', 'rimini']),
 'toscana': ('Toscana', ['firenze', 'pisa', 'grosseto']), 'umbria': ('Umbria', ['perugia']), 'marche': ('Marche', ['ancona']),
 'abruzzo': ('Abruzzo', ['pescara', 'laquila']), 'lazio': ('Lazio', ['roma', 'civitavecchia']), 'campania': ('Campania', ['napoli', 'salerno']),
 'puglia': ('Puglia', ['foggia', 'bari', 'taranto', 'lecce']), 'basilicata': ('Basilicata', ['potenza']), 'calabria': ('Calabria', ['cosenza', 'reggio']),
 'sicilia': ('Sicilia', ['palermo', 'messina', 'catania', 'agrigento']), 'sardegna': ('Sardegna', ['olbia', 'sassari', 'cagliari']),
}
SPECIAL = ['puglia', 'sicilia', 'sardegna']   # valgono 2 regioni se tutte le loro città sono nella stessa rete

# (a, b, colore | 'grey', [lunghezza forzata], doppia: colore della seconda, traghetto: n locomotive)
# colori: R rosso, B blu, G verde, Y giallo, O arancio, K nero, W bianco, P viola, X grigio
ROUTES = [
 ('aosta', 'torino', 'K'), ('aosta', 'domodossola', 'X'), 
 ('torino', 'milano', 'R', None, 'G'), ('torino', 'genova', 'O'), ('torino', 'cuneo', 'X'),
 ('cuneo', 'ventimiglia', 'P'), ('cuneo', 'genova', 'X'),
 ('ventimiglia', 'genova', 'B'),
 ('genova', 'milano', 'W', None, 'K'), ('genova', 'laspezia', 'R'),
 ('milano', 'domodossola', 'G'), ('milano', 'brescia', 'B', None, 'O'), ('milano', 'parma', 'P'),
 ('domodossola', 'bolzano', 'X', 6),
 ('brescia', 'verona', 'Y'), ('brescia', 'trento', 'W'), ('brescia', 'parma', 'X'),
 ('verona', 'trento', 'R'), ('trento', 'bolzano', 'X'), ('bolzano', 'udine', 'B'),
 ('verona', 'venezia', 'G', None, 'P'), ('verona', 'bologna', 'K'),
 ('venezia', 'udine', 'O'), ('venezia', 'trieste', 'Y'), ('udine', 'trieste', 'X'),
 ('venezia', 'bologna', 'W'), ('venezia', 'rimini', 'R'),
 ('parma', 'bologna', 'O', None, 'Y'), ('parma', 'laspezia', 'G'),
 ('bologna', 'firenze', 'B', None, 'R'), ('bologna', 'rimini', 'P'),
 ('laspezia', 'pisa', 'X'), ('pisa', 'firenze', 'K'), ('pisa', 'grosseto', 'Y'), ('grosseto', 'civitavecchia', 'P'), ('firenze', 'grosseto', 'X'), 
 ('firenze', 'perugia', 'O'), ('firenze', 'roma', 'W', None, 'G'),
 
 ('rimini', 'ancona', 'K'), ('perugia', 'ancona', 'B'), ('perugia', 'roma', 'R'), ('perugia', 'laquila', 'X'),
 ('ancona', 'pescara', 'W'), 
 ('pescara', 'laquila', 'Y'), ('laquila', 'roma', 'B'), ('pescara', 'foggia', 'R'),
 ('roma', 'civitavecchia', 'O'), ('roma', 'napoli', 'K', None, 'Y'),
 ('napoli', 'salerno', 'X'), ('napoli', 'foggia', 'P'),
 ('foggia', 'bari', 'O'), ('bari', 'taranto', 'B'), ('bari', 'lecce', 'W'), ('taranto', 'lecce', 'X'),
 ('foggia', 'potenza', 'X'), ('salerno', 'potenza', 'P'), ('potenza', 'taranto', 'K'), ('potenza', 'bari', 'Y'),
 ('salerno', 'cosenza', 'O'), ('taranto', 'cosenza', 'G'),
 ('cosenza', 'reggio', 'R', None, 'B'),
 ('reggio', 'messina', 'X', 1, None, 1),
 ('messina', 'palermo', 'W'), ('messina', 'catania', 'K'), ('palermo', 'agrigento', 'B'),
 ('catania', 'agrigento', 'Y'), ('palermo', 'catania', 'X'),
 ('olbia', 'sassari', 'X'), ('sassari', 'cagliari', 'G'), ('olbia', 'cagliari', 'P'),
 ('civitavecchia', 'olbia', 'X', 4, None, 3),
 ('napoli', 'palermo', 'X', 4, None, 3),
 ('cagliari', 'palermo', 'X', 5, None, 4),
 ('genova', 'olbia', 'X', 6, None, 4, 70),
 # verso i Paesi confinanti
 ('aosta', 'fr-aosta', 'W'), ('torino', 'fr-torino', 'Y'), ('ventimiglia', 'fr-ventimiglia', 'G'),
 ('aosta', 'ch-aosta', 'O'), ('domodossola', 'ch-domodossola', 'R'), ('milano', 'ch-milano', 'K'),
 ('bolzano', 'at-bolzano', 'P'), ('udine', 'at-udine', 'G'),
 ('udine', 'si-udine', 'R'), ('trieste', 'si-trieste', 'W'),
]
def dist(a, b): return math.hypot(pos[a][0] - pos[b][0], pos[a][1] - pos[b][1])
UNIT = 30.0
routes = []; rid = 0
for r in ROUTES:
    a, b, col = r[0], r[1], r[2]
    ln = r[3] if len(r) > 3 and r[3] else max(1, min(6, round(dist(a, b) / UNIT)))
    dbl = r[4] if len(r) > 4 else None
    fer = r[5] if len(r) > 5 else 0
    bend = r[6] if len(r) > 6 else 0
    pair = None
    routes.append({'id': rid, 'a': a, 'b': b, 'len': ln, 'col': col, 'ferry': fer, 'bend': bend}); rid += 1
    if dbl:
        routes[-1]['twin'] = rid
        routes.append({'id': rid, 'a': a, 'b': b, 'len': ln, 'col': dbl, 'ferry': fer, 'twin': rid - 1}); rid += 1
if __name__ == '__main__':
    by = collections.Counter(); spaces = 0
    for r in routes: by[r['col']] += r['len']; spaces += r['len']
    print('città', len(pos), 'tratte', len(routes), 'spazi', spaces, dict(sorted(by.items())))
    lens = collections.Counter(r['len'] for r in routes); print('lunghezze', dict(sorted(lens.items())))
    for r in routes: print('%-14s %-14s %d %s %.0f px/spazio%s' % (r['a'], r['b'], r['len'], r['col'], dist(r['a'], r['b']) / r['len'], ' traghetto' if r['ferry'] else ''))
    json.dump({'pos': pos, 'cities': {k: v[0] for k, v in CITIES.items()}, 'routes': routes, 'zones': ZONES, 'gates': {k: v[0] for k, v in GATES.items()},
               'regions': {k: {'n': v[0], 'c': v[1]} for k, v in REGIONS.items()}, 'special': SPECIAL}, open(D + 'net.json', 'w'))
