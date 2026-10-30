const STAMP = `<svg class="stamp" viewBox="0 0 300 300" aria-hidden="true" focusable="false"><defs><path id="stA" d="M50 150A100 100 0 0 1 250 150"/><path id="stB" d="M28 150A122 122 0 0 0 272 150"/></defs><g fill="none" stroke="currentColor"><circle cx="150" cy="150" r="142" stroke-width="5"/><circle cx="150" cy="150" r="133" stroke-width="1.5"/><circle cx="150" cy="150" r="84" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round"/><circle cx="150" cy="150" r="75" stroke-width="1"/></g><g fill="currentColor" font-family="Oswald,Impact,sans-serif" font-weight="700" text-anchor="middle"><text font-size="38" letter-spacing="9"><textPath href="#stA" startOffset="50%">KANLI OKEY</textPath></text><text font-size="17" letter-spacing="9"><textPath href="#stB" startOffset="50%">★ ★ ★</textPath></text><text x="38" y="160" font-size="24">★</text><text x="262" y="160" font-size="24">★</text></g></svg>`;
let flashPen = 0,
  penFx = [];
const SEATC = ['#d63a3a', '#3f7cf0', '#e3a51f', '#f3ead6'];
const tblSig = s => [0, 1, 2, 3].map(i => (s.tbl['t' + i] || []).map(r => r.g.join('.')).join(',')).join('|');
const tblCnt = s => [0, 1, 2, 3].reduce((a, i) => a + (s.tbl['t' + i] || []).reduce((b, r) => b + r.g.length, 0), 0);
const discCnt = s => [0, 1, 2, 3].reduce((a, i) => a + (s.disc['d' + i] || []).length, 0);
/* her anlık görüntü farkından ses ve titreşim üret (herkes aynı olayı duyar) */
function sfxDiff(a, b) {
  if (!b || !b.seats) return;
  const me = b.seats.indexOf(uid);
  if (!a || !a.seats || me < 0) return;
  if (a.gid !== b.gid) {
    SFX.play('deal');
    return;
  }
  if (a.ph !== 'end' && b.ph === 'end') {
    try {
      if (b.round + 1 >= b.R) histAdd(b, me);
    } catch (e) {}
    if (b.win === 99) SFX.play('deckend');
    else if (b.win === me) {
      SFX.play('win');
      SFX.vib([50, 40, 50, 40, 50, 40, 200]);
    } else {
      SFX.play('lose');
      if ((b.last || [])[me] > 0) SFX.vib([120, 60, 200]);
    }
    if (b.round + 1 < b.R) SFX.later('shuffle', 900);
    try {
      endFx(b, me);
    } catch (e) {}
    return;
  }
  if (b.ph === 'end' || a.ph === 'end') return;
  let t = 0;
  const dd = discCnt(b) - discCnt(a),
    tc = tblCnt(b) - tblCnt(a);
  const opI = [0, 1, 2, 3].filter(i => !(a.opn['s' + i] > 0) && b.opn['s' + i] > 0),
    opened = opI.length > 0;
  if (opened) {
    SFX.play('open');
    t = 300;
  } else if (tc > 0) {
    SFX.play('place', tc);
    t = tc * 75;
  } else if (tc === 0 && tblSig(a) !== tblSig(b)) {
    SFX.play('swap');
    t = 200;
  }
  opI.forEach(i => {
    const v = b.opn['s' + i],
      c = (b.opm || {})['s' + i] === 'c',
      rest = [0, 1, 2, 3].some(j => !(b.opn['s' + j] > 0));
    bigAnn(
      i === me ? `${v} ile ${c ? 'çift ' : ''}açtın!` : `${esc(b.names[i])} ${v} ile ${c ? 'çift ' : ''}açtı!`,
      rest ? `Sıradaki en az ${v + 1} ile açar` : '',
      ''
    );
  });
  if (dd > 0) {
    SFX.later('discard', t);
    t += 140;
  } else if (dd < 0 || b.deck.length < a.deck.length) {
    SFX.later('draw', t);
    t += 140;
  }
  const ex = i => ((b.ex || {})['s' + i] || 0) - ((a.ex || {})['s' + i] || 0);
  const pen = [0, 1, 2, 3].some(i => ex(i) > 0);
  if (pen) {
    flashPen = Date.now();
    penFx = penFx.filter(x => Date.now() - x.t < 2200);
    for (let i = 0; i < 4; i++) if (ex(i) > 0) penFx.push({ i, v: ex(i), t: Date.now() });
    SFX.later('penalty', t);
    if (ex(me) > 0) SFX.vib([90, 50, 260]);
    if (ex(a.turn) >= 500)
      bigAnn('İşler taş! +500', a.turn === me ? 'Sen attın' : esc(b.names[a.turn]) + ' attı', 'blood');
    t += 250;
  }
  if (b.turn === me && a.turn !== me) {
    turnCue(t + 120);
    SFX.vib(45);
  }
}
/* masayı takip (v56): son hamle şeridi ve bu eldeki hamle geçmişi (bu cihazda, elden ele sıfırlanır) */
let MVL = [],
  mvGid = null,
  mvOpen = false;
