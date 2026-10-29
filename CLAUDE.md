# Kanlı Okey — Claude için çalışma notları

Mustafa'nın yöresel 4 kişilik "kanlı okey" oyunu. Canlı adres: https://kanli-okey.onrender.com

## Mustafa ile çalışma kuralları (çok önemli)
- **Kural uydurma.** Oyun kurallarını sadece Mustafa söyler. Emin olmadığın her kural için tahmin etme, sor. Söylediği kuralı birebir uygula. Oyunun daha çok kuralı var, zamanla anlatacak.
- **Toplu güncelleme:** Bir değişiklik oyunu, kurallar sitesini (src/kurallar.html), docs/KURALLAR.md ve docs/PLAN.md'yi birlikte günceller. PLAN.md'ye her sürüm için "- [x] vNN: ..." satırı eklenir.
- **Yükleme izni:** Mustafa "yükle" demeden main'e push etme. Render main'e her push'ta otomatik deploy eder ve **deploy süren bütün oyunları siler** (disk kalıcı değil). Oyunu etkilemeyen değişiklikte (doküman, test) commit mesajına `[skip render]` ekle.
- Cevaplar kısa ve Türkçe. Mustafa iPhone kullanıyor (Safari ve Chrome), ekran görüntüsüyle hata gösterir.
- Unutulmayacak iş: **Aşama 5.5 "oyunu öğreten rehber"** (PLAN.md).
- Telefonda "hiçbir şey üst üste binmesin", taşlar okunaklı olsun: arayüz değişikliğinden sonra test/ui/t29.py ve t30.py ile ölç.

## Gizli bilgiler (depoya ASLA yazılmaz, depo herkese açık)
- Render ortam değişkenleri: `ADMIN_PASSWORD` (yönetici şifresi, sadece Render panelinde), `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (bildirim anahtarı), isteğe bağlı `VAPID_SUBJECT`. README'deki tabloya değer yazma.

## Yapı
- `src/engine.js` kural motoru (sunucu ve tarayıcı ortak). `src/client.html` arayüz (tek dosya; `/*@ENGINE@*/`, `/*@NET@*/`, `/*@WM@*/`, `'/*@BUILD@*/'`, `<!--@HEAD@-->` yer tutucuları). `src/net.js`, `src/wordmark.js`, `src/sw.js`, `src/kurallar.html`, `src/assets/` (simgeler, favicon).
- `tools/build.js` → `dist/` (index.html, kurallar.html, simgeler). `server/server.js` (WebSocket /ws, oyun sunucuda doğrulanır, botlar ve süre sunucuda), `server/push.js` (Web Push, kütüphanesiz).
- İstemcinin iki modu var: `SRV` (Render sunucusu) ve claude.ai sayfası modu (db = tarayıcı içi, botlar istemcide). Açık masalar, bildirim, oyuncu listesi, hamle kaydı sadece SRV modunda.
- Yönetici: ana ekran > Yönetici girişi. Sekmeler: Odalar, Bildirimler, Oyuncular, Özellikler (açık masa / sohbet / yeni masa kurma aç-kapa), Bot ve süre, Duyuru, İstatistik.

## Test
- `npm test` = build + motor + simülasyon + sunucu + eşli + koltuğa dönüş + push + sohbet + açık masalar + stres. Hepsi "ALL PASSED" olmalı.
- Tarayıcı testleri (Playwright, Python): `cd test && python3 ui/t29.py ../dist/index.html 393 690` gibi. `ui/mock.js` claude.ai modunu taklit eder. Önemliler: t29 (taşlar okunur, üst üste binme yok), t30 (yatay işlenen taş, hamle şeridi), t32 (eşli seçim, yönetici sekmeleri), saf.py (iOS 26 Safari alt çubuk: `python3 ui/saf.py ../dist/index.html 393 732 "<Safari 26 UA>"`), botplay (uzun bot oyunu), fuzz, menu.
- t31 sunucu ister: `PORT=8791 ADMIN_PASSWORD=test1234 DATA_FILE=/tmp/ko/state.json node server/server.js &` sonra `cd test && python3 ui/t31.py`. Sunucuyu `pkill -f "^node server/server.js"` ile kapat.
- Python e2e (çalışan sunucuyla): test/e2e.py, claim_e2e.py, chat_e2e.py, admin.py (argüman port), reconnect.py / pwa.py (argüman DATA dosya yolu!).

## Durum (v57, 30 Ekim 2026)
Son sürümler: v55 masadaki per taşları büyük ve okunaklı, yan oyuncular uzun sütun. v56 işlenen taş yatay, deste bitince yandan alınmaz, son hamle şeridi, "bitiyor!" rozeti, hata/kural bildirimi, yönetici hamle kaydı ve oyuncu listesi, herkese açık masalar (Masa seç, bot yerine otur), oda bot seviyesi. v57 iOS 26 Safari alt çubuk boşluğu, sekme logosu, sekmeli yönetim paneli, eşli oyunda "Eşin kim?" seçimi.
Açık konular: herkese açık masalarda küfür/hile önlemi ve engelleme yok; Aşama 5.5 rehber; PLAN.md'deki bazı eski işaretlenmemiş maddeler aslında yapıldı, temizlenmeli.
