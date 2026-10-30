const TEA =
  '<svg viewBox="0 0 44 58" aria-hidden="true"><defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset=".25" stop-color="#ffffff" stop-opacity=".08"/><stop offset=".75" stop-color="#ffffff" stop-opacity=".05"/><stop offset="1" stop-color="#ffffff" stop-opacity=".4"/></linearGradient><linearGradient id="tt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0792f"/><stop offset="1" stop-color="#8a2b0c"/></linearGradient><radialGradient id="ts" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfc8b6"/></radialGradient></defs><ellipse cx="22" cy="52" rx="20" ry="5" fill="#0006"/><ellipse cx="22" cy="49" rx="19" ry="5.2" fill="url(#ts)" stroke="#c9a24a" stroke-width="1.2"/><ellipse cx="22" cy="48.5" rx="13" ry="3.2" fill="#e7e1d1"/><path class="st" d="M17 11c-3-3 3-5 0-9"/><path class="st s2" d="M27 11c-3-3 3-5 0-9"/><path d="M8 14Q10 29 16 35Q14 41 14.5 48H29.5Q30 41 28 35Q34 29 36 14Z" fill="url(#tt)"/><path d="M8 14Q10 29 16 35Q14 41 14.5 48H29.5Q30 41 28 35Q34 29 36 14Z" fill="url(#tg)" stroke="#ffffffd0" stroke-width="1.2"/><ellipse cx="22" cy="14" rx="14" ry="3.4" fill="#f09a4a" stroke="#fffffff0" stroke-width="1.3"/><ellipse cx="22" cy="14.6" rx="10.5" ry="2.2" fill="#b4501b"/><path d="M12 18Q13 28 17 33" stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="31" y="46" width="12" height="1.8" rx=".9" fill="#d8d2c4" transform="rotate(-14 31 46)"/></svg>';
const LAMP =
  '<svg viewBox="0 0 44 50" aria-hidden="true"><line x1="22" y1="0" x2="22" y2="16" stroke="#0009" stroke-width="2"/><path d="M5 38Q22 8 39 38Z" fill="#a9792a"/><path d="M5 38Q22 8 39 38Z" fill="none" stroke="#e9c26b" stroke-width="1.2"/><ellipse cx="22" cy="39" rx="17" ry="4" fill="#fff0b8"/></svg>';
const FITQ =
  typeof matchMedia === 'function'
    ? matchMedia('(max-width:999px) and (orientation:portrait), (orientation:landscape) and (max-height:620px)')
    : null;
const orack = (r, cnt) => {
  if (r !== 2 && FITQ && FITQ.matches) {
    const g = 5,
      len = cnt * g + 3,
      tiles = Array.from({ length: cnt }, (_, k) => `<i style="left:${k * g + 2}px"></i>`).join('');
    return `<div class="orack h hs" aria-hidden="true" style="width:${len}px;height:17px"><div class="base"></div>${tiles}</div>`;
  }
  const g = r === 2 ? 10 : 6,
    len = cnt * g + 2,
    wd = 18,
    hz = r === 2;
  const tiles = Array.from({ length: cnt }, (_, k) => `<i style="${hz ? 'left' : 'top'}:${k * g + 1}px"></i>`).join('');
  return `<div class="orack ${hz ? 'h' : 'v'}" aria-hidden="true" style="width:${hz ? len : wd}px;height:${hz ? wd : len}px"><div class="base"></div>${tiles}</div>`;
};
let showPen = false;
function penPanel() {
  const idx = [0, 1, 2, 3].sort((a, b) => (S.scores['s' + b] || 0) - (S.scores['s' + a] || 0)),
    ended = S.ph === 'end';
  const me0 = S.seats.indexOf(uid),
    tsum = t => (S.scores['s' + t] || 0) + (S.scores['s' + (t + 2)] || 0);
  const teams = S.pair
    ? `<div class="teams">${[1]
        .map(t => {
          const mine = me0 >= 0 && me0 % 2 === t;
          return `<div class="tm ${mine ? 'mine' : ''}"><span>${mine ? 'Takımın' : 'Rakip takım'}<small>${esc(S.names[t])} + ${esc(S.names[t + 2])}</small></span><b>${tsum(t)}</b></div>`;
        })
        .join('')}</div>`
    : '';
  return `<div class="penpanel" role="dialog" aria-label="Ceza puanları"><h3>Ceza puanları</h3>${teams}${idx.map((i, k) => `<div class="pr sc${i} ${k === 0 && (S.scores['s' + i] || 0) > 0 ? 'top' : ''}"><span><i class="dot"></i>${esc(S.names[i])}<small>bu tur ${ended ? (S.last[i] > 0 ? '+' : '') + S.last[i] : '+' + ((S.ex || {})['s' + i] || 0)}</small></span><b>${S.scores['s' + i] || 0}</b></div>`).join('')}<small style="margin-top:6px">En yüksek ceza alan sonuncu olur.</small></div>`;
}
/* sıra ibresi: hep aynı yönde (sıranın döndüğü yönde) döner */
let needleA = null,
  needleF = 0,
  needleT = 0,
  needleK = '';
