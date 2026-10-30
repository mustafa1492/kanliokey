async function admAct(a) {
  if (!isAdmin) return;
  if (admC !== a && (a.startsWith('del:') || a === 'old' || a === 'all' || a === 'legacy')) {
    admC = a;
    render();
    return;
  }
  admC = '';
  try {
    if (a.startsWith('del:')) {
      await wipeRoom(a.slice(4));
      admMsg = 'Oda silindi.';
    } else if (a === 'old' || a === 'all') {
      const lim = a === 'old' ? Date.now() - 864e5 : Infinity;
      let n = 0;
      for (const r of admRooms) {
        if ((r.t || 0) < lim) {
          await wipeRoom(r.id);
          n++;
        }
      }
      admMsg = n + ' oda silindi.';
    } else if (a === 'legacy') {
      const l = await db.collection('lobby').get();
      for (const d of l.docs) await db.doc('lobby/' + d.id).delete();
      try {
        await db.doc('games/main').delete();
      } catch (e) {}
      admMsg = 'Eski kayıtlar temizlendi.';
    }
  } catch (e) {
    admMsg = 'Hata: ' + (e.code || '');
  }
  render();
}
let admRid = '',
  admG = null,
  admRm = null,
  admStats = {},
  admU = null,
  admP = null,
  admR = null,
  admLog = null,
  admPlAll = false,
  admSnap = false,
  admLogAt = 0;
async function admLoad() {
  if (!SRV || !isAdmin) return;
  try {
    const a = await SRV.call({ op: 'adminList', k: 'players' });
    if (a && a.ok) admP = a;
  } catch (e) {}
  try {
    const b = await SRV.call({ op: 'adminList', k: 'reports' });
    if (b && b.ok) admR = b.list || [];
  } catch (e) {}
  render();
}
async function admLoadLog() {
  if (!SRV || !isAdmin || admSnap) return;
  admLogAt = Date.now();
  try {
    const r = await SRV.call({ op: 'adminList', k: 'log', code: admRid });
    if (r && r.ok) {
      admLog = r.list || [];
      render();
    }
  } catch (e) {}
}
async function admRep(a) {
  const [k, id] = a.split(':');
  if (k === 'snap') {
    let r = null;
    try {
      r = await SRV.call({ op: 'adminList', k: 'repSnap', rid: id });
    } catch (e) {}
    if (r && r.ok && r.snap) {
      const rp = (admR || []).find(x => x.id === id) || {};
      unsubAll();
      view = 'admroom';
      admSnap = true;
      admRid = rp.c || '?';
      admG = r.snap;
      admRm = null;
      admLog = (rp.log || []).map(x => ({ x, t: rp.t }));
      admMsg = 'Bildirim anındaki durum';
      render();
    }
    return;
  }
  if (k === 'del' && admC !== 'rep:' + id) {
    admC = 'rep:' + id;
    render();
    return;
  }
  admC = '';
  try {
    await SRV.call({ op: 'adminList', k: k === 'del' ? 'repDel' : 'repSeen', rid: id });
  } catch (e) {}
  await admLoad();
}
const cfgSave = () =>
  db
    .doc('settings/main')
    .set({
      bot: CFG.bot,
      ms: CFG.ms,
      ann: CFG.ann,
      tm: CFG.tm,
      pub: !!CFG.pub,
      chat: !!CFG.chat,
      mk: !!CFG.mk,
      bk: !!CFG.bk
    });
async function setCfg(p) {
  CFG = { ...CFG, ...p };
  try {
    await cfgSave();
    admMsg = 'Kaydedildi.';
  } catch (e) {
    admMsg = 'Kaydedilemedi: ' + (e.code || '');
  }
  render();
}
let cfgU = null,
  cfgJ = '';
