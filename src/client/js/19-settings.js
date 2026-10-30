/* ayarlar sayfası: çizimden bağımsız katman */
function setH() {
  const sw = (k, t, d, v) =>
    `<button class="sw" data-sw="${k}" aria-pressed="${!!v}"><span><b>${t}</b>${d ? `<small>${d}</small>` : ''}</span><i aria-hidden="true"></i></button>`;
  const seg = (k, t, items) =>
    `<div class="srow"><b>${t}</b><div class="sseg" role="radiogroup">${items.map(([v, l]) => `<button data-sv="${k}:${v}" role="radio" aria-checked="${String(SET[k]) === String(v)}" class="${String(SET[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
  return `<div class="ssheet" role="dialog" aria-modal="true" aria-label="Ayarlar"><div class="shd"><b>Ayarlar</b><button id="setX">Kapat</button></div><div class="sbody">
<section><h4>Zorluk</h4>
${seg('lvl', 'Oyun modu', [
  ['kolay', 'Kolay'],
  ['normal', 'Normal'],
  ['zor', 'Zor']
])}
<small class="snote">${SET.lvl === 'kolay' ? 'Kolay: bütün ipuçları açık, hangi taş gelirse açacağın görünür, okeyi ya da ıstakandaki bir perin parçasını atarken uyarır, bitirebileceğin taşı gösterir.' : SET.lvl === 'zor' ? 'Zor: hiçbir ipucu ve uyarı yok, işler taş uyarısı da kapalı.' : 'Normal: açma, yandan taş ve işleme ipuçları açık; hangi taş gelirse açacağın görünmez.'}</small>
</section>
<section><h4>Istaka</h4>
${sw('smart', 'Akıllı sıralama', '"Sırala" taşları en yüksek açılışa göre dizer: açılacak perler yan yana, kalanlar renge göre', SET.smart)}
${sw('auto', 'Taş gelince otomatik diz', 'Her yeni taşta ıstaka kendiliğinden en yüksek açılışa göre dizilir', SET.auto)}
${sw('dbl', 'İki kez dokunarak at', 'Sıran gelince taşa art arda iki kez dokununca taş atılır', SET.dbl)}
${sw('warn', 'İşler taş uyarısı', 'İşler taşı atmadan önce "500 ceza" uyarısı çıkar, ikinci denemede atılır', SET.warn)}
</section>
<section><h4>İpuçları</h4>
${sw('hYan', 'Yandan taş ipucu', 'Soldaki taş işine yarıyorsa parlar: "al, açarsın", "per olur"', SET.hYan)}
${sw('hAc', 'Açma ipucu', 'Istakanın üstünde: açabiliyor musun, açamıyorsan hangi taş gelirse açarsın', SET.hAc)}
${sw('hIs', 'İşleme ipucu', 'Açtıktan sonra masadaki bir pere işlenebilen taşların köşesinde + çıkar', SET.hIs)}
</section>
<section><h4>Görünüm</h4>
${seg('felt', 'Masa rengi', [
  ['yesil', 'Yeşil'],
  ['bordo', 'Bordo'],
  ['lacivert', 'Lacivert'],
  ['kahve', 'Kahve']
])}
${seg('fx', 'Efektler', [
  ['tam', 'Tam'],
  ['sade', 'Sade']
])}
<small class="snote">Sade: uçan taşlar, duyurular, sarsıntı ve parıltılar kapanır. Yavaş telefonda akıcılık için.</small>
${sw('big', 'Büyük taşlar', 'Istaka 2 × 10 yuva olur, taşlar ve masadaki perler büyür', SET.big)}
${sw('cb', 'Renk körü işaretleri', 'Taşlardaki noktanın şekli renge göre değişir: kırmızı ●, sarı ▲, mavi ■, siyah ◆', SET.cb)}
</section>
<section><h4>Ses ve titreşim</h4>
${sw('snd', 'Ses', '', SFX.snd)}
${seg('vol', 'Ses seviyesi', [
  [0, 'Kısık'],
  [1, 'Orta'],
  [2, 'Normal'],
  [3, 'Yüksek']
])}
${sw('vib', 'Titreşim', 'Android telefonlarda çalışır', SFX.vb)}
${seg('pack', 'Ses paketi', [
  ['gercek', 'Gerçek taş sesleri'],
  ['sade', 'Sade']
])}
${seg('turnS', 'Sıra sende sesi', [
  ['can', 'Çan'],
  ['ses', '"Sıra sende"'],
  ['kapali', 'Kapalı']
])}
${sw('amb', 'Kahvehane uğultusu', 'Oyun sırasında arkada hafif kahvehane sesi', SET.amb)}
${sw('low10', 'Son 10 saniye uyarısı', 'Sıranın son 10 saniyesinde ekran kenarı kırmızı atar, son 5 saniye tik sesi', SET.low10)}
${sw('push', '"Sıra sende" bildirimi', SRV ? pushNote || 'Uygulama kapalıyken ya da arka plandayken sıra gelince telefona bildirim gelir. iPhone\'da önce "Ana Ekrana Ekle" gerekir.' : 'İnternete yüklenen sürümde çalışır.', SET.push)}
</section>
<section><h4>Ekran</h4>
${sw('wake', 'Ekranı açık tut', 'Oyun sırasında telefon ekranı kararmaz', SET.wake)}
</section>
<section><h4>Oyun geçmişim</h4>${histH()}</section>
<section><h4>Profil</h4>
<div class="srow"><b>Takma adın</b><input id="setN" maxlength="14" value="${esc(name)}" placeholder="Örn. Mustafa" autocomplete="nickname"></div>
<div class="avgrid">${AVN.map((n, k) => `<button class="avo ${k === myAv ? 'on' : ''}" data-sav="${k}" role="radio" aria-checked="${k === myAv}">${avI(k)}<small>${n}</small></button>`).join('')}</div>
<small class="snote">Ad ve karakter bir sonraki masada geçerli olur.</small>
</section>
<section class="sabout"><a href="${RULES_URL}">Kurallar</a><small>Sürüm ${esc(APP_BUILD)}</small></section>
</div></div>`;
}
function openSet(on) {
  setOpen = on;
  let el = document.getElementById('setv');
  if (on) {
    if (!el) {
      el = document.createElement('div');
      el.id = 'setv';
      el.className = 'setv';
      document.body.appendChild(el);
      el.addEventListener('click', setClick);
      el.addEventListener('change', setChange);
    }
    el.innerHTML = setH();
    document.body.classList.add('set-open');
    document.body.classList.remove('menu-open');
  } else {
    document.body.classList.remove('set-open');
    const n = document.getElementById('setN');
    if (n) saveName(n.value);
  }
}
function saveName(v) {
  v = String(v || '')
    .trim()
    .slice(0, 14);
  if (v && v !== name) {
    name = v;
    lsSet('okeyName', name);
    const nm = $('#nm');
    if (nm) nm.value = name;
  }
}
function setChange(e) {
  if (e.target.id === 'setN') saveName(e.target.value);
}
function setClick(e) {
  if (e.target.id === 'setv' || e.target.closest('#setX')) {
    openSet(false);
    render();
    return;
  }
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.sw) {
    const k = b.dataset.sw;
    if (k === 'snd') {
      SFX.setSnd(!SFX.snd);
      syncLive();
    } else if (k === 'vib') SFX.setVib(!SFX.vb);
    else if (k === 'push') {
      pushToggle(!SET.push);
      return;
    } else {
      SET[k] = !SET[k];
      if (k === 'auto') {
        autoK = '';
      }
      saveSet();
    }
    syncTg();
  } else if (b.dataset.sv) {
    const [k, v] = b.dataset.sv.split(':');
    if (k === 'lvl') setLvl(v);
    else {
      SET[k] = k === 'vol' ? +v : v;
      saveSet();
    }
    if ((k === 'vol' || k === 'pack') && SFX.snd) SFX.play(k === 'pack' ? 'discard' : 'turn');
    if (k === 'turnS') turnCue(0);
  } else if (b.id === 'histClr') {
    try {
      localStorage.removeItem('okeyHist');
    } catch (e) {}
  } else if (b.dataset.sav != null) {
    myAv = +b.dataset.sav;
    lsSet('okeyAv', String(myAv));
    SFX.play('pick');
  } else return;
  const sb = document.querySelector('#setv .sbody'),
    y = sb ? sb.scrollTop : 0;
  document.getElementById('setv').innerHTML = setH();
  const sb2 = document.querySelector('#setv .sbody');
  if (sb2) sb2.scrollTop = y;
  render();
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('#setT,#setO');
    if (t) {
      e.preventDefault();
      openSet(true);
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && setOpen) {
      openSet(false);
      render();
    }
  });
}
applySet();
/* kanlı yazı: önce düz, yazı tipi yüklenince kanlı haline geçer */
try {
  const h = document.querySelector('.top h1');
  if (h) h.innerHTML = KW.html('line');
  KW.ready(() => {
    const h2 = document.querySelector('.top h1');
    if (h2) h2.innerHTML = KW.html('line');
    try {
      A_p_reset();
    } catch (e) {}
    render();
  });
} catch (e) {}
(async () => {
  try {
    let u = null,
      d = null;
    if (typeof claude !== 'undefined' && claude && claude.use) {
      u = await claude.use('user');
      d = await claude.use('db');
    } else if (
      typeof location !== 'undefined' &&
      /^https?:$/.test(location.protocol) &&
      typeof connectServer === 'function'
    ) {
      SRV = await connectServer();
      if (SRV) {
        d = SRV.db;
        u = { id: async () => SRV.uid };
      }
    }

    if (u && d) {
      db = d;
      uid = await u.id();
      watchCfg();
      const sc = lsGet('okeyRoom');
      if (uid && sc) {
        try {
          const rs = await db.doc('rooms/' + sc).get(),
            ms = rs.exists ? await db.doc('rooms/' + sc + '/members/' + uid).get() : null;
          if (ms && ms.exists) enterRoom(sc);
        } catch (e) {}
      }
    }
  } catch (e) {}
  ready = true;
  render();
})();
