# uzun bot oyunu: ben de sürükleyerek oynarım (desteden çek, aç, uçlara işle, at); hata, takılma, taş sayısı denetlenir
import asyncio,sys,random,time
from playwright.async_api import async_playwright
async def main():
    W=int(sys.argv[2]) if len(sys.argv)>2 else 393;H=int(sys.argv[3]) if len(sys.argv)>3 else 723;N=int(sys.argv[4]) if len(sys.argv)>4 else 250
    rnd=random.Random(7)
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':W,'height':H},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        cdp=await ctx.new_cdp_session(pg)
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.fill('#nm','Okan'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.click('#go'); await pg.wait_for_timeout(500)
        await pg.evaluate("CFG.ms=120;CFG.tm=0;CFG.bot=0")
        async def touch(t,x,y): await cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':[{'x':x,'y':y}] if t!='touchEnd' else []})
        dstate=[None]
        async def drag(x0,y0,x1,y1):
            await touch('touchStart',x0,y0)
            for i in range(1,9): await touch('touchMove',x0+(x1-x0)*i/8,y0+(y1-y0)*i/8); await pg.wait_for_timeout(14)
            await pg.wait_for_timeout(40)
            dstate[0]=await pg.evaluate("drag?JSON.stringify({on:drag.on,ins:drag.ins,disc:drag.disc,tgt:drag.tgt,zc:drag.zc&&drag.zc.m.map(o=>[o.el.dataset.o,o.el.dataset.gi,o.c,Math.round(o.r.left),Math.round(o.r.top),Math.round(o.r.right),Math.round(o.r.bottom)])}):'nodrag'")
            await touch('touchEnd',x1,y1); await pg.wait_for_timeout(250)
        stats={'turns':0,'ins_try':0,'ins_ok':0,'open':0,'disc':0,'hands':set(),'bad106':0,'stuck':0}
        last=None;same=0;t0=time.time()
        for it in range(N*6):
            if time.time()-t0>540:break
            st=await pg.evaluate("(()=>{if(!S||!S.seats)return null;const me=S.seats.indexOf(uid);const n=tileCount(S);return {mine:S.turn===me,ph:S.ph,gid:S.gid,round:S.round,R:S.R,trn:S.trn,n,opened:S.opn['s'+me]>0,h:S.hands['h'+me].length,must:S.must,final:S.ph==='end'&&S.round+1>=S.R}})()")
            if not st: await pg.wait_for_timeout(200);continue
            stats['hands'].add(st['gid'])
            if st['n']!=106: stats['bad106']+=1
            key=(st['gid'],st['trn'],st['ph'],st['h'])
            same=same+1 if key==last else 0;last=key
            if same>80: stats['stuck']+=1;print('STUCK',st);same=0
            if st['final']: break
            if st['ph']=='end':
                await pg.wait_for_timeout(400)
                if await pg.evaluate("!!document.getElementById('again')"): await pg.click('#again')
                continue
            if not st['mine']: await pg.wait_for_timeout(120);continue
            if st['ph']=='draw':
                d=await pg.evaluate("(()=>{const a=document.getElementById('deck').getBoundingClientRect(),r=document.getElementById('rack').getBoundingClientRect();return [a.x+a.width/2,a.y+a.height/2,r.x+r.width*0.85,r.y+r.height*0.75]})()")
                await drag(d[0],d[1],d[2],d[3]+38); stats['turns']+=1; continue
            # atma aşaması
            if st['must']>=0:
                await pg.evaluate("putBack()"); await pg.wait_for_timeout(200); continue
            if not st['opened']:
                ok=await pg.evaluate("(()=>{try{sortRack();render();return true}catch(e){return false}})()")
                can=await pg.evaluate("!document.getElementById('open').classList.contains('dim')")
                if it%15==0: print('dbg',await pg.evaluate("(()=>{const me=S.seats.indexOf(uid);B=S.B;return [S.trn,S.mx,handPts(S.hands['h'+me],S.okey),document.querySelector('.pbadge').textContent,document.getElementById('open').className,order.filter(x=>x!=null).length]})()"))
                if can:
                    await pg.click('#open'); await pg.wait_for_timeout(300); stats['open']+=1; continue
            else:
                # işlenebilen taşları perlerin uçlarına sürükle
                await pg.wait_for_timeout(450)
                tgt=await pg.evaluate("""(()=>{B=S.B;const me=S.seats.indexOf(uid),h=S.hands['h'+me],O=S.okey;if(h.length<2)return null;
                  for(const id of h){if(isJ(id,O))continue;for(let o=0;o<4;o++)(S.tbl['t'+o]||[]).forEach((r,gi)=>{});
                    for(let o=0;o<4;o++){const L=S.tbl['t'+o]||[];for(let gi=0;gi<L.length;gi++){const r=L[gi];const fr=canAdd(r,id,O).filter(e=>!(S.ik||[]).includes(o+':'+gi+':'+e));
                      if(!fr.length)continue;const el=document.querySelector(`.mini.grow[data-o="${o}"][data-gi="${gi}"]`),t=document.querySelector(`#rack .t[data-id="${id}"]`);if(!el||!t)continue;
                      const a=el.getBoundingClientRect(),b=t.getBoundingClientRect();if(!a.width)continue;const e=fr[0];
                      return {id,o,gi,e,len:r.g.length,x0:b.x+b.width/2,y0:b.y+b.height/2,x1:e==='l'?a.left+2:e==='h'?a.right-2:a.left+a.width/2,y1:a.top+a.height/2}}}}return null})()""")
                if tgt:
                    stats['ins_try']+=1
                    efp=await pg.evaluate(f"(()=>{{const e=document.elementFromPoint({tgt['x0']},{tgt['y0']});return e?(e.className+'|'+(e.dataset&&e.dataset.id)+'|'+e.tagName+'|'+(e.closest('.rs')?'rs':'')+'|'+(e.closest('#app')?'app':'out')):'none'}})()")
                    await drag(tgt['x0'],tgt['y0'],tgt['x1'],tgt['y1']+38)
                    ln=await pg.evaluate(f"(S.tbl['t'+{tgt['o']}]||[])[{tgt['gi']}]?S.tbl['t'+{tgt['o']}][{tgt['gi']}].g.length:-1")
                    if ln==tgt['len']+1: stats['ins_ok']+=1
                    else: print('işleme olmadı',efp,tgt['id'],ln,await pg.evaluate("msg"),dstate[0])
                    continue
            # at: işler olmayan, mümkünse en yüksek
            d=await pg.evaluate("""(()=>{B=S.B;const me=S.seats.indexOf(uid),h=S.hands['h'+me],O=S.okey;let c=h.filter(x=>!ishler(S,x,O)&&!isJ(x,O));if(!c.length)c=h.slice();c.sort((a,b)=>tv(b,O).n-tv(a,O).n);const id=c[0];
              const t=document.querySelector(`#rack .t[data-id="${id}"]`),s=document.getElementById('scene').getBoundingClientRect();if(!t)return null;const b=t.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2,s.x+s.width*0.5,s.y+s.height*0.62]})()""")
            if d:
                await drag(d[0],d[1],d[2],d[3]+38)
                if await pg.evaluate("/işler|Emin misin/.test(msg)"): await drag(d[0],d[1],d[2],d[3]+38)
                stats['disc']+=1
        stats['hands']=len(stats['hands'])
        print(stats,'errs',errs[:3])
        print('BOTPLAY OK' if not errs and stats['stuck']==0 and stats['bad106']==0 and stats['ins_ok']==stats['ins_try'] else 'BOTPLAY PROBLEM')
        await b.close()
asyncio.run(main())
