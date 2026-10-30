/* ===== ayarlar (v48): bu cihaza kaydedilir ===== */
const SETD = {
  smart: true,
  auto: false,
  warn: true,
  dbl: false,
  felt: 'yesil',
  cb: false,
  fx: 'tam',
  vol: 2,
  low10: true,
  hYan: true,
  hAc: true,
  hIs: true,
  big: false,
  lvl: 'normal',
  focus: false,
  amb: false,
  pack: 'gercek',
  turnS: 'can',
  wake: true,
  push: false
};
let SET = (() => {
  try {
    return { ...SETD, ...JSON.parse(localStorage.getItem('okeySet') || '{}') };
  } catch (e) {
    return { ...SETD };
  }
})();
let setOpen = false;
/* zorluk: kolay her şeyi kolaylaştırır; zor modda hiçbir ipucu yok */
const LVL = {
  kolay: { hYan: true, hAc: true, hIs: true, warn: true, smart: true },
  normal: { hYan: true, hAc: true, hIs: true, warn: true },
  zor: { hYan: false, hAc: false, hIs: false, warn: false }
};
function setLvl(v) {
  SET.lvl = v;
  Object.assign(SET, LVL[v] || {});
  saveSet();
}
function applySet() {
  try {
    setRack(SET.big ? 10 : 12);
  } catch (e) {}
  try {
    const b = document.body;
    if (!b) return;
    b.classList.toggle('focus', !!SET.focus);
    b.dataset.felt = SET.felt;
    b.classList.toggle('cb', !!SET.cb);
    b.classList.toggle('lowfx', SET.fx === 'sade');
    b.classList.toggle('big', !!SET.big);
    SFX.setVol(SET.vol);
    SFX.setPack(SET.pack);
    syncLive();
  } catch (e) {}
}
/* oyundayken: kahvehane uğultusu ve ekranı açık tutma */
let wakeL = null,
  wakeBusy = false;
