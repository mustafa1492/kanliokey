/* sürükle-bırak: ıstakada yer değiştirme, masaya bırakıp atma, perlere işleme, desteden / yandan taş alma */
let drag = null,
  pend = false,
  lastDrag = 0,
  flip = null,
  warnI = { id: -1, t: 0 };
const snapRects = () => {
  const m = {};
  document.querySelectorAll('#rack .t[data-id]').forEach(t => {
    const r = t.getBoundingClientRect();
    m[t.dataset.id] = [r.left, r.top];
  });
  return m;
};
function runFlip() {
  const m = flip;
  flip = null;
  if (!m || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  document.querySelectorAll('#rack .t[data-id]').forEach(t => {
    const p = m[t.dataset.id];
    if (!p) return;
    const r = t.getBoundingClientRect(),
      dx = p[0] - r.left,
      dy = p[1] - r.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    if (t.animate)
      t.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], {
        duration: 220,
        easing: 'cubic-bezier(.2,.8,.3,1)'
      });
  });
}
const canDiscard = () => !!(S && S.seats && S.seats[S.turn] === uid && S.ph === 'discard');
/* akıllı sıralama: en yüksek açılışı veren perler (ya da çiftler) yan yana, aralarında boşluk; kalan taşlar renge göre */
function arrangeG(g, O) {
  const nat = g.filter(x => !isJ(x, O)),
    jk = g.filter(x => isJ(x, O));
  if (!nat.length || nat.every(x => tv(x, O).n === tv(nat[0], O).n)) return [...nat, ...jk];
  const a = nat.slice().sort((x, y) => tv(x, O).n - tv(y, O).n),
    out = [];
  let j = [...jk];
  for (let i = 0; i < a.length; i++) {
    if (i) {
      let gap = tv(a[i], O).n - tv(a[i - 1], O).n - 1;
      while (gap-- > 0 && j.length) out.push(j.shift());
    }
    out.push(a[i]);
  }
  while (j.length) {
    if (tv(a[a.length - 1], O).n + 1 <= 13) out.push(j.shift());
    else out.unshift(j.shift());
  }
  return out;
}
function pairPlan(h, O) {
  const by = new Map(),
    jk = [];
  for (const x of h) {
    if (isJ(x, O)) {
      jk.push(x);
      continue;
    }
    const k = tv(x, O).c * 13 + tv(x, O).n;
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(x);
  }
  const pairs = [],
    singles = [];
  for (const [k, v] of by) {
    if (v.length >= 2) pairs.push([v[0], v[1]]);
    else singles.push(v[0]);
  }
  singles.sort((a, b) => tv(b, O).n - tv(a, O).n);
  for (const j of jk) {
    const x = singles.shift();
    if (x == null) break;
    pairs.push([x, j]);
  }
  while (pairs.length && pairs.flat().length > h.length - 1) {
    pairs.sort((a, b) => prs(b, O) - prs(a, O));
    pairs.pop();
  }
  const sum = pairs.reduce((a, p) => a + prs(p, O), 0);
  return { groups: pairs, pts: Math.floor((sum * 2) / 3), raw: sum * 2 };
}
function smartOrder(h, O, mode) {
  let groups = [],
    pp = null;
  if (mode !== 'c') {
    pp = openPlan(h, O, 0, 0, 30000, 1);
    if (pp) groups = pp.map(g => arrangeG(g, O));
  }
  const pPts = pp ? Math.floor(pp.pts / 3) : 0;
  if (mode !== 'p') {
    const cp = pairPlan(h, O);
    if (mode === 'c' || cp.pts > pPts) groups = cp.groups;
  }
  groups.sort((a, b) => b.length - a.length);
  const used = new Set(groups.flat()),
    rest = h
      .filter(x => !used.has(x))
      .sort(
        (a, c) => (isJ(a, O) ? 999 : tv(a, O).c * 20 + tv(a, O).n) - (isJ(c, O) ? 999 : tv(c, O).c * 20 + tv(c, O).n)
      );
  const out = Array(SL).fill(null);
  let pos = 0;
  const put = g => {
    let row = Math.floor(pos / COLS),
      end = (row + 1) * COLS;
    if (pos + g.length > end) {
      pos = end;
      row++;
      end = (row + 1) * COLS;
    }
    if (pos + g.length > SL) return false;
    g.forEach(x => (out[pos++] = x));
    return true;
  };
  const left = [];
  for (const g of groups) {
    if (!put(g)) left.push(...g);
    else if (pos % COLS) pos++;
  }
  const tail = [...left, ...rest];
  if (tail.length) {
    if (pos % COLS && pos + tail.length > SL) pos--;
  }
  for (const x of tail) {
    while (pos < SL && out[pos] != null) pos++;
    if (pos < SL) out[pos++] = x;
    else {
      const k = out.indexOf(null);
      if (k >= 0) out[k] = x;
    }
  }
  return out;
}
function sortRack() {
  if (SET.smart) {
    const me = S.seats.indexOf(uid),
      h = order.filter(x => x != null);
    B = S.B;
    try {
      order = smartOrder(h, S.okey, (S.opm || {})['s' + me] || '');
      return;
    } catch (e) {}
  }
  const O = S.okey,
    cc = x => (isJ(x, O) ? 9 : tv(x, O).c),
    k = x => (isJ(x, O) ? 999 : tv(x, O).c * 20 + tv(x, O).n);
  const ids = order.filter(x => x != null).sort((a, c) => k(a) - k(c));
  let ch = 0,
    pc = null;
  ids.forEach(x => {
    const c = cc(x);
    if (pc !== null && c !== pc) ch++;
    pc = c;
  });
  const gap = ids.length + ch <= SL,
    seq = [];
  pc = null;
  ids.forEach(x => {
    const c = cc(x);
    if (gap && pc !== null && c !== pc) seq.push(null);
    pc = c;
    seq.push(x);
  });
  order = Array.from({ length: SL }, (_, i) => (i < seq.length ? seq[i] : null));
}
function dropOnPer(o, gi, id, x, jx, want) {
  B = S.B;
  const O = S.okey,
    r = (S.tbl['t' + o] || [])[gi];
  if (!canDiscard()) {
    msg = 'Taş işlemek için sıranın sende olması ve önce taş çekmiş olman gerekir.';
    render();
    return;
  }
  if (!r) {
    render();
    return;
  }
  if (sel.length === 2 && sel.includes(id) && r.k === 'p') {
    insertPair(o, gi);
    return;
  }
  sel = [id];
  if (jx != null && canSwap(r, jx, id, O)) {
    swapOkey(o, gi, jx);
    return;
  }
  const all = canAdd(r, id, O);
  if (!all.length) {
    const k = r.g.findIndex((y, k) => isJ(y, O) && canSwap(r, k, id, O));
    if (k >= 0) {
      swapOkey(o, gi, k);
      return;
    }
    msg = 'Bu taş bu pere işlenmiyor.';
    render();
    return;
  }
  const free = all.filter(e => !(S.ik || []).includes(o + ':' + gi + ':' + e));
  const el = document.querySelector(`.mini.grow[data-o="${o}"][data-gi="${gi}"]`);
  if (!free.length) {
    msg = 'Bu perin o ucuna bu tur zaten işledin; aynı uca arka arkaya işlenmez.';
    render();
    return;
  }
  if (want && free.includes(want)) {
    insertTile(o, gi, want);
    return;
  }
  let e = free[0];
  if (free.length > 1 && el) {
    const rc = el.getBoundingClientRect(),
      left = x < rc.left + rc.width / 2;
    e = left && free.includes('l') ? 'l' : free.includes('h') ? 'h' : free[0];
  }
  insertTile(o, gi, e);
}
$('#app').addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const t = e.target.closest('#rack .t[data-id]');
  if (t) {
    drag = {
      t0: Date.now(),
      kind: 'rack',
      id: +t.dataset.id,
      el: t,
      x: e.clientX,
      y: e.clientY,
      pid: e.pointerId,
      on: false,
      over: null,
      disc: false,
      ins: null,
      from: -1
    };
    return;
  }
  const b = e.target.closest('#deck,#tk');
  if (b && !b.disabled)
    drag = {
      t0: Date.now(),
      kind: b.id,
      el: b,
      x: e.clientX,
      y: e.clientY,
      pid: e.pointerId,
      on: false,
      over: null,
      hot: false
    };
});
let hintOpen = false,
  agOpen = false;
