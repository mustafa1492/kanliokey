/* sunucu dayanıklılık: 4 insan istemcisi rastgele (çoğu geçersiz) hamlelerle tam el oynar,
   arada bağlantı koparıp döner; ayrıca bozuk mesaj yağmuru. Sunucu çökmemeli, taş sayısı tutmalı. */
const os=require('os'),fs=require('fs'),path=require('path');
process.env.DATA_FILE=path.join(os.tmpdir(),'ko-stress-'+process.pid+'.json');process.env.ADMIN_PASSWORD='s';process.env.QUIET='1';
const {client}=require('./wsclient.js');const E=require('../src/engine.js');
let fails=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fails++};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rnd=a=>a[Math.random()*a.length|0];
(async()=>{
  const S=require('../server/server.js');await new Promise(r=>S.server.listen(0,r));
  const url='ws://127.0.0.1:'+S.server.address().port+'/ws';
  const adm=await client(url);await adm.call({op:'admin',pw:'s'});await adm.call({op:'set',path:'settings/main',data:{bot:2,ms:300,tm:0}});
  const P=[];for(let i=0;i<4;i++)P.push(await client(url));
  const C='STR55';
  await P[0].call({op:'set',path:'rooms/'+C,data:{hostName:'a'}});
  for(let i=0;i<4;i++)ok((await P[i].call({op:'set',path:'rooms/'+C+'/members/'+P[i].uid,data:{name:'P'+i}})).ok,'oyuncu '+i+' oturdu');
  ok(!(await (await client(url)).call({op:'set',path:'rooms/'+C+'/members/x',data:{}})).ok,'5. kişi oturamaz');
  ok((await P[0].call({op:'start',code:C,R:9})).ok,'4 insanla oyun başladı');
  const views=[null,null,null,null];
  P.forEach((p,i)=>p.sub('doc','rooms/'+C+'/game/main',s=>{views[i]=s.exists?s.data:null}));
  await sleep(200);
  /* bozuk mesaj yağmuru */
  const junk=[{op:'act',code:C,name:'open',args:{groups:[[1,2,3,4,5,6,7,8,9,10,11,12,13,14]]}},{op:'act',code:C,name:'insert',args:{o:'__proto__',gi:{},e:[],t:-5}},
    {op:'act',code:C,name:'constructor'},{op:'act',code:C,name:'toString'},{op:'set',path:'../../etc',data:1},{op:'get',path:'rooms/'+C+'/game/main/../../x'},
    {op:'sub',sid:'x',kind:'col',path:'rooms'},{op:'update',path:'rooms/'+C,data:{host:'hacker'}},{op:'delete',path:'rooms/'+C},{op:'start',code:'<script>'},
    {op:'act',code:C,name:'pair',args:{o:1,gi:0,ts:[1,1]}},{op:'act',code:C,name:'swap',args:{o:9,gi:9,idx:9,t:1}},{op:'hello',token:'x'.repeat(48)}];
  for(const j of junk)for(const p of P.slice(1))p.raw({...j,id:9999});
  P[3].ws.send('{bozuk json');P[3].ws.send(Buffer.from([1,2,3]),{binary:true});
  await sleep(300);
  ok((await P[1].call({op:'get',path:'rooms/'+C})).snap.data.host===P[0].uid,'oda sahibi değişmedi, oda silinmedi');
  /* rastgele oyun */
  let acts=0,good=0,dropped=false;const t0=Date.now();
  while(Date.now()-t0<120000){
    const g=views[0];if(!g){await sleep(20);continue}
    if(g.ph==='end'&&g.round>=1)break;
    if(g.ph==='end'){await sleep(100);continue}
    const ti=g.seats.indexOf(g.seats[g.turn]),p=P.find(x=>x.uid===g.seats[g.turn]);
    const v=views[P.indexOf(p)];if(!v||v.turn!==g.turn||v.trn!==g.trn){await sleep(10);continue}
    const me=v.seats.indexOf(p.uid),h=v.hands['h'+me];
    if(!dropped&&g.trn===12){/* bir oyuncunun bağlantısını kopar, geri getir */
      const k=P.indexOf(p),tok=p.token;p.close();await sleep(200);
      P[k]=await client(url,tok);P[k].sub('doc','rooms/'+C+'/game/main',s=>{views[k]=s.exists?s.data:null});
      dropped=true;ok(P[k].uid===p.uid,'kopan oyuncu aynı kimlikle döndü');await sleep(200);continue;
    }
    let req;
    if(v.ph==='draw')req=Math.random()<.15?{name:'take'}:{name:'draw'};
    else{
      const x=Math.random();
      if(v.must>=0&&x<.5)req={name:'back'};
      else if(x<.15)req={name:'open',args:{groups:[h.slice(0,3),h.slice(3,6)]}};
      else if(x<.25)req={name:'insert',args:{o:Math.random()*4|0,gi:0,e:rnd(['l','h','s']),t:rnd(h)}};
      else if(x<.3)req={name:'finish',args:{t:rnd(h)}};
      else if(x<.33)req={name:'discard',args:{t:999}};
      else req={name:'discard',args:{t:rnd(h)}};
    }
    const r=await p.call({op:'act',code:C,...req});acts++;if(r.ok)good++;
    await sleep(15);
  }
  const g=(await adm.call({op:'get',path:'rooms/'+C+'/game/main'})).snap.data;
  ok(g&&(g.round>=1||g.ph==='end'),'en az bir el tamamlandı ('+acts+' istek, '+good+' geçerli)');
  ok(E.tileCount(g)===106,'taş sayısı 106 kaldı');
  const h=await adm.call({op:'ping'});ok(h.ok,'sunucu ayakta');
  for(const p of P)p.close();adm.close();await sleep(100);S.stop();
  try{fs.unlinkSync(process.env.DATA_FILE)}catch(e){}
  console.log(fails?'FAILED '+fails:'ALL PASSED');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
