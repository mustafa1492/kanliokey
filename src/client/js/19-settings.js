/* v64 hesap ve profil (Mustafa): misafir girişi kalır; kullanıcı adı + şifre ile en basit kayıt (doğrulama yok) */
let ME_GM = false,
  PROF = null,
  accMode = 'reg',
  accMsg = '',
  accBusy = false;
async function loadProf() {
  if (!SRV) return;
  try {
    const r = await SRV.call({ op: 'profile' });
    if (r && r.ok) PROF = r.profile;
  } catch (e) {}
  const v = document.getElementById('setv');
  if (v && setOpen && setTab === 'hesap') v.innerHTML = setH();
}
function profCardH(p) {
  const bar = p.next ? Math.min(100, Math.round(((p.tp - (LVLS[p.lv - 1] || 0)) / (p.next - (LVLS[p.lv - 1] || 0))) * 100)) : 100;
  const row = (t, s) =>
    `<div class="pstat"><b>${t}</b><span><i>${s.o}</i><small>oyun</small></span><span><i>${s.w}</i><small>${t === 'Tekli' ? 'birinci' : 'kazandı'}</small></span><span><i>${s.l}</i><small>${t === 'Tekli' ? 'sonuncu' : 'kaybetti'}</small></span><span><i>%${s.pct}</i><small>oran</small></span></div>`;
  return `<div class="pcard"><div class="phd"><b class="${p.gm ? 'gmname' : ''}">${esc(p.user || 'Misafir')}</b>${p.gm ? '<em class="gmb">GM</em>' : ''}<span class="plv">Seviye ${p.lv} · ${esc(p.ad)}</span></div>
<div class="pbar" role="progressbar" aria-valuenow="${bar}" aria-valuemin="0" aria-valuemax="100"><i style="width:${bar}%"></i></div><small class="mut">${p.tp} tecrübe puanı${p.next ? ' · sonraki seviye ' + p.next : ''}</small>
${row('Tekli', p.tekli)}${row('Eşli', p.esli)}</div>`;
}
const LVLS = [0, 100, 300, 700, 1500, 3000, 6000, 12000];
function accH() {
  if (!SRV) return '<section><h4>Hesap ve profil</h4><p class="snote">Hesap sadece internetteki sürümde var.</p></section>';
  if (!PROF) return '<section><h4>Hesap ve profil</h4><p class="snote">Yükleniyor…</p></section>';
  if (PROF.user)
    return `<section><h4>Hesap ve profil</h4>${profCardH(PROF)}<div class="row" style="margin-top:8px"><button id="accOut">Çıkış yap</button></div><small class="snote">Başka telefondan aynı kullanıcı adı ve şifreyle girince profilin aynen gelir.</small></section>`;
  const reg = accMode === 'reg';
  return `<section><h4>Hesap ve profil</h4>${profCardH(PROF)}
<div class="stabs acctabs"><button data-acc="reg" class="${reg ? 'on' : ''}">Hesap oluştur</button><button data-acc="log" class="${reg ? '' : 'on'}">Giriş yap</button></div>
<div class="accf"><input id="accU" maxlength="14" placeholder="Kullanıcı adı" autocomplete="username" autocapitalize="off"><input id="accP" type="password" maxlength="64" placeholder="Şifre (en az 4)" autocomplete="${reg ? 'new-password' : 'current-password'}"><button class="p" id="${reg ? 'accReg' : 'accLog'}" ${accBusy ? 'disabled' : ''}>${reg ? 'Hesap oluştur' : 'Giriş yap'}</button></div>
${accMsg ? `<p class="accmsg">${esc(accMsg)}</p>` : ''}
<small class="snote">${reg ? 'Şu ana kadarki oyunların hesabına geçer. Sadece kullanıcı adın, şifrenin şifrelenmiş hali ve oyun istatistiklerin saklanır. Şifreni unutursan yöneticiden sıfırlamasını iste.' : 'Giriş yapınca bu telefondaki misafir istatistikleri hesaba eklenmez.'}</small></section>`;
}
async function accAct(kind) {
  const u = (document.getElementById('accU') || {}).value || '',
    p = (document.getElementById('accP') || {}).value || '';
  accBusy = true;
  accMsg = '';
  try {
    const r = await SRV.call({ op: kind === 'reg' ? 'register' : 'login', user: u, pw: p });
    if (r && r.ok && kind === 'reg') {
      PROF = r.profile;
      accMsg = '';
      render();
    } else if (r && r.ok && r.token) {
      SRV.setToken(r.token);
      location.reload();
      return;
    } else accMsg = (r && r.msg) || 'Olmadı, tekrar dene.';
  } catch (e) {
    accMsg = 'Bağlantı yok, tekrar dene.';
  }
  accBusy = false;
  const v = document.getElementById('setv');
  if (v) v.innerHTML = setH();
  render();
}
/* ayarlar sayfası: çizimden bağımsız katman. v63: iki sekme (Mustafa): Oyun ayarları ve Genel ayarlar */
let setTab = 'genel';
/* v66 (Mustafa): iki sekme: Genel ayarlar (hesapla ilgisi olmayan her şey, katlanabilir bölümler) ve Hesap ayarları */
let secOpen = new Set(['Zorluk']);
const toAcc = h =>
  h.replace(/<section><h4>([^<]+)<\/h4>([\s\S]*?)<\/section>/g, (m, t, b) => `<details class="sacc" data-sec="${t}" ${secOpen.has(t) ? 'open' : ''}><summary>${t}</summary><div class="saccb">${b}</div></details>`);