function needleH(me) {
  const k = S.gid + ':' + S.turn,
    r = (S.turn - me + 4) % 4,
    base = [180, 90, 0, -90][r];
  if (k !== needleK) {
    needleK = k;
    if (needleA === null) {
      needleA = base;
      needleF = base;
      needleT = 0;
    } else {
      let t = base;
      while (t > needleA) t -= 360;
      while (t <= needleA - 360) t += 360;
      if (t !== needleA) {
        needleF = needleA;
        needleA = t;
        needleT = Date.now();
      }
    }
  }
  const el = needleT ? Date.now() - needleT : 9999;
  return `<i class="needle" aria-hidden="true" style="--nf:${needleF}deg;--nd:${needleA}deg;--ne:${Math.min(el, 9999)}ms;--nc:${SEATC[S.turn]}"></i>`;
}
/* el sonu kartı: kim neden ne kadar ceza aldı, satır satır (KURALLAR.md: Eli bitirme, Ceza puanları) */
let endHide = -1;
const CROWN =
  '<svg class="crown" viewBox="0 0 46 30" aria-hidden="true"><path fill="currentColor" d="M3 26 0 6l12 9L23 0l11 15 12-9-3 20z"/><rect x="3" y="26" width="40" height="4" rx="1.5" fill="currentColor"/></svg>';
