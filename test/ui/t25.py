# sol/sağ oyuncunun çok peri olunca masada görünmeli (kesilmemeli)
import asyncio,sys,json
from playwright.async_api import async_playwright
G="const k=Object.keys(__store).find(k=>k.endsWith('/game/main'));const g=__store[k];const me=g.seats.indexOf(uid);"
async def main():
    W=int(sys.argv[2]) if len(sys.argv)>2 else 393;H=int(sys.argv[3]) if len(sys.argv)>3 else 700
    ok=True
    def check(n,c):
        nonlocal ok;print('OK  ' if c else 'FAIL',n);ok=ok and c
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':W,'height':H},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        if len(sys.argv)>4: await pg.evaluate("localStorage.setItem('okeySet',JSON.stringify({big:true}));SET.big=true;applySet()")
        await pg.fill('#nm','Okan'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.evaluate("CFG.ms=999999"); await pg.click('#go'); await pg.wait_for_timeout(2700)
        # sol ve sağ oyuncuya çok per
        await pg.evaluate("(()=>{"+G+"""const L=(me+3)%4,R=(me+1)%4,T=(me+2)%4;
          const P=[[5,31,57],[8,104,10],[11],[83,84,85],[54,55,56],[0,1,2,3],[13,14],[39,40,41]];
          const all=P.flat();[0,1,2,3].forEach(i=>{g.hands['h'+i]=g.hands['h'+i].filter(x=>!all.includes(x))});g.deck=g.deck.filter(x=>!all.includes(x));
          const mk=a=>a.length===2?{g:a,k:'p',n:1}:{g:a,k:'q',lo:1};
          g.tbl['t'+L]=[mk([5,31,57]),mk([8,104,10]),mk([83,84,85]),mk([54,55,56]),mk([0,1,2,3])];
          g.tbl['t'+R]=[mk([13,14,15,16]),mk([39,40,41])];
          g.deck=g.deck.filter(x=>![15,16].includes(x));[0,1,2,3].forEach(i=>{g.hands['h'+i]=g.hands['h'+i].filter(x=>![15,16].includes(x))});
          g.opn['s'+L]=27;g.opn['s'+R]=30;g.hands['h'+L]=g.hands['h'+L].slice(0,1);g.tbl['t'+T]=[mk([66,67,68]),mk([92,93,94])];g.opn['s'+T]=40;
          return db.doc(k).set(g)})()"""); await pg.wait_for_timeout(700)
        r=await pg.evaluate("""(()=>{const out=[];document.querySelectorAll('.area').forEach(a=>{const ar=a.getBoundingClientRect();let hid=0,tot=0;a.querySelectorAll('.pers .t').forEach(t=>{tot++;const r=t.getBoundingClientRect();const sc=document.getElementById('scene').getBoundingClientRect();if(r.bottom>Math.min(ar.bottom,sc.bottom)+1||r.top<ar.top-1||r.right>ar.right+1||r.left<ar.left-1)hid++});out.push([a.className,tot,hid])});return out})()""")
        print(r)
        check('masadaki per taşlarının hepsi görünüyor',all(x[2]==0 for x in r))
        await pg.screenshot(path=f't25_{W}x{H}.png')
        print('ALL OK' if ok else 'SOME FAILED',errs)
        await b.close()
asyncio.run(main())
