import asyncio,sys
from playwright.async_api import async_playwright
G="const k=Object.keys(__store).find(k=>k.endsWith('/game/main'));const g=__store[k];const me=g.seats.indexOf(uid);"
async def main():
    W=int(sys.argv[2]);H=int(sys.argv[3]);out=sys.argv[4]
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':W,'height':H},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.fill('#nm','Okan'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.evaluate("CFG.ms=999999"); await pg.click('#go'); await pg.wait_for_timeout(2700)
        await pg.evaluate("(()=>{"+G+"""const L=(me+3)%4,R=(me+1)%4,T=(me+2)%4;const mk=a=>({g:a,k:'q',lo:1});
          const used=[0,1,2,26,27,28,52,53,54,78,79,80,13,14,15,16,39,40,41];[0,1,2,3].forEach(i=>{g.hands['h'+i]=g.hands['h'+i].filter(x=>!used.includes(x))});g.deck=g.deck.filter(x=>!used.includes(x));
          g.tbl['t'+L]=[mk([0,1,2]),mk([26,27,28])];g.tbl['t'+R]=[mk([52,53,54]),mk([13,14,15,16])];g.tbl['t'+T]=[mk([78,79,80]),mk([39,40,41])];g.opn['s'+L]=20;g.opn['s'+R]=22;g.opn['s'+T]=24;g.turn=me;g.ph='discard';g.tt=Date.now();return db.doc(k).set(g)})()""")
        await pg.wait_for_timeout(2600)
        m=await pg.evaluate("[document.documentElement.scrollWidth,innerWidth,document.documentElement.scrollHeight,innerHeight,(()=>{const r=document.querySelector('.acts3');return r?Math.round(r.getBoundingClientRect().bottom):0})(),(()=>{const r=document.getElementById('scene');return r?[Math.round(r.getBoundingClientRect().width),Math.round(r.getBoundingClientRect().height)]:0})()]")
        print(out,m,errs)
        await pg.screenshot(path=out)
        await b.close()
asyncio.run(main())
