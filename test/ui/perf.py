import asyncio,sys,json
from playwright.async_api import async_playwright
async def main():
    thr=float(sys.argv[2]) if len(sys.argv)>2 else 4
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':700},device_scale_factor=3,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.fill('#nm','Mustafa'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.click('#go'); await pg.wait_for_timeout(3000)
        await pg.evaluate("(()=>{const k=Object.keys(__store).find(k=>k.endsWith('/game/main'));const g=__store[k];const me=g.seats.indexOf(uid);g.turn=me;g.ph='discard';g.trn=12;g.tt=Date.now();return db.doc(k).set(g)})()")
        await pg.wait_for_timeout(1500)
        await pg.evaluate("document.querySelector('#rack').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(300)
        if len(sys.argv)>3: await pg.evaluate(sys.argv[3])
        c=await ctx.new_cdp_session(pg)
        await c.send('Performance.enable')
        await c.send('Emulation.setCPUThrottlingRate',{'rate':thr})
        box=await pg.locator('#rack .t').nth(2).bounding_box()
        rk=await pg.locator('#rack').bounding_box()
        x0=box['x']+box['width']/2; y0=box['y']+box['height']/2
        await pg.evaluate("window.__fr=[];window.__on=true;let l=performance.now();const f=t=>{__fr.push(t-l);l=t;if(__on)requestAnimationFrame(f)};requestAnimationFrame(f)")
        await b.start_tracing(page=pg,path='trace.json',categories=['devtools.timeline','disabled-by-default-devtools.timeline','cc','viz'])
        m0=(await c.send('Performance.getMetrics'))['metrics']
        await c.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x0,'y':y0}]})
        import math
        N=90
        for k in range(1,N):
            # rack boyunca gezdir, sonra yukarı masaya çık, geri gel
            t=k/N
            x=rk['x']+20+(rk['width']-40)*(0.5+0.5*math.sin(t*6.28*2))
            y=y0-(0 if t<0.6 else (t-0.6)*700)
            await c.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y}]})
            await pg.wait_for_timeout(16)
        await c.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x0+30,'y':y0}]}); await pg.wait_for_timeout(50)
        await c.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]}); await pg.wait_for_timeout(300)
        fr=await pg.evaluate("__on=false;__fr.slice(2)")
        await b.stop_tracing()
        m1=(await c.send('Performance.getMetrics'))['metrics']
        d={a['name']:round(b['value']-a['value'],3) for a,b in zip(m0,m1) if a['name'] in('LayoutCount','RecalcStyleCount','LayoutDuration','RecalcStyleDuration','ScriptDuration','TaskDuration')}
        fr.sort(); n=len(fr)
        print('frames',n,'avg %.1f p50 %.1f p90 %.1f max %.1f'%(sum(fr)/n,fr[n//2],fr[int(n*.9)],fr[-1]),'>33ms',sum(1 for x in fr if x>33))
        print(d, errs)
        ev=json.load(open('trace.json'))
        ev=ev['traceEvents'] if isinstance(ev,dict) else ev
        agg={}
        for e in ev:
            if e.get('ph')=='X' and e.get('name') in ('Paint','RasterTask','UpdateLayerTree','Layout','UpdateLayoutTree','PrePaint','Layerize','HitTest','FunctionCall','EventDispatch','Commit','ImageDecodeTask','PaintImage'):
                a=agg.setdefault(e['name'],[0,0]); a[0]+=1; a[1]+=e.get('dur',0)/1000
        print({k:(v[0],round(v[1],1)) for k,v in sorted(agg.items(),key=lambda x:-x[1][1])})
        await b.close()
asyncio.run(main())
