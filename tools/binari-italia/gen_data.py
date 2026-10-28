"""Genera src/binari-italia/data.js: geografia, città (con posizione delle etichette), tratte, biglietti."""
import os
import json, math
D = os.path.dirname(os.path.abspath(__file__)) + '/'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'binari-italia', 'data.js')
g = json.load(open(D + 'geo.json')); n = json.load(open(D + 'net.json')); T = json.load(open(D + 'tickets.json'))
W, H = g['W'], g['H']; pos = n['pos']
LON0, LAT1 = 6.3, 47.4; K = math.cos(math.radians(42)); S = 100.0
def P(lat, lon): return [round((lon - LON0) * K * S, 1), round((LAT1 - lat) * S, 1)]

def dp(pts, eps):
    if len(pts) < 3: return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True; st = [(0, len(pts) - 1)]
    while st:
        a, b = st.pop(); ax, ay = pts[a]; bx, by = pts[b]; dx, dy = bx - ax, by - ay; L = math.hypot(dx, dy) or 1e-9
        best, bi = 0, -1
        for i in range(a + 1, b):
            px, py = pts[i]; d = abs(dy * px - dx * py + bx * ay - by * ax) / L
            if d > best: best, bi = d, i
        if best > eps: keep[bi] = True; st += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]
def ring_area(r): return abs(sum(r[i - 1][0] * r[i][1] - r[i][0] * r[i - 1][1] for i in range(len(r)))) / 2
def path(rings, closed=True, eps=0):
    out = []
    for r in rings:
        if eps: r = dp(r, eps)
        if closed and (len(r) < 3 or ring_area(r) < 4): continue
        out.append('M' + ' '.join('%g,%g' % (round(x), round(y)) if eps >= 0.9 else '%g,%g' % (round(x, 1), round(y, 1)) for x, y in r) + ('Z' if closed else ''))
    return ''.join(out)

italy = path(g['countries']['Italy'], eps=0.5)
others = path([r for k, v in g['countries'].items() if k not in ('Italy', 'San Marino', 'Vatican') for r in v], eps=1.0)
borders = []  # contorni interni: uso il contorno dei paesi vicini (disegnato sopra la terra)
lakes = path([r for nm, r in g['lakes']], eps=0.4)
rivers = path([l for k, v in g['rivers'].items() for l in v], closed=False, eps=0.6)

# --- dorsali per il rilievo (lat, lon) ---
RIDGES = {
 'alpi': [(44.15, 7.35), (44.55, 7.05), (45.0, 7.0), (45.5, 7.15), (45.85, 7.6), (46.0, 8.05), (46.3, 8.55), (46.4, 9.2), (46.42, 9.9), (46.5, 10.5), (46.6, 11.2), (46.5, 11.85), (46.6, 12.6), (46.5, 13.3), (46.35, 13.75)],
 'prealpi': [(45.9, 9.4), (45.95, 10.1), (45.9, 10.8), (46.0, 11.5), (46.1, 12.2)],
 'appennino': [(44.35, 8.3), (44.5, 9.2), (44.35, 10.1), (44.1, 10.8), (43.85, 11.6), (43.5, 12.3), (43.05, 12.9), (42.55, 13.35), (42.15, 13.9), (41.7, 14.3), (41.25, 14.8), (40.8, 15.3), (40.45, 15.85), (40.0, 16.05), (39.45, 16.2), (38.95, 16.3), (38.45, 16.05), (38.2, 15.85)],
 'sicilia': [(38.0, 13.3), (37.88, 13.9), (37.9, 14.4), (37.95, 14.9)],
 'sardegna': [(40.55, 9.2), (40.15, 9.35), (39.75, 9.3), (39.4, 8.75)],
}
ridges = {k: [P(a, b) for a, b in v] for k, v in RIDGES.items()}
VOLC = {'etna': P(37.75, 14.99), 'vesuvio': P(40.82, 14.43)}
SEAS = [('Mar Ligure', 43.75, 8.75), ('Mar Tirreno', 40.3, 12.0), ('Mar Adriatico', 43.25, 15.0), ('Mar Ionio', 38.4, 17.6), ('Canale di Sicilia', 36.85, 12.6)]
seas = [[nm] + P(a, b) for nm, a, b in SEAS]

# --- tratte: geometria per il posizionamento delle etichette ---
GATE = n['gates']; CITY = [c for c in pos if c not in GATE]
def seg_lines():
    L = []
    for r in n['routes']:
        ax, ay = pos[r['a']]; bx, by = pos[r['b']]
        L.append((ax, ay, bx, by))
    return L
LINES = seg_lines()
def seg_box_hit(x0, y0, x1, y1, bx0, by0, bx1, by1):
    # quanto del segmento cade nel rettangolo (campionamento)
    hit = 0
    for i in range(21):
        t = i / 20; x = x0 + (x1 - x0) * t; y = y0 + (y1 - y0) * t
        if bx0 <= x <= bx1 and by0 <= y <= by1: hit += 1
    return hit
FS = 12.5; CW = 6.9
CAND = [('n', 0, -15, 'middle'), ('s', 0, 24, 'middle'), ('e', 14, 4.5, 'start'), ('w', -14, 4.5, 'end'),
        ('ne', 10, -11, 'start'), ('nw', -10, -11, 'end'), ('se', 10, 19, 'start'), ('sw', -10, 19, 'end')]