function syncLive() {
  if (typeof document === 'undefined' || !document.body) return;
  const inGame = document.body.classList.contains('gmode') && !document.hidden;
  try {
    SFX.ambient(!!(SET.amb && inGame && SFX.snd));
  } catch (e) {}
  const want = !!(SET.wake && inGame);
  if (wakeBusy) return;
  try {
    if (want && !wakeL && typeof navigator !== 'undefined' && navigator.wakeLock) {
      wakeBusy = true;
      navigator.wakeLock
        .request('screen')
        .then(l => {
          wakeL = l;
          wakeBusy = false;
          l.addEventListener('release', () => {
            if (wakeL === l) wakeL = null;
          });
        })
        .catch(() => {
          wakeBusy = false;
        });
    } else if (!want && wakeL) {
      const w = wakeL;
      wakeL = null;
      w.release().catch(() => {});
    }
  } catch (e) {
    wakeBusy = false;
  }
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function')
  document.addEventListener('visibilitychange', () => {
    try {
      syncLive();
    } catch (e) {}
  });
/* sıra sende sesi: çan, konuşma ya da kapalı */
function turnCue(ms) {
  if (SET.turnS === 'kapali') return;
  if (SET.turnS === 'ses') {
    setTimeout(() => {
      try {
        if (!SFX.snd || document.hidden || typeof speechSynthesis === 'undefined') {
          SFX.play('turn');
          return;
        }
        const u = new SpeechSynthesisUtterance('Sıra sende');
        u.lang = 'tr-TR';
        u.rate = 1.05;
        u.volume = Math.min(1, [0.4, 0.6, 0.85, 1][SET.vol] || 0.85);
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      } catch (e) {
        SFX.play('turn');
      }
    }, ms);
    return;
  }
  SFX.later('turn', ms);
}
function saveSet() {
  try {
    localStorage.setItem('okeySet', JSON.stringify(SET));
  } catch (e) {}
  applySet();
}
const fxOn = () => SET.fx !== 'sade' && (typeof FLYOK === 'undefined' || FLYOK);
const LOGO = `<svg class="emb" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="kt" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#fffcf3"/><stop offset=".55" stop-color="#f3ead2"/><stop offset="1" stop-color="#dccfa9"/></linearGradient><linearGradient id="kb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0404c"/><stop offset=".55" stop-color="#c4141f"/><stop offset="1" stop-color="#7d0a12"/></linearGradient></defs><g transform="rotate(-7 60 60)"><rect x="29" y="17" width="64" height="86" rx="10" fill="#8a7a55"/><rect x="29" y="13" width="64" height="86" rx="10" fill="url(#kt)" stroke="#b9ad8a" stroke-width="1.5"/><rect x="34" y="18" width="54" height="76" rx="7" fill="none" stroke="#00000014" stroke-width="1.5"/><path d="M61 27C61 27 44 50 44 62a17 17 0 0 0 34 0C78 50 61 27 61 27Z" fill="url(#kb)"/><ellipse cx="54.5" cy="58" rx="3.6" ry="7" fill="#ffffff70" transform="rotate(18 54.5 58)"/><path d="M47 98.5c1.5 0 2.4 1.2 2.4 3.4v7.6a2.6 2.6 0 0 1-5.2 0v-7.6c0-2.2 1.1-3.4 2.8-3.4z" fill="url(#kb)"/><circle cx="46.8" cy="113.5" r="3.4" fill="#a50f18"/><path d="M71 98.6c1 0 1.6.9 1.6 2.3v3.4a1.7 1.7 0 0 1-3.4 0v-3.4c0-1.4.7-2.3 1.8-2.3z" fill="#b3101a"/></g></svg>`;
/* masa sözleri (Mustafa seçti): ana ekranda sırayla döner */
const SOZ = [
  ['Çift açan tek kalır, tek kalan içine alır.', 'Masa sözü'],
  ['Kanlı okeyde dost olmaz.', 'Masa sözü'],
  ['Bu kurallar kan ile yazıldı.', 'Masa sözü'],
  ['Kan kanla yıkanmaz; kanlı okeyde el kanla değil, sabırla kazanılır.', 'Masa sözü'],
  ["Muco'nun sabrını zorlarsan kafana ıstakayı yiyebilirsin.", 'Mamika']
];
const QUOTES = `<div class="qs" style="--n:${SOZ.length}" aria-live="off">${SOZ.map(([t, a], i) => `<figure class="q" style="--i:${i}"><blockquote>“${t}”</blockquote><figcaption>${a}</figcaption></figure>`).join('')}</div>`;
/* ana ekran arka planı: yukarıdan bulanık okey masası, dağınık taşlar, titreyen kahvehane lambası */
const HOMEBG = (() => {
  const T = [
    [6, 47, '7', 0, -18],
    [93, 50, '12', 1, 22],
    [22, 45, '3', 2, -8],
    [78, 44, '9', 3, 31],
    [50, 43.5, '★', 4, 12],
    [3, 64, '10', 0, -25],
    [97, 70, '1', 1, 8],
    [4, 86, '5', 2, 40],
    [96, 90, '13', 3, -30],
    [30, 99, '8', 1, 15],
    [70, 98, '11', 0, -12]
  ];
  return `<div class="homebg" aria-hidden="true"><div class="hb-table"></div><div class="hb-tiles">${T.map(([x, y, n, c, r]) => `<i class="c${c}" style="left:${x}%;top:${y}%;--r:${r}deg">${n}</i>`).join('')}</div><div class="hb-lamp"></div><div class="hb-vig"></div></div>`;
})();
const SPLASH = `<div class="splash" role="status"><div class="spl-logo"><svg class="emb" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="kt" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#fffcf3"/><stop offset=".55" stop-color="#f3ead2"/><stop offset="1" stop-color="#dccfa9"/></linearGradient><linearGradient id="kb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0404c"/><stop offset=".55" stop-color="#c4141f"/><stop offset="1" stop-color="#7d0a12"/></linearGradient></defs><g transform="rotate(-7 60 60)"><rect x="29" y="17" width="64" height="86" rx="10" fill="#8a7a55"/><rect x="29" y="13" width="64" height="86" rx="10" fill="url(#kt)" stroke="#b9ad8a" stroke-width="1.5"/><rect x="34" y="18" width="54" height="76" rx="7" fill="none" stroke="#00000014" stroke-width="1.5"/><path d="M61 27C61 27 44 50 44 62a17 17 0 0 0 34 0C78 50 61 27 61 27Z" fill="url(#kb)"/><ellipse cx="54.5" cy="58" rx="3.6" ry="7" fill="#ffffff70" transform="rotate(18 54.5 58)"/><path d="M47 98.5c1.5 0 2.4 1.2 2.4 3.4v7.6a2.6 2.6 0 0 1-5.2 0v-7.6c0-2.2 1.1-3.4 2.8-3.4z" fill="url(#kb)"/><circle cx="46.8" cy="113.5" r="3.4" fill="#a50f18"/><path d="M71 98.6c1 0 1.6.9 1.6 2.3v3.4a1.7 1.7 0 0 1-3.4 0v-3.4c0-1.4.7-2.3 1.8-2.3z" fill="#b3101a"/></g></svg></div><b>Masa hazırlanıyor…</b><div class="shuf" aria-hidden="true"><i class="c0">7</i><i class="c1">8</i><i class="c2">9</i><i class="c3">10</i></div><small class="slow">Sunucu uyanıyor, ilk açılış bir dakika sürebilir.</small></div>`;
/* telefona uygulama gibi ekleme (sunucu sürümü) */
let instEv = null;
if (typeof window !== 'undefined' && window.addEventListener)
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    instEv = e;
    try {
      render();
    } catch (_) {}
  });
