# sunucu kapanıp açılınca sayfa kendini toparlıyor mu
import asyncio,sys,subprocess,os,time
from playwright.async_api import async_playwright
PORT=8793;DATA=sys.argv[1]
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
        await pg.fill('#nm','Mus');await pg.click('#mk');await pg.wait_for_selector('.code')
        await pg.click('#botfill');await pg.wait_for_timeout(300);await pg.click('#go');await pg.wait_for_selector('#rack')
        g0=await pg.evaluate('S.gid')
        srv.send_signal(15);srv.wait();await pg.wait_for_timeout(1500)
        off=await pg.evaluate("document.body.classList.contains('offline')")
        check('sunucu kapanınca "bağlantı koptu" uyarısı',off)
        srv=start();await pg.wait_for_timeout(6000)
        off2=await pg.evaluate("document.body.classList.contains('offline')")
        check('sunucu açılınca uyarı kalktı',not off2)
        g1=await pg.evaluate('S&&S.gid');check('aynı oyun sürüyor',g1==g0)
        # hamle yapabiliyor mu: sıra bende olana kadar bekle
        for k in range(60):
            st=await pg.evaluate("[S.seats[S.turn]===uid,S.ph]")
            if st[0]:break
            await pg.wait_for_timeout(500)
        if st[1]=='draw':
            await pg.click('#deck');await pg.wait_for_timeout(600)
        n0=await pg.evaluate("S.hands['h'+S.seats.indexOf(uid)].length")
        await pg.locator('#rack .t').first.click();await pg.wait_for_timeout(150);await pg.click('#dis');await pg.wait_for_timeout(800)
        n1=await pg.evaluate("S.hands['h'+S.seats.indexOf(uid)].length")
        check(f'yeniden bağlandıktan sonra taş atıldı ({n0}->{n1})',n1==n0-1)
        check('sayfa hatası yok',not errs)
        await b.close()
    srv.send_signal(15);srv.wait()
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
