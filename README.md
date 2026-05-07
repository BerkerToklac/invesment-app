# MoneyBook

`invesment-app`, Expo ile geliştirilen INVESTMENT istemcisidir. Uygulama e-posta kodu ile giriş, piyasa verisi görüntüleme, portföy yönetimi ve kullanıcı ayarları akışlarını içerir.

Backend karşılığı:

- [project1-be](/Users/airm4/Desktop/dev/project1-be/README.md)

Bu istemci backend tarafında şu alanlarla konuşur:

- `INVESTMENT`
- `SHAREDBACKEND`

## Özellikler

- e-posta kodu ile giriş
- döviz, kıymetli maden ve kripto fiyatları
- portföy CRUD
- onboarding sırasında baz para birimi ve yerel para birimi seçimi
- ayarlardan baz / yerel para birimini tek popup içinde değiştirme
- para birimi değişiminde portföy sıfırlama uyarısı
- alış kaynağı / platform takibi
- kullanıcı tanımlı platform listesi
- kategori ve platform dağılımı
- support iletişim bilgisi
- Türkçe / İngilizce dil desteği

Bugün desteklenen para birimleri:

- Top 20 dünya para birimi: `USD`, `EUR`, `JPY`, `GBP`, `CNY`, `CHF`, `AUD`, `CAD`, `HKD`, `SGD`, `INR`, `KRW`, `SEK`, `MXN`, `NZD`, `NOK`, `TWD`, `BRL`, `ZAR`, `PLN`
- Türkiye ve Avrupa ekleri: `TRY`, `DKK`, `CZK`, `HUF`, `RON`, `BGN`, `ISK`, `UAH`, `RSD`, `ALL`, `BAM`, `MKD`, `MDL`, `GEL`, `AMD`, `AZN`, `RUB`, `BYN`

Bugün öne çıkan piyasa varlıkları:

- forex: desteklenen para birimi listesindeki tüm dövizler
- metaller: gram / ons altın, gram / ons gümüş
- kripto: `BTC`, `ETH`, `BNB`, `XRP`, `SOL`, `USDT`, `PAXG`, `XAUT`

## Para Birimi Modeli

Uygulamada iki ayrı para birimi kavramı vardır:

### Baz Para Birimi

- portföyün ana referans para birimidir
- toplam değer, maliyet ve kar/zarar bu para birimine göre ana eksende yorumlanır
- daha tutarlı uzun vadeli takip için görece düşük enflasyonlu bir para birimi seçilmesi önerilir
- değiştirildiğinde mevcut portföy sıfırlanır

### Yerel Para Birimi / Display / Local Currency

- rakamların ekranda hangi para biriminde gösterileceğini belirler
- baz para birimi varlığı eklenirken alış kuru bu para birimi üzerinden girilir
- değiştirildiğinde mevcut portföy sıfırlanır

Önemli not:

- sistemin normalize hesap omurgası halen USD verisi üzerinden çalışır
- yeni işlemlerde alış maliyeti, işlem anındaki çapraz kur snapshot'larıyla desteklenen para birimlerinde saklanır
- eski kayıt fallback'leri temizlenmiştir; DB reset sonrası beklenen veri modeli yeni snapshot alanlarıdır

## Platform / Alış Kaynağı Modeli

Yatırım eklerken kullanıcı varlığı nereden aldığını veya nerede tuttuğunu seçebilir.

- varsayılan platform `Kişisel Kasam` değeridir
- İngilizce arayüzde varsayılan platform `Personal Safe` olarak gösterilir
- varsayılan platform silinemez
- kullanıcı yeni platform ekleyebilir
- kullanıcı eklediği platformları silebilir
- silinen platforma bağlı mevcut yatırımlar varsayılan platforma taşınır

Örnek platformlar:

- kişisel kasa
- A Bankası
- B Bankası
- C finans platformu

## API Endpoint'leri

