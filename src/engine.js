/* Kanlı Okey kural motoru
   Aynı dosya hem tarayıcıda (claude.ai sayfası ve sunucu sayfası) hem Node sunucusunda çalışır.
   Kurallar Mustafa'nın anlattığı şekilde: bkz. docs/KURALLAR.md. Kural eklerken tahmin yok. */
let B=false;      /* büyük el: okey yerine joker (★) taşları */
let emsg='';      /* son hamlenin oyuncuya gösterilecek açıklaması */
const isBot=u=>String(u).startsWith('bot');
function fillBots(ps){let k=1;while(ps.length<4){ps.push({u:'bot'+k,n:'Bot '+k});k++}return ps}
const tv=(id,O)=>id>=104?(B?{c:3,n:0}:{c:O.c,n:O.n}):{c:id/26|0,n:id%13+1};
const isJ=(id,O)=>B?id>=104:(id<104&&(id/26|0)===O.c&&id%13+1===O.n);
const val=(id,O)=>isJ(id,O)?25:tv(id,O).n;
const prs=(ids,O)=>{if(ids.length!==2)return -1;const nat=ids.filter(x=>!isJ(x,O));if(nat.length===0)return -1;if(nat.length===1)return tv(nat[0],O).n;const a=tv(nat[0],O),b=tv(nat[1],O);return a.c===b.c&&a.n===b.n?a.n:-1};
const isSetG=(ids,O)=>{const ts=ids.filter(x=>!isJ(x,O)).map(x=>tv(x,O));return ids.length<=4&&ts.length>0&&ts.every(t=>t.n===ts[0].n)&&new Set(ts.map(t=>t.c)).size===ts.length};
function rec(ids,O){
  if(ids.length===2)return{g:ids,k:'p',n:prs(ids,O)};
  if(isSetG(ids,O))return{g:ids,k:'s',n:tv(ids.find(x=>!isJ(x,O)),O).n};
  const nat=ids.filter(x=>!isJ(x,O)).sort((a,b)=>tv(a,O).n-tv(b,O).n),jq=ids.filter(x=>isJ(x,O));
  const mp={};nat.forEach(x=>{mp[tv(x,O).n]=x});
  let lo=tv(nat[0],O).n,hi=tv(nat[nat.length-1],O).n;const g=[];
  for(let x=lo;x<=hi;x++)g.push(mp[x]!=null?mp[x]:jq.pop());
  while(jq.length){if(hi<13){g.push(jq.pop());hi++}else{g.unshift(jq.pop());lo--}}
  return{g,k:'q',lo};
}
function canAdd(r,t,O){
  if(!r||!r.g||r.k==='p')return [];
  const j=isJ(t,O);
  if(r.k==='s'){
    if(r.g.length>=4)return [];
    if(j)return ['s'];
    const v=tv(t,O);
    if(v.n!==r.n)return [];
    const cs=r.g.filter(x=>!isJ(x,O)).map(x=>tv(x,O).c);
    return cs.includes(v.c)?[]:['s'];
  }
  const hi=r.lo+r.g.length-1,out=[];
  if(j){if(r.lo>1)out.push('l');if(hi<13)out.push('h');return out}
  const v=tv(t,O),c=tv(r.g.find(x=>!isJ(x,O)),O).c;
  if(v.c!==c)return [];
  if(v.n===r.lo-1)out.push('l');
  if(v.n===hi+1&&hi<13)out.push('h');
  return out;
}
function addVal(r,t,e,O){
  if(!isJ(t,O))return tv(t,O).n;
  if(e==='s')return r.n;
  return e==='l'?r.lo-1:r.lo+r.g.length;
}
function canSwap(r,i,t,O){
  if(!r||!r.g||!isJ(r.g[i],O)||isJ(t,O))return false;
  const v=tv(t,O);
  if(r.k==='q'){const c=tv(r.g.find(x=>!isJ(x,O)),O).c;return v.c===c&&v.n===r.lo+i}
  if(r.k==='s'){const cs=r.g.filter(x=>!isJ(x,O)).map(x=>tv(x,O).c);return v.n===r.n&&!cs.includes(v.c)}
  if(r.k==='p'){const a=tv(r.g.find(x=>!isJ(x,O)),O);return v.c===a.c&&v.n===a.n}
  return false;
}
function slotVal(r,i,O){
  if(r.k==='q')return r.lo+i;
  if(r.k==='s')return r.n;
  return tv(r.g.find(x=>!isJ(x,O)),O).n;
}
const ishler=(s,t,O)=>[0,1,2,3].some(i=>(s.tbl['t'+i]||[]).some(r=>r&&r.g&&canAdd(r,t,O).length>0));
const stTot=(st,O)=>st.length&&st.every(g=>g.length===2)?Math.floor(st.reduce((a,g)=>a+prs(g,O),0)*2/3):Math.floor(st.reduce((a,g)=>a+grp(g,O),0)/3);
/* artan (yandan): taşların toplamı 3'e bölünür, artanlar birikir; kalan 1 ya da 2 puana yetmez, "yandan" diye gösterilir */
const stRem=(st,O)=>st.length&&st.every(g=>g.length===2)?(st.reduce((a,g)=>a+prs(g,O),0)*2)%3:st.reduce((a,g)=>a+grp(g,O),0)%3;
function grp(ids,O){
  const n=ids.length,ts=ids.filter(x=>!isJ(x,O)).map(x=>tv(x,O));
  if(n<3||n>13||!ts.length)return -1;
  if(n<=4&&ts.every(t=>t.n===ts[0].n)&&new Set(ts.map(t=>t.c)).size===ts.length)return ts[0].n*n;
  if(!ts.every(t=>t.c===ts[0].c))return -1;
  let best=-1;
  for(const hi of [0]){
    const a=ts.map(t=>hi&&t.n===1?14:t.n).sort((x,y)=>x-y);
    if(new Set(a).size<a.length)continue;
    const s=Math.min(a[0],(hi?14:13)-n+1);
    if(s<1||s+n-1<a[a.length-1])continue;
    let v=0;for(let p=s;p<s+n;p++)v+=p>13?1:p;
    best=Math.max(best,v);
  }
  return best;
}
function valid(h,O){
  let jk=0;const cnt=[0,1,2,3].map(()=>Array(15).fill(0));
  for(const id of h){if(isJ(id,O))jk++;else{const v=tv(id,O);cnt[v.c][v.n]++}}
  return solve(cnt,jk);
}
function solve(cnt,jk){
  let c=-1,n=0;
  outer:for(let a=0;a<4;a++)for(let b=1;b<=13;b++)if(cnt[a][b]>0){c=a;n=b;break outer}
  if(c<0)return true;
  const P=[0,1,2,3].filter(x=>x!==c&&cnt[x][n]>0);
  for(let m=0;m<1<<P.length;m++){
    const ch=P.filter((_,i)=>m>>i&1);
    for(const k of [3,4]){
      const j=k-1-ch.length;
      if(j<0||j>jk)continue;
      cnt[c][n]--;ch.forEach(x=>cnt[x][n]--);
      const r=solve(cnt,jk-j);
      cnt[c][n]++;ch.forEach(x=>cnt[x][n]++);
      if(r)return true;
    }
  }
  const cands=[];
  for(let p=Math.max(1,n-2);p<=n;p++)for(let q=Math.max(n,p+2);q<=Math.min(p+12,13);q++)cands.push([p,q]);
  for(const [p,q] of cands){
    const used=[];let need=0;
    for(let x=p;x<=q;x++){const m=x===14?1:x;if(cnt[c][m]>0){cnt[c][m]--;used.push(m)}else need++}
    const r=need<=jk&&solve(cnt,jk-need);
    used.forEach(m=>cnt[c][m]++);
    if(r)return true;
  }
  return false;
}
const hk=i=>'h'+i,dk=i=>'d'+i;
function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a}
/* eşli oyun: eşler karşılıklı oturur (0-2, 1-3). Kurallar: docs/KURALLAR.md "Eşli oyun" */
const isMate=(s,a,b)=>!!(s&&s.pair)&&a!==b&&(a+2)%4===b;
/* eşli masada oturma sırası: ps = masaya giriş sırasıyla 4 oyuncu, pr = eşleşme (0: 1.+2. / 3.+4., 1: 1.+3. / 2.+4., 2: 1.+4. / 2.+3.)
   eşler karşılıklı (0-2, 1-3) oturacak şekilde dizer */
