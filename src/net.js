/* Sunucu bağlantısı
   Oyun claude.ai dışında (kendi sunucumuzda) açılınca bu katmanla sunucuya bağlanır.
   db arayüzü claude.ai'dekiyle aynıdır: doc(yol).get/set/update/delete/onSnapshot, collection(yol).get/onSnapshot.
   Oyun hamleleri ayrıca SRV.call({op:'act',...}) ile gider; sunucu kuralları kendisi uygular. */
async function connectServer(){
  const TK='ko_tok';
  const ls={get(k){try{return localStorage.getItem(k)||''}catch(e){return ''}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  const url=(location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws';
  let ws=null,seq=0,live=false,uid=null,tries=0,closedByUs=false;
  const pend=new Map(),subs=new Map(),queue=[];
  let sidSeq=0,firstHello=null;
  const banner=on=>{try{document.body.classList.toggle('offline',on)}catch(e){}};
  function raw(o){if(ws&&ws.readyState===1){ws.send(JSON.stringify(o));return true}return false}
  function call(o){
    return new Promise((res,rej)=>{
      const id=++seq;o.id=id;
      const t=setTimeout(()=>{pend.delete(id);rej({code:'timeout'})},12000);
      pend.set(id,{res,rej,t});
      if(!live||!raw(o))queue.push(o);
    });
  }
  function onMsg(ev){
    let m;try{m=JSON.parse(ev.data)}catch(e){return}
    if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);clearTimeout(p.t);p.res(m);return}
    if(m.sid&&subs.has(m.sid)){const s=subs.get(m.sid);try{s.cb(m.snap)}catch(e){}}
    if(m.op==='bye'){closedByUs=true;try{ws.close()}catch(e){}}
  }
  function open(){
    return new Promise(resolve=>{
      try{ws=new WebSocket(url)}catch(e){resolve(false);return}
      ws.onmessage=onMsg;
      ws.onopen=()=>{
        const id=++seq;
        pend.set(id,{res:m=>{
          if(!m.ok){resolve(false);return}
          uid=m.uid;ls.set(TK,m.token);live=true;tries=0;banner(false);
          for(const [sid,s] of subs)raw({op:'sub',sid,kind:s.kind,path:s.path});
          while(queue.length)raw(queue.shift());
          resolve(true);
        },rej:()=>resolve(false),t:setTimeout(()=>resolve(false),12000)});
        ws.send(JSON.stringify({id,op:'hello',token:ls.get(TK),now:Date.now()}));
      };
      ws.onclose=()=>{
        live=false;banner(true);
        if(closedByUs)return;
        const wait=Math.min(8000,500*Math.pow(2,tries++));
        setTimeout(()=>open(),wait);
        resolve(false);
      };
      ws.onerror=()=>{};
    });
  }
  const snapDoc=(path,s)=>({id:path.split('/').pop(),exists:!!(s&&s.exists),data:()=>s&&s.exists?s.data:undefined});
  const snapCol=s=>{const docs=((s&&s.docs)||[]).map(d=>({id:d.id,exists:true,data:()=>d.data}));return{docs,size:docs.length,empty:!docs.length}};
  const must=async o=>{const r=await call(o);if(!r.ok)throw{code:r.err||'denied',message:r.msg||''};return r};
  function sub(kind,path,cb){
    const sid='s'+(++sidSeq);subs.set(sid,{kind,path,cb});
    if(live)raw({op:'sub',sid,kind,path});
    return()=>{subs.delete(sid);if(live)raw({op:'unsub',sid})};
  }
  const db={
    doc(path){return{
      id:path.split('/').pop(),path,
      get:async()=>snapDoc(path,(await must({op:'get',path})).snap),
      set:async d=>{await must({op:'set',path,data:d})},
      update:async d=>{await must({op:'update',path,data:d})},
      delete:async()=>{await must({op:'delete',path})},
      onSnapshot(n,err){return sub('doc',path,s=>n(snapDoc(path,s)))}
    }},
    collection(path){return{
      get:async()=>snapCol((await must({op:'list',path})).snap),
      onSnapshot(n,err){return sub('col',path,s=>n(snapCol(s)))}
    }}
  };
  firstHello=await open();
  /* ilk bağlantı olmadıysa kapanınca kendisi yeniden dener; biraz bekle */
  for(let w=0;!uid&&w<10000;w+=250)await new Promise(r=>setTimeout(r,250));
  if(!uid)return null;
  return{db,get uid(){return uid},call,get live(){return live}};
}
