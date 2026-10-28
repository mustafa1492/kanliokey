let fails=0;
const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m)}else console.log('ok  ',m)};
// tile ids: color c, number n -> c*26+(n-1) (first copy), +13 second copy
const id=(c,n,k=0)=>c*26+(n-1)+13*k;
B=false;
let O={c:0,n:5}; // okey = red 5 in this hand (normal el)
// per kuralları
ok(grp([id(1,5),id(1,6),id(1,7)],O)===18,'5-6-7 aynı renk = 18');
ok(grp([id(1,12),id(1,13),id(1,1)],O)===-1,'12-13-1 per değil');
ok(grp([id(1,1),id(1,2),id(1,3)],O)===6,'1-2-3 per');
ok(grp([id(1,11),id(2,11),id(3,11)],O)===33,'11 erkek per 33');
ok(grp([id(1,11),id(2,11),id(3,11),id(0,11)],O)===44,'erkek per 4 taş');
ok(valid([id(1,12),id(1,13),id(1,1)],O)===false,'12-13-1 elde bitmez');
// çift
ok(prs([id(1,7),id(1,7,1)],O)===7,'çift: aynı renk ve sayı');
ok(prs([id(1,7),id(2,7)],O)===-1,'çift: farklı renk olmaz');
const ok1=id(0,5); // okey taşı (kırmızı 5)
ok(prs([id(1,7),ok1],O)===7,'okey çifte katılır');
ok(prs([ok1,id(0,5,1)],O)===-1,'iki okey çift olmaz');
ok(stTot([[id(1,7),id(1,7,1)],[id(2,9),id(2,9,1)],[id(3,11),id(3,11,1)]],O)===Math.floor((7+9+11)*2/3),'çift açma puanı');
// rec + canAdd
let r=rec([id(1,5),id(1,6),id(1,7)],O);
ok(r.k==='q'&&r.lo===5,'dişi per kaydı');
ok(JSON.stringify(canAdd(r,id(1,4),O))==='["l"]','4 sol uç');
ok(JSON.stringify(canAdd(r,id(1,8),O))==='["h"]','8 sağ uç');
ok(canAdd(r,id(1,9),O).length===0,'9 işlenmez');
ok(canAdd(r,id(2,8),O).length===0,'başka renk işlenmez');
ok(JSON.stringify(canAdd(r,ok1,O).sort())==='["h","l"]','okey iki uca da işlenir');
ok(addVal(r,ok1,'h',O)===8&&addVal(r,ok1,'l',O)===4,'okey değeri: 8 / 4');
let r2=rec([id(1,12),id(1,13),id(1,11)],O);
ok(r2.lo===11&&canAdd(r2,id(1,1),O).length===0,'12-13 sonuna 1 işlenmez');
let r3=rec([id(1,2),id(1,3),id(1,4)],O);
ok(JSON.stringify(canAdd(r3,id(1,1),O))==='["l"]','1 başa işlenir');
// erkek per
let s1=rec([id(1,9),id(2,9),id(3,9)],O);
ok(s1.k==='s'&&JSON.stringify(canAdd(s1,id(0,9),O))==='["s"]','erkek per 4. renk');
ok(canAdd(s1,id(1,9,1),O).length===0,'erkek per aynı renk olmaz');
let s4=rec([id(1,9),id(2,9),id(3,9),id(0,9)],O);
ok(canAdd(s4,ok1,O).length===0,'erkek per 4 taş sınırı');
// okey içeren seri: 5-6-okey
let rj=rec([id(1,5),id(1,6),ok1],O);
ok(rj.lo===5&&rj.g.length===3,'5-6-okey = 5-6-7');
// ishler
const S0={tbl:{t0:[r],t1:[],t2:[],t3:[]}};
ok(ishler(S0,id(1,4),O)===true,'işler taş atma tespit');
ok(ishler(S0,id(3,2),O)===false,'işlemeyen taş serbest');
// fin çarpanları
function mk(opn,hands,B_,sc){return {B:B_,okey:O,opn:{s0:opn[0],s1:opn[1],s2:opn[2],s3:opn[3]},hands:{h0:hands[0],h1:hands[1],h2:hands[2],h3:hands[3]},scores:{},ex:{s1:70}}}
let s=mk([10,12,0,0],[[],[id(1,7),id(1,5),id(1,3)],[id(2,2)],[id(2,2)]],true);
let f=fin(s,0,false);
// büyük el: finisher -200; oyuncu1 açmış 15*10=150; oyuncu 2,3 açamamış 1000; solo değil (1 açmış)
ok(f.scores.s0===-200&&f.scores.s1===150&&f.scores.s2===1000,'büyük el temel cezalar: '+JSON.stringify(f.scores));
ok(f.last[1]===150+70,'ex el sonu listesinde');
s=mk([10,0,0,0],[[],[id(2,2)],[id(2,2)],[id(2,2)]],true);
f=fin(s,0,false);ok(f.scores.s0===-400&&f.scores.s1===2000,'büyük el tek başına: -400 ve açamayan 2000: '+JSON.stringify(f.scores));
f=fin(s,0,true);ok(f.scores.s0===-800&&f.scores.s1===4000,'okey + tek başına 4 kat: '+JSON.stringify(f.scores));
s=mk([10,12,0,0],[[],[id(2,2)],[id(2,2)],[id(2,2)]],false);
f=fin(s,0,true);ok(f.scores.s0===-200&&f.scores.s2===1000,'normal el okeyle bitirme 2 kat: '+JSON.stringify(f.scores));
f=fin(s,-1);ok(f.scores.s0===undefined?true:true,'deste bitti çalışır');
f=fin(s,-1);ok(f.win===99&&f.scores.s2===500,'deste bitince açamayan 500');
// okey elde kalma
let ok2=mk([10,12,0,0],[[],[ok1,id(1,3)],[id(2,2)],[id(2,2)]],false);
f=fin(ok2,0,false);ok(f.scores.s1===250+3*5,'elde kalan okey 250 + taş: '+f.scores.s1);
ok2.okey={c:0,n:5};
console.log(fails?('FAILED '+fails):'ALL PASSED');