/* kahvehane karakterleri (v42): oyuncu ana ekranda seçer, masada koltuk dairesinde görünür (kendi çizimlerimiz) */
const AVN = ['Çay', 'Tespih', 'Amca', 'Kasketli', 'Zar', 'Kahve', 'Simit', 'Kanlı taş'];
const AVSYM = `<svg class="avsprite" width="0" height="0" aria-hidden="true" focusable="false"><defs><symbol id="av0" viewBox="0 0 32 32"><ellipse cx="16" cy="27.2" rx="10.5" ry="2.8" fill="#efe6d2"/><ellipse cx="16" cy="26.6" rx="7" ry="1.6" fill="#cfc4ac"/><path d="M9.3 5.8Q10.3 14 12.9 17.2Q11.7 21.5 12 26.3H20Q20.3 21.5 19.1 17.2Q21.7 14 22.7 5.8Z" fill="#c2471a"/><path d="M9.3 5.8Q10.3 14 12.9 17.2Q11.7 21.5 12 26.3H20Q20.3 21.5 19.1 17.2Q21.7 14 22.7 5.8Z" fill="none" stroke="#fff4dc" stroke-width="1.3"/><ellipse cx="16" cy="5.9" rx="6.7" ry="1.7" fill="#ee8d3e" stroke="#fff4dc" stroke-width="1.1"/><path d="M11.5 8.6Q12.2 13.4 14.2 16" stroke="#fff" stroke-opacity=".8" stroke-width="1.4" fill="none" stroke-linecap="round"/></symbol><symbol id="av1" viewBox="0 0 32 32"><path d="M16 19.5v4.5" stroke="#f4b648" stroke-width="2.8" stroke-linecap="round"/><path d="M14 24.4h4l1.4 5.6h-6.8z" fill="#d11d24"/><path d="M14.7 25.4l-.5 4.4M16 25.4v4.5M17.3 25.4l.5 4.4" stroke="#ff9a8a" stroke-width=".7"/><g fill="#f4b648" stroke="#5a2c0a" stroke-width=".7"><circle cx="11.9" cy="19.6" r="2.05"/><circle cx="9.3" cy="17.2" r="2.05"/><circle cx="7.9" cy="13.9" r="2.05"/><circle cx="8.1" cy="10.4" r="2.05"/><circle cx="9.7" cy="7.2" r="2.05"/><circle cx="12.5" cy="5.1" r="2.05"/><circle cx="16.0" cy="4.3" r="2.05"/><circle cx="19.5" cy="5.1" r="2.05"/><circle cx="22.3" cy="7.2" r="2.05"/><circle cx="23.9" cy="10.4" r="2.05"/><circle cx="24.1" cy="13.9" r="2.05"/><circle cx="22.7" cy="17.2" r="2.05"/><circle cx="20.1" cy="19.6" r="2.05"/></g><g fill="#fff" fill-opacity=".75"><circle cx="11.3" cy="19.0" r=".65"/><circle cx="8.7" cy="16.6" r=".65"/><circle cx="7.3" cy="13.3" r=".65"/><circle cx="7.5" cy="9.8" r=".65"/><circle cx="9.1" cy="6.6" r=".65"/><circle cx="11.9" cy="4.5" r=".65"/><circle cx="15.4" cy="3.7" r=".65"/><circle cx="18.9" cy="4.5" r=".65"/><circle cx="21.7" cy="6.6" r=".65"/><circle cx="23.3" cy="9.8" r=".65"/><circle cx="23.5" cy="13.3" r=".65"/><circle cx="22.1" cy="16.6" r=".65"/><circle cx="19.5" cy="19.0" r=".65"/></g></symbol><symbol id="av2" viewBox="0 0 32 32"><path d="M7 14.5Q7 4.6 16 4.6T25 14.5V18Q25 27.5 16 27.5T7 18Z" fill="#f0c296"/><path d="M7 15.5Q6.2 9 9.6 7.2Q8.6 11 9.2 15.6ZM25 15.5Q25.8 9 22.4 7.2Q23.4 11 22.8 15.6Z" fill="#d9d4ca"/><ellipse cx="6.6" cy="16.6" rx="1.6" ry="2.4" fill="#e6ad7e"/><ellipse cx="25.4" cy="16.6" rx="1.6" ry="2.4" fill="#e6ad7e"/><path d="M10.5 12.3q2-1.3 3.8 0M17.7 12.3q2-1.3 3.8 0" stroke="#e9e4da" stroke-width="1.5" stroke-linecap="round" fill="none"/><circle cx="12.5" cy="14.6" r="1.15" fill="#2a1a10"/><circle cx="19.5" cy="14.6" r="1.15" fill="#2a1a10"/><path d="M16 15.5q-1.6 2.6-.4 3.9h1.6" stroke="#c98b5e" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M16 19.4Q12.6 18 9.6 19.5Q8.2 20.4 7.6 23Q10 21.2 12 22Q14.4 22.6 16 20.9Q17.6 22.6 20 22Q22 21.2 24.4 23Q23.8 20.4 22.4 19.5Q19.4 18 16 19.4Z" fill="#2b1d16"/><path d="M13.6 24.4q2.4 1 4.8 0" stroke="#a5623e" stroke-width="1" fill="none" stroke-linecap="round"/></symbol><symbol id="av3" viewBox="0 0 32 32"><path d="M8 16.5Q8 27.6 16 27.6T24 16.5V14H8Z" fill="#e9b88c"/><ellipse cx="7.7" cy="18" rx="1.5" ry="2.3" fill="#d9a073"/><ellipse cx="24.3" cy="18" rx="1.5" ry="2.3" fill="#d9a073"/><circle cx="12.7" cy="18.2" r="1.1" fill="#2a1a10"/><circle cx="19.3" cy="18.2" r="1.1" fill="#2a1a10"/><path d="M11.2 16.2h3M17.8 16.2h3" stroke="#5a3a24" stroke-width="1.2" stroke-linecap="round"/><path d="M13.2 23.4q2.8 1.2 5.6 0" stroke="#9c5a36" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M10.4 21.6q0 4.6 5.6 5.3q5.6-.7 5.6-5.3" fill="none" stroke="#7a6a5c" stroke-width=".8" stroke-dasharray=".1 1.3" stroke-linecap="round"/><path d="M6.4 14.6Q6 6.2 15.6 5.4Q25.4 5 26 12.6Q26.2 14.4 24.6 14.8Q16 13 7.6 15.6Q6.5 15.8 6.4 14.6Z" fill="#7c6450"/><path d="M5.2 15.8Q14 11.6 25.2 14.2Q26.6 15.2 25 16Q15 14.4 6 17.4Q4.4 17.2 5.2 15.8Z" fill="#5c4836"/><path d="M8.6 9.8Q15 6.4 23.4 9.2" stroke="#a48a72" stroke-width=".8" fill="none"/><circle cx="15.8" cy="5.6" r="1" fill="#5c4836"/></symbol><symbol id="av4" viewBox="0 0 32 32"><g transform="rotate(-14 11 17)"><rect x="3.6" y="9.6" width="14.4" height="14.4" rx="3" fill="#f6efe0" stroke="#bfb39a" stroke-width=".8"/><circle cx="7.4" cy="13.4" r="1.4" fill="#c4161c"/><circle cx="10.8" cy="16.8" r="1.4" fill="#c4161c"/><circle cx="14.2" cy="20.2" r="1.4" fill="#c4161c"/></g><g transform="rotate(12 22 13)"><rect x="15" y="5.8" width="13.4" height="13.4" rx="2.8" fill="#fffaf0" stroke="#bfb39a" stroke-width=".8"/><circle cx="18.6" cy="9.4" r="1.3" fill="#1b1b1b"/><circle cx="24.8" cy="9.4" r="1.3" fill="#1b1b1b"/><circle cx="18.6" cy="15.6" r="1.3" fill="#1b1b1b"/><circle cx="24.8" cy="15.6" r="1.3" fill="#1b1b1b"/></g></symbol><symbol id="av5" viewBox="0 0 32 32"><ellipse cx="15" cy="26.4" rx="11.8" ry="3.2" fill="#f2ead8"/><ellipse cx="15" cy="25.8" rx="8" ry="1.8" fill="#d8ccb2"/><path d="M21.8 13.2q5.6-.6 5 4.2q-.6 3.8-6.2 3.6" stroke="#f6efe0" stroke-width="2.2" fill="none"/><path d="M7.4 11.2Q7.6 22.6 10.6 25.2H19.4Q22.4 22.6 22.6 11.2Z" fill="#fbf6ea"/><path d="M7.6 15.4H22.4Q22.2 18 21.7 19.6H8.3Q7.8 18 7.6 15.4Z" fill="#c4161c"/><path d="M9.6 17.5h2M13.6 17.5h2.6M18.2 17.5h2" stroke="#ffd36a" stroke-width="1" stroke-linecap="round"/><ellipse cx="15" cy="11.2" rx="7.6" ry="2" fill="#4a2a18" stroke="#fbf6ea" stroke-width="1"/><ellipse cx="15" cy="11.3" rx="5.6" ry="1.2" fill="#9a6a40"/><path d="M12 8.2q-1.4-2 0-3.6M16.6 8q-1.4-2 0-3.8" stroke="#ffffff99" stroke-width="1" fill="none" stroke-linecap="round"/></symbol><symbol id="av6" viewBox="0 0 32 32"><circle cx="16" cy="16.8" r="13.4" fill="#5e2508"/><path fill-rule="evenodd" d="M16 3.2a12.8 12.8 0 1 1 0 25.6a12.8 12.8 0 1 1 0-25.6ZM16 9.6a6.4 6.4 0 1 0 0 12.8a6.4 6.4 0 1 0 0-12.8Z" fill="#b2541b"/><path d="M23.0 16.0Q26.0 16.5 27.7 20.7M22.3 19.0Q24.8 20.8 24.5 25.3M20.4 21.5Q21.8 24.1 19.6 28.1M17.6 22.8Q17.7 25.8 14.0 28.4M14.4 22.8Q13.3 25.6 8.8 26.4M11.6 21.5Q9.4 23.5 5.1 22.2M9.7 19.0Q6.8 19.9 3.4 16.9M9.0 16.0Q6.0 15.5 4.3 11.3M9.7 13.0Q7.2 11.2 7.5 6.7M11.6 10.5Q10.2 7.9 12.4 3.9M14.4 9.2Q14.3 6.2 18.0 3.6M17.6 9.2Q18.7 6.4 23.2 5.6M20.4 10.5Q22.6 8.5 26.9 9.8M22.3 13.0Q25.2 12.1 28.6 15.1" stroke="#7d330c" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M6.4 11.2Q9.4 5.4 16 4.6" stroke="#e08a44" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="16" cy="16" r="6.4" fill="#1e1410"/><g fill="#fff0cc"><ellipse cx="12.3" cy="23.4" rx=".85" ry=".45" transform="rotate(117 12.3 23.4)"/><ellipse cx="25.0" cy="20.4" rx=".85" ry=".45" transform="rotate(66 25.0 20.4)"/><ellipse cx="25.3" cy="19.5" rx=".85" ry=".45" transform="rotate(7 25.3 19.5)"/><ellipse cx="8.8" cy="19.2" rx=".85" ry=".45" transform="rotate(16 8.8 19.2)"/><ellipse cx="5.9" cy="21.2" rx=".85" ry=".45" transform="rotate(22 5.9 21.2)"/><ellipse cx="17.8" cy="26.3" rx=".85" ry=".45" transform="rotate(171 17.8 26.3)"/><ellipse cx="7.7" cy="11.6" rx=".85" ry=".45" transform="rotate(176 7.7 11.6)"/><ellipse cx="27.1" cy="19.3" rx=".85" ry=".45" transform="rotate(52 27.1 19.3)"/><ellipse cx="21.0" cy="22.4" rx=".85" ry=".45" transform="rotate(56 21.0 22.4)"/><ellipse cx="19.4" cy="8.3" rx=".85" ry=".45" transform="rotate(105 19.4 8.3)"/><ellipse cx="10.0" cy="8.9" rx=".85" ry=".45" transform="rotate(99 10.0 8.9)"/><ellipse cx="23.3" cy="19.0" rx=".85" ry=".45" transform="rotate(37 23.3 19.0)"/><ellipse cx="11.9" cy="7.3" rx=".85" ry=".45" transform="rotate(57 11.9 7.3)"/><ellipse cx="7.7" cy="11.0" rx=".85" ry=".45" transform="rotate(54 7.7 11.0)"/><ellipse cx="19.0" cy="5.6" rx=".85" ry=".45" transform="rotate(44 19.0 5.6)"/><ellipse cx="7.1" cy="11.5" rx=".85" ry=".45" transform="rotate(158 7.1 11.5)"/><ellipse cx="14.9" cy="7.1" rx=".85" ry=".45" transform="rotate(176 14.9 7.1)"/><ellipse cx="23.0" cy="22.4" rx=".85" ry=".45" transform="rotate(136 23.0 22.4)"/><ellipse cx="21.7" cy="24.0" rx=".85" ry=".45" transform="rotate(7 21.7 24.0)"/><ellipse cx="10.5" cy="6.3" rx=".85" ry=".45" transform="rotate(103 10.5 6.3)"/><ellipse cx="22.4" cy="9.6" rx=".85" ry=".45" transform="rotate(125 22.4 9.6)"/><ellipse cx="7.5" cy="10.3" rx=".85" ry=".45" transform="rotate(82 7.5 10.3)"/><ellipse cx="22.4" cy="5.9" rx=".85" ry=".45" transform="rotate(85 22.4 5.9)"/><ellipse cx="12.0" cy="9.2" rx=".85" ry=".45" transform="rotate(126 12.0 9.2)"/><ellipse cx="8.7" cy="6.3" rx=".85" ry=".45" transform="rotate(148 8.7 6.3)"/><ellipse cx="14.0" cy="25.2" rx=".85" ry=".45" transform="rotate(120 14.0 25.2)"/><ellipse cx="25.6" cy="17.4" rx=".85" ry=".45" transform="rotate(30 25.6 17.4)"/><ellipse cx="21.8" cy="21.3" rx=".85" ry=".45" transform="rotate(138 21.8 21.3)"/><ellipse cx="22.0" cy="22.3" rx=".85" ry=".45" transform="rotate(70 22.0 22.3)"/><ellipse cx="21.5" cy="10.2" rx=".85" ry=".45" transform="rotate(81 21.5 10.2)"/><ellipse cx="4.9" cy="12.4" rx=".85" ry=".45" transform="rotate(147 4.9 12.4)"/><ellipse cx="21.8" cy="9.3" rx=".85" ry=".45" transform="rotate(75 21.8 9.3)"/><ellipse cx="8.6" cy="25.0" rx=".85" ry=".45" transform="rotate(172 8.6 25.0)"/><ellipse cx="20.9" cy="22.8" rx=".85" ry=".45" transform="rotate(42 20.9 22.8)"/></g></symbol><symbol id="av7" viewBox="0 0 32 32"><g transform="rotate(-8 16 16)"><rect x="7.4" y="5.4" width="17.6" height="23.4" rx="3.2" fill="#8a7a55"/><rect x="7.4" y="4.2" width="17.6" height="23.4" rx="3.2" fill="#f6eedb" stroke="#c8bb98" stroke-width=".8"/><path d="M16.2 7.6Q16.2 7.6 11.6 14Q10.4 15.8 10.4 17.4a5.8 5.8 0 0 0 11.6 0Q22 15.8 20.8 14Z" fill="#c4141f"/><ellipse cx="13.8" cy="16" rx="1.1" ry="2.2" fill="#ffffff80" transform="rotate(18 13.8 16)"/><path d="M12.6 22.6c.6 0 1 .5 1 1.4v2a1.05 1.05 0 0 1-2.1 0v-2c0-.9.5-1.4 1.1-1.4z" fill="#b3101a"/></g></symbol></defs></svg>`;
let avOpen = false,
  myAv = (() => {
    try {
      const v = localStorage.getItem('okeyAv');
      if (v != null && /^[0-7]$/.test(v)) return +v;
    } catch (e) {}
    const r = (Math.random() * 8) | 0;
    try {
      localStorage.setItem('okeyAv', String(r));
    } catch (e) {}
    return r;
  })();