| Method | Endpoint | Auth | Açıklama |
|---|---|---|---|
| `POST` | `/users/getLoginCode` | Hayır | Giriş kodu e-posta ile gönderilir |
| `POST` | `/users/verifyLoginCode` | Hayır | Kod doğrulanır, JWT döner |
| `GET` | `/users/me` | Evet | Oturum bilgisi |
| `DELETE` | `/users/me` | Evet | Hesap silme |
| `GET` | `/investment/market` | Hayır | Döviz, metal ve kripto fiyatları |
| `GET` | `/investment/profile` | Evet | Profil bilgisi |
| `PUT` | `/investment/profile` | Evet | Profil güncelleme |
| `GET` | `/investment/portfolio` | Evet | Portföy kalemleri |
| `POST` | `/investment/portfolio` | Evet | Yeni kalem ekle |
| `PUT` | `/investment/portfolio/:id` | Evet | Kalem güncelle |
| `DELETE` | `/investment/portfolio/:id` | Evet | Kalem sil |
| `PUT` | `/investment/portfolio/source-platform/reassign` | Evet | Platforma bağlı kayıtları başka platforma taşı |
| `DELETE` | `/investment/portfolio/all` | Evet | Tüm portföyü temizle |

## Frontend-Backend Entegrasyonu

Backend istemcisi:

- [src/services/apiClient.js](/Users/airm4/Desktop/dev/invesment-app/src/services/apiClient.js)

Davranış:

- `EXPO_PUBLIC_BACKEND_URL` kullanılır
- auth token AsyncStorage içinde tutulur
- auth çağrılarında app değeri `investment` olarak gönderilir

Ana namespace'ler:

- `/users`
- `/investment`

## Piyasa Verisi

Backend tarafında:

- OpenExchangeRates -> forex + metal türetmeleri
- CoinMarketCap -> kripto snapshot'ları

İstemci bu verileri:

- `/investment/market`

endpoint'i üzerinden çeker.

## Versiyon ve Konfigürasyon

Uygulama versiyonu:

- [app.json](/Users/airm4/Desktop/dev/invesment-app/app.json)

Ayarlar ekranındaki version bilgisi buradan okunur.

Backend URL:

- `.env`

Örnek:

```env
EXPO_PUBLIC_BACKEND_URL=https://project1-be-1.onrender.com
```

## Proje Yapısı

```text
invesment-app/
|-- App.js
|-- app.json
|-- src/
|   |-- components/
|   |-- context/
|   |-- navigation/
|   |-- screens/
|   |-- services/
|   |-- theme/
|   `-- utils/
`-- README.md
```

## Kurulum

```bash
cd invesment-app
npm install
```

`.env` dosyası oluşturun:

```env
EXPO_PUBLIC_BACKEND_URL=https://project1-be-1.onrender.com
```

Uygulamayı başlatın:

```bash
npm start
```

Alternatif komutlar:

```bash
npm run android
npm run ios
npm run web
```

## Geliştirme Notları

- Ayarlar ekranındaki baz / yerel para birimi davranışları ürün açısından kritiktir; değişiklik mevcut portföyü sıfırlar.
- Base currency asset'i için yatırım ekleme ekranında özel local-rate girişi vardır.
- Ana sayfa ve portföy ekranları base currency'yi ana gösterim, local currency'yi ikincil gösterim olarak kullanır.
- Döviz isimleri ana ekran ve varlık seçici arasında `CURRENCY_META` üzerinden ortaklaştırılmıştır.
- Platform adı veride canonical olarak saklanır; varsayılan platform İngilizce arayüzde display helper ile `Personal Safe` görünür.
- DB reset sonrası eski portföy fallback'lerine güvenilmez; yeni kayıtlar `buyCurrencyTotals` snapshot'ı ile oluşturulmalıdır.

## İlgili Repo

- [project1-be](/Users/airm4/Desktop/dev/project1-be/README.md)
