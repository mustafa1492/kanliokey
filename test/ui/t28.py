# v53: zorluk modları, kolay modda uyarılar ve bitirme ipucu, odak düğmesi
import asyncio,sys
from playwright.async_api import async_playwright
G="const k=Object.keys(__store).find(k=>k.endsWith('/game/main'));const g=__store[k];const me=g.seats.indexOf(uid);"
def setH(H,extra=''):
    return "(()=>{"+G+"const H="+str(H)+";g.B=false;g.okey={c:3,n:13};g.ind=89;[0,1,2,3].forEach(i=>{g.hands['h'+i]=g.hands['h'+i].filter(x=>!H.includes(x));g.disc['d'+i]=(g.disc['d'+i]||[]).filter(x=>!H.includes(x))});g.deck=g.deck.filter(x=>!H.includes(x));const ex=g.hands['h'+me].splice(0,99);g.deck.push(...ex);g.hands['h'+me]=H.slice();g.turn=me;g.ph='discard';g.trn=8;g.ot=-1;g.opn={s0:0,s1:0,s2:0,s3:0};g.opm={s0:'',s1:'',s2:'',s3:''};g.mx=0;g.tt=Date.now();g.tbl={t0:[],t1:[],t2:[],t3:[]};"+extra+";return db.doc(k).set(g)})()"
async def main():
    ok=True
    def check(n,c):
        nonlocal ok;print('OK  ' if c else 'FAIL',n);ok=ok and c
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':393,'height':723},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.click('#setT'); await pg.click('[data-sv="lvl:zor"]'); await pg.wait_for_timeout(100)
        s=await pg.evaluate("[SET.lvl,SET.hAc,SET.hYan,SET.hIs,SET.warn]"); check('zor: ipuçları kapandı '+str(s),s==['zor',False,False,False,False])
        await pg.click('[data-sv="lvl:kolay"]'); await pg.wait_for_timeout(100)
        s=await pg.evaluate("[SET.lvl,SET.hAc,SET.hYan,SET.hIs,SET.warn]"); check('kolay: hepsi açık',s==['kolay',True,True,True,True])
        await pg.click('#setX')
        await pg.fill('#nm','Okan'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.evaluate("CFG.ms=999999"); await pg.click('#go'); await pg.wait_for_timeout(2700)
        # kolay: hangi taş gelirse
        await pg.evaluate(setH([10,36,4,5,6,30,31,1,27,100,45,70,71,90])); await pg.wait_for_timeout(1200)
        t=await pg.evaluate("document.querySelector('.hlab').textContent"); print(t); check('kolay: açma ipucu var',('Açmak için' in t) or ('açılış' in t) or ('Açabilirsin' in t))
        # kolay: okey atma uyarısı (90 okey)
        await pg.click('#rack .t[data-id="90"]'); await pg.click('#dis'); await pg.wait_for_timeout(300)
        m=await pg.evaluate("[msg,S.hands['h'+S.seats.indexOf(uid)].includes(90)]"); check('kolay: okeyi atarken uyarı '+m[0][:30],'Okeyi' in m[0] and m[1])
        # kolay: bitirme ipucu: açmış, elde 1-2-3 + 1 taş kaldı
        await pg.evaluate(setH([0,1,2,60],"g.opn['s'+me]=25;g.opm['s'+me]='p';g.mx=25")); await pg.wait_for_timeout(400)
        f=await pg.evaluate("[...document.querySelectorAll('#rack .t.fin')].map(t=>+t.dataset.id)"); t=await pg.evaluate("document.querySelector('.hlab').textContent")
        check(f'kolay: bitirebileceğin taş işaretli {f} / {t}',60 in f and 'Bitirebilirsin' in t)
        await pg.screenshot(path='t28_fin.png',clip={'x':0,'y':480,'width':393,'height':243})
        # odak
        h0=await pg.evaluate("document.querySelector('#rack .t').getBoundingClientRect().height")
        await pg.click('#fcs'); await pg.wait_for_timeout(300)
        h1=await pg.evaluate("document.querySelector('#rack .t').getBoundingClientRect().height")
        sw=await pg.evaluate("[document.documentElement.scrollWidth<=innerWidth,document.documentElement.scrollHeight<=innerHeight+1]")
        check(f'odak: taşlar büyüdü {h0:.0f}->{h1:.0f}, kaydırma yok {sw}',h1>h0*1.15 and all(sw))
        await pg.screenshot(path='t28_focus.png')
        # normal: ihtiyaç listesi yok
        await pg.evaluate("setLvl('normal');render()")
        await pg.evaluate(setH([10,36,4,5,6,30,31,1,27,100,45,70,71,90])); await pg.wait_for_timeout(1200)
        t=await pg.evaluate("document.querySelector('.hlab').textContent"); check('normal: hangi taş gelirse gösterilmez: '+t,'Açmak için' not in t)
        check('hata yok',not errs);print(errs)
        print('ALL OK' if ok else 'SOME FAILED')
        await b.close()
asyncio.run(main())