placed = []
labels = {}
order = sorted(CITY, key=lambda c: -sum(1 for r in n['routes'] if c in (r['a'], r['b'])))
for c in order:
    x, y = pos[c]; name = n['cities'][c]; w = len(name) * CW + 6; best = None
    for key, dx, dy, anc in CAND:
        lx = x + dx; ly = y + dy
        bx0 = lx - w / 2 if anc == 'middle' else lx if anc == 'start' else lx - w
        box = (bx0 - 2, ly - FS + 1, bx0 + w + 2, ly + 4)
        cost = sum(seg_box_hit(*l, *box) for l in LINES) * 3
        cost += sum(10 for (q0, q1, q2, q3) in placed if not (box[2] < q0 or box[0] > q2 or box[3] < q1 or box[1] > q3)) * 4
        cost += sum(8 for o, (ox, oy) in pos.items() if o != c and box[0] - 9 < ox < box[2] + 9 and box[1] - 9 < oy < box[3] + 9)
        if box[0] < 4 or box[2] > W - 4 or box[1] < 4 or box[3] > H - 4: cost += 50
        cost += {'n': 0, 's': 1, 'e': 1, 'w': 1}.get(key, 2)
        if best is None or cost < best[0]: best = (cost, key, dx, dy, anc, box)
    placed.append(best[5]); labels[c] = [best[2], best[3], best[4]]
    if best[0] > 12: print('etichetta affollata:', name, best[0], best[1])

REG = {c: k for k, v in n['regions'].items() for c in v['c']}
cities = {c: {'n': n['cities'][c], 'x': pos[c][0], 'y': pos[c][1], 'lab': labels[c], 'reg': REG[c]} for c in CITY}
for c, z in GATE.items(): cities[c] = {'n': n['zones'][z], 'x': pos[c][0], 'y': pos[c][1], 'zone': z}
# colori delle regioni (vista «Regioni» sulla carta)
RCOL = ['#b8403a', '#d0752e', '#c99a1c', '#7f9a2a', '#3f8f4f', '#2f8a86', '#2f6fa8', '#5157b0', '#7b4aa6', '#a7457f',
        '#8a5a35', '#4f7d3c', '#b25f5f', '#3d7f9e', '#9a7a2a', '#6b6fb5', '#a35a2a', '#2f7a63', '#8d4a6a']
regions = {k: {'n': v['n'], 'cities': v['c'], 'c': RCOL[i % len(RCOL)]} for i, (k, v) in enumerate(n['regions'].items())}
routes = [{k: v for k, v in r.items() if v not in (0, None) or k in ('id',)} for r in n['routes']]
data = {'W': W, 'H': H, 'cities': cities, 'routes': routes, 'zones': n['zones'], 'regions': regions, 'special': n['special'], 'tickets': [{'id': i, 'a': t['a'], 'b': t['b'], 'v': t['v']} for i, t in enumerate(T)],
        'geo': {'italy': italy, 'others': others, 'lakes': lakes, 'rivers': rivers, 'ridges': ridges, 'volc': VOLC, 'seas': seas}}
js = '/* ===== Ticket to Ride Italy: dati della mappa (generati da tools/; coste, laghi e fiumi da Natural Earth, pubblico dominio) ===== */\n'
js += 'var BIData = (function () {\n  var D = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
js += """  D.COLORS = {
    R: { n: 'rosso', c: '#c9352b', d: '#7e1d17', ink: '#fff' }, O: { n: 'arancione', c: '#e5822a', d: '#94480c', ink: '#fff' },
    Y: { n: 'giallo', c: '#efc62f', d: '#97760c', ink: '#3a2a00' }, G: { n: 'verde', c: '#3d8f3f', d: '#1f5321', ink: '#fff' },
    B: { n: 'blu', c: '#2e6bb8', d: '#173d70', ink: '#fff' }, P: { n: 'viola', c: '#8c4aa6', d: '#4f2364', ink: '#fff' },
    K: { n: 'nero', c: '#2b2a2c', d: '#000', ink: '#fff' }, W: { n: 'bianco', c: '#f3efe4', d: '#9c9585', ink: '#2b2a2c' },
    X: { n: 'grigio', c: '#9a968d', d: '#5d5a54', ink: '#fff' }, L: { n: 'locomotiva', c: '#d8b45a', d: '#6b5320', ink: '#2b1d05' }
  };
  D.CARD_COLORS = ['R', 'O', 'Y', 'G', 'B', 'P', 'K', 'W'];
  D.SCORE = [0, 1, 2, 4, 7, 10, 15];
  D.TRAINS = 45; D.FERRY = 10; D.FERRY_MAX = 2;
  D.START_TICKETS = 5; D.START_KEEP = 3; D.DRAW_TICKETS = 4;
  // bonus delle regioni collegate in una stessa rete (Sicilia, Sardegna e Puglia complete valgono 2)
  D.REGION_PTS = [0, 0, 0, 0, 0, 1, 3, 5, 8, 11, 15, 19, 24, 29, 34, 40, 46, 52, 56, 60, 64, 68, 72];
  D.regionPts = function (n) { return D.REGION_PTS[Math.min(n, D.REGION_PTS.length - 1)]; };
  D.isZone = function (id) { return !!D.zones[id]; };
  D.place = function (id) { return D.zones[id] || D.cities[id].n; };
  D.PCOL = [
    { id: 'rosso', n: 'Rosso', c: '#d23b2f', d: '#7d1610' }, { id: 'blu', n: 'Blu', c: '#2f72c9', d: '#123f7c' },
    { id: 'verde', n: 'Verde', c: '#2f9e57', d: '#145a2c' }, { id: 'giallo', n: 'Giallo', c: '#f0b92a', d: '#8a6305' },
    { id: 'nero', n: 'Nero', c: '#3a3a40', d: '#0d0d10' }
  ];
  D.byId = {}; D.routes.forEach(function (r) { D.byId[r.id] = r; });
  return D;
})();
"""
open(OUT, 'w').write(js)
print('scritto', OUT, len(js), 'byte')
