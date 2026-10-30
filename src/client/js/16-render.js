/* Sayfa kendiliğinden en üste kaymasın: yeniden çizimden önce kaydırma yerini tut, sonra geri koy.
   Kullanıcı parmağıyla kaydırıyorsa karışmaz. İçerik yüksekliği oyun boyunca sadece büyür (anlık çökmeyi önler). */
let usrScr = 0;
(function () {
  const mark = () => {
    usrScr = Date.now();
  };
  ['touchstart', 'touchmove', 'touchend', 'wheel', 'keydown'].forEach(e => {
    try {
      window.addEventListener(e, mark, { passive: true, capture: true });
    } catch (_) {}
  });
})();
const scrY = () => {
  try {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  } catch (_) {
    return 0;
  }
};
function render() {
  if (drag && (drag.on || Date.now() - (drag.t0 || 0) < 2500)) {
    pend = true;
    return;
  }
  const y0 = scrY(),
    A = $('#app'),
    keep = A && A.classList && A.classList.contains && A.classList.contains('gm');
  const fitM =
    typeof matchMedia === 'function' &&
    matchMedia('(max-width:999px) and (orientation:portrait), (orientation:landscape) and (max-height:620px)').matches;
  if (A && keep && fitM) {
    A._mh = 0;
    A.style.minHeight = '';
  } else if (A && keep) {
    const h = A.offsetHeight;
    if (h > (A._mh || 0)) {
      A._mh = h;
    }
    A.style.minHeight = (A._mh || 0) + 'px';
  }
  let fp = null;
  try {
    fp = snapFly();
  } catch (e) {}
  render0();
  try {
    if (typeof requestAnimationFrame === 'function')
      requestAnimationFrame(() => {
        try {
          fitPers();
        } catch (e) {}
      });
  } catch (e) {}
  try {
    runFly(fp);
    if (penFx.length && typeof requestAnimationFrame === 'function')
      requestAnimationFrame(() => {
        try {
          placeFx();
        } catch (e) {}
      });
  } catch (e) {}
  flyLast = S && S.seats && S.deck && S.disc ? flyNow() : null;
  const A2 = $('#app');
  if (A2 && A2.classList && A2.classList.contains && !A2.classList.contains('gm')) {
    A2._mh = 0;
    A2.style.minHeight = '';
  }
  const fix = () => {
    if (Date.now() - usrScr < 400) return;
    if (y0 > 0 && Math.abs(scrY() - y0) > 3)
      try {
        window.scrollTo(0, Math.min(y0, Math.max(0, document.documentElement.scrollHeight - innerHeight)));
      } catch (_) {}
  };
  fix();
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(fix);
    setTimeout(fix, 120);
  }
}
/* uçan taşlar: çizimden önce her taşın yeri ölçülür, sonra yeri değişen taş eski yerinden yenisine uçar
   (desteden ıstakaya, ıstakadan masaya, rakibin ıstakasından masaya ya da atılan taşlara). Istaka içi kayma runFlip'te. */
