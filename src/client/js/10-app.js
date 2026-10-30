const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
let lastMsg = '',
  msgT = 0,
  toastTimer = null,
  dropAt = null,
  fresh = { id: -1, t: 0 };
let db = null,
  uid = null,
  S = null,
  L = [],
  sel = [],
  order = [],
  stage = [],
  name = '',
  msg = '',
  ready = false,
  busy = false,
  gid = 0;
let SRV = null; /* sunucu modu: kendi sunucumuza bağlıyken dolu */
const APP_BUILD = '/*@BUILD@*/';
let RULES_URL = '/kurallar';
/* kurallar sayfası oyunun içinde açılır (yeni sekme ya da başka site yok); sayfa derlemede gömülür */
const RULES_HTML = '/*@RULES@*/';
function openRules() {
  if (document.getElementById('rulesOv')) return;
  const ov = document.createElement('div');
  ov.id = 'rulesOv';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', 'Kurallar');
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#120d0b;display:flex;flex-direction:column';
  ov.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:calc(8px + env(safe-area-inset-top)) 12px 8px;border-bottom:1px solid #ffffff1f"><b style="color:#f3ead2;font-size:16px">Kurallar</b><button id="rulesX" style="min-height:40px">Oyuna dön</button></div>';
  const fr = document.createElement('iframe');
  fr.title = 'Kanlı Okey kuralları';
  fr.style.cssText = 'flex:1;width:100%;border:0;background:#120d0b';
  if (RULES_HTML.length > 20) fr.srcdoc = RULES_HTML;
  else fr.src = RULES_URL;
  ov.appendChild(fr);
  document.body.appendChild(ov);
  ov.querySelector('#rulesX').onclick = closeRules;
}
function closeRules() {
  const ov = document.getElementById('rulesOv');
  if (ov) ov.remove();
}
window.closeRules = closeRules;
document.addEventListener(
  'click',
  e => {
    const a = e.target.closest && e.target.closest('a[href="/kurallar"]');
    if (a) {
      e.preventDefault();
      e.stopPropagation();
      openRules();
    }
  },
  true
);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeRules();
});
/* davet bağlantısı: site.com/?k=KOD ile gelen kod giriş kutusuna hazır gelir */
const INVITE = (() => {
  try {
    return (new URLSearchParams(location.search).get('k') || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 5);
  } catch (e) {
    return '';
  }
})();
let bots = 0,
  R = 9,
  botKey = '',
  botTimer = null,
  claimC = null,
  autoK = '',
  lastTap = { id: -1, t: 0 },
  liveGm = null,
  newT = { id: -1, trn: -1, gid: -1 };
let ROOM = null,
  code = '',
  view = 'home',
  isAdmin = false,
  unsubs = [],
  admRooms = [],
  admC = '',
  admMsg = '';
