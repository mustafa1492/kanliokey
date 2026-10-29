# iki telefonla sohbet: bekleme odasında ve oyunda yazışma, okunmamış sayısı, isim üstünde balon (gerçek sunucu)
import asyncio,sys
from playwright.async_api import async_playwright
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 8791
async def main():
    ok=True
    def check(n,c):
        nonlocal ok;print('OK  ' if c else 'FAIL',n);ok=ok and c
    url=f'http://127.0.0.1:{PORT}/'
    async with async_playwright() as p:
        b=await p.chromium.launch()
        mk=lambda: b.new_context(viewport={'width':390,'height':760},device_scale_factor=2,has_touch=True,is_mobile=True)
        ca,cb=await mk(),await mk();A=await ca.new_page();Bp=await cb.new_page();errs=[]
        for pg in (A,Bp): pg.on('pageerror',lambda e:errs.append(str(e)))
        await A.goto(url);await A.wait_for_selector('#nm',timeout=15000);await A.fill('#nm','Ayse');await A.click('#mk');await A.wait_for_selector('.code',timeout=10000)
        code=(await A.inner_text('.code')).replace(' ','').strip()
        await Bp.goto(url+'?k='+code);await Bp.wait_for_selector('#cd');await Bp.fill('#nm','Bora');await Bp.click('#jn');await Bp.wait_for_selector('.code',timeout=10000)
        # bekleme odasında yaz
        await A.click('#rxB');await A.wait_for_selector('#chI');await A.fill('#chI','Selam, başlıyorum');await A.press('#chI','Enter');await A.wait_for_timeout(600)
        n=await Bp.evaluate("(document.querySelector('#rxB .chn')||{}).textContent||''");check('Bora okunmamış 1 görüyor: '+n,n=='1')
        await Bp.click('#rxB');await Bp.wait_for_selector('#chl .chm')
        t=await Bp.inner_text('#chl');check('mesaj Bora\'da göründü','Selam, başlıyorum' in t and 'Ayse' in t)
        await Bp.click('#chX');await A.click('#chX')
        await A.click('#botfill');await A.wait_for_timeout(300);await A.click('#go')
        await A.wait_for_selector('#rack',timeout=10000);await Bp.wait_for_selector('#rack',timeout=10000);await A.wait_for_timeout(2500)
        await Bp.click('#rxB');await Bp.fill('#chI','Kanlı okeyde dost olmaz');await Bp.click('#chF button');await Bp.wait_for_timeout(700)
        bub=await A.evaluate("[...document.querySelectorAll('.rxb')].map(e=>e.textContent)");check('oyunda Ayse, Bora\'nın isminin üstünde balonu gördü: '+str(bub),any('dost olmaz' in x for x in bub))
        await A.screenshot(path='/tmp/claude-0/-home-claude/cce3625e-a674-5cd1-b20a-d493838bc03e/scratchpad/chat_a.png')
        await Bp.screenshot(path='/tmp/claude-0/-home-claude/cce3625e-a674-5cd1-b20a-d493838bc03e/scratchpad/chat_b.png')
        check('sayfa hatası yok',not errs);print(errs)
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
