# v53: perin sağına/soluna sürükleyerek istenen uca işleme, dokunarak işleme, sağ perler okunur boyutta
import asyncio,sys
from playwright.async_api import async_playwright
G="const k=Object.keys(__store).find(k=>k.endsWith('/game/main'));const g=__store[k];const me=g.seats.indexOf(uid);"
SETUP=G+"""const T=(me+2)%4,R=(me+1)%4,H=[90,103,33,1,27,100,45,70,71,12];const used=[30,31,32,...H,13,14,15,16,17,39,40,41];
[0,1,2,3].forEach(i=>{g.hands['h'+i]=g.hands['h'+i].filter(x=>!used.includes(x))});g.deck=g.deck.filter(x=>!used.includes(x));
g.B=false;g.okey={c:3,n:13};g.ind=89;g.hands['h'+me]=H.slice();g.turn=me;g.ph='discard';g.trn=12;g.tt=Date.now();g.ik=[];
g.opn={s0:0,s1:0,s2:0,s3:0};g.opn['s'+me]=20;g.opm={s0:'',s1:'',s2:'',s3:''};g.opm['s'+me]='p';g.opn['s'+T]=21;g.opn['s'+R]=25;
g.tbl={t0:[],t1:[],t2:[],t3:[]};g.tbl['t'+T]=[{g:[30,31,32],k:'q',lo:5}];g.tbl['t'+R]=[{g:[13,14,15,16,17],k:'q',lo:1},{g:[39,40,41],k:'q',lo:1}];
return db.doc(k).set(g)"""
async def main():
    ok=True
    def check(n,c):
        nonlocal ok;print('OK  ' if c else 'FAIL',n);ok=ok and c
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':393,'height':723},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        cdp=await ctx.new_cdp_session(pg)
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.fill('#nm','Okan'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.evaluate("CFG.ms=999999"); await pg.click('#go'); await pg.wait_for_timeout(2700)
        await pg.evaluate("(()=>{"+SETUP+"})()"); await pg.wait_for_timeout(600)
        async def touch(t,x,y): await cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':[{'x':x,'y':y}] if t!='touchEnd' else []})
        async def drag(x0,y0,x1,y1,shot=None):
            await touch('touchStart',x0,y0)
            for i in range(1,11): await touch('touchMove',x0+(x1-x0)*i/10,y0+(y1-y0)*i/10); await pg.wait_for_timeout(18)
            await pg.wait_for_timeout(80)
            if shot: await pg.screenshot(path=shot)
            await touch('touchEnd',x1,y1); await pg.wait_for_timeout(450)
        tb=lambda i:pg.evaluate(f"(()=>{{const r=document.querySelector('#rack .t[data-id=\"{i}\"]').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}})()")
        per=lambda:pg.evaluate("(()=>{"+G+"const T=(me+2)%4;const r=document.querySelector(`.mini.grow[data-o=\"${T}\"][data-gi=\"0\"]`).getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})()")
        lo=lambda:pg.evaluate("(()=>{"+G+"const r=g.tbl['t'+((me+2)%4)][0];return [r.lo,r.g.length]})()")
        # sağ perler okunur boyutta
        w=await pg.evaluate("(()=>{const t=document.querySelector('#scene .a-right .pers .t');return t?t.getBoundingClientRect().width:0})()")
        check(f'sağdaki per taşları okunur ({w:.1f}px)',w>=15)
        # 1) okeyi perin SOLUNA sürükle -> 4 yerine
        P=await per(); x,y=await tb(90)
        await drag(x,y,P[0]+3,(P[1]+P[3])/2+38,shot='t27_left.png')
        st=await lo(); print('sol',st); check('okey perin soluna işlendi (4 yerine)',st==[4,4])
        # 2) ikinci okeyi perin SAĞINA sürükle -> 8 yerine
        P=await per(); x,y=await tb(103)
        await drag(x,y,P[2]-3,(P[1]+P[3])/2+38)
        st=await lo(); print('sağ',st); check('okey perin sağına işlendi (8 yerine)',st==[4,5])
        # 3) dokunarak işle: 33 (sarı 8) uyuyor mu? per artık okey(4)5 6 7 okey(8): 33 okeyin yerine geçer (değiştirme) -> dokun
        await pg.evaluate("(()=>{"+G+"g.tbl['t'+((me+1)%4)].push({g:[42,43,44],k:'q',lo:4});g.deck=g.deck.filter(x=>![42,43,44].includes(x));[0,1,2,3].forEach(i=>{g.hands['h'+i]=g.hands['h'+i].filter(x=>![42,43,44].includes(x))});g.ik=[];return db.doc(k).set(g)})()"); await pg.wait_for_timeout(400)
        await pg.click('#rack .t[data-id="45"]');await pg.wait_for_timeout(100)
        r=await pg.evaluate("(()=>{"+G+"const R=(me+1)%4;const el=document.querySelector(`.mini.grow[data-o=\"${R}\"][data-gi=\"2\"]`);const b=el.getBoundingClientRect();return [b.right-3,b.top+b.height/2]})()")
        await pg.mouse.click(r[0],r[1]); await pg.wait_for_timeout(500)
        st=await pg.evaluate("(()=>{"+G+"const R=(me+1)%4;return [g.tbl['t'+R][2].g.length,g.hands['h'+me].includes(45)]})()"); print('dokun',st)
        check('taşı seçip pere dokununca işlendi',st==[4,False])
        await pg.screenshot(path='t27_after.png')
        check('hata yok',not errs);print(errs)
        print('ALL OK' if ok else 'SOME FAILED')
        await b.close()
asyncio.run(main())
