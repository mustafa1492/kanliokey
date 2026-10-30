# Kanlı Okey: Uzun Vadeli Plan (v2)

Hedef: Kanlı okeyi gerçek kurallarıyla, herkesin web üzerinden oynayabildiği, başka hiçbir yerde bulunmayan bir oyuna dönüştürmek.

Çalışma kuralları
- Kuralları Mustafa söyler. Söylemediği kural tahminle eklenmez, sorulur.
- Kural gelince KURALLAR.md, oyun, tanıtım sitesi ve testler birlikte, toplu güncellenir.
- Her aşama bitince çalıştığı denenir, sonra sonrakine geçilir.

## Neden bu oyun fark yaratır
- Kuralları bölgeye özgü, internette neredeyse hiç yok. "Kanlı okey nasıl oynanır" diye arayan kimse düzgün bir kaynak bulamıyor.
- Kurallar karışık (işleme, okey değiştirme, çarpanlar). Bunu otomatik hesaplayıp "neden bu ceza yazıldı" diye açıklayan bir oyun, kağıt kalemle oynamaktan çok daha iyi.
- Arkadaş grubuyla oynanan bir oyun. Oda kodu + WhatsApp daveti yeterli, uygulama indirtmek gerekmez.

## Durum
- [x] Oyun sayfası (claude.ai içinde, 4 kişi, tüm kurallar şu an KURALLAR.md'deki gibi çalışıyor, bot var)
- [x] Tanıtım sitesi
- [x] Oyun kur / koda katıl (5 harfli oda kodu), her oda ayrı kayıt
- [x] Yönetim paneli ilk sürüm (sadece sahibe görünür): odaları listele, sil, eskileri temizle
- [x] Aşama 1: Kurallar toplandı (KURALLAR.md), varsayımların hepsi onaylandı
- [x] Aşama 4: kendi sunucumuz (v40) yayında: https://kanli-okey.onrender.com (Render, ücretsiz plan, GitHub main'e her gönderişte otomatik deploy; deploy süren oyunları siler)
- [x] Canlıdaki sürüm: v58 (31 Ekim 2026). v57 Render'da .dockerignore yüzünden derlenemiyordu (simge png'leri dışarıda kalıyordu), v58 ile düzeldi; v56 ve v57 de v58 ile canlıya çıktı
- [~] Aşama 5 (oynama hissi): büyük kısmı yapıldı (v20-v58). Şu anki iş: "Mustafa'nın istekleri" listesi (aşağıda), önce Safari masa düzeni
- [ ] Aşama 5.5 rehber, 6 beta, 7 yayın, 8 büyüme, 9 cila

## Bilinen eksikler ve riskler (dürüst liste)
1. claude.ai sürümünde bütün eller tek kayıtta duruyor, teknik bilen biri başkasının elini görebilir. Sunucu sürümünde (v40) bu kapandı: herkese sadece kendi eli gider, deste sırası kimseye gitmez, hamleleri sunucu doğrular.
2. (Çözüldü) Sunucu sürümü yayında: herkes adrese girip kodla ya da davet bağlantısıyla katılıyor. claude.ai sürümü artık kullanılmıyor.
2b. claude.ai sürümünde yönetim paneli sadece ekranda gizli (şifre 1234 sayfanın içinde). Sunucu sürümünde şifre sunucuda (ADMIN_PASSWORD), yetkisiz silme ve ayar değiştirme reddediliyor.
3. Kuralların hepsini bilmiyoruz. Mustafa "oyunun daha çok kuralı var" dedi. Kural toplama bir aşama değil, sürekli bir iş (aşağıda "Sürekli işler").
4. (Çözüldü, v40) Oyun mantığı ayrı dosyada: src/engine.js. Aynı kod hem tarayıcıda hem sunucuda çalışıyor.
5. Bağlantı koparsa: sunucu sürümünde oyuncu aynı cihazdan geri girince aynı koltuğa döner (cihazda saklanan anahtar), ekranda "Bağlantı koptu" uyarısı çıkar, süre dolarsa taşı otomatik atılır. Masada kimse kalmazsa oyun bekler. Kalıcı ayrılma (botun devralması) henüz yok; yönetici "botla değiştir" yapabilir, açık masada yabancı botun yerine oturabilir.
6. Telefon düzeni bilgisayarda (Playwright, t29/t30) ölçülüyor, gerçek iPhone'da farklı çıkabiliyor: Mustafa'nın iPhone Safari'sinde bütün oyuncular masanın üstünde görünüyor (ACİL, "Mustafa'nın istekleri"). Yatay ekran düzeni v53'te yapıldı.

## Aşama 2: Kural motorunu ayır ve test et  (büyük kısmı v40'ta yapıldı)
Amaç: oyunun beyni ekrandan ve veritabanından bağımsız, tek dosyada, hem tarayıcıda hem sunucuda çalışan saf bir kod olsun.
- [x] İlk 34 test + çift işleme, okey değiştirme, bitirme şartı testleri yapıldı
- [x] Motor dosyası (src/engine.js): dağıtma, per/çift kontrolü, açma puanı, işleme, okey değiştirme, bitirme, ceza hesabı, deste bitme, botlar, süre dolumu
- [x] Testler kalıcı dosyada: test/engine.test.js (kurallar), test/sim.test.js (botlar binlerce el oynar), test/server.test.js (sunucu, izinler, hile denemeleri), test/e2e.py (iki telefonla gerçek sunucu)
- [ ] Her kuralın bir numarası olsun (K-01, K-02...) ve her kural için en az bir test. Test adı kural numarasını taşısın, hangi kuralın kırıldığı hemen anlaşılsın.
- [ ] Kenar durumlar için test: iki okey, büyük elde joker, 1-2-3 ve 12-13, erkek perde 4. renk, çift + okey, deste bitişi, çarpanların birlikte uygulanması
- [ ] Motor "kural ayarları" nesnesi alsın (9/13 tur, ceza sayıları, 17 eşiği). Şimdilik tek ayar var ama ileride "ev kuralları" için kapı açık kalır.
- [x] Hamle gelir, yeni durum ya da "geçersiz hamle: sebep" döner. Sebep metni Türkçe, oyuncuya gösterilebilir. (ENG.run)

## Aşama 3: Botlar ve otomatik oyun testi
- [x] (v27) Botlar akıllansın: açabiliyorsa en iyi açılış, işleyebiliyorsa işle, işler taş atmaktan kaçın, okey değiştirebiliyorsa değiştir
- [x] (v27, v56) Zorluk seviyeleri: Saf/Orta/Usta; masa kurarken Kolay/Orta/Zor seçilir
- [x] (v52, v56) 1 kişi + 3 bot, 2 kişi + 2 bot, vb. Eksik koltuğu bot doldurur; "Botlarla hızlı oyun"
- [~] Bot, oyuncu koparsa onun yerine oynayabilsin (şimdilik süre dolunca otomatik atma ve yöneticinin "botla değiştir"i var) ("oyuncu geri gelince devam eder")
- [~] (npm test 300 el, test/sim.test.js istenen sayıda) Otomatik simülasyon: 10.000 bot oyunu arka arkaya oynatılır. Yakalanacaklar: kilitlenme, sonsuz döngü, geçersiz durum, puanların tutmaması (toplam taş sayısı hep 106 mı), motor hatası. Elle denemenin bulamayacağı hataları bulur.
- [ ] Simülasyon istatistiği: ortalama kaç turda biter, kaç el deste biterek biter. Çok uçuk çıkarsa kural yanlış uygulanmış olabilir, Mustafa'ya sorulur.