function pairOrder(ps,pr){const [a,b,c,d]=ps;return pr===2?[a,b,d,c]:pr===1?[a,b,c,d]:[a,c,b,d]}
/* yeni el dağıtımı: prev = önceki elin durumu (yoksa ilk el), ps = [{u,n}] 4 oyuncu, opt.pair = eşli */
function deal(prev,R,ps,now,opt){
  now=now||Date.now();
  const pair=prev?!!prev.pair:!!(opt&&opt.pair);
  const round=prev?prev.round+1:0,big=round%4===0,d0=prev&&prev.d0!=null?prev.d0:(Math.random()*4|0),dl=(d0+round)%4,st=(dl+1)%4;
  const t=shuf([...Array(106).keys()]);
  let ind=-1,O={c:-1,n:-1};
  if(!big){ind=t.splice(t.findIndex(x=>x<104),1)[0];const n0=ind%13+1;O={c:ind/26|0,n:n0===13?1:n0+1}}
  const hands={},disc={},tbl={},opn={};
  for(let i=0;i<4;i++){hands[hk(i)]=t.splice(0,i===st?15:14);disc[dk(i)]=[];tbl['t'+i]=[];opn['s'+i]=0}
  return{seats:ps.map(x=>x.u),names:ps.map(x=>x.n),scores:prev?prev.scores:{},hands,disc,tbl,opn,mx:0,must:-1,d0,dl,ik:[],ex:{s0:0,s1:0,s2:0,s3:0},opm:{s0:'',s1:'',s2:'',s3:''},trn:0,ot:-1,deck:t,ind,okey:O,B:big,round,R:prev?prev.R:R,turn:st,start:st,ph:'discard',win:-1,last:[0,0,0,0],tt:now,gid:now,pair};
}
function canEnd(s,me,rest){
  if(!(s.opn['s'+me]>0)||s.ot===me)return false;
  if((s.opm||{})['s'+me]==='c')return rest.length===0;
  return valid(rest,s.okey);
}
function fin(s,f,okeyEnd){
  B=s.B;const d=[],ex=s.ex||{};
  const solo=f>=0&&s.opn['s'+f]>0&&[0,1,2,3].every(i=>i===f||!(s.opn['s'+i]>0));
  const m=f>=0?(okeyEnd?2:1)*(solo?2:1):1;
  for(let i=0;i<4;i++)d[i]=f>=0&&isMate(s,f,i)?0:m*(f===i?(B?-200:-100):s.opn['s'+i]>0?s.hands[hk(i)].reduce((a,x)=>a+(isJ(x,s.okey)?(B?500:250):val(x,s.okey)*(B?10:5)),0):(B?1000:500));
  const sc={...s.scores};d.forEach((x,i)=>sc['s'+i]=(sc['s'+i]||0)+x);
  return{scores:sc,last:d.map((x,i)=>x+(ex['s'+i]||0)),win:f<0?99:f,ph:'end'};
}
/* hamle çalıştırıcı: istemci de sunucu da buradan geçer.
   s: durum kopyası (değiştirilebilir), me: koltuk, a: hamle bilgisi. Dönen r: duruma birleştirilecek yama. */
