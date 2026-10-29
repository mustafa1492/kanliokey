/* oyundan çıkan oyuncu geri döner: telefon/tarayıcı değişip kimlik değişse de, bağlı olmayan insan oyuncunun koltuğuna oda koduyla geçilir */
const os=require('os'),fs=require('fs'),path=require('path');
process.env.DATA_FILE=path.join(os.tmpdir(),'ko-claim-'+process.pid+'.json');process.env.ADMIN_PASSWORD='p';process.env.QUIET='1';
const {client}=require('./wsclient.js');
let fails=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fails++};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const S=require('../server/server.js');await new Promise(r=>S.server.listen(0,r));
  const url='ws://127.0.0.1:'+S.server.address().port+'/ws';
  const adm=await client(url);await adm.call({op:'admin',pw:'p'});await adm.call({op:'set',path:'settings/main',data:{bot:0,ms:60000,tm:0}});
  const A=await client(url),Bc=await client(url),C='CLM22';
  await A.call({op:'set',path:'rooms/'+C,data:{hostName:'Ali'}});
  await A.call({op:'set',path:'rooms/'+C+'/members/'+A.uid,data:{name:'Ali',av:3}});
  await Bc.call({op:'set',path:'rooms/'+C+'/members/'+Bc.uid,data:{name:'Bora',av:5}});
  await A.call({op:'update',path:'rooms/'+C,data:{bots:2}});
  ok((await A.call({op:'start',code:C})).ok,'oyun başladı');
  await sleep(100);
  const N=await client(url); /* Bora'nın yeni telefonu: yeni kimlik */
  let q=await N.call({op:'seats',code:C});
  ok(q.ok&&q.seats.length===0,'Bora bağlıyken koltuğu boş görünmez');
  ok(!(await N.call({op:'claim',code:C,i:0})).ok&&!(await N.call({op:'claim',code:C,i:1})).ok,'bağlı oyuncunun ya da botun yerine geçilemez');
  Bc.close();await sleep(150);
  q=await N.call({op:'seats',code:C});
  ok(q.ok&&q.seats.length===1&&q.seats[0].n==='Bora','Bora çıkınca koltuğu dönülebilir görünüyor: '+JSON.stringify(q.seats));
  const i=q.seats[0].i;
  ok((await N.call({op:'claim',code:C,i})).ok,'yeni telefon Bora koltuğuna döndü');
  const g=(await N.call({op:'get',path:'rooms/'+C+'/game/main'})).snap.data;
  ok(g.seats[i]===N.uid&&g.names[i]==='Bora'&&Array.isArray(g.hands['h'+i])&&g.hands['h'+i].length>=14,'koltuk, ad ve el aynen duruyor');
  const others=[0,1,2,3].filter(k=>k!==i);
  ok(others.every(k=>g.hands['h'+k].every(x=>x===null)),'başkalarının eli yine gizli');
  const mem=(await N.call({op:'get',path:'rooms/'+C+'/members/'+N.uid})).snap;
  ok(mem.exists&&mem.data.name==='Bora'&&mem.data.av===5,'üyelik ve karakter taşındı');
  ok(!(await A.call({op:'seats',code:C})).seats.length,'oturan oyuncuya dönüş listesi çıkmaz');
  /* kuran çıkarsa kuranlık da geçer */
  A.close();await sleep(150);
  const N2=await client(url);q=await N2.call({op:'seats',code:C});
  const ia=q.seats.find(x=>x.n==='Ali');ok(!!ia,'Ali çıkınca dönülebilir');
  ok((await N2.call({op:'claim',code:C,i:ia.i})).ok,'Ali yeni telefonla döndü');
  const r=(await N2.call({op:'get',path:'rooms/'+C})).snap.data;ok(r.host===N2.uid,'masayı kuran da yeni kimliğe geçti');
  for(const c of [N,N2,adm])c.close();await sleep(100);S.stop();try{fs.unlinkSync(process.env.DATA_FILE)}catch(e){}
  console.log(fails?'FAILED '+fails:'ALL PASSED');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
