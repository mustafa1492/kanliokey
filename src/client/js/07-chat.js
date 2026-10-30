/* hazır mesajlar ve emojiler (v52): üyelik kaydına yazılır, herkes görür; isim kutusunun üstünde balon çıkar */
const RX = [
  '😂',
  '😡',
  '😱',
  '👏',
  '🩸',
  '🙏',
  '🔥',
  '🫖',
  'Haydi!',
  'Yine mi!',
  'Bekle…',
  'İyi oyun',
  'Kan kokusu var',
  'Okey bende 😏'
];
let rxOpen = false,
  rxSeen = {},
  rxLast = 0;
async function sendRx(i) {
  if (!code || !uid || Date.now() - rxLast < 1500) return;
  rxLast = Date.now();
  closeRx();
  const m = (L || []).find(x => x.id === uid) || {};
  try {
    await db
      .doc('rooms/' + code + '/members/' + uid)
      .set({ name: m.name || name, av: m.av != null ? m.av : myAv, t: m.t || Date.now(), re: { i, t: Date.now() } });
  } catch (e) {}
}
function rxCheck() {
  if (!S || !S.seats || typeof document === 'undefined' || !document.body) return;
  for (const m of L || []) {
    const r = m.re;
    if (!r || !(r.t > 0)) continue;
    const k = m.id;
    if (r.t <= (rxSeen[k] || 0)) continue;
    rxSeen[k] = r.t;
    if (Date.now() - r.t > 6000) continue;
    const i = S.seats.indexOf(k);
    if (i < 0 || !(r.i >= 0 && r.i < RX.length)) continue;
    rxBubble(i, RX[r.i]);
  }
}
function rxBubble(i, txt) {
  const pl = document.querySelector(`#scene .seat[data-seat="${i}"] .plate`);
  if (!pl) return;
  const r = pl.getBoundingClientRect(),
    el = document.createElement('div');
  el.className = 'rxb' + (/^\p{Extended_Pictographic}+$/u.test(txt) ? ' emo' : '');
  el.textContent = txt;
  el.style.left = Math.round(r.left + r.width / 2) + 'px';
  el.style.top = Math.round(r.top) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2900);
  if (i !== S.seats.indexOf(uid)) SFX.play('pick');
}
/* sohbet (v54): masadakiler yazışır; son 60 mesaj odada tutulur */
let CHAT = [],
  chatSeen = 0,
  chatLastT = 0,
  chatBusy = false;
