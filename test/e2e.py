# iki telefonla gerçek sunucu üzerinden uçtan uca deneme (Playwright)
import asyncio,sys,json,subprocess,os,time
from playwright.async_api import async_playwright
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 8791
async def main():
    ok=True
    def check(n,c):
        nonlocal ok
        print('OK  ' if c else 'FAIL',n)
        if not c: ok=False
    url=f'http://127.0.0.1:{PORT}/'
    async with async_playwright() as p:
        b=await p.chromium.launch()
        mk=lambda: b.new_context(viewport={'width':390,'height':760},device_scale_factor=2,has_touch=True,is_mobile=True)
        ca,cb=await mk(),await mk()
        A=await ca.new_page();Bp=await cb.new_page()
        errs=[]
        for pg in (A,Bp): pg.on('pageerror',lambda e:errs.append(str(e)))
        await A.goto(url);await A.wait_for_selector('#nm',timeout=15000)
        await A.fill('#nm','Ayse');await A.click('#mk');await A.wait_for_selector('.code',timeout=10000)
        code=(await A.inner_text('.code')).replace(' ','').strip()
        check('oda kuruldu '+code,len(code)==5)
        await Bp.goto(url+'?k='+code);await Bp.wait_for_selector('#cd')
        v=await Bp.input_value('#cd');check('davet bağlantısıyla kod hazır geldi',v==code)
        await Bp.fill('#nm','Bora');await Bp.click('#jn');await Bp.wait_for_selector('.code',timeout=10000)
        await A.wait_for_timeout(500)
        slots=await A.inner_text('.slots');check('kuran ikinci oyuncuyu görüyor','BORA' in slots.upper())
        await A.click('#botadd');await A.wait_for_timeout(300);await A.click('#botadd');await A.wait_for_timeout(400)
        await A.click('#go');await A.wait_for_selector('#rack',timeout=10000);await Bp.wait_for_selector('#rack',timeout=10000)
        check('iki telefonda da masa açıldı',True)
        # el gizliliği: B sayfasındaki S nesnesinde A'nın eli yok
        hidden=await Bp.evaluate("(()=>{const ia=S.seats.findIndex(u=>u!==uid&&!u.startsWith('bot'));return S.hands['h'+ia].every(x=>x===null)&&S.deck.every(x=>x===null)})()")
        check('tarayıcıda bile başkasının eli ve deste yok',hidden)
        tiles=await A.evaluate("document.querySelectorAll('#rack .t').length")
        check('ıstakada taşlar var: '+str(tiles),tiles>=14)
        # birkaç tur oyna: sıra kimdeyse desteden çek, ilk taşı at
        moves=0;t0=time.time()
        while time.time()-t0<60 and moves<10:
            for pg in (A,Bp):
                st=await pg.evaluate("S?[S.seats[S.turn]===uid,S.ph,S.must]:[false,'',-1]")
                if not st[0]: continue
                if st[1]=='draw':
                    await pg.click('#deck');await pg.wait_for_timeout(400)
                elif st[1]=='discard':
                    await pg.locator('#rack .t').first.click();await pg.wait_for_timeout(150)
                    await pg.click('#dis');await pg.wait_for_timeout(500);moves+=1
            await A.wait_for_timeout(200)
        check(f'telefonlardan {moves} taş atıldı, botlar oynadı',moves>=4)
        trn=await A.evaluate("S.trn");check('tur ilerledi: '+str(trn),trn>=6)
        # geçersiz hamle: elde olmayan taşı atma isteği
        res=await A.evaluate("SRV.call({op:'act',code,name:'discard',args:{t:999}})")
        check('sahte istek reddedildi',not res.get('ok'))
        # sunucuya doğrudan cezayı silme denemesi
        try:
            await A.evaluate("db.doc('rooms/'+code+'/game/main').update({scores:{}})");upd=True
        except Exception: upd=False
        check('istemci oyun belgesini değiştiremedi',not upd)
        await A.screenshot(path='e2e_a.png')
        check('sayfa hatası yok '+str(errs[:2]),not errs)
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
