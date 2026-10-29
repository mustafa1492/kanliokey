# v56 sunucu modu: açık masa, bot seviyesi, bot yerine oturma, bildirim, yönetici paneli
import asyncio
from playwright.async_api import async_playwright
U='http://localhost:8791/'
async def main():
    ok=True
    def check(n,c):
        nonlocal ok;print('OK  ' if c else 'FAIL',n);ok=ok and c
    async with async_playwright() as p:
        b=await p.chromium.launch()
        mk=lambda:b.new_context(viewport={'width':393,'height':760},device_scale_factor=2,has_touch=True,is_mobile=True)
        ca=await mk();A=await ca.new_page();errs=[];A.on('pageerror',lambda e:errs.append('A '+str(e)))
        await A.goto(U);await A.wait_for_timeout(1200)
        await A.fill('#nm','Mustafa');await A.click('#mk');await A.wait_for_timeout(700)
        await A.click('#pubT');await A.wait_for_timeout(300)
        await A.click('[data-bl="0"]');await A.wait_for_timeout(300)
        await A.click('#botfill');await A.wait_for_timeout(400)
        await A.screenshot(path='t31_lobby.png',full_page=True)
        pr=await A.evaluate("[ROOM.pub,ROOM.bl,ROOM.bots]");check('masa açık, bot kolay, 3 bot '+str(pr),pr==[True,0,3])
        cb=await mk();Bp=await cb.new_page();Bp.on('pageerror',lambda e:errs.append('B '+str(e)))
        await Bp.goto(U);await Bp.wait_for_timeout(1500)
        n=await Bp.evaluate("document.querySelectorAll('.tables .tbr').length");check('B ana ekranda bekleyen masayı görüyor',n==1)
        await Bp.screenshot(path='t31_home_lobby.png',full_page=True)
        await A.click('#go');await A.wait_for_timeout(1500)
        await Bp.evaluate("tblAt=0;fetchTables(true)");await Bp.wait_for_timeout(800)
        t=await Bp.evaluate("(document.querySelector('[data-tb]')||{}).textContent||''");check('oyundaki masada "Bot yerine otur" var',t=='Bot yerine otur')
        await Bp.screenshot(path='t31_home_play.png',full_page=True)
        await Bp.fill('#nm','Yabancı');await Bp.click('[data-tb]');await Bp.wait_for_timeout(1500)
        g=await Bp.evaluate("S&&S.seats?S.seats.indexOf(uid):-1");check('B masaya oturdu (koltuk '+str(g)+')',g>=0)
        nm=await A.evaluate("S.names.join(',')");check('A masada Yabancı görünüyor: '+nm,'Yabancı' in nm)
        await Bp.wait_for_timeout(2500)
        await Bp.screenshot(path='t31_game_B.png')
        # bildirim
        await Bp.evaluate("document.body.classList.add('menu-open')");await Bp.wait_for_timeout(200)
        await Bp.click('#repO');await Bp.wait_for_timeout(300)
        await Bp.click('[data-rk="kural"]');await Bp.fill('#repT','İşlenen taş okey olunca ceza 2 kat olmalı');await Bp.click('#repS');await Bp.wait_for_timeout(800)
        m=await Bp.evaluate("(document.getElementById('repM')||{}).textContent||'kapandı'");check('bildirim gönderildi: '+m,'Gönderildi' in m or m=='kapandı')
        # yönetici
        cc=await mk();Ad=await cc.new_page();Ad.on('pageerror',lambda e:errs.append('Adm '+str(e)))
        await Ad.goto(U);await Ad.wait_for_timeout(1200)
        await Ad.evaluate("document.querySelector('.agate').open=true");await Ad.fill('#ap','test1234');await Ad.click('#adm');await Ad.wait_for_timeout(1500)
        await Ad.click('[data-at="bildirim"]');await Ad.wait_for_timeout(500);r0=await Ad.evaluate("document.querySelectorAll('.rep1').length");await Ad.click('[data-at="oyuncu"]');await Ad.wait_for_timeout(500);r=[r0,await Ad.evaluate("document.querySelectorAll('.plr').length")];check('yönetici: bildirim ve oyuncular '+str(r),r[0]==1 and r[1]>=2)
        await Ad.screenshot(path='t31_admin.png',full_page=True)
        await Ad.click('[data-at="bildirim"]');await Ad.wait_for_timeout(600);await Ad.click('[data-at="genel"]');await Ad.wait_for_timeout(300);await Ad.click('[data-watch]');await Ad.wait_for_timeout(1500)
        k=await Ad.evaluate("document.querySelectorAll('.alog .alr').length");check('yönetici: hamle kaydı '+str(k),k>=2)
        await Ad.screenshot(path='t31_admroom.png',full_page=True)
        await Ad.click('#admlist');await Ad.wait_for_timeout(800)
        await Ad.click('[data-at="bildirim"]');await Ad.wait_for_timeout(500);await Ad.click('[data-rep^="snap:"]');await Ad.wait_for_timeout(800)
        w=await Ad.evaluate("document.querySelectorAll('.wr').length");check('bildirim anındaki durum açılıyor',w==4)
        print('errors',errs)
        print('ALL OK' if ok and not errs else 'SOME FAILED')
        await b.close()
asyncio.run(main())
