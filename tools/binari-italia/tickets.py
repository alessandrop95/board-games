import os
import json, heapq, collections
D=os.path.dirname(os.path.abspath(__file__)) + '/'
n=json.load(open(D+'net.json')); adj=collections.defaultdict(list)
for r in n['routes']: adj[r['a']].append((r['b'],r['len'])); adj[r['b']].append((r['a'],r['len']))
def sp(s):
    d={s:0}; q=[(0,s)]
    while q:
        c,u=heapq.heappop(q)
        if c>d[u]: continue
        for v,w in adj[u]:
            if c+w<d.get(v,1e9): d[v]=c+w; heapq.heappush(q,(c+w,v))
    return d
DIST={c:sp(c) for c in n['pos']}
PAIRS='''torino venezia|milano roma|genova firenze|bologna napoli|venezia firenze|trieste bologna|aosta genova|bolzano milano|verona ancona|parma perugia|pisa roma|firenze pescara|roma bari|napoli lecce|napoli reggio|bari cosenza|palermo reggio|catania napoli|sassari civitavecchia|cagliari roma|ventimiglia milano|cuneo bologna|domodossola venezia|udine rimini|trento firenze|brescia laspezia|laquila foggia|grosseto ancona|potenza agrigento|salerno taranto|messina bari|torino napoli|trieste foggia|ventimiglia napoli|bolzano cagliari|venezia bari|milano palermo|venezia napoli|genova catania|genova reggio|domodossola roma|olbia lecce|cuneo agrigento|verona cagliari'''
T=[]
for i,p in enumerate(PAIRS.split('|')):
    a,b=p.split(); v=DIST[a][b]; T.append({'id':i,'a':a,'b':b,'v':v})
T.sort(key=lambda t:t['v'])
for t in T: print('%-12s %-12s %d'%(t['a'],t['b'],t['v']))
cnt=collections.Counter(); [cnt.update([t['a'],t['b']]) for t in T]
print('città senza biglietti:', [c for c in n['pos'] if c not in cnt])
print('valori', sorted(t['v'] for t in T))
json.dump(T,open(D+'tickets.json','w'))
