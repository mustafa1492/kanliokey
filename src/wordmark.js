/* Kanlı Okey yazısı (Mustafa'nın seçtiği A1): KANLI harflerinin içi ıslak, parlak kan; harf ayaklarından
   damlalar akar, uzun damlalar fildişi OKEY'in üstünden süzülür; arada bir damla kopup düşer.
   KW.html('stack') : alt alta büyük yazı (ana ekran, kurallar sayfası)
   KW.html('line')  : tek satır küçük yazı (üst çubuk), hareketsiz
   Harf ayaklarının yeri yazı tipi yüklendikten sonra ölçülür, sonuç saklanır (her çizimde yeniden ölçülmez). */
const KW=(()=>{
  const FONT="Oswald,'Arial Narrow','Inter Display',Impact,sans-serif",FS=150,W8=700;
  const DEFS=`<svg width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true" focusable="false"><defs>
<linearGradient id="kwbl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a80d17"/><stop offset=".5" stop-color="#8a0811"/><stop offset="1" stop-color="#5c030a"/></linearGradient>
<linearGradient id="kwbl2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3313a"/><stop offset=".55" stop-color="#c0141e"/><stop offset="1" stop-color="#7d0a12"/></linearGradient>
<filter id="kwwetS" x="-5%" y="-20%" width="110%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="b"/><feSpecularLighting in="b" surfaceScale="5" specularConstant="1.2" specularExponent="30" lighting-color="#fff" result="s"><fePointLight x="120" y="-120" z="190"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in" result="si"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="si"/></feMerge></filter>
<linearGradient id="kwgl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".22" stop-color="#fff" stop-opacity=".1"/><stop offset=".34" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="kwiv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eee2c6"/><stop offset=".55" stop-color="#e2d3b0"/><stop offset="1" stop-color="#cdb98f"/></linearGradient>
<radialGradient id="kwdr" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d42630"/><stop offset=".6" stop-color="#8f0a13"/><stop offset="1" stop-color="#5c030a"/></radialGradient>
<filter id="kwwet" x="-5%" y="-20%" width="110%" height="160%" color-interpolation-filters="sRGB">
 <feTurbulence type="fractalNoise" baseFrequency="0.045 0.006" numOctaves="2" seed="3" result="n"/>
 <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="b"/>
 <feComposite in="b" in2="n" operator="arithmetic" k1="0" k2="1" k3=".22" k4="0" result="h"/>
 <feSpecularLighting in="h" surfaceScale="6" specularConstant="1.5" specularExponent="38" lighting-color="#fff" result="s"><fePointLight x="120" y="-120" z="190"/></feSpecularLighting>
 <feComposite in="s" in2="SourceAlpha" operator="in" result="si"/>
 <feColorMatrix in="n" type="matrix" values="0 0 0 0 .1  0 0 0 0 0  0 0 0 0 .01  -1.6 0 0 0 .8" result="dk"/>
 <feComposite in="dk" in2="SourceAlpha" operator="in" result="dki"/>
 <feMorphology in="SourceAlpha" operator="erode" radius="1.4" result="er"/><feComposite in="SourceAlpha" in2="er" operator="out" result="edge"/>
 <feFlood flood-color="#2a0004" flood-opacity=".9"/><feComposite in2="edge" operator="in" result="edg"/>
 <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="dki"/><feMergeNode in="edg"/><feMergeNode in="si"/></feMerge>
</filter>
<filter id="kwivf" x="-5%" y="-5%" width="110%" height="115%" color-interpolation-filters="sRGB">
 <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8" result="g"/>
 <feColorMatrix in="g" type="matrix" values="0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .15  0 0 0 .10 0" result="gr"/>
 <feComposite in="gr" in2="SourceAlpha" operator="in" result="gri"/>
 <feMorphology in="SourceAlpha" operator="erode" radius="2" result="er"/><feGaussianBlur in="er" stdDeviation="2" result="eb"/>
 <feComposite in="SourceAlpha" in2="eb" operator="out" result="rim"/><feFlood flood-color="#6b5434" flood-opacity=".45"/><feComposite in2="rim" operator="in" result="rimc"/>
 <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="gri"/><feMergeNode in="rimc"/></feMerge>
</filter>
<filter id="kwsh" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity=".75"/></filter>
</defs></svg>`;
  /* harf ayakları: harf kutusunun genişliğine göre göreli yerler (kalın, dik yazı tiplerinde tutar) */
  const FEET={K:[.15,.86],A:[.12,.88],N:[.15,.85],L:[.17,.62],I:[.5]};
  const rnd=s=>{const x=Math.sin(s*12.9898)*43758.5453;return x-Math.floor(x)};
  const f1=x=>Math.round(x*10)/10;
  const drip=(x,y,w,L)=>{const b=w*.62;return `M${f1(x-w*.95)} ${f1(y-3)} C${f1(x-w*.7)} ${f1(y+5)} ${f1(x-w*.42)} ${f1(y+L*.3)} ${f1(x-w*.36)} ${f1(y+L)} A${f1(b)} ${f1(b*1.2)} 0 1 0 ${f1(x+w*.36)} ${f1(y+L)} C${f1(x+w*.42)} ${f1(y+L*.3)} ${f1(x+w*.7)} ${f1(y+5)} ${f1(x+w*.95)} ${f1(y-3)}Z`};
  const T=(x,y,txt,fill,extra)=>`<text x="${x}" y="${y}" font-family="${FONT}" font-weight="${W8}" font-size="${FS}" letter-spacing="-1" fill="${fill}" ${extra||''}>${txt}</text>`;
  const cache={};let defsOn=false,pending=null;const subs=[];
  function defs(){if(defsOn||typeof document==='undefined'||!document.body)return;try{document.body.insertAdjacentHTML('afterbegin',DEFS);defsOn=true}catch(e){}}
  function measure(){
    const tmp=document.createElement('div');
    tmp.style.cssText='position:absolute;left:-9999px;top:0;width:900px;height:400px;visibility:hidden;pointer-events:none';
    tmp.innerHTML=`<svg viewBox="0 0 900 400" width="900" height="400">${T(10,130,'KANLI','#000')}${T(10,285,'OKEY','#000')}</svg>`;
    document.body.appendChild(tmp);
    const [tk,to]=tmp.querySelectorAll('text'),ek=[],eo=[];
    for(let i=0;i<5;i++){const e=tk.getExtentOfChar(i);ek.push({x:e.x,w:e.width})}
    for(let i=0;i<4;i++){const e=to.getExtentOfChar(i);eo.push({x:e.x,w:e.width})}
    const wk=tk.getComputedTextLength(),wo=to.getComputedTextLength();
    tmp.remove();
    return{ek,eo,wk,wo};
  }
  function feet(ek,y,seed,maxL,skip){
    let k=0,out=[];
    ek.forEach((e,i)=>{for(const fx of (FEET['KANLI'[i]]||[])){k++;if(rnd(seed+k)<(skip||.25))continue;
      const x=e.x+e.w*fx+(rnd(seed+k*3)-.5)*e.w*.05,w=e.w*.08+rnd(seed+k*7)*e.w*.05,L=8+Math.pow(rnd(seed+k*5),1.6)*maxL;out.push({x,y,w,L})}});
    return out;
  }
  function build(){
    const M=measure();
    /* alt alta: KANLI üstte, uzun damlalar OKEY'in önünden akar */
    {
      const short=feet(M.ek,128,1,40),W=Math.ceil(Math.max(M.wk,M.wo)+24);
      const long=[[1,.13,150],[2,.88,120],[3,.5,95]].map(([i,fx,L])=>{const e=M.ek[i];return{x:e.x+e.w*fx,y:128,w:e.w*.1,L}});
      const falls=long.slice(0,2).map((d,k)=>`<circle class="kwfall" cx="${f1(d.x)}" cy="${f1(d.y+d.L+d.w*.7)}" r="${f1(d.w*.55)}" fill="url(#kwdr)" style="animation-delay:${k?-3.6:-.8}s"/>`).join('');
      cache.stack=`<svg class="kw kw-stack %C" viewBox="0 0 ${W} 330" role="img" aria-label="Kanlı Okey"><g filter="url(#kwsh)"><g filter="url(#kwwet)" fill="url(#kwbl)">${T(10,130,'KANLI','url(#kwbl)')}${short.map(d=>`<path d="${drip(d.x,d.y,d.w,d.L)}"/>`).join('')}</g>${T(10,130,'KANLI','url(#kwgl)')}</g>`+
        `<g filter="url(#kwsh)">${T(10,285,'OKEY','url(#kwiv)','filter="url(#kwivf)"')}</g><g filter="url(#kwwet)" fill="url(#kwbl)">${long.map(d=>`<path d="${drip(d.x,d.y,d.w,d.L)}"/>`).join('')}</g><g class="kwfx">${falls}</g></svg>`;
    }
    /* tek satır: KANLI OKEY yan yana, kısa damlalar */
    {
      const gap=FS*.22,ox=10+M.wk+gap,W=Math.ceil(ox+M.wo+16);
      const short=feet(M.ek,128,4,34,.35);
      cache.line=`<svg class="kw kw-line %C" viewBox="0 0 ${W} 185" role="img" aria-label="Kanlı Okey"><g filter="url(#kwsh)"><g filter="url(#kwwetS)" fill="url(#kwbl2)">${T(10,130,'KANLI','url(#kwbl2)')}${short.map(d=>`<path d="${drip(d.x,d.y,d.w,d.L)}"/>`).join('')}</g>${T(10,130,'KANLI','url(#kwgl)')}${T(f1(ox),130,'OKEY','url(#kwiv)','filter="url(#kwivf)"')}</g></svg>`;
    }
    subs.forEach(f=>{try{f()}catch(e){}});
  }
  function start(){
    if(pending||typeof document==='undefined')return;
    defs();
    const go=()=>{try{build()}catch(e){}};
    pending=(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(go);
    /* Oswald sonradan yüklenirse yeniden ölç */
    if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',()=>{for(const k in cache)delete cache[k];go()});
  }
  /* ölçüm bitmeden: düz yazı (aynı yerleşim), sonra kanlı haline geçer */
  const plain=(kind,cls)=>kind==='stack'?`<svg class="kw kw-stack ${cls||''}" viewBox="0 0 620 330" role="img" aria-label="Kanlı Okey">${T(10,130,'KANLI','#a80d17')}${T(10,285,'OKEY','#e2d3b0')}</svg>`
    :`<svg class="kw kw-line ${cls||''}" viewBox="0 0 760 185" role="img" aria-label="Kanlı Okey">${T(10,130,'KANLI','#a80d17')}${T(370,130,'OKEY','#e2d3b0')}</svg>`;
  return{
    html(kind,cls){start();defs();return cache[kind]?cache[kind].replace('%C',cls||''):plain(kind,cls)},
    ready(f){subs.push(f);if(cache.line)f();start()},
    get done(){return !!cache.line}
  };
})();
