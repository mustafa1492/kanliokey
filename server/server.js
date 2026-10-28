'use strict';
/* Kanlı Okey sunucusu
   - Sayfayı sunar (dist/index.html), WebSocket (/ws) ile odaları ve oyunu yönetir.
   - Oyun kuralları SUNUCUDA çalışır (src/engine.js). İstemci sadece "şu hamleyi yapmak istiyorum" der;
     sunucu doğrular, uygular, herkese kendi görmesi gereken kadarını gönderir (başkalarının eli ve deste gizli).
   - Botlar ve sıra süresi sunucuda işler. Durum data/state.json'a kaydedilir (yeniden başlatınca oyun sürer).
   Ortam değişkenleri: PORT, ADMIN_PASSWORD (boşsa yönetici kapalı), DATA_FILE */
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib');
const {WebSocketServer}=require('ws');
const ENG=require('../src/engine.js');

const ROOT=path.join(__dirname,'..');
const PORT=+process.env.PORT||8080;
const ADMIN_PW=String(process.env.ADMIN_PASSWORD||'');
const DATA=process.env.DATA_FILE||path.join(ROOT,'data','state.json');
const QUIET=!!process.env.QUIET;
const log=(...a)=>{if(!QUIET)console.log(new Date().toISOString(),...a)};

/* ---------- kalıcı durum ---------- */
const store=new Map();   /* yol -> belge (rooms/KOD, rooms/KOD/members/UID, rooms/KOD/game/main, settings/main, settings/stats) */
const tokens=new Map();  /* gizli anahtar -> {uid,t} : oyuncu kimliği, cihazda saklanır */
let dirty=false;
function load(){
  try{
    const j=JSON.parse(fs.readFileSync(DATA,'utf8'));
    for(const [k,v] of j.store||[])store.set(k,v);
    for(const [k,v] of j.tokens||[])tokens.set(k,v);
    log('durum yüklendi',store.size,'belge');
  }catch(e){if(e.code!=='ENOENT')log('durum okunamadı',e.message)}
}
function save(){
  if(!dirty)return;dirty=false;
  try{
    fs.mkdirSync(path.dirname(DATA),{recursive:true});
    const tmp=DATA+'.tmp';
    fs.writeFileSync(tmp,JSON.stringify({v:1,at:Date.now(),store:[...store],tokens:[...tokens]}));
    fs.renameSync(tmp,DATA);
  }catch(e){log('kayıt hatası',e.message);dirty=true}
}
load();
const saveTimer=setInterval(save,2000);
const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
const now=()=>Date.now();

