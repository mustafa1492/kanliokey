/* v63: arka arkaya süresi dolan oyuncunun yerine bot geçer, oyuncu dönünce koltuğunu geri alır; kendi hamlesi sayacı sıfırlar */
const os = require('os'),
  fs = require('fs'),
  path = require('path');
process.env.DATA_FILE = path.join(os.tmpdir(), 'ko-miss-' + process.pid + '.json');
process.env.ADMIN_PASSWORD = 'p';
process.env.QUIET = '1';
const { client } = require('./wsclient.js');
let fails = 0;
const ok = (c, m) => {
  console.log((c ? 'ok  ' : 'FAIL') + ' ' + m);
  if (!c) fails++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const S = require('../server/server.js');
  await new Promise(r => S.server.listen(0, r));
  const url = 'ws://127.0.0.1:' + S.server.address().port + '/ws';
  const adm = await client(url);
  await adm.call({ op: 'admin', pw: 'p' });
  /* bot hızlı, oyuncu süresi 1 sn, 2 kez kaçırınca bot geçer */
  await adm.call({ op: 'set', path: 'settings/main', data: { bot: 0, ms: 300, tm: 1, mt: 2 } });
  const A = await client(url),
    C = 'MIS23',
    gp = 'rooms/' + C + '/game/main';
  await A.call({ op: 'set', path: 'rooms/' + C, data: { hostName: 'Ali' } });
  await A.call({ op: 'set', path: 'rooms/' + C + '/members/' + A.uid, data: { name: 'Ali' } });
  await A.call({ op: 'update', path: 'rooms/' + C, data: { bots: 3 } });
  ok((await A.call({ op: 'start', code: C })).ok, 'oyun başladı (Ali + 3 bot)');
  const get = async () => (await adm.call({ op: 'get', path: gp })).snap.data;
  let g = await get();
  const me = g.seats.indexOf(A.uid);
  ok(me >= 0, 'Ali masada');
  /* Ali hiç oynamaz: iki kez süre dolar */
  let replaced = false;
  for (let t = 0; t < 120 && !replaced; t++) {
    await sleep(100);
    g = await get();
    replaced = g.seats[me] !== A.uid;
  }
  ok(replaced && /^bot/.test(g.seats[me]) && g.names[me] === 'Ali (bot)', '2 kez süresi dolunca yerine bot geçti: ' + g.names[me]);
  ok(g.away && g.away['s' + me] && g.away['s' + me].u === A.uid, 'Ali\'nin koltuğu saklandı');
  const lg = await adm.call({ op: 'adminList', k: 'log', code: C });
  ok(lg.ok && JSON.stringify(lg).includes('süreyi kaçırdı'), 'hamle kaydına yazıldı');
  /* Ali döner: oyunu dinlemeye başlayınca koltuğunu geri alır */
  A.close();
  await sleep(100);
  const A2 = await client(url, A.token);
  ok(A2.uid === A.uid, 'Ali aynı kimlikle bağlandı');
  A2.sub('doc', gp, () => {});
  await sleep(300);
  g = await get();
  ok(g.seats[me] === A.uid && g.names[me] === 'Ali' && !(g.away && g.away['s' + me]), 'Ali döndü, koltuğunu geri aldı');
  /* tekrar kaçırınca yine bot geçer; uygulamaya geri dönünce (vis) koltuğunu alır */
  replaced = false;
  for (let t = 0; t < 120 && !replaced; t++) {
    await sleep(100);
    g = await get();
    replaced = g.seats[me] !== A.uid;
  }
  ok(replaced, 'yine 2 kez kaçırınca bot geçti');
  await A2.call({ op: 'vis', hidden: false });
  await sleep(100);
  g = await get();
  ok(g.seats[me] === A.uid, 'uygulamaya dönünce koltuğunu geri aldı');
  for (const c of [A, A2, adm]) c.close();
  await sleep(100);
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
