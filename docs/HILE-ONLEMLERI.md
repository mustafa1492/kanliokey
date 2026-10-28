# Hile önlemleri

Bu belge sunucu sürümü için geçerlidir (claude.ai sürümünde bu korumalar yok, o sürüm sadece arkadaş denemesi içindir).

## Yapılanlar (v40)
| Hile yolu | Önlem |
|---|---|
| Başkasının elini görmek | Sunucu her oyuncuya sadece kendi elini gönderir. Diğer eller boş gelir. El bitince eller herkese açılır. |
| Desteden sıradaki taşı görmek | Deste sırası hiçbir oyuncuya gönderilmez, sadece kaç taş kaldığı gider. |
| Elinde olmayan taşı atmak / açmak | Her hamle sunucuda kural motoruyla (src/engine.js) yeniden hesaplanır. Elde olmayan, iki kez kullanılan, bozuk veri reddedilir. |
| Puanı / cezayı elle değiştirmek | Oyun kaydına istemci yazamaz. Sadece "hamle isteği" gönderebilir. |
| Sırası değilken oynamak | Sunucu sırayı ve aşamayı (çekme/atma) kendisi denetler. |
| Taş eklemek / silmek | Her hamleden sonra toplam taş sayısı (106) ve aynı taşın iki kez bulunması denetlenir. Tutmazsa hamle uygulanmaz ve kayda geçer. |
| Başkası adına oynamak | Her oyuncunun kimliği sunucunun verdiği gizli anahtardır (cihazda saklanır). Başkasının koltuğuna oturulamaz. |
| Oda kodunu tahmin etmek, sunucuyu yormak | Bağlantı başına saniyede 20 mesaj sınırı, oda kurma ve yönetici girişi deneme sınırı. |
| Başka bir siteden oyuncunun adına bağlanmak | WebSocket bağlantısı sadece oyunun kendi adresinden kabul edilir. |
| Yönetici paneline girmek | Şifre sunucuda (ADMIN_PASSWORD), 10 dakikada 6 deneme. Yönetici değilse oda listesi, istatistik, ayarlar ve başkasının odasını silme reddedilir. |
| Botların hamlesini bozmak | Botlar sunucuda oynar, istemci bot adına hamle yapamaz. |

## Yapılmayanlar (sonra)
- Aynı kişinin iki cihazla iki koltuğa oturması ve anlaşmalı oynama. Arkadaş masasında düşük risk. Yabancılarla eşleştirme açılırsa gerekir (hesap, telefon doğrulaması, şüpheli oyun raporu).
- Hamle kaydı: her hamlenin sırayla saklanması. Anlaşmazlıkta "ne oldu" bakmak ve tekrar izlemek için.
- Kasıtlı bağlantı koparma: oyuncu kötü elde çıkarsa ne olacağı (bot devralır mı, ceza mı) kural olarak Mustafa'ya sorulacak.
- Yönetici için iki adımlı giriş ve işlem kaydı (kim neyi sildi).
