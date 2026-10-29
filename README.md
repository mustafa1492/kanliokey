# Kanlı Okey

4 kişilik, herkesin kendi telefonundan oynadığı yöresel okey. Kurallar `docs/KURALLAR.md` dosyasında. Kuralları Mustafa söyler, tahminle kural eklenmez.

## Klasörler
| Yol | Ne |
|---|---|
| `src/engine.js` | Kural motoru: per/çift, açma, işleme, okey değiştirme, bitirme, cezalar, botlar. Hem tarayıcıda hem sunucuda aynı kod. |
| `src/client.html` | Oyun ekranı (masa, ıstaka, lobi, yönetim paneli, sesler). |
| `src/net.js` | Sunucu bağlantısı (claude.ai dışında açılınca devreye girer). |
| `src/kurallar.html` | Kurallar / tanıtım sayfası (`/kurallar`). |
| `server/server.js` | Sunucu: sayfayı sunar, odaları ve oyunu yönetir, kuralları sunucuda uygular. |
| `tools/build.js` | `dist/index.html` üretir (tek dosya: motor + ağ + ekran). Aynı dosya claude.ai sayfası olarak da çalışır. |
| `test/` | Kural testleri, bot simülasyonu, sunucu testleri, iki telefonlu uçtan uca deneme. |
| `docs/` | Kurallar, plan, hile önlemleri. |

## Bilgisayarda çalıştırma
Node.js 18 ya da üstü gerekir.
```
npm install
ADMIN_PASSWORD=bir-sifre npm start
```
Tarayıcıda `http://localhost:8080` aç. Aynı ağdaki telefondan `http://BILGISAYARIN-IP:8080` ile de girilir.

## Testler
```
npm test                 # kurallar + 300 el bot simülasyonu + sunucu testleri
node test/sim.test.js 3000
```
Uçtan uca denemeler için Playwright gerekir: sunucuyu başlat, sonra `python3 test/e2e.py 8080` (iki telefon). `test/reconnect.py` (sunucu kapanıp açılınca sayfa toparlanıyor mu) ve `test/admin.py` (yönetici paneli) kendi sunucularını açar.

## İnternete yükleme (arkadaşlarla deneme)
En kolay yol Render.com (ücretsiz plan yeterli):
1. Bu klasörü GitHub'da bir depoya yükle.
2. render.com'da hesap aç, **New > Blueprint** de, depoyu seç. `render.yaml` her şeyi ayarlar.
3. Birkaç dakika sonra `https://kanli-okey-xxxx.onrender.com` gibi bir adres verir. Arkadaşlara bu adresi at.
4. Yönetici şifresi Render panelinde **Environment > ADMIN_PASSWORD** altında görünür.

Ücretsiz planın sınırları: 15 dakika kimse girmezse sunucu uyur, ilk girişte açılması yaklaşık 1 dakika sürer. Sunucu yeniden başlarsa (yeni sürüm yükleyince) süren oyunlar silinir, çünkü ücretsiz planda kalıcı disk yok. Kalıcı disk için ücretli plan ve `DATA_FILE=/var/data/state.json` ayarı gerekir.

Alan adı alınınca Render panelinden **Custom Domain** ile bağlanır.

## Ortam değişkenleri
| Ad | Varsayılan | Açıklama |
|---|---|---|
| `PORT` | 8080 | Sunucu portu |
| `ADMIN_PASSWORD` | (boş) | Yönetici şifresi. Sadece Render panelinde yazılır, buraya yazılmaz (depo herkese açık). Boşsa yönetici girişi kapalı |
| `DATA_FILE` | `data/state.json` | Odaların ve oyunların kaydedildiği dosya |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | (otomatik) | "Sıra sende" bildirimi anahtarı. Boşsa sunucu kendisi üretir ve kaydeder; Render'da disk kalıcı olmadığından yeniden başlayınca değişir ve oyuncuların bildirimi yeniden açması gerekir. Kalıcı olsun diye `node -e "console.log(require('./server/push.js').newKeys())"` çıktısındaki `pub` ve `d` değerlerini buraya yaz |
| `VAPID_SUBJECT` | mailto:kanliokey@example.com | Bildirim sunucularına verilen iletişim adresi |

## claude.ai sürümü
`dist/index.html` claude.ai'de sayfa olarak yayınlanınca claude.ai'nin kendi veritabanını kullanır (bu sürümde hile önlemleri yok, eller teknik olarak görülebilir). Kendi sunucumuzda açılınca otomatik olarak sunucuya bağlanır.