const toInt=x=>Number.isInteger(x)?x:(typeof x==='string'&&/^\d+$/.test(x)?+x:-1);
function cleanGroups(gs,h){
  if(!Array.isArray(gs)||gs.length>14)return null;
  const seen=new Set(),out=[];
  for(const g of gs){
    if(!Array.isArray(g)||!g.length||g.length>13)return null;
    const gg=[];
    for(const x0 of g){const x=toInt(x0);if(x<0||x>105||seen.has(x)||!h.includes(x))return null;seen.add(x);gg.push(x)}
    out.push(gg);
  }
  return out;
}
const MOVES={};
MOVES.draw=(s,me,a)=>{
  if(s.ph!=='draw')return;
  if(!s.deck.length)return fin(s,-1);
  s.hands[hk(me)].push(s.deck.pop());
  return{deck:s.deck,hands:{[hk(me)]:s.hands[hk(me)]},ph:'discard',must:-1};
};
MOVES.take=(s,me,a)=>{
  if(s.ph!=='draw')return;
  const pv=(me+3)%4,pile=s.disc[dk(pv)];
  if(!pile.length)return;
  const tid=pile.pop();s.hands[hk(me)].push(tid);
  return{disc:{[dk(pv)]:pile},hands:{[hk(me)]:s.hands[hk(me)]},ph:'discard',must:tid};
};
MOVES.discard=(s,me,a)=>{
  const t=toInt(a.t);
  if(s.ph!=='discard'||t<0)return;
  if(s.must>=0){emsg='Yandan aldığın taşı ortaya açmadan atamazsın.';return}
  const h=s.hands[hk(me)],i=h.indexOf(t);
  if(i<0)return;
  if(s.ot===me&&h.length<2){emsg='Açtığın turda son taşını atamazsın.';return}
  h.splice(i,1);s.disc[dk(me)].push(t);
  /* K: kalan taşların hepsi per (ya da hiç taş kalmadı) ve son taş atılıyorsa el biter; açılmış olmalı, açtığın turda olmaz */
  if(canEnd(s,me,h)){return{hands:{[hk(me)]:h},disc:{[dk(me)]:s.disc[dk(me)]},...fin(s,me,isJ(t,s.okey))}}
  const pen=ishler(s,t,s.okey);
  const r={hands:{[hk(me)]:h},disc:{[dk(me)]:s.disc[dk(me)]},turn:(me+1)%4,ph:'draw',trn:s.trn+1,ot:-1,must:-1,ik:[],tt:Date.now()};
  if(pen){
    r.scores={...s.scores,['s'+me]:(s.scores['s'+me]||0)+500};
    r.ex={...(s.ex||{}),['s'+me]:((s.ex||{})['s'+me]||0)+500};
    emsg='İşler taş attın: 500 ceza yazıldı.';
  }
  return r;
};
MOVES.insert=(s,me,a)=>{
  const o=toInt(a.o),gi=toInt(a.gi),e=String(a.e||''),t0=toInt(a.t);
  if(s.ph!=='discard'||t0<0)return;
  const O=s.okey,t=t0,h=s.hands[hk(me)],i=h.indexOf(t);
  if(i<0)return;
  if(!(s.opn['s'+me]>0)){emsg='Taş işlemek için önce açmalısın.';return}
  if(t===s.must){emsg='Yandan aldığın taşı işleyemezsin, yeni per ya da çift açarak kullanmalısın.';return}
  if(h.length<(s.ot===me?3:2)){emsg=s.ot===me?'Açtığın turda son taşını atamazsın: elinde en az bir taş kalmalı.':'Atacak bir taşın kalmalı, son taşını işleyemezsin.';return}
  const grs=[...(s.tbl['t'+o]||[])],r=grs[gi];
  if(!r||!canAdd(r,t,O).includes(e)){emsg='Bu taş bu pere işlenmiyor.';return}
  const key=o+':'+gi+':'+e,ik=s.ik||[];
  if(ik.includes(key)){emsg='Bu uca bu turda zaten taş işledin. Sıran tekrar gelince işleyebilirsin.';return}
  const v=addVal(r,t,e,O),pen=o===me||isMate(s,o,me)?0:v*10;
  const nr={...r,g:e==='l'?[t,...r.g]:[...r.g,t]};
  if(e==='l')nr.lo=r.lo-1;
  grs[gi]=nr;
  h.splice(i,1);
  const r2={hands:{[hk(me)]:h},tbl:{...s.tbl,['t'+o]:grs},ik:[...ik,key]};
  if(pen){
    r2.scores={...s.scores,['s'+o]:(s.scores['s'+o]||0)+pen};
    r2.ex={...(s.ex||{}),['s'+o]:((s.ex||{})['s'+o]||0)+pen};
    emsg=s.names[o]+' perine işledin: '+s.names[o]+' '+pen+' ceza aldı.';
  }
  return r2;
};
MOVES.swap=(s,me,a)=>{
  const o=toInt(a.o),gi=toInt(a.gi),idx=toInt(a.idx),t0=toInt(a.t);
  if(s.ph!=='discard'||t0<0)return;
  const O=s.okey,t=t0,h=s.hands[hk(me)],ti=h.indexOf(t);
  if(ti<0)return;
  if(!(s.opn['s'+me]>0)){emsg='Okey değiştirmek için önce açmalısın.';return}
  if(t===s.must){emsg='Yandan aldığın taşı değiştirmede kullanamazsın, yeni per ya da çift açarak kullanmalısın.';return}
  const grs=[...(s.tbl['t'+o]||[])],r=grs[gi];
  if(!r||!canSwap(r,idx,t,O)){emsg='Bu taş bu okeyin yerine geçmiyor.';return}
  const jk=r.g[idx],g2=[...r.g];
  g2[idx]=t;grs[gi]={...r,g:g2};
  h.splice(ti,1);h.push(jk);
  const pen=o===me||isMate(s,o,me)?0:tv(t,O).n*10,r2={hands:{[hk(me)]:h},tbl:{...s.tbl,['t'+o]:grs}};
  if(pen){
    r2.scores={...s.scores,['s'+o]:(s.scores['s'+o]||0)+pen};
    r2.ex={...(s.ex||{}),['s'+o]:((s.ex||{})['s'+o]||0)+pen};
    emsg='Okeyi aldın. '+s.names[o]+' '+pen+' ceza aldı.';
  }else emsg='Okeyi aldın.';
  return r2;
};
MOVES.pair=(s,me,a)=>{
  const o=toInt(a.o),gi=toInt(a.gi),sel=Array.isArray(a.ts)?a.ts.map(toInt):[];
  if(s.ph!=='discard'||sel.length!==2||sel[0]<0||sel[1]<0||sel[0]===sel[1])return;
  const O=s.okey,h=s.hands[hk(me)],n=prs(sel,O);
  if(sel.some(x=>h.indexOf(x)<0))return;
  if(!(s.opn['s'+me]>0)){emsg='Çift işlemek için önce açmalısın.';return}
  if(n<0){emsg='Çift için aynı renkten ve aynı sayıdan iki taş seç.';return}
  if(sel.includes(s.must)){emsg='Yandan aldığın taşı işleyemezsin, yeni per ya da çift açarak kullanmalısın.';return}
  if(h.length<(s.ot===me?4:3)){emsg=s.ot===me?'Açtığın turda son taşını atamazsın: elinde en az bir taş kalmalı.':'Atacak bir taşın kalmalı, son taşlarını işleyemezsin.';return}
  const grs=[...(s.tbl['t'+o]||[])],r=grs[gi];
  if(!r||r.k!=='p'||r.n!==n){emsg='Çift işlemek için aynı sayılı açılmış bir çift olmalı.';return}
  grs.push({g:[...sel],k:'p',n});
  const nh=h.filter(x=>!sel.includes(x)),pen=o===me||isMate(s,o,me)?0:n*2*10,r2={hands:{[hk(me)]:nh},tbl:{...s.tbl,['t'+o]:grs}};
  if(pen){
    r2.scores={...s.scores,['s'+o]:(s.scores['s'+o]||0)+pen};
    r2.ex={...(s.ex||{}),['s'+o]:((s.ex||{})['s'+o]||0)+pen};
    emsg=s.names[o]+' çiftine işledin: '+s.names[o]+' '+pen+' ceza aldı.';
  }
  return r2;
};
MOVES.open=(s,me,a)=>{
  if(s.ph!=='discard')return;
  const O=s.okey,opened=s.opn['s'+me]>0;
  const st=cleanGroups(a.groups,s.hands[hk(me)]);
  if(st===null){emsg='Geçersiz açma isteği.';return}
  if(!st.length){emsg='Rafta açılabilecek bir per ya da çift bulunamadı. Taşları yan yana dizip tekrar dene.';return}
  const isC=st.every(g=>g.length===2);
  if(!isC&&st.some(g=>g.length===2)){emsg='Per ve çifti aynı anda açamazsın.';return}
  const flat=st.flat(),h=s.hands[hk(me)].filter(x=>!flat.includes(x));
  if(s.must>=0&&!flat.includes(s.must)){emsg=opened?'Yandan aldığın taşı yeni bir perde ya da çiftte kullanmalısın.':'Yandan aldığın taşı açtığın perlerde kullanmalısın.';return}
  if(h.length<(opened&&s.ot!==me?1:2)){emsg=opened&&s.ot!==me?'Açtıktan sonra atacak bir taşın kalmalı.':'Açtığın turda son taşını atamazsın: açtıktan sonra elinde en az iki taş kalmalı.';return}
  if(st.some(g=>g.length>5)){emsg='Altı ya da daha fazla taşlık per olmaz. Araya boşluk bırakıp ikiye ayır: 6 taş 3+3, 7 taş 3+4.';return}
  if(st.some(g=>g.length===1||(g.length===2?prs(g,O)<0:grp(g,O)<0))){emsg='Bu taşlar geçerli bir per ya da çift değil.';return}
  const recs=st.map(g=>rec(g,O));
  if(opened){
    const om=(s.opm||{})['s'+me];
    if(om==='c'&&!isC){emsg='Çift açtığın elde per açamazsın.';return}
    if(om==='p'&&isC){emsg='Per açtığın elde çift açamazsın.';return}
    
    return{hands:{[hk(me)]:h},tbl:{...s.tbl,['t'+me]:[...(s.tbl['t'+me]||[]),...recs]},must:-1};
  }
  if(s.trn<4){emsg='İlk turda açamazsın, herkes bir kez oynamalı.';return}
  const tot=stTot(st,O),need=s.mx>0?s.mx+1:17;
  if(tot<need){const r=stRem(st,O);emsg=`Açmak için en az ${need} puan gerekiyor, şu an ${tot}${r?' (yandan '+r+')':''}.`;return}
  
  return{hands:{[hk(me)]:h},tbl:{...s.tbl,['t'+me]:recs},opn:{['s'+me]:tot},opm:{...(s.opm||{}),['s'+me]:isC?'c':'p'},mx:tot,ot:me,must:-1};
};
MOVES.finish=(s,me,a)=>{
  const t=toInt(a.t);
  if(s.ph!=='discard'||t<0)return;
  if(!(s.opn['s'+me]>0)){emsg='Eli bitirmek için önce açmış olmalısın.';return}
  if(s.must>=0){emsg='Yandan aldığın taşı ortaya açmadan eli bitiremezsin.';return}
  if(s.ot===me){emsg='Açtığın turda eli bitiremezsin.';return}
  const h=s.hands[hk(me)].filter(x=>x!==t);
  if(h.length!==s.hands[hk(me)].length-1)return;
  if(!canEnd(s,me,h)){emsg=(s.opm||{})['s'+me]==='c'?'Çift açtıysan elinde tek taş kalıp onu atınca el biter.':'Elin henüz bitmiyor: kalan taşların hepsi per olmalı.';return}
  s.hands[hk(me)]=h;s.disc[dk(me)].push(t);
  return{hands:{[hk(me)]:h},disc:{[dk(me)]:s.disc[dk(me)]},...fin(s,me,isJ(t,s.okey))};
};
MOVES.back=(s,me,a)=>{
  if(s.ph!=='discard'||!(s.must>=0))return;
  const h=s.hands[hk(me)],i=h.indexOf(s.must),pv=(me+3)%4;
  if(i<0)return;
  h.splice(i,1);s.disc[dk(pv)].push(s.must);
  return{hands:{[hk(me)]:h},disc:{[dk(pv)]:s.disc[dk(pv)]},ph:'draw',must:-1};
};
function near(id,h,O){
  const a=tv(id,O);let n=0;
  for(const x of h){
    if(x===id||isJ(x,O))continue;
    const b=tv(x,O);
    if(b.n===a.n&&b.c!==a.c)n+=2;
    else if(b.c===a.c&&Math.abs(b.n-a.n)===1)n+=2;
    else if(b.c===a.c&&Math.abs(b.n-a.n)===2)n+=1;
  }
  return n;
}
function openPlan(h,O,need,base=0,cap=30000,keep=1){
  const cnt=[0,1,2,3].map(()=>Array(15).fill(0));let jk=0;
  for(const id of h){if(isJ(id,O))jk++;else{const v=tv(id,O);cnt[v.c][v.n]++}}
  const defs=[];
  for(let n=1;n<=13;n++){
    for(let m=0;m<16;m++){
      const cs=[0,1,2,3].filter(c=>m>>c&1);
      if(cs.length>=3||(cs.length===2&&jk>0))defs.push({s:1,n,cs});
    }
  }
  for(let c=0;c<4;c++)for(let p=1;p<=11;p++)for(let q=p+2;q<=Math.min(13,p+4);q++){
    let v=0;for(let x=p;x<=q;x++)v+=x;
    defs.push({s:0,c,p,q,pts:v});
  }
  let best=null,nodes=0;
  (function go(from,chosen,pts,used,jl){
    if(nodes++>cap)return;
    if(Math.floor((pts+base)/3)>=need&&used<=h.length-keep&&(!best||pts>best.pts))best={pts,chosen:[...chosen]};
    for(let i=from;i<defs.length;i++){
      const d=defs[i];let j=0,u=[],pt=0,sz=0;
      if(d.s){
        if(!d.cs.every(c=>cnt[c][d.n]>0))continue;
        j=d.cs.length>=3?0:1;if(j>jl)continue;
        u=d.cs.map(c=>[c,d.n]);pt=d.n*(d.cs.length+j);sz=d.cs.length+j;
      }else{
        if(!(cnt[d.c][d.p]>0))continue;
        let miss=0;for(let x=d.p+1;x<=d.q;x++)if(!(cnt[d.c][x]>0))miss++;
        if(miss>jl||miss>2)continue;
        for(let x=d.p;x<=d.q;x++)if(cnt[d.c][x]>0)u.push([d.c,x]);
        j=miss;pt=d.pts;sz=d.q-d.p+1;
      }
      u.forEach(([c,x])=>cnt[c][x]--);chosen.push({d,j,u});
      go(i+1,chosen,pts+pt,used+sz,jl-j);
      chosen.pop();u.forEach(([c,x])=>cnt[c][x]++);
    }
  })(0,[],0,0,jk);
  if(!best)return null;
  const left=[...h],groups=[];
  const pick=(c,n)=>{const i=left.findIndex(x=>!isJ(x,O)&&tv(x,O).c===c&&tv(x,O).n===n);return left.splice(i,1)[0]};
  for(const {d,j,u} of best.chosen){
    const g=u.map(([c,x])=>pick(c,x));
    for(let k=0;k<j;k++){const i=left.findIndex(x=>isJ(x,O));g.push(left.splice(i,1)[0])}
    groups.push(g);
  }
  groups.pts=best.pts;
  return groups;
}
let hpKey='',hpVal=0;
function handPts(h,O){
  const k=h.slice().sort((a,b)=>a-b).join(',')+'|'+O.c+'|'+O.n+'|'+(B?1:0);
  if(k!==hpKey){hpKey=k;const p=openPlan(h,O,0);hpVal=p?Math.floor(p.pts/3):0}
  return hpVal;
}
/* ---- bot zekâsı: 0 Saf (eski), 1 Orta, 2 Usta ---- */
const badSide=new Set();
/* eldeki taşlardan en çok kaç taşı per içine alabiliriz (okey dahil) */
function coverCount(h,O){
  const cnt=[0,1,2,3].map(()=>Array(15).fill(0));let jk=0,tot=0;
  for(const id of h){tot++;if(isJ(id,O))jk++;else{const v=tv(id,O);cnt[v.c][v.n]++}}
  const memo=new Map();let nodes=0;
  const go=jk=>{
    let c=-1,n=0;
    outer:for(let a=0;a<4;a++)for(let b=1;b<=13;b++)if(cnt[a][b]>0){c=a;n=b;break outer}
    if(c<0)return Math.min(jk,0);
    const key=cnt.map(r=>r.join('')).join('|')+jk;
    if(memo.has(key))return memo.get(key);
    if(nodes++>12000)return 0;
    let best;
    cnt[c][n]--;best=go(jk);cnt[c][n]++;            /* bu taşı atla */
    const P=[0,1,2,3].filter(x=>x!==c&&cnt[x][n]>0);
    for(let m=0;m<1<<P.length;m++){
      const ch=P.filter((_,i)=>m>>i&1);
      for(const k of [3,4]){
        const j=k-1-ch.length;if(j<0||j>jk)continue;
        cnt[c][n]--;ch.forEach(x=>cnt[x][n]--);
        const r=go(jk-j)+k-j;
        cnt[c][n]++;ch.forEach(x=>cnt[x][n]++);
        if(r>best)best=r;
      }
    }
    for(let p=Math.max(1,n-2);p<=n;p++)for(let q=Math.max(n,p+2);q<=Math.min(p+12,13);q++){
      const used=[];let need=0;
      for(let x=p;x<=q;x++){if(cnt[c][x]>0){cnt[c][x]--;used.push(x)}else need++}
      if(need<=jk&&used.includes(n)){const r=go(jk-need)+used.length;if(r>best)best=r}
      used.forEach(x=>cnt[c][x]++);
    }
    memo.set(key,best);return best;
  };
  return go(jk)+0;
}
function handValue(h,O,need,lvl){
  const pw=need?(lvl>=2?5:.5):.2;
  const cnt=[0,1,2,3].map(()=>Array(15).fill(0));let jk=0;
  for(const id of h){if(isJ(id,O))jk++;else{const v=tv(id,O);cnt[v.c][v.n]++}}
  let v=jk*16;const cov=new Set();
  for(let c=0;c<4;c++){
    let run=[];
    for(let n=1;n<=14;n++){
      if(n<=13&&cnt[c][n]>0)run.push(n);
      else{if(run.length>=3)run.forEach(x=>cov.add(c*20+x));run=[]}
    }
  }
  for(let n=1;n<=13;n++){const cs=[0,1,2,3].filter(c=>cnt[c][n]>0);if(cs.length>=3)cs.forEach(c=>cov.add(c*20+n))}
  cov.forEach(k=>{v+=12+(k%20)*pw});
  for(let c=0;c<4;c++)for(let n=1;n<=13;n++){
    if(!(cnt[c][n]>0)||cov.has(c*20+n))continue;
    v+=n*pw*.3;
    if(cnt[c][n]>1)v+=3;
    if(n<13&&cnt[c][n+1]>0)v+=5;
    if(n<12&&cnt[c][n+2]>0)v+=3;
    for(let d=c+1;d<4;d++)if(cnt[d][n]>0)v+=3;
  }
  return v;
}
function findGroupWith(h,t,O){
  const others=h.filter(x=>x!==t),tt=isJ(t,O)?null:tv(t,O),seen=new Set(),c2=[];let jn=0;
  for(const x of others){
    if(isJ(x,O)){if(jn<2){jn++;c2.push(x)}continue}
    const v=tv(x,O);
    if(tt&&!((v.n===tt.n&&v.c!==tt.c)||(v.c===tt.c&&Math.abs(v.n-tt.n)<=3)))continue;
    const k=v.c+':'+v.n;if(seen.has(k))continue;seen.add(k);c2.push(x);
  }
  let best=null,bv=-1;
  const n=c2.length;
  for(let a=0;a<n;a++)for(let b=a+1;b<n;b++){
    let g=[t,c2[a],c2[b]],gv=grp(g,O);
    if(gv>bv){bv=gv;best=g}
    for(let c=b+1;c<n;c++){
      g=[t,c2[a],c2[b],c2[c]];gv=grp(g,O);if(gv>bv){bv=gv;best=g}
      for(let d=c+1;d<n;d++){g=[t,c2[a],c2[b],c2[c],c2[d]];gv=grp(g,O);if(gv>bv){bv=gv;best=g}}
    }
  }
  return bv>=0?best:null;
}
/* şu an yapılabilecek açma: [{groups,bp,opened}] ya da null */
function openMove(s,me,h,O){
  const opened=s.opn['s'+me]>0,must=s.must;
  if(opened){
    if((s.opm||{})['s'+me]==='c')return null;
    let gs=[],rest=h;
    if(must>=0){const g=findGroupWith(h,must,O);if(!g)return null;gs=[g];rest=h.filter(x=>!g.includes(x))}
    if(rest.length>(must>=0?1:0)){const p=openPlan(rest,O,0,0,6000);if(p)gs=gs.concat(p)}
    if(!gs.length)return null;
    if(gs.flat().length>=h.length)return null;
    return{groups:gs,opened:true};
  }
  if(s.trn<4)return null;
  const need=s.mx>0?s.mx+1:17;
  let gs=null;
  if(must>=0){
    const g=findGroupWith(h,must,O);if(!g)return null;
    const rest=h.filter(x=>!g.includes(x)),p=openPlan(rest,O,need,grp(g,O),20000,2);
    if(!p)return null;gs=[g].concat(p);
  }else gs=openPlan(h,O,need,0,30000,2);
  if(!gs||!gs.length)return null;
  if(gs.flat().length>=h.length-1)return null;
  const bp=Math.floor(gs.reduce((a,g)=>a+grp(g,O),0)/3);
  if(bp<need)return null;
  return{groups:gs,bp,opened:false};
}
function applyOpen(s,me,h,O,m){
  const flat=m.groups.flat(),rest=h.filter(x=>!flat.includes(x)),recs=m.groups.map(g=>rec(g,O));
  if(m.opened)return{hands:{[hk(me)]:rest},tbl:{...s.tbl,['t'+me]:[...(s.tbl['t'+me]||[]),...recs]},must:-1};
  return{hands:{[hk(me)]:rest},tbl:{...s.tbl,['t'+me]:recs},opn:{['s'+me]:m.bp},opm:{...(s.opm||{}),['s'+me]:'p'},mx:m.bp,ot:me,must:-1};
}
function botSwapPlan(s,me,h,O){
  let best=null,bs=-1;
  for(let o=0;o<4;o++){
    const grs=s.tbl['t'+o]||[];
    for(let gi=0;gi<grs.length;gi++){
      const r=grs[gi];if(!r||!r.g)continue;
      for(let idx=0;idx<r.g.length;idx++){
        if(!isJ(r.g[idx],O))continue;
        for(const t of h){
          if(t===s.must||isJ(t,O)||!canSwap(r,idx,t,O))continue;
          const sc=(o===me||isMate(s,o,me)?0:tv(t,O).n*10)+1;
          if(sc>bs){bs=sc;best={o,gi,idx,t}}
        }
      }
    }
  }
  if(!best)return null;
  const{o,gi,idx,t}=best,grs=[...(s.tbl['t'+o]||[])],r=grs[gi],jk=r.g[idx],g2=[...r.g];
  g2[idx]=t;grs[gi]={...r,g:g2};
  const nh=h.filter(x=>x!==t);nh.push(jk);
  const pen=o===me||isMate(s,o,me)?0:tv(t,O).n*10,out={hands:{[hk(me)]:nh},tbl:{...s.tbl,['t'+o]:grs}};
  if(pen){out.scores={...s.scores,['s'+o]:(s.scores['s'+o]||0)+pen};out.ex={...(s.ex||{}),['s'+o]:((s.ex||{})['s'+o]||0)+pen}}
  return out;
}
function botInsertPlan(s,me,h,O,lvl){
  if(h.length<(s.ot===me?3:2))return null;
  const ik=s.ik||[];let best=null,bs=0;
  for(const t of h){
    if(t===s.must||isJ(t,O))continue;
    for(let o=0;o<4;o++){
      const grs=s.tbl['t'+o]||[];
      for(let gi=0;gi<grs.length;gi++){
        const r=grs[gi];if(!r||!r.g)continue;
        for(const e of canAdd(r,t,O)){
          const key=o+':'+gi+':'+e;if(ik.includes(key))continue;
          const mine=o===me||isMate(s,o,me),v=addVal(r,t,e,O),pen=mine?0:v*10;
          let sc=pen+(mine?20:0)+tv(t,O).n*.1;
          if(lvl>=2&&pen<60&&near(t,h,O)>=3)continue;
          if(sc>bs){bs=sc;best={o,gi,e,t,key,pen,v}}
        }
      }
    }
  }
  if(!best)return null;
  const{o,gi,e,t,key,pen}=best,grs=[...(s.tbl['t'+o]||[])],r=grs[gi];
  const nr={...r,g:e==='l'?[t,...r.g]:[...r.g,t]};if(e==='l')nr.lo=r.lo-1;
  grs[gi]=nr;
  const out={hands:{[hk(me)]:h.filter(x=>x!==t)},tbl:{...s.tbl,['t'+o]:grs},ik:[...(s.ik||[]),key]};
  if(pen){out.scores={...s.scores,['s'+o]:(s.scores['s'+o]||0)+pen};out.ex={...(s.ex||{}),['s'+o]:((s.ex||{})['s'+o]||0)+pen}}
  return out;
}
function pickDiscard(s,me,h,O,lvl){
  const dead=new Set(),opened=s.opn['s'+me]>0,need=!opened;
  if(lvl>=2)for(let i=0;i<4;i++)for(const x of s.disc[dk(i)]){if(!isJ(x,O)){const v=tv(x,O);dead.add(v.c+':'+v.n)}}
  let best=h[0],bs=-1e9,b2=null,bs2=-1e9;const seen=new Set();
  for(const t of h){
    const j=isJ(t,O),v=tv(t,O),k=j?'J'+t:v.c+':'+v.n;
    if(seen.has(k))continue;seen.add(k);
    const rest=h.filter(x=>x!==t);
    let sc=handValue(rest,O,need,lvl);
    if(lvl>=2)sc+=coverCount(rest,O)*100;
    if(j)sc-=400;
    if(ishler(s,t,O))sc-=100000;
    if(lvl>=2&&!j&&dead.has(k))sc+=3;
    if(lvl>=2&&opened&&!j)sc+=v.n*.15;
    if(sc>bs){bs2=bs;b2=best;bs=sc;best=t}else if(sc>bs2){bs2=sc;b2=t}
  }
  if(lvl===1&&b2!=null&&Math.random()<.3&&!ishler(s,b2,O))return b2;
  return best;
}
function botPlan0(s,me){
  B=s.B;const O=s.okey,h=s.hands[hk(me)],opened=s.opn['s'+me]>0;
  let r=null;
  if(s.ph==='draw'){
    if(!s.deck.length)return fin(s,-1);
    h.push(s.deck.pop());
    return{deck:s.deck,hands:{[hk(me)]:h},ph:'discard',must:-1};
  }
  if(opened&&s.ot!==me){
    for(const t of h){
      const rest=h.filter(x=>x!==t);
      if(canEnd(s,me,rest)){
        s.hands[hk(me)]=rest;s.disc[dk(me)].push(t);
        return{hands:{[hk(me)]:rest},disc:{[dk(me)]:s.disc[dk(me)]},...fin(s,me,isJ(t,O))};
      }
    }
  }
  if(!opened&&s.trn>=4){
    const need=s.mx>0?s.mx+1:17,plan=openPlan(h,O,need,0,30000,2);
    if(plan){
      const flat=plan.flat(),rest=h.filter(x=>!flat.includes(x));
      const bp=Math.floor(plan.reduce((a,g)=>a+grp(g,O),0)/3);
      return{hands:{[hk(me)]:rest},tbl:{...s.tbl,['t'+me]:plan.map(g=>rec(g,O))},opn:{['s'+me]:bp},opm:{...(s.opm||{}),['s'+me]:'p'},mx:bp,ot:me,must:-1};
    }
  }
  let worst=null,ws=1e9;
  for(const t of h){
    const sc=(isJ(t,O)?1000:near(t,h,O)*10-tv(t,O).n)+(ishler(s,t,O)?5000:0);
    if(sc<ws){ws=sc;worst=t}
  }
  h.splice(h.indexOf(worst),1);s.disc[dk(me)].push(worst);
  r={hands:{[hk(me)]:h},disc:{[dk(me)]:s.disc[dk(me)]},turn:(me+1)%4,ph:'draw',trn:s.trn+1,ot:-1,must:-1,ik:[],tt:Date.now()};
  if(ishler(s,worst,O)){
    r.scores={...s.scores,['s'+me]:(s.scores['s'+me]||0)+500};
    r.ex={...(s.ex||{}),['s'+me]:((s.ex||{})['s'+me]||0)+500};
  }
  return r;
}
function botPlan(s,me,lvl){
  if(!lvl)return botPlan0(s,me);
  B=s.B;const O=s.okey,h=s.hands[hk(me)],opened=s.opn['s'+me]>0,pv=(me+3)%4,sk=s.gid+':'+s.trn+':'+me;
  if(s.ph==='draw'){
    if(!s.deck.length)return fin(s,-1);
    const pile=s.disc[dk(pv)];
    if(pile.length&&!badSide.has(sk)){
      const tid=pile[pile.length-1],h2=[...h,tid];
      if(openMove({...s,must:tid},me,h2,O)){
        pile.pop();h.push(tid);
        return{disc:{[dk(pv)]:pile},hands:{[hk(me)]:h},ph:'discard',must:tid};
      }
    }
    h.push(s.deck.pop());
    return{deck:s.deck,hands:{[hk(me)]:h},ph:'discard',must:-1};
  }
  if(s.must>=0){
    const m=openMove(s,me,h,O);
    if(m)return applyOpen(s,me,h,O,m);
    badSide.add(sk);
    const i=h.indexOf(s.must),pile=s.disc[dk(pv)];
    h.splice(i,1);pile.push(s.must);
    return{hands:{[hk(me)]:h},disc:{[dk(pv)]:pile},ph:'draw',must:-1};
  }
  if(opened&&s.ot!==me){
    for(const t of h){
      const rest=h.filter(x=>x!==t);
      if(canEnd(s,me,rest)){
        s.hands[hk(me)]=rest;s.disc[dk(me)].push(t);
        return{hands:{[hk(me)]:rest},disc:{[dk(me)]:s.disc[dk(me)]},...fin(s,me,isJ(t,O))};
      }
    }
  }
  if(opened){
    const w=lvl>=2?botSwapPlan(s,me,h,O):null;if(w)return w;
    const ins=botInsertPlan(s,me,h,O,lvl);if(ins)return ins;
  }
  const m=openMove(s,me,h,O);
  if(m&&(!opened||lvl>=1))return applyOpen(s,me,h,O,m);
  const t=pickDiscard(s,me,h,O,lvl);
  h.splice(h.indexOf(t),1);s.disc[dk(me)].push(t);
  const r={hands:{[hk(me)]:h},disc:{[dk(me)]:s.disc[dk(me)]},turn:(me+1)%4,ph:'draw',trn:s.trn+1,ot:-1,must:-1,ik:[],tt:Date.now()};
  if(ishler(s,t,O)){
    r.scores={...s.scores,['s'+me]:(s.scores['s'+me]||0)+500};
    r.ex={...(s.ex||{}),['s'+me]:((s.ex||{})['s'+me]||0)+500};
  }
  return r;
}
/* süre dolunca: gerekirse yandan alınan taşı geri koy, desteden çek, en kötü taşı at */
function timeoutMove(s){
  B=s.B;
  if(s.ph==='end')return null;
  const me=s.turn,O=s.okey,h=s.hands[hk(me)],pv=(me+3)%4,r={};
  if(s.ph==='draw'||s.must>=0){
    if(s.must>=0){const i=h.indexOf(s.must);if(i>=0){h.splice(i,1);s.disc[dk(pv)].push(s.must)}r.disc={[dk(pv)]:s.disc[dk(pv)]}}
    if(!s.deck.length)return fin(s,-1);
    h.push(s.deck.pop());r.deck=s.deck;
  }
  const t=pickDiscard(s,me,h,O,2);
  h.splice(h.indexOf(t),1);s.disc[dk(me)].push(t);
  Object.assign(r,{hands:{[hk(me)]:h},disc:{...(r.disc||{}),[dk(me)]:s.disc[dk(me)]},turn:(me+1)%4,ph:'draw',trn:s.trn+1,ot:-1,must:-1,ik:[],tt:Date.now()});
  if(ishler(s,t,O)){
    r.scores={...s.scores,['s'+me]:(s.scores['s'+me]||0)+500};
    r.ex={...(s.ex||{}),['s'+me]:((s.ex||{})['s'+me]||0)+500};
  }
  return r;
}
const SL=24,COLS=12; /* ıstaka: 2 sıra × 12 yuva (v43: taşlar büyüdü) */
function autoOpen(ord,O,must,mode){
  const rows=[];for(let i=0;i<ord.length;i+=COLS)rows.push(ord.slice(i,i+COLS));
  const run=kind=>{
    const groups=[];
    for(const row of rows){
      const n=row.length,dp=[{v:0,g:[]}];
      for(let i=1;i<=n;i++){
        let b=dp[i-1];
        for(const L of (kind==='c'?[2]:[13,12,11,10,9,8,7,6,5,4,3])){
          if(i-L<0)continue;
          const seg=row.slice(i-L,i);
          if(seg.some(x=>x==null))continue;
          const val=kind==='c'?prs(seg,O):grp(seg,O);
          if(val<0)continue;
          const c={v:dp[i-L].v+val+(seg.includes(must)?1000:0),g:[...dp[i-L].g,seg]};
          if(c.v>b.v)b=c;
        }
        dp[i]=b;
      }
      groups.push(...dp[n].g);
    }
    const sum=groups.reduce((a,g)=>a+(kind==='c'?prs(g,O):grp(g,O)),0);
    return {kind,groups,bad:kind!=='c'&&groups.some(g=>g.length>5),pts:kind==='c'?Math.floor(sum*2/3):Math.floor(sum/3),rem:kind==='c'?(sum*2)%3:sum%3};
  };
  if(mode==='p')return run('p');
  if(mode==='c')return run('c');
  const p=run('p'),c=run('c');
  return c.pts>p.pts?c:p;
}

