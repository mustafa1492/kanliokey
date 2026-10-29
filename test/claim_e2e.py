# oyundan çıkan oyuncu başka telefonla (yeni kimlik) koltuğuna döner, gerçek sunucu üzerinden (Playwright)
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
        ca,cb=await mk(),await mk()
        A=await ca.new_page();Bp=await cb.new_page();errs=[]
        await A.goto(url);await A.wait_for_selector('#nm',timeout=15000)
        await A.fill('#nm','Ayse');await A.click('#mk');await A.wait_for_selector('.code',timeout=10000)
        code=(await A.inner_text('.code')).replace(' ','').strip()
        await Bp.goto(url+'?k='+code);await Bp.wait_for_selector('#cd');await Bp.fill('#nm','Bora');await Bp.click('#jn');await Bp.wait_for_selector('.code',timeout=10000)
        await A.wait_for_timeout(400);await A.click('#botfill');await A.wait_for_timeout(300);await A.click('#go')
        await Bp.wait_for_selector('#rack',timeout=10000)
        hb=await Bp.evaluate("S.hands['h'+S.seats.indexOf(uid)].slice().sort((a,c)=>a-c).join(',')")
        await cb.close();await A.wait_for_timeout(600)
        cc=await mk();C=await cc.new_page();C.on('pageerror',lambda e:errs.append(str(e)))
        await C.goto(url+'?k='+code);await C.wait_for_selector('#cd');await C.fill('#nm','Bora');await C.click('#jn')
        await C.wait_for_selector('[data-claim]',timeout=8000)
        t=await C.inner_text('.claim');check('yeni telefonda "Bora olarak dön" çıktı',('BORA' in t.upper()))
        await C.click('[data-claim]');await C.wait_for_selector('#rack',timeout=10000);await C.wait_for_timeout(500)
        hc=await C.evaluate("S.hands['h'+S.seats.indexOf(uid)].slice().sort((a,c)=>a-c).join(',')")
        check('masaya döndü, eli aynı',hc==hb)
        nm=await C.evaluate("S.names[S.seats.indexOf(uid)]");check('adı Bora',nm=='Bora')
        check('sayfa hatası yok',not errs);print(errs)
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
