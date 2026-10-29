import asyncio,sys
from playwright.async_api import async_playwright
async def main():
    W,H=int(sys.argv[2]),int(sys.argv[3]);ua=sys.argv[4] if len(sys.argv)>4 else None
    async with async_playwright() as p:
        b=await p.chromium.launch(); kw=dict(viewport={'width':W,'height':H},device_scale_factor=2,has_touch=True,is_mobile=True)
        if ua: kw['user_agent']=ua
        ctx=await b.new_context(**kw)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.fill('#nm','AA'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.evaluate("CFG.ms=999999"); await pg.click('#go'); await pg.wait_for_timeout(2700)
        r=await pg.evaluate("(()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return [Math.round(r.top),Math.round(r.bottom)]};return {acts:q('.acts3'),rack:q('#rack'),scene:q('#scene'),body:document.body.className,pb:getComputedStyle(document.body).paddingBottom,sh:document.documentElement.scrollHeight}})()")
        print(r,errs)
        await pg.screenshot(path=sys.argv[5] if len(sys.argv)>5 else 'saf.png')
        await b.close()
asyncio.run(main())
