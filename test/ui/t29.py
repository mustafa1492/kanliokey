# kullanıcının ekranı: benim 4 perim + soldakinin 2 peri; taşlar okunur mu, üst üste binen var mı
import asyncio,sys
from playwright.async_api import async_playwright
G="const k=Object.keys(__store).find(k=>k.endsWith('/game/main'));const g=__store[k];const me=g.seats.indexOf(uid);"
SET=G+"""const L=(me+3)%4;const mk=(a,k)=>k==='s'?{g:a,k:'s',n:0}:{g:a,k:'q',lo:1};
const P1=[10,36,62,88],P2=[12,38,104],P3=[1,27,53,79],P4=[8,34,60],Q1=[25,51,77,103],Q2=[47,48,49];
const used=[...P1,...P2,...P3,...P4,...Q1,...Q2];[0,1,2,3].forEach(i=>{g.hands['h'+i]=g.hands['h'+i].filter(x=>!used.includes(x))});g.deck=g.deck.filter(x=>!used.includes(x));
g.B=true;g.tbl['t'+me]=[{g:P1,k:'s',n:11},{g:P2,k:'s',n:13},{g:P3,k:'s',n:2},{g:P4,k:'s',n:9}];g.tbl['t'+L]=[{g:Q1,k:'s',n:13},{g:Q2,k:'q',lo:9}];
g.opn['s'+me]=26;g.opn['s'+L]=27;g.hands['h'+me]=g.hands['h'+me].slice(0,2);g.hands['h'+L]=g.hands['h'+L].slice(0,5);
return db.doc(k).set(g)"""
async def main():
    W=int(sys.argv[2]) if len(sys.argv)>2 else 393;H=int(sys.argv[3]) if len(sys.argv)>3 else 690
    ok=True
    def check(n,c):
        nonlocal ok;print('OK  ' if c else 'FAIL',n);ok=ok and c
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':W,'height':H},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        if len(sys.argv)>4: await pg.evaluate("localStorage.setItem('okeySet',JSON.stringify({big:true}));SET.big=true;applySet()")
        await pg.fill('#nm','Aliemo'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.evaluate("CFG.ms=999999"); await pg.click('#go'); await pg.wait_for_timeout(2700)
        await pg.evaluate("(()=>{"+SET+"})()"); await pg.wait_for_timeout(2600)
        r=await pg.evaluate("""(()=>{const sc=document.getElementById('scene').getBoundingClientRect();const T=[...document.querySelectorAll('#scene .pers .t')].map(t=>({r:t.getBoundingClientRect(),a:t.closest('.area').className}));
          let ov=0,hid=0,minw=99;for(let i=0;i<T.length;i++){const a=T[i].r;minw=Math.min(minw,a.width);const ar=document.querySelector('.'+T[i].a.split(' ')[1]).getBoundingClientRect();if(a.bottom>ar.bottom+1||a.top<ar.top-1||a.right>ar.right+1||a.left<ar.left-1)hid++;
            for(let j=i+1;j<T.length;j++){const b=T[j].r;if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)ov++}}
          const pl=[...document.querySelectorAll('#scene .plate,#scene .dpile .t:not(.old),#scene .pile,#scene .okeyrow')].map(e=>e.getBoundingClientRect());let ov2=0;for(const t of T)for(const p of pl){const a=t.r;if(Math.min(a.right,p.right)-Math.max(a.left,p.left)>1&&Math.min(a.bottom,p.bottom)-Math.max(a.top,p.top)>1)ov2++}
          const ok=[...document.querySelectorAll('#scene .pers .t.ok')].map(t=>{const s=t.querySelector('small');if(!s)return 0;const a=t.getBoundingClientRect(),b=s.getBoundingClientRect();return b.bottom>a.bottom+.5||b.right>a.right+.5?1:0}).reduce((x,y)=>x+y,0);
          return {n:T.length,minw:Math.round(minw*10)/10,ov,hid,ov2,okOverflow:ok,zoom:JSON.stringify(perZ)}})()""")
        print(r)
        check('taşlar okunur (en az 17px)',r['minw']>=17)
        check('taşlar birbirinin üstüne binmiyor',r['ov']==0)
        check('perler isim kutusu / deste / atılan taş üstüne binmiyor',r['ov2']==0)
        check('hepsi görünüyor',r['hid']==0)
        check('okey taşındaki sayı taşın dışına taşmıyor',r['okOverflow']==0)
        await pg.screenshot(path=f't29_{W}x{H}.png')
        print('ALL OK' if ok else 'SOME FAILED',errs)
        await b.close()
asyncio.run(main())
