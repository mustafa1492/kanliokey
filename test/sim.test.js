/* botlar birbirine karşı çok sayıda el oynar: kilitlenme, taş kaybı, geçersiz durum aranır.
   kullanım: node test/sim.test.js [el sayısı] */
const E=require('../src/engine.js');
const N=+process.argv[2]||300;
let fails=0,ended=0,nowin=0,steps=0,wins=0,okeyEnd=0;
const t0=Date.now();
for(let g=0;g<N;g++){
  const lv=[g%3,(g+1)%3,2,1];
  let S=E.deal(g%2?{round:g%4,d0:g%4,R:9,scores:{}}:null,9,[0,1,2,3].map(i=>({u:'bot'+i,n:'B'+i})));
  let k=0,err='';
  while(S.ph!=='end'&&k<3000){
    const me=S.turn,r=E.botMove(S,me,lv[me]);
    if(!r){err='boş hamle';break}
    const n=JSON.parse(JSON.stringify(S));E.merge(n,JSON.parse(JSON.stringify(r)));
    if(E.tileCount(n)!==106){err='taş sayısı '+E.tileCount(n);break}
    for(let i=0;i<4;i++){const h=n.hands['h'+i];if(new Set(h).size!==h.length){err='aynı taş iki kez';break}}
    if(err)break;
    for(let i=0;i<4;i++)for(const gr of n.tbl['t'+i]){if(gr.k==='q'&&gr.g.length<3){err='kısa per';break}}
    S=n;k++;
  }
  if(err||S.ph!=='end'){fails++;if(fails<5)console.log('HATA el',g,err||'bitmedi',k);continue}
  ended++;steps+=k;if(S.win===99)nowin++;else wins++;
}
console.log(`${N} el · biten ${ended} · kazanan çıkan ${wins} · deste biten ${nowin} · ortalama ${Math.round(steps/Math.max(1,ended))} hamle · ${((Date.now()-t0)/1000).toFixed(1)} sn`);
console.log(fails?'FAILED '+fails:'ALL PASSED');
process.exit(fails?1:0);
