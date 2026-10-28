/* src/client.html içine motoru ve ağ katmanını gömüp tek dosya üretir:
   dist/index.html  -> hem sunucuda hem claude.ai sayfası olarak aynı dosya çalışır */
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const rd=f=>fs.readFileSync(path.join(root,f),'utf8');
let html=rd('src/client.html');
const eng=rd('src/engine.js').replace(/<\/script/gi,'<\\/script');
const net=rd('src/net.js').replace(/<\/script/gi,'<\\/script');
if(!html.includes('/*@ENGINE@*/')||!html.includes('/*@NET@*/'))throw new Error('client.html yer tutucuları yok');
html=html.replace('/*@ENGINE@*/',()=>eng).replace('/*@NET@*/',()=>net);
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/index.html'),html);
if(fs.existsSync(path.join(root,'src/kurallar.html')))fs.copyFileSync(path.join(root,'src/kurallar.html'),path.join(root,'dist/kurallar.html'));
console.log('dist/index.html',Math.round(html.length/1024)+' KB');
