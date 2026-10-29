import asyncio,sys
from playwright.async_api import async_playwright
async def main():
    ok=True
    def check(n,c):
        nonlocal ok
        print('OK  ' if c else 'FAIL',n)
        if not c: ok=False
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); pg=await b.new_page(viewport={'width':390,'height':844})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.fill('#nm','Mustafa'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.click('#go'); await pg.wait_for_timeout(2500)
        await pg.mouse.click(10,10)
        names=await pg.evaluate("['pick','drop','draw','discard','place','open','swap','turn','tick','penalty','win','lose','deckend','deal','shuffle']")
        r=await pg.evaluate("""(()=>{const out=[];for(const n of ['pick','drop','draw','discard','place','open','swap','turn','tick','penalty','win','lose','deckend','deal','shuffle']){try{SFX.play(n,3);out.push(n+':ok')}catch(e){out.push(n+':ERR '+e.message)}}return out})()""")
        print(r)
        check('tüm sesler hatasız çalıştı',all(x.endswith(':ok') for x in r))
        st=await pg.evaluate("(()=>{const c=window.__ctxState;return typeof SFX.snd})()")
        # fark testi: sentetik durumlar
        res=await pg.evaluate("""(()=>{
          const calls=[];const orig=SFX.play,ol=SFX.later,ov=SFX.vib;
          SFX.play=(n)=>calls.push(n);SFX.later=(n)=>calls.push('L'+n);SFX.vib=(p)=>calls.push('V');
          const me=S.seats.indexOf(uid);
          const A=JSON.parse(JSON.stringify(S)),Bs=JSON.parse(JSON.stringify(S));
          // ceza
          Bs.ex={...(Bs.ex||{}),['s'+me]:((Bs.ex||{})['s'+me]||0)+70};sfxDiff(A,Bs);const pen=calls.slice();calls.length=0;
          // sıra bana geldi
          const C=JSON.parse(JSON.stringify(S)),D=JSON.parse(JSON.stringify(S));C.turn=(me+3)%4;D.turn=me;D.ph='draw';D.disc['d'+C.turn]=[...(D.disc['d'+C.turn]||[]),5];sfxDiff(C,D);const turn=calls.slice();calls.length=0;
          // el bitti ve ben kazandım
          const E=JSON.parse(JSON.stringify(S)),F=JSON.parse(JSON.stringify(S));E.ph='discard';F.ph='end';F.win=me;F.round=0;F.R=9;sfxDiff(E,F);const win=calls.slice();calls.length=0;
          // yeni dağıtım
          const G1=JSON.parse(JSON.stringify(S)),H=JSON.parse(JSON.stringify(S));H.gid=(H.gid||0)+1;sfxDiff(G1,H);const deal=calls.slice();
          SFX.play=orig;SFX.later=ol;SFX.vib=ov;
          return {pen,turn,win,deal,flash:Date.now()-flashPen<500}})()""")
        print(res)
        check('ceza sesi + titreşim + kan akışı',('Lpenalty' in res['pen']) and ('V' in res['pen']) and res['flash'])
        check('sıra bana gelince çan + atılan taş sesi',('Lturn' in res['turn']) and ('Ldiscard' in res['turn']))
        check('kazanınca zafer sesi',('win' in res['win']))
        check('yeni dağıtımda dağıtma sesi',res['deal']==['deal'])
        # anahtarlar
        await pg.click('#menuT'); await pg.click('[data-tg=snd]'); s1=await pg.evaluate("SFX.snd"); await pg.click('[data-tg=snd]'); s2=await pg.evaluate("SFX.snd")
        check('ses anahtarı kapanıp açılıyor',s1==False and s2==True)
        await pg.click('#setO'); await pg.click('[data-sw=vib]'); v1=await pg.evaluate("SFX.vb"); await pg.click('[data-sw=vib]'); await pg.click('#setX')
        check('titreşim anahtarı çalışıyor',v1==False)
        check('hata yok',not errs)
        print(errs)
        await b.close()
    print('ALL OK' if ok else 'SOME FAILED')
asyncio.run(main())
