# telefona ekleme / çevrimdışı açılış / yeni sürümde kendini yenileme
import asyncio,sys,subprocess,os,time,shutil
from playwright.async_api import async_playwright
PORT=8795;DATA=sys.argv[1]
env=dict(os.environ,PORT=str(PORT),DATA_FILE=DATA,ADMIN_PASSWORD='x',QUIET='1')
def start(): return subprocess.Popen(['node','server/server.js'],env=env)
async def main():
    ok=True
    def check(n,c):
        nonlocal ok
        print('OK  ' if c else 'FAIL',n)
        if not c: ok=False
    srv=start();time.sleep(1)
    async with async_playwright() as p:
        b=await p.chromium.launch();ctx=await b.new_context(viewport={'width':390,'height':760},is_mobile=True,has_touch=True)
        pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(f'http://127.0.0.1:{PORT}/');await pg.wait_for_selector('#nm')
        for k in range(30):
            ctl=await pg.evaluate("navigator.serviceWorker&&navigator.serviceWorker.controller?1:0")
            if ctl:break
            await pg.reload();await pg.wait_for_selector('#nm');await pg.wait_for_timeout(300)
        check('service worker sayfayı kontrol ediyor',ctl==1)
        check('telefona ekle bağlantısı ana ekranda',await pg.locator('#inst').count()==1)
        # sunucu kapalıyken sayfa yine açılır (kayıtlı kopya), açılış ekranı görünür
        srv.send_signal(15);srv.wait()
        await pg.goto(f'http://127.0.0.1:{PORT}/',timeout=15000);await pg.wait_for_timeout(4500)
        sp=await pg.evaluate("[!!document.querySelector('.splash'),document.body.classList.contains('slowconn')]")
        check('sunucu yokken kayıtlı sayfa açıldı, "sunucu uyanıyor" yazısı çıktı',sp[0] and sp[1])
        srv=start();await pg.wait_for_timeout(6000)
        check('sunucu gelince ana ekran açıldı',await pg.locator('#nm').count()==1)
        # yeni sürüm: dist/build.txt değişince açık ana ekran kendini yeniler
        srv.send_signal(15);srv.wait()
        bt='dist/build.txt';old=open(bt).read();open(bt,'w').write(old+'-yeni')
        srv=start();await pg.wait_for_timeout(9000)
        reloaded=await pg.evaluate("performance.getEntriesByType('navigation')[0].type")
        check('yeni sürümde sayfa kendini yeniledi: '+reloaded,reloaded=='reload')
        open(bt,'w').write(old)
        check('sayfa hatası yok '+str(errs[:2]),not errs)
        await b.close()
    srv.send_signal(15);srv.wait()
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
