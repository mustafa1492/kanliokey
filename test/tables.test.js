/* v56: açık masalar (masa seç, bot yerine otur), oda bot seviyesi, hata/kural bildirimi, yönetici hamle kaydı ve oyuncu listesi */
const os=require('os'),fs=require('fs'),path=require('path');
process.env.DATA_FILE=path.join(os.tmpdir(),'ko-tables-'+process.pid+'.json');process.env.ADMIN_PASSWORD='p';process.env.QUIET='1';
const {client}=require('./wsclient.js');
let fails=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fails++};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const S=require('../server/server.js');await new Promise(r=>S.server.listen(0,r));
  const url='ws://127.0.0.1:'+S.server.address().port+'/ws';
  const adm=await client(url);await adm.call({op:'admin',pw:'p'});await adm.call({op:'set',path:'settings/main',data:{bot:2,ms:300,tm:0}});
  const A=await client(url),X=await client(url),Y=await client(url),C='TBL22',D='TBL33';
  await A.call({op:'set',path:'rooms/'+C,data:{hostName:'Ali'}});
  await A.call({op:'set',path:'rooms/'+C+'/members/'+A.uid,data:{name:'Ali',av:1}});
  let t=await X.call({op:'tables'});ok(t.ok&&t.list.length===0,'gizli masa listede görünmez');
  ok(!(await X.call({op:'update',path:'rooms/'+C,data:{pub:true}})).ok,'masayı sadece kuran açar');
  await A.call({op:'update',path:'rooms/'+C,data:{pub:true,bl:0,bots:3}});
  let r=(await A.call({op:'get',path:'rooms/'+C})).snap.data;ok(r.pub===true&&r.bl===0,'herkese açık ve bot seviyesi kaydedildi');
  t=await X.call({op:'tables'});ok(t.list.length===1&&t.list[0].st==='lobby'&&t.list[0].free===3&&t.list[0].host==='Ali','bekleyen açık masa listede');
  ok(!(await X.call({op:'takeBot',code:C,i:1,name:'Xe'})).ok,'bekleyen masada bot yerine oturulmaz (normal katılınır)');
  ok((await A.call({op:'start',code:C})).ok,'oyun başladı (3 bot)');
  await sleep(50);
  t=await X.call({op:'tables'});const e=t.list.find(x=>x.code===C);
  ok(e&&e.st==='playing'&&e.bots.length===3,'oyundaki masa 3 bot koltuğuyla listede');
  const bi=e.bots[0];
  ok((await X.call({op:'takeBot',code:C,i:bi,name:'Xe',av:2})).ok,'yabancı bot yerine oturdu');
  let g=(await X.call({op:'get',path:'rooms/'+C+'/game/main'})).snap.data;
  ok(g.seats[bi]===X.uid&&g.names[bi]==='Xe'&&g.hands['h'+bi].every(x=>x!==null),'koltuk, ad ve el yabancıya geçti');
  ok(!(await Y.call({op:'takeBot',code:C,i:bi,name:'Ye'})).ok,'aynı koltuğa ikinci kişi oturamaz');
  /* gizli masada bot yerine oturulmaz */
  await A.call({op:'update',path:'rooms/'+C,data:{pub:false}});
  const bj=g.seats.findIndex(u=>/^bot/.test(u));
  ok(!(await Y.call({op:'takeBot',code:C,i:bj,name:'Ye'})).ok,'gizli masada bot yerine oturulmaz');
  /* hamle kaydı */
  await sleep(1500);
  ok(!(await X.call({op:'adminList',k:'log',code:C})).ok,'hamle kaydını sadece yönetici görür');
  ok(!(await X.call({op:'get',path:'rooms/'+C+'/log/main'})).ok||!(await X.call({op:'get',path:'rooms/'+C+'/log/main'})).snap.exists,'kayıt belgesi oyunculara kapalı');
  const lg=await adm.call({op:'adminList',k:'log',code:C});
  ok(lg.ok&&lg.list.some(x=>/dağıtıldı/.test(x.x))&&lg.list.some(x=>/bot yerine oturdu/.test(x.x)),'kayıtta dağıtım ve oturma var');
  const gw=(await adm.call({op:'get',path:'rooms/'+C+'/game/main'})).snap.data,hw=!/^bot/.test(gw.seats[gw.turn])&&gw.trn===0; /* ilk sıra insandaysa botlar bekler */
  ok(hw||lg.list.some(x=>/ attı$| desteden çekti/.test(x.x)),'kayıtta hamleler okunur metin: '+(lg.list.slice(-1)[0]||{}).x);
  /* bildirim */
  ok(!(await X.call({op:'report',kind:'kural',text:''})).ok,'boş bildirim reddedilir');
  ok((await X.call({op:'report',kind:'kural',text:'Okeyle bitince 4 kat olmalı',code:C})).ok,'kural yanlış bildirimi gönderildi');
  ok(!(await X.call({op:'adminList',k:'reports'})).ok,'bildirimleri oyuncu göremez');
  let rp=await adm.call({op:'adminList',k:'reports'});const r1=rp.list[0];
  ok(r1&&r1.k==='kural'&&r1.n==='Xe'&&r1.c===C&&r1.hasSnap&&r1.g&&Array.isArray(r1.log),'yönetici bildirimi oda durumu ve son hamlelerle görüyor');
  const sn=await adm.call({op:'adminList',k:'repSnap',rid:r1.id});ok(sn.ok&&sn.snap&&sn.snap.hands.h0.every(x=>x!==null),'bildirim anındaki tam durum açılır');
  await adm.call({op:'adminList',k:'repSeen',rid:r1.id});rp=await adm.call({op:'adminList',k:'reports'});ok(rp.list[0].ok===1,'okundu işaretlendi');
  await adm.call({op:'adminList',k:'repDel',rid:r1.id});rp=await adm.call({op:'adminList',k:'reports'});ok(rp.list.length===0,'bildirim silindi');
  for(let k=0;k<5;k++)await Y.call({op:'report',kind:'hata',text:'deneme '+k});
  ok(!(await Y.call({op:'report',kind:'hata',text:'çok'})).ok,'bildirimde hız sınırı var');
  /* oyuncu listesi */
  const pl=await adm.call({op:'adminList',k:'players'});
  ok(pl.ok&&pl.list.some(p=>p.n==='Xe'&&p.on&&p.now.includes(C))&&pl.list.some(p=>p.n==='Ali'),'oyuncu listesinde ad, bağlı ve masa bilgisi');
  /* bot seviyesi odaya göre: Kolay botlar da oynuyor */
  g=(await adm.call({op:'get',path:'rooms/'+C+'/game/main'})).snap.data;ok(hw||g.trn>0,'oda bot seviyesiyle botlar oynuyor (tur '+g.trn+')');
  /* v57: yönetici özellikleri kapatır */
  await adm.call({op:'set',path:'settings/main',data:{pub:false,chat:false,mk:false}});
  t=await X.call({op:'tables'});ok(t.ok&&t.list.length===0,'açık masalar kapalıyken liste boş');
  ok(!(await X.call({op:'chat',code:C,text:'selam'})).ok,'sohbet kapalıyken mesaj gitmez');
  ok(!(await Y.call({op:'set',path:'rooms/'+D,data:{hostName:'Ye'}})).ok,'yeni masa kurma kapalıyken masa kurulmaz');
  await adm.call({op:'set',path:'settings/main',data:{pub:true,chat:true,mk:true}});
  ok((await X.call({op:'chat',code:C,text:'selam'})).ok&&(await Y.call({op:'set',path:'rooms/'+D,data:{hostName:'Ye'}})).ok,'açınca yine çalışır');
  for(const c of [A,X,Y,adm])c.close();await sleep(100);S.stop();try{fs.unlinkSync(process.env.DATA_FILE)}catch(e){}
  console.log(fails?'FAILED '+fails:'ALL PASSED');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
