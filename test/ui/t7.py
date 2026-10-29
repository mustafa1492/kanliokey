import asyncio,sys
from playwright.async_api import async_playwright
GAME="""(f)=>{const k=Object.keys(__store).find(k=>k.endsWith('/game/main'));const g=__store[k];const me=g.seats.indexOf(uid);f(g,me);return db.doc(k).set(g)}"""
async def main():
    ok=True
    def check(n,c):
        nonlocal ok
        print('OK  ' if c else 'FAIL',n)
        if not c: ok=False
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.fill('#nm','Mustafa'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.click('#go'); await pg.wait_for_timeout(3000)
        # bots must not interfere: make them wait by setting my turn / phase directly in the store
        async def setg(js):
            await pg.evaluate("(()=>{const k=Object.keys(__store).find(k=>k.endsWith('/game/main'));const g=__store[k];const me=g.seats.indexOf(uid);"+js+";return db.doc(k).set(g)})()")
            await pg.wait_for_timeout(250)
        async def drag(src,dst,off=(8,8)):
            a=await src.bounding_box(); c=await dst.bounding_box()
            await pg.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2); await pg.mouse.down()
            await pg.mouse.move(a['x']+a['width']/2+15,a['y']+a['height']/2-15,steps=4)
            await pg.mouse.move(c['x']+off[0],c['y']+off[1],steps=8)
            await pg.mouse.up(); await pg.wait_for_timeout(500)
        # ---- deck drag
        await setg("g.B=true;g.okey={c:-1,n:-1};g.turn=me;g.ph='draw';g.trn=8;g.must=-1;g.ot=-1;g.hands['h'+me]=g.hands['h'+me].slice(0,14);g.deck=g.deck.length?g.deck:[50,51]")
        await pg.evaluate("document.querySelector('.acts3').scrollIntoView({block:'end'})"); await pg.wait_for_timeout(150)
        n0=await pg.evaluate("S.hands['h'+S.seats.indexOf(uid)].length")
        await drag(pg.locator('#deck'),pg.locator('#rack .rs').nth(13))
        r=await pg.evaluate("[S.hands['h'+S.seats.indexOf(uid)].length,S.ph,order.findIndex(x=>x!=null&&x===S.hands['h'+S.seats.indexOf(uid)][S.hands['h'+S.seats.indexOf(uid)].length-1])]")
        print('deck drag:',n0,r)
        check('deck drag draws a tile',r[0]==n0+1 and r[1]=='discard')
        check('drawn tile lands in dropped slot (13)',r[2]==13)
        # ---- take discard drag
        await setg("g.turn=me;g.ph='draw';g.must=-1;const pv=(me+3)%4;g.disc['d'+pv]=[g.disc['d'+pv][0]??77,88];g.hands['h'+me]=g.hands['h'+me].filter(x=>x!==88).slice(0,14)")
        await pg.evaluate("document.querySelector('.acts3').scrollIntoView({block:'end'})"); await pg.wait_for_timeout(150)
        check('side pile tile present',await pg.locator('#tk').count()==1)
        n0=await pg.evaluate("S.hands['h'+S.seats.indexOf(uid)].length")
        await drag(pg.locator('#tk'),pg.locator('#rack .rs').nth(23))
        r=await pg.evaluate("[S.hands['h'+S.seats.indexOf(uid)].length,S.must,order[23]]")
        print('take drag:',n0,r)
        check('side tile taken by dragging',r[0]==n0+1 and r[1]==88 and r[2]==88)
        # ---- işleme by drag
        await setg("g.turn=me;g.ph='discard';g.must=-1;g.ot=-1;g.opn['s'+me]=20;g.opm=g.opm||{};g.opm['s'+me]='p';g.tbl['t1']=[{g:[1,2,3],k:'q',lo:2}];g.opn.s1=19;g.hands['h'+me]=[4,60,61,62,70,71,72,80,81,82,90,91,92,100];g.ik=[];g.ex={s0:0,s1:0,s2:0,s3:0}")
        await pg.evaluate("order=[];render()"); await pg.wait_for_timeout(200)
        await pg.evaluate("document.querySelector('.acts3').scrollIntoView({block:'end'})"); await pg.wait_for_timeout(150)
        pre=await pg.evaluate("S.hands['h'+S.seats.indexOf(uid)].length")
        tl=pg.locator('#rack .t[data-id="4"]')
        per=pg.locator('.mini.grow[data-o="1"]')
        await pg.evaluate("document.querySelector('#scene').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(100)
        # need both visible: drag from rack to the per row; scroll so both fit
        await pg.evaluate("window.scrollTo(0,document.querySelector('.mini.grow[data-o=\"1\"]').getBoundingClientRect().top+scrollY-120)"); await pg.wait_for_timeout(150)
        vis=await tl.bounding_box()
        print('rack tile y',vis['y'] if vis else None)
        await drag(tl,per,off=(20,8))
        r=await pg.evaluate("[S.tbl.t1[0].g.length,S.hands['h'+S.seats.indexOf(uid)].length,S.scores.s1,(S.ex||{}).s1]")
        print('işleme:',pre,r)
        check('tile işlendi by dragging onto per',r[0]==4 and r[1]==pre-1)
        check('owner got penalty',r[2]>0 and r[3]>0)
        # ---- pen panel
        await pg.evaluate("window.scrollTo(0,0)"); await pg.click('#pen'); await pg.wait_for_timeout(150)
        txt=await pg.inner_text('.penpanel')
        print(txt.replace('\n',' | '))
        check('pen panel shows bu tur',('bu tur +' in txt.lower() or 'BU TUR +' in txt))
        await pg.screenshot(path='ui/v21_pen.png')
        await pg.click('#pen')
        await pg.evaluate("window.scrollTo(0,0)")
        await pg.screenshot(path='ui/v21_game.png',full_page=True)
        print('errors:',errs); check('no page errors',not errs)
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