function setH() {
  const sw = (k, t, d, v) =>
    `<button class="sw" data-sw="${k}" aria-pressed="${!!v}"><span><b>${t}</b>${d ? `<small>${d}</small>` : ''}</span><i aria-hidden="true"></i></button>`;
  const seg = (k, t, items) =>
    `<div class="srow"><b>${t}</b><div class="sseg" role="radiogroup">${items.map(([v, l]) => `<button data-sv="${k}:${v}" role="radio" aria-checked="${String(SET[k]) === String(v)}" class="${String(SET[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
  const tabs = `<nav class="stabs" role="tablist">${[
    ['genel', 'Genel ayarlar'],
    ['hesap', 'Hesap ayarları']
  ]
    .map(([k, l]) => `<button role="tab" data-stab="${k}" aria-selected="${setTab === k}" class="${setTab === k ? 'on' : ''}">${l}</button>`)
    .join('')}</nav>`;
  const oyun = `<section><h4>Zorluk</h4>
${seg('lvl', 'Oyun modu', [
  ['kolay', 'Kolay'],
  ['normal', 'Normal'],
  ['zor', 'Zor']
])}
<small class="snote">${SET.lvl === 'kolay' ? 'Kolay: bütün ipuçları açık, hangi taş gelirse açacağın görünür, okeyi ya da ıstakandaki bir perin parçasını atarken uyarır, bitirebileceğin taşı gösterir.' : SET.lvl === 'zor' ? 'Zor: hiçbir ipucu ve uyarı yok, işler taş uyarısı da kapalı.' : 'Normal: açma, yandan taş ve işleme ipuçları açık; hangi taş gelirse açacağın görünmez.'}</small>
</section>
<section><h4>Istaka</h4>
${sw('smart', 'Akıllı sıralama', 'Taş gelince otomatik dizmede en yüksek açılış önce: açılacak perler yan yana, kalanlar renge göre', SET.smart)}
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
</section>`;
  const genel = `${accH()}<section><h4>Ses ve titreşim</h4>
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
${PROF && PROF.user ? `<div class="srow"><b>Adın</b><span>${esc(PROF.user)} <small class="mut">(hesabının adı)</small></span></div>` : `<div class="srow"><b>Takma adın</b><input id="setN" maxlength="14" value="${esc(name)}" placeholder="Örn. Mustafa" autocomplete="nickname"></div>`}
<div class="avgrid">${AVN.map((n, k) => `<button class="avo ${k === myAv ? 'on' : ''}" data-sav="${k}" role="radio" aria-checked="${k === myAv}">${avI(k)}<small>${n}</small></button>`).join('')}</div>
<small class="snote">Ad ve karakter bir sonraki masada geçerli olur.</small>
</section>
<section class="sabout"><a href="${RULES_URL}">Kurallar</a><small>Sürüm ${esc(APP_BUILD)}</small></section>`;
  const secs = h => h.match(/<section>[\s\S]*?<\/section>/g) || [];
  const gs = secs(genel).filter(x => !/<h4>Hesap ve profil/.test(x));
  const genelH = toAcc(secs(oyun).join('') + gs.filter(x => /<h4>(Ses ve titreşim|Ekran)</.test(x)).join('')) + (genel.match(/<section class="sabout">[\s\S]*?<\/section>/) || [''])[0];
  const hesapH = accH() + gs.filter(x => /<h4>(Profil|Oyun geçmişim)</.test(x)).join('');
  return `<div class="ssheet" role="dialog" aria-modal="true" aria-label="${setTab === 'hesap' ? 'Hesap ayarları' : 'Genel ayarlar'}"><div class="shd"><b>Ayarlar</b><button id="setX">Kapat</button></div>${tabs}<div class="sbody">
${setTab === 'hesap' ? hesapH : genelH}
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
      el.addEventListener(
        'toggle',
        e => {
          const d = e.target;
          if (!d.dataset || !d.dataset.sec) return;
          if (d.open) secOpen.add(d.dataset.sec);
          else secOpen.delete(d.dataset.sec);
        },
        true
      );
    }
    el.innerHTML = setH();
    if (setTab === 'hesap') loadProf();
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
  if (b.dataset.stab) {
    setTab = b.dataset.stab;
    document.getElementById('setv').innerHTML = setH();
    if (setTab === 'hesap') loadProf();
    return;
  }
  if (b.dataset.acc) {
    accMode = b.dataset.acc;
    accMsg = '';
    document.getElementById('setv').innerHTML = setH();
    return;
  }
  if (b.id === 'accReg' || b.id === 'accLog') {
    accAct(b.id === 'accReg' ? 'reg' : 'log');
    return;
  }
  if (b.id === 'accOut') {
    if (!b.dataset.sure) {
      b.dataset.sure = '1';
      b.textContent = 'Emin misin? Tekrar bas';
      return;
    }
    SRV.setToken('');
    location.reload();
    return;
  }
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
    const t = e.target.closest && e.target.closest('#setT,#setO,#setG');
    if (t) {
      e.preventDefault();
      setTab = t.id === 'setG' ? 'hesap' : 'genel';
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
      /* v64: hesap bilgisi (GM mi) açılışta bir kez */
      if (SRV)
        SRV.call({ op: 'profile' })
          .then(r => {
            if (r && r.ok) {
              PROF = r.profile;
              ME_GM = !!r.profile.gm;
              render();
            }
          })
          .catch(() => {});
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
