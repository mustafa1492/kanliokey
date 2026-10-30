# Kanlı Okey — Claude için çalışma notları

Mustafa'nın yöresel 4 kişilik "kanlı okey" oyunu. Canlı adres: https://kanli-okey.onrender.com

## Mustafa ile çalışma kuralları (çok önemli)
- **Kural uydurma.** Oyun kurallarını sadece Mustafa söyler. Emin olmadığın her kural için tahmin etme, sor. Söylediği kuralı birebir uygula. Oyunun daha çok kuralı var, zamanla anlatacak.
- **Toplu güncelleme:** Bir değişiklik oyunu, kurallar sitesini (src/kurallar.html), docs/KURALLAR.md ve docs/PLAN.md'yi birlikte günceller. PLAN.md'ye her sürüm için "- [x] vNN: ..." satırı eklenir.
- **Yükleme izni:** Mustafa "yükle" demeden main'e push etme. Render main'e her push'ta otomatik deploy eder ve **deploy süren bütün oyunları siler** (disk kalıcı değil). Oyunu etkilemeyen değişiklikte (doküman, test) commit mesajına `[skip render]` ekle.
- Cevaplar kısa ve Türkçe. Mustafa iPhone kullanıyor (Safari ve Chrome), ekran görüntüsüyle hata gösterir.
- Unutulmayacak iş: **Aşama 5.5 "oyunu öğreten rehber"** (PLAN.md).
- Cezalarla ilgili bir iş yapılınca Mustafa'ya hatırlat: oyundan çıkan oyuncunun cezası henüz yok (şimdilik ceza yok kararı, PLAN.md "Sürekli işler").
- Telefonda "hiçbir şey üst üste binmesin", taşlar okunaklı olsun: arayüz değişikliğinden sonra test/ui/t29.py ve t30.py ile ölç.