const avI = k =>
  `<svg class="avi" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><use href="#av${k}"/></svg>`;
const botAv = u => [2, 0, 6, 4][((parseInt(String(u).slice(3)) || 1) - 1) % 4];
function seatAv(u) {
  if (isBot(u)) return botAv(u);
  const m = (L || []).find(x => x.id === u),
    v = m ? +m.av : NaN;
  return v >= 0 && v < 8 && (v | 0) === v ? v : -1;
}
const isStandalone = () => {
  try {
    return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  } catch (e) {
    return false;
  }
};
/* iOS 26 Safari: alttaki yüzen araç çubuğu sayfanın üstüne biner (100dvh onun arkasına kadar uzanır); oyunda alta boşluk bırakılır */
const IOSBAR = (() => {
  try {
    const u = navigator.userAgent;
    if (!/iPhone|iPod/.test(u) || /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(u)) return false;
    const m = /Version\/(\d+)/.exec(u);
    return !!m && +m[1] >= 26 && !isStandalone();
  } catch (e) {
    return false;
  }
})();
try {
  if (IOSBAR) document.documentElement.classList.add('iosbar');
} catch (e) {}
async function installApp() {
  if (instEv) {
    try {
      instEv.prompt();
      await instEv.userChoice;
    } catch (e) {}
    instEv = null;
    render();
    return;
  }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
  msg = ios
    ? 'iPhone: Safari\'de alttaki Paylaş düğmesine bas, "Ana Ekrana Ekle"yi seç.'
    : 'Tarayıcının menüsünden (⋮) "Ana ekrana ekle" ya da "Uygulamayı yükle"yi seç.';
  render();
}
/* yeni sürüm: sunucu yeni sürümdeyse ana ekrandayken sayfa kendini yeniler, oyundayken menüde haber verir */
let newVer = false;
if (typeof window !== 'undefined' && window.addEventListener)
  window.addEventListener('ko-newver', () => {
    if (!S || S.ph === 'end') {
      let t = 0;
      try {
        t = +sessionStorage.getItem('ko_rl') || 0;
      } catch (e) {}
      if (Date.now() - t > 60000) {
        try {
          sessionStorage.setItem('ko_rl', String(Date.now()));
        } catch (e) {}
        location.reload();
        return;
      }
    }
    newVer = true;
    try {
      render();
    } catch (e) {}
  });
