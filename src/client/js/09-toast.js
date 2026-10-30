/* uyarılar (v49): ayrı katmanda; ✕ ile, dokunarak ya da yukarı kaydırarak kapanır; kalan süre alttaki çizgide */
let toastEl = null,
  toastKey = '';
const TINFO = /ceza (aldı|yazıldı|yazdı)|^Okeyi aldın|^Kod kopyalandı|^Süre doldu|^Koltuğa/;
const toastDur = m => (TINFO.test(m) ? 4500 : Math.min(9000, 4500 + m.length * 35));
function toastSync() {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function' || !document.body) return;
  const dur = msg ? toastDur(msg) : 0,
    el = msg ? Date.now() - msgT : 0;
  if (!msg || el >= dur) {
    if (toastEl) hideToast();
    return;
  }
  const key = msgT + '|' + msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(
    () => {
      if (msg && Date.now() - msgT >= dur - 100) {
        msg = '';
        lastMsg = '';
        render();
      }
    },
    dur - el + 50
  );
  if (toastEl && toastKey === key) return;
  toastKey = key;
  if (!toastEl || !toastEl.isConnected) {
    toastEl = document.createElement('div');
    document.body.appendChild(toastEl);
    toastGest(toastEl);
  }
  const info = TINFO.test(msg);
  toastEl.className = 'tst ' + (info ? 'info' : 'warn');
  toastEl.setAttribute('role', info ? 'status' : 'alert');
  toastEl.style.transform = '';
  toastEl.style.opacity = '';
  toastEl.innerHTML = `<i class="ti" aria-hidden="true">${info ? 'i' : '!'}</i><span class="tm">${esc(msg)}</span><button class="tx" aria-label="Uyarıyı kapat">✕</button><b class="tbar" style="animation-duration:${dur}ms;animation-delay:-${el}ms"></b><small class="tsw" aria-hidden="true"></small>`;
}
function hideToast(now) {
  const e = toastEl;
  toastEl = null;
  toastKey = '';
  if (!e) return;
  if (now || !e.animate) {
    e.remove();
    return;
  }
  const a = e.animate(
    [
      {
        transform: getComputedStyle(e).transform === 'none' ? 'translate(-50%,0)' : getComputedStyle(e).transform,
        opacity: 1
      },
      { transform: 'translate(-50%,-140%)', opacity: 0 }
    ],
    { duration: 220, easing: 'ease-in' }
  );
  a.onfinish = () => e.remove();
  setTimeout(() => {
    try {
      e.remove();
    } catch (_) {}
  }, 400);
}
function dismissToast() {
  msg = '';
  lastMsg = '';
  hideToast();
  render();
}
function toastGest(e) {
  let y0 = null,
    dy = 0,
    moved = false;
  e.addEventListener('pointerdown', ev => {
    y0 = ev.clientY;
    dy = 0;
    moved = false;
    try {
      e.setPointerCapture(ev.pointerId);
    } catch (_) {}
    e.style.transition = 'none';
  });
  e.addEventListener('pointermove', ev => {
    if (y0 == null) return;
    dy = ev.clientY - y0;
    if (Math.abs(dy) > 6) moved = true;
    const d = Math.min(0, dy) + (dy > 0 ? Math.min(14, dy * 0.25) : 0);
    e.style.transform = `translate(-50%,${d}px)`;
    e.style.opacity = String(Math.max(0.2, 1 + Math.min(0, dy) / 120));
  });
  const up = ev => {
    if (y0 == null) return;
    const d = dy;
    y0 = null;
    e.style.transition = '';
    if (d < -28 || (!moved && ev.type === 'pointerup')) {
      dismissToast();
      return;
    }
    e.style.transform = '';
    e.style.opacity = '';
  };
  e.addEventListener('pointerup', up);
  e.addEventListener('pointercancel', up);
}
/* büyük anlar: masanın ortasında kısa duyuru (biri açınca, işler taş, okeyle bitirme). Çizimden bağımsız katman. */
let annAt = 0;
function bigAnn(t, s, k, o) {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function' || !document.body) return;
  if (SET.fx === 'sade') return;
  o = o || {};
  const now = Date.now(),
    dur = o.dur || 1900,
    at = Math.max(now + (o.delay || 0), annAt);
  annAt = at + dur - 300;
  setTimeout(
    () => {
      try {
        const sc = document.getElementById('scene');
        if (!S || !sc) return;
        const el = document.createElement('div');
        el.className = 'bigann ' + (k || '');
        el.setAttribute('role', 'status');
        el.style.setProperty('--d', dur + 'ms');
        el.innerHTML = `<b>${t}</b>${s ? `<small>${s}</small>` : ''}`;
        const r = sc.getBoundingClientRect();
        el.style.top = Math.round(r.top + r.height * (o.y || 0.42)) + 'px';
        el.style.left = Math.round(r.left + r.width / 2) + 'px';
        el.style.maxWidth = Math.round(Math.min(innerWidth * 0.92, r.width + 30)) + 'px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), dur + 80);
      } catch (e) {}
    },
    Math.max(0, at - now)
  );
}
/* el biterken: son taş masaya çakılır, masa hafifçe sarsılır */
function slamFx(id, O) {
  const sc = document.getElementById('scene');
  if (!sc || !fxOn()) return;
  const r = sc.getBoundingClientRect(),
    el = document.createElement('div');
  el.className = 'slam';
  el.innerHTML = tile(id, O);
  el.style.left = Math.round(r.left + r.width / 2) + 'px';
  el.style.top = Math.round(r.top + r.height * 0.56) + 'px';
  document.body.appendChild(el);
  setTimeout(() => {
    try {
      const w = document.getElementById('scene');
      const p = w && w.parentElement;
      if (p && p.animate)
        p.animate(
          [
            { transform: 'none' },
            { transform: 'translate(-5px,3px) rotate(-.4deg)' },
            { transform: 'translate(5px,-2px) rotate(.35deg)' },
            { transform: 'translate(-3px,1px)' },
            { transform: 'translate(2px,0)' },
            { transform: 'none' }
          ],
          { duration: 420, easing: 'ease-out' }
        );
    } catch (e) {}
  }, 360);
  setTimeout(() => el.remove(), 1500);
}
function endFx(b, me) {
  const f = b.win >= 0 && b.win < 4 ? b.win : -1;
  if (f < 0 || typeof document === 'undefined' || typeof document.createElement !== 'function') return;
  B = b.B;
  const O = b.okey,
    lt = (b.disc['d' + f] || []).slice(-1)[0],
    you = f === me,
    nm = esc(b.names[f]);
  const ok = lt != null && isJ(lt, O),
    solo = b.opn['s' + f] > 0 && [0, 1, 2, 3].every(i => i === f || !(b.opn['s' + i] > 0));
  if (lt != null) slamFx(lt, O);
  const who = you ? '' : nm + ' · ';
  let t,
    s = '',
    k = 'gold';
  if (ok && solo) {
    t = you ? 'Okeyle, tek başına bitirdin!' : 'Okeyle, tek başına bitirdi!';
    s = who + 'cezalar 4 katı';
  } else if (ok) {
    t = you ? 'Okeyle bitirdin!' : 'Okeyle bitirdi!';
    s = who + 'cezalar 2 katı';
  } else if (solo) {
    t = you ? 'Tek başına bitirdin!' : 'Tek başına bitirdi!';
    s = who + 'cezalar 2 katı';
  } else {
    t = you ? 'Eli bitirdin!' : nm + ' eli bitirdi!';
    k = '';
  }
  annAt = 0;
  bigAnn(t, s, k, { delay: 420, dur: 1500, y: 0.22 });
}