try {
  chatSeen = +localStorage.getItem('okeyChatSeen') || 0;
} catch (e) {}
const chatUnread = () => CHAT.filter(x => x.t > chatSeen && x.u !== uid).length;
function onChat(m) {
  const fresh = m.filter(x => x.t > chatLastT);
  const first = !chatLastT;
  chatLastT = m.length ? m[m.length - 1].t : chatLastT;
  CHAT = m;
  if (!first)
    for (const x of fresh) {
      if (x.u === uid || Date.now() - x.t > 15000) continue;
      if (S && S.seats) {
        const i = S.seats.indexOf(x.u);
        if (i >= 0) rxBubble(i, x.x.length > 42 ? x.x.slice(0, 40) + '…' : x.x);
      }
      if (!rxOpen) SFX.play('pick');
    }
  if (rxOpen) {
    chatSeen = Date.now();
    try {
      localStorage.setItem('okeyChatSeen', String(chatSeen));
    } catch (e) {}
    chatList();
  }
  render();
}
function chatList() {
  const l = document.getElementById('chl');
  if (!l) return;
  const atEnd = l.scrollHeight - l.scrollTop - l.clientHeight < 40;
  const tm = t => {
    const d = new Date(t);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };
  l.innerHTML = CHAT.length
    ? CHAT.map(
        x =>
          `<div class="chm ${x.u === uid ? 'me' : ''}"><b>${esc(x.n)}</b><span>${esc(x.x)}</span><small>${tm(x.t)}</small></div>`
      ).join('')
    : '<p class="chempty">Henüz mesaj yok. İlk sen yaz!</p>';
  if (atEnd || !l.dataset.init) {
    l.scrollTop = l.scrollHeight;
    l.dataset.init = '1';
  }
}
async function sendChat(txt) {
  txt = String(txt || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  if (!txt || !code || chatBusy) return false;
  chatBusy = true;
  try {
    if (SRV) {
      const r = await SRV.call({ op: 'chat', code, text: txt });
      if (!r || !r.ok) {
        msg = (r && r.msg) || 'Mesaj gitmedi.';
        render();
        return false;
      }
    } else {
      const p = db.doc('rooms/' + code + '/chat/main'),
        d = await p.get(),
        m = (d.exists && d.data().m) || [];
      const me = S && S.seats ? S.seats.indexOf(uid) : -1;
      m.push({ u: uid, n: me >= 0 ? S.names[me] : name, t: Date.now(), x: txt });
      await p.set({ m: m.slice(-60) });
    }
    return true;
  } catch (e) {
    msg = 'Mesaj gitmedi.';
    render();
    return false;
  } finally {
    chatBusy = false;
  }
}
function openRx() {
  closeRx();
  rxOpen = true;
  chatSeen = Date.now();
  try {
    localStorage.setItem('okeyChatSeen', String(chatSeen));
  } catch (e) {}
  const el = document.createElement('div');
  el.id = 'rxp';
  el.className = 'rxp';
  el.innerHTML = `<div class="chs" role="dialog" aria-label="Sohbet"><div class="chh"><b>Sohbet</b><button id="chX" aria-label="Kapat">✕</button></div><div class="chl" id="chl"></div>
${CFG.chat ? `<form class="chf" id="chF" autocomplete="off"><input id="chI" maxlength="200" placeholder="Mesaj yaz…" enterkeyhint="send" autocomplete="off"><button class="p" type="submit">Gönder</button></form>` : '<small class="mut">Sohbet şu an kapalı, hazır tepkiler açık.</small>'}
<div class="rxs">${RX.map((t, i) => `<button type="button" data-rx="${i}" class="${/^\p{Extended_Pictographic}+$/u.test(t) ? 'emo' : ''}">${t}</button>`).join('')}</div></div>`;
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-rx]');
    if (b) {
      sendRx(+b.dataset.rx);
      return;
    }
    if (e.target === el || e.target.closest('#chX')) closeRx();
  });
  el.addEventListener('submit', async e => {
    e.preventDefault();
    const i = document.getElementById('chI');
    if (!i) return;
    const v = i.value;
    if (await sendChat(v)) {
      i.value = '';
    }
  });
  document.body.appendChild(el);
  chatList();
  render();
}
function closeRx() {
  const was = rxOpen;
  rxOpen = false;
  const e = document.getElementById('rxp');
  if (e) e.remove();
  if (was) render();
}
/* masayı yakınlaştır (v52): bir oyuncunun isim kutusuna ya da perlerine dokununca perleri ve son attığı taş büyük görünür (Mustafa: geçmişte sadece son taş) */
function openZoom(i) {
  if (!S || !S.seats) return;
  closeZoom();
  B = S.B;
  const O = S.okey,
    me = S.seats.indexOf(uid);
  const prs0 = (S.tbl['t' + i] || []).filter(r => r && r.g),
    dis = S.disc['d' + i] || [],
    o = S.opn['s' + i];
  const el = document.createElement('div');
  el.id = 'zoomv';
  el.className = 'zoomv';
  el.innerHTML = `<div class="zsheet sc${i}" role="dialog" aria-label="${esc(S.names[i])}"><div class="zh"><span class="dot"></span><b>${esc(S.names[i])}${i === me ? ' · sen' : ''}</b><small>${S.hands['h' + i].length} taş${o > 0 ? ' · açtı ' + o + ((S.opm || {})['s' + i] === 'c' ? ' (çift)' : '') : ' · açmadı'}${S.scores['s' + i] ? ' · ceza ' + S.scores['s' + i] : ''}</small><button id="zoomX" aria-label="Kapat">✕</button></div>
<h5>Perleri</h5>${
    prs0.length
      ? `<div class="zpers">${prs0
          .map(
            r =>
              `<div class="zg">${r.g
                .map((x, k) => {
                  const ly = r.x && r.x.includes(x) ? ' ly' : '';
                  return isJ(x, O)
                    ? `<div class="t ok c3${ly}">★<small style="font-size:11px">${slotVal(r, k, O)}</small></div>`
                    : tile(x, O, ly);
                })
                .join('')}</div>`
          )
          .join('')}</div>`
      : '<p class="mut">Henüz per açmadı.</p>'
  }
<h5>Son attığı taş</h5>${dis.length ? `<div class="zdis"><div class="zd">${tile(dis[dis.length - 1], O)}</div></div>` : '<p class="mut">Henüz taş atmadı.</p>'}</div>`;
  el.addEventListener('click', e => {
    if (e.target === el || e.target.closest('#zoomX')) closeZoom();
  });
  document.body.appendChild(el);
}
function closeZoom() {
  const e = document.getElementById('zoomv');
  if (e) e.remove();
}
