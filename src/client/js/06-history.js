/* oyun geçmişim (bu cihazda): biten oyunlar */
const histGet = () => {
  try {
    return JSON.parse(localStorage.getItem('okeyHist') || '[]');
  } catch (e) {
    return [];
  }
};
function histAdd(b, me) {
  const L0 = histGet();
  if (L0.some(x => x.g === b.gid)) return;
  const sc = [0, 1, 2, 3].map(i => b.scores['s' + i] || 0),
    rank = 1 + sc.filter(v => v < sc[me]).length,
    last = sc.indexOf(Math.max(...sc));
  const tsum = t => sc[t] + sc[t + 2],
    pairLose = b.pair ? tsum(me % 2) >= tsum(1 - (me % 2)) : null;
  L0.unshift({
    g: b.gid,
    t: Date.now(),
    c: code,
    R: b.R,
    n: b.names,
    sc,
    me,
    rank,
    last,
    pair: !!b.pair,
    pl: pairLose
  });
  try {
    localStorage.setItem('okeyHist', JSON.stringify(L0.slice(0, 30)));
  } catch (e) {}
}
function histH() {
  const L0 = histGet();
  if (!L0.length) return '<small class="snote">Henüz biten oyunun yok. Oyun bitince burada görünür.</small>';
  const n = L0.length,
    avg = Math.round(L0.reduce((a, x) => a + x.sc[x.me], 0) / n),
    lastC = L0.filter(x => x.last === x.me).length,
    best = Math.min(...L0.map(x => x.sc[x.me])),
    firstC = L0.filter(x => x.rank === 1).length;
  const d = t => {
    const z = new Date(t);
    return z.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };
  return `<div class="hsum"><div><b>${n}</b><small>oyun</small></div><div><b>${firstC}</b><small>birinci</small></div><div><b>${lastC}</b><small>sonuncu</small></div><div><b>${avg}</b><small>ort. ceza</small></div><div><b>${best}</b><small>en iyi</small></div></div>
<div class="hlist">${L0.slice(0, 10)
    .map(
      x =>
        `<div class="hrow ${x.last === x.me ? 'lastp' : x.rank === 1 ? 'win' : ''}"><span>${d(x.t)}<small>${x.R} el${x.pair ? ' · eşli' : ''}</small></span><span>${x.rank}. <small>/ 4</small></span><b>${x.sc[x.me]}</b><small class="hl">${x.last === x.me ? 'sonuncu sensin' : 'sonuncu: ' + esc(x.n[x.last] || '')}</small></div>`
    )
    .join('')}</div>
<button class="lnk" id="histClr">Geçmişi sil</button>`;
}