## Gizli bilgiler (depoya ASLA yazılmaz, depo herkese açık)
- Render ortam değişkenleri: `ADMIN_PASSWORD` (yönetici şifresi, sadece Render panelinde), `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (bildirim anahtarı), isteğe bağlı `VAPID_SUBJECT`. README'deki tabloya değer yazma.

## Yapı
- `src/engine.js` kural motoru (sunucu ve tarayıcı ortak). Arayüz `src/client/` (yer tutucular: `/*@ENGINE@*/`, `/*@NET@*/` shell.html'de; `/*@WM@*/` js/01-core; `'/*@BUILD@*/'`, `'/*@RULES@*/'` js/10-app; `<!--@HEAD@-->` shell.html).
- Arayüz `src/client/` altında bölümlere ayrılı (v60 bakımı). `tools/build.js` dosya adı sırasıyla birleştirip `dist/index.html` üretir; sıra önemli (CSS'te sonraki kural öncekini ezer, JS'te üstteki tanımlar alttakilerce kullanılır). Yeni kod ilgili dosyaya yazılır, yeni dosya gerekirse numarayla sıraya sokulur. Bölme bayt bayt aynı çıktı verdi; sonra Prettier ile açıldı (.prettierrc). Yeni kodu da bu biçimde yaz.
  - `shell.html` sayfa iskeleti (head, `<!--@CSS@-->`, gövde, motor/ağ scriptleri, `<!--@JS@-->`)
  - `css/01-base` temel düzen, masa ızgarası, taşlar, ıstaka · `02-theme` koyu tema (v35), menü, koltuk renkleri, el sonu kartı · `03-home` logo, ana ekran, lobi, kanlı yazı · `04-game-fx` karakterler, büyük anlar, ahşap ıstakalar · `05-panels` ayarlar, uyarılar, ipuçları, yakınlaştırma, tepkiler · `06-phone` zorluk/odak, yatay ekran, sohbet, telefon masa düzeni (v55, v59)
  - `js/01-core` `$` ve logo (wordmark) · `02-sound-data` gömülü MP3'ler (450 KB, açma) · `03-sound` ses ve titreşim · `04-prefs` cihaz ayarları (SET), masa sözleri, karakterler, telefona ekleme · `05-table-fx` masa damgası, koltuk renkleri, ses farkları, son hamle şeridi/geçmiş · `06-history` oyun geçmişim · `07-chat` tepkiler, sohbet, oyuncu yakınlaştırma · `08-hints` ipuçları (yandan, açma, işleme) · `09-toast` uyarılar, büyük anlar, efektler · `10-app` durum (db, SRV, kurallar penceresi), oda kur/katıl, açık masalar, bildirim · `11-lobby` ana ekran ve bekleme odası HTML'i · `12-admin` yönetim paneli (sekmeler, bakım) · `13-actions` hamleler (act, at, işle, aç) · `14-timer-bots` CFG, sıra süresi, istemci botları · `15-table-ui` masa süsleri, cezalar paneli, el sonu ekranı · `16-render` ana çizim (render, uçan taşlar, perlerin sığdırılması, render0: masa + ıstaka + düğmeler) · `17-rack-drag` sürükle-bırak, sıralama, ıstaka yuvaları · `18-push` "sıra sende" bildirimi · `19-settings` ayarlar sayfası `src/net.js`, `src/wordmark.js`, `src/sw.js`, `src/kurallar.html`, `src/assets/` (simgeler, favicon).
- `tools/build.js` → `dist/` (index.html, kurallar.html, simgeler). `server/server.js` (WebSocket /ws, oyun sunucuda doğrulanır, botlar ve süre sunucuda), `server/push.js` (Web Push, kütüphanesiz).
- İstemcinin iki modu var: `SRV` (Render sunucusu) ve claude.ai sayfası modu (db = tarayıcı içi, botlar istemcide). Açık masalar, bildirim, oyuncu listesi, hamle kaydı sadece SRV modunda.
- Yönetici: ana ekran > Yönetici girişi. Sekmeler: Odalar, Bildirimler, Oyuncular, Özellikler (açık masa / sohbet / yeni masa kurma aç-kapa), Bot ve süre, Duyuru, İstatistik.

## Test
- `npm test` = build + motor + simülasyon + sunucu + eşli + koltuğa dönüş + push + sohbet + açık masalar + stres. Hepsi "ALL PASSED" olmalı.
- Tarayıcı testleri (Playwright, Python): `cd test && python3 ui/t29.py ../dist/index.html 393 690` gibi. `ui/mock.js` claude.ai modunu taklit eder. Önemliler: t29 (taşlar okunur, üst üste binme yok), t30 (yatay işlenen taş, hamle şeridi), t32 (eşli seçim, yönetici sekmeleri), saf.py (iOS 26 Safari alt çubuk: `python3 ui/saf.py ../dist/index.html 393 732 "<Safari 26 UA>"`), botplay (uzun bot oyunu), fuzz, menu.
- t31 sunucu ister: `PORT=8791 ADMIN_PASSWORD=test1234 DATA_FILE=/tmp/ko/state.json node server/server.js &` sonra `cd test && python3 ui/t31.py`. Sunucuyu `pkill -f "^node server/server.js"` ile kapat.
- Python e2e (çalışan sunucuyla): test/e2e.py, claim_e2e.py, chat_e2e.py, admin.py (argüman port), reconnect.py / pwa.py (argüman DATA dosya yolu!).

## Durum (v58, 31 Ekim 2026, canlıda)
Son sürümler: v56 işlenen taş yatay, son hamle şeridi, herkese açık masalar, bildirimler. v57 iOS 26 Safari alt çubuk, sekmeli yönetim paneli, eşli oyunda "Eşin kim?". v58 katlamalıda yandan sayılır (17 → 17+y1 → 17+y2 → 18), kurallar oyunun içinde açılır, .dockerignore düzeltmesi (v57 Render'da bu yüzden derlenmiyordu; Render servisi Docker ile derleniyor).
Sıradaki iş: docs/PLAN.md "Mustafa'nın istekleri" listesi. İlk madde ACİL: iPhone Safari'de bütün oyuncular masanın üstünde görünüyor.
Açık konular: herkese açık masalarda küfür/hile önlemi ve engelleme yok; Aşama 5.5 rehber.
