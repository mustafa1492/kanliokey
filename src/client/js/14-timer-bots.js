let CFG = { bot: 2, ms: 1100, ann: '', tm: 45, pub: true, chat: true, mk: true };
/* botlar: sırası gelen botu ilk insan oyuncunun sayfası oynatır */

/* sıra süresi */
const fmtT = ms => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
};
function timerH(mine) {
  if (!S || !S.tt || !(CFG.tm > 0) || S.ph === 'end' || isBot(S.seats[S.turn])) return '';
  const tot = CFG.tm * 1000,
    rem = S.tt + tot - Date.now(),
    f = Math.max(0, Math.min(1, rem / tot));
  return `<div class="tmr ${mine ? 'mine' : ''} ${rem <= 10000 ? 'low' : ''}" role="timer" aria-label="Kalan süre"><i style="transform:scaleX(${f.toFixed(3)})"></i><span>${fmtT(rem)}</span></div>`;
}
let toKey = '',
  toT = 0,
  vibK = '';
async function autoTurn() {
  if (SRV || busy || !S || S.ph === 'end') return;
  const s = JSON.parse(JSON.stringify(S)),
    mineT = s.seats[s.turn] === uid;
  const r = timeoutMove(s);
  if (!r) return;
  busy = true;
  try {
    await G().update(r);
    stage = [];
    sel = [];
    if (mineT) msg = 'Süre doldu: taşın otomatik atıldı.';
  } catch (e) {
    msg = 'Süre dolumu kaydedilemedi: ' + (e.code || '');
  }
  busy = false;
  render();
}
function checkTimeout(rem) {
  if (SRV || !S || S.ph === 'end' || busy || (drag && drag.on)) return;
  const u = S.seats[S.turn];
  if (isBot(u)) return;
  const mineT = u === uid,
    host = S.seats.find(x => !isBot(x)) === uid;
  if (rem > (mineT ? 0 : -6000) || (!mineT && !host)) return;
  const k = S.gid + ':' + S.turn + ':' + S.trn + ':' + S.ph + ':' + S.hands['h' + S.turn].length + ':' + S.must;
  if (k === toKey && Date.now() - toT < 5000) return;
  toKey = k;
  toT = Date.now();
  autoTurn();
}
function paintRing() {
  if (typeof document.querySelectorAll !== 'function') return;
  const av = document.querySelector('.seat.turn .av');
  document.querySelectorAll('.av.low').forEach(x => {
    if (x !== av) x.classList.remove('low');
  });
  if (!av || !S || !S.tt || !(CFG.tm > 0) || S.ph === 'end' || isBot(S.seats[S.turn])) {
    if (av) av.style.removeProperty('--p');
    return;
  }
  const tot = CFG.tm * 1000,
    rem = S.tt + tot - Date.now(),
    f = Math.max(0, Math.min(1, rem / tot));
  av.style.setProperty('--p', (f * 360).toFixed(1) + 'deg');
  av.classList.toggle('low', rem <= 10000);
}
function tick() {
  const on = !!(
    SET.low10 &&
    S &&
    S.tt &&
    CFG.tm > 0 &&
    S.ph !== 'end' &&
    S.seats &&
    S.seats[S.turn] === uid &&
    !isBot(uid) &&
    S.tt + CFG.tm * 1000 - Date.now() <= 10000 &&
    S.tt + CFG.tm * 1000 - Date.now() > 0
  );
  try {
    if (document.body && document.body.classList.contains('tlow') !== on) document.body.classList.toggle('tlow', on);
  } catch (e) {}
  if (!S || !S.tt || !(CFG.tm > 0) || S.ph === 'end' || isBot(S.seats[S.turn])) return;
  const tot = CFG.tm * 1000,
    rem = S.tt + tot - Date.now(),
    el = document.querySelector('.tmr');
  if (el && el.firstElementChild) {
    el.firstElementChild.style.transform = 'scaleX(' + Math.max(0, Math.min(1, rem / tot)).toFixed(3) + ')';
    el.lastElementChild.textContent = fmtT(rem);
    el.classList.toggle('low', rem <= 10000);
  }
  if (rem <= 5000 && rem > 0 && S.seats[S.turn] === uid) {
    const k = S.gid + ':' + S.trn;
    if (vibK !== k) {
      vibK = k;
      if (SFX.vb) buzz(80);
    }
  }
  paintRing();
  if (SET.low10 && rem <= 5000 && rem > 0 && S.seats[S.turn] === uid) SFX.tick(Math.ceil(rem / 1000));
  checkTimeout(rem);
}
if (typeof setInterval === 'function') setInterval(tick, 500);
async function botStep() {
  if (!S || S.ph === 'end') return;
  if (busy) {
    botKey = '';
    scheduleBot();
    return;
  }
  const s = JSON.parse(JSON.stringify(S)),
    me = s.turn;
  if (!isBot(s.seats[me])) return;
  const r = botMove(s, me, ROOM && ROOM.bl != null ? ROOM.bl | 0 : CFG.bot | 0);
  if (!r) return;
  busy = true;
  try {
    await G().update(r);
  } catch (e) {
    botKey = '';
    msg = 'Bot hamlesi kaydedilemedi: ' + (e.code || '');
  }
  busy = false;
  render();
}
function scheduleBot() {
  if (SRV || !S || !S.seats || S.ph === 'end') return;
  if (!isBot(S.seats[S.turn])) return;
  if (S.seats.find(x => !isBot(x)) !== uid) return;
  const sig =
    (S.hands[hk(S.turn)] || []).reduce((a, x) => a + x, 0) +
    [0, 1, 2, 3].reduce(
      (a, i) => a + (S.tbl['t' + i] || []).reduce((b, r) => b + r.g.reduce((c, x) => c + x * 3, 0), 0),
      0
    );
  const key = [S.gid, S.turn, S.trn, S.ph, S.hands[hk(S.turn)].length, S.opn['s' + S.turn], sig].join('|');
  if (key === botKey) return;
  botKey = key;
  clearTimeout(botTimer);
  botTimer = setTimeout(botStep, CFG.ms || 1100);
}
function makeGroup(kind) {
  const O = S.okey;
  B = S.B;
  if (kind === 'c') {
    if (sel.length !== 2 || prs(sel, O) < 0) {
      msg = 'Çift için aynı renkten ve aynı sayıdan iki taş seç. Okey de çifte katılabilir.';
      render();
      return;
    }
    if (stage.some(g => g.length !== 2)) {
      msg = 'Per ve çifti aynı anda açamazsın.';
      render();
      return;
    }
  } else {
    if (sel.length < 3 || grp(sel, O) < 0) {
      msg = 'Bu taşlar geçerli bir per değil. Per en az 3 taştan oluşur.';
      render();
      return;
    }
    if (stage.some(g => g.length === 2)) {
      msg = 'Per ve çifti aynı anda açamazsın.';
      render();
      return;
    }
  }
  stage.push([...sel]);
  sel = [];
  msg = '';
  render();
}
