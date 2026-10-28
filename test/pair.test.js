/* eşli oyun sunucuda: kuran eşleri seçer, eşler karşılıklı oturur, el sonunda bitirenin eşine ceza yazılmaz */
const os=require('os'),fs=require('fs'),path=require('path');
process.env.DATA_FILE=path.join(os.tmpdir(),'ko-pair-'+process.pid+'.json');process.env.ADMIN_PASSWORD='p';process.env.QUIET='1';
const {client}=require('./wsclient.js');
let fails=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fails++};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const S=require('../server/server.js');await new Promise(r=>S.server.listen(0,r));
  const url='ws://127.0.0.1:'+S.server.address().port+'/ws';
  const adm=await client(url);await adm.call({op:'admin',pw:'p'});await adm.call({op:'set',path:'settings/main',data:{bot:0,ms:300,tm:0}});
  const A=await client(url),Bc=await client(url),C='PAR22';
  await A.call({op:'set',path:'rooms/'+C,data:{hostName:'A'}});
  await A.call({op:'set',path:'rooms/'+C+'/members/'+A.uid,data:{name:'Ali'}});
  await Bc.call({op:'set',path:'rooms/'+C+'/members/'+Bc.uid,data:{name:'Bora'}});
  ok(!(await Bc.call({op:'update',path:'rooms/'+C,data:{pair:true}})).ok,'eşli ayarını sadece kuran açar');
  ok((await A.call({op:'update',path:'rooms/'+C,data:{pair:true,pr:0,bots:2}})).ok,'kuran eşliyi açtı, Ali + Bora eş');
  ok((await A.call({op:'start',code:C})).ok,'eşli oyun başladı');
  let g=null;A.sub('doc','rooms/'+C+'/game/main',s=>{g=s.exists?s.data:null});await sleep(200);
  const ia=g.seats.indexOf(A.uid),ib=g.seats.indexOf(Bc.uid);
  ok(g.pair===true&&(ia+2)%4===ib,'Ali ile Bora karşılıklı oturuyor: '+JSON.stringify(g.names));
  // oyna: insanlar çeker ve ilk taşı atar; botlar (eşlide hep Usta) oynar
  const who=()=>g&&g.seats[g.turn]===A.uid?A:g&&g.seats[g.turn]===Bc.uid?Bc:null;
  const views=new Map([[A,null],[Bc,null]]);Bc.sub('doc','rooms/'+C+'/game/main',s=>views.set(Bc,s.exists?s.data:null));
  const t0=Date.now();
  while(Date.now()-t0<90000){
    await sleep(25);if(!g)continue;if(g.ph==='end')break;
    const P=who();if(!P)continue;const v=P===A?g:views.get(Bc);if(!v||v.turn!==g.turn||v.trn!==g.trn)continue;
    const h=v.hands['h'+v.seats.indexOf(P.uid)];
    if(v.ph==='draw'){await P.call({op:'act',code:C,name:'draw',args:{}});continue}
    if(v.must>=0){await P.call({op:'act',code:C,name:'back',args:{}});continue}
    const r=await P.call({op:'act',code:C,name:'discard',args:{t:h[0]}});if(!r.ok)await P.call({op:'act',code:C,name:'discard',args:{t:h[1]}});
    await sleep(30);
  }
  ok(g&&g.ph==='end','eşli el bitti');
  if(g&&g.win<4){const m=(g.win+2)%4;ok(g.last[m]===((g.ex||{})['s'+m]||0),'bitirenin eşine el sonu cezası yazılmadı: '+JSON.stringify(g.last))}
  else ok(true,'deste bitti (bitiren yok)');
  for(const c of [A,Bc,adm])c.close();await sleep(100);S.stop();try{fs.unlinkSync(process.env.DATA_FILE)}catch(e){}
  console.log(fails?'FAILED '+fails:'ALL PASSED');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
