/* kalıcı kayıt (Supabase) testi: sahte bir Supabase ile sunucu durumu yazılır, disk silinir, yeni sunucu durumu geri yükler */
const http = require('http'),
  os = require('os'),
  fs = require('fs'),
  path = require('path'),
  { spawn } = require('child_process');
let fails = 0;
const ok = (c, m) => {
  console.log((c ? 'ok  ' : 'FAIL') + ' ' + m);
  if (!c) fails++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { client } = require('./wsclient.js');
const TOK = 'test-anahtar';
let saved = null,
  saves = 0,
  denied = 0;
/* sahte Supabase: /rest/v1/rpc/ko_load ve ko_save, yanlış anahtarı reddeder */
const fake = http.createServer((req, res) => {
  let b = '';
  req.on('data', d => (b += d));
  req.on('end', () => {
    const j = JSON.parse(b || '{}');
    if (j.tok !== TOK) {
      denied++;
      res.writeHead(403);
      return res.end('{"message":"denied"}');
    }
    if (req.url.endsWith('/ko_save')) {
      saved = j.data;
      saves++;
      res.writeHead(204);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(saved));
  });
});
function boot(port, data) {
  const p = spawn(process.execPath, [path.join(__dirname, '../server/server.js')], {
    env: { ...process.env, PORT: String(port), DATA_FILE: data, ADMIN_PASSWORD: 'p', KO_DB_TOKEN: TOK, SUPABASE_URL: 'http://127.0.0.1:' + fake.address().port, QUIET: '' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let out = '';
  p.stdout.on('data', d => (out += d));
  p.stderr.on('data', d => (out += d));
  p.out = () => out;
  return p;
}
const waitFor = async (f, ms) => {
  for (let t = 0; t < ms; t += 100) {
    if (f()) return true;
    await sleep(100);
  }
  return false;
};
(async () => {
  await new Promise(r => fake.listen(0, r));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ko-remote-'));
  const port = 20000 + (process.pid % 20000);
  let S = boot(port, path.join(dir, 'a.json'));
  ok(await waitFor(() => /çalışıyor/.test(S.out()), 8000), 'sunucu Supabase ile açıldı');
  const A = await client('ws://127.0.0.1:' + port + '/ws');
  const C = 'KAL23';
  ok((await A.call({ op: 'set', path: 'rooms/' + C, data: { code: C, host: A.uid, hostName: 'Ali', R: 9, bots: 0, st: 'lobby' } })).ok, 'oda kuruldu');
  A.close();
  /* kapanışta (SIGTERM) son durum Supabase'e yazılır */
  S.kill('SIGTERM');
  await waitFor(() => S.exitCode !== null, 8000);
  ok(saves > 0 && saved && saved.store.some(([k]) => k === 'rooms/' + C), 'kapanışta durum Supabase\'e yazıldı');
  /* disk silindi (yeni dosya yolu): yeni sunucu durumu Supabase'den alır */
  S = boot(port, path.join(dir, 'b.json'));
  ok(await waitFor(() => /çalışıyor/.test(S.out()), 8000), 'yeni sunucu açıldı');
  ok(/Supabase'den yüklendi/.test(S.out()), 'durum Supabase\'den yüklendi');
  const B = await client('ws://127.0.0.1:' + port + '/ws');
  const g = await B.call({ op: 'get', path: 'rooms/' + C });
  ok(g.ok && g.snap && g.snap.data && g.snap.data.hostName === 'Ali', 'oda geri geldi');
  B.close();
  S.kill('SIGTERM');
  await waitFor(() => S.exitCode !== null, 8000);
  ok(denied === 0, 'doğru anahtar kullanıldı');
  fake.close();
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(fails ? 'FAILED ' + fails : 'ALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
