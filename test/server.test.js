/* sunucu testleri: oda kurma, izinler, gizli eller, hamle doğrulama, botlarla bir el, kayıt */
const os=require('os'),fs=require('fs'),path=require('path');
const DATA=path.join(os.tmpdir(),'ko-test-'+process.pid+'.json');
process.env.DATA_FILE=DATA;process.env.ADMIN_PASSWORD='test-sifre';process.env.QUIET='1';
let fails=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fails++};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const {client}=require('./wsclient.js');
(async()=>{
  let S=require('../server/server.js');
  await new Promise(r=>S.server.listen(0,r));
  const url='ws://127.0.0.1:'+S.server.address().port+'/ws';
  const A=await client(url),Bc=await client(url);
  ok(A.uid&&Bc.uid&&A.uid!==Bc.uid,'iki oyuncu iki ayrı kimlik aldı');
  // yönetici: botlar hızlı, süre kapalı
  ok(!(await A.call({op:'admin',pw:'yanlis'})).ok,'yanlış yönetici şifresi reddedildi');
  const adm=await client(url);
  ok((await adm.call({op:'admin',pw:'test-sifre'})).ok,'yönetici girişi');
  ok((await adm.call({op:'set',path:'settings/main',data:{bot:2,ms:300,tm:0,ann:''}})).ok,'yönetici ayar yazdı');
  ok(!(await A.call({op:'set',path:'settings/main',data:{bot:0}})).ok,'oyuncu ayar yazamaz');
  // oda
  const C='TST23';
  ok((await A.call({op:'set',path:'rooms/'+C,data:{code:C,host:A.uid,hostName:'Ali<script>',R:9,bots:0,st:'lobby'}})).ok,'oda kuruldu');
  ok(!(await Bc.call({op:'set',path:'rooms/'+C,data:{code:C,host:Bc.uid}})).ok,'var olan oda ezilemez');
  const room=(await Bc.call({op:'get',path:'rooms/'+C})).snap.data;
  ok(room.host===A.uid&&room.hostName==='Aliscript','isim temizlendi ve kuran doğru: '+room.hostName);
  ok((await Bc.call({op:'set',path:'rooms/ZZZ99',data:{code:'ZZZ99',host:A.uid}})).ok&&(await Bc.call({op:'get',path:'rooms/ZZZ99'})).snap.data.host===Bc.uid,'oda kuran her zaman isteği yapan kişidir');
  ok((await A.call({op:'set',path:'rooms/'+C+'/members/'+A.uid,data:{name:'Ali'}})).ok,'kuran masaya oturdu');
  ok(!(await Bc.call({op:'set',path:'rooms/'+C+'/members/'+A.uid,data:{name:'Sahte'}})).ok,'başkası adına oturulamaz');
  ok((await Bc.call({op:'set',path:'rooms/'+C+'/members/'+Bc.uid,data:{name:'Bora'}})).ok,'ikinci oyuncu oturdu');
  ok(!(await Bc.call({op:'update',path:'rooms/'+C,data:{bots:2}})).ok,'kuran olmayan bot ekleyemez');
  ok((await A.call({op:'update',path:'rooms/'+C,data:{bots:2,st:'hile'}})).ok,'kuran bot ekledi');
  ok((await Bc.call({op:'get',path:'rooms/'+C})).snap.data.st==='lobby','oda durumu istemciden değiştirilemez');
  ok(!(await Bc.call({op:'start',code:C})).ok,'kuran olmayan oyunu başlatamaz');
  ok((await A.call({op:'start',code:C})).ok,'oyun başladı');
  // sayfa, simgeler, paylaşım önizlemesi
  const http=require('http'),port=S.server.address().port;
  const get=(p)=>new Promise(r=>http.get({host:'127.0.0.1',port,path:p,headers:{'accept-encoding':'identity'}},res=>{let b='';res.setEncoding('latin1');res.on('data',d=>b+=d);res.on('end',()=>r({code:res.statusCode,type:res.headers['content-type'],body:b,h:res.headers}))}));
  const home=await get('/');
  const homeU=Buffer.from(home.body,'latin1').toString('utf8');
  ok(home.code===200&&homeU.includes('<link rel="manifest"')&&homeU.includes('og:image')&&!homeU.includes('@HEAD@'),'ana sayfa: uygulama ve paylaşım etiketleri eklendi');
  const inv=Buffer.from((await get('/?k='+C)).body,'latin1').toString('utf8');
  ok(/og:title" content="Kanlı Okey · Aliscript seni masaya çağırıyor"/.test(inv)&&inv.includes('Oda kodu: '+C),'davet bağlantısının önizlemesi kuranın adını ve kodu gösteriyor');
  const man=await get('/manifest.webmanifest');ok(man.code===200&&/manifest/.test(man.type)&&JSON.parse(man.body).display==='standalone','manifest');
  const sw=await get('/sw.js');ok(sw.code===200&&/javascript/.test(sw.type)&&sw.h['service-worker-allowed']==='/','service worker');
  const ic=await get('/icon-192.png');ok(ic.code===200&&ic.type==='image/png','simge');
  const og=await get('/og.jpg');ok(og.code===200&&og.type==='image/jpeg','paylaşım görseli');
  const kr=Buffer.from((await get('/kurallar')).body,'latin1').toString('utf8');ok(kr.includes('Kanlı Okey kuralları')&&kr.includes('href="/"'),'kurallar sayfası, oyuna dönüş bağlantısı');
  ok((await get('/../server/server.js')).code===404,'dosya sızdırma yok');
  // gizli eller
  let ga=null,gb=null;
  A.sub('doc','rooms/'+C+'/game/main',s=>{ga=s.exists?s.data:null});
  Bc.sub('doc','rooms/'+C+'/game/main',s=>{gb=s.exists?s.data:null});
  await sleep(200);
  const ia=ga.seats.indexOf(A.uid),ib=ga.seats.indexOf(Bc.uid);
  ok(ia>=0&&ib>=0&&ga.seats.filter(x=>x.startsWith('bot')).length===2,'koltuklar: 2 oyuncu 2 bot');
  ok(ga.hands['h'+ia].every(x=>Number.isInteger(x)),'kendi elini görüyor');
  ok(ga.hands['h'+ib].every(x=>x===null)&&gb.hands['h'+ia].every(x=>x===null),'başkasının eli gizli');
  ok(ga.deck.every(x=>x===null),'deste sırası gizli');
  ok(!(await A.call({op:'update',path:'rooms/'+C+'/game/main',data:{scores:{s0:-9999}}})).ok,'oyun belgesine doğrudan yazılamaz');
  const out=await client(url);
  ok(!(await out.call({op:'get',path:'rooms/'+C+'/game/main'})).ok,'masada olmayan oyunu okuyamaz');
  ok(!(await out.call({op:'list',path:'rooms'})).ok,'oda listesi sadece yönetici');
  // sıra kimdeyse: geçersiz hamleler
  const who=()=>ga.seats[ga.turn]===A.uid?A:ga.seats[ga.turn]===Bc.uid?Bc:null;
  const other=p=>p===A?Bc:A;
  // insan sırası gelene kadar bekle
  for(let k=0;k<100&&!who();k++)await sleep(100);
  let P=who();ok(!!P,'insan oyuncuya sıra geldi');
  ok(!(await other(P).call({op:'act',code:C,name:'draw',args:{}})).ok,'sırası olmayan hamle yapamaz');
  const myHand=()=>{const g=P===A?ga:gb;return g.hands['h'+g.seats.indexOf(P.uid)]};
  const r1=await P.call({op:'act',code:C,name:'discard',args:{t:999}});ok(!r1.ok,'elde olmayan taş atılamaz');
  const r2=await P.call({op:'act',code:C,name:'open',args:{groups:[[1,1,1]]}});ok(!r2.ok,'aynı taş iki kez kullanılamaz');
  const r3=await P.call({op:'act',code:C,name:'nope',args:{}});ok(!r3.ok,'bilinmeyen hamle reddedildi');
  const r4=await P.call({op:'act',code:C,name:'discard',args:{t:'__proto__'}});ok(!r4.ok,'bozuk veri reddedildi');
  // oyunu oynat: insanlar çeker ve ilk taşı atar, botlar kendisi oynar
  const t0=Date.now();let moves=0,ended=false,lastTrn=-1;
  while(Date.now()-t0<90000){
    await sleep(20);
    const g=ga;if(!g)continue;
    if(g.ph==='end'){ended=true;break}
    const Q=who();if(!Q)continue;
    const gq=Q===A?ga:gb,h=gq.hands['h'+gq.seats.indexOf(Q.uid)];
    if(gq.ph==='draw'){await Q.call({op:'act',code:C,name:'draw',args:{}});moves++;await sleep(40);continue}
    if(gq.must>=0){await Q.call({op:'act',code:C,name:'back',args:{}});continue}
    if(gq.trn===lastTrn&&gq.ph==='discard'){ /* aynı turda tekrar bekliyorsa atış yap */ }
    lastTrn=gq.trn;
    const rr=await Q.call({op:'act',code:C,name:'discard',args:{t:h[0]}});moves++;
    if(!rr.ok)await Q.call({op:'act',code:C,name:'discard',args:{t:h[1]}});
    await sleep(40);
  }
  ok(ended,'el sonuna kadar oynandı ('+moves+' insan hamlesi, '+Math.round((Date.now()-t0)/1000)+' sn)');
  ok(ga&&ga.hands['h'+ib].every(x=>Number.isInteger(x)),'el bitince eller açılır');
  const sc=ga.scores;ok(Object.keys(sc).length>=1,'cezalar yazıldı '+JSON.stringify(ga.last));
  // sıradaki el kendiliğinden
  await sleep(7200);
  ok(ga.round===1&&ga.ph!=='end','sonraki el kendiliğinden dağıtıldı');
  // kayıt ve yeniden başlatma
  A.close();Bc.close();adm.close();out.close();
  await sleep(300);
  S.stop();
  const saved=JSON.parse(fs.readFileSync(DATA,'utf8'));
  ok(saved.store.some(([k])=>k==='rooms/'+C+'/game/main'),'oyun diske kaydedildi');
  delete require.cache[require.resolve('../server/server.js')];
  S=require('../server/server.js');
  await new Promise(r=>S.server.listen(0,r));
  const url2='ws://127.0.0.1:'+S.server.address().port+'/ws';
  const A2=await client(url2,A.token);
  ok(A2.uid===A.uid,'aynı anahtarla aynı oyuncu geri döndü');
  const g2=(await A2.call({op:'get',path:'rooms/'+C+'/game/main'})).snap;
  ok(g2.exists&&g2.data.round>=1,'yeniden başlatınca oyun sürüyor: el '+(g2.exists&&g2.data.round)+' '+(g2.exists&&g2.data.ph));
  // origin kontrolü
  const WebSocket=require('ws');
  const bad=await new Promise(r=>{const w=new WebSocket(url2,{headers:{origin:'http://kotu-site.example'}});w.on('open',()=>{r(false);w.close()});w.on('error',()=>r(true));w.on('unexpected-response',()=>r(true))});
  ok(bad,'başka siteden bağlantı reddedildi');
  A2.close();await sleep(100);S.stop();
  try{fs.unlinkSync(DATA)}catch(e){}
  console.log(fails?'FAILED '+fails:'ALL PASSED');
  process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
