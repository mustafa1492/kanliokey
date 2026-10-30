/* hamle: claude.ai'de motor burada çalışır ve sonuç kaydedilir; sunucu modunda hamle sunucuya gider, sunucu doğrular */
async function act(name, args) {
  if (busy || !S) return false;
  msg = '';
  lastMsg = '';
  const me = S.seats.indexOf(uid);
  if (me < 0 || S.turn !== me || S.ph === 'end') return false;
  if (SRV) {
    busy = true;
    let res = null;
    try {
      res = await SRV.call({ op: 'act', code, name, args });
    } catch (e) {
      res = { ok: false, msg: 'Bağlantı koptu, hamle gitmedi. Tekrar dene.' };
    }
    busy = false;
    msg = (res && res.msg) || '';
    if (res && res.ok) {
      sel = [];
      stage = [];
    }
    render();
    return !!(res && res.ok);
  }
  const s = JSON.parse(JSON.stringify(S)),
    out = ENG.run(name, s, me, args);
  msg = out.msg || '';
  if (!out.r) {
    render();
    return false;
  }
  sel = [];
  stage = [];
  busy = true;
  try {
    await G().update(out.r);
  } catch (e) {
    msg = 'Kayıt hatası: ' + (e.code || '');
  }
  busy = false;
  render();
  return true;
}
const drawDeck = () => act('draw', {});
const takeDisc = () => act('take', {});
const discard = () => (sel.length === 1 ? act('discard', { t: sel[0] }) : false);
/* atmadan önce: işler taşsa ve ayar açıksa bir kez uyar, ikinci denemede at */
function tryDiscard(id, how) {
  if (!canDiscard()) return false;
  B = S.B;
  const me = S.seats.indexOf(uid),
    h = (S.hands[hk(me)] || []).filter(x => x !== id),
    ends = S.ot !== me && canEnd(S, me, h);
  if (SET.lvl === 'kolay' && !ends && !(warnI.id === id && Date.now() - warnI.t < 8000)) {
    const opm = S.opn['s' + me] > 0 ? (S.opm || {})['s' + me] : '',
      gs = autoOpen(order, S.okey, -1, opm).groups.flat();
    const why = isJ(id, S.okey) ? 'Okeyi atıyorsun!' : gs.includes(id) ? 'Bu taş ıstakandaki bir perin parçası.' : '';
    if (why) {
      warnI = { id, t: Date.now() };
      msg =
        why +
        ' Emin misin? Atmak için ' +
        (how === 'drag' ? 'tekrar masaya bırak' : how === 'tap' ? 'tekrar iki kez dokun' : "tekrar At'a bas") +
        '.';
      SFX.play('drop');
      render();
      return false;
    }
  }
  if (SET.warn && !ends && ishler(S, id, S.okey) && !(warnI.id === id && Date.now() - warnI.t < 8000)) {
    warnI = { id, t: Date.now() };
    const again = how === 'drag' ? 'tekrar masaya bırak' : how === 'tap' ? 'tekrar iki kez dokun' : "tekrar At'a bas";
    msg =
      'Bu taş işler! Atarsan 500 ceza yazılır. ' +
      (S.opn['s' + me] > 0 && how === 'drag'
        ? 'İşlemek için parlayan perin üstüne bırak; yine de atmak için ' + again + '.'
        : 'Yine de atmak için ' + again + '.');
    SFX.play('drop');
    render();
    return false;
  }
  warnI = { id: -1, t: 0 };
  sel = [id];
  pend = false;
  discard();
  return true;
}
const finish = () => (sel.length === 1 ? act('finish', { t: sel[0] }) : false);
const insertTile = (o, gi, e) => (sel.length === 1 ? act('insert', { o, gi, e, t: sel[0] }) : false);
const swapOkey = (o, gi, idx) => (sel.length === 1 ? act('swap', { o, gi, idx, t: sel[0] }) : false);
const insertPair = (o, gi) => (sel.length === 2 ? act('pair', { o, gi, ts: [...sel] }) : false);
const putBack = () => act('back', {});
/* kısmi açma (Mustafa onayladı): ıstakada seçili taş varsa sadece o taşların bulunduğu perler/çiftler açılır; seçim yoksa hepsi */
function pickG(a, O) {
  if (!a || !a.groups || !sel.length) return a;
  const ch = a.groups.filter(g => g.some(x => sel.includes(x)));
  if (!ch.length || ch.length === a.groups.length) return a;
  return { ...a, groups: ch, pts: stTot(ch, O), rem: stRem(ch, O), part: true };
}
const openNow = () => {
  if (!S) return false;
  const me = S.seats.indexOf(uid);
  if (me < 0) return false;
  B = S.B;
  const opened = S.opn['s' + me] > 0;
  const groups = stage.length
    ? stage
    : pickG(autoOpen(order, S.okey, S.must, opened ? (S.opm || {})['s' + me] : ''), S.okey).groups;
  if (!groups.length) {
    msg = 'Rafta açılabilecek bir per ya da çift bulunamadı. Taşları yan yana dizip tekrar dene.';
    render();
    return false;
  }
  return act('open', { groups });
};
