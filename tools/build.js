/* src/client/ (iskelet + css + js parçaları) içine motoru ve ağ katmanını gömüp tek dosya üretir:
   dist/index.html  -> hem sunucuda hem claude.ai sayfası olarak aynı dosya çalışır.
   Ayrıca sunucunun dağıttığı simgeleri, paylaşım görselini, manifest ve service worker'ı dist'e kopyalar. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..');
const rd=f=>fs.readFileSync(path.join(root,f),'utf8');
const pkg=JSON.parse(rd('package.json'));
/* arayüz kaynağı src/client/ altında bölümlere ayrılmıştır: shell.html iskelet, css/*.css ve js/*.js dosya adı sırasıyla birleştirilir */
const cat=d=>fs.readdirSync(path.join(root,d)).filter(f=>/\.(css|js)$/.test(f)).sort().map(f=>rd(d+'/'+f)).join('');
let html=rd('src/client/shell.html');
if(!html.includes('<!--@CSS@-->\n')||!html.includes('<!--@JS@-->\n'))throw new Error('shell.html yer tutucuları yok');
html=html.replace('<!--@CSS@-->\n',()=>cat('src/client/css')).replace('<!--@JS@-->\n',()=>cat('src/client/js'));
const eng=rd('src/engine.js').replace(/<\/script/gi,'<\\/script');
const net=rd('src/net.js').replace(/<\/script/gi,'<\\/script');
const wm=rd('src/wordmark.js').replace(/<\/script/gi,'<\\/script');
if(!html.includes('/*@ENGINE@*/')||!html.includes('/*@NET@*/'))throw new Error('arayüz yer tutucuları yok');
html=html.replace('/*@ENGINE@*/',()=>eng).replace('/*@NET@*/',()=>net).replace('/*@WM@*/',()=>wm);
/* sürüm: içerikten türetilir, sunucu bunu yeni bağlanan sayfaya söyler; eski sayfa kendini yeniler */
const kurSrc=rd('src/kurallar.html');
const build=pkg.version+'-'+crypto.createHash('sha1').update(html+kurSrc).digest('hex').slice(0,8);
html=html.replace("'/*@BUILD@*/'",JSON.stringify(build));
/* sekme simgesi: her ortamda (sunucu, claude.ai sayfası) görünsün diye sayfanın içine gömülür */
const FAV='<link rel="icon" type="image/png" sizes="32x32" href="data:image/png;base64,'+fs.readFileSync(path.join(root,'src/assets/favicon-32.png')).toString('base64')+'">';
html=html.replace('<!--@HEAD@-->',()=>FAV+'\n<!--@HEAD@-->');
const out=path.join(root,'dist');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'index.html'),html);
fs.writeFileSync(path.join(out,'build.txt'),build);
for(const f of ['sw.js','manifest.webmanifest'])if(fs.existsSync(path.join(root,'src',f)))fs.copyFileSync(path.join(root,'src',f),path.join(out,f));
const kur=kurSrc.replace('/*@WM@*/',()=>wm).replace('<!--@HEAD@-->',()=>FAV+'\n<!--@HEAD@-->');
fs.writeFileSync(path.join(out,'kurallar.html'),kur);
/* kurallar oyunun içinde de açılır: sayfa index.html'e gömülür (script içinde </ kaçırılır) */
html=html.replace("'/*@RULES@*/'",()=>JSON.stringify(kur.replace('<!--@HEAD@-->','')).replace(/<\//g,'<\\/'));
fs.writeFileSync(path.join(out,'index.html'),html);
for(const f of fs.readdirSync(path.join(root,'src/assets')))if(/\.(png|jpg|ico)$/.test(f))fs.copyFileSync(path.join(root,'src/assets',f),path.join(out,f));
console.log('dist/index.html',Math.round(html.length/1024)+' KB · sürüm',build);