function endBreak(i, f, m, mr) {
  const B = S.B,
    O = S.okey,
    h = S.hands['h' + i] || [],
    ex = (S.ex || {})['s' + i] || 0,
    per = B ? 10 : 5,
    okv = B ? 500 : 250;
  let base = 0;
  const L = [];
  if (S.pair && f >= 0 && isMate(S, f, i)) {
    base = 0;
    L.push((i === S.seats.indexOf(uid) ? 'Eşin' : 'Eşi') + ' eli bitirdi: <b>ceza yok</b>');
  } else if (i === f) {
    base = B ? -200 : -100;
    L.push(`Eli bitirdi <b>${base}</b>`);
  } else if (S.opn['s' + i] > 0) {
    const jk = h.filter(x => isJ(x, O)).length,
      n = h.filter(x => !isJ(x, O)).reduce((a, x) => a + tv(x, O).n, 0);
    base = n * per + jk * okv;
    if (!h.length) L.push('Elinde taş kalmadı <b>0</b>');
    else {
      if (n) L.push(`Elde kalan ${h.length - jk} taş: ${n} × ${per} = <b>${n * per}</b>`);
      if (jk) L.push(`Elde okey: ${jk} × ${okv} = <b>${jk * okv}</b>`);
    }
  } else {
    base = B ? 1000 : 500;
    L.push(`Açamadı <b>${base}</b>`);
  }
  if (m > 1 && base) L.push(`${mr} <b>× ${m}</b>`);
  if (ex) L.push(`Bu elde yazılan cezalar (işleme, işler taş) <b>+${ex}</b>`);
  const tot = m * base + ex;
  return { L, tot, ok: tot === (S.last || [])[i] };
}
function endH(me, elE, finalEnd) {
  const f = S.win >= 0 && S.win < 4 ? S.win : -1,
    O = S.okey;
  const lt = f >= 0 ? (S.disc['d' + f] || []).slice(-1)[0] : null,
    okeyEnd = f >= 0 && lt != null && isJ(lt, O);
  const solo = f >= 0 && S.opn['s' + f] > 0 && [0, 1, 2, 3].every(i => i === f || !(S.opn['s' + i] > 0));
  const m = f >= 0 ? (okeyEnd ? 2 : 1) * (solo ? 2 : 1) : 1;
  const mr0 = [okeyEnd ? 'okeyle bitirme' : '', solo ? 'tek başına bitirme' : ''].filter(Boolean).join(' + '),
    mr = mr0 ? mr0.charAt(0).toUpperCase() + mr0.slice(1) : '';
  const title = finalEnd
    ? 'Oyun bitti'
    : f < 0
      ? 'Deste bitti'
      : f === me
        ? 'Eli bitirdin!'
        : esc(S.names[f]) + ' eli bitirdi';
  const sub2 =
    f < 0
      ? 'Kimse bitiremedi, açamayanlara tam ceza'
      : mr
        ? mr + ': cezalar ' + m + ' katı'
        : 'El ' + (S.round + 1) + ' / ' + S.R + ' sonu';
  const ids = [0, 1, 2, 3].sort((a, b) =>
    finalEnd ? (S.scores['s' + a] || 0) - (S.scores['s' + b] || 0) : ((S.last || [])[a] || 0) - ((S.last || [])[b] || 0)
  );
  const lastP = [0, 1, 2, 3].sort((a, b) => (S.scores['s' + b] || 0) - (S.scores['s' + a] || 0))[0];
  const rows = ids
    .map(i => {
      const r = endBreak(i, f, m, mr),
        v = (S.last || [])[i] || 0,
        h = S.hands['h' + i] || [],
        bl = i !== f && !(S.opn['s' + i] > 0) && !(S.pair && f >= 0 && isMate(S, f, i));
      const tiles =
        i !== f && h.length
          ? `<div class="erm">${h
              .slice()
              .sort((a, b) => a - b)
              .map(x => tile(x, O))
              .join('')}</div>`
          : '';
      return `<div class="er sc${i} ${i === f ? 'win' : ''} ${bl ? 'bloody' : ''}"><div class="erh">${bl ? '<i class="bsp" aria-hidden="true"></i>' : ''}<i class="dot"></i><b>${esc(S.names[i])}${i === me ? ' · sen' : ''}</b><span class="et ${v < 0 ? 'neg' : v > 0 ? 'pos' : ''}">${v > 0 ? '+' : ''}${v}</span></div>
<div class="erd">${r.ok ? r.L.join('<br>') : 'Bu el: <b>' + (v > 0 ? '+' : '') + v + '</b>'}</div>${tiles}<div class="ers ${finalEnd && i === lastP ? 'lastp' : ''}">Toplam ceza: <b>${S.scores['s' + i] || 0}</b>${finalEnd && i === lastP ? ' · sonuncu' : ''}</div></div>`;
    })
    .join('');
  const tl = t => ((S.last || [])[t] || 0) + ((S.last || [])[t + 2] || 0),
    ts = t => (S.scores['s' + t] || 0) + (S.scores['s' + (t + 2)] || 0);
  const loseT = ts(0) >= ts(1) ? 0 : 1;
  const teamH = S.pair
    ? `<div class="endteams">${[0, 1].map(t => `<div class="et2 ${me >= 0 && me % 2 === t ? 'mine' : ''} ${finalEnd && t === loseT ? 'lose' : ''}"><small>${me >= 0 && me % 2 === t ? 'Takımın' : 'Rakip takım'}</small><b>${esc(S.names[t])} + ${esc(S.names[t + 2])}</b><span>Bu el ${tl(t) > 0 ? '+' : ''}${tl(t)} · toplam ${ts(t)}</span>${finalEnd && t === loseT ? '<em>Kaybeden takım</em>' : ''}</div>`).join('')}</div>`
    : '';
  let ft = '';
  if (finalEnd)
    ft = `<div class="row"><button class="p" id="home">Ana ekrana dön</button></div><small>${S.pair ? 'En çok ceza yiyen takım kaybeder.' : 'En yüksek ceza alan sonuncu olur.'}</small>`;
  else if (elE > 9500) ft = `<div class="row"><button class="p" id="again">Sonraki el</button></div>`;
  else ft = `<div class="bar"><i></i></div><small>Taşlar karılıyor, yeni el birazdan başlıyor…</small>`;
  const hid = endHide === S.gid;
  return `<div class="endov ${hid ? 'hid' : ''}" style="--el:${Math.min(elE, 60000)}ms"><button class="endo" id="endo">Sonuçları göster</button><div class="endcard" role="dialog" aria-label="El sonu"><button class="endx" id="endx">Masayı gör</button><div class="endhd ${f === me ? 'me' : ''}">${f >= 0 ? CROWN : ''}<b>${title}</b><small>${sub2}</small></div>${teamH}<div class="endrows">${rows}</div><div class="endft">${ft}</div></div></div>`;
}
let dealGid = -1,
  dealT = 0,
  endGid = -1,
  endT = 0,
  nextFor = -1,
  nextTimer = null,
  dealTimer = null;
function scheduleNext() {
  if (!S || S.ph !== 'end' || S.round + 1 >= S.R || nextFor === S.gid) return;
  if (SRV) {
    nextFor = S.gid;
    setTimeout(render, Math.max(0, 9600 - (Date.now() - endT)));
    return;
  }
  nextFor = S.gid;
  clearTimeout(nextTimer);
  const first = S.seats.find(x => !isBot(x)),
    g = S.gid;
  nextTimer = setTimeout(
    () => {
      if (S && S.ph === 'end' && S.gid === g && first === uid && !busy) start(S);
    },
    Math.max(0, 6500 - (Date.now() - endT))
  );
  setTimeout(render, Math.max(0, 9600 - (Date.now() - endT)));
}
