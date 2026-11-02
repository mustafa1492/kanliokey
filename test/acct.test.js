/* v64: hesaplar (kayıt, giriş, şifre özeti), profil istatistikleri (tekli/eşli, tecrübe puanı, seviye), GM ve yönetici işlemleri */
const os = require('os'),
  fs = require('fs'),
  path = require('path');
process.env.DATA_FILE = path.join(os.tmpdir(), 'ko-acct-' + process.pid + '.json');
process.env.ADMIN_PASSWORD = 'p';
process.env.QUIET = '1';
const { client } = require('./wsclient.js');
let fails = 0;
const ok = (c, m) => {
  console.log((c ? 'ok  ' : 'FAIL') + ' ' + m);
  if (!c) fails++;
};
(async () => {
  const S = require('../server/server.js');
  await new Promise(r => S.server.listen(0, r));
  const url = 'ws://127.0.0.1:' + S.server.address().port + '/ws';
  const A = await client(url),
    B = await client(url),
    adm = await client(url);
  await adm.call({ op: 'admin', pw: 'p' });
  ok(!(await A.call({ op: 'register', user: 'ab', pw: '1234' })).ok, 'kısa kullanıcı adı reddedildi');
  ok(!(await A.call({ op: 'register', user: 'Mustafa', pw: '12' })).ok, 'kısa şifre reddedildi');
  let r = await A.call({ op: 'register', user: 'Mustafa', pw: 'gizli123' });
  ok(r.ok && r.profile.user === 'Mustafa' && r.profile.ad === 'Çaycı', 'hesap açıldı, seviye Çaycı');
  ok(!(await B.call({ op: 'register', user: 'mustafa', pw: 'baska1' })).ok, 'aynı ad (büyük/küçük harf farkı) alınamaz');
  ok(!(await A.call({ op: 'register', user: 'Mustafa2', pw: 'gizli123' })).ok, 'bir cihaza ikinci hesap açılmaz');
  const raw = JSON.stringify([...S.store]);
  ok(!raw.includes('gizli123'), 'şifre düz metin olarak saklanmıyor');
  ok(!(await B.call({ op: 'get', path: 'acct/mustafa' })).snap?.exists, 'hesap kaydı dışarıdan okunamaz');
  ok(!(await B.call({ op: 'login', user: 'Mustafa', pw: 'yanlis' })).ok, 'yanlış şifreyle giriş olmaz');
  r = await B.call({ op: 'login', user: 'MUSTAFA', pw: 'gizli123' });
  ok(r.ok && r.token, 'doğru şifreyle giriş (büyük harfle yazılsa da)');
  const B2 = await client(url, r.token);
  ok(B2.uid === A.uid, 'giriş yapan cihaz hesabın kimliğine geçti');
  /* istatistik: tekli oyun sonu (Mustafa birinci), eşli oyun sonu (kazandı), okeyle bitirme */
  const g1 = { seats: [A.uid, 'bot1', 'bot2', 'bot3'], names: ['M', 'b', 'b', 'b'], scores: { s0: 100, s1: 400, s2: 900, s3: 300 }, round: 8, R: 9, win: 0, wm: 1, pair: false };
  S.store.set('rooms/TST99', { bl: 2 });
  S._t.recordStats('TST99', g1);
  let p = S._t.profileOf(A.uid);
  ok(p.tekli.o === 1 && p.tekli.w === 1 && p.tekli.l === 0, 'tekli: oynanan 1, galibiyet 1');
  ok(p.tp === 45, 'tecrübe: bitirilen 10 + birinci 30 + okeyle bitirme 5 = 45 (Zor botlarla tam): ' + p.tp);
  const g2 = { ...g1, scores: { s0: 900, s1: 100, s2: 200, s3: 300 }, win: 1, wm: 0 };
  S.store.set('rooms/TST98', { bl: 0 });
  S._t.recordStats('TST98', g2);
  p = S._t.profileOf(A.uid);
  ok(p.tekli.o === 2 && p.tekli.l === 1, 'tekli: sonuncu olunca mağlubiyet');
  ok(p.tp === 48, 'Kolay botlarla tecrübe %30: 45 + 10×0.3 = 48: ' + p.tp);
  const g3 = { ...g1, pair: true, scores: { s0: 100, s1: 500, s2: 100, s3: 500 }, win: 0, wm: 0 };
  S._t.recordStats('TST99', g3);
  p = S._t.profileOf(A.uid);
  ok(p.esli.o === 1 && p.esli.w === 1 && p.esli.pct === 100, 'eşli: kazanılan oyun ayrı sayılır');
  /* profil görme: başkasının profilini sadece yönetici ya da GM görür */
  ok(!(await B.call({ op: 'profile', user: 'Mustafa' })).ok, 'misafir başkasının profilini göremez');
  r = await adm.call({ op: 'profile', user: 'Mustafa' });
  ok(r.ok && r.profile.esli.o === 1, 'yönetici profili görür');
  r = await adm.call({ op: 'acctAdmin', k: 'gm', user: 'mustafa', on: true });
  ok(r.ok && S._t.profileOf(A.uid).gm, 'yönetici Mustafa\'yı GM yaptı');
  await B.call({ op: 'register', user: 'Bora', pw: 'bora123' });
  ok((await A.call({ op: 'profile', user: 'Bora' })).ok, 'GM başkasının profilini görür');
  r = await adm.call({ op: 'acctAdmin', k: 'reset', user: 'Bora', pw: 'yeni999' });
  ok(r.ok && (await adm.call({ op: 'login', user: 'Bora', pw: 'yeni999' })).ok, 'yönetici şifre sıfırladı');
  r = await adm.call({ op: 'acctAdmin', k: 'list' });
  ok(r.ok && r.list.length === 2 && r.list[0].n === 'Mustafa', 'hesap listesi (kayıt sırasına göre): ' + JSON.stringify(r.list && r.list.map(x => x.n)));
  /* GM yetkileri (A = Mustafa, GM). Masa: Bora + 3 bot */
  await adm.call({ op: 'set', path: 'settings/main', data: { bot: 2, ms: 300, tm: 0 } });
  const C = 'GMT23',
    gp = 'rooms/' + C + '/game/main';
  await B.call({ op: 'set', path: 'rooms/' + C, data: { hostName: 'Bora' } });
  await B.call({ op: 'set', path: 'rooms/' + C + '/members/' + B.uid, data: { name: 'Bora' } });
  await B.call({ op: 'update', path: 'rooms/' + C, data: { bots: 3 } });
  ok((await B.call({ op: 'start', code: C })).ok, 'Bora botlarla oyunu başlattı');
  let gv = (await A.call({ op: 'get', path: gp })).snap;
  ok(gv.exists && gv.data.hands['h' + gv.data.seats.indexOf(B.uid)].every(x => x === null), 'GM masayı görür ama elleri gizli');
  ok((await A.call({ op: 'list', path: 'rooms' })).ok, 'GM masaları listeler');
  ok(!(await B.call({ op: 'adminAct', code: C, a: 'pause' })).ok, 'GM olmayan masayı duraklatamaz');
  ok((await A.call({ op: 'adminList', k: 'log', code: C })).ok, 'GM hamle kaydını görür');
  ok(!(await A.call({ op: 'adminList', k: 'reports' })).ok, 'GM bildirimleri göremez (yönetici işi)');
  ok((await A.call({ op: 'adminAct', code: C, a: 'pause' })).ok, 'GM masayı duraklattı');
  const bs = gv.data.seats.indexOf(B.uid);
  const gp1 = (await adm.call({ op: 'get', path: gp })).snap.data;
  if (gp1.turn === bs) {
    const rr = await B.call({ op: 'act', code: C, name: gp1.ph === 'draw' ? 'draw' : 'discard', args: {} });
    ok(!rr.ok && /duraklat/.test(rr.msg || ''), 'duraklatılmış masada hamle yapılamaz');
  }
  await new Promise(r => setTimeout(r, 900));
  const gp2 = (await adm.call({ op: 'get', path: gp })).snap.data;
  ok(gp2.paused && gp2.trn === gp1.trn, 'duraklatınca botlar da durdu');
  ok((await A.call({ op: 'adminAct', code: C, a: 'resume' })).ok, 'GM devam ettirdi');
  ok((await A.call({ op: 'set', path: 'settings/main', data: { ann: 'GM duyurusu', bot: 0 } })).ok, 'GM duyuru yazdı');
  const cfg = (await B.call({ op: 'get', path: 'settings/main' })).snap.data;
  ok(cfg.ann === 'GM duyurusu' && cfg.bot === 2, 'GM sadece duyuruyu değiştirebildi (bot ayarı aynı)');
  ok(!(await B.call({ op: 'set', path: 'settings/main', data: { ann: 'x' } })).ok, 'GM olmayan duyuru yazamaz');
  await B.call({ op: 'set', path: 'rooms/' + C + '/members/' + B.uid, data: { name: 'Bora', gf: { k: 8, to: 0 } } });
  let mb = (await adm.call({ op: 'get', path: 'rooms/' + C + '/members/' + B.uid })).snap.data;
  ok(!mb.gf || mb.gf.k !== 8, 'GM\'e özel hediyeyi başkası gönderemez');
  ok(gv.data.gms && gv.data.gms.every(x => x === 0), 'masada GM yoksa GM işareti yok');
  for (const c of [A, B, B2, adm]) c.close();
  S.stop();
  try {
    fs.unlinkSync(process.env.DATA_FILE);
  } catch (e) {}
  console.log(fails ? 'FAILED ' + fails : 'ALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
