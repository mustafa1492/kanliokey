import asyncio,sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':700},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.fill('#nm','Mustafa'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.click('#go'); await pg.wait_for_timeout(3000)
        await pg.click('#menuT'); await pg.wait_for_timeout(300)
        await pg.click('.xtra summary'); await pg.wait_for_timeout(200)
        await pg.screenshot(path='m1.png')
        v1=await pg.evaluate("getComputedStyle(document.querySelector('.xtra')).display")
        await pg.click('.xtg [data-tg=snd]'); await pg.wait_for_timeout(100)
        snd=await pg.evaluate("[SFX.snd,String(SFX.snd),document.querySelector('[data-tg=snd]').getAttribute('aria-pressed')]")
        await pg.click('#menuX'); await pg.wait_for_timeout(200)
        v2=await pg.evaluate("getComputedStyle(document.querySelector('.xtra')).display")
        await pg.click('#menuT'); await pg.wait_for_timeout(200)
        await pg.mouse.click(200,40); await pg.wait_for_timeout(200)
        v3=await pg.evaluate("getComputedStyle(document.querySelector('.xtra')).display")
        await pg.click('#menuT'); await pg.wait_for_timeout(200)
        await pg.click('.xtra #home'); await pg.wait_for_timeout(600)
        lob=await pg.evaluate("[document.body.className, document.documentElement.className, document.documentElement.scrollHeight>innerHeight||true]")
        print(v1,snd,v2,v3,lob,errs)
        ok=v1=='flex' and snd==[False,'false','false'] and v2=='none' and v3=='none' and 'lobby' in lob[0] and 'gmode' not in lob[1] and not errs
        print('ALL OK' if ok else 'SOME FAILED')
        await b.close()
asyncio.run(main())
