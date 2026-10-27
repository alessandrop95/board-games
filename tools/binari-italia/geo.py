"""Natural Earth (pubblico dominio) -> poligoni proiettati e semplificati per la mappa d'Italia."""
import os
import json, math, sys
G=os.environ.get('NE_GEOJSON', 'natural-earth-vector/geojson/')
OUT=os.path.dirname(os.path.abspath(__file__)) + '/'
LON0, LON1, LAT0, LAT1 = 6.3, 18.9, 36.3, 47.4
K = math.cos(math.radians(42)); S = 100.0
W = round((LON1-LON0)*K*S); H = round((LAT1-LAT0)*S)
def P(lon, lat): return ((lon-LON0)*K*S, (LAT1-lat)*S)
def clip(poly, x0, y0, x1, y1):
    def cl(pts, inside, inter):
        out=[]
        for i in range(len(pts)):
            a=pts[i-1]; b=pts[i]
            if inside(b):
                if not inside(a): out.append(inter(a,b))
                out.append(b)
            elif inside(a): out.append(inter(a,b))
        return out
    def ix(xc):
        return lambda a,b: (xc, a[1]+(b[1]-a[1])*(xc-a[0])/(b[0]-a[0]))
    def iy(yc):
        return lambda a,b: (a[0]+(b[0]-a[0])*(yc-a[1])/(b[1]-a[1]), yc)
    p=poly
    for inside,inter in ((lambda q:q[0]>=x0, ix(x0)),(lambda q:q[0]<=x1, ix(x1)),(lambda q:q[1]>=y0, iy(y0)),(lambda q:q[1]<=y1, iy(y1))):
        if not p: break
        p=cl(p,inside,inter)
    return p
def dp(pts, eps):
    if len(pts)<3: return pts
    keep=[False]*len(pts); keep[0]=keep[-1]=True; st=[(0,len(pts)-1)]
    while st:
        a,b=st.pop(); ax,ay=pts[a]; bx,by=pts[b]; dx,dy=bx-ax,by-ay; L=math.hypot(dx,dy) or 1e-9
        best,bi=0,-1
        for i in range(a+1,b):
            px,py=pts[i]; d=abs(dy*px-dx*py+bx*ay-by*ax)/L if L>1e-9 else math.hypot(px-ax,py-ay)
            if d>best: best,bi=d,i
        if best>eps: keep[bi]=True; st+=[(a,bi),(bi,b)]
    return [p for p,k in zip(pts,keep) if k]
def area(p): return abs(sum(p[i-1][0]*p[i][1]-p[i][0]*p[i-1][1] for i in range(len(p))))/2
def path(rings, closed=True):
    s=[]
    for r in rings:
        s.append('M'+'L'.join('%.1f %.1f'%q for q in r)+('Z' if closed else ''))
    return ''.join(s)
M=8
def rings_of(geom):
    polys = [geom['coordinates']] if geom['type']=='Polygon' else geom['coordinates']
    out=[]
    for poly in polys:
        ring=[P(*c[:2]) for c in poly[0]]
        ring=clip(ring,-M,-M,W+M,H+M)
        if len(ring)<3: continue
        ring=dp(ring+[ring[0]],0.45)[:-1]
        if len(ring)>=3 and area(ring)>3: out.append(ring)
    return out
c=json.load(open(G+'ne_10m_admin_0_countries.geojson'))
countries={}
for f in c['features']:
    n=f['properties']['ADMIN']
    rs=rings_of(f['geometry'])
    if rs: countries[n]=rs
lakes=[]
seenl=set()
for fn in ('ne_10m_lakes_europe.geojson','ne_10m_lakes.geojson'):
  for f in json.load(open(G+fn))['features']:
    if not f['geometry']: continue
    nm=f['properties'].get('name')
    for r in rings_of(f['geometry']):
        if area(r)>5 and (nm,round(r[0][0])) not in seenl: seenl.add((nm,round(r[0][0]))); lakes.append((nm, r))
rivers={}
WANT={'Po','Adige','Tevere','Arno','Ticino','Dora Baltea','Piave','Tagliamento','Volturno','Ofanto','Mincio','Isonzo','Brenta','Reno','Garigliano','Liri','Pescara','Tanaro','Oglio','Adda','Simeto','Sacco','Salto'}
for f in json.load(open(G+'ne_10m_rivers_lake_centerlines.geojson'))['features']+json.load(open(G+'ne_10m_rivers_europe.geojson'))['features']:
    n=f['properties'].get('name'); g=f['geometry']
    if not g: continue
    if n not in WANT: continue
    lines=[g['coordinates']] if g['type']=='LineString' else g['coordinates']
    for ln in lines:
        pts=[P(*q[:2]) for q in ln]
        if not any(0<=x<=W and 0<=y<=H for x,y in pts): continue
        rivers.setdefault(n,[]).append(dp(pts,0.6))
json.dump({'W':W,'H':H,'countries':{k:[[list(map(lambda v:round(v,1),q)) for q in r] for r in v] for k,v in countries.items()},
           'lakes':[[n,[[round(a,1),round(b,1)] for a,b in r]] for n,r in lakes],
           'rivers':{k:[[[round(a,1),round(b,1)] for a,b in l] for l in v] for k,v in rivers.items()}}, open(OUT+'geo.json','w'))
print(W,H,{k:sum(len(r) for r in v) for k,v in countries.items()}, len(lakes), {k:len(v) for k,v in rivers.items()})