try {
  name = localStorage.getItem('okeyName') || '';
} catch (e) {}
function tile(id, O, cls = '') {
  if (id == null) return '<div class="t e"></div>';
  const v = tv(id, O),
    j = isJ(id, O);
  return `<div class="t c${v.c} ${cls} ${j ? 'ok' : ''} ${id >= 104 ? 'st' : ''}" data-id="${id}">${id >= 104 ? '★' : v.n}${j ? '<i></i>' : ''}</div>`;
}
const G = () => db.doc('rooms/' + code + '/game/main');
async function start(prev, R) {
  if (SRV) {
    try {
      const res = await SRV.call({ op: prev ? 'next' : 'start', code, R });
      if (res && res.msg) msg = res.msg;
    } catch (e) {
      msg = 'Bağlantı hatası, tekrar dene.';
    }
    render();
    return;
  }
  let ps = prev
    ? prev.seats.map((u, i) => ({ u, n: prev.names[i] }))
    : fillBots(
        [...L]
          .sort((a, b) => a.t - b.t)
          .slice(0, 4)
          .map(x => ({ u: x.id, n: x.name }))
      );
  if (ps.length < 4) return;
  const pairOn = !prev && !!(ROOM && ROOM.pair);
  if (pairOn) ps = pairOrder(ps, ROOM.pr | 0);
  const g = deal(prev, R, ps, undefined, { pair: pairOn });
  try {
    await G().set(g);
  } catch (e) {
    msg = 'Başlatılamadı: ' + (e.code || '');
  }
  try {
    await db.doc('rooms/' + code).update({ st: 'playing', rd: g.round, R: g.R, pl: ps.map(x => x.n), tg: Date.now() });
  } catch (e) {}
  statBump(prev ? ['rounds'] : ['rounds', 'games']);
  render();
}
const lsGet = k => {
  try {
    return localStorage.getItem(k) || '';
  } catch (e) {
    return '';
  }
};
const lsSet = (k, v) => {
  try {
    if (v) localStorage.setItem(k, v);
    else localStorage.removeItem(k);
  } catch (e) {}
};
const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const mkCode = () => Array.from({ length: 5 }, () => ALPH[(Math.random() * ALPH.length) | 0]).join('');
function unsubAll() {
  unsubs.forEach(f => {
    try {
      f();
    } catch (e) {}
  });
  unsubs = [];
}
function readName() {
  const el = $('#nm');
  name = ((el && el.value.trim()) || name || 'Oyuncu').slice(0, 14);
  lsSet('okeyName', name);
}
function enterRoom(c) {
  unsubAll();
  code = c;
  view = 'room';
  S = null;
  L = [];
  ROOM = null;
  sel = [];
  stage = [];
  order = [];
  botKey = '';
  gid = 0;
  msg = '';
  admC = '';
  lsSet('okeyRoom', c);
  let seen = false;
  let rj = '',
    mj = '',
    gj = '';
  unsubs.push(
    db.doc('rooms/' + c).onSnapshot(
      s => {
        if (!s.exists) {
          if (seen && code === c) leaveLocal('Oda kapatıldı.');
          return;
        }
        seen = true;
        const d = s.data(),
          j = JSON.stringify(d);
        if (j === rj) return;
        rj = j;
        ROOM = d;
        bots = ROOM.bots || 0;
        render();
      },
      () => {}
    )
  );
  unsubs.push(
    db.collection('rooms/' + c + '/members').onSnapshot(
      s => {
        const a = s.docs.map(x => ({ id: x.id, ...x.data() })),
          j = JSON.stringify(a);
        if (j === mj) return;
        mj = j;
        L = a;
        render();
        try {
          rxCheck();
        } catch (e) {}
      },
      () => {}
    )
  );
  CHAT = [];
  chatLastT = 0;
  unsubs.push(
    db.doc('rooms/' + c + '/chat/main').onSnapshot(
      s => {
        const d = s.exists ? s.data() : null;
        try {
          onChat((d && d.m) || []);
        } catch (e) {}
      },
      () => {}
    )
  );
  unsubs.push(
    db.doc('rooms/' + c + '/game/main').onSnapshot(
      s => {
        const d = s.exists ? s.data() : null,
          j = JSON.stringify(d);
        if (j === gj) return;
        gj = j;
        const pv = S;
        S = d;
        try {
          sfxDiff(pv, d);
        } catch (e) {}
        try {
          mvDiff(pv, d);
        } catch (e) {}
        render();
      },
      () => {}
    )
  );
  render();
}
function leaveLocal(m, keep) {
  unsubAll();
  clearTimeout(botTimer);
  botKey = '';
  code = '';
  view = 'home';
  S = null;
  ROOM = null;
  L = [];
  sel = [];
  stage = [];
  order = [];
  bots = 0;
  admC = '';
  if (!keep) lsSet('okeyRoom', '');
  msg = m || '';
  render();
}
async function createRoom() {
  readName();
  msg = '';
  try {
    for (let i = 0; i < 6; i++) {
      const c = mkCode(),
        rs = await db.doc('rooms/' + c).get();
      if (rs.exists) continue;
      await db.doc('rooms/' + c).set({ code: c, host: uid, hostName: name, R: 9, bots: 0, st: 'lobby', t: Date.now() });
      statBump(['rooms']);
      await db.doc('rooms/' + c + '/members/' + uid).set({ name, av: myAv, t: Date.now() });
      enterRoom(c);
      return;
    }
    msg = 'Oda kodu üretilemedi, tekrar dene.';
  } catch (e) {
    msg = 'Oda kurulamadı: ' + (e.code || '');
  }
  render();
}
async function quickBots() {
  await createRoom();
  if (!code) return;
  try {
    await db.doc('rooms/' + code).update({ bots: 3 });
  } catch (e) {}
  for (let k = 0; k < 40 && !((L || []).some(x => x.id === uid) && ROOM); k++)
    await new Promise(r => setTimeout(r, 100));
  await start(null, 9);
}
async function joinRoom(raw) {
  const c = String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  readName();
  msg = '';
  if (c.length !== 5) {
    msg = 'Oda kodu 5 karakter olmalı.';
    render();
    return;
  }
  try {
    const rs = await db.doc('rooms/' + c).get();
    if (!rs.exists) {
      lsSet('okeyRoom', '');
      msg = 'Böyle bir oda yok. Kodu kontrol et.';
      render();
      return;
    }
    const r = rs.data(),
      mem = await db.collection('rooms/' + c + '/members').get();
    const already = mem.docs.some(d => d.id === uid);
    if (!already) {
      if (r.st === 'playing') {
        if (SRV) {
          try {
            const q = await SRV.call({ op: 'seats', code: c });
            if (q && q.ok && q.mine) {
              enterRoom(c);
              return;
            }
            if (q && q.ok && q.seats && q.seats.length) {
              claimC = { code: c, seats: q.seats };
              render();
              setTimeout(() => {
                try {
                  const e = document.querySelector('.claim');
                  if (e) e.scrollIntoView({ block: 'center', behavior: 'smooth' });
                } catch (_) {}
              }, 60);
              return;
            }
          } catch (e) {}
          msg = 'Bu masada oyun sürüyor ve bütün oyuncular masada.';
          render();
          return;
        }
        msg = 'Bu odada oyun başlamış.';
        render();
        return;
      }
      if (mem.size >= 4) {
        msg = 'Masa dolu.';
        render();
        return;
      }
      await db.doc('rooms/' + c + '/members/' + uid).set({ name, av: myAv, t: Date.now() });
    }
    enterRoom(c);
  } catch (e) {
    msg = 'Katılınamadı: ' + (e.code || '');
  }
  render();
}
async function wipeRoom(c) {
  try {
    const m = await db.collection('rooms/' + c + '/members').get();
    for (const d of m.docs) await db.doc('rooms/' + c + '/members/' + d.id).delete();
  } catch (e) {}
  try {
    await db.doc('rooms/' + c + '/game/main').delete();
  } catch (e) {}
  try {
    await db.doc('rooms/' + c + '/chat/main').delete();
  } catch (e) {}
  try {
    await db.doc('rooms/' + c).delete();
  } catch (e) {}
}
async function leaveLobby() {
  const c = code,
    host = ROOM && ROOM.host === uid;
  leaveLocal('');
  if (host) await wipeRoom(c);
  else {
    try {
      await db.doc('rooms/' + c + '/members/' + uid).delete();
    } catch (e) {}
  }
}
async function setBots(n) {
  try {
    await db.doc('rooms/' + code).update({ bots: n });
  } catch (e) {
    msg = 'Kaydedilemedi: ' + (e.code || '');
    render();
  }
}
async function shareCode() {
  const t = 'Kanlı Okey: oda kodum ' + code + (SRV ? ' · ' + location.origin + '/?k=' + code : '');
  try {
    if (navigator.share) {
      await navigator.share({ text: t });
      return;
    }
  } catch (e) {}
  try {
    await navigator.clipboard.writeText(code);
    msg = 'Kod kopyalandı: ' + code;
  } catch (e) {
    msg = 'Kodu elle kopyala: ' + code;
  }
  render();
}
/* açık masalar (v56): herkese açık odalar ana ekranda; bekleyene katıl, oyundakinde bot yerine otur */
let TBL = [],
  tblJ = '',
  tblAt = 0,
  tblBusy = false;
