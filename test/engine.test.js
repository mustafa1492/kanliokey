/* kural motoru testleri. Her test bir kurala bağlı (docs/KURALLAR.md). */
const vm=require('vm'),fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../src/engine.js'),'utf8');
const ctx={console,Math,Date,JSON,setTimeout,clearTimeout};vm.createContext(ctx);
vm.runInContext(src,ctx);
/* 1) eski kural testleri (per, çift, işleme, ceza çarpanları) */
console.log('--- temel kurallar');
vm.runInContext(fs.readFileSync(path.join(__dirname,'legacy-rules.js'),'utf8').replace("console.log(fails?('FAILED '+fails):'ALL PASSED');","globalThis.__legacyFails=fails;"),ctx);
let fails=ctx.__legacyFails|0;
const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fails++};
const E=ctx.ENG;
const id=(c,n,k=0)=>c*26+(n-1)+13*k;            /* renk c, sayı n, k. kopya */
const O={c:3,n:13};                               /* okey: 4. rengin 13'ü (testlerde kullanılmıyor) */
function base(h0,extra){
  /* 0. koltuk sırada, atma aşamasında; geri kalan taşlar desteye, toplam 106 */
  const used=new Set(h0),rest=[...Array(106).keys()].filter(x=>!used.has(x)&&x!==id(3,12));
  const s={seats:['u0','u1','u2','u3'],names:['A','B','C','D'],scores:{},ex:{s0:0,s1:0,s2:0,s3:0},
    hands:{h0:[...h0],h1:rest.splice(0,14),h2:rest.splice(0,14),h3:rest.splice(0,14)},disc:{d0:[],d1:[],d2:[],d3:[]},
    tbl:{t0:[],t1:[],t2:[],t3:[]},opn:{s0:0,s1:0,s2:0,s3:0},opm:{s0:'',s1:'',s2:'',s3:''},mx:0,must:-1,trn:8,ot:-1,
    deck:rest,ind:id(3,12),okey:O,B:false,round:1,R:9,turn:0,start:0,ph:'discard',win:-1,ik:[],last:[0,0,0,0],tt:0,gid:1};
  return Object.assign(s,extra||{});
}
const run=(s,name,a)=>E.run(name,JSON.parse(JSON.stringify(s)),0,a);
console.log('--- açma (K-açma)');
const red=n=>id(0,n);
let s=base([red(8),red(9),red(10),red(11),red(12),red(13),id(1,2),id(2,5)]);
let r=run(s,'open',{groups:[[red(8),red(9),red(10),red(11),red(12),red(13)]]});
ok(!r.r&&/Altı ya da daha fazla/.test(r.msg),'6 taşlık seri tek per olarak açılmaz, uyarı verir');
r=run(s,'open',{groups:[[red(8),red(9),red(10)],[red(11),red(12),red(13)]]});
ok(r.r&&r.r.opn.s0===21&&r.r.hands.h0.length===2,'6 taş 3+3 olarak açılır (63/3=21)');
s=base([red(7),red(8),red(9),red(10),red(11),red(12),red(13),id(1,2),id(2,5)]);
r=run(s,'open',{groups:[[red(7),red(8),red(9)],[red(10),red(11),red(12),red(13)]]});
ok(!!r.r,'7 taş 3+4 olarak açılır');
r=run(s,'open',{groups:[[red(7),red(8),red(9),red(10),red(11),red(12),red(13)]]});
ok(!r.r,'7 taş tek per olmaz');
s=base([red(8),red(9),red(10),red(11),red(12),red(13),id(1,2)]);
r=run(s,'open',{groups:[[red(8),red(9),red(10)],[red(11),red(12),red(13)]]});
ok(!r.r&&/en az iki taş/.test(r.msg),'açtığın turda son taşı atamazsın: açınca elde 2 taş kalmalı');
s=base([red(1),red(2),red(3),id(1,2),id(2,5),id(1,9)]);
r=run(s,'open',{groups:[[red(1),red(2),red(3)]]});
ok(!r.r&&/en az 17/.test(r.msg),'17 altı açılmaz');
s=base([red(8),red(9),red(10),red(11),red(12),red(13),id(1,2),id(2,5)],{trn:2});
r=run(s,'open',{groups:[[red(8),red(9),red(10)],[red(11),red(12),red(13)]]});
ok(!r.r&&/İlk turda/.test(r.msg),'ilk tur dönmeden açılmaz');
s=base([red(8),red(9),red(10),red(11),red(12),red(13),id(1,2),id(2,5)],{mx:21});
r=run(s,'open',{groups:[[red(8),red(9),red(10)],[red(11),red(12),red(13)]]});
ok(!r.r&&/en az 22/.test(r.msg),'katlamalı: masada 21 varsa en az 22 gerekir');
r=run(s,'open',{groups:[[red(8),red(8),red(10)]]});ok(!r.r,'aynı taş iki kez kullanılamaz');
r=run(s,'open',{groups:[[red(8),red(9),99]]});ok(!r.r,'elde olmayan taşla açılmaz');
r=run(s,'open',{groups:'x'});ok(!r.r,'bozuk açma isteği reddedilir');
r=run(s,'open',{groups:[[red(8),id(1,2),id(2,5)]]});ok(!r.r&&/geçerli bir per/.test(r.msg),'geçersiz per açılmaz');
console.log('--- çift açma');
const pr=(c,n)=>[id(c,n),id(c,n,1)];
s=base([...pr(1,9),...pr(2,10),...pr(1,11),id(2,1),id(3,3)]);
r=run(s,'open',{groups:[pr(1,9),pr(2,10),pr(1,11)]});
ok(r.r&&r.r.opm.s0==='c'&&r.r.opn.s0===20,'üç çift: (9+10+11)*2/3=20 ile açılır');
s=base([id(3,3)],{opn:{s0:20,s1:0,s2:0,s3:0},opm:{s0:'c',s1:'',s2:'',s3:''},tbl:{t0:[{g:pr(1,9),k:'p',n:9}],t1:[],t2:[],t3:[]}});
r=run(s,'discard',{t:id(3,3)});
ok(r.r&&r.r.ph==='end'&&r.r.win===0,'çift açan elinde tek taş kalıp atınca biter');
s=base([red(1),red(2),red(3),id(3,3)],{opn:{s0:20,s1:0,s2:0,s3:0},opm:{s0:'c',s1:'',s2:'',s3:''}});
r=run(s,'discard',{t:id(3,3)});
ok(r.r&&r.r.ph==='draw','çift açan, elinde per kalsa da tek taş kalmadan bitmez');
console.log('--- bitirme');
s=base([red(1),red(2),red(3),id(3,3)],{opn:{s0:20,s1:0,s2:0,s3:0},opm:{s0:'p',s1:'',s2:'',s3:''}});
r=run(s,'discard',{t:id(3,3)});
ok(r.r&&r.r.ph==='end'&&r.r.win===0,'per açan: kalanlar per, son taşı atınca biter');
s=base([id(3,3)],{opn:{s0:20,s1:0,s2:0,s3:0},opm:{s0:'p',s1:'',s2:'',s3:''},ot:0});
r=run(s,'discard',{t:id(3,3)});
ok(!r.r&&/Açtığın turda son/.test(r.msg),'açtığın turda son taş atılamaz');
s=base([red(1),red(2),red(3),id(3,3)]);
r=run(s,'discard',{t:id(3,3)});ok(r.r&&r.r.ph==='draw','açmamış oyuncu bitiremez');
console.log('--- yandan taş, işleme, cezalar');
s=base([red(5),red(6),id(1,1),id(2,9)],{must:red(7)});s.hands.h0.push(red(7));
r=run(s,'discard',{t:id(1,1)});ok(!r.r&&/Yandan aldığın/.test(r.msg),'yandan alınan taş kullanılmadan taş atılamaz');
const per567={g:[id(1,5),id(1,6),id(1,7)],k:'q',lo:5};
s=base([id(1,8),id(2,2),id(2,3)],{opn:{s0:20,s1:20,s2:0,s3:0},opm:{s0:'p',s1:'p',s2:'',s3:''},tbl:{t0:[],t1:[per567],t2:[],t3:[]}});
r=run(s,'insert',{o:1,gi:0,e:'h',t:id(1,8)});ok(r.r&&r.r.scores.s1===80,'rakibin perine 8 işlenince sahibine 80 ceza');
s.tbl={t0:[per567],t1:[],t2:[],t3:[]};
r=run(s,'insert',{o:0,gi:0,e:'h',t:id(1,8)});ok(r.r&&!r.r.scores,'kendi perine işlemede ceza yok');
s=base([id(1,8),id(2,2),id(2,3)],{opn:{s0:0,s1:20,s2:0,s3:0},tbl:{t0:[],t1:[per567],t2:[],t3:[]}});
r=run(s,'discard',{t:id(1,8)});ok(r.r&&r.r.scores.s0===500,'işler taş atana 500 ceza');
r=run(s,'insert',{o:1,gi:0,e:'h',t:id(1,8)});ok(!r.r,'açmamış oyuncu işleyemez');
r=run(s,'insert',{o:1,gi:0,e:'zz',t:id(1,8)});ok(!r.r,'bozuk uç reddedilir');
console.log('--- eşli oyun (K-eşli)');
{
  const P=(h0,extra)=>base(h0,Object.assign({pair:true},extra||{}));
  // 0 ile 2 eş. 0 bitirir: 2'ye hiç ceza yok (açmamış da olsa), 1 ve 3 normal
  let s=P([red(1),red(2),red(3),id(3,3)],{opn:{s0:20,s1:22,s2:0,s3:0},opm:{s0:'p',s1:'p',s2:'',s3:''}});
  let r=run(s,'discard',{t:id(3,3)});
  ok(r.r&&r.r.ph==='end'&&r.r.last[2]===0&&r.r.last[3]===500&&r.r.last[0]===-100,'eşin bitirince açmamış eşe ceza yok, bitirme puanı sadece bitirene: '+JSON.stringify(r.r&&r.r.last));
  s=P([red(1),red(2),red(3),id(3,3)],{opn:{s0:20,s1:0,s2:21,s3:0},opm:{s0:'p',s1:'',s2:'p',s3:''}});
  r=run(s,'discard',{t:id(3,3)});
  ok(r.r&&r.r.last[2]===0,'eşin bitirince açmış eşin elindeki taşlara da ceza yok');
  ok(r.r&&r.r.last[0]===-100&&r.r.last[1]===500,'eşi açtıysa tek başına bitirme sayılmaz (çarpan yok): '+JSON.stringify(r.r&&r.r.last));
  s=P([red(1),red(2),red(3),id(3,3)],{opn:{s0:20,s1:0,s2:0,s3:0},opm:{s0:'p',s1:'',s2:'',s3:''}});
  r=run(s,'discard',{t:id(3,3)});
  ok(r.r&&r.r.last[0]===-200&&r.r.last[1]===1000&&r.r.last[2]===0,'kimse açmamışsa tek başına ×2, eşe yine ceza yok: '+JSON.stringify(r.r&&r.r.last));
  // eşin perine işleme ve okey değiştirme: ceza yok; rakibe: var
  const p567={g:[id(1,5),id(1,6),id(1,7)],k:'q',lo:5};
  s=P([id(1,8),id(2,2),id(2,3)],{opn:{s0:20,s1:20,s2:20,s3:0},opm:{s0:'p',s1:'p',s2:'p',s3:''},tbl:{t0:[],t1:[p567],t2:[p567],t3:[]}});
  r=run(s,'insert',{o:2,gi:0,e:'h',t:id(1,8)});ok(r.r&&!r.r.scores,'eşin perine işlemede ceza yok');
  r=run(s,'insert',{o:1,gi:0,e:'h',t:id(1,8)});ok(r.r&&r.r.scores&&r.r.scores.s1===80,'rakibin perine işlemede ceza var');
  const jk=id(O.c,O.n);  // okey taşı
  const pj={g:[id(1,5),id(1,6),jk],k:'q',lo:5};
  s=P([id(1,7),id(2,2),id(2,3)],{opn:{s0:20,s1:20,s2:20,s3:0},opm:{s0:'p',s1:'p',s2:'p',s3:''},tbl:{t0:[],t1:[],t2:[pj],t3:[]}});
  r=run(s,'swap',{o:2,gi:0,idx:2,t:id(1,7)});ok(r.r&&!r.r.scores,'eşin perindeki okeyi değiştirmede ceza yok');
  // işler taş her zaman işler
  s=P([id(1,8),id(2,2),id(2,3)],{opn:{s0:0,s1:0,s2:20,s3:0},tbl:{t0:[],t1:[],t2:[p567],t3:[]}});
  r=run(s,'discard',{t:id(1,8)});ok(r.r&&r.r.scores.s0===500,'sadece eşin perine uyan taşı atmak da işler taş: 500');
  // katlamalı eşin açılışına da geçerli
  s=P([red(8),red(9),red(10),red(11),red(12),red(13),id(1,2),id(2,5)],{mx:21,opn:{s0:0,s1:0,s2:21,s3:0}});
  r=run(s,'open',{groups:[[red(8),red(9),red(10)],[red(11),red(12),red(13)]]});
  ok(!r.r&&/en az 22/.test(r.msg),'katlamalı eşin açılışına da geçerli');
  // deste biterse herkes normal
  s=P([red(1),red(2)],{ph:'draw',deck:[],opn:{s0:20,s1:0,s2:0,s3:0}});s.hands.h1.push(...s.deck.splice(0));
  const f=E.fin(JSON.parse(JSON.stringify(s)),-1);ok(f.win===99&&f.last[1]===500&&f.last[2]===500,'eşlide deste bitince normal cezalar');
  ok(E.deal(null,9,[0,1,2,3].map(i=>({u:'u'+i,n:'n'+i})),1,{pair:true}).pair===true,'eşli masa dağıtımda işaretlenir');
}
console.log('--- görünüm ve sayım');
s=base([red(1),red(2)]);
const v=E.view(s,0);ok(v.hands.h1.every(x=>x===null)&&v.hands.h0[0]===red(1)&&v.deck.every(x=>x===null),'görünüm: başkasının eli ve deste gizli');
ok(E.tileCount(s)===106,'taş sayısı 106');
const end=Object.assign(JSON.parse(JSON.stringify(s)),{ph:'end'});ok(E.view(end,0).hands.h1[0]!==null,'el bitince eller açılır');
ok(run(s,'yok',{}).r===null,'bilinmeyen hamle');
console.log('--- puan: artanlar birikir, yandan (K-puan)');
{const q=[id(0,11),id(1,11),id(2,11),id(3,11)],p=[id(0,5),id(0,6),id(0,7)];
 ok(E.stRem([q,p],O)===2,'dört 11 + 5-6-7 = 62: yandan 2');
 const s3=base([...q,...p,id(1,2),id(2,4)]);const r3=run(s3,'open',{groups:[q,p]});
 ok(r3.r&&r3.r.opn.s0===20,'dört 11 + 5-6-7 ile 20 açılır (62/3, artan 2 yandan)');
 const s4=base([...q,id(1,2),id(2,4),id(2,9)],{mx:14});const r4=run(s4,'open',{groups:[q]});
 ok(!r4.r&&/şu an 14 \(yandan 2\)/.test(r4.msg),'yetmeyince yandan da yazılır: '+r4.msg);
 console.log('--- kısmi açma: elindeki perlerin hepsini açmak zorunda değilsin');
 const s5=base([...q,...p,id(1,9),id(2,9),id(3,9),id(1,2)]);const r5=run(s5,'open',{groups:[q,p]});
 ok(r5.r&&r5.r.hands.h0.length===4&&r5.r.tbl.t0.length===2,'9-9-9 elde kaldı, sadece seçilen perler açıldı');}
const s2=base([red(1),red(2)],{turn:1});ok(run(s2,'discard',{t:red(1)}).r===null,'sırası olmayan oynayamaz');
console.log(fails?'FAILED '+fails:'ALL PASSED');
process.exit(fails?1:0);
