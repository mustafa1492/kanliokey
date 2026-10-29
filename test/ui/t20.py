# v44: sürüklerken komşu taşlar kayar, üst üste binme yok
import asyncio,sys
from playwright.async_api import async_playwright
G="const k=Object.keys(__store).find(k=>k.endsWith('/game/main'));const g=__store[k];const me=g.seats.indexOf(uid);"
OVL="""(()=>{const a=[...document.querySelectorAll('#rack .rs .t[data-id]')].filter(t=>!t.classList.contains('drag')).map(t=>t.getBoundingClientRect());let n=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const p=a[i],q=a[j];if(Math.min(p.right,q.right)-Math.max(p.left,q.left)>3&&Math.min(p.bottom,q.bottom)-Math.max(p.top,q.top)>3)n++}return n})()"""
async def main():
    ok=True
    def check(n,c):
        nonlocal ok;print('OK  ' if c else 'FAIL',n);ok=ok and c
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':760},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        cdp=await ctx.new_cdp_session(pg)
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.fill('#nm','Mustafa'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.evaluate("CFG.ms=999999"); await pg.click('#go'); await pg.wait_for_timeout(2700)
        o0=await pg.evaluate("order.slice()")
        print('order',o0)
        async def touch(t,x,y): await cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':[{'x':x,'y':y}] if t!='touchEnd' else []})
        rc=lambda i:pg.evaluate(f"(()=>{{const r=document.querySelector('#rack .rs[data-s=\"{i}\"]').getBoundingClientRect();return [r.x,r.y,r.width,r.height]}})()")
        # ilk sıradaki 6. taşı (yuva 5) tut, 1. ile 2. taşın arasına (yuva 1'in sol yarısı) götür
        a=await rc(5); t=await rc(1)
        x0,y0=a[0]+a[2]/2,a[1]+a[3]/2; x1,y1=t[0]+t[2]*0.3,t[1]+t[3]/2+38
        await touch('touchStart',x0,y0)
        for i in range(1,11): await touch('touchMove',x0+(x1-x0)*i/10,y0+(y1-y0)*i/10); await pg.wait_for_timeout(20)
        await pg.wait_for_timeout(300)
        n=await pg.evaluate(OVL); print('üst üste',n); check('sürüklerken taşlar üst üste binmiyor',n==0)
        moved=await pg.evaluate("document.querySelectorAll('#rack .t.pv').length"); check('komşular kaydı',moved>=4)
        await pg.screenshot(path='t20_mid.png',clip={'x':0,'y':560,'width':390,'height':200})
        await touch('touchEnd',x1,y1); await pg.wait_for_timeout(500)
        o1=await pg.evaluate("order.slice()")
        print('order',o1)
        check('taş araya girdi, diğerleri sağa kaydı',o1[1]==o0[5] and o1[2]==o0[1] and o1[5]==o0[4] and o1[0]==o0[0])
        n=await pg.evaluate(OVL); check('bıraktıktan sonra üst üste yok',n==0)
        check('kalan kaydırma yok',await pg.evaluate("[...document.querySelectorAll('#rack .t')].every(t=>!t.style.transform)"))
        await pg.screenshot(path='t20_end.png',clip={'x':0,'y':560,'width':390,'height':200})
        check('hata yok',not errs);print(errs)
        print('ALL OK' if ok else 'SOME FAILED')
        await b.close()
asyncio.run(main())
