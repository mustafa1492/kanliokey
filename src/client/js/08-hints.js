/* ipuçları (v50): yandan taş, açma, işleme */
const hc = new Map();
const hcGet = (k, f) => {
  if (hc.has(k)) return hc.get(k);
  const v = f();
  if (hc.size > 40) hc.clear();
  hc.set(k, v);
  return v;
};
function formsPer(t, h, O) {
  if (isJ(t, O)) return true;
  const a = tv(t, O),
    jk = h.filter(x => isJ(x, O)).length,
    nat = h.filter(x => !isJ(x, O)).map(x => tv(x, O));
  const cs = new Set(nat.filter(v => v.n === a.n && v.c !== a.c).map(v => v.c));
  if (cs.size >= 2 || (cs.size >= 1 && jk >= 1)) return true;
  const ns = new Set(nat.filter(v => v.c === a.c).map(v => v.n));
  for (const st of [a.n - 2, a.n - 1, a.n]) {
    if (st < 1 || st + 2 > 13) continue;
    let miss = 0,
      real = 0;
    for (let x = st; x <= st + 2; x++) {
      if (x === a.n) continue;
      if (ns.has(x)) real++;
      else miss++;
    }
    if (real >= 1 && miss <= jk) return true;
  }
  return false;
}
function yanHint(t, me) {
  const h = S.hands[hk(me)] || [],
    O = S.okey,
    opened = S.opn['s' + me] > 0,
    om = (S.opm || {})['s' + me];
  return hcGet(
    'y|' + t + '|' + h.join(',') + '|' + S.opn['s' + me] + '|' + S.mx + '|' + O.c + O.n + (S.B ? 'B' : ''),
    () => {
      B = S.B;
      if (opened) {
        if (om === 'c')
          return h.some(
            x => x !== t && !isJ(t, O) && !isJ(x, O) && tv(x, O).c === tv(t, O).c && tv(x, O).n === tv(t, O).n
          )
            ? 'çift olur'
            : '';
        return formsPer(t, h, O) ? 'per olur' : '';
      }
      const need = needRaw(S);
      const w = openPlan([...h, t], O, need, 0, 8000, 1);
      if (!w) return '';
      const wo = openPlan(h, O, need, 0, 8000, 1);
      return !wo || w.pts > wo.pts ? 'al, açarsın' : '';
    }
  );
}
let needQ = '',
  needT = null;
function acHint(me, need) {
  const h = S.hands[hk(me)] || [],
    O = S.okey;
  B = S.B;
  const key =
    'a|' +
    h
      .slice()
      .sort((a, b) => a - b)
      .join(',') +
    '|' +
    need +
    '|' +
    O.c +
    O.n +
    (S.B ? 'B' : '');
  const best = hcGet(key + '|b', () => {
    const p = openPlan(h, O, 0, 0, 30000, 1);
    const pp = pairPlan(h, O);
    return Math.max(p ? p.pts : 0, pp.raw);
  });
  if (best >= need) return { ok: true, best };
  if (SET.lvl !== 'kolay') return { ok: false, best, need: [] };
  const got = hc.get(key + '|n');
  if (got === undefined && needQ !== key) {
    needQ = key;
    clearTimeout(needT);
    needT = setTimeout(() => {
      try {
        if (!S || needQ !== key) return;
        B = S.B;
        const out = [];
        for (let c = 0; c < 4 && out.length < 4; c++)
          for (let n = 1; n <= 13 && out.length < 4; n++) {
            const id = c * 26 + n - 1;
            const p = openPlan([...h, id], O, need, 0, 2500, 1);
            if (p) out.push(id);
          }
        hc.set(key + '|n', out);
        render();
      } catch (e) {}
    }, 60);
  }
  return { ok: false, best, need: got };
}
function canIsle(id, me) {
  const O = S.okey;
  for (let i = 0; i < 4; i++)
    for (const [gi, r] of (S.tbl['t' + i] || []).entries()) {
      if (!r || !r.g) continue;
      if (canAdd(r, id, O).some(e => !(S.ik || []).includes(i + ':' + gi + ':' + e))) return true;
      if (r.g.some((y, k) => isJ(y, O) && canSwap(r, k, id, O))) return true;
    }
  return false;
}
