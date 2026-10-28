# sunucu modunda yönetici paneli
import asyncio,sys,subprocess,os,time
from playwright.async_api import async_playwright
PORT=8794;env=dict(os.environ,PORT=str(PORT),DATA_FILE=sys.argv[1],ADMIN_PASSWORD='gizli-1',QUIET='1')
async def main():
    ok=True
    def check(n,c):
        nonlocal ok
        print('OK  ' if c else 'FAIL',n)
        if not c: ok=False
    srv=subprocess.Popen(['node','server/server.js'],env=env);time.sleep(1)
    async with async_playwright() as p:
        b=await p.chromium.launch()
        pl=await (await b.new_context(viewport={'width':390,'height':760})).new_page()
        await pl.goto(f'http://127.0.0.1:{PORT}/');await pl.wait_for_selector('#nm')
        await pl.fill('#nm','Oyuncu1');await pl.click('#mk');await pl.wait_for_selector('.code')
        await pl.click('#botfill');await pl.wait_for_timeout(300);await pl.click('#go');await pl.wait_for_selector('#rack')
        ad=await (await b.new_context(viewport={'width':1100,'height':900})).new_page();errs=[];ad.on('pageerror',lambda e:errs.append(str(e)))
        await ad.goto(f'http://127.0.0.1:{PORT}/');await ad.wait_for_selector('#nm')
        await ad.click('.agate summary');await ad.fill('#ap','1234');await ad.click('#adm');await ad.wait_for_timeout(500)
        check('eski şifre 1234 sunucuda geçmiyor','Şifre yanlış' in await ad.inner_text('body'))
        await ad.fill('#ap','gizli-1');await ad.click('#adm');await ad.wait_for_timeout(800)
        txt=await ad.inner_text('body');check('yönetim paneli açıldı',await ad.locator('[data-cfg]').count()>0)
        check('oda listede görünüyor','oyunda' in txt)
        await ad.click('[data-cfg="ms:500"]');await ad.wait_for_timeout(400)
        cfg=await pl.evaluate('CFG.ms');check('ayar oyuncuya ulaştı (bot hızı 500)',cfg==500)
        await ad.click('[data-watch]');await ad.wait_for_timeout(800)
        tiles=await ad.evaluate("document.querySelectorAll('.wr .mini .t').length");check('yönetici elleri görüyor: '+str(tiles),tiles>=50)
        await ad.screenshot(path='admin_srv.png')
        check('yönetici sayfasında hata yok',not errs)
        await b.close()
    srv.send_signal(15);srv.wait()
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
