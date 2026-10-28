/* Kanlı Okey service worker: sayfa önce ağdan istenir; ağ 3,5 saniyede cevap vermezse (sunucu uyuyorsa)
   kayıtlı kopya açılır, ağdan gelen yeni sürüm arkada kaydedilir. Oyun bağlantısı (/ws) dokunulmaz. */
const C='ko-1';
const PRE=['/','/kurallar','/manifest.webmanifest','/icon-192.png','/icon-512.png','/apple-touch-icon.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(PRE)).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==C)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==location.origin)return;
  if(u.pathname==='/ws'||u.pathname==='/health'||u.pathname==='/sw.js')return;
  if(r.mode==='navigate'){e.respondWith(page(r,u.pathname.startsWith('/kurallar')?'/kurallar':'/'));return}
  if(/\.(png|jpg|webmanifest)$/.test(u.pathname))e.respondWith(caches.match(r).then(x=>x||fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res})));
});
async function page(r,key){
  const c=await caches.open(C);
  const net=fetch(r).then(res=>{if(res&&res.ok)c.put(key,res.clone());return res});
  const slow=new Promise(ok=>setTimeout(ok,3500,null));
  try{
    const res=await Promise.race([net,slow]);
    if(res)return res;
    const hit=await c.match(key);
    return hit||await net;
  }catch(e){const hit=await c.match(key);if(hit)return hit;throw e}
}