## Aşama 4: Gerçek proje ve kendi sunucu  (tamam, yayında)
Not: Bunu UX aşamasından önceye aldım. Sebep: sürükle-bırak, animasyon, ses gibi işleri tek HTML dosyasında yapıp sonra sunucuya taşımak, ikinci kez yazmak demek. Önce doğru zemini kuralım.
- [x] Proje klasörü: motor, sunucu, istemci ayrı dosyalar. Git ile sürüm geçmişi. (GitHub: mustafa1492/kanliokey)
- [x] Sunucu otoriter: her hamle sunucuda motorla doğrulanır. İstemci sadece kendi elini görür (hile önleme).
- [x] Gerçek zamanlı bağlantı (WebSocket, Node + ws). Tek sunucu hem sayfayı hem oyunu sunar.
- [x] Oda kodu sistemi sunucuda, davet linki (site/?k=KOD: link açınca kod hazır gelir, "Kodu paylaş" linki de gönderir)
- [x] Takma ad ile giriş (hesap yok). Cihazda saklanan kimlik (gizli anahtar).
- [x] Yönetim paneli sunucuda gerçek yetkiyle: şifre sunucuda, deneme sınırı var
- [~] Bağlantı kopma: kopan oyuncu aynı cihazdan istediği zaman geri döner (yapıldı). Botun devralması ve geri verme henüz yok (süre dolunca taş otomatik atılıyor)
- [x] Sıra zaman aşımı: süre dolunca taş otomatik çekilip atılır (süre panelden ayarlanır)
- [x] (v56, yöneticide) Oyun kayıtları: her hamle kaydedilir (anlaşmazlıkta "ne oldu" bakılır, ileride tekrar izleme için de lazım)
- [x] Hız sınırı, geçersiz istek koruması, koltuk kimlik doğrulaması, başka siteden bağlantı engeli, taş sayısı denetimi

