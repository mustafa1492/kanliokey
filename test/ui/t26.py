# v52: botlarla hızlı oyun, whatsapp davet, yakınlaştır, tepkiler, yeni taş işareti
import asyncio,sys
from playwright.async_api import async_playwright
G="const k=Object.keys(__store).find(k=>k.endsWith('/game/main'));const g=__store[k];const me=g.seats.indexOf(uid);"
async def main():
    ok=True
    def check(n,c):
        nonlocal ok;print('OK  ' if c else 'FAIL',n);ok=ok and c
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':760},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.fill('#nm','Okan'); await pg.screenshot(path='t26_home.png',clip={'x':0,'y':360,'width':390,'height':300})
        await pg.evaluate("CFG.ms=999999"); await pg.click('#qb'); await pg.wait_for_timeout(3200)
        st=await pg.evaluate("S?[S.seats.filter(x=>x.startsWith('bot')).length,S.seats.indexOf(uid)>=0]:null"); check('botlarla hızlı oyun başladı: '+str(st),st==[3,True])
        # yeni taş
        await pg.evaluate("(()=>{"+G+"g.turn=me;g.ph='draw';g.trn=6;g.tt=Date.now();return db.doc(k).set(g)})()"); await pg.wait_for_timeout(400)
        await pg.click('#deck'); await pg.wait_for_timeout(500)
        nw=await pg.evaluate("document.querySelectorAll('#rack .t.nw').length"); check('desteden çekilen taş YENİ diye işaretli',nw==1)
        await pg.screenshot(path='t26_new.png',clip={'x':0,'y':540,'width':390,'height':220})
        # yakınlaştır
        await pg.evaluate("(()=>{"+G+"const L=(me+3)%4;g.tbl['t'+L]=[{g:[g.hands['h'+L][0]],k:'q',lo:1}];g.disc['d'+L]=[5,6,7];return db.doc(k).set(g)})()"); await pg.wait_for_timeout(300)
        await pg.click('#scene .a-left .plate'); await pg.wait_for_timeout(200)
        z=await pg.evaluate("!!document.getElementById('zoomv')&&document.querySelectorAll('#zoomv .zdis .t').length"); check('isim kutusuna dokununca yakınlaştır açıldı, atılan taşlar görünüyor: '+str(z),z==3)
        await pg.screenshot(path='t26_zoom.png')
        await pg.click('#zoomX'); await pg.wait_for_timeout(100); check('kapandı',await pg.evaluate("!document.getElementById('zoomv')"))
        # tepki
        await pg.click('#rxB'); await pg.wait_for_timeout(150); await pg.screenshot(path='t26_rx.png')
        await pg.click('[data-rx="0"]'); await pg.wait_for_timeout(500)
        bub=await pg.evaluate("(document.querySelector('.rxb')||{}).textContent||''"); check('emoji balonu çıktı: '+bub,bub=='😂')
        await pg.screenshot(path='t26_bub.png',clip={'x':0,'y':300,'width':390,'height':400})
        # lobide whatsapp
        await pg.evaluate("(()=>{leaveLocal('',true)})()"); await pg.wait_for_timeout(200)
        await pg.click('#mk'); await pg.wait_for_timeout(400)
        wa=await pg.evaluate("(document.querySelector('a.wa')||{}).href||''"); check('WhatsApp davet bağlantısı: '+wa[:60],wa.startswith('https://wa.me/?text=') and 'Oda' in __import__('urllib.parse').parse.unquote(wa))
        await pg.screenshot(path='t26_lobby.png',clip={'x':0,'y':120,'width':390,'height':300})
        check('hata yok',not errs);print(errs)
        print('ALL OK' if ok else 'SOME FAILED')
        await b.close()
asyncio.run(main())
