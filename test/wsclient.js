/* testler için küçük WebSocket istemcisi (sunucunun protokolü) */
const WebSocket=require('ws');
function client(url,token){
  return new Promise((resolve,reject)=>{
    const ws=new WebSocket(url,{headers:{origin:url.replace(/^ws/,'http').replace(/\/ws$/,'')}});
    let seq=0;const pend=new Map(),subs=new Map();
    ws.on('message',d=>{const m=JSON.parse(d);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}else if(m.sid&&subs.has(m.sid))subs.get(m.sid)(m.snap)});
    const call=o=>new Promise(r=>{const id=++seq;pend.set(id,r);ws.send(JSON.stringify({...o,id}))});
    ws.on('open',async()=>{
      const h=await call({op:'hello',token,now:Date.now()});
      if(!h.ok)return reject(new Error('hello'));
      let sid=0;
      resolve({ws,uid:h.uid,token:h.token,call,
        sub(kind,path,cb){const s='s'+(++sid);subs.set(s,cb);ws.send(JSON.stringify({op:'sub',sid:s,kind,path}));return s},
        raw(o){ws.send(JSON.stringify(o))},
        close(){ws.close()}});
    });
    ws.on('error',reject);
  });
}
module.exports={client};
