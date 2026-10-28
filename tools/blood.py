# Islak, parlak kan akıntıları ve sıçramaları (SVG) üretir; client.html ve kurallar.html'deki
# --dripT, --dripU, --dripA/B/C, --sp1..4 değişkenlerini yenileriyle değiştirir.
# Kullanım: python3 tools/blood.py
import math,random,re,os
from urllib.parse import quote
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GRAD='<linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="{h}"><stop offset="0" stop-color="#5e050c"/><stop offset=".25" stop-color="#8f0a13"/><stop offset=".7" stop-color="#a50f19"/><stop offset="1" stop-color="#6e060e"/></linearGradient><radialGradient id="b" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#c8202a"/><stop offset=".55" stop-color="#8c0a13"/><stop offset="1" stop-color="#4f030a"/></radialGradient>'
def f(x):return f'{x:.1f}'.rstrip('0').rstrip('.')
def drip_path(x,top,w,L):
    b=w*.62
    return (f'M{f(x-w*1.05)} {f(top)} C{f(x-w*.75)} {f(top+4)} {f(x-w*.42)} {f(top+L*.3)} {f(x-w*.36)} {f(top+L)} '
            f'A{f(b)} {f(b*1.2)} 0 1 0 {f(x+w*.36)} {f(top+L)} C{f(x+w*.42)} {f(top+L*.3)} {f(x+w*.75)} {f(top+4)} {f(x+w*1.05)} {f(top)}Z')
def edge(W,H,band,n,seed,maxL,minw=2.2,maxw=6.5):
    r=random.Random(seed);parts=[];hl=[]
    # üst bant: dalgalı alt kenar
    pts=[];x=0
    while x<W:
        pts.append((x,band*r.uniform(.55,1.15)));x+=r.uniform(8,22)
    pts.append((W,band*.8))
    d=f'M0 0H{W}V{f(pts[-1][1])}'
    for (x1,y1),(x0,y0) in zip(reversed(pts[:-1]),reversed(pts[1:])):
        d+=f' Q{f((x0+x1)/2)} {f(max(y0,y1)+r.uniform(0,3))} {f(x1)} {f(y1)}'
    d+='Z';parts.append(d)
    hl.append(f'<path d="M4 {f(band*.35)} Q{W*.25} {f(band*.15)} {W*.5} {f(band*.32)} T{W-4} {f(band*.25)}" fill="none" stroke="#ff9b9b" stroke-opacity=".28" stroke-width="1.2"/>')
    xs=sorted(r.uniform(6,W-6) for _ in range(n))
    for x in xs:
        w=r.uniform(minw,maxw);L=r.uniform(.15,1)**1.7*maxL+band*.4
        parts.append(drip_path(x,band*.5,w,L))
        hl.append(f'<path d="M{f(x-w*.45)} {f(band+2)} L{f(x-w*.32)} {f(band*.5+L*.85)}" stroke="#ffd0d0" stroke-opacity=".32" stroke-width="{f(max(.6,w*.22))}" stroke-linecap="round"/>')
        hl.append(f'<ellipse cx="{f(x-w*.18)}" cy="{f(band*.5+L+w*.05)}" rx="{f(w*.16)}" ry="{f(w*.24)}" fill="#fff" fill-opacity=".5"/>')
    body=''.join(f'<path d="{p}"/>' for p in parts)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><defs>{GRAD.format(h=H)}</defs>'
            f'<g fill="url(#g)" stroke="#3a0004" stroke-opacity=".45" stroke-width=".7">{body}</g>{"".join(hl)}</svg>')