if (typeof document !== 'undefined' && document.addEventListener)
  document.addEventListener(
    'toggle',
    e => {
      const t = e.target;
      if (t && t.classList) {
        if (t.classList.contains('hint')) hintOpen = t.open;
        if (t.classList.contains('agate')) agOpen = t.open;
      }
    },
    true
  );
let slotCache = null;
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener(
    'scroll',
    () => {
      slotCache = null;
    },
    { passive: true, capture: true }
  );
  window.addEventListener(
    'resize',
    () => {
      slotCache = null;
    },
    { passive: true }
  );
}
function slotAt(x, y) {
  const rk = $('#rack');
  if (!rk) return null;
  if (drag && drag.on) {
    if (!slotCache || slotCache.rk !== rk)
      slotCache = {
        rk,
        R: rk.getBoundingClientRect(),
        L: [...rk.querySelectorAll('.rs')].map(el => ({ el, r: el.getBoundingClientRect() }))
      };
    const R = slotCache.R;
    if (x < R.left - 12 || x > R.right + 12 || y < R.top - 14 || y > R.bottom + 14) return null;
    let best = null,
      bd = 1e9;
    for (const o of slotCache.L) {
      const r = o.r,
        dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0,
        dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0,
        dd = dx * dx + dy * dy;
      if (dd < bd) {
        bd = dd;
        best = o;
      }
      if (dd === 0) break;
    }
    if (best) best.el._r = best.r;
    return best ? best.el : null;
  }
  const R = rk.getBoundingClientRect();
  if (x < R.left - 12 || x > R.right + 12 || y < R.top - 14 || y > R.bottom + 14) return null;
  let best = null,
    bd = 1e9;
  for (const el of rk.querySelectorAll('.rs')) {
    const r = el.getBoundingClientRect(),
      dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0,
      dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0,
      dd = dx * dx + dy * dy;
    if (dd < bd) {
      bd = dd;
      best = el;
    }
    if (dd === 0) break;
  }
  return best;
}
const isFree = i => order[i] == null || stage.flat().includes(order[i]);
/* taşı yuvaya koy; dolu yuvaya bırakılırsa araya sokar ve komşuları kaydırır */
function placeTile(id, t) {
  const i = order.indexOf(id);
  if (i >= 0) order[i] = null;
  const idx = t.idx,
    row = Math.floor(idx / COLS),
    rs = row * COLS,
    re = rs + COLS;
  if (isFree(idx)) {
    order[idx] = id;
    return true;
  }
  if (t.ins) {
    const p = t.right ? idx + 1 : idx;
    if (i >= rs && i < re) {
      if (i < p) {
        for (let k = i; k < p - 1; k++) order[k] = order[k + 1];
        order[p - 1] = id;
      } else {
        for (let k = i; k > p; k--) order[k] = order[k - 1];
        order[p] = id;
      }
      return true;
    }
    let j = -1;
    for (let k = p; k < re; k++)
      if (isFree(k)) {
        j = k;
        break;
      }
    if (j >= 0) {
      for (let k = j; k > p; k--) order[k] = order[k - 1];
      order[p] = id;
      return true;
    }
    let q = -1;
    for (let k = p - 1; k >= rs; k--)
      if (isFree(k)) {
        q = k;
        break;
      }
    if (q >= 0) {
      for (let k = q; k < p - 1; k++) order[k] = order[k + 1];
      order[p - 1] = id;
      return true;
    }
  }
  if (i >= 0) {
    order[i] = order[idx];
    order[idx] = id;
    return true;
  }
  const k = order.findIndex((x, n) => isFree(n));
  if (k >= 0) {
    order[k] = id;
    return true;
  }
  return false;
}
/* sürüklerken dolu yuvaya gelince komşu taşlar kayarak yer açar (üst üste binmez); bırakınca aynı yere oturur */
function pvPush(d) {
  const k = d.tgt ? d.tgt.idx + ':' + (d.tgt.ins ? 1 : 0) + ':' + (d.tgt.right ? 1 : 0) : '';
  if (k === d.pvK) return;
  d.pvK = k;
  if (!d.pvEls) {
    d.pvEls = new Map();
    document.querySelectorAll('#rack .rs .t[data-id]').forEach(el => {
      if (el !== d.el) d.pvEls.set(+el.dataset.id, el);
    });
  }
  let sim = null;
  if (d.tgt && slotCache) {
    const sv = order;
    order = sv.slice();
    try {
      placeTile(d.kind === 'rack' ? d.id : -999, d.tgt);
      sim = order;
    } catch (e) {}
    order = sv;
  }
  d.pvEls.forEach((el, id) => {
    const a = order.indexOf(id),
      b = sim ? sim.indexOf(id) : a;
    if (a < 0 || b < 0 || a === b || !slotCache || !slotCache.L[a] || !slotCache.L[b]) {
      if (el.style.transform) {
        el.style.transform = '';
      }
      return;
    }
    const ra = slotCache.L[a].r,
      rb = slotCache.L[b].r;
    el.classList.add('pv');
    el.style.transform =
      `translate(${Math.round(rb.left - ra.left)}px,${Math.round(rb.top - ra.top)}px)` +
      (el.classList.contains('sel') ? ' translateY(-10px)' : '');
  });
}
function pvClear(d) {
  if (d && d.pvEls)
    d.pvEls.forEach(el => {
      el.style.transform = '';
      el.classList.remove('pv');
    });
}
function markSlot(d, x, y) {
  const sl = slotAt(x, y);
  d.tgt = null;
  let cls = '',
    el = null;
  if (sl) {
    const idx = +sl.dataset.s;
    if (idx !== d.from) {
      el = sl;
      if (!sl.querySelector('.t')) {
        d.tgt = { idx, ins: false };
        cls = 'over';
      } else {
        const r = sl._r || sl.getBoundingClientRect(),
          right = x > r.left + r.width / 2;
        d.tgt = { idx, ins: true, right };
        cls = right ? 'ibr' : 'ibl';
      }
    }
  }
  if (d.mkEl !== el || d.mkC !== cls) {
    if (d.mkEl && d.mkEl.isConnected) d.mkEl.classList.remove('over', 'ibl', 'ibr');
    else
      document
        .querySelectorAll('#rack .rs.over,#rack .rs.ibl,#rack .rs.ibr')
        .forEach(e => e.classList.remove('over', 'ibl', 'ibr'));
    if (el && cls) el.classList.add(cls);
    d.mkEl = el;
    d.mkC = cls;
  }
  try {
    pvPush(d);
  } catch (e) {}
  return !!sl;
}
function dragMove(e) {
  if (!drag || e.pointerId !== drag.pid) return;
  if (!drag.on) {
    dragMoveNow(e);
    return;
  }
  e.preventDefault();
  drag.last = e;
  if (!drag.raf)
    drag.raf = requestAnimationFrame(() => {
      const d = drag;
      if (!d) return;
      d.raf = 0;
      if (d.last) dragMoveNow(d.last);
    });
}
function dragMoveNow(e) {
  if (!drag) return;
  const d = drag,
    app = $('#app');
  if (!d.on) {
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
    d.on = true;
    d.lift = e.pointerType === 'mouse' ? 0 : 38;
    SFX.play('pick');
    if (d.kind === 'rack') {
      if (!d.el.isConnected) {
        const n = document.querySelector(`#rack .t[data-id="${d.id}"]`);
        if (n) d.el = n;
      }
      const el = d.el,
        r = el.getBoundingClientRect();
      d.ox = d.x - r.left;
      d.oy = d.y - r.top;
      d.from = +el.parentNode.dataset.s;
      el.classList.remove('pop');
      el.classList.add('drag');
      el.style.width = r.width + 'px';
      el.style.height = r.height + 'px';
      if (canDiscard()) app.classList.add('candrop');
    } else {
      const g = d.kind === 'deck' ? document.createElement('div') : d.el.querySelector('.t').cloneNode(true);
      g.classList.add('ghost');
      if (d.kind === 'deck') g.classList.add('bk');
      g.removeAttribute('id');
      document.body.appendChild(g);
      d.ghost = g;
      const pl = d.el.closest('.pile');
      if (pl) pl.classList.add('pulled');
    }
    app.classList.add('dragging');
  }
  e.preventDefault();
  const hy = e.clientY - d.lift;
  if (d.kind !== 'rack') {
    d.ghost.style.transform = `translate3d(${e.clientX}px,${hy}px,0) translate(-50%,-50%) scale(1.15)`;
    if (!d.rbR) {
      const rb0 = $('.rackbox');
      d.rbR = rb0 ? rb0.getBoundingClientRect() : null;
    }
    const R0 = d.rbR,
      hot = !!(R0 && e.clientX >= R0.left && e.clientX <= R0.right && hy >= R0.top && hy <= R0.bottom);
    if (hot !== d.hot) {
      d.hot = hot;
      const rb = $('.rackbox');
      if (rb) rb.classList.toggle('hot', hot);
    }
    markSlot(d, e.clientX, hy);
    return;
  }
  const el = d.el;
  el.style.transform = `translate3d(${e.clientX - d.ox}px,${hy - d.oy}px,0) scale(1.12)`;
  const near = markSlot(d, e.clientX, hy);
  /* masadaki perleri ve masayı sürükleme başında bir kez ölç; her karede hit-test yapma */
  if (!d.zc) {
    const inter = (a, b) => ({
      left: Math.max(a.left, b.left),
      top: Math.max(a.top, b.top),
      right: Math.min(a.right, b.right),
      bottom: Math.min(a.bottom, b.bottom)
    });
    const sc0 = $('#scene');
    const okI = canDiscard() && S.opn['s' + S.seats.indexOf(uid)] > 0;
    B = S.B;
    const fits = el => {
      if (!okI) return false;
      const o = +el.dataset.o,
        gi = +el.dataset.gi,
        r = (S.tbl['t' + o] || [])[gi];
      if (!r) return false;
      if (canAdd(r, d.id, S.okey).some(e => !(S.ik || []).includes(o + ':' + gi + ':' + e))) return true;
      return r.g.some((y, k) => isJ(y, S.okey) && canSwap(r, k, d.id, S.okey));
    };
    d.zc = {
      sc: sc0 ? sc0.getBoundingClientRect() : null,
      m: [...document.querySelectorAll('.mini.grow')]
        .map(el => {
          const ar = el.closest('.area');
          let r = el.getBoundingClientRect();
          if (ar) r = inter(r, ar.getBoundingClientRect());
          const c = fits(el);
          if (c) el.classList.add('can');
          return {
            el,
            r,
            c,
            j: [...el.querySelectorAll('.t[data-x]')].map(t => ({ t, r: t.getBoundingClientRect() }))
          };
        })
        .filter(o => o.r.right > o.r.left && o.r.bottom > o.r.top)
        .sort((a, b) => b.c - a.c)
    };
  }
  const X = e.clientX,
    inR = (r, p) => r && X >= r.left - p && X <= r.right + p && hy >= r.top - p && hy <= r.bottom + p;
  let mo = null,
    md = 1e9;
  if (!near)
    for (const o of d.zc.m) {
      const p = o.c ? 22 : 3;
      if (!inR(o.r, p)) continue;
      const r = o.r,
        dx = X < r.left ? r.left - X : X > r.right ? X - r.right : 0,
        dy = hy < r.top ? r.top - hy : hy > r.bottom ? hy - r.bottom : 0,
        dd = dx * dx + dy * dy - (o.c ? 1e6 : 0);
      if (dd < md) {
        md = dd;
        mo = o;
      }
    }
  const mini = mo ? mo.el : null;
  if (d.tgtM && d.tgtM !== mini) d.tgtM.classList.remove('tgt', 'e-l', 'e-h');
  if (mini) {
    if (d.tgtM !== mini) mini.classList.add('tgt');
    const jo = mo.j.find(q => inR(q.r, 0));
    let e = null;
    if (mo.c) {
      const o = +mini.dataset.o,
        gi = +mini.dataset.gi,
        r = (S.tbl['t' + o] || [])[gi];
      if (r) {
        const fr = canAdd(r, d.id, S.okey).filter(x => !(S.ik || []).includes(o + ':' + gi + ':' + x));
        if (fr.includes('l') && fr.includes('h')) e = X < mo.r.left + (mo.r.right - mo.r.left) / 2 ? 'l' : 'h';
        else if (fr.includes('l')) e = 'l';
        else if (fr.includes('h')) e = 'h';
      }
    }
    if (e !== d.insE || d.tgtM !== mini) {
      mini.classList.toggle('e-l', e === 'l');
      mini.classList.toggle('e-h', e === 'h');
    }
    d.insE = e;
    d.ins = { o: +mini.dataset.o, gi: +mini.dataset.gi, jx: jo ? +jo.t.dataset.x : null, e };
  } else d.ins = null;
  d.tgtM = mini;
  if (!!mini !== !!d.onp) {
    d.onp = !!mini;
    const ap = $('#app');
    if (ap) ap.classList.toggle('onper', !!mini);
  }
  const onTbl = !near && !mini && inR(d.zc.sc, 0);
  if (onTbl !== d.disc) {
    d.disc = onTbl;
    const sc = $('#scene');
    if (sc) sc.classList.toggle('hot', onTbl && canDiscard());
  }
}
function dragEnd(e) {
  if (!drag || e.pointerId !== drag.pid) return;
  if (drag.raf) {
    cancelAnimationFrame(drag.raf);
    drag.raf = 0;
    if (drag.on) dragMoveNow(e);
  }
  const d = drag;
  drag = null;
  slotCache = null;
  const app = $('#app');
  app.classList.remove('dragging', 'candrop', 'onper');
  const sc = $('#scene');
  if (sc) sc.classList.remove('hot');
  document.querySelectorAll('.rs.over,.rs.ibl,.rs.ibr').forEach(x => x.classList.remove('over', 'ibl', 'ibr'));
  document.querySelectorAll('.mini.tgt,.mini.can').forEach(x => x.classList.remove('tgt', 'can', 'e-l', 'e-h'));
  const rb = $('.rackbox');
  if (rb) rb.classList.remove('hot');
  if (d.ghost) d.ghost.remove();
  document.querySelectorAll('.pile.pulled').forEach(x => x.classList.remove('pulled'));
  const fl = d.on && d.kind === 'rack' && d.tgt && !d.ins && !d.disc ? snapRects() : null;
  pvClear(d);
  if (d.on) {
    lastDrag = Date.now();
    const ok = e.type !== 'pointercancel';
    if (d.kind !== 'rack') {
      if (ok && d.hot) {
        dropAt = d.tgt ? { ...d.tgt, t: Date.now() } : null;
        pend = false;
        if (d.kind === 'deck') drawDeck();
        else takeDisc();
        return;
      }
    } else if (ok) {
      if (d.ins) {
        pend = false;
        dropOnPer(d.ins.o, d.ins.gi, d.id, e.clientX, d.ins.jx, d.ins.e);
        return;
      }
      if (d.disc) {
        if (canDiscard()) {
          tryDiscard(d.id, 'drag');
          return;
        }
        msg = 'Taşı atmak için sıranın sende olması ve önce taş çekmiş olman gerekir.';
      } else if (d.tgt) {
        flip = fl || snapRects();
        placeTile(d.id, d.tgt);
        SFX.play('drop');
      }
    }
  }
  if (d.on || pend) {
    pend = false;
    render();
  }
}
window.addEventListener('pointermove', dragMove, { passive: false });
window.addEventListener('pointerup', dragEnd);
window.addEventListener('pointercancel', dragEnd);
$('#app').addEventListener('change', e => {
  if (e.target.id === 'rn') {
    R = +e.target.value;
    if (ROOM && ROOM.host === uid)
      db.doc('rooms/' + code)
        .update({ R })
        .catch(() => {});
  }
});
$('#app').addEventListener('click', async e => {
  if (Date.now() - lastDrag < 150) return;
  if (e.target.closest('.toast')) {
    msg = '';
    lastMsg = '';
    render();
    return;
  }
  const b = e.target.closest('button'),
    t = e.target.closest('.t[data-id]');
  if (b && b.dataset.un != null) {
    stage.splice(+b.dataset.un, 1);
    msg = '';
    render();
    return;
  }
  if (b && b.dataset.adm) {
    await admAct(b.dataset.adm);
    return;
  }
  if (b && b.dataset.watch) {
    watchRoom(b.dataset.watch);
    return;
  }
  if (b && b.dataset.wa) {
    await admRoomAct(b.dataset.wa);
    return;
  }
  if (b && (b.id === 'avb' || b.dataset.av != null)) {
    const el = $('#nm');
    if (el && el.value.trim()) {
      name = el.value.trim().slice(0, 14);
      lsSet('okeyName', name);
    }
    if (b.dataset.av != null) {
      myAv = +b.dataset.av;
      lsSet('okeyAv', String(myAv));
      avOpen = false;
      SFX.play('pick');
    } else avOpen = !avOpen;
    render();
    return;
  }
  if (b && b.dataset.claim != null && claimC && SRV) {
    const c = claimC.code;
    let res = null;
    try {
      res = await SRV.call({ op: 'claim', code: c, i: +b.dataset.claim });
    } catch (e) {}
    if (res && res.ok) {
      claimC = null;
      msg = '';
      lsSet('okeyRoom', c);
      enterRoom(c);
    } else {
      msg = (res && res.msg) || 'Koltuğa dönülemedi.';
      claimC = null;
      render();
    }
    return;
  }
  if (b && b.id === 'claimX') {
    claimC = null;
    render();
    return;
  }
  if (b && b.id === 'rxB') {
    if (rxOpen) closeRx();
    else openRx();
    return;
  }
  if (!b && S && sel.length === 1 && canDiscard()) {
    const mi = e.target.closest('#scene .pers .mini.grow');
    if (mi) {
      const r = mi.getBoundingClientRect(),
        o = +mi.dataset.o,
        gi = +mi.dataset.gi,
        rec0 = (S.tbl['t' + o] || [])[gi];
      B = S.B;
      const fr = rec0 ? canAdd(rec0, sel[0], S.okey).filter(x => !(S.ik || []).includes(o + ':' + gi + ':' + x)) : [];
      const jt = e.target.closest('.t[data-x]');
      if (fr.length || jt || (rec0 && rec0.g.some((y, k) => isJ(y, S.okey) && canSwap(rec0, k, sel[0], S.okey)))) {
        const want = fr.includes('l') && fr.includes('h') ? (e.clientX < r.left + r.width / 2 ? 'l' : 'h') : null;
        dropOnPer(o, gi, sel[0], e.clientX, jt ? +jt.dataset.x : null, want);
        return;
      }
    }
  }
  if (!b && S && S.seats && S.seats.indexOf(uid) >= 0) {
    const z = e.target.closest('#scene .plate,#scene .pers .mini');
    if (z) {
      const st = z.closest('.seat[data-seat]');
      if (st) {
        openZoom(+st.dataset.seat);
        return;
      }
    }
  }
  if (b && b.dataset.tj) {
    await joinRoom(b.dataset.tj);
    return;
  }
  if (b && b.dataset.tb) {
    const [c, i] = b.dataset.tb.split(':');
    await takeBot(c, +i);
    return;
  }
  if (b && b.dataset.bl != null) {
    try {
      await db.doc('rooms/' + code).update({ bl: +b.dataset.bl });
    } catch (e) {}
    return;
  }
  if (b && b.dataset.rep) {
    await admRep(b.dataset.rep);
    return;
  }
  if (b && b.dataset.at) {
    admTab = b.dataset.at;
    admMsg = '';
    if (admTab === 'bildirim' || admTab === 'oyuncu') admLoad();
    render();
    return;
  }
  if (b && b.dataset.ann) {
    await setCfg({ ann: b.dataset.ann });
    return;
  }
  if (b && b.dataset.pr != null) {
    try {
      await db.doc('rooms/' + code).update({ pr: +b.dataset.pr });
    } catch (e) {}
    return;
  }
  if (b && b.dataset.cfg) {
    const [k, v] = b.dataset.cfg.split(':');
    await setCfg({ [k]: ['pub', 'chat', 'mk', 'bk'].includes(k) ? v === '1' : +v });
    return;
  }
  if (b && b.dataset.ins) {
    const [o, gi, en] = b.dataset.ins.split(':');
    if (en === 'P') await insertPair(+o, +gi);
    else if (en[0] === 'x') await swapOkey(+o, +gi, +en.slice(1));
    else await insertTile(+o, +gi, en);
    return;
  }
  if (b && b.id) {
    const id = b.id;
    if (id === 'mk') await createRoom();
    else if (id === 'qb') {
      await quickBots();
    } else if (id === 'jn') await joinRoom($('#cd').value);
    else if (id === 'resume') await joinRoom(lsGet('okeyRoom'));
    else if (id === 'adm') {
      const v = String(($('#ap') || {}).value || '').trim();
      if (SRV) {
        let ok = false;
        try {
          ok = (await SRV.call({ op: 'admin', pw: v })).ok;
        } catch (e) {}
        if (ok) {
          isAdmin = true;
          await openAdmin();
        } else {
          msg = 'Şifre yanlış.';
          render();
        }
      } else if (v === '1234') {
        isAdmin = true;
        await openAdmin();
      } else {
        msg = 'Şifre yanlış.';
        render();
      }
    } else if (id === 'admback') {
      unsubAll();
      isAdmin = false;
      view = 'home';
      admC = '';
      admMsg = '';
      render();
    } else if (id === 'admlist') await openAdmin();
    else if (id === 'anset') await setCfg({ ann: (($('#an') || {}).value || '').trim().slice(0, 140) });
    else if (id === 'anclr') await setCfg({ ann: '' });
    else if (id === 'pen') {
      showPen = !showPen;
      render();
    } else if (id === 'lmv') {
      openMv();
    } else if (id === 'home') leaveLocal('', true);
    else if (id === 'lv') await leaveLobby();
    else if (id === 'cls') {
      if (admC !== 'cls') {
        admC = 'cls';
        render();
        return;
      }
      admC = '';
      const c = code;
      leaveLocal('');
      await wipeRoom(c);
    } else if (id === 'cp') await shareCode();
    else if (id === 'pubT') {
      try {
        await db.doc('rooms/' + code).update({ pub: !(ROOM && ROOM.pub) });
      } catch (e) {}
    } else if (id === 'repO') {
      document.body.classList.remove('menu-open');
      openRep();
    } else if (id === 'admlog') {
      await admLoadLog();
    } else if (id === 'admpl') {
      admPlAll = !admPlAll;
      render();
    } else if (id === 'pairT') {
      try {
        await db.doc('rooms/' + code).update({ pair: !(ROOM && ROOM.pair) });
      } catch (e) {}
    } else if (id === 'botadd') await setBots(Math.min(bots + 1, 3));
    else if (id === 'botdel') await setBots(Math.max(0, bots - 1));
    else if (id === 'botfill') {
      const hq = Math.min(L.length, 4);
      await setBots(Math.max(0, 4 - hq));
    } else if (id === 'go') await start(null, (ROOM && ROOM.R) || 9);
    else if (id === 'again') await start(S);
    else if (id === 'inst') await installApp();
    else if (id === 'reload') location.reload();
    else if (id === 'endx') {
      endHide = S ? S.gid : -1;
      render();
    } else if (id === 'endo') {
      endHide = -1;
      render();
    } else if (id === 'deck') await drawDeck();
    else if (id === 'tk') await takeDisc();
    else if (id === 'dis') {
      if (sel.length === 1) tryDiscard(sel[0], 'btn');
    } else if (id === 'fin') await finish();
    else if (id === 'back') await putBack();
    else if (id === 'open') await openNow();
    else if (id === 'clr') {
      stage = [];
      msg = '';
      render();
    } else if (id === 'fcs') {
      SET.focus = !SET.focus;
      saveSet();
      perSig = '';
      render();
    } else if (id === 'sort') {
      B = S.B;
      sortRack();
      render();
    }
    return;
  }
  if (t && t.closest('#rack')) {
    const id = +t.dataset.id,
      i = sel.indexOf(id);
    if (SET.dbl && lastTap.id === id && Date.now() - lastTap.t < 380 && canDiscard()) {
      lastTap = { id: -1, t: 0 };
      sel = [];
      tryDiscard(id, 'tap');
      return;
    }
    lastTap = { id, t: Date.now() };
    SFX.play('pick');
    if (i >= 0) sel.splice(i, 1);
    else sel.push(id);
    render();
    return;
  }
  const rs = e.target.closest('#rack .rs');
  if (rs && !rs.querySelector('.t') && sel.length === 1) {
    const j = +rs.dataset.s,
      i = order.indexOf(sel[0]);
    if (i >= 0) {
      order[i] = null;
      order[j] = sel[0];
      sel = [];
      render();
    }
  }
});
try {
  document.body.insertAdjacentHTML('beforeend', AVSYM + '<div class="tpulse" aria-hidden="true"></div>');
} catch (e) {}
