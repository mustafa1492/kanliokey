# v50: ipuçları (açma, yandan, işleme), büyük taş, oyun geçmişi, yeni ayarlar
import asyncio,sys
from playwright.async_api import async_playwright
G="const k=Object.keys(__store).find(k=>k.endsWith('/game/main'));const g=__store[k];const me=g.seats.indexOf(uid);"
def setH(H,extra=''):
    return "(()=>{"+G+"const H="+str(H)+";g.B=false;g.okey={c:3,n:13};g.ind=103-14;[0,1,2,3].forEach(i=>{g.hands['h'+i]=g.hands['h'+i].filter(x=>!H.includes(x));g.disc['d'+i]=(g.disc['d'+i]||[]).filter(x=>!H.includes(x))});g.deck=g.deck.filter(x=>!H.includes(x));const ex=g.hands['h'+me].splice(0,99);g.deck.push(...ex);g.hands['h'+me]=H.slice();g.turn=me;g.ph='discard';g.trn=8;g.opn={s0:0,s1:0,s2:0,s3:0};g.opm={s0:'',s1:'',s2:'',s3:''};g.mx=0;g.tt=Date.now();"+extra+";const n=[0,1,2,3].reduce((a,i)=>a+g.hands['h'+i].length+(g.disc['d'+i]||[]).length,0);return db.doc(k).set(g)})()"
async def main():
    ok=True
    def check(n,c):
        nonlocal ok;print('OK  ' if c else 'FAIL',n);ok=ok and c
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':760},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script(path='ui/mock.js')
        await pg.goto('file://'+sys.argv[1]); await pg.wait_for_timeout(400)
        await pg.fill('#nm','Mustafa'); await pg.click('#mk'); await pg.wait_for_timeout(300)
        await pg.click('#botfill'); await pg.evaluate("CFG.ms=999999"); await pg.click('#go'); await pg.wait_for_timeout(2700)
        # 1) açabilir
        await pg.evaluate(setH([10,36,62,88,4,5,6,8,34,60,1,27,100,45])); await pg.wait_for_timeout(400)
        t=await pg.inner_text('.hlab'); print('hlab',t); check('açma ipucu: açabilirsin/en iyi',('Açabilirsin' in t) or ('En iyi açılış' in t))
        # 2) açamaz: ne gelirse açar
        await pg.evaluate(setH([10,36,4,5,6,30,31,1,27,100,45,70,71,90])); await pg.wait_for_timeout(900)
        t=await pg.inner_text('.hlab'); print('hlab',t); check('açma ipucu: hangi taş gelirse',('Açmak için' in t) or ('En iyi' in t))
        await pg.screenshot(path='t24_need.png',clip={'x':0,'y':1060/2,'width':390,'height':230})
        # 3) yandan: soldakinin attığı taş per tamamlıyor (sıra bende, çekme aşaması)
        await pg.evaluate(setH([10,36,62,4,5,6,8,34,60,1,27,100,45,70],"g.ph='draw';g.trn=9;const pv=(me+3)%4;g.disc['d'+pv]=[88]")); await pg.wait_for_timeout(500)
        yh=await pg.evaluate("(document.querySelector('.pilebtn.yh .yhl')||{}).textContent||''"); print('yandan',yh); check('yandan taş ipucu çıktı',len(yh)>0)
        await pg.screenshot(path='t24_yan.png')
        # 4) işleme: açmışım, masada mavi 5-6-7 var, elimde mavi 8
        await pg.evaluate(setH([33,1,27,100,45,70,71,90,12,13,14],"g.opn['s'+me]=20;g.opm['s'+me]='p';g.tbl['t'+((me+2)%4)]=[{g:[30,31,32],k:'q',lo:5}];g.deck=g.deck.filter(x=>![30,31,32].includes(x));[0,1,2,3].forEach(i=>{g.hands['h'+i]=g.hands['h'+i].filter(x=>![30,31,32].includes(x))})")); await pg.wait_for_timeout(500)
        isb=await pg.evaluate("[...document.querySelectorAll('#rack .t .isb')].map(e=>e.parentElement.dataset.id)"); print('isb',isb); check('işleme ipucu: mavi 8 işaretli','33' in isb)
        await pg.screenshot(path='t24_isl.png',clip={'x':0,'y':520,'width':390,'height':240})
        # 5) büyük taş
        await pg.click('#menuT'); await pg.wait_for_timeout(100); await pg.click('#setO'); await pg.wait_for_timeout(100)
        await pg.click('[data-sw="big"]'); await pg.click('#setX'); await pg.wait_for_timeout(300)
        st=await pg.evaluate("[document.querySelectorAll('#rack .rs').length,document.documentElement.scrollWidth<=innerWidth,document.documentElement.scrollHeight<=innerHeight+1,order.filter(x=>x!=null).length,S.hands['h'+S.seats.indexOf(uid)].length]")
        print('big',st); check('büyük taş: 20 yuva, kaydırma yok, taşlar kaybolmadı',st[0]==20 and st[1] and st[2] and st[3]==st[4])
        await pg.screenshot(path='t24_big.png')
        # 6) oyun geçmişi
        await pg.evaluate("(()=>{"+G+"g.round=g.R-1;g.ph='end';g.win=99;g.last=[500,500,500,500];[0,1,2,3].forEach(i=>g.scores['s'+i]=(i===me?300:900+i));return db.doc(k).set(g)})()"); await pg.wait_for_timeout(600)
        hist=await pg.evaluate("JSON.parse(localStorage.getItem('okeyHist')||'[]').length"); check('oyun geçmişine eklendi',hist==1)
        await pg.click('#menuT'); await pg.wait_for_timeout(100); await pg.click('#setO'); await pg.wait_for_timeout(150)
        await pg.evaluate("document.querySelector('#setv .sbody').scrollTop=99999"); await pg.wait_for_timeout(100)
        await pg.screenshot(path='t24_hist.png')
        txt=await pg.evaluate("document.querySelector('#setv').textContent"); check('ayarlarda geçmiş ve yeni ayarlar',('Oyun geçmişim' in txt) and ('Kahvehane' in txt) and ('Ekranı açık tut' in txt) and ('Sıra sende' in txt))
        await pg.click('[data-sv="turnS:ses"]'); await pg.click('[data-sv="pack:sade"]'); await pg.click('[data-sw="amb"]'); await pg.wait_for_timeout(200)
        s=await pg.evaluate("JSON.parse(localStorage.getItem('okeySet'))"); check('ses ayarları kaydedildi',s['turnS']=='ses' and s['pack']=='sade' and s['amb']==True)
        check('hata yok',not errs);print(errs)
        print('ALL OK' if ok else 'SOME FAILED')
        await b.close()
asyncio.run(main())