def splat(seed,size=300):
    r=random.Random(seed);c=size/2;out=[];hl=[]
    R0=size*r.uniform(.13,.17)
    ph=[r.uniform(0,6.28) for _ in range(4)]
    def rad(a):return R0*(1+.22*math.sin(3*a+ph[0])+.12*math.sin(5*a+ph[1])+.08*math.sin(7*a+ph[2]))
    N=72;pts=[(c+math.cos(i/N*6.283)*rad(i/N*6.283),c+math.sin(i/N*6.283)*rad(i/N*6.283)) for i in range(N)]
    d=f'M{f((pts[0][0]+pts[1][0])/2)} {f((pts[0][1]+pts[1][1])/2)}'
    for k in range(1,N+1):
        p0=pts[k%N];p1=pts[(k+1)%N];d+=f' Q{f(p0[0])} {f(p0[1])} {f((p0[0]+p1[0])/2)} {f((p0[1]+p1[1])/2)}'
    out.append(d+'Z')
    # kollar: merkezden dışa incelen akıntı, ucunda damla
    for k in range(r.randint(6,10)):
        a=r.uniform(0,6.283);L=R0*r.uniform(1.25,2.6);w=R0*r.uniform(.07,.16)
        px,py=-math.sin(a),math.cos(a);x0,y0=c+math.cos(a)*rad(a)*.8,c+math.sin(a)*rad(a)*.8;x1,y1=c+math.cos(a)*L,c+math.sin(a)*L
        cx,cy=(x0+x1)/2+px*w*r.uniform(-1.5,1.5),(y0+y1)/2+py*w*r.uniform(-1.5,1.5)
        t=w*.3
        out.append(f'M{f(x0+px*w)} {f(y0+py*w)} Q{f(cx+px*w*.6)} {f(cy+py*w*.6)} {f(x1+px*t)} {f(y1+py*t)} L{f(x1-px*t)} {f(y1-py*t)} Q{f(cx-px*w*.6)} {f(cy-py*w*.6)} {f(x0-px*w)} {f(y0-py*w)}Z')
        dr=w*r.uniform(.9,1.5);ex,ey=x1+math.cos(a)*dr*.6,y1+math.sin(a)*dr*.6
        out.append(f'M{f(ex-dr)} {f(ey)}a{f(dr)} {f(dr)} 0 1 0 {f(2*dr)} 0a{f(dr)} {f(dr)} 0 1 0 {f(-2*dr)} 0Z')
        hl.append(f'<circle cx="{f(ex-dr*.35)}" cy="{f(ey-dr*.35)}" r="{f(dr*.3)}" fill="#fff" fill-opacity=".42"/>')
    # uçuşan damlalar: dışa doğru uzamış
    for k in range(r.randint(12,22)):
        a=r.uniform(0,6.283);d0=R0*r.uniform(1.4,3.9);rx=R0*r.uniform(.03,.1);ry=rx*r.uniform(1.3,2.2)
        x,y=c+math.cos(a)*d0,c+math.sin(a)*d0;ang=math.degrees(a)+90
        out.append(f'M{f(x)} {f(y-ry)}a{f(rx)} {f(ry)} 0 1 0 0 {f(2*ry)}a{f(rx)} {f(ry)} 0 1 0 0 {f(-2*ry)}Z" transform="rotate({f(ang)} {f(x)} {f(y)})')
    hl.append(f'<ellipse cx="{f(c-R0*.32)}" cy="{f(c-R0*.36)}" rx="{f(R0*.34)}" ry="{f(R0*.15)}" fill="#fff" fill-opacity=".2" transform="rotate(-28 {f(c-R0*.32)} {f(c-R0*.36)})"/>')
    hl.append(f'<path d="M{f(c-R0*.75)} {f(c+R0*.15)} Q{f(c-R0*.6)} {f(c-R0*.55)} {f(c+R0*.05)} {f(c-R0*.78)}" fill="none" stroke="#ffb3b3" stroke-opacity=".28" stroke-width="{f(R0*.05)}" stroke-linecap="round"/>')
    hl.append(f'<circle cx="{f(c+R0*.25)}" cy="{f(c-R0*.45)}" r="{f(R0*.06)}" fill="#fff" fill-opacity=".55"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}"><defs>{GRAD.format(h=size)}</defs>'
            f'<g fill="url(#b)" stroke="#3a0004" stroke-opacity=".35" stroke-width=".8">{"".join(f"<path d=\"{p}\"/>" for p in out)}</g>{"".join(hl)}</svg>')
def uri(svg):return 'url("data:image/svg+xml,'+quote(svg,safe=" /:=,.-()'")+'")'
NEW={'dripT':uri(edge(300,90,13,13,31,66,2.4,6)),'dripU':uri(edge(520,34,9,24,32,22,1.6,4)),
     'dripA':uri(edge(720,120,22,20,41,88,3,8.5)),'dripB':uri(edge(720,120,20,18,42,92,3,8.5)),'dripC':uri(edge(720,120,21,22,43,84,2.6,8)),
     'sp1':uri(splat(1)),'sp2':uri(splat(2)),'sp3':uri(splat(3)),'sp4':uri(splat(4))}
for fn in ['src/client.html','src/kurallar.html']:
    p=os.path.join(ROOT,fn);s=open(p,encoding='utf8').read();n=0
    for k,v in NEW.items():
        pat=re.compile(r'--'+k+r':url\("data:image/svg\+xml,[^"]*"\)')
        s,c=pat.subn(lambda m:'--'+k+':'+v,s);n+=c
    open(p,'w',encoding='utf8').write(s);print(fn,'değişen',n)
# önizleme
def _d(k,w,h):return "<div style='height:%dpx;margin:20px 0;background:%s no-repeat top left/%dpx %dpx'></div>"%(h,NEW[k],w,h)
def _s(k):return "<div style='display:inline-block;width:220px;height:220px;background:%s center/contain no-repeat'></div>"%NEW[k]
open('/tmp/blood_prev.html','w').write('<body style="background:#1a0b09;margin:0;padding:20px">'+''.join(_d(k,w,h) for k,w,h in [('dripT',300,90),('dripU',520,34),('dripA',720,120),('dripB',720,120)])+''.join(_s(k) for k in ['sp1','sp2','sp3','sp4'])+'</body>')
