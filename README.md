# Portföy

`invesment-app`, Expo ile geliştirilen INVESTMENT istemcisidir. Uygulama e-posta kodu ile giriş, piyasa verisi görüntüleme, portföy yönetimi ve kullanıcı ayarları akışlarını içerir.

Backend karşılığı:

- [project1-be](C:/Users/mertc/Desktop/Dev/project1-be/README.md)

Bu istemci backend tarafında şu alanlarla konuşur:

- `INVESTMENT`
- `SHAREDBACKEND`

## Özellikler

- e-posta kodu ile giriş
- döviz, kıymetli maden ve kripto fiyatları
- portföy CRUD
- baz para birimi ve görüntüleme para birimi ayarları
- support iletişim bilgisi
- Türkçe / İngilizce dil desteği

Bugün desteklenen para birimleri:

- `TRY`
- `EUR`
- `GBP`
- `USD`

Bugün öne çıkan piyasa varlıkları:

- forex: `USD`, `EUR`, `GBP`
- metaller: gram / ons altın, gram / ons gümüş
- kripto: `BTC`, `ETH`, `BNB`, `XRP`

## Para Birimi Modeli

Uygulamada iki ayrı para birimi kavramı vardır:

### Baz Para Birimi

- portföyün ana referans para birimidir
- toplam değer, maliyet ve kar/zarar bu para birimine göre ana eksende yorumlanır
- değiştirildiğinde mevcut portföy sıfırlanır

### Görüntüleme Para Birimi

- rakamların ekranda hangi para biriminde gösterileceğini belirler
- ana portföy mantığını değil, sunumu değiştirir
- bazı base-currency bağlı kayıtlar etkilenebileceği için uygulama gerektiğinde kullanıcıyı uyarır

Önemli not:

- sistemin normalize hesap omurgası halen USD verisi üzerinden çalışır
- `baseCurrency`, bugün tam anlamıyla alternatif bir hesap motoru değil; kayıt bağlamı ve ana gösterim referansı olarak kullanılır

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
| `DELETE` | `/investment/portfolio/base/:currency` | Evet | Belirli base currency kayıtlarını sil |
| `DELETE` | `/investment/portfolio/all` | Evet | Tüm portföyü temizle |

## Frontend-Backend Entegrasyonu

Backend istemcisi:

- [src/services/apiClient.js](C:/Users/mertc/Desktop/Dev/invesment-app/src/services/apiClient.js)

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

- [app.json](C:/Users/mertc/Desktop/Dev/invesment-app/app.json)

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

- Ayarlar ekranındaki baz / görüntüleme para birimi davranışları ürün açısından kritiktir; backend davranışıyla uyumlu tutulmalıdır.
- Base currency asset'i için yatırım ekleme ekranında özel local-rate girişi vardır.
- Ana sayfa ve portföy ekranları artık base currency'yi ana gösterim, display currency'yi ikincil gösterim olarak kullanır.

## İlgili Repo

- [project1-be](C:/Users/mertc/Desktop/Dev/project1-be/README.md)
