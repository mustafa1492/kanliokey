function homeH() {
  const saved = lsGet('okeyRoom');
  const inst = SRV && !isStandalone() ? `<button class="lnk" id="inst">Telefona uygulama gibi ekle</button>` : '';
  return `${HOMEBG}<section class="hero2"><h2 class="wm">${KW.html('stack', 'kw-hero')}</h2>${QUOTES}</section>
<div class="panel card2"><label class="flab" for="nm">Takma adın</label><div class="nmrow"><button class="avbtn" id="avb" aria-expanded="${avOpen}" aria-label="Karakterini seç: ${AVN[myAv]}">${avI(myAv)}</button><input id="nm" placeholder="Örn. Mustafa" maxlength="14" value="${esc(name)}" autocomplete="nickname"></div>
${avOpen ? `<div class="avgrid" role="radiogroup" aria-label="Karakterin">${AVN.map((n, k) => `<button class="avo ${k === myAv ? 'on' : ''}" data-av="${k}" role="radio" aria-checked="${k === myAv}">${avI(k)}<small>${n}</small></button>`).join('')}</div>` : ''}
<button class="p big" id="mk">Masa kur</button>
<button class="quick" id="qb">⚡ Botlarla hızlı oyun <small>3 botla hemen başla</small></button>
<div class="or"><span>ya da arkadaşının masasına katıl</span></div>
<div class="row join"><input id="cd" placeholder="KOD" maxlength="5" value="${esc(INVITE)}" autocapitalize="characters" autocomplete="off" aria-label="Oda kodu"><button class="p" id="jn">Katıl</button></div></div>
${claimC ? `<div class="panel claim"><b>Oda ${esc(claimC.code)}: oyun sürüyor</b><small>Oyundan çıktıysan kendi yerine dönebilirsin. Elin ve cezaların aynen duruyor.</small><div class="row">${claimC.seats.map(x => `<button class="p" data-claim="${x.i}">${esc(x.n)} olarak dön</button>`).join('')}<button id="claimX">Vazgeç</button></div></div>` : ''}
${saved ? `<button id="resume" class="resume">Son masaya dön · <b>${esc(saved)}</b></button>` : ''}
${tablesH()}
${msg ? `<div class="warn">${esc(msg)}</div>` : ''}
<a class="rulecard" href="${RULES_URL}"><div class="rc-t"><small>Yöresel · 4 kişilik</small><b>Kanlı okey nasıl oynanır?</b><span>17 ile açılır, katlamalı gider, işlenen pere kan yazılır. Okeyle biten masayı ikiye katlar.</span><em>Kuralları oku →</em></div><div class="rc-tiles" aria-hidden="true"><i class="c0">11</i><i class="c1">11</i><i class="c3">11</i><i class="c2 b">5</i><i class="c2">6</i><i class="c2">7</i></div></a>
${inst || SRV ? `<nav class="hlinks">${inst}${SRV ? '<button class="lnk" id="repO">Hata ya da kural bildir</button>' : ''}</nav>` : ''}
<details class="agate" ${agOpen ? 'open' : ''}><summary>Yönetici girişi</summary><div class="row"><input id="ap" type="password" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Şifre" autocomplete="off" aria-label="Yönetici şifresi" style="flex:1;min-width:0"><button id="adm">Gir</button></div></details>`;
}
function roomH() {
  if (!ROOM) return '<div class="panel mut">Oda yükleniyor…</div>';
  const q = [...L].sort((a, b) => a.t - b.t),
    hq = Math.min(q.length, 4),
    nb = Math.max(0, Math.min(bots, 4 - hq)),
    inL = q.slice(0, 4).some(x => x.id === uid);
  const host = ROOM.host === uid,
    playing = ROOM.st === 'playing';
  const sav = k => `<span class="sav ${k >= 0 ? 'has' : ''}">${k >= 0 ? avI(k) : ''}</span>`;
  const slots = [0, 1, 2, 3]
    .map(i =>
      q[i]
        ? `<div class="slot sc${i}">${sav(seatAv(q[i].id))}<small class="mut">${q[i].id === ROOM.host ? 'KURAN' : 'OYUNCU ' + (i + 1)}</small><span class="snm">${esc(q[i].name)}</span></div>`
        : i < hq + nb
          ? `<div class="slot bot sc${i}">${sav(botAv('bot' + (i - hq + 1)))}<small class="mut">BOT</small><span class="snm">Bot ${i - hq + 1}</span></div>`
          : `<div class="slot empty">${sav(-1)}<small>OYUNCU ${i + 1}</small><span class="snm">Boş</span></div>`
    )
    .join('');
  /* eşli: kuran eşleri seçer (masaya giriş sırasına göre 3 eşleşme) */
  const pn = [...q.slice(0, 4).map(x => x.name), ...Array.from({ length: 4 }, (_, k) => 'Bot ' + (k + 1))]
    .slice(0, Math.max(hq, 0))
    .concat(Array.from({ length: nb }, (_, k) => 'Bot ' + (k + 1)));
  while (pn.length < 4) pn.push('Oyuncu ' + (pn.length + 1));
  const P = pn.map((n, k) => ({
    n,
    av: k < hq ? seatAv(q[k].id) : botAv('bot' + (k - hq + 1)),
    me: k < hq && q[k].id === uid
  }));
  const pr = ROOM.pr | 0,
    ord = pairOrder(P, pr),
    mate = P[pr + 1];
  const pchip = x => `<span class="pch">${sav(x.av)}<b>${esc(x.n)}</b></span>`;
  const teamsH = `<div class="teams"><div class="team ta"><small>Takım 1</small>${pchip(ord[0])}${pchip(ord[2])}</div><span class="vs">VS</span><div class="team tb"><small>Takım 2</small>${pchip(ord[1])}${pchip(ord[3])}</div></div><small class="mut pnote">Eşler masada karşılıklı oturur, cezaları birlikte sayılır.</small>`;
  const pairH = ROOM.pair
    ? host && !playing
      ? `<div class="pairbox"><b class="pq">${P[0].me ? 'Eşin kim?' : esc(P[0].n) + ' kiminle eş olsun?'}</b><div class="mates" role="radiogroup" aria-label="Eş seç">${[1, 2, 3].map(j => `<button class="mate ${j === pr + 1 ? 'on' : ''}" data-pr="${j - 1}" role="radio" aria-checked="${j === pr + 1}">${sav(P[j].av)}<span>${esc(P[j].n)}</span>${j === pr + 1 ? '<em>eşi</em>' : ''}</button>`).join('')}</div>${teamsH}</div>`
      : `<div class="pairbox">${teamsH}</div>`
    : '';
  const bl = ROOM.bl != null ? ROOM.bl : CFG.bot | 0;
  const optH =
    host && !playing
      ? `${SRV && CFG.pub ? `<button class="pairT ${ROOM.pub ? 'on' : ''}" id="pubT" aria-pressed="${!!ROOM.pub}">Herkese açık masa: <b>${ROOM.pub ? 'Açık' : 'Kapalı'}</b></button>${ROOM.pub ? '<small class="mut pubn">Ana ekrandaki "Masa seç" listesinde görünür, yabancılar katılabilir.</small>' : ''}` : ''}<div class="blsel"><small class="mut">Bot seviyesi</small><div class="seg">${BLN.map((l, k) => `<button class="${bl === k ? 'p' : ''}" data-bl="${k}" aria-pressed="${bl === k}">${l}</button>`).join('')}</div></div>`
      : `<p class="mut blinfo">Bot seviyesi: <b>${BLN[bl]}</b>${ROOM.pub ? ' · herkese açık masa' : ''}</p>`;
  const pairT =
    host && !playing
      ? `<button class="pairT ${ROOM.pair ? 'on' : ''}" id="pairT" aria-pressed="${!!ROOM.pair}">Eşli oyun: <b>${ROOM.pair ? 'Açık' : 'Kapalı'}</b></button>`
      : '';
  let ctl = '';
  if (playing) ctl = '<p class="mut" style="margin:0">Oyun başlamış ama bu oyunda koltuğun yok.</p>';
  else if (host)
    ctl = `<div class="row"><button id="botadd" ${hq + nb >= 4 ? 'disabled' : ''}>Bot ekle</button><button id="botdel" ${nb > 0 ? '' : 'disabled'}>Bot çıkar</button><button id="botfill" ${hq >= 4 ? 'disabled' : ''}>Botlarla doldur</button></div>
<div class="row"><select id="rn" aria-label="Tur sayısı"><option value="9" ${ROOM.R === 9 ? 'selected' : ''}>9 tur</option><option value="13" ${ROOM.R === 13 ? 'selected' : ''}>13 tur</option></select><button class="p" id="go" ${hq + nb >= 4 ? '' : 'disabled'}>Oyunu başlat</button></div>
${hq + nb < 4 ? '<small>Başlamak için 4 kişi ya da bot gerekli. Arkadaşların kodla katılsın.</small>' : ''}`;
  else
    ctl = `<p class="mut" style="margin:0">${esc(ROOM.hostName || 'Kuran')} oyunu başlatınca masa açılır. ${ROOM.R} tur oynanacak.</p>`;
  return `<div class="panel"><h2>Masa</h2><small class="mut">ODA KODU</small><div class="code">${esc(code)}</div>
<div class="row" style="margin-bottom:14px"><a class="wa" href="https://wa.me/?text=${encodeURIComponent('Kanlı Okey masasına gel! Oda kodu: ' + code + (SRV ? '\n' + location.origin + '/?k=' + code : ''))}" target="_blank" rel="noopener">WhatsApp'ta davet et</a><button id="cp">Kodu paylaş</button><button class="rxbtn lob" id="rxB" aria-label="Sohbet">💬 Sohbet${chatUnread() ? `<i class="chn">${Math.min(9, chatUnread())}</i>` : ''}</button></div>
<div class="slots">${slots}</div>${optH}${pairT}${pairH}<div class="form">${ctl}
<div class="row">${host ? `<button class="${admC === 'cls' ? 'danger' : ''}" id="cls">${admC === 'cls' ? 'Emin misin? Odayı kapat' : 'Odayı kapat'}</button>` : `<button id="lv">Odadan çık</button>`}<button id="home">Ana ekran</button></div></div>
${msg ? `<div class="warn">${esc(msg)}</div>` : ''}</div>`;
}