function runMove(name,s,me,a){
  emsg='';B=!!s.B;
  if(!Object.prototype.hasOwnProperty.call(MOVES,name))return{r:null,msg:'Bilinmeyen hamle.'};
  if(me<0||s.turn!==me||s.ph==='end')return{r:null,msg:''};
  let r=null;
  try{r=MOVES[name](s,me,a||{})||null}catch(e){r=null;emsg=emsg||'Hamle yapılamadı.'}
  return{r,msg:emsg};
}
/* bot hamlesi (seviye 0-2); hata olursa basit bota düşer */
function botMove(s,me,lvl){
  B=!!s.B;
  if(s.pair)lvl=2; /* eşli oyunda botlar en zeki seviyede */
  const c=JSON.parse(JSON.stringify(s));
  try{return botPlan(c,me,lvl|0)}catch(e){try{return botPlan0(JSON.parse(JSON.stringify(s)),me)}catch(e2){return null}}
}
/* yamayı duruma uygula (iç içe nesneler birleşir, diziler değişir) */
function mergePatch(a,b){for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k]))mergePatch(a[k],b[k]);else a[k]=b[k]}return a}
/* oyuncuya gösterilecek görünüm: başkalarının eli ve destenin sırası gizli (el bitince eller açılır) */
function viewFor(s,me){
  if(!s)return s;
  const v=JSON.parse(JSON.stringify(s));
  v.deck=Array(s.deck.length).fill(null);
  if(s.ph!=='end')for(let i=0;i<4;i++)if(i!==me)v.hands[hk(i)]=Array(s.hands[hk(i)].length).fill(null);
  return v;
}
/* oyundaki taş sayısı tutuyor mu (hile/hata denetimi) */
function tileCount(s){let n=s.deck.length+(s.ind>=0?1:0);for(let i=0;i<4;i++){n+=s.hands[hk(i)].length+s.disc[dk(i)].length;for(const r of s.tbl['t'+i]||[])n+=r.g.length}return n}
/* uzun süre çalışan sunucuda bellek şişmesin */
function resetCaches(){badSide.clear();hpKey='';hpVal=0}
var ENG={stRem,pairOrder,isMate,resetCaches,run:runMove,deal,botMove,timeoutMove,merge:mergePatch,view:viewFor,tileCount,isBot,fillBots,valid,grp,prs,rec,canAdd,canSwap,autoOpen,fin,canEnd,setB:b=>{B=!!b}};
if(typeof module!=='undefined'&&module.exports)module.exports=ENG;
