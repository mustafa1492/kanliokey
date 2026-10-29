import asyncio,sys,random
from playwright.async_api import async_playwright
SEED=int(sys.argv[2]) if len(sys.argv)>2 else 1
N=int(sys.argv[3]) if len(sys.argv)>3 else 120
async def main():
    r=random.Random(SEED); bad=[]
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); cdp=await ctx.new_cdp_session(pg)
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.fill('#nm','Mustafa'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.click('#go'); await pg.wait_for_timeout(3000)
        async def touch(t,x,y):
            await cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':[{'x':x,'y':y}] if t!='touchEnd' else []})
        async def drag(x0,y0,x1,y1,steps=6,hold=0):
            await touch('touchStart',x0,y0)
            for i in range(1,steps+1):
                await touch('touchMove',x0+(x1-x0)*i/steps,y0+(y1-y0)*i/steps)
                if r.random()<.3: await pg.wait_for_timeout(r.choice([5,20,60]))
            if hold: await pg.wait_for_timeout(hold)
            await touch('touchEnd',x1,y1)
        async def tap(x,y):
            await touch('touchStart',x,y); await pg.wait_for_timeout(40); await touch('touchEnd',x,y)
        async def inv(tag):
            res=await pg.evaluate("""(()=>{
              const o=[];const me=S.seats.indexOf(uid),h=S.hands['h'+me]||[];
              if(document.querySelector('.t.drag,.ghost'))o.push('stuck drag/ghost');
              if(document.querySelector('#app.dragging'))o.push('app.dragging stuck');
              const ids=order.filter(x=>x!=null);
              const miss=h.filter(x=>!ids.includes(x)&&!stage.flat().includes(x));
              if(miss.length)o.push('hand tile not in order: '+miss);
              if(new Set(ids).size!==ids.length)o.push('dup in order');
              const extra=ids.filter(x=>!h.includes(x));if(extra.length)o.push('order has foreign '+extra);
              const r=document.querySelector('#rack');
              if(r){const R=r.getBoundingClientRect();document.querySelectorAll('#rack .t').forEach(t=>{const b=t.getBoundingClientRect();if(b.width&&(b.x<R.x-4||b.x>R.right||b.y<R.y-4||b.y>R.bottom))o.push('tile outside rack '+t.dataset.id+' '+Math.round(b.x)+','+Math.round(b.y)+' rack '+Math.round(R.x)+','+Math.round(R.y)+','+Math.round(R.width)+','+Math.round(R.height)+' cls='+t.className+' st='+t.getAttribute('style'))})}
              return o})()""")
            if res: bad.append((tag,res)); print('BAD',tag,res)
        acts=0
        for i in range(N):
            st=await pg.evaluate("(()=>{const me=S.seats.indexOf(uid);return [S.turn===me,S.ph,S.win!=null&&S.win>=0,S.round]})()")
            # keep rack in view
            await pg.evaluate("(()=>{const r=document.querySelector('#rack');if(r)r.scrollIntoView({block:'center'})})()")
            await pg.wait_for_timeout(60)
            rb=await pg.evaluate("(()=>{const r=document.querySelector('#rack');if(!r)return null;const b=r.getBoundingClientRect();return [b.x,b.y,b.width,b.height]})()")
            sc=await pg.evaluate("(()=>{const r=document.querySelector('#scene');if(!r)return null;const b=r.getBoundingClientRect();return [b.x,b.y,b.width,b.height]})()")
            tiles=await pg.evaluate("[...document.querySelectorAll('#rack .t')].map(t=>{const b=t.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]})")
            if not rb or not tiles: await pg.wait_for_timeout(500); continue
            k=r.random()
            tgt=None
            if k<.35: tgt=(rb[0]+r.uniform(0,rb[2]),rb[1]+r.uniform(0,rb[3]))     # inside rack
            elif k<.6 and sc: tgt=(sc[0]+r.uniform(0,sc[2]),sc[1]+r.uniform(0,sc[3]))
            elif k<.7: tgt=(r.uniform(0,390),r.uniform(0,844))
            if tgt is not None:
                x,y=r.choice(tiles); await drag(x,y,tgt[0],tgt[1],steps=r.choice([2,4,8]),hold=r.choice([0,0,80]))
            elif k<.8:
                x,y=r.choice(tiles); await tap(x,y)
            elif k<.9:
                # deck / pile
                loc=pg.locator(r.choice(['#deck','#tk']))
                if await loc.count():
                    bb=await loc.first.bounding_box()
                    if bb:
                        if r.random()<.5: await tap(bb['x']+bb['width']/2,bb['y']+bb['height']/2)
                        elif rb: await drag(bb['x']+bb['width']/2,bb['y']+bb['height']/2,rb[0]+r.uniform(0,rb[2]),rb[1]+r.uniform(0,rb[3]),steps=6)
            else:
                lab=r.choice(['Sırala','AT'])
                loc=pg.get_by_role('button',name=lab)
                if await loc.count():
                    bb=await loc.first.bounding_box()
                    if bb: await tap(bb['x']+bb['width']/2,bb['y']+bb['height']/2)
            await pg.wait_for_timeout(r.choice([50,150,400]))
            await pg.wait_for_timeout(450)
            await inv(f'seed{SEED} step{i} k={k:.2f}')
            acts+=1
        print('steps',acts,'errors',errs,'bad',len(bad))
        await b.close()
    print('FUZZ OK' if not errs and not bad else 'FUZZ FAIL')
asyncio.run(main())
