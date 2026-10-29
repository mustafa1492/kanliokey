import asyncio,sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':393,'height':800},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.fill('#nm','Mustafa'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.wait_for_timeout(200); await pg.click('#pairT'); await pg.wait_for_timeout(300)
        await pg.click('[data-pr="2"]'); await pg.wait_for_timeout(300)
        pr=await pg.evaluate("ROOM.pr");print('pr',pr)
        el=await pg.query_selector('.pairbox'); await el.screenshot(path='t32_pair.png')
        await pg.click('#go'); await pg.wait_for_timeout(2500)
        t=await pg.evaluate("[S.names[0],S.names[2],S.names[1],S.names[3]]");print('takım1',t[:2],'takım2',t[2:])
        await pg.evaluate("leaveLocal('',true)"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('.agate').open=true"); await pg.fill('#ap','1234'); await pg.click('#adm'); await pg.wait_for_timeout(600)
        await pg.screenshot(path='t32_adm.png')
        await pg.click('[data-at="ozellik"]'); await pg.wait_for_timeout(300)
        await pg.click('[data-cfg^="chat:"]'); await pg.wait_for_timeout(400)
        print('chat',await pg.evaluate("CFG.chat"))
        await pg.screenshot(path='t32_ozel.png')
        for k in ['bildirim','oyuncu','ayar','duyuru','istat','genel']:
            await pg.click(f'[data-at="{k}"]'); await pg.wait_for_timeout(150)
        print('errs',errs)
        await b.close()
asyncio.run(main())
