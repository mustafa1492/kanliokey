import asyncio,sys,json
from playwright.async_api import async_playwright
SETUP="""(()=>{const me=S.seats.indexOf(uid);S.B=true;B=true;S.turn=me;S.ph='discard';S.trn=8;S.mx=0;S.must=-1;S.okey={c:-1,n:-1};
  S.hands['h'+me]=%s;order=[];stage=[];sel=[];
  S.opn.s%d=0;S.opn.s1=19;S.tbl.t1=[{g:[1,2,3],k:'q',lo:2},{g:[34,60,86],k:'s',n:9}];S.tbl.t2=[{g:[13,14],k:'p',n:2}];S.opn.s2=20;render()})()"""
async def main():
    ok=True
    def check(n,c):
        nonlocal ok
        print('OK  ' if c else 'FAIL',n)
        if not c: ok=False
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=False)
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.fill('#nm','Mustafa'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click("#botfill"); await pg.click("#go"); await pg.wait_for_timeout(3000)
        me=await pg.evaluate("S.seats.indexOf(uid)")
        # 1) slots: 20 slots, tiles not packed to the left
        n=await pg.evaluate("document.querySelectorAll('#rack .rs').length")
        check('24 slots',n==24)
        # 2) open scenario
        await pg.evaluate(SETUP%("[30,31,32,10,36,62,1,5,8,34,60,15,20,77,99]",me))
        await pg.wait_for_timeout(200)
        bt=await pg.inner_text('#open')
        print('open btn:',bt)
        check('open button present',('aç' in bt.lower()))
        await pg.screenshot(path='ui/v20_game.png',full_page=True)
        # 3) drag tile from slot 0 to empty slot 18
        await pg.evaluate("document.querySelector('.acts3').scrollIntoView({block:'end'})"); await pg.wait_for_timeout(100)
        before=await pg.evaluate("order.slice()")
        t0=pg.locator('#rack .rs').nth(0).locator('.t'); s18=pg.locator('#rack .rs').nth(11)
        bb=await t0.bounding_box(); sb=await s18.bounding_box()
        await pg.mouse.move(bb['x']+10,bb['y']+10); await pg.mouse.down()
        await pg.mouse.move(bb['x']+30,bb['y']+30,steps=4)
        await pg.mouse.move(sb['x']+8,sb['y']+8,steps=8)
        await pg.screenshot(path='ui/v20_drag.png')
        await pg.mouse.up(); await pg.wait_for_timeout(200)
        after=await pg.evaluate("order.slice()")
        check('drag to empty slot',after[11]==before[0] and after[0] is None)
        # put back: drag it back to slot 0 so openable pers stay contiguous
        t18=pg.locator('#rack .rs').nth(11).locator('.t'); s0=pg.locator('#rack .rs').nth(0)
        bb=await t18.bounding_box(); sb=await s0.bounding_box()
        await pg.mouse.move(bb['x']+10,bb['y']+10); await pg.mouse.down()
        await pg.mouse.move(bb['x']-20,bb['y']-20,steps=4); await pg.mouse.move(sb['x']+8,sb['y']+8,steps=8); await pg.mouse.up()
        await pg.wait_for_timeout(200)
        check('moved back',(await pg.evaluate("order[0]"))==before[0])
        # 4) open
        await pg.click('#open'); await pg.wait_for_timeout(600)
        r=await pg.evaluate("[msg,S.opn['s'+S.seats.indexOf(uid)],(S.tbl['t'+S.seats.indexOf(uid)]||[]).length]")
        print('after open:',r)
        check('opened with 2 groups',r[1]>=17 and r[2]>=2)
        await pg.screenshot(path='ui/v20_opened.png',full_page=True)
        # 5) drag-to-discard
        await pg.evaluate("(()=>{const me=S.seats.indexOf(uid);S.turn=me;S.ph='discard';S.must=-1;S.ot=-1;render()})()"); await pg.wait_for_timeout(200)
        await pg.evaluate("document.querySelector('.acts3').scrollIntoView({block:'end'})"); await pg.wait_for_timeout(100)
        hl=await pg.evaluate("S.hands['h'+S.seats.indexOf(uid)].length")
        tid=await pg.evaluate("order.find(x=>x!=null&&S.hands['h'+S.seats.indexOf(uid)].includes(x))")
        t=pg.locator(f'#rack .t[data-id="{tid}"]'); bb=await t.bounding_box()
        sc=await pg.locator('#scene').bounding_box()
        await pg.mouse.move(bb['x']+10,bb['y']+10); await pg.mouse.down()
        await pg.mouse.move(bb['x']+20,bb['y']-40,steps=4)
        await pg.screenshot(path='ui/v20_dragdisc.png')
        tx=sc['x']+sc['width']/2; ty=pg.viewport_size['height']/3
        await pg.mouse.move(tx,sc['y']+60,steps=10)
        hot=await pg.evaluate("document.querySelector('#scene').classList.contains('hot')")
        check('scene hot while hovering',hot)
        await pg.mouse.up(); await pg.wait_for_timeout(500)
        r=await pg.evaluate("[S.hands['h'+S.seats.indexOf(uid)].length,S.disc['d'+S.seats.indexOf(uid)].includes(%d),S.turn]"%tid)
        print('after discard:',r)
        check('tile discarded by dragging to table',r[0]==hl-1 and r[1])
        # 6) toast on failed open (not enough points)
        await pg.evaluate("(()=>{const me=S.seats.indexOf(uid);S.turn=me;S.ph='discard';S.opn['s'+me]=0;S.tbl['t'+me]=[];S.hands['h'+me]=[0,5,20,33,44,50,61,70,80,90,100,3,12,25,40];S.trn=8;S.mx=0;order=[];render()})()")
        await pg.wait_for_timeout(200)
        await pg.click('#open'); await pg.wait_for_timeout(300)
        tv=await pg.evaluate("(()=>{const t=document.querySelector('.tst');if(!t)return null;const r=t.getBoundingClientRect();return [t.textContent,r.top>=0&&r.bottom<=innerHeight]})()")
        print('toast:',tv)
        check('toast visible in viewport',tv is not None and tv[1])
        # first-round early open
        await pg.evaluate("(()=>{S.trn=1;render()})()")
        await pg.wait_for_timeout(100)
        await pg.click('#open'); await pg.wait_for_timeout(300)
        sn=await pg.evaluate("(document.querySelector('.tst')||{}).textContent")
        print('early toast:',sn)
        check('early toast',sn and 'İlk tur' in sn)
        print('errors:',errs); check('no page errors',not errs)
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
