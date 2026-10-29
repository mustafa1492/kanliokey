/* sohbet: odadakiler yazar ve okur, dışarıdan okunamaz, hız sınırı, son 60 mesaj */
const os=require('os'),fs=require('fs'),path=require('path');
process.env.DATA_FILE=path.join(os.tmpdir(),'ko-chat-'+process.pid+'.json');process.env.ADMIN_PASSWORD='p';process.env.QUIET='1';
const {client}=require('./wsclient.js');
let fails=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fails++};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const S=require('../server/server.js');await new Promise(r=>S.server.listen(0,r));
  const url='ws://127.0.0.1:'+S.server.address().port+'/ws';
  const A=await client(url),Bc=await client(url),X=await client(url),C='CHT22';
  await A.call({op:'set',path:'rooms/'+C,data:{hostName:'Ali'}});
  await A.call({op:'set',path:'rooms/'+C+'/members/'+A.uid,data:{name:'Ali'}});
  await Bc.call({op:'set',path:'rooms/'+C+'/members/'+Bc.uid,data:{name:'Bora'}});
  let seen=null;Bc.sub('doc','rooms/'+C+'/chat/main',s=>{seen=s.exists?s.data:null});
  ok((await A.call({op:'chat',code:C,text:'  Selam <b>Bora</b>\n naber '})).ok,'Ali yazdı');
  await sleep(150);
  ok(seen&&seen.m.length===1&&seen.m[0].n==='Ali'&&seen.m[0].x==='Selam <b>Bora</b> naber','Bora anında gördü (boşluklar toplandı): '+JSON.stringify(seen&&seen.m[0].x));
  ok(!(await X.call({op:'get',path:'rooms/'+C+'/chat/main'})).ok,'odada olmayan okuyamaz');
  ok(!(await X.call({op:'chat',code:C,text:'spam'})).ok,'odada olmayan yazamaz');
  ok(!(await A.call({op:'set',path:'rooms/'+C+'/chat/main',data:{m:[]}})).ok,'sohbet doğrudan değiştirilemez');
  let rated=false;for(let i=0;i<8;i++){const r=await A.call({op:'chat',code:C,text:'m'+i});if(!r.ok)rated=true}
  ok(rated,'çok hızlı yazınca yavaşlatıldı');
  ok(!(await A.call({op:'chat',code:C,text:'   '})).ok,'boş mesaj gitmez');
  for(const c of [A,Bc,X])c.close();await sleep(100);S.stop();try{fs.unlinkSync(process.env.DATA_FILE)}catch(e){}
  console.log(fails?'FAILED '+fails:'ALL PASSED');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