let flyLast = null; /* son çizimdeki deste sayısı, sıra, atılan taş sayıları (S yeni veriye geçmeden önceki hal) */
const flyNow = () => ({
  deckN: S.deck.length,
  turn: S.turn,
  gid: S.gid,
  dn: [0, 1, 2, 3].map(i => (S.disc['d' + i] || []).length)
});
/* taşın bulunduğu yer türü: ıstaka, masadaki per, atılan taşlar, diğer (gösterge) */
const flyKind = t => (t.closest('#rack') ? 'r' : t.closest('.mini') ? 'm' : t.closest('.dstack') ? 'd' : 'o');
const FLYOK = typeof matchMedia === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
function snapFly() {
  if (
    !fxOn() ||
    !S ||
    !S.seats ||
    S.ph === 'end' ||
    typeof document.querySelectorAll !== 'function' ||
    !document.getElementById('scene')
  )
    return null;
  const m = new Map();
  document.querySelectorAll('#app .t[data-id]').forEach(t => {
    if (t.classList.contains('flyc')) return;
    const r = t.getBoundingClientRect();
    if (r.width) m.set(+t.dataset.id, { r, k: flyKind(t) });
  });
  const src = {};
  document.querySelectorAll('#scene .seat[data-seat]').forEach(e => {
    const o = e.querySelector('.orack') || e.querySelector('.plate');
    if (o) src[e.dataset.seat] = o.getBoundingClientRect();
  });
  const dk = document.getElementById('deck');
  const L = flyLast || flyNow();
  return { m, src, deck: dk ? dk.getBoundingClientRect() : null, ...L };
}
function flyEl(el, from) {
  const to = el.getBoundingClientRect();
  if (!to.width || !from || !from.width) return;
  const dx = from.left + from.width / 2 - (to.left + to.width / 2),
    dy = from.top + from.height / 2 - (to.top + to.height / 2);
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
  const cs = getComputedStyle(el),
    base = el.closest('.dstack') && cs.transform && cs.transform !== 'none' ? cs.transform : '';
  const c = el.cloneNode(true);
  c.removeAttribute('data-id');
  c.classList.remove('pop', 'dnew', 'sel', 'ag');
  c.classList.add('flyc');
  c.style.cssText = `left:${to.left}px;top:${to.top}px;width:${to.width}px;height:${to.height}px;font-size:${cs.fontSize}`;
  document.body.appendChild(c);
  el.style.visibility = 'hidden';
  el.style.animation = 'none';
  const s = Math.max(0.45, Math.min(2.2, from.width / to.width));
  const a = c.animate(
    [{ transform: `translate(${dx}px,${dy}px) scale(${s}) ${base}` }, { transform: base || 'none' }],
    { duration: Math.min(520, 300 + Math.hypot(dx, dy) * 0.35), easing: 'cubic-bezier(.2,.75,.25,1)' }
  );
  const done = () => {
    c.remove();
    el.style.visibility = '';
  };
  a.onfinish = done;
  a.oncancel = done;
  setTimeout(done, 900);
}
function runFly(p) {
  if (!p || !S || S.ph === 'end' || S.gid !== p.gid) return;
  const A = document.getElementById('app');
  if (!A || A.classList.contains('dealing') || A.classList.contains('sinking')) return;
  const todo = [];
  document.querySelectorAll('#app .t[data-id]').forEach(el => {
    if (todo.length >= 8) return;
    const id = +el.dataset.id,
      k = flyKind(el),
      inRack = k === 'r',
      pv = p.m.get(id);
    if (k === 'o') return;
    let from = null;
    if (pv) {
      if (pv.k === k) return;
      from = pv.r;
    } else if (inRack) {
      if (S.deck.length < p.deckN) from = p.deck;
    } else if (k === 'd') {
      const st = el.closest('.seat'),
        i = st ? +st.dataset.seat : -1;
      if (i >= 0 && (S.disc['d' + i] || []).length > (p.dn ? p.dn[i] : 0)) from = p.src[p.turn] || null;
    } else from = p.src[p.turn] || null;
    if (from) {
      todo.push([el, from]);
      el.style.visibility = 'hidden';
    }
  });
  if (!todo.length) return;
  /* ölçümü bir sonraki karede yap: tarayıcının zaten yapacağı yerleşim hesabını tekrar ettirmeyelim */
  /* arada yeniden çizim olduysa aynı taşın yeni öğesini bul */
  const go = () =>
    todo.forEach(([el, from]) => {
      const cur = el.isConnected ? el : document.querySelector(`#app .t[data-id="${el.dataset.id}"]:not(.flyc)`);
      if (cur) flyEl(cur, from);
    });
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(go);
  else go();
}
function placeFx() {
  const fl = document.querySelectorAll('.fxl .pfloat');
  if (!fl.length) return;
  const L = document.querySelector('.fxl');
  if (!L) return;
  const b = L.getBoundingClientRect();
  fl.forEach(x => {
    const pl = document.querySelector(`.seat[data-seat="${x.dataset.fs}"] .plate`);
    if (!pl) return;
    const r = pl.getBoundingClientRect();
    x.style.left = r.left + r.width / 2 - b.left + 'px';
    x.style.top = r.top - b.top + 'px';
  });
}
/* masadaki perler alanına sığmazsa küçülür (kaydırmadan hepsi görünsün); yeni elde sıfırlanır */
let perZ = {},
  perZg = -1,
  perSig = '';