function mvDiff(a, b) {
  if (!b || !b.seats || !b.tbl) return;
  if (b.gid !== mvGid) {
    mvGid = b.gid;
    MVL = [];
  }
  if (!a || !a.seats || a.gid !== b.gid || a.ph === 'end') return;
  B = b.B;
  const O = b.okey,
    N = i => esc(b.names[i]),
    T = x => tile(x, O, 'mv'),
    out = [],
    m = a.turn;
  const pv = (m + 3) % 4,
    dA = i => a.disc['d' + i] || [],
    dB = i => b.disc['d' + i] || [];
  if (b.deck.length < a.deck.length) out.push({ i: m, h: `${N(m)} desteden çekti` });
  if (dB(pv).length < dA(pv).length) out.push({ i: m, h: `${N(m)} yandan ${T(dA(pv)[dA(pv).length - 1])} aldı` });
  if (dB(pv).length > dA(pv).length && b.ph === 'draw' && b.turn === a.turn)
    out.push({ i: m, h: `${N(m)} yandan aldığı taşı geri koydu` });
  for (let i = 0; i < 4; i++) {
    if (!(a.opn['s' + i] > 0) && b.opn['s' + i] > 0)
      out.push({ i, h: `${N(i)} <b>${b.opn['s' + i]}</b> ile ${(b.opm || {})['s' + i] === 'c' ? 'çift ' : ''}açtı` });
  }
  for (let o = 0; o < 4; o++) {
    if (!(a.opn['s' + o] > 0) && b.opn['s' + o] > 0) continue;
    const ga = a.tbl['t' + o] || [],
      gb = b.tbl['t' + o] || [],
      fa = new Set(ga.flatMap(r => r.g)),
      nw = gb.flatMap(r => r.g).filter(x => !fa.has(x));
    if (!nw.length) continue;
    const swp = ga.length === gb.length && gb.flatMap(r => r.g).length === ga.flatMap(r => r.g).length;
    const who = o === m ? 'kendi perine' : `${N(o)} perine`;
    out.push({
      i: m,
      h: swp ? `${N(m)} ${who} ${nw.map(T).join('')} koyup okeyi aldı` : `${N(m)} ${who} ${nw.map(T).join('')} işledi`
    });
  }
  if (dB(m).length > dA(m).length) {
    const x = dB(m)[dB(m).length - 1],
      pen = ((b.ex || {})['s' + m] || 0) - ((a.ex || {})['s' + m] || 0) >= 500;
    out.push({
      i: m,
      d: 1,
      h: `${N(m)} ${T(x)} attı${pen ? ' <em class="mvp">işler! +500</em>' : ''}`,
      h0: `${N(m)} taş attı${pen ? ' <em class="mvp">işler! +500</em>' : ''}`
    });
  }
  if (b.ph === 'end')
    out.push({
      i: b.win,
      h: b.win === 99 ? 'Deste bitti, el bitti' : b.win >= 0 && b.win < 4 ? `${N(b.win)} eli bitirdi` : 'El bitti'
    });
  const t = Date.now();
  out.forEach(x => MVL.push({ ...x, t }));
  if (MVL.length > 60) MVL = MVL.slice(-60);
  if (mvOpen) mvList();
}
function lmvH() {
  const L = MVL.slice(-1)[0];
  if (!L) return '';
  return `<button class="lmv sc${L.i >= 0 && L.i < 4 ? L.i : 0}" id="lmv" aria-label="Son hamleler"><span class="dot"></span><span class="lmt">${L.h}</span><span class="lmc">${MVL.length > 1 ? 'geçmiş ›' : ''}</span></button>`;
}
/* geçmişte her oyuncunun sadece son attığı taş görünür (Mustafa); eski atışlar taşsız yazılır */
function mvList() {
  const l = document.getElementById('mvl');
  if (!l) return;
  const lastD = {};
  MVL.forEach((x, k) => {
    if (x.d) lastD[x.i] = k;
  });
  l.innerHTML = MVL.length
    ? MVL.map((x, k) => ({ x, k }))
        .reverse()
        .map(
          ({ x, k }) =>
            `<div class="mvr sc${x.i >= 0 && x.i < 4 ? x.i : 0}"><span class="dot"></span><span>${x.d && lastD[x.i] !== k && x.h0 ? x.h0 : x.h}</span></div>`
        )
        .join('')
    : '<p class="mut">Bu elde henüz hamle yok.</p>';
}
function openMv() {
  closeMv();
  if (!S || !S.seats) return;
  B = S.B;
  const O = S.okey;
  mvOpen = true;
  const el = document.createElement('div');
  el.id = 'mvv';
  el.className = 'zoomv';
  const all = [0, 1, 2, 3]
    .map(i => {
      const d = (S.disc['d' + i] || []).slice(-1);
      return d.length
        ? `<div class="mvd sc${i}"><span class="dot"></span><b>${esc(S.names[i])}</b><span class="mvt">${d.map(x => tile(x, O, 'mv')).join('')}</span></div>`
        : '';
    })
    .join('');
  el.innerHTML = `<div class="zsheet" role="dialog" aria-label="Son hamleler"><div class="zh"><b>Son hamleler</b><small>bu el</small><button id="mvX" aria-label="Kapat">✕</button></div><div class="mvl" id="mvl"></div>${all ? `<h5>Son atılan taşlar</h5><div class="mvds">${all}</div>` : ''}</div>`;
  el.addEventListener('click', e => {
    if (e.target === el || e.target.closest('#mvX')) closeMv();
  });
  document.body.appendChild(el);
  mvList();
}
function closeMv() {
  mvOpen = false;
  const e = document.getElementById('mvv');
  if (e) e.remove();
}