function watchCfg() {
  try {
    if (cfgU) cfgU();
    cfgU = db.doc('settings/main').onSnapshot(
      s => {
        const d = s.exists ? s.data() : {},
          n = {
            bot: d.bot != null ? +d.bot : 2,
            ms: +d.ms || 1100,
            ann: String(d.ann || ''),
            tm: d.tm != null ? +d.tm : 45,
            pub: d.pub !== false,
            chat: d.chat !== false,
            mk: d.mk !== false,
            bk: d.bk === true
          },
          j = JSON.stringify(n);
        if (j === cfgJ) return;
        cfgJ = j;
        CFG = n;
        render();
      },
      () => {}
    );
  } catch (e) {}
}
async function statBump(ks) {
  if (SRV) return;
  try {
    const r = db.doc('settings/stats'),
      s = await r.get(),
      d = s.exists ? s.data() : {};
    ks.forEach(k => (d[k] = (d[k] || 0) + 1));
    await r.set(d);
  } catch (e) {}
}
async function statHist(en) {
  if (SRV) return;
  try {
    const r = db.doc('settings/stats'),
      s = await r.get(),
      d = s.exists ? s.data() : {};
    d.hist = [en, ...(d.hist || [])].slice(0, 30);
    d.done = (d.done || 0) + 1;
    await r.set(d);
  } catch (e) {}
}
let endRec = 0;
function recEnd() {
  if (!S || S.ph !== 'end' || S.round + 1 < S.R || endRec === S.gid || S.seats.find(x => !isBot(x)) !== uid) return;
  endRec = S.gid;
  statHist({
    t: Date.now(),
    p: S.seats.map((u, i) => ({ n: S.names[i], s: S.scores['s' + i] || 0, b: isBot(u) ? 1 : 0 }))
  });
}
async function openAdmin() {
  if (!isAdmin) return;
  unsubAll();
  view = 'admin';
  admRooms = [];
  admC = '';
  admMsg = '';
  code = '';
  S = null;
  ROOM = null;
  admStats = {};
  unsubs.push(
    db.collection('rooms').onSnapshot(
      s => {
        admRooms = s.docs.map(x => ({ id: x.id, ...x.data() }));
        render();
      },
      () => {}
    )
  );
  unsubs.push(
    db.doc('settings/stats').onSnapshot(
      s => {
        admStats = s.exists ? s.data() : {};
        render();
      },
      () => {}
    )
  );
  admSnap = false;
  admLoad();
  render();
}
function watchRoom(id) {
  if (!isAdmin) return;
  unsubAll();
  view = 'admroom';
  admRid = id;
  admG = null;
  admRm = null;
  admC = '';
  admMsg = '';
  admSnap = false;
  admLog = null;
  unsubs.push(
    db.doc('rooms/' + id + '/game/main').onSnapshot(
      s => {
        admG = s.exists ? s.data() : null;
        if (SRV && Date.now() - admLogAt > 1500) admLoadLog();
        render();
      },
      () => {}
    )
  );
  unsubs.push(
    db.doc('rooms/' + id).onSnapshot(
      s => {
        admRm = s.exists ? s.data() : null;
        render();
      },
      () => {}
    )
  );
  render();
}
async function admRoomAct(a) {
  if (!isAdmin || !admG) return;
  if (SRV) {
    try {
      const res = await SRV.call({ op: 'adminAct', code: admRid, a });
      admMsg = (res && res.msg) || '';
    } catch (e) {
      admMsg = 'Bağlantı hatası.';
    }
    render();
    return;
  }
  const g = admG,
    GD = db.doc('rooms/' + admRid + '/game/main');
  try {
    if (a === 'skip') {
      if (g.ph === 'end') {
        admMsg = 'El bitmiş.';
        render();
        return;
      }
      const me = g.turn,
        h = [...g.hands['h' + me]],
        d = [...g.disc['d' + me]],
        r = { turn: (me + 1) % 4, ph: 'draw', must: -1, ik: [], ot: -1, trn: g.trn + 1, tt: Date.now() };
      if (g.ph === 'discard' && h.length > 1) {
        d.push(h.pop());
        r.hands = { ['h' + me]: h };
        r.disc = { ['d' + me]: d };
      }
      await GD.update(r);
      admMsg = g.names[me] + ' için sıra atlatıldı.';
    } else if (a.startsWith('bot:')) {
      const i = +a.slice(4);
      if (isBot(g.seats[i])) {
        admMsg = 'Zaten bot.';
        render();
        return;
      }
      if (g.seats.filter((u, k) => k !== i && !isBot(u)).length < 1) {
        admMsg = 'En az bir gerçek oyuncu kalmalı (botları o oynatır).';
        render();
        return;
      }
      const seats = [...g.seats],
        names = [...g.names];
      seats[i] = 'bot' + (10 + i);
      names[i] = names[i] + ' (bot)';
      await GD.update({ seats, names });
      admMsg = g.names[i] + ' botla değiştirildi.';
    }
  } catch (e) {
    admMsg = 'Hata: ' + (e.code || '');
  }
  render();
}
const mt = (id, O) => {
  const v = tv(id, O),
    j = isJ(id, O);
  return `<div class="t c${v.c} ${j ? 'ok' : ''} ${id >= 104 ? 'st' : ''}">${id >= 104 ? '★' : v.n}${j ? '<i></i>' : ''}</div>`;
};
function admRoomH() {
  const back = '<div class="row"><button id="admlist">Geri</button></div>';
  if (!admG) {
    return `<div class="panel"><h2>Oda ${esc(admRid)}</h2><p class="mut" style="margin:0 0 10px">${admRm ? (admRm.st === 'playing' ? 'Oyun kaydı yok.' : 'Oyun başlamadı, bekleme odası.') : 'Oda yok.'}${admRm && admRm.pl ? ' Oyuncular: ' + esc(admRm.pl.join(', ')) : ''}</p>${back}</div>`;
  }
  const g = admG,
    O = g.okey;
  B = g.B;
  const rows = [0, 1, 2, 3]
    .map(i => {
      const bot = isBot(g.seats[i]),
        pts = g.scores['s' + i] || 0;
      return `<div class="wr ${g.turn === i && g.ph !== 'end' ? 'turn' : ''}"><div class="wh"><b>${esc(g.names[i])}</b>${g.turn === i && g.ph !== 'end' ? '<span class="tag">Sıra</span>' : ''}<small class="mut">${bot ? 'bot · ' : ''}ceza ${pts} · açtı ${g.opn['s' + i] || 0} · ${g.hands['h' + i].length} taş</small>${bot || admSnap ? '' : `<button data-wa="bot:${i}">Botla değiştir</button>`}</div><div class="mini">${g.hands[
        'h' + i
      ]
        .slice()
        .sort((a, b) => a - b)
        .map(x => mt(x, O))
        .join('')}</div></div>`;
    })
    .join('');
  return `<div class="panel"><h2>Oda ${esc(admRid)}</h2><p class="mut" style="margin:0 0 10px">El ${g.round + 1}/${g.R} · ${g.B ? 'büyük el' : 'normal el'} · deste ${g.deck.length} · ${g.ph === 'end' ? 'bitti' : g.ph === 'draw' ? 'çekme' : 'atma'}${g.ph !== 'end' && O.c >= 0 ? '' : ''}</p>${rows}
${admSnap ? '' : '<div class="row" style="margin-top:12px"><button data-wa="skip">Sırayı atlat</button></div>'}${admMsg ? `<div class="note">${esc(admMsg)}</div>` : ''}</div>${SRV ? admLogH() : ''}${back}`;
}
const agoT = t => {
  const m = Math.max(0, Math.round((Date.now() - (t || 0)) / 60000));
  return m < 1 ? 'şimdi' : m < 60 ? m + ' dk' : m < 1440 ? Math.round(m / 60) + ' sa' : Math.round(m / 1440) + ' gün';
};
function admLogH() {
  if (!admLog) return `<div class="panel"><h2>Hamle kaydı</h2><p class="mut" style="margin:0">Yükleniyor…</p></div>`;
  const L = admLog.slice().reverse().slice(0, 150);
  return `<div class="panel"><h2>Hamle kaydı <small class="mut">(${admLog.length})</small></h2>${admSnap ? '' : '<div class="row" style="margin:0 0 8px"><button id="admlog">Yenile</button></div>'}<div class="alog">${L.length ? L.map(e => `<div class="alr ${/^—/.test(e.x) ? 'hd' : ''}"><small>${e.h ? 'E' + e.h + ' · ' : ''}${agoT(e.t)}${e.w && e.w !== 'deal' ? ' · ' + esc(e.w) : ''}</small><span>${esc(e.x)}</span></div>`).join('') : '<p class="mut" style="margin:0">Kayıt yok.</p>'}</div></div>`;
}
function admRepH() {
  if (!SRV) return '';
  if (!admR) return '<div class="panel"><h2>Bildirimler</h2><p class="mut" style="margin:0">Yükleniyor…</p></div>';
  const KN = { hata: 'Hata', kural: 'Kural yanlış', fikir: 'Öneri' },
    nw = admR.filter(r => !r.ok).length;
  return `<div class="panel"><h2>Bildirimler ${nw ? `<span class="tag">${nw} yeni</span>` : ''}</h2>${
    admR.length
      ? admR
          .slice(0, 40)
          .map(
            r =>
              `<div class="rep1 ${r.ok ? 'seen' : ''}"><div class="rph"><span class="rk ${r.k}">${KN[r.k] || r.k}</span><b>${esc(r.n || '?')}</b><small class="mut">${agoT(r.t)} önce${r.c ? ' · oda ' + esc(r.c) : ''}${r.g ? ' · el ' + r.g.h + '/' + r.g.R + ' · tur ' + r.g.trn : ''}</small></div><p>${esc(r.x)}</p>${r.log && r.log.length ? `<details><summary>Son hamleler</summary>${r.log.map(x => `<div class="alr"><span>${esc(x)}</span></div>`).join('')}</details>` : ''}<small class="mut rua">${esc(r.v || '')} · ${esc((r.ua || '').slice(0, 90))}</small><div class="row">${r.hasSnap ? `<button data-rep="snap:${r.id}">Durumu gör</button>` : ''}${r.ok ? '' : `<button data-rep="seen:${r.id}">Okundu</button>`}<button class="${admC === 'rep:' + r.id ? 'danger' : ''}" data-rep="del:${r.id}">${admC === 'rep:' + r.id ? 'Emin misin? Sil' : 'Sil'}</button></div></div>`
          )
          .join('')
      : '<p class="mut" style="margin:0">Bildirim yok.</p>'
  }</div>`;
}
function admPlH() {
  if (!SRV) return '';
  if (!admP) return '';
  const L = admP.list || [],
    sh = admPlAll ? L : L.slice(0, 15);
  return `<div class="panel"><h2>Oyuncular</h2><div class="res"><div><span>Kayıtlı</span><b>${admP.total || 0}</b></div><div><span>Şu an bağlı</span><b>${admP.online || 0}</b></div></div><div class="plist">${sh.map(p => `<div class="plr"><span class="pdot ${p.on ? 'on' : ''}" aria-label="${p.on ? 'bağlı' : 'bağlı değil'}"></span><b>${esc(p.n)}</b><small class="mut">${p.on ? 'bağlı' : agoT(p.ls) + ' önce'}${p.now && p.now.length ? ' · masada: ' + p.now.map(esc).join(', ') : p.c && p.c.length ? ' · son oda: ' + esc(p.c[0]) : ''}</small></div>`).join('')}</div>${L.length > 15 ? `<div class="row" style="margin-top:8px"><button id="admpl">${admPlAll ? 'Daha az göster' : 'Hepsini göster (' + L.length + ')'}</button></div>` : ''}</div>`;
}
let admTab = 'genel';
function adminH() {
  const now = Date.now(),
    rs = [...admRooms].sort((a, b) => (b.t || 0) - (a.t || 0));
  const age = t => {
    const m = Math.max(0, Math.round((now - t) / 60000));
    return m < 60 ? m + ' dk' : m < 1440 ? Math.round(m / 60) + ' sa' : Math.round(m / 1440) + ' gün';
  };
  const cb = (k, l) =>
    `<button class="${admC === k ? 'danger' : ''}" data-adm="${k}">${admC === k ? 'Emin misin? Evet' : l}</button>`;
  const seg = (items, cur, key) =>
    `<div class="seg">${items.map(([l, v]) => `<button class="${cur === v ? 'p' : ''}" data-cfg="${key}:${v}" aria-pressed="${cur === v}">${l}</button>`).join('')}</div>`;
  const tog = (key, l, d) =>
    `<div class="ftog"><div><b>${l}</b><small class="mut">${d}</small></div><button class="sw ${CFG[key] ? 'on' : ''}" data-cfg="${key}:${CFG[key] ? 0 : 1}" role="switch" aria-checked="${!!CFG[key]}" aria-label="${l}"><i></i></button></div>`;
  const pl = rs.filter(r => r.st === 'playing').length,
    st = admStats || {},
    hist = st.hist || [];
  const cnt = {};
  hist.forEach(e => {
    const top = Math.max(...e.p.map(x => x.s));
    e.p.forEach(x => {
      if (!x.b && x.s === top && top > 0) cnt[x.n] = (cnt[x.n] || 0) + 1;
    });
  });
  const worst = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
  const hl = hist
    .slice(0, 8)
    .map(e => {
      const top = Math.max(...e.p.map(x => x.s));
      return `<div class="hr2"><small class="mut">${age(e.t)} önce</small>${e.p.map(x => `<span class="${x.s === top ? 'lose' : ''}">${esc(x.n)} <b>${x.s}</b></span>`).join('')}</div>`;
    })
    .join('');
  const nRep = (admR || []).filter(r => !r.ok).length,
    nOn = admP ? admP.online || 0 : 0;
  const TABS = [
    ['genel', 'Odalar', rs.length],
    ['bildirim', 'Bildirimler', nRep],
    ['oyuncu', 'Oyuncular', nOn],
    ['bakim', 'Bakım', CFG.bk ? 1 : 0],
    ['ozellik', 'Özellikler', 0],
    ['ayar', 'Bot ve süre', 0],
    ['duyuru', 'Duyuru', CFG.ann ? 1 : 0],
    ['istat', 'İstatistik', 0]
  ];
  if (!TABS.some(t => t[0] === admTab)) admTab = 'genel';
  const tabs = `<nav class="atabs" role="tablist" aria-label="Yönetim bölümleri">${TABS.map(([k, l, n]) => `<button role="tab" class="${admTab === k ? 'on' : ''}" data-at="${k}" aria-selected="${admTab === k}">${l}${n ? `<i class="${k === 'bildirim' ? '' : 'n'}">${n}</i>` : ''}</button>`).join('')}</nav>`;
  let body = '';
  if (admTab === 'genel')
    body = `<div class="panel"><div class="res"><div><span>Toplam oda</span><b>${rs.length}</b></div><div><span>Oyunda</span><b>${pl}</b></div><div><span>Bekleyen</span><b>${rs.length - pl}</b></div></div></div>
<div class="panel"><h2>Odalar</h2>${rs.length ? rs.map(r => `<div class="ar"><div><b>${esc(r.id)}</b> · ${r.st === 'playing' ? 'oyunda' + (r.rd != null ? ' · el ' + (r.rd + 1) + '/' + r.R : '') : 'bekliyor'}<small class="mut">Kuran: ${esc(r.hostName || '?')} · ${age(r.t || now)} önce${r.pl ? ' · ' + esc(r.pl.join(', ')) : ''}${r.pub ? ' · herkese açık' : ''}${r.bl != null ? ' · bot ' + BLN[r.bl] : ''}</small></div><div class="row"><button data-watch="${esc(r.id)}">İzle</button>${cb('del:' + r.id, 'Sil')}</div></div>`).join('') : '<p class="mut" style="margin:0">Hiç oda yok.</p>'}
<div class="row" style="margin-top:12px">${cb('old', '24 saatten eskileri sil')}${cb('all', 'Hepsini sil')}${cb('legacy', 'Eski kayıtları temizle')}</div></div>`;
  else if (admTab === 'bildirim')
    body = SRV
      ? admRepH()
      : '<div class="panel"><p class="mut" style="margin:0">Bildirimler sadece sunucudaki oyunda var.</p></div>';
  else if (admTab === 'oyuncu')
    body = SRV
      ? admPlH() || '<div class="panel"><p class="mut" style="margin:0">Yükleniyor…</p></div>'
      : '<div class="panel"><p class="mut" style="margin:0">Oyuncu listesi sadece sunucudaki oyunda var.</p></div>';
  else if (admTab === 'bakim') {
    const live = rs.filter(r => r.st === 'playing'),
      ready = !live.length;
    body = `<div class="panel"><h2>Bakım modu</h2><p class="mut" style="margin:0 0 6px;font-size:13px">Güncellemeden (GitHub'a yüklemeden) önce aç. Açıkken kimse yeni masa kuramaz ve yeni oyun başlatamaz, herkese "güncelleme var" duyurusu çıkar. Süren oyunlar sonuna kadar oynanır. Hepsi bitince yükle; Render deploy süren oyunları siler.</p>
${tog('bk', 'Bakım modu', 'Yeni masa ve yeni oyun kapalı, herkese duyuru.')}
<div class="res" style="margin-top:10px"><div><span>Süren oyun</span><b>${live.length}</b></div><div><span>Bekleyen oda</span><b>${rs.length - live.length}</b></div></div>
${CFG.bk ? (ready ? '<div class="note" style="margin-top:10px">✓ Süren oyun yok: güncellemeye hazır. Yükledikten sonra bakım modunu kapatmayı unutma.</div>' : `<div class="note" style="margin-top:10px">${live.length} oyun sürüyor, bitmesini bekle: ${live.map(r => esc(r.id) + (r.rd != null ? ' (el ' + (r.rd + 1) + '/' + r.R + ')' : '')).join(', ')}</div>`) : ''}</div>`;
  } else if (admTab === 'ozellik')
    body = `<div class="panel"><h2>Özellikler</h2><p class="mut" style="margin:0 0 6px;font-size:13px">Oyuna eklenenleri buradan açıp kapatırsın. Değişiklik herkeste hemen geçerli olur.</p>
${tog('pub', 'Herkese açık masalar', 'Ana ekrandaki "Masa seç" listesi ve yabancıların bot yerine oturması.')}
${tog('chat', 'Sohbet', 'Masada yazılı sohbet. Kapalıyken hazır tepkiler yine çalışır.')}
${tog('mk', 'Yeni masa kurma', 'Kapatırsan kimse yeni masa kuramaz (güncellemeden önce bakım için). Süren oyunlar devam eder.')}</div>`;
  else if (admTab === 'ayar')
    body = `<div class="panel"><h2>Bot ayarları</h2><small class="mut">Varsayılan seviye (masa kuran kendi masası için ayrıca seçebilir)</small>${seg(
      [
        ['Kolay', 0],
        ['Orta', 1],
        ['Zor', 2]
      ],
      CFG.bot,
      'bot'
    )}<small class="mut" style="display:block;margin-top:10px">Hız (bekleme)</small>${seg(
      [
        ['Hızlı', 500],
        ['Normal', 1100],
        ['Yavaş', 1800]
      ],
      CFG.ms,
      'ms'
    )}<small class="mut" style="display:block;margin-top:10px">Oyuncu süresi (sıra başına)</small>${seg(
      [
        ['Kapalı', 0],
        ['30 sn', 30],
        ['45 sn', 45],
        ['60 sn', 60],
        ['90 sn', 90]
      ],
      CFG.tm,
      'tm'
    )}<p class="mut" style="margin:10px 0 0;font-size:13px">Süre dolunca oyuncu için taş otomatik çekilir ve atılır. Kolay: basit oynar. Orta: yandan taş alır, işler, ara sıra hata yapar. Zor: okey değiştirir, atışları hesaplar.</p></div>`;
  else if (admTab === 'duyuru')
    body = `<div class="panel"><h2>Duyuru</h2><div class="row"><input id="an" maxlength="140" placeholder="Herkesin göreceği kısa mesaj" value="${esc(CFG.ann)}" aria-label="Duyuru" style="flex:1;min-width:0"><button class="p" id="anset">Yayınla</button></div>${CFG.ann ? '<div class="row" style="margin-top:8px"><button id="anclr">Duyuruyu kaldır</button></div>' : ''}<div class="row" style="margin-top:10px"><button data-ann="Birazdan güncelleme var, oyunlar sıfırlanacak. Elinizi bitirin.">Hazır: güncelleme uyarısı</button></div></div>`;
  else if (admTab === 'istat')
    body = `<div class="panel"><h2>İstatistik</h2><div class="res"><div><span>Kurulan oda</span><b>${st.rooms || 0}</b></div><div><span>Başlayan oyun</span><b>${st.games || 0}</b></div><div><span>Biten oyun</span><b>${st.done || 0}</b></div><div><span>Oynanan el</span><b>${st.rounds || 0}</b></div></div>
${worst ? `<p style="margin:10px 0 0">En çok sonuncu olan: <b>${esc(worst[0])}</b> (${worst[1]} oyun)</p>` : ''}${hl ? `<div class="hist">${hl}</div>` : '<p class="mut" style="margin:10px 0 0">Biten oyun kaydı yok.</p>'}</div>`;
  return `<div class="panel ahead"><h2>Yönetim</h2><button id="admback">Çıkış</button></div>${tabs}${admMsg ? `<div class="note">${esc(admMsg)}</div>` : ''}${body}`;
}
