/* sıra sende bildirimi: VAPID imzası, aes128gcm şifreleme (çözerek doğrulanır), sunucu sıra gelince sadece bakmayan oyuncuya gönderir */
const os=require('os'),fs=require('fs'),path=require('path'),crypto=require('crypto');
process.env.DATA_FILE=path.join(os.tmpdir(),'ko-push-'+process.pid+'.json');process.env.ADMIN_PASSWORD='p';process.env.QUIET='1';
const P=require('../server/push.js');
let fails=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fails++};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const hmac=(k,d)=>crypto.createHmac('sha256',k).update(d).digest();
function decrypt(buf,uaECDH,auth){
  const salt=buf.subarray(0,16),idlen=buf[20],as=buf.subarray(21,21+idlen),body=buf.subarray(21+idlen);
  const secret=uaECDH.computeSecret(as),ua=uaECDH.getPublicKey();
  const ikm=hmac(hmac(auth,secret),Buffer.concat([Buffer.from('WebPush: info\0'),ua,as,Buffer.from([1])]));
  const prk=hmac(salt,ikm);
  const cek=hmac(prk,Buffer.concat([Buffer.from('Content-Encoding: aes128gcm\0'),Buffer.from([1])])).subarray(0,16);
  const nonce=hmac(prk,Buffer.concat([Buffer.from('Content-Encoding: nonce\0'),Buffer.from([1])])).subarray(0,12);
  const d=crypto.createDecipheriv('aes-128-gcm',cek,nonce);d.setAuthTag(body.subarray(body.length-16));
  const pt=Buffer.concat([d.update(body.subarray(0,body.length-16)),d.final()]);
  return pt.subarray(0,pt.lastIndexOf(2)).toString();
}
(async()=>{
  const k=P.newKeys();ok(P.ub64(k.pub).length===65,'VAPID açık anahtarı 65 bayt');
  const ua=crypto.createECDH('prime256v1');ua.generateKeys();const auth=crypto.randomBytes(16);
  const enc=P.encrypt('{"body":"Sıra sende!"}',P.b64u(ua.getPublicKey()),P.b64u(auth));
  ok(decrypt(enc,ua,auth)==='{"body":"Sıra sende!"}','şifreli bildirim alıcı tarafında çözülüyor');
  const a=P.vapidAuth('https://fcm.googleapis.com/fcm/send/x',k);
  const m=/^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(a);
  const pub=P.ub64(m[4]),key=crypto.createPublicKey({key:{kty:'EC',crv:'P-256',x:P.b64u(pub.subarray(1,33)),y:P.b64u(pub.subarray(33))},format:'jwk'});
  ok(crypto.verify('sha256',Buffer.from(m[1]+'.'+m[2]),{key,dsaEncoding:'ieee-p1363'},P.ub64(m[3])),'VAPID imzası doğrulanıyor');
  ok(JSON.parse(P.ub64(m[2]).toString()).aud==='https://fcm.googleapis.com','imzadaki adres bildirim sunucusu');
  /* sunucu */
  const S=require('../server/server.js');await new Promise(r=>S.server.listen(0,r));
  const sent=[];S.setPushSend(async(sub,pl)=>{sent.push({ep:sub.endpoint,pl});return 'ok'});
  const {client}=require('./wsclient.js');const url='ws://127.0.0.1:'+S.server.address().port+'/ws';
  const adm=await client(url);await adm.call({op:'admin',pw:'p'});await adm.call({op:'set',path:'settings/main',data:{bot:0,ms:300,tm:0}});
  const A=await client(url),C='PSH22';
  const kk=await A.call({op:'pushKey'});ok(kk.ok&&P.ub64(kk.key).length===65,'tarayıcıya açık anahtar veriliyor');
  ok(!(await A.call({op:'push',sub:{endpoint:'http://kotu',keys:{}}})).ok,'geçersiz abonelik reddedildi');
  const sub={endpoint:'https://fcm.googleapis.com/fcm/send/abc123456789',keys:{p256dh:P.b64u(ua.getPublicKey()),auth:P.b64u(auth)}};
  ok((await A.call({op:'push',sub})).ok,'abonelik kaydedildi');
  ok(!(await adm.call({op:'get',path:'push/'+A.uid})).ok&&!(await adm.call({op:'get',path:'settings/vapid'})).ok,'abonelik ve özel anahtar kimseye okunmuyor');
  await A.call({op:'set',path:'rooms/'+C,data:{hostName:'Ali'}});await A.call({op:'set',path:'rooms/'+C+'/members/'+A.uid,data:{name:'Ali'}});
  await A.call({op:'update',path:'rooms/'+C,data:{bots:3}});await A.call({op:'start',code:C});
  let g=null;A.sub('doc','rooms/'+C+'/game/main',s=>{g=s.exists?s.data:null});await sleep(200);
  const me=g.seats.indexOf(A.uid);
  /* sayfaya bakarken bildirim gitmez */
  const play=async()=>{for(let i=0;i<200&&g.ph!=='end';i++){await sleep(30);if(g.seats[g.turn]!==A.uid)continue;if(g.ph==='draw'){await A.call({op:'act',code:C,name:'draw',args:{}});continue}const h=g.hands['h'+me];const r=await A.call({op:'act',code:C,name:'discard',args:{t:h[0]}});if(!r.ok)await A.call({op:'act',code:C,name:'discard',args:{t:h[1]}});return}};
  await play();await sleep(300);for(let i=0;i<60&&g.seats[g.turn]!==A.uid&&g.ph!=='end';i++)await sleep(100);
  ok(sent.length===0,'sayfaya bakarken bildirim gitmedi');
  await A.call({op:'vis',hidden:true});
  await play();await sleep(300);for(let i=0;i<60&&g.seats[g.turn]!==A.uid&&g.ph!=='end';i++)await sleep(100);await sleep(100);
  ok(g.ph==='end'||(sent.length>=1&&sent[0].ep===sub.endpoint&&/Sıra sende/.test(sent[0].pl.body)&&sent[0].pl.url==='/?k='+C),'arka plandayken sıra gelince bildirim gitti: '+JSON.stringify(sent[0]&&sent[0].pl));
  for(const c of [A,adm])c.close();await sleep(100);S.stop();try{fs.unlinkSync(process.env.DATA_FILE)}catch(e){}
  console.log(fails?'FAILED '+fails:'ALL PASSED');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
