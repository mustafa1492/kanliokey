# v48: ayarlar sayfası, akıllı sıralama, otomatik diz, masa rengi, renk körü, çift dokunuş
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
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(500)
        await pg.click('#setT'); await pg.wait_for_timeout(200)
        check('ayarlar açıldı',await pg.evaluate("document.body.classList.contains('set-open')"))
        await pg.screenshot(path='t22_set1.png')
        await pg.evaluate("document.querySelector('#setv .sbody').scrollTop=9999"); await pg.wait_for_timeout(100)
        await pg.screenshot(path='t22_set2.png')
        await pg.fill('#setN','Mustafa'); await pg.dispatch_event('#setN','change')
        await pg.click('[data-sv="felt:bordo"]'); await pg.click('[data-sw="cb"]'); await pg.wait_for_timeout(100)
        st=await pg.evaluate("[document.body.dataset.felt,document.body.classList.contains('cb'),JSON.parse(localStorage.getItem('okeySet')).felt,name]")
        check('masa rengi, renk körü kaydedildi, ad: '+str(st),st==['bordo',True,'bordo','Mustafa'])
        await pg.click('#setX'); await pg.wait_for_timeout(150)
        await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.evaluate("CFG.ms=999999"); await pg.click('#go'); await pg.wait_for_timeout(2700)
        H=[10,36,62,88, 4,5,6, 8,34,60, 1,27, 100, 45]
        await pg.evaluate("(()=>{"+G+"const H="+str(H)+";g.B=false;g.okey={c:3,n:13};g.ind=103-14;[0,1,2,3].forEach(i=>{g.hands['h'+i]=g.hands['h'+i].filter(x=>!H.includes(x))});g.deck=g.deck.filter(x=>!H.includes(x));const ex=g.hands['h'+me].splice(0,99);g.deck.push(...ex);g.hands['h'+me]=H.slice();g.turn=me;g.ph='discard';g.trn=8;g.opn={s0:0,s1:0,s2:0,s3:0};g.mx=0;g.tt=Date.now();return db.doc(k).set(g)})()")
        await pg.wait_for_timeout(500)
        await pg.click('#sort'); await pg.wait_for_timeout(300)
        o=await pg.evaluate("order.slice()"); print('order',o)
        t=await pg.inner_text('.pbadge'); print('badge',t)
        check('akıllı sıralama en yüksek açılışı yan yana dizdi (dört 11 + 5-6-7 + 9-9-9 = 29)','29' in t)
        await pg.screenshot(path='t22_game.png')
        # otomatik diz
        await pg.click('#menuT'); await pg.wait_for_timeout(150); await pg.click('#setO'); await pg.wait_for_timeout(150)
        await pg.click('[data-sw="auto"]'); await pg.click('[data-sw="dbl"]'); await pg.click('#setX'); await pg.wait_for_timeout(150)
        await pg.evaluate("(()=>{order=order.slice().reverse();render()})()"); await pg.wait_for_timeout(100)
        await pg.evaluate("(()=>{"+G+"g.hands['h'+me].push(g.deck.shift());return db.doc(k).set(g)})()"); await pg.wait_for_timeout(400)
        t=await pg.inner_text('.pbadge'); check('taş gelince otomatik dizildi: '+t,'29' in t)
        # çift dokunuş ile at (işler olmayan bir taş): 45 = c1 n7
        await pg.click('#rack .t[data-id="45"]'); await pg.wait_for_timeout(120); await pg.click('#rack .t[data-id="45"]'); await pg.wait_for_timeout(500)
        st=await pg.evaluate("(()=>{"+G+"return [g.hands['h'+me].includes(45),g.ph,(g.disc['d'+me]||[]).slice(-1)[0]]})()")
        check('iki kez dokununca atıldı: '+str(st),st[0]==False and st[2]==45)
        check('hata yok',not errs);print(errs)
        print('ALL OK' if ok else 'SOME FAILED')
        await b.close()
asyncio.run(main())