## Aşama 5: Oynama hissi (telefon önce)
- [x] (v20-v44) Taşları sürükleyerek dizme, büyük dokunma alanı
- [~] (v48 Sırala / akıllı sıralama; "Seri diz / Çift diz" istekler listesinde) Otomatik diz: renge göre, sayıya göre, "per olabilecekleri yan yana getir"
- [x] (v50, v58) Açma önerisi: elinden en yüksek açılışı ve puanını göster. Katlamalıda "en az X açman lazım" uyarısı.
- [x] (v43, v50) İşleme ipuçları: seçili taşın nereye işlenebildiği, okey değiştirme fırsatı yanıp söner
- [x] (v43, v48) "Bu hamleyi yaparsan" uyarıları: işler taş atıyorsan "500 ceza yazılır" onayı
- [ ] Hamle geri alma (sıra geçmediyse, taş çekme ve açma hariç)
- [x] (v52, v56) Her oyuncunun attığı taşlar yığını (yakınlaştırma ve hamle geçmişi; Mustafa geçmişte sadece son taşı istiyor, istekler listesinde)
- [x] Kahvehane havası: ahşap duvar, lamba, çay bardakları, eğik çuha masa, 3 boyutlu taşlar ve ıstaka, rakiplerin ıstakaları (ilk sürüm yapıldı, telefonda gerçek denemeyle ince ayar gerekecek)
- [x] Otomatik okey masası (şampanya metal gövde, siyah çerçeve, ortada göbek, ahşap sandalyeler, fayans zemin). El bitince taşlar masaya çekilip karılıyor, sonra yeni el dağıtılıp kendiliğinden başlıyor (ilk sürüm; ses ve daha gerçekçi animasyon sonraya)
- [x] Masa oyuncunun gözünden (alçak bakış açısı), 3D çay bardakları, daha kalın taşlar ve gerçekçi ıstakalar, "Cezalar" düğmesi (herkesin ceza puanları)
- [x] Istaka 2 sıra, yan yana dizilen per/çiftler "Aç" ile doğrudan açılıyor (yeşil çerçeve), açılan perler masanın üstünde, atılan taşlarda sadece sonuncu görünüyor, rakip ıstakaları ve sandalyeler perspektifli
- [x] v20: Istaka 20 sabit yuva (2×10), taşlar herhangi bir yuvaya sürüklenebilir, sola yaslamak gerekmiyor; yuvaya dokunarak da taşınır. Taşı masaya sürükleyip bırakınca atılıyor. Sandalyeler kaldırıldı, masa yukarıdan bakış + metal/ahşap çerçeve. Açma alanı masanın üstünde, deste ile ıstaka arasında; "Aç" her zaman basılabilir, nedenini ekranın üstünde uyarı olarak gösteriyor (ilk tur, puan yetmiyor, yandan taş) ve düğmede "Aç · 26/17" canlı puan var
- [x] v21: Istaka 2×14 yuva. Atılan taşlar her oyuncunun ıstakasının sağında (kendi yönüne göre), açılan perler deste altında. Desteden ve soldan taş almak, açılmış pere işlemek ve okey değiştirmek sürükle-bırak ile (taşı ıstakada istediğin yuvaya bırakınca oraya yerleşir). Açma hesabı yazısı kaldırıldı. Cezalar panelinde her oyuncunun "bu tur" anlık cezası görünüyor
- [x] v22: Açılan perler sahibinin önünde (alt: önünde, üst: rafının altında, yanlar: rafın yanında). Istaka kutusunda yalnızca dizdiğin (ayrı ve düzgün sıralı) perlerin puanı görünür, elindeki en yüksek puan gösterilmez. Normal elde yerde yalnızca gösterge görünür. Desteden/yandan taş sürükleme: parmağın üstünde yükselen taş, hedef yuva parlıyor, gelen taş yuvaya "pop" animasyonuyla oturuyor
- [x] v23: Istakada taşı iki taşın arasına sürükleyip sokma (komşular kayar, boşluk kapanır); yuvalar arası boşluğa bırakınca en yakın yuva seçiliyor, araya sokma yeri altın çizgiyle gösteriliyor. El bitince taşlar masanın ortasında karışıp uçuşuyor (36 taş), rakip ıstakaları, perler ve atılan taşlar da ortaya çöküyor
- [x] v24: Taşlara daha gerçekçi görünüm (cilalı yüz, iç çerçeve, altında renkli nokta); araya sokunca komşu taşlar kayarak yerine oturuyor. "Açma alanı" masadan kaldırıldı, "Per aç" (çift dizdiyse "Çift aç") ıstakanın altındaki düğme sırasında. Açılamama sebebi uyarı olarak çıkıyor
- [x] v55: Telefonda masa düzeni: yan oyuncular masanın üst ve orta kısmı boyunca uzanır (karşıdaki oyuncu ortada), yan ıstaka çubukları yatay ve küçük; masadaki per taşları büyüdü (alt/üst 22×31, yanlar 19×27; büyük taş modunda 25×35 / 21×30), sığmazsa en fazla %72'ye küçülür; okey taşındaki ★ ve sayı taşın içinde; hiçbir taş başka bir şeyin üstüne binmez (ui/t29.py ölçer). GitHub'a Mustafa "yükle" deyince gönderilecek (oyun sürerken güncelleme yok)
- [x] v56: İşlenen taşlar perde yatay görünür. Deste bitince yandan taş alınamaz. Masayı takip: durum satırının altında tek satırlık son hamle şeridi (dokununca bu elin hamle geçmişi ve herkesin attığı taşlar), açmış ve 3 ya da daha az taşı kalan oyuncuda "bitiyor!" rozeti. Hata / kural yanlış / öneri bildirimi (menüden ve ana ekrandan; masadaysa durum ve son hamleler otomatik eklenir), yöneticide bildirim listesi (durumu gör, okundu, sil). Yöneticide oyuncu listesi (bağlı mı, son görülme, masası) ve her odanın hamle kaydı (son 400 hamle, okunur metin). Herkese açık masa: kuran açar, ana ekranda "Masa seç" listesi; bekleyene katılınır, oyundakinde bot yerine oturulur. Masa kurarken bot seviyesi (Kolay / Orta / Zor). Kurallar: büyük el 1-5-9-13, son taş işler+okey değişmez, süre dolunca otomatik atma, botlar çift açmaz (Mustafa onayladı). GitHub'a Mustafa söyleyince gönderilecek
- [x] v58: Katlamalıda yandan sayılır (Mustafa): 17 → 17+y1 → 17+y2 → 18; motor ham toplamı (puan×3+yandan, mxr) karşılaştırır, ıstaka rozeti ve uyarı "17 + yandan 2" gösterir, botlar da uyar (test: engine.test.js). Kurallar sayfası oyunun içinde açılır (tam ekran pencere, "Oyuna dön"); claude.ai bağlantıları ve yeni sekme kalktı, sayfa index.html'e gömülü. Render derlemesi: .dockerignore simge png'lerini artık dışarıda bırakmıyor (v57 bu yüzden canlıya çıkamamıştı)
- [x] v57: iOS 26 Safari'de alttaki yüzen araç çubuğu ıstakanın ve düğmelerin üstüne biniyordu: oyunda alta boşluk bırakılır (sadece Safari 26+, ana ekrana eklenmiş uygulamada değil). Sekme simgesi (favicon) sayfaya gömüldü, ayrıca favicon.ico. Yönetim paneli sekmeli: Odalar, Bildirimler, Oyuncular, Özellikler (herkese açık masalar / sohbet / yeni masa kurma aç-kapa), Bot ve süre, Duyuru (hazır güncelleme uyarısı), İstatistik. Eşli oyunda eş seçimi: "Eşin kim?" diye 3 oyuncudan biri seçilir, altında Takım 1 - Takım 2 kartları. Yönetici şifresi Render'daki ADMIN_PASSWORD'dan değişir
- [x] v54: SOHBET: oyunda 💬 (okunmamış sayısı kırmızı rozet), bekleme odasında "💬 Sohbet"; mesajlar herkeste anında görünür, oyunda yazanın isminin üstünde balon çıkar; son 60 mesaj odada tutulur; hazır mesajlar ve emojiler aynı pencerede; sunucuda sadece odadakiler okur/yazar, hız sınırı, 200 karakter. Test: test/chat.test.js, test/chat_e2e.py
- [x] v53: Sağ/sol perler okunur boyutta (sadece yükseklik sığmazsa küçülür, en az %55). Taşı perin soluna/sağına sürükleyerek istenen uca işleme (yeşil uç çizgisi gösterir; okey iki uca da gidebiliyorsa bıraktığın taraf), en yakın pere yapışma, taşı seçip pere dokunarak işleme. Zorluk modu (Ayarlar: Kolay / Normal / Zor): Kolay her ipucu + "hangi taş gelirse açarsın" + okeyi ya da perin parçasını atarken uyarı + bitirebileceğin taşta BİTİR; Normal ipuçları var ama hangi taş gelirse yok; Zor ipucu ve uyarı yok. Odak düğmesi (ıstaka başlığında ⤢): taşlar büyür, masa küçülür. Yatay ekran düzeni (telefon yan: solda masa, sağda durum + ıstaka + düğmeler, kaydırma yok; yan oyuncuların ıstaka çubukları gizli). Akıcılık: sürüklerken hiç yeniden çizim yok (taşa dokunduğun an dahil), sürükleme başında 15 katman açılmıyor, masa parlaması yeniden çizim yapmıyor. Uzun bot denemeleri: ui/botplay.py (ben de sürükleyerek çekip açıp uçlara işleyip atıyorum; dikey ve yatayda 9'ar el, hata yok)
- [x] v52 (Mustafa seçti): Masayı yakınlaştır (isim kutusuna ya da perlere dokununca o oyuncunun perleri ve bu elde attığı bütün taşlar büyük görünür), desteden/yandan çekilen taş "YENİ" etiketiyle belirgin, Botlarla hızlı oyun (ana ekranda tek düğme), WhatsApp'ta davet et (bekleme odasında), Hazır mesajlar / emoji (durum çubuğunda 💬; isim kutusunun üstünde balon; herkes görür). Test: ui/t26.py
- [x] v51: Masadaki perler alanına sığmazsa kendiliğinden küçülür (büyük taş açıkken sol oyuncunun perleri kesiliyordu); büyük taş modunda ıstaka biraz alçaldı, yan perler küçüldü
- [x] v50: AYARLAR (Mustafa seçti): İpuçları (yandan taş: soldaki taş işine yarıyorsa parlar "al, açarsın / per olur"; açma: ıstaka başlığında "Açabilirsin / En iyi açılış N / Açmak için: şu taşlar"; işleme: açtıktan sonra işlenebilen taşın köşesinde +), Büyük taşlar (ıstaka 2×10), Ses paketi (gerçek / sade), Sıra sende sesi (çan / "Sıra sende" konuşma / kapalı), Kahvehane uğultusu, "Sıra sende" bildirimi (Web Push, sunucuda; uygulama arka plandayken; iPhone'da Ana Ekrana Ekle gerekir), Ekranı açık tut, Oyun geçmişim (bu cihazda son 30 oyun: birinci/sonuncu, ortalama ve en iyi ceza). Test: test/push.test.js, ui/t24.py
- [x] v49: UYARILAR: oyun içi uyarılar yeni kart görünümünde (sol renk şeridi, simge, kalan süre çizgisi); ✕ düğmesiyle, dokunarak ya da yukarı kaydırarak kapanır; uzun uyarılar daha uzun kalır
- [x] v48: AYARLAR sayfası (üstte ⚙ Ayarlar, oyunda Menü → Ayarlar; bu cihaza kaydedilir). Istaka: Akıllı sıralama (Sırala en yüksek açılışa göre dizer, açık), Taş gelince otomatik diz (kapalı), İki kez dokunarak at (kapalı), İşler taş uyarısı (açık; artık At düğmesinde de). Görünüm: masa rengi (yeşil/bordo/lacivert/kahve), efektler Tam/Sade, renk körü işaretleri (● ▲ ■ ◆). Ses: ses, ses seviyesi (4 kademe), titreşim, son 10 saniye uyarısı. Profil: takma ad ve karakter. Hakkında: kurallar, sürüm
- [x] v47: KISMİ AÇMA: açmak istediğin perlerden birer taşa dokun, "Per aç" sadece onları açar (seçim yoksa hepsi; seçilmeyen perler soluk yeşil). PUAN: artanlar birikir, ıstakada "Dizilen 20 +yandan 2" yazar, yetmezse uyarıda da yandan yazar. KOLTUĞA DÖNÜŞ: telefon/tarayıcı değişse de oda koduyla girince bağlı olmayan oyuncunun yerine "X olarak dön" (el, ceza, ad, karakter, kuranlık aynen). Testler: test/claim.test.js, test/claim_e2e.py, engine testine yandan ve kısmi açma
- [x] v46: ISTAKALAR: kendi ıstakan gerçek ahşap ıstaka gibi (damarlı ahşap, iki kalın raf, taşlar rafın üstünde durur, boş yuva kutuları kalktı); rakiplerin ıstakaları masada küçük ahşap ıstaka, taş sırtları rafın üstünde, ön kenar masaya bakar
- [x] v45: TELEFON AKICILIĞI: ana ekranda logodan düşen damlalar ayrı katmana alındı (önceden her karede bütün kanlı yazı yeniden çiziliyordu; ana ekranda boşta yeniden çizim 120/sn → 0), arka plan masasındaki bulanıklık kaldırıldı ve arka plan ayrı katmanda, üst çubuktaki kanlı yazı ayrı katmanda (yanındaki yazılar değişince yeniden çizilmez), sürüklerken masanın sarı parlaması masayı yeniden çizmeden açılıp kapanıyor, sürüklerken ıstakadaki taşlar ayrı katmanda kayıyor
- [x] v44: Istakada taşı sürüklerken dolu yuvaya gelince komşu taşlar kayarak yer açar (taşlar üst üste binmez), bırakınca taş araya oturur
- [x] v43: Istaka 2×12 yuva (önce 2×14), taşlar büyüdü; masadaki per taşları büyüdü. Sürüklerken taşın işlenebileceği perler altın renkle parlar ve etraflarında geniş bir yakalama alanı olur (perin yanına bırakınca işlenir). İşler taşı sürükleyip masaya bırakınca önce uyarı çıkar ("Atarsan 500 ceza"), ikinci bırakışta atılır; At düğmesi değişmedi
- [x] v42: EŞLİ OYUN (masa kurarken açılır, kuran eşleri seçer, karşılıklı oturma, takım cezası Cezalar panelinde ve el sonu kartında, oyun sonunda kaybeden takım, botlar Usta). KAN: "KANLI" harflerinin içi ıslak parlak kan, harf ayaklarından damlalar "OKEY"in (fildişi) üstünden süzülür, arada damla düşer; panel kenarı akıntıları, sıçramalar, ceza anı ve kurallar sayfası başlığı aynı ıslak görünümde. ANA EKRAN: 5 masa sözü logonun altında sırayla döner, arkada bulanık okey masası + dağınık taşlar + titreyen lamba ışığı, Kurallar tanıtım kartı. OYUN İÇİ: kahvehane karakterleri (Çay, Tespih, Amca, Kasketli, Zar, Kahve, Simit, Kanlı taş; ana ekranda seçilir, masada ve bekleme odasında görünür, botlarda sabit), büyük anlar duyurusu (açılış puanı, işler taş +500, okeyle / tek başına bitirme), bitirişte son taş masaya çakılır + masa sarsılır, açamayıp tam ceza yiyenin isminde kan sıçraması (masada ve el sonu kartında), ıstakadaki okeyde altın parıltı, gösterge dağıtımda ters gelip dönerek açılır, kendi sıranın son 10 saniyesinde ekran kenarları kırmızı nabız atar
- [x] v41: GÖRÜNÜM: koltuk renkleri (herkes aynı oyuncuyu aynı renkte görür; isim, avatar, masadaki perler), isim kutusunda toplam ceza, ince durum şeridi, tahta raflı ıstaka, deste göbeğinde sıra ibresi, ceza anında isim üstünde +N, taşlar uçarak gider (desteden ıstakaya, ıstakadan masaya, rakip ıstakasından masaya/atılanlara), el sonu kartı (ceza kalemleri satır satır, çarpanlar, kalan taşlar, kazanana taç, "Masayı gör"), logo ve yeni ana ekran, koyu lobi, "Masa hazırlanıyor" açılışı, telefona uygulama gibi ekleme (simge, tam ekran, sunucu uyurken kayıtlı sayfa), WhatsApp önizlemesi (davette kuranın adı ve oda kodu), yeni sürümde sayfa kendini yeniler, kurallar sayfası oyunla aynı koyu görünüm (site v13), Türkçe büyük harf düzeltmesi (İ)
- [x] v40: ALTYAPI: kural motoru ayrı dosya (src/engine.js), kendi sunucumuz (server/server.js: odalar, oyun kuralları sunucuda, başkasının eli ve deste sırası gizli, botlar ve süre sunucuda, durum diske kaydediliyor, yönetici şifresi sunucuda, hız sınırı), aynı oyun dosyası hem claude.ai'de hem sunucuda çalışıyor (claude.ai'de değilse sunucuya bağlanır), davet bağlantısı, bağlantı koptu uyarısı; Dockerfile + render.yaml; testler: test/engine.test.js, test/sim.test.js, test/server.test.js, test/e2e.py
- [x] v39: Telefonda tek ekran: sayfa kaydırması yok, masa ekrana sığıyor (üst çubuk + durum + masa + ıstaka + 4 düğme). Ses, Titreşim, Kurallar, Nasıl kullanılır ve Ana ekran "Menü"de. Lobide bot kartı okunur (yeşil zemin açık yazı). Sürüklemede kasma azaltıldı (yuva konumları önbellekte, her karede sayfa ölçümü yok, sınıflar sadece değişince; masa ayrı katmanda). iPhone'da (iOS 18+) titreşim yerine anahtar dokunuşu denenir. Yatay ekranda eski kaydırmalı düzen
- [x] v38: Sayfanın kendiliğinden en üste kayması için kaydırma yeri korunuyor
- [x] v37: Kural paketi: seri en fazla 5 taş (6+ bitişik seri için uyarı, 6=3+3, 7=3+4; işleme sınırsız), çift açan tek taşı atınca bitirir, açtığın turda son taşı atamama (botlar da uyar), "Per yap"/"Çift yap" düğmeleri kaldırıldı (boşlukla ayırma). Test: ui/t17.py
- [x] v36: Mustafa'nın ses dosyaları (32 OGG, 15 olay) MP3'e çevrilip sayfaya gömüldü (~440 KB); aynı olaydan birden çok kayıt varsa rastgele seçilir, kısa taş seslerine hafif perde farkı; dosya çözülemezse sentez sese düşer. Kaynak dosyalar: snd_in/sesler/*.ogg
- [x] v35: koyu sıcak tema + bordo masa çerçevesi + keçe dokusu; yeni taşlar (büyük rakam, kabartma); "KANLI OKEY" masa damgası; atılan taş yığını eğik, son taş net + iniş animasyonu ve halka; sıra süresi halkası (avatar çevresi); ceza anında kenardan kan akışı; bilgisayarda iki sütun (masa solda, durum+ıstaka sağda); SES (WebAudio sentezi: pick/drop/draw/discard/place/open/swap/turn/tick/penalty/win/lose/deal/shuffle) + TİTREŞİM, üstte Ses/Titreşim anahtarları; ui/t16.py, ui/audio_check.py
- [x] v34: HATA: son taşı At/sürükleme ile atınca el bitmiyordu (sadece Bitir düğmesi bitiriyordu). Artık açmış oyuncu (açtığı tur hariç) kalan taşları per iken ya da elinde taş kalmadan son taşı atınca el otomatik biter; ui/t15.py
- [x] v33: HATA: taşa dokununca sol üstten uçarak geliyordu (transform geçişi), sürüklenen taşta geçiş kapatıldı; ui/t14.py her karede konum ölçer
- [x] v32: HATA: yeni çekilen taş sürüklenince sol üste kilitleniyordu (pop animasyonu) düzeltildi; HATA: bot okey değiştirince bir sonraki hamlede takılıyordu düzeltildi; çift dinleyici temizlendi; dokunmatik fuzz + otomatik oyun testleri eklendi (ui/fuzz.py, ui/autoplay.py, ui/t13.py)
- [x] v31: taş çekme/atma animasyonu yumuşatıldı (yukarıdan uçma kalktı), Bot 2 açtığı perleri alt alta, atılan taşlarla açılan perler arasında mesafe + ince ayraç, masa içeriğe göre uzuyor, karılırken Deste/Gösterge yazıları gizli ve "Taşlar karılıyor" yazısı üstte kapsüllü, kan damlalarında top sayısı azaltıldı (oyun + site)
- [x] v30: Kan efekti yeniden: düzensiz, ağır kuyruklu akıntılar (örnek görsellere göre), yönlü sıçramalar; masadan kaldırıldı; kurallar sitesinde bol kullanım (site v10)
- [x] v29: Sıra süresi (varsayılan 45 sn, panelden Kapalı/30/45/60/90; dolunca taş otomatik çekilip atılır, sahibi yoksa ilk gerçek oyuncunun sayfası 6 sn sonra uygular; son 5 sn titreşim), gerçekçi kan (degrade + parlaklı damlalar, prosedürel sıçramalar), site v9
- [x] v28: Kan efekti (Kanlı yazısında damlama, panel/bildirim/ceza paneli damlama kenarları, masada ve sitede sıçrama lekeleri), site v8: ikinci masa sözü (Mamika)
- [x] v27: Bot zekâsı 3 seviye (Saf=eski, Orta=yandan taş+işleme+hata payı, Usta=okey değiştirme+kapsama hesabı+güvenli atış), joker destekli açma planı; yönetici paneli: bot seviyesi/hızı, duyuru, istatistik (kurulan oda/oyun/biten oyun/en çok sonuncu), oda izleme (eller), sırayı atlat, botla değiştir; performans: bölümlü (diff) çizim, aynı snapshot'ı atlama, sürüklemede transform+rAF. Simülasyon: t/sim.js (Usta/Orta Saf'ı eziyor, hata yok)
- [x] v26: Performans (ağır gölgeler/katmanlar azaltıldı, fixed arka plan kaldırıldı), ceza bildirimi sakin koyu kutu (kırmızı sadece hata), yönetici girişi şifreli (1234, istemci tarafı), site v7: kan sözü, ana ekran başlığı sadeleşti
- [x] v25: Altın oranlı simetrik masa (sütunlar 1:φ:1, oran 1:1.272, yan ıstakalar kenar ortasında), çaylar kaldırıldı, taş parlaması kaldırıldı (mat taş), sıra göstergesi sadece isim rozetinde, plaket yerine ince "Dizilen N/17" rozeti, deste+gösterge küçüldü; ana ekran temalı/detaylı (hero, adımlar), kurallar sitesi v6 çuha temalı
- [x] Per yap ve çift yap ayrı düğmeler, açılış puanı canlı hesaplanıyor, açılacak perler alt alta, tek tek geri alınabiliyor
- [~] (v41 isim üstünde +N, v42 büyük anlar duyurusu) Anlık ceza bildirimi: "Ali sana 70 ceza yazdı"
- [x] (v41) El sonu özeti: her ceza kalemi satır satır açıklanır (açıp bitirmeyen 15 × 5 = 75, elde okey 250, okeyle bitirme ×2...). Kuralları karışık bir oyunda en çok fark yaratacak ekran bu.
- [ ] Tur tur skor tablosu, el geçmişi
- [x] (v35, v50) Sıra bildirimi: titreşim, ses, isteğe bağlı push bildirim
- [x] (v50, v53) Yatay/dikey ekran, küçük telefon testi, büyük yazı seçeneği
- [x] (v48) Erişilebilirlik: renk körü için taşlarda renk dışında işaret, yüksek kontrast
- [x] (v35, v36, v42) Animasyon ve ses (taş sesi, ceza anında "kanlı" efekt). Kapatılabilir.
- [x] (v41) PWA: telefon ana ekranına uygulama gibi eklenebilsin

## Mustafa'nın istekleri (31 Ekim 2026, sırayla yapılacak)
- [ ] Hediye gönderme: oyunda bir oyuncuya çay, kahve, öpücük vb. hediye gönderilir (isim kutusuna dokun → hediye seç, masada animasyonla gider, herkes görür).
- [ ] Rakip ıstakaları: masadaki küçük ahşap ıstakalar "adi" duruyor, yeni bir görünüm bulunacak (örnek: sadece taş sırtları ve taş sayısı rozeti, ya da ince, daha gerçekçi ıstaka).
- [ ] Telefonda (Safari) masa düzeni: diğer oyuncular yan yana duruyor. Her oyuncu masanın kendi kenarında dursun (sağdaki sağ kenarda, soldaki sol kenarda, karşıdaki üstte), masada hiçbir şey iç içe geçmesin (t29/t30 ile ölç).
- [ ] Geçmiş sekmesi: hamle geçmişinde herkesin attığı bütün taşlar görünmesin, her oyuncunun sadece attığı son taş görünsün.
- [ ] Hesap: misafir girişi (şimdiki gibi) + en basit kayıt: kullanıcı adı ve şifre, doğrulama yok. Profil (ad, karakter, oyun geçmişi) hesaba bağlanır, başka telefondan girince aynen gelir. Şifre sunucuda tuzlu hash ile saklanır.
- [ ] Mustafa'ya özel GM profili: profilde "GM" rozeti, oyun içinde sadece ona özel ayrıcalıklar (liste Mustafa'ya sunuldu, seçecek).
- [ ] Menü ikiye ayrılsın: "Genel ayarlar" (ses, titreşim, bildirim, ekran, profil, hesap) ve "Oyun ayarları" (ıstaka, ipuçları, zorluk, masa görünümü, büyük taş vb.), içleri ayrı ayrı doldurulacak.
- [ ] ACİL: Safari'de (telefon) bütün oyuncular masanın üstünde görünüyor, yerleşim kaçmış. Sağdaki sağ kenara, soldaki sol kenara dönmeli (yukarıdaki masa düzeni maddesiyle birlikte, gerçek iPhone ölçüleriyle denenecek).
- [ ] Profil sayfasının içi dolsun: toplam maç, galibiyet, mağlubiyet, galibiyet oranı, seviye. İstatistikler tekli ve eşli diye ayrı tutulur (Mustafa): tekli: oynanan oyun, galibiyet = birinci olmak, mağlubiyet = sonuncu olmak, oran; eşli: oynanan, kazanılan, kaybedilen, oran. Seviye: tecrübe puanı sistemi onaylandı (Mustafa: mantıklı), unvan adları sonra birlikte gözden geçirilecek. Tecrübe puanı (bitirilen oyun +10, tekli 1. +30 / 2. +15 / 3. +5, eşli kazanan +25, okeyle ya da tek başına bitirme +5, yarıda bırakma 0; botlu oyunda yarım TP önerildi) ve unvanlar: Çaycı 0, Çırak 100, Müdavim 300, Taşçı 700, Usta 1500, Kahve Ağası 3000, Kanlı Usta 6000, Efsane 12000.
- [ ] İlk kayıt olan 20 kullanıcıya özel rozet. Mustafa rozet tasarımını seçenekler arasından seçecek.
- [ ] Istaka düğmeleri: "Per aç" yerine "Seri aç" ve "Çift aç"; ayrıca "Seri diz" ve "Çift diz" (ıstakayı serilere ya da çiftlere göre dizer).
- [ ] Sırala için geri al: ıstakayı elle düzenledikten sonra yanlışlıkla Sırala'ya basan, "Geri al" ile önceki dizilişine döner.

## İlk izlenim (cepte, Mustafa onaylayınca)
- [x] Bekleme ekranı: sunucu uyanırken boş sayfa yerine "Masa hazırlanıyor" (taşlar karılıyor) açılışı
- [x] WhatsApp paylaşım kartı: görselli önizleme ("… seni masaya çağırıyor, oda kodu …")
- [x] Uygulama gibi açılma (PWA): ana ekrana ekle, kendi simgesi, tarayıcı çubuğu olmadan tam ekran
- [x] Logo ve sade, etkileyici ana ekran (taslak gösterilip onay alınacak)
- [x] El sonu ekranı: ceza kalemleri satır satır + kazanana kutlama (taslak gösterilip onay alınacak)
- [x] Kurallar sayfası oyunla aynı görünüm ve adreste (/kurallar). Arama motoruna açmak için sunucuda INDEX=1 (alan adı alınınca)

## Çözülecek konular (Mustafa ile konuşulacak)
- [x] (v47) Elindeki perlerin hepsini açmak istemeyince ne olacak? Şu an "Per aç" ıstakada yan yana dizili (yeşil çerçeveli) bütün geçerli perleri birlikte açıyor; sadece bazılarını açmanın kolay bir yolu yok (şimdilik açmak istemediğin peri dağıtmak gerekiyor). Çözüm birlikte bulunacak (örneğin: açılacak perlere dokunarak seçme, ya da ıstakada açılacakları ayrı bir bölgeye koyma). Kural tarafı da sorulacak: açarken elindeki her peri açmak zorunlu mu?

- [x] (v47, Mustafa: artanlar birikip sayılsın, ekranda yandan görünsün) Açılış puanında fazlalık (Mustafa fark etti, sonra bakılacak): dörtlü erkek perde 4. taş 3'e bölünerek puana katılıyor. Dört 11 açınca 4. 11 → 11/3 = 3 tam + 2/3 artık; dört 12 açınca 4. 12 → 12/3 = 4 puan ekleniyor. Şu anki hesap: bütün açılan taşların toplamı / 3, aşağı yuvarlanır (üç 11 = 33/3 = 11, dört 11 = 44/3 = 14). Doğrusunun nasıl olacağını Mustafa söyleyecek; tahminle değiştirilmeyecek.

- [x] (v42) Kan efektleri daha gerçekçi olacak. KARAR (taslak A1, docs/taslaklar/kan-yazi-secilen.png): "KANLI" yazısının harflerinin içi ıslak, parlak koyu kan; harflerin ayaklarından damlalar akar, uzun damlalar alttaki "OKEY"in üstünden süzülür; "OKEY" parlak beyaz değil fildişi (taş rengi), hafif doku ve kenar gölgesiyle. Damlalar yavaşça uzar, arada biri kopup düşer. Aynı ıslak, parlak görünüm diğer kan efektlerine de uygulanacak (panel kenarı akıntıları, sıçramalar, ceza anındaki kan akışı, kurallar sayfası başlığı). Uygulama örneği: docs/taslaklar/kan-yazi-taslak.html
- [x] (v42) Ana ekran (ilk masa kurma ekranı) çok sade kaldı: oraya neler ekleneceği birlikte düşünülecek
- [x] (v42) Ana ekrandaki "Kurallar" bağlantısı çok sade: kurallar sayfası güzel, daha dikkat çekici olsun (örneğin küçük bir tanıtım kartı: başlık, birkaç taş, "Kuralları oku" düğmesi)

- [x] Titreşim iPhone'da çalışmıyor (Apple web sayfalarına izin vermiyor). Mustafa: gerek yok, bu konu kapandı. Android'de titreşim çalışmaya devam ediyor.

- [x] (v42) EŞLİ OYNAMA: kuralları tamam (docs/KURALLAR.md "Eşli oyun"). Yapılacaklar: masa kurma ekranında eşli seçeneği ve kuranın eşleri belirlemesi, karşılıklı oturma, takım cezası (iki eşin toplamı) her yerde (Cezalar paneli, el sonu kartı, oyun sonu: kaybeden takım), eşin bitirince eşe ceza yok, eşin perine işleme ve okey değiştirmede ceza yok, botlar eşli oyunda Usta ve eşini cezalandırmayan işlemeyi bilir, sunucu ve claude.ai sürümü, testler.

Estetik kararları (Mustafa seçti, toplu güncellemede yapılacak)
- [x] (v42) Ana ekran: masa sözleri logonun altında sırayla değişir. Mustafa'nın seçtiği sözler (aynen):
  - "Çift açan tek kalır, tek kalan içine alır."
  - "Kanlı okeyde dost olmaz."
  - "Bu kurallar kan ile yazıldı."
  - "Kan kanla yıkanmaz; kanlı okeyde el kanla değil, sabırla kazanılır." (kurallar sitesinden, Masa sözü)
  - "Muco'nun sabrını zorlarsan kafana ıstakayı yiyebilirsin." (kurallar sitesinden, Mamika)
  (İlk üçünün altında "Masa sözü" yazar. Mustafa: beşi de dönüşe girsin)
- [x] (v42) Ana ekran: arka planda bulanık, yukarıdan okey masası ve dağınık taşlar, üstünde hafifçe titreyen kahvehane lambası ışığı
- [x] (v42) Oyun içi: büyük anlar için ortada kısa duyuru ("Ali 24 ile açtı!", "İşler taş! +500", "Okeyle bitirdi!")
- [x] (v42) Oyun içi: avatar seçimi (kahvehane karakterleri: çay bardağı, tespih, bıyıklı amca, kasket…; kendi çizimlerimiz)
- [x] (v42) Oyun içi: eli bitirince taşlar masaya vurulur, ekran hafif sarsılır; açamayıp tam ceza yiyenin isminde kan sıçraması
- [x] (v42) Oyun içi: ıstakadaki okey taşında arada altın parıltı, gösterge el başında dönerek açılır
- [x] (v42) Oyun içi: sıranın son 10 saniyesinde ekran kenarları kırmızı nabız atar
Cepte (sonra): ana ekranda canlı şerit (şu an kaç masa / bugün kaç el), "son oyunun" kartı, masa teması (keçe rengi), kahvehane uğultusu sesi

## Kolay mod (cepte, Mustafa: "sonra söylersin")
- [x] (v53) Ayarlarda "Kolay mod": yeni başlayanlar için. İçinde: yanlış atış uyarısı (okeyi ya da ıstakadaki bir perin parçasını atarken bir kez "emin misin?"), ipuçları hep açık, bitirme uyarısı ("bu taşı atınca biter, okeyle ×2")

## Ayarlar için sonraki fikirler (Mustafa seçti: v50'de yapılanlar işaretli; seçilmeyenler: sol el düzeni, taş teması, masa deseni, ıstaka ahşabı, Almanca, kimlik taşıma kodu)
- [ ] Sol el düzeni (düğmeler ve ıstaka aynalı)
- [x] (v50) Büyük yazı / büyük taş seçeneği
- [x] (v50) Sıra sende bildirimi (uygulama arka plandayken telefona bildirim)
- [x] (v50) Yandan taşı otomatik al uyarısı: yandaki taş per tamamlıyorsa ıstakada parlasın
- [x] (v50) Açma önerisi: ıstakada "bu taşı atarsan açabilirsin" ipucu
- [ ] Taş teması (klasik krem / koyu), masa deseni
- [x] (v50) Ses paketi seçimi, kahvehane uğultusu aç/kapa
- [ ] Dil (Türkçe / Almanca, yurt dışındaki Türkler için)

## Giriş ekranı ve yönetim paneli fikirleri (v41 sonrası, Mustafa seçecek)
Giriş ekranı
- [x] (v52) Botlarla hızlı oyun: tek dokunuşla 3 botlu masa açılır, hemen başlar (yalnızken deneme ve öğrenme)
- [ ] İlk kez gelene "3 dakikada öğren" kartı → Aşama 5.5 rehberi
- [x] (v52) Masa ekranında WhatsApp'a doğrudan gönder düğmesi (davet bağlantısıyla)
- [~] (v47 koltuğa dönüş; hesap sistemi istekler listesinde) Kimliği başka telefona taşıma kodu (hesap açmadan: telefon değişince koltuk ve geçmiş kaybolmasın)
- [x] (v50 "Oyun geçmişim", bu cihazda) Son oyunlarım: son 5 oyun, kendi cezan, sonuncu kim
- [~] Bekleme odasında: oda başına bot seviyesi var (v56); "Hazırım" ve kuranın oyuncu çıkarması yok
- [~] (v48, v50) Ayarlar: büyük yazı, renk körü işaretleri yapıldı; sol el düzeni yok
- [x] (v56) Açık masalar: yabancılarla oynama (kuran açar, "Masa seç" listesi, bot yerine oturma). Hile ve küfür önlemi hâlâ açık: Hile ve küfür önlemi gerektirir
Yönetim paneli
- [x] (v56) Hata / "kural yanlış" bildirim kutusu: oyuncu menüden yazar, oyunun o anki durumu otomatik eklenir, panelde listelenir
- [ ] Canlı durum: bağlı oyuncu, açık oda, sunucu sürümü, ne zamandır açık
- [ ] Bakım duyurusu: "5 dakika sonra güncelleme" şeridi ve yeni oyun başlatmayı geçici kapatma (ücretsiz planda güncelleme oyunları siliyor)
- [ ] Yedek indir / geri yükle: oyunlar ve istatistik tek dosya
- [x] (v56) Hamle kaydı: her oyunun hamleleri sırayla; anlaşmazlıkta "ne oldu" bakılır, hata bildirimine eklenir
- [~] (v56) Oyuncular: takma ad, son görülme, masası var; oyun sayısı ve engelleme yok
- [ ] İstatistik: günlük oyun, ortalama el süresi, okeyle bitirme ve deste biten el oranı
- [ ] Kural ayarları (ev kuralları): sadece Mustafa'nın onayladığı değerler (açılış eşiği, cezalar)
- [ ] İşlem kaydı: hangi yönetici neyi sildi / değiştirdi

## Aşama 5.5: Oyunu öğreten rehber (UNUTMA)
Hedef: kuralı hiç bilmeyen biri 10 dakikada oyunu oynayabilsin.
- [ ] "Nasıl oynanır" rehberi oyunun içinde, adım adım ve oynayarak
- [ ] Hazır, sabit eller: "17 ile aç", "katlamalı", "çift aç", "işle", "okey değiştir", "bitir" her biri için küçük görev. Doğru yaparsa geçer, yanlış yaparsa sebebi söylenir.
- [ ] Öğretici modda ceza hesabı canlı: neden bu kadar yazıldı
- [ ] Botlu deneme eli (3 botla, rehber yanında)
- [ ] Oyun içinde her yerde "?" düğmesi: o anki ilgili kuralı gösterir
- [ ] Tek ekran kural özeti kartı: açma, işleme, ceza tablosu, çarpanlar
- [ ] Rehberdeki her şey KURALLAR.md'ye dayanır. Kural değişince rehber de aynı toplu güncellemede değişir.
- [ ] Sonunda küçük sınav ("Bu eli açabilir misin?")

## Aşama 6: Kapalı beta
- [ ] Mustafa ve 5-10 gerçek arkadaş grubu gerçek 4 kişilik oyun oynar
- [x] (v56) Hata bildirme düğmesi (oyun durumu + son hamleler otomatik gelir; ekran görüntüsü yok)
- [x] (v56) "Kural yanlış" bildirme düğmesi: Mustafa'ya sorulacaklar listesine girer (bölgeden bölgeye kural farkı burada ortaya çıkar)
- [ ] Basit istatistik: kaç oyun başladı, kaç tanesi bitti, nerede çıkıldı
- [ ] Performans: yavaş telefon, kötü internet, arka planda sekme testleri
- [ ] Beta bulguları düzelmeden yayına geçilmez

## Aşama 7: Yayına al
- [ ] Alan adı, HTTPS, barındırma
- [x] (v41, v58) Tanıtım sitesi ve oyun aynı adreste; kurallar oyunun içinde açılır
- [ ] Gizlilik metni ve kısa kullanım şartları (KVKK'ya uygun, az veri toplanır)
- [ ] Arama motoru için: "kanlı okey kuralları", "kanlı okey nasıl oynanır" sayfaları
- [x] (v41) Paylaşım önizlemesi (WhatsApp'ta link atılınca güzel kart çıksın)
- [ ] Hata ve sunucu izleme (çökerse haber gelsin), yedekleme

## Hile önlemleri
Ayrıntı: docs/HILE-ONLEMLERI.md
- [x] Sunucu sürümünde: başkasının eli ve deste sırası istemciye hiç gitmiyor, her hamle sunucuda kurallarla doğrulanıyor, oyun kaydına istemci yazamıyor, taş sayısı (106) ve aynı taşın iki kez bulunması her hamlede denetleniyor, hız sınırı, başka siteden bağlantı engeli, yönetici şifresi sunucuda
- [ ] Aynı kişinin iki koltuğa oturması / anlaşmalı oynama (arkadaş masasında düşük risk; yabancılarla eşleştirme açılırsa gerekir)
- [~] (v56 hamle kaydı) Hamle kaydı (anlaşmazlıkta "ne oldu" bakılır); şüpheli hamle raporu yok
- [ ] Bot devralmasında "oyuncu bilerek çıkıyor" kötüye kullanımı

## Yönetim paneli (Admin)
İlk sürüm yapıldı (oyunun içinde, sadece sahibe görünür). Gelişim:
- [x] Oda listesi: kod, kuran, durum (bekliyor / oyunda), el, yaş, oyuncular
- [x] Odayı sil, 24 saatten eskileri sil, hepsini sil, eski kayıtları temizle (çift dokunma onayı)
- [~] (v27 botla değiştir, sırayı atlat) Oyuncu atma / odadan çıkarma
- [ ] Odayı izleme: kimin sırası, deste durumu (eller görünmez, hile olmasın)
- [x] (v56) Hata ve şikayet kutusu: oyuncuların "kural yanlış" ve hata bildirimleri burada toplanır
- [ ] İstatistik: günlük oyun sayısı, ortalama süre, kaç oyun bitti, nerede bırakıldı
- [ ] Kural sorusu listesi: Mustafa'ya sorulacak açık konular burada görünür ve cevaplandıkça kapanır
- [ ] Yasaklı takma ad / kullanıcı engelleme (yabancı eşleştirme açılınca şart)
- [~] (v40) Sunucuda gerçek yetki: admin girişi yapıldı; kayıt tutma (kim neyi sildi) yok

## Aşama 8: Büyüme ve fark yaratan özellikler
- [ ] Ev kuralları: oda kurarken seçenekler. Bölgeden bölgeye değişen oyun olduğu için büyük fark yaratır. Seçenekler sadece Mustafa'nın söylediği varyasyonlarla sınırlı olur, tahminle eklenmez.
- [ ] Hesap: Mustafa kullanıcı adı + şifre ile en basit kaydı istedi (istekler listesinde). Google/Apple girişi sonra.
- [ ] İstatistikler: en çok sonuncu olan, en çok işleme cezası yazdıran, en çok okeyle bitiren, "kanlı" ödüller
- [ ] Arkadaş listesi, aynı masayla yeni oyun
- [x] (v52, v54) Hızlı tepkiler (emoji, hazır mesajlar) ve sohbet
- [ ] İzleyici modu ve maç tekrar izleme
- [ ] Oyun sonu paylaşım kartı ("Bu oyunda 840 ceza yedim") WhatsApp'ta paylaşılsın
- [ ] Arkadaş grubuna sezonluk skor tablosu / lig
- [~] (v56 herkese açık masa) İki masa türü: "Arkadaş masası" (kodla, sadece davetli) ve "Herkese açık masa" (yabancılarla eşleştirme). Karar: ikisi de olacak, arkadaş masası her zaman kalır. Yabancı eşleştirme için gerekenler: bekleme havuzu, boş koltuğu bot doldurma, ayrılana ceza yok, takma ad filtresi, şikayet, yönetim panelinde engelleme.
- [ ] Çok dilli (önce Türkçe, ileride Almanca/İngilizce, yurt dışındaki Türkler için)

## Aşama 9: Birleştirme ve cila
- [ ] Tanıtım sitesi, rehber ve oyun tek ürün
- [ ] Logo, taş tasarımı, tema (açık/koyu), taş ve masa temaları
- [ ] Yardım/SSS sayfası

## Sürekli işler (her aşamayla birlikte)
- Kural toplama: Mustafa'nın henüz söylemediği kurallar için soru listesi tutulur, tahmin edilmez. Sırası gelince sorulacak kenar durumlar:
  - (Cevaplandı, KURALLAR.md) Eli bitiren son taş hem işler taş hem okeyse ne olur?
  - Oyuncu oyundan çıkarsa cezası nasıl yazılır?
  - Katlamalıda biri per, biri çift açarsa puanlar aynı sayıdan mı karşılaştırılır?
  - (Cevaplandı: evet) 9 ve 13 turlu oyunda büyük el sayısı farkı (1, 5, 9, 13) gerçek oyunda da böyle mi?
  - (Cevaplandı, KURALLAR.md) Deste bitince yandan alınan taş / açılmış oyuncuların durumu
- KURALLAR.md tek doğru kaynak. Her kural değişikliği: KURALLAR.md, motor, test, site, rehber birlikte.
- Her aşamanın sonunda çalıştığı denenir, Mustafa'ya gösterilir, onay alınır.
- Değişiklikler toplu ve tek oturumdan yapılır (çakışmayı önlemek için).

## Sıra özeti
2 Motor ve testler → 3 Botlar ve simülasyon → 4 Gerçek proje ve sunucu → 5 Oynama hissi → 5.5 Rehber → 6 Beta → 7 Yayın → 8 Büyüme → 9 Birleştirme ve cila

## Verilen kararlar
- Tanıtım sitesi sadece okunan bir sayfa olarak kalır (kural sayfası). Oyundan "Kurallar" bağlantısıyla her an açılabilir. Siteye oyun kurma, hesaplayıcı, geri bildirim gibi özellikler eklenmeyecek. İleride kendi sunucuya geçerken site KURALLAR.md'den üretilecek.
- Giriş: misafir (takma ad) kalır; yanına kullanıcı adı + şifre ile basit kayıt gelecek, doğrulama yok (Mustafa, 31 Ekim 2026). Google/Apple girişi sonra.
- Beta: sadece davetle (oda kodu ile).
- Yönetim paneli olacak (ilk sürüm yapıldı).
- Oda kur / kodla katıl sistemi olacak (ilk sürüm yapıldı).
- Yabancıyla eşleştirme ileride olacak, arkadaş masası da hep olacak.

## Karar bekleyen konular (Mustafa'ya sorulacak)
- Para/reklam: şimdilik yok. Oyun tutarsa sadece görünüm (taş/masa temaları) satılabilir. Oyun puanı gerçek paraya bağlanmaz.