async function fetchTables(force) {
  if (!SRV || tblBusy || view !== 'home' || code) return;
  if (!force && Date.now() - tblAt < 6000) return;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
  tblBusy = true;
  tblAt = Date.now();
  try {
    const r = await SRV.call({ op: 'tables' });
    if (r && r.ok) {
      const j = JSON.stringify(r.list || []);
      if (j !== tblJ) {
        tblJ = j;
        TBL = r.list || [];
        if (view === 'home' && !code) render();
      }
    }
  } catch (e) {}
  tblBusy = false;
}
if (typeof setInterval === 'function')
  setInterval(() => {
    try {
      fetchTables();
    } catch (e) {}
  }, 6500);
const BLN = ['Kolay', 'Orta', 'Zor'];
function tablesH() {
  if (!SRV || !CFG.pub) return '';
  setTimeout(() => fetchTables(), 0);
  const row = t => {
    const info =
      t.st === 'lobby'
        ? `Bekliyor · ${4 - t.free}/4 oyuncu${t.bots ? ' · ' + t.bots + ' bot' : ''}`
        : `<i class="lv"></i>Oyunda · el ${t.rd}/${t.R} · ${t.bots.length} bot`;
    const btn = t.mine
      ? `<button class="p" data-tj="${esc(t.code)}">Dön</button>`
      : t.st === 'lobby'
        ? t.free > 0
          ? `<button class="p" data-tj="${esc(t.code)}">Katıl</button>`
          : '<button disabled>Dolu</button>'
        : t.bots.length
          ? `<button class="p" data-tb="${esc(t.code)}:${t.bots[0]}">Bot yerine otur</button>`
          : '<button disabled>Dolu</button>';
    return `<div class="tbr ${t.st}"><div class="tbi"><b>${esc(t.host || '?')} masası</b><small>${info}${t.pair ? ' · eşli' : ''}${t.bl != null ? ' · bot ' + BLN[t.bl] : ''}</small><small class="tbn">${t.names.map(esc).join(' · ')}</small></div>${btn}</div>`;
  };
  return `<div class="panel tables"><div class="tbh"><b>Masa seç</b><small>${TBL.length ? TBL.length + ' açık masa' : ''}</small></div>${TBL.length ? TBL.map(row).join('') : '<small class="mut">Şu an herkese açık masa yok. Masa kurarken "Herkese açık" seçersen burada görünür, yabancılar katılabilir.</small>'}</div>`;
}
async function takeBot(c, i) {
  readName();
  msg = '';
  let r = null;
  try {
    r = await SRV.call({ op: 'takeBot', code: c, i, name, av: myAv });
  } catch (e) {}
  if (r && r.ok) {
    lsSet('okeyRoom', c);
    enterRoom(c);
  } else {
    msg = (r && r.msg) || 'Oturulamadı.';
    tblAt = 0;
    fetchTables(true);
    render();
  }
}
/* hata / kural yanlış bildirimi (v56) */
let repK = 'hata';
function openRep() {
  closeRep();
  if (!SRV) return;
  const inG = !!(S && S.seats && S.seats.indexOf(uid) >= 0);
  const el = document.createElement('div');
  el.id = 'repv';
  el.className = 'zoomv';
  const segH = () =>
    [
      ['hata', 'Hata'],
      ['kural', 'Kural yanlış'],
      ['fikir', 'Öneri']
    ]
      .map(
        ([k, l]) =>
          `<button type="button" class="${repK === k ? 'p' : ''}" data-rk="${k}" aria-pressed="${repK === k}">${l}</button>`
      )
      .join('');
  el.innerHTML = `<div class="zsheet rep" role="dialog" aria-label="Bildir"><div class="zh"><b>Bildir</b><small>yöneticiye gider</small><button id="repX" aria-label="Kapat">✕</button></div>
<div class="seg" id="repSeg">${segH()}</div>
<textarea id="repT" maxlength="1000" rows="4" placeholder="Ne oldu? Ne olmasını bekliyordun? (Kural yanlışsa doğrusunu yaz)"></textarea>
<small class="mut">${inG ? 'Masanın şu anki durumu ve son hamleler bildirime otomatik eklenir.' : 'Adın ve cihaz bilgisi eklenir.'}</small>
<div class="row" style="margin-top:8px"><button class="p" id="repS">Gönder</button></div><div id="repM" class="repm" role="status"></div></div>`;
  el.addEventListener('click', async e => {
    if (e.target === el || e.target.closest('#repX')) {
      closeRep();
      return;
    }
    const k = e.target.closest('[data-rk]');
    if (k) {
      repK = k.dataset.rk;
      document.getElementById('repSeg').innerHTML = segH();
      return;
    }
    if (e.target.closest('#repS')) {
      const t = document.getElementById('repT'),
        m = document.getElementById('repM'),
        bt = e.target.closest('#repS');
      const x = (t.value || '').trim();
      if (x.length < 3) {
        m.textContent = 'Kısaca ne olduğunu yaz.';
        return;
      }
      bt.disabled = true;
      let r = null;
      try {
        r = await SRV.call({
          op: 'report',
          kind: repK,
          text: x,
          code: inG ? code : '',
          name,
          ua: navigator.userAgent,
          v: APP_BUILD
        });
      } catch (_) {}
      if (r && r.ok) {
        m.textContent = 'Gönderildi, teşekkürler!';
        t.value = '';
        setTimeout(closeRep, 1300);
      } else {
        bt.disabled = false;
        m.textContent = (r && r.msg) || 'Gönderilemedi, bağlantını kontrol et.';
      }
    }
  });
  document.body.appendChild(el);
  setTimeout(() => {
    try {
      document.getElementById('repT').focus();
    } catch (e) {}
  }, 50);
}
function closeRep() {
  const e = document.getElementById('repv');
  if (e) e.remove();
}
