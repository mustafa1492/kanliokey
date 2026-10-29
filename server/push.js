/* Web Push (RFC 8030/8291/8292) dış kütüphanesiz: VAPID imzası (ES256) ve aes128gcm şifreleme.
   Sıra bir oyuncuya geçince, o oyuncu sayfaya bakmıyorsa telefonuna "Sıra sende" bildirimi gider. */
const crypto=require('crypto'),https=require('https');
const b64u=b=>Buffer.from(b).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const ub64=s=>Buffer.from(String(s).replace(/-/g,'+').replace(/_/g,'/'),'base64');
/* VAPID anahtarı: ham açık anahtar (65 bayt) + JWK özel anahtar */
function newKeys(){
  const {publicKey,privateKey}=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
  const jwk=privateKey.export({format:'jwk'});
  const pub=Buffer.concat([Buffer.from([4]),ub64(jwk.x),ub64(jwk.y)]);
  return {pub:b64u(pub),d:jwk.d};
}
function privFrom(k){const pub=ub64(k.pub);return crypto.createPrivateKey({key:{kty:'EC',crv:'P-256',d:k.d,x:b64u(pub.subarray(1,33)),y:b64u(pub.subarray(33,65))},format:'jwk'})}
function vapidAuth(endpoint,k,sub){
  const aud=new URL(endpoint).origin,h=b64u(JSON.stringify({typ:'JWT',alg:'ES256'})),c=b64u(JSON.stringify({aud,exp:Math.floor(Date.now()/1000)+12*3600,sub:sub||'mailto:kanliokey@example.com'}));
  const sig=crypto.sign('sha256',Buffer.from(h+'.'+c),{key:privFrom(k),dsaEncoding:'ieee-p1363'});
  return 'vapid t='+h+'.'+c+'.'+b64u(sig)+', k='+k.pub;
}
const hmac=(k,d)=>crypto.createHmac('sha256',k).update(d).digest();
/* aes128gcm, tek kayıt */
function encrypt(payload,p256dh,auth){
  const ua=ub64(p256dh),au=ub64(auth),ecdh=crypto.createECDH('prime256v1');ecdh.generateKeys();
  const as=ecdh.getPublicKey(),secret=ecdh.computeSecret(ua),salt=crypto.randomBytes(16);
  const ikm=hmac(hmac(au,secret),Buffer.concat([Buffer.from('WebPush: info\0'),ua,as,Buffer.from([1])]));
  const prk=hmac(salt,ikm);
  const cek=hmac(prk,Buffer.concat([Buffer.from('Content-Encoding: aes128gcm\0'),Buffer.from([1])])).subarray(0,16);
  const nonce=hmac(prk,Buffer.concat([Buffer.from('Content-Encoding: nonce\0'),Buffer.from([1])])).subarray(0,12);
  const ci=crypto.createCipheriv('aes-128-gcm',cek,nonce);
  const body=Buffer.concat([ci.update(Buffer.concat([Buffer.from(payload),Buffer.from([2])])),ci.final(),ci.getAuthTag()]);
  const rs=Buffer.alloc(4);rs.writeUInt32BE(4096);
  return Buffer.concat([salt,rs,Buffer.from([as.length]),as,body]);
}
/* gönder: sonuç 'ok' | 'gone' (abonelik silinmeli) | 'err' */
function send(sub,payload,k,opt){
  return new Promise(res=>{
    try{
      const u=new URL(sub.endpoint);if(u.protocol!=='https:')return res('err');
      const body=encrypt(JSON.stringify(payload),sub.keys.p256dh,sub.keys.auth);
      const rq=(opt&&opt.request||https.request)(u,{method:'POST',headers:{'Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream','Content-Length':body.length,TTL:'120',Urgency:'high',Authorization:vapidAuth(sub.endpoint,k,opt&&opt.sub)},timeout:8000},r=>{r.resume();res(r.statusCode===404||r.statusCode===410?'gone':r.statusCode<300?'ok':'err')});
      rq.on('error',()=>res('err'));rq.on('timeout',()=>{rq.destroy();res('err')});rq.end(body);
    }catch(e){res('err')}
  });
}
module.exports={newKeys,encrypt,vapidAuth,send,b64u,ub64};