/* ---------- yardımcılar ---------- */
const CODE_RE=/^[A-Z0-9]{5}$/;
const parentOf=p=>p.split('/').slice(0,-1).join('/');
const okPath=p=>typeof p==='string'&&p.length<=120&&/^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/.test(p);
const cleanName=n=>String(n==null?'':n).replace(/[\u0000-\u001f\u007f<>"'`]/g,'').replace(/\s+/g,' ').trim().slice(0,14)||'Oyuncu';
const gamePath=c=>'rooms/'+c+'/game/main';
const roomOf=p=>{const m=/^rooms\/([A-Z0-9]{5})(\/|$)/.exec(p);return m?m[1]:null};
const membersOf=c=>[...store.keys()].filter(k=>parentOf(k)==='rooms/'+c+'/members').map(k=>({id:k.split('/').pop(),...store.get(k)}));
function getCfg(){const d=store.get('settings/main')||{};return{bot:d.bot!=null?Math.max(0,Math.min(2,+d.bot|0)):2,ms:Math.max(300,Math.min(4000,+d.ms||1100)),tm:d.tm!=null?Math.max(0,Math.min(300,+d.tm|0)):45,ann:String(d.ann||'')}}
function bump(keys){const d=store.get('settings/stats')||{};keys.forEach(k=>d[k]=(d[k]||0)+1);store.set('settings/stats',d);dirty=true;notify('settings/stats')}
const lastAct=new Map(); /* oda -> son hareket zamanı (bellekte) */
const touch=c=>lastAct.set(c,now());

/* ---------- bağlantılar ve abonelikler ---------- */
const conns=new Set();
const online=new Map(); /* uid -> açık bağlantı sayısı */
const docSubs=new Map(),colSubs=new Map(); /* yol -> Set({conn,sid}) */
function addSub(map,p,e){let s=map.get(p);if(!s)map.set(p,s=new Set());s.add(e)}
function delSub(map,p,e){const s=map.get(p);if(s){s.delete(e);if(!s.size)map.delete(p)}}
function send(conn,o){if(conn.ws.readyState===1){try{conn.ws.send(JSON.stringify(o))}catch(e){}}}

function isMember(c,uid){return store.has('rooms/'+c+'/members/'+uid)}
function seatOf(c,uid){const g=store.get(gamePath(c));return g?g.seats.indexOf(uid):-1}
function canReadDoc(conn,p){
  if(p==='settings/main')return true;
  if(p==='settings/stats')return conn.admin;
  const c=roomOf(p);if(!c)return conn.admin;
  if(p==='rooms/'+c)return true;
  if(parentOf(p)==='rooms/'+c+'/members')return true;
  if(p===gamePath(c))return conn.admin||isMember(c,conn.uid)||seatOf(c,conn.uid)>=0;
  return false;
}
function canReadCol(conn,p){
  if(p==='rooms'||p==='lobby')return conn.admin;
  const c=roomOf(p);
  return !!c&&p==='rooms/'+c+'/members';
}
function snapDoc(conn,p){
  if(!store.has(p))return{exists:false};
  let d=store.get(p);
  if(/\/game\/main$/.test(p)){
    d=conn.admin?clone(d):ENG.view(d,d.seats.indexOf(conn.uid));
    if(d.tt&&conn.skew)d.tt+=conn.skew;
  }else d=clone(d);
  return{exists:true,data:d};
}
function snapCol(conn,p){
  const docs=[];for(const [k,v] of store)if(parentOf(k)===p)docs.push({id:k.split('/').pop(),data:clone(v)});
  return{docs};
}
function notify(p){
  const ds=docSubs.get(p);if(ds)for(const e of ds)send(e.conn,{sid:e.sid,snap:snapDoc(e.conn,p)});
  const pp=parentOf(p),cs=colSubs.get(pp);if(cs)for(const e of cs)send(e.conn,{sid:e.sid,snap:snapCol(e.conn,pp)});
}
function put(p,d){store.set(p,d);dirty=true;notify(p)}
function del(p){if(store.delete(p)){dirty=true;notify(p)}}

/* ---------- oda ve oyun ---------- */
const timers=new Map(),endAt=new Map();
function wipeRoom(c){
  clearTimeout(timers.get(c));timers.delete(c);endAt.delete(c);lastAct.delete(c);
  for(const m of membersOf(c))del('rooms/'+c+'/members/'+m.id);
  del(gamePath(c));del('rooms/'+c);
}
function humansOnline(g){return g.seats.some(u=>!ENG.isBot(u)&&(online.get(u)||0)>0)}
function applyPatch(c,patch,why){
  const p=gamePath(c),g0=store.get(p);if(!g0||!patch)return false;
  const g=clone(g0),n0=ENG.tileCount(g0);
  ENG.merge(g,clone(patch));
  const n1=ENG.tileCount(g);
  if(n1!==n0||n1!==106){log('TAŞ SAYISI TUTMUYOR',c,why,n0,n1);return false}
  for(let i=0;i<4;i++){const h=g.hands['h'+i];if(new Set(h).size!==h.length){log('AYNI TAŞ İKİ KEZ',c,why);return false}}
  store.set(p,g);dirty=true;touch(c);
  if(g0.ph!=='end'&&g.ph==='end')onHandEnd(c,g);
  notify(p);kick(c);return true;
}
function onHandEnd(c,g){
  endAt.set(c,now());
  if(g.round+1>=g.R){
    const d=store.get('settings/stats')||{};
    d.hist=[{t:now(),p:g.seats.map((u,i)=>({n:g.names[i],s:g.scores['s'+i]||0,b:ENG.isBot(u)?1:0}))},...(d.hist||[])].slice(0,30);
    d.done=(d.done||0)+1;store.set('settings/stats',d);dirty=true;notify('settings/stats');
  }
}
function dealHand(c,prev,R,ps,opt){
  const g=ENG.deal(prev,R,ps,now(),opt);
  put(gamePath(c),g);touch(c);
  const r=store.get('rooms/'+c);
  if(r)put('rooms/'+c,{...r,st:'playing',rd:g.round,R:g.R,pl:g.names,tg:now()});
  bump(prev?['rounds']:['rounds','games']);
  kick(c);
  return g;
}
function nextHand(c,gid){
  const g=store.get(gamePath(c));
  if(!g||g.ph!=='end'||g.gid!==gid||g.round+1>=g.R)return false;
  dealHand(c,g,g.R,g.seats.map((u,i)=>({u,n:g.names[i]})));return true;
}
function stateKey(g){return [g.gid,g.turn,g.trn,g.ph,g.must,g.hands['h'+g.turn].length,g.tt].join('|')}
function kick(c){
  clearTimeout(timers.get(c));timers.delete(c);
  const g=store.get(gamePath(c));if(!g)return;
  if(!humansOnline(g))return; /* masada kimse yoksa oyun bekler, biri dönünce sürer */
  const cfg=getCfg(),t=now(),key=stateKey(g);let delay,fn;
  if(g.ph==='end'){
    if(g.round+1>=g.R)return;
    delay=Math.max(0,(endAt.get(c)||t)+6500-t);fn=()=>nextHand(c,g.gid);
  }else if(ENG.isBot(g.seats[g.turn])){
    delay=cfg.ms;
    fn=()=>{
      const cur=store.get(gamePath(c));if(!cur||stateKey(cur)!==key){kick(c);return}
      let r=ENG.botMove(clone(cur),cur.turn,cfg.bot);
      if(!r||!applyPatch(c,r,'bot')){r=ENG.timeoutMove(clone(cur));if(!r||!applyPatch(c,r,'bot-yedek'))log('bot hamle yapamadı',c)}
    };
  }else if(cfg.tm>0){
    delay=Math.max(0,(g.tt||t)+cfg.tm*1000-t);
    fn=()=>{
      const cur=store.get(gamePath(c));if(!cur||stateKey(cur)!==key){kick(c);return}
      const r=ENG.timeoutMove(clone(cur));if(r)applyPatch(c,r,'süre');
    };
  }else return;
  timers.set(c,setTimeout(()=>{timers.delete(c);try{fn()}catch(e){log('zamanlayıcı hatası',c,e&&e.stack)}},delay));
}

/* ---------- hız sınırı ---------- */
const limits=new Map();
function allow(key,max,perMs){
  const t=now();let e=limits.get(key);
  if(!e||t-e.t>perMs){e={t,n:0};limits.set(key,e)}
  return ++e.n<=max;
}
setInterval(()=>{const t=now();for(const [k,e] of limits)if(t-e.t>3600e3)limits.delete(k)},600e3).unref();

/* ---------- istekler ---------- */
const reply=(conn,id,o)=>send(conn,{id,...o});
const deny=(conn,id,err,msg)=>reply(conn,id,{ok:false,err:err||'denied',msg:msg||''});

function hPut(conn,m){
  const p=m.path,d=m.data&&typeof m.data==='object'?m.data:{};
  if(p==='settings/main'){
    if(!conn.admin)return deny(conn,m.id);
    const cur=getCfg();
    put(p,{bot:d.bot!=null?Math.max(0,Math.min(2,+d.bot|0)):cur.bot,ms:d.ms!=null?Math.max(300,Math.min(4000,+d.ms|0)):cur.ms,ann:String(d.ann!=null?d.ann:cur.ann).replace(/[\u0000-\u001f]/g,'').slice(0,140),tm:d.tm!=null?Math.max(0,Math.min(300,+d.tm|0)):cur.tm});
    for(const c of new Set([...timers.keys()]))kick(c);
    return reply(conn,m.id,{ok:true});
  }
  if(p==='settings/stats')return reply(conn,m.id,{ok:true}); /* istatistiği sunucu tutar */
  const c=roomOf(p);if(!c)return deny(conn,m.id);
  if(p==='rooms/'+c){
    if(store.has(p))return deny(conn,m.id,'exists');
    if(!allow('room:'+conn.uid,12,600e3))return deny(conn,m.id,'rate','Çok fazla oda kurdun, biraz bekle.');
    put(p,{code:c,host:conn.uid,hostName:cleanName(d.hostName),R:d.R===13?13:9,bots:0,st:'lobby',t:now()});touch(c);
    bump(['rooms']);
    return reply(conn,m.id,{ok:true});
  }
  if(parentOf(p)==='rooms/'+c+'/members'){
    const u=p.split('/').pop(),r=store.get('rooms/'+c);
    if(u!==conn.uid)return deny(conn,m.id);
    if(!r)return deny(conn,m.id,'not-found','Oda yok.');
    const prev=store.get(p),ms=membersOf(c);
    if(!prev){
      if(r.st==='playing'&&seatOf(c,u)<0)return deny(conn,m.id,'playing','Bu odada oyun başlamış.');
      if(ms.length>=4)return deny(conn,m.id,'full','Masa dolu.');
    }
    const av=+d.av;put(p,{name:cleanName(d.name),av:av>=0&&av<8&&(av|0)===av?av:(prev&&prev.av!=null?prev.av:-1),t:prev?prev.t:now()});touch(c);
    return reply(conn,m.id,{ok:true});
  }
  return deny(conn,m.id);
}
function hUpdate(conn,m){
  const p=m.path,d=m.data&&typeof m.data==='object'?m.data:{};
  const c=roomOf(p);
  if(c&&p==='rooms/'+c){
    const r=store.get(p);if(!r)return deny(conn,m.id,'not-found');
    if(r.host!==conn.uid&&!conn.admin)return deny(conn,m.id);
    const n={...r};
    if(d.bots!=null)n.bots=Math.max(0,Math.min(4,+d.bots|0));
    if(d.R!=null)n.R=+d.R===13?13:9;
    if(d.pair!=null&&r.st!=='playing')n.pair=!!d.pair;
    if(d.pr!=null&&r.st!=='playing')n.pr=Math.max(0,Math.min(2,+d.pr|0));
    put(p,n);touch(c);return reply(conn,m.id,{ok:true});
  }
  if(p==='settings/stats')return reply(conn,m.id,{ok:true});
  return deny(conn,m.id); /* oyun belgesine doğrudan yazılamaz: hamleler 'act' ile gelir */
}
function hDelete(conn,m){
  const p=m.path,c=roomOf(p);
  if(p==='games/main'||/^lobby\//.test(p))return conn.admin?reply(conn,m.id,{ok:true}):deny(conn,m.id);
  if(!c)return deny(conn,m.id);
  const r=store.get('rooms/'+c),host=r&&r.host===conn.uid;
  if(p==='rooms/'+c){if(!host&&!conn.admin)return deny(conn,m.id);wipeRoom(c);return reply(conn,m.id,{ok:true})}
  if(p===gamePath(c)){if(!host&&!conn.admin)return deny(conn,m.id);clearTimeout(timers.get(c));del(p);return reply(conn,m.id,{ok:true})}
  if(parentOf(p)==='rooms/'+c+'/members'){
    const u=p.split('/').pop();
    if(u!==conn.uid&&!host&&!conn.admin)return deny(conn,m.id);
    del(p);return reply(conn,m.id,{ok:true});
  }
  return deny(conn,m.id);
}
function hStart(conn,m,next){
  const c=String(m.code||'');if(!CODE_RE.test(c))return deny(conn,m.id);
  const r=store.get('rooms/'+c);if(!r)return deny(conn,m.id,'not-found','Oda yok.');
  const g=store.get(gamePath(c));
  if(next){
    if(!g||g.seats.indexOf(conn.uid)<0)return deny(conn,m.id);
    if(g.ph!=='end'||g.round+1>=g.R)return reply(conn,m.id,{ok:false});
    return reply(conn,m.id,{ok:nextHand(c,g.gid)});
  }
  if(r.host!==conn.uid)return deny(conn,m.id,'denied','Oyunu sadece masayı kuran başlatır.');
  if(g&&g.ph!=='end')return deny(conn,m.id,'playing','Oyun zaten sürüyor.');
  const ms=membersOf(c).sort((a,b)=>a.t-b.t).slice(0,4),nb=Math.max(0,Math.min(r.bots||0,4-ms.length));
  if(ms.length+nb<4)return deny(conn,m.id,'few','Başlamak için 4 kişi ya da bot gerekli.');
  let ps=ENG.fillBots(ms.map(x=>({u:x.id,n:cleanName(x.name)})));
  if(r.pair)ps=ENG.pairOrder(ps,r.pr|0);
  dealHand(c,null,+m.R===13?13:(r.R===13?13:9),ps,{pair:!!r.pair});
  log('oyun başladı',c,ps.map(x=>x.n).join(','));
  return reply(conn,m.id,{ok:true});
}
function hAct(conn,m){
  const c=String(m.code||'');if(!CODE_RE.test(c))return deny(conn,m.id);
  const g=store.get(gamePath(c));if(!g)return deny(conn,m.id,'not-found','Oyun yok.');
  const me=g.seats.indexOf(conn.uid);if(me<0)return deny(conn,m.id,'denied','Bu masada oturmuyorsun.');
  const name=String(m.name||'');
  const out=ENG.run(name,clone(g),me,m.args&&typeof m.args==='object'?m.args:{});
  if(!out.r)return reply(conn,m.id,{ok:false,msg:out.msg||''});
  const ok=applyPatch(c,out.r,'oyuncu:'+name);
  return reply(conn,m.id,{ok,msg:ok?(out.msg||''):'Hamle kaydedilemedi.'});
}
function hAdmin(conn,m){
  if(!ADMIN_PW)return deny(conn,m.id,'off','Yönetici girişi kapalı.');
  if(!allow('adm:'+conn.ip,6,600e3))return deny(conn,m.id,'rate','Çok fazla deneme. Biraz bekle.');
  const a=crypto.createHash('sha256').update(String(m.pw||'')).digest(),b=crypto.createHash('sha256').update(ADMIN_PW).digest();
  if(!crypto.timingSafeEqual(a,b))return deny(conn,m.id,'denied','Şifre yanlış.');
  conn.admin=true;log('yönetici girişi',conn.ip);
  return reply(conn,m.id,{ok:true});
}
function hAdminAct(conn,m){
  if(!conn.admin)return deny(conn,m.id);
  const c=String(m.code||''),a=String(m.a||''),p=gamePath(c),g=store.get(p);
  if(!g)return reply(conn,m.id,{ok:false,msg:'Oyun yok.'});
  if(a==='skip'){
    if(g.ph==='end')return reply(conn,m.id,{ok:false,msg:'El bitmiş.'});
    const me=g.turn,h=[...g.hands['h'+me]],d=[...g.disc['d'+me]],r={turn:(me+1)%4,ph:'draw',must:-1,ik:[],ot:-1,trn:g.trn+1,tt:now()};
    if(g.must>=0){const pv=(me+3)%4,i=h.indexOf(g.must);if(i>=0){h.splice(i,1);r.disc={['d'+pv]:[...g.disc['d'+pv],g.must]}}}
    if(g.ph==='discard'&&h.length>1){d.push(h.pop());r.disc={...(r.disc||{}),['d'+me]:d}}
    r.hands={['h'+me]:h};
    applyPatch(c,r,'yönetici-atlat');
    return reply(conn,m.id,{ok:true,msg:g.names[me]+' için sıra atlatıldı.'});
  }
  if(/^bot:[0-3]$/.test(a)){
    const i=+a.slice(4);
    if(ENG.isBot(g.seats[i]))return reply(conn,m.id,{ok:false,msg:'Zaten bot.'});
    const seats=[...g.seats],names=[...g.names];seats[i]='bot'+(10+i);names[i]=names[i]+' (bot)';
    const n=clone(g);n.seats=seats;n.names=names;store.set(p,n);dirty=true;notify(p);kick(c);
    return reply(conn,m.id,{ok:true,msg:g.names[i]+' botla değiştirildi.'});
  }
  return reply(conn,m.id,{ok:false,msg:'Bilinmeyen işlem.'});
}
function handle(conn,m){
  const id=m.id|0,op=m.op;
  if(op==='hello'){
    if(conn.uid)return deny(conn,id,'again'); /* bir bağlantı bir kimlik */
    let e=typeof m.token==='string'&&m.token.length===48?tokens.get(m.token):null,tok=m.token;
    if(!e){
      if(!allow('new:'+conn.ip,40,3600e3))return deny(conn,id,'rate');
      tok=crypto.randomBytes(24).toString('hex');e={uid:'u'+crypto.randomBytes(8).toString('hex'),t:now()};tokens.set(tok,e);dirty=true;
    }
    conn.uid=e.uid;online.set(conn.uid,(online.get(conn.uid)||0)+1);
    const cn=+m.now;conn.skew=Number.isFinite(cn)&&Math.abs(cn-now())<864e5?cn-now():0;
    for(const [k,g] of store)if(/\/game\/main$/.test(k)&&g.seats&&g.seats.includes(conn.uid))kick(roomOf(k));
    return reply(conn,id,{ok:true,uid:conn.uid,token:tok,now:now(),ver:BUILD});
  }
  if(!conn.uid)return deny(conn,id,'hello');
  if(op==='ping')return reply(conn,id,{ok:true});
  if(op==='sub'||op==='unsub'){
    const sid=String(m.sid||'').slice(0,20);if(!sid)return;
    const old=conn.subs.get(sid);
    if(old){delSub(old.kind==='doc'?docSubs:colSubs,old.path,old.e);conn.subs.delete(sid)}
    if(op==='unsub')return;
    if(conn.subs.size>=30)return;
    const kind=m.kind==='col'?'col':'doc',p=m.path;
    if(!okPath(p))return;
    if(kind==='doc'?!canReadDoc(conn,p):!canReadCol(conn,p)){send(conn,{sid,snap:kind==='doc'?{exists:false}:{docs:[]}});return}
    const e={conn,sid};conn.subs.set(sid,{kind,path:p,e});addSub(kind==='doc'?docSubs:colSubs,p,e);
    send(conn,{sid,snap:kind==='doc'?snapDoc(conn,p):snapCol(conn,p)});
    return;
  }
  if(op==='get'){if(!okPath(m.path)||!canReadDoc(conn,m.path))return deny(conn,id);return reply(conn,id,{ok:true,snap:snapDoc(conn,m.path)})}
  if(op==='list'){if(!okPath(m.path)||!canReadCol(conn,m.path))return deny(conn,id);return reply(conn,id,{ok:true,snap:snapCol(conn,m.path)})}
  if(op==='set'){if(!okPath(m.path))return deny(conn,id);return hPut(conn,m)}
  if(op==='update'){if(!okPath(m.path))return deny(conn,id);return hUpdate(conn,m)}
  if(op==='delete'){if(!okPath(m.path))return deny(conn,id);return hDelete(conn,m)}
  if(op==='act')return hAct(conn,m);
  if(op==='start')return hStart(conn,m,false);
  if(op==='next')return hStart(conn,m,true);
  if(op==='admin')return hAdmin(conn,m);
  if(op==='adminAct')return hAdminAct(conn,m);
  return deny(conn,id,'unknown');
}

/* ---------- HTTP ---------- */
const INDEX=process.env.INDEX==='1'; /* arama motorlarına açık mı (alan adı alınınca açılacak) */
let BUILD='';try{BUILD=fs.readFileSync(path.join(ROOT,'dist','build.txt'),'utf8').trim()}catch(e){}
const TYPES={'.html':'text/html; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json','.js':'application/javascript; charset=utf-8'};
const STATIC={'/manifest.webmanifest':'manifest.webmanifest','/sw.js':'sw.js','/icon-192.png':'icon-192.png','/icon-512.png':'icon-512.png','/icon-maskable.png':'icon-maskable.png','/apple-touch-icon.png':'apple-touch-icon.png','/apple-touch-icon-precomposed.png':'apple-touch-icon.png','/favicon.ico':'icon-192.png','/og.jpg':'og.jpg'};
const files={};
function loadFile(name){
  const f=path.join(ROOT,'dist',name);
  let body=fs.readFileSync(f);
  if(name==='kurallar.html')body=Buffer.from(body.toString('utf8').replace(/https:\/\/claude\.ai\/artifact\/V24JG6ai5ioRV7m3Tfpkrc/g,'/').replace(/target="_blank" rel="noopener">Oyunu aç/g,'>Oyunu aç'));
  const text=/\.html$/.test(name);
  return{body,text,gz:zlib.gzipSync(body,{level:9}),etag:'"'+crypto.createHash('sha1').update(body).digest('hex').slice(0,16)+'"'};
}
function getFile(name){
  if(!files[name]){try{files[name]=loadFile(name)}catch(e){return null}}
  return files[name];
}
const attr=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function originOf(req){
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'localhost').split(',')[0].trim().replace(/[^A-Za-z0-9.:-]/g,'');
  let proto=String(req.headers['x-forwarded-proto']||'').split(',')[0].trim();
  if(proto!=='http'&&proto!=='https')proto=/^(localhost|127\.|\[?::1|192\.168\.|10\.)/.test(host)?'http':'https';
  return proto+'://'+host;
}
/* sayfanın <head>'ine: uygulama simgeleri, telefona ekleme bilgisi, WhatsApp/sosyal paylaşım önizlemesi */
function headTags(req,name,q){
  const o=originOf(req);
  let title='Kanlı Okey',desc='Arkadaşlarınla telefondan oynanan dört kişilik yöresel okey. Masa kur, kodu paylaş, masaya otur.',url=o+'/';
  if(name==='kurallar.html'){title='Kanlı Okey kuralları: nasıl oynanır?';desc='Kanlı okeyin kuralları: büyük el, 17 ile açma, katlamalı, çift açma, taş işleme, okey değiştirme, cezalar ve çarpanlar.';url=o+'/kurallar'}
  else{
    const k=String(q.get('k')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);
    const r=CODE_RE.test(k)?store.get('rooms/'+k):null;
    if(r){title='Kanlı Okey · '+cleanName(r.hostName)+' seni masaya çağırıyor';desc='Oda kodu: '+k+'. Bağlantıya dokun, kod hazır gelsin, masaya otur.';url=o+'/?k='+k}
  }
  return ['<link rel="manifest" href="/manifest.webmanifest">','<link rel="icon" type="image/png" href="/icon-192.png">','<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<meta name="mobile-web-app-capable" content="yes">','<meta name="apple-mobile-web-app-capable" content="yes">','<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">','<meta name="apple-mobile-web-app-title" content="Kanlı Okey">',
    '<meta property="og:type" content="website">','<meta property="og:site_name" content="Kanlı Okey">','<meta property="og:locale" content="tr_TR">',
    `<meta property="og:title" content="${attr(title)}">`,`<meta property="og:description" content="${attr(desc)}">`,`<meta property="og:url" content="${attr(url)}">`,
    `<meta property="og:image" content="${attr(o)}/og.jpg">`,'<meta property="og:image:width" content="1200">','<meta property="og:image:height" content="630">','<meta property="og:image:alt" content="Kanlı Okey">',
    '<meta name="twitter:card" content="summary_large_image">',`<meta name="twitter:title" content="${attr(title)}">`,`<meta name="twitter:description" content="${attr(desc)}">`,`<meta name="twitter:image" content="${attr(o)}/og.jpg">`,
    ...(INDEX?[`<link rel="canonical" href="${attr(url.split('?')[0])}">`]:[])].join('\n');
}
const pageCache=new Map(); /* (sayfa|köken) -> sıkıştırılmış hal; davet bağlantıları her seferinde hesaplanır */
const CSP="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data:; media-src 'self' data: blob:; connect-src 'self' ws: wss: data:; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
const server=http.createServer((req,res)=>{
  const [u,qs]=(req.url||'/').split('?');
  const q=new URLSearchParams(qs||'');
  const base={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':CSP,...(INDEX?{}:{'X-Robots-Tag':'noindex'})};
  if(u==='/health'){res.writeHead(200,{...base,'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,ver:BUILD,rooms:[...store.keys()].filter(k=>/^rooms\/[A-Z0-9]{5}$/.test(k)).length,conns:conns.size}));return}
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,base);res.end();return}
  if(u==='/robots.txt'){res.writeHead(200,{...base,'Content-Type':'text/plain'});res.end(INDEX?'User-agent: *\nAllow: /\n':'User-agent: *\nDisallow: /\n');return}
  const gzOk=/\bgzip\b/.test(req.headers['accept-encoding']||'');
  const st=STATIC[u];
  if(st){
    const f=getFile(st);if(!f){res.writeHead(404,base);res.end();return}
    const ext=path.extname(st),cache=st==='sw.js'?'no-cache':ext==='.webmanifest'?'public, max-age=3600':'public, max-age=604800';
    if(req.headers['if-none-match']===f.etag){res.writeHead(304,{...base,ETag:f.etag});res.end();return}
    const z=gzOk&&(ext==='.js'||ext==='.webmanifest');
    res.writeHead(200,{...base,'Content-Type':TYPES[ext]||'application/octet-stream','Cache-Control':cache,ETag:f.etag,...(st==='sw.js'?{'Service-Worker-Allowed':'/'}:{}),...(z?{'Content-Encoding':'gzip',Vary:'Accept-Encoding'}:{})});
    res.end(req.method==='HEAD'?undefined:(z?f.gz:f.body));return;
  }
  const name=u==='/'||u==='/index.html'?'index.html':u==='/kurallar'||u==='/kurallar.html'?'kurallar.html':null;
  const f=name&&getFile(name);
  if(!f){res.writeHead(404,{...base,'Content-Type':'text/plain; charset=utf-8'});res.end('Bulunamadı');return}
  const invite=name==='index.html'&&q.has('k');
  const key=name+'|'+originOf(req);
  let pg=invite?null:pageCache.get(key);
  if(!pg){
    const body=Buffer.from(f.body.toString('utf8').replace('<!--@HEAD@-->',headTags(req,name,q)));
    pg={body,gz:gzOk?zlib.gzipSync(body,{level:invite?6:9}):null,etag:'"'+crypto.createHash('sha1').update(body).digest('hex').slice(0,16)+'"'};
    if(!invite){if(pageCache.size>20)pageCache.clear();if(!pg.gz)pg.gz=zlib.gzipSync(body,{level:9});pageCache.set(key,pg)}
  }
  if(!invite&&req.headers['if-none-match']===pg.etag){res.writeHead(304,{...base,ETag:pg.etag});res.end();return}
  const z=gzOk&&pg.gz;
  res.writeHead(200,{...base,'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache',...(invite?{}:{ETag:pg.etag}),Vary:'Accept-Encoding',...(z?{'Content-Encoding':'gzip'}:{})});
  res.end(req.method==='HEAD'?undefined:(z?pg.gz:pg.body));
});

/* ---------- WebSocket ---------- */
const wss=new WebSocketServer({noServer:true,maxPayload:64*1024});
server.on('upgrade',(req,sock,head)=>{
  const u=(req.url||'').split('?')[0];
  const origin=req.headers.origin;
  let sameOrigin=true;
  if(origin){try{sameOrigin=new URL(origin).host===req.headers.host}catch(e){sameOrigin=false}}
  if(u!=='/ws'||!sameOrigin){sock.write('HTTP/1.1 403 Forbidden\r\n\r\n');sock.destroy();return}
  wss.handleUpgrade(req,sock,head,ws=>wss.emit('connection',ws,req));
});
wss.on('connection',(ws,req)=>{
  const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();
  if(!allow('conn:'+ip,120,60e3)){ws.close(1013,'rate');return}
  const conn={ws,ip,uid:null,admin:false,skew:0,subs:new Map(),bucket:60,bt:now(),alive:true};
  conns.add(conn);
  ws.on('pong',()=>{conn.alive=true});
  ws.on('message',(buf,isBin)=>{
    if(isBin)return;
    let m;try{m=JSON.parse(buf.toString('utf8'))}catch(e){return}
    if(!m||typeof m!=='object')return;
    const t=now();conn.bucket=Math.min(60,conn.bucket+(t-conn.bt)*0.02);conn.bt=t; /* saniyede 20 mesaj, 60'lık tampon */
    if(--conn.bucket<0){if(conn.bucket<-200){ws.close(1008,'rate');return}if(m.id)deny(conn,m.id|0,'rate','Çok hızlı istek gönderiliyor, biraz bekle.');return}
    try{handle(conn,m)}catch(e){log('istek hatası',e&&e.stack);if(m.id)deny(conn,m.id|0,'error')}
  });
  ws.on('close',()=>{
    conns.delete(conn);
    for(const s of conn.subs.values())delSub(s.kind==='doc'?docSubs:colSubs,s.path,s.e);
    if(conn.uid){const n=(online.get(conn.uid)||1)-1;if(n>0)online.set(conn.uid,n);else online.delete(conn.uid)}
  });
});
const hb=setInterval(()=>{for(const c of conns){if(!c.alive){try{c.ws.terminate()}catch(e){}continue}c.alive=false;try{c.ws.ping()}catch(e){}}},30000);

/* ---------- temizlik: eski odalar ---------- */
const sweep=setInterval(()=>{
  const t=now();
  for(const k of [...store.keys()]){
    const m=/^rooms\/([A-Z0-9]{5})$/.exec(k);if(!m)continue;
    const c=m[1],r=store.get(k),la=lastAct.get(c)||r.t||0,anyOn=membersOf(c).some(x=>(online.get(x.id)||0)>0);
    const g=store.get(gamePath(c)),idle=t-la;
    if((!anyOn&&idle>6*3600e3)||idle>48*3600e3||(g&&g.ph==='end'&&g.round+1>=g.R&&idle>3600e3&&!anyOn)){log('eski oda silindi',c);wipeRoom(c)}
  }
  for(const [tk,e] of tokens)if(t-e.t>180*864e5&&!(online.get(e.uid)>0))tokens.delete(tk);
  ENG.resetCaches();
},10*60e3);
/* açılışta bekleyen oyunlar için son hareketi şimdi say */
for(const k of store.keys()){const m=/^rooms\/([A-Z0-9]{5})$/.exec(k);if(m)lastAct.set(m[1],now())}

function shutdown(){log('kapanıyor');dirty=true;save();process.exit(0)}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
if(require.main===module){
  if(!ADMIN_PW)log('UYARI: ADMIN_PASSWORD yok, yönetici girişi kapalı');
  server.listen(PORT,()=>log('Kanlı Okey sunucusu çalışıyor: http://localhost:'+PORT));
}
module.exports={server,store,stop(){dirty=true;save();clearInterval(saveTimer);clearInterval(hb);clearInterval(sweep);for(const t of timers.values())clearTimeout(t);wss.close();server.close()}};
