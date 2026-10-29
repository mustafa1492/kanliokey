(()=>{
const store={},ls=new Map();
const subs=[];
const parent=p=>p.split('/').slice(0,-1).join('/');
const notify=()=>subs.forEach(f=>f());
const mkSnap=(p)=>({id:p.split('/').pop(),exists:p in store,data:()=>p in store?JSON.parse(JSON.stringify(store[p])):undefined});
const doc=p=>({id:p.split('/').pop(),path:p,
 get:async()=>mkSnap(p),
 set:async d=>{store[p]=JSON.parse(JSON.stringify(d));notify()},
 update:async d=>{const mg=(a,b)=>{for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object'&&!Array.isArray(a[k]))mg(a[k],b[k]);else a[k]=b[k]}return a};store[p]=mg(store[p]||{},JSON.parse(JSON.stringify(d)));notify()},
 delete:async()=>{delete store[p];notify()},
 onSnapshot(n){const f=()=>n(mkSnap(p));subs.push(f);setTimeout(f,0);return()=>{const i=subs.indexOf(f);if(i>=0)subs.splice(i,1)}}});
const colSnap=p=>{const docs=Object.keys(store).filter(k=>parent(k)===p).map(k=>mkSnap(k));return{docs,size:docs.length,empty:!docs.length}};
const col=p=>({get:async()=>colSnap(p),onSnapshot(n){const f=()=>n(colSnap(p));subs.push(f);setTimeout(f,0);return()=>{const i=subs.indexOf(f);if(i>=0)subs.splice(i,1)}}});
window.__store=store;
window.claude={use:async n=>n==='db'?{doc,collection:col}:n==='user'?{id:async()=>'u1',isOwner:async()=>true}:null};
})();