function fitPers() {
  if (!S || !document.body.classList.contains('gmode') || (drag && drag.on)) return;
  const sig =
    S.gid + '|' + tblSig(S) + '|' + innerWidth + 'x' + innerHeight + '|' + (SET.big ? 1 : 0) + '|' + S.ph + S.turn;
  if (sig === perSig) return;
  perSig = sig;
  if (perZg !== S.gid) {
    perZg = S.gid;
    perZ = {};
  }
  document.querySelectorAll('#scene .area').forEach(a => {
    const st = a.querySelector('.seat[data-seat]'),
      p = a.querySelector('.pers');
    if (!st || !p || !p.children.length) return;
    const i = +st.dataset.seat;
    let z = perZ[i] || 1;
    for (let k = 0; k < 6; k++) {
      const ov = a.scrollHeight - a.clientHeight;
      if (ov <= 1 || z <= 0.72) break;
      const ph = p.getBoundingClientRect().height || 1;
      z = Math.max(0.72, Math.floor(z * Math.max(0.6, 1 - (ov + 2) / ph) * 100) / 100);
      p.style.zoom = z;
    }
    perZ[i] = z;
  });
}
function A_p_reset() {
  const A = document.getElementById('app');
  if (A) A._p = null;
}
function render0() {
  const A = $('#app'),
    C = $('#chips');
  if (drag && drag.on) {
    pend = true;
    return;
  }
  if (
    document.activeElement &&
    (document.activeElement.id === 'nm' ||
      document.activeElement.id === 'rn' ||
      document.activeElement.id === 'cd' ||
      document.activeElement.id === 'ap' ||
      document.activeElement.id === 'an')
  )
    return;
  C.innerHTML = '';
  A.className = '';
  A.style.removeProperty('--el');
  if (!ready) {
    if (!A.querySelector('.splash')) A.innerHTML = SPLASH;
    return;
  }
  if (!db || !uid) {
    const nc = typeof claude === 'undefined';
    A.innerHTML = `<div class="panel"><h2>${nc ? 'Bağlantı yok' : 'Giriş gerekli'}</h2><p class="mut" style="margin:0">${nc ? 'Oyun sunucusuna bağlanılamadı. İnternetini kontrol edip sayfayı yenile.' : 'Oyun için giriş yapmış olman gerekiyor. Sayfayı bağlantıyla, claude.ai hesabınla aç.'}</p></div>`;
    return;
  }
  const me = S && S.seats ? S.seats.indexOf(uid) : -1;
  if (document.body) {
    const gm = !!(S && me >= 0);
    document.body.classList.toggle('lobby', !gm);
    document.body.classList.toggle('gmode', gm);
    if (document.documentElement && document.documentElement.classList)
      document.documentElement.classList.toggle('gmode', gm);
    if (!gm) document.body.classList.remove('menu-open');
    if (gm !== liveGm) {
      liveGm = gm;
      syncLive();
    }
  }
  let h = '',
    isHome = false;
  if (S && me >= 0) {
    B = S.B;
    const O = S.okey,
      ended = S.ph === 'end',
      mine = S.turn === me && !ended;
    if (gid !== S.gid) {
      gid = S.gid;
      stage = [];
      sel = [];
      order = [];
      A._mh = 0;
      A.style.minHeight = '';
    }
    const nowT = Date.now();
    if (S.ph !== 'end' && S.gid !== dealGid) {
      dealGid = S.gid;
      dealT = S.trn === 0 && (S.hands[hk(S.start)] || []).length === 15 ? nowT : 0;
    }
    if (S.ph === 'end' && S.gid !== endGid) {
      endGid = S.gid;
      endT = nowT;
    }
    const elD = dealT ? nowT - dealT : 1e9,
      elE = endT ? nowT - endT : 1e9,
      dealing = !ended && elD < 2300,
      finalEnd = ended && S.round + 1 >= S.R;
    if (ended) {
      A.className = 'sinking' + (finalEnd ? ' final' : '');
      A.style.setProperty('--el', Math.min(elE, 60000) + 'ms');
    } else if (dealing) {
      A.className = 'dealing';
      A.style.setProperty('--el', elD + 'ms');
      clearTimeout(dealTimer);
      dealTimer = setTimeout(render, 2400 - elD);
    }
    if (!mine || S.ph !== 'discard') stage = [];
    C.innerHTML =
      `<span class="chip ${S.B ? 'hot' : ''}">El ${S.round + 1}/${S.R} · ${S.B ? 'Büyük 1000' : 'Normal 500'}</span>` +
      (S.dl != null ? `<span class="chip">Dağıtan: ${esc(S.names[S.dl])}</span>` : '') +
      (code ? `<span class="chip">Oda ${esc(code)}</span>` : '');
    const staged = stage.flat(),
      myH = S.hands[hk(me)] || [];
    if (order.length !== SL || order.some(x => x != null && !myH.includes(x))) {
      const had = order.filter(x => x != null && myH.includes(x));
      if (!had.length) {
        const half = Math.ceil(myH.length / 2);
        order = Array(SL).fill(null);
        myH.forEach((x, k) => {
          order[k < half ? k : COLS + (k - half)] = x;
        });
      } else {
        order = Array.from({ length: SL }, (_, k) => (order[k] != null && myH.includes(order[k]) ? order[k] : null));
      }
    }
    if (SET.auto && !(drag && drag.on)) {
      const ak =
        gid +
        ':' +
        myH
          .slice()
          .sort((a, b) => a - b)
          .join(',');
      if (ak !== autoK) {
        autoK = ak;
        try {
          order = smartOrder(myH, O, (S.opm || {})['s' + me] || '');
        } catch (e) {}
      }
    }
    for (const x of myH)
      if (!order.includes(x)) {
        let ok = false;
        if (dropAt && Date.now() - dropAt.t < 4000) {
          ok = placeTile(x, dropAt);
          dropAt = null;
        } else {
          const k = order.indexOf(null);
          if (k >= 0) {
            order[k] = x;
            ok = true;
          }
        }
        if (ok) {
          fresh = { id: x, t: Date.now() };
          if (!dealT || Date.now() - dealT > 2500) newT = { id: x, trn: S.trn, gid: S.gid };
        }
      }
    const pv = (me + 3) % 4,
      pile = S.disc[dk(pv)] || [],
      top = pile.length ? pile[pile.length - 1] : null;
    const need = needRaw(S),
      needS = Math.floor(need / 3) + (need % 3 ? `<small class="yan"> +yandan ${need % 3}</small>` : ''),
      tot = stRaw(stage, O),
      opened = S.opn['s' + me] > 0;
    const canDraw = mine && S.ph === 'draw';
    /* masa */
    const pos = ['me', 'right', 'top', 'left'],
      okeyId = S.B ? -1 : O.c * 26 + O.n - 1;
    const dtile = (id, x) => {
      const v = tv(id, O),
        j = isJ(id, O);
      return `<div class="t c${v.c} ${j ? 'ok' : ''} ${id >= 104 ? 'st' : ''} ${x || ''}" style="--r:${((id * 7) % 9) - 4}deg" data-id="${id}">${id >= 104 ? '★' : v.n}${j ? '<i></i>' : ''}</div>`;
    };
    const seatH = r => {
      const i = (me + r) % 4,
        o = S.opn['s' + i],
        cnt = S.hands[hk(i)].length,
        pl = S.disc[dk(i)] || [];
      const shown = pl.slice(-1),
        hid = 0;
      const fr =
        pl.length && i === (S.turn + 3) % 4 && S.ph === 'draw' && S.tt && S.trn > 0 && !ended && Date.now() - S.tt < 900
          ? 'dnew'
          : '';
      const olds = pl
        .slice(-4, -1)
        .map(
          id =>
            `<div class="t old c${tv(id, O).c}" style="--ox:${((id * 13) % 11) - 5}px;--oy:${((id * 7) % 7) - 3}px;--or:${((id * 17) % 37) - 18}deg">${id >= 104 ? '★' : tv(id, O).n}</div>`
        )
        .join('');
      let yh = '';
      if (r === 3 && canDraw && S.deck.length && SET.hYan && shown.length) {
        try {
          yh = yanHint(shown[shown.length - 1], me);
        } catch (e) {}
      }
      let tiles =
        olds +
        shown
          .map((id, k) =>
            r === 3 && k === shown.length - 1
              ? `<button class="pilebtn ${canDraw && S.deck.length ? 'live' : ''} ${yh ? 'yh' : ''}" id="tk" ${canDraw && S.deck.length ? '' : 'disabled'} aria-label="Soldaki oyuncunun attığı taşı al${yh ? ': ' + yh : ''}">${dtile(id, fr)}${yh ? `<span class="yhl">${yh}</span>` : ''}</button>`
              : dtile(id, fr)
          )
          .join('');
      if (hid > 0) tiles = `<span class="more">+${hid}</span>` + tiles;
      const pz = S.scores['s' + i] || 0,
        avk = seatAv(S.seats[i]);
      const bl = ended && i !== S.win && !(o > 0) && !(S.pair && S.win >= 0 && S.win < 4 && isMate(S, S.win, i));
      return `<div class="seat sc${i} ${S.turn === i && !ended ? 'turn' : ''}" data-seat="${i}">
<div class="plate ${bl ? 'bloody' : ''}">${bl ? '<i class="bsp" aria-hidden="true"></i>' : ''}<span class="av ${avk >= 0 ? 'has' : ''}">${avk >= 0 ? avI(avk) : esc(S.names[i].slice(0, 1).toUpperCase())}</span><div class="pn"><b>${esc(S.names[i])}${i === me ? '<em>sen</em>' : S.pair && isMate(S, me, i) ? '<em>eşin</em>' : ''}</b><small>${o > 0 && cnt <= 3 && !ended && i !== me ? `<span class="nf" title="Bitirmek üzere: ${cnt} taş kaldı">bitiyor!</span>` : `${cnt} taş${o > 0 ? ' · açtı ' + o : ''}`}${pz ? `<span class="pb" title="Toplam ceza">${pz}</span>` : ''}</small></div></div>
${i === me ? '' : orack(r, cnt)}
<div class="dpile" aria-label="${esc(S.names[i])} attığı taşlar">${tiles ? `<div class="dstack" style="--pe:${S.tt ? Math.max(0, Date.now() - S.tt) : 0}ms">${tiles}</div>` : ''}</div>${persH(i)}</div>`;
    };
    const rnd = n => {
      const v = Math.sin(n * 78.233 + 1.37) * 43758.5453;
      return v - Math.floor(v);
    };
    const chaosH =
      ended && !finalEnd
        ? `<div class="chaos" aria-hidden="true">${Array.from({ length: 36 }, (_, k) => {
            const c = Math.floor(rnd(k * 9 + 7) * 4),
              n = 1 + Math.floor(rnd(k * 9 + 8) * 13),
              px = v => Math.round(v) + 'px',
              r1 = Math.round(rnd(k * 9 + 5) * 360);
            return `<div class="t c${c}" style="--x1:${px((rnd(k * 9 + 1) - 0.5) * 220)};--y1:${px((rnd(k * 9 + 2) - 0.5) * 250)};--x2:${px((rnd(k * 9 + 3) - 0.5) * 220)};--y2:${px((rnd(k * 9 + 4) - 0.5) * 250)};--r1:${r1}deg;--r2:${r1 + Math.round((rnd(k * 9 + 6) - 0.5) * 320)}deg;--t:${(0.4 + rnd(k * 9 + 0) * 0.6).toFixed(2)}s">${n}</div>`;
          }).join('')}</div>`
        : '';
    let mid = `<div class="okeyrow">${S.B ? '<span class="lab">Joker (★) = okey</span>' : `<div class="grp"><span class="lab">Gösterge</span><span class="gf">${tile(S.ind, O)}</span></div>`}</div>
<div class="pile"><span class="lab">Deste</span>${ended ? '' : needleH(me)}<button class="pilebtn ${canDraw ? 'live' : ''}" id="deck" ${canDraw ? '' : 'disabled'} aria-label="Desteden çek, ${S.deck.length} taş kaldı"><span class="back">${S.deck.length}</span></button></div>`;
    const tg = i => (S.tbl['t' + i] || []).filter(g => g && g.g);
    const insOK = mine && S.ph === 'discard' && opened;
    const insT = insOK && sel.length === 1 && sel[0] !== S.must ? sel[0] : null;
    const insP = insOK && sel.length === 2 && !sel.includes(S.must) ? prs(sel, O) : -1;
    const jt = (v, k, ly) =>
      `<div class="t ok c3 jk${ly ? ' ly' : ''}" data-x="${k}" title="okey = ${v}"><b class="js">★</b><small class="jv">${v}</small></div>`;
    const persH = i => {
      const seenP = {};
      return `<div class="pers" style="${perZ[i] && perZ[i] < 1 ? 'zoom:' + perZ[i] : ''}">${(S.tbl['t' + i] || [])
        .map((r, gi) => {
          if (!r || !r.g) return '';
          const ends =
            insT != null ? canAdd(r, insT, O).filter(e => !(S.ik || []).includes(i + ':' + gi + ':' + e)) : [];
          const btn = (e, l) =>
            ends.includes(e)
              ? `<button class="ins" data-ins="${i}:${gi}:${e}" aria-label="Taşı bu pere işle">${l}</button>`
              : '';
          let ex = '';
          if (insT != null)
            r.g.forEach((x, k) => {
              if (isJ(x, O) && canSwap(r, k, insT, O))
                ex += `<button class="ins" data-ins="${i}:${gi}:x${k}" aria-label="Okeyi bu taşla değiştir">⇄</button>`;
            });
          if (insP >= 0 && r.k === 'p' && r.n === insP && !seenP[r.n]) {
            seenP[r.n] = 1;
            ex += `<button class="ins" data-ins="${i}:${gi}:P" aria-label="Çifti bu çifte işle">+ çift</button>`;
          }
          return `<div class="mini grow" data-o="${i}" data-gi="${gi}">${btn('l', '◀ +')}${r.g
            .map((x, k) => {
              const ly = r.x && r.x.includes(x);
              return isJ(x, O) ? jt(slotVal(r, k, O), k, ly) : tile(x, O, ly ? 'ly' : '');
            })
            .join('')}${btn('h', '+ ▶')}${btn('s', '+')}${ex}</div>`;
        })
        .join('')}</div>`;
    };
    const md = mine && S.ph === 'discard';
    const auto0 =
      md && !stage.length
        ? autoOpen(order, O, S.must, opened ? (S.opm || {})['s' + me] : '')
        : { groups: [], pts: 0, kind: 'p' };
    const auto = pickG(auto0, O);
    const agSet = new Set(auto.groups.flat()),
      agOff = new Set(auto0.groups.flat().filter(x => !agSet.has(x)));
    /* "Per aç" düğmesinin durumu: tablo hesabı gösterilmez, sebebi uyarı olarak çıkar */
    let canOk = false;
    if (md) {
      const have = stage.length > 0 || auto.groups.length > 0,
        pts = stage.length ? tot : auto.pts * 3 + (auto.rem || 0);
      const mustIn = S.must < 0 || (stage.length ? staged.includes(S.must) : agSet.has(S.must));
      canOk = have && mustIn && !auto.bad && !(!opened && S.trn < 4) && (opened || pts >= need);
    }
    const openKind = stage.length ? (stage.every(g => g.length === 2) ? 'c' : 'p') : auto.kind;
    const sgroups =
      md && stage.length
        ? `<div class="sgroups">${stage.map((g, gi) => `<div class="g">${g.map(x => tile(x, O)).join('')}<button class="un" data-un="${gi}" aria-label="Bu grubu ıstakaya geri koy">✕</button></div>`).join('')}<button id="clr">Hepsini geri al</button></div>`
        : '';
    /* durum */
    let st, tag;
    if (ended) {
      tag = '<span class="tag wait">Bitti</span>';
      st = finalEnd
        ? 'Oyun bitti.'
        : S.win === 99
          ? 'Deste bitti.'
          : S.win === me
            ? 'Eli bitirdin!'
            : esc(S.names[S.win]) + ' eli bitirdi!';
    } else if (mine) {
      tag = '<span class="tag">Sıra sende</span>';
      st =
        S.ph === 'draw'
          ? S.deck.length
            ? 'Desteden çek ya da soldaki taşı al.'
            : 'Deste bitti: desteye dokun.'
          : S.must >= 0
            ? 'Yandan taş aldın: onu açmalısın.'
            : 'Taş at, aç ya da eli bitir.';
    } else {
      tag = '<span class="tag wait">Bekle</span>';
      st = esc(S.names[S.turn]) + ' oynuyor…';
    }
    h += `<div class="panel gstat"><div class="status">${tag}<b>${st}</b><button class="rxbtn" id="rxB" aria-label="Sohbet${chatUnread() ? ', ' + chatUnread() + ' yeni mesaj' : ''}">💬${chatUnread() ? `<i class="chn">${Math.min(9, chatUnread())}</i>` : ''}</button><button class="penbtn" id="pen" aria-expanded="${showPen}">Cezalar</button></div>${timerH(mine)}${lmvH()}${showPen ? penPanel() : ''}`;
    h += '</div><!--SEC-->';
    /* masa */
    A.classList.add('gm');
    h += `<div class="scene ${Date.now() - flashPen < 1200 ? 'pflash' : ''}" id="scene" style="--pe:${Math.max(0, Date.now() - flashPen)}ms"><div class="board"><div class="felt3d">${STAMP}<div class="area a-top">${seatH(2)}</div><div class="area a-left">${seatH(3)}</div><div class="area a-mid">${mid}</div><div class="area a-right">${seatH(1)}</div><div class="area a-me">${seatH(0)}</div>${chaosH}</div></div><div class="fxl" aria-hidden="true">${penFx
      .filter(x => Date.now() - x.t < 2100)
      .map(x => `<span class="pfloat" data-fs="${x.i}" style="--pe:${Date.now() - x.t}ms">+${x.v}</span>`)
      .join('')}</div>${ended ? endH(me, elE, finalEnd) : ''}</div>`;
    /* ıstaka */
    const arr = pickG(
        autoOpen(
          order.map(x => (x != null && !staged.includes(x) ? x : null)),
          O,
          -1,
          opened ? (S.opm || {})['s' + me] : ''
        ),
        O
      ),
      hp = arr.pts,
      hpr = hp * 3 + (arr.rem || 0),
      ptsOk = !opened && hpr >= need;
    h += '<!--SEC--><div class="rackbox">';
    let hl = `Istakan · ${myH.length} taş`;
    if (SET.hAc && !opened && !ended) {
      try {
        const ah = acHint(me, need);
        if (ah.ok)
          hl =
            hpr >= ah.best
              ? `<span class="hok">✓ Açabilirsin</span>`
              : `<span class="hok">En iyi açılış ${fmtP(ah.best)}</span>${SET.smart ? ' · Sırala' : ''}`;
        else if (SET.lvl === 'kolay' && ah.need && ah.need.length)
          hl = `<span class="hneed">Açmak için:</span> ${ah.need.map(x => `<i class="hn c${tv(x, O).c}">${tv(x, O).n}</i>`).join('')}`;
        else if (ah.need) hl = `En iyi ${fmtP(ah.best)} / ${needS}`;
      } catch (e) {}
    }
    let finS = null;
    if (SET.lvl === 'kolay' && md && opened && S.ot !== me) {
      try {
        finS = new Set(
          myH.filter(x =>
            canEnd(
              S,
              me,
              myH.filter(y => y !== x)
            )
          )
        );
      } catch (e) {}
      if (finS && finS.size) {
        const okF = [...finS].some(x => isJ(x, O));
        hl = `<span class="hok">Bitirebilirsin!${okF ? ' Okeyle ×2' : ''}</span>`;
      }
    }
    const isl =
      SET.hIs && opened && md
        ? new Set(
            myH.filter(x => {
              try {
                return canIsle(x, me);
              } catch (e) {
                return false;
              }
            })
          )
        : null;
    h += `<div><div class="rlabel"><span class="lab hlab">${hl}</span><button class="fcs" id="fcs" aria-pressed="${!!SET.focus}" aria-label="Istakaya odaklan (taşları büyüt)" title="Odak">${SET.focus ? '⤡' : '⤢'}</button><span class="pbadge ${ptsOk ? 'go' : ''}" role="status">${md && auto.bad ? '<b>6+ taşlık per olmaz: ikiye ayır</b>' : opened ? `Açtığın <b>${S.opn['s' + me]}</b>` : `${arr.part ? 'Seçilen' : 'Dizilen'} <b>${hp}</b>${arr.rem ? `<small class="yan"> +yandan ${arr.rem}</small>` : ''} / ${needS}`}</span></div><div class="rack" id="rack" style="--pe:${Math.max(0, Date.now() - fresh.t)}ms">${order.map((id, i) => `<div class="rs" data-s="${i}">${id != null && !staged.includes(id) ? (isl && isl.has(id) ? tile(id, O, (sel.includes(id) ? 'sel ' : '') + (agSet.has(id) ? 'ag ' : agOff.has(id) ? 'ag2 ' : '') + (fresh.id === id && Date.now() - fresh.t < 700 ? 'pop ' : '') + (newT.id === id && newT.gid === S.gid && newT.trn === S.trn && mine && S.ph === 'discard' ? 'nw ' : '') + (finS && finS.has(id) ? 'fin' : '')).replace(/<\/div>$/, '<b class="isb" aria-label="işlenebilir">+</b></div>') : tile(id, O, (sel.includes(id) ? 'sel ' : '') + (agSet.has(id) ? 'ag ' : agOff.has(id) ? 'ag2 ' : '') + (fresh.id === id && Date.now() - fresh.t < 700 ? 'pop ' : '') + (newT.id === id && newT.gid === S.gid && newT.trn === S.trn && mine && S.ph === 'discard' ? 'nw ' : '') + (finS && finS.has(id) ? 'fin' : ''))) : ''}</div>`).join('')}</div></div>
${sgroups}<div class="acts3"><button class="p ${canOk ? '' : 'dim'}" id="open" ${md ? '' : 'disabled'}>${openKind === 'c' ? 'Çift aç' : 'Per aç'}</button><button class="p" id="dis" ${md && sel.length === 1 ? '' : 'disabled'}>At</button><button id="fin" ${md && sel.length === 1 ? '' : 'disabled'}>Bitir</button><button id="sort">Sırala</button></div>
${md && S.must >= 0 ? '<div class="acts"><button id="back">Taşı geri koy</button></div>' : ''}
<div class="xtra" role="dialog" aria-modal="true" aria-label="Menü"><div class="xsheet"><div class="xh"><b>Menü</b><button id="menuX">Kapat</button></div><div class="xtg"><button class="setc" id="setO">⚙ Ayarlar</button><button class="tg" data-tg="snd" aria-pressed="${SFX.snd}">Ses</button><a href="${RULES_URL}">Kurallar</a>${SRV && !isStandalone() ? '<button id="inst">Telefona ekle</button>' : ''}${SRV ? '<button id="repO">🐞 Bildir</button>' : ''}${SRV && CFG.pub && ROOM && ROOM.host === uid ? `<button class="tg" id="pubT" aria-pressed="${!!ROOM.pub}">Herkese açık</button>` : ''}${newVer ? '<button class="p" id="reload">Yeni sürüm: yenile</button>' : ''}</div><small class="mut xinfo">${code ? 'Oda <b>' + esc(code) + '</b>' : ''}${S.dl != null ? ' · Dağıtan: ' + esc(S.names[S.dl]) : ''} · El ${S.round + 1}/${S.R}</small><details class="hint" ${hintOpen ? 'open' : ''}><summary>Nasıl kullanılır?</summary>Taşa dokunarak seç, basılı tutup istediğin yuvaya sürükle. Taşı masaya bırakırsan atılır, açılmış bir pere bırakırsan işlenir (okeyin üstüne bırakırsan değiştirir). Sıran gelince desteyi ya da soldaki taşı da ıstakana sürükleyip istediğin yuvaya bırakabilirsin. Per ya da çiftlerini yan yana diz, ayrı perlerin arasına boşluk bırak: yeşil çerçeveli taşlar ıstakanın altındaki "Per aç" ile açılır. Hepsini açmak istemiyorsan açmak istediğin perlerden birer taşa dokun, "Per aç" sadece onları açar. Puan: taşların toplamı 3'e bölünür, artan "yandan" diye görünür. Seri en fazla 5 taş olur; 6 ya da 7 taşlık seriyi 3+3 ya da 3+4 diye ikiye ayırıp araya boşluk bırak. Per ve çift aynı anda açılmaz. Son taşı atınca el biter (açtığın tur hariç). Çift açtıysan elinde tek taş kalıp onu atınca biter.</details><div class="row" style="margin-top:2px"><button id="home">Ana ekran</button><small class="mut">Oyun devam eder, kodla geri girebilirsin.</small></div></div></div></div>`;
    h += '<!--SEC-->';
    /* uyarı: ekranın üstünde kısa süre görünür */
    if (msg !== lastMsg) {
      lastMsg = msg;
      msgT = msg ? Date.now() : 0;
    }
    toastSync();
  } else if (view === 'admroom' && isAdmin) {
    h += admRoomH();
  } else if (view === 'admin' && isAdmin) {
    h += adminH();
  } else if (view === 'room' && code) {
    h += roomH();
  } else {
    h += homeH();
    isHome = true;
  }
  if (false) {
    /* eski masa kaldırıldı */
  }
  h =
    (CFG.bk
      ? `<div class="ann" role="status"><b>🔧 Bakım</b> Kısa süre sonra güncelleme var. Yeni oyun başlatılamıyor, süren oyunlar devam ediyor.</div>`
      : '') +
    (CFG.ann ? `<div class="ann" role="status"><b>Duyuru</b> ${esc(CFG.ann)}</div>` : '') +
    '<!--SEC-->' +
    h;
  const parts = h.split('<!--SEC-->');
  if (
    A._p &&
    A._p.length === parts.length &&
    A.children.length === parts.length &&
    A.firstElementChild.className === 'sec'
  ) {
    for (let i = 0; i < parts.length; i++) if (parts[i] !== A._p[i]) A.children[i].innerHTML = parts[i];
  } else A.innerHTML = parts.map(p => `<div class="sec">${p}</div>`).join('');
  A._p = parts;
  if (!(S && S.seats && S.seats.indexOf(uid) >= 0) && toastEl) hideToast(true);
  if (document.body && document.body.classList) document.body.classList.toggle('home', isHome);
  if (flip) runFlip();
  scheduleBot();
  scheduleNext();
  recEnd();
  if (typeof paintRing === 'function') paintRing();
}
