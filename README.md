# Portföy — Yatırım Takip Uygulaması

`invesment-app`, Expo ile geliştirilen INVESTMENT istemcisidir. Uygulama login, piyasa verisi görüntüleme, portföy yönetimi ve ayarlar akışlarını taşır.

Bu repo frontend tarafını içerir. Backend karşılığı [project1-be](/Users/airm4/Desktop/dev/project1-be/README.md) içindeki `INVESTMENT` ve `SHAREDBACKEND` alanlarıdır.

## Bu Uygulamanın Backend Alanları

Bu istemci backend tarafında şu alanlarla konuşur:

- `INVESTMENT`
- `SHAREDBACKEND`

`INVESTMENT`, piyasa verisi ve portföy verilerini taşır. `SHAREDBACKEND`, ortak auth, kullanıcı ve log katmanını sağlar.

## API Endpoint'leri

| Method | Endpoint | Auth | Açıklama |
|---|---|---|---|
| `POST` | `/users/getLoginCode` | Hayır | Giriş kodu e-posta ile gönderilir |
| `POST` | `/users/verifyLoginCode` | Hayır | Kod doğrulanır, JWT döner |
| `GET` | `/users/me` | Evet | Oturum bilgisi |
| `DELETE` | `/users/me` | Evet | Hesap silme |
| `GET` | `/investment/market` | Hayır | Döviz, metal ve kripto anlık fiyatlar |
| `GET` | `/investment/portfolio` | Evet | Kullanıcının portföy kalemleri |
| `POST` | `/investment/portfolio` | Evet | Yeni kalem ekle |
| `PUT` | `/investment/portfolio/:id` | Evet | Kalem güncelle |
| `DELETE` | `/investment/portfolio/:id` | Evet | Kalem sil |

## Frontend-Backend Entegrasyonu

Backend istemcisi [src/services/apiClient.js](/Users/airm4/Desktop/dev/invesment-app/src/services/apiClient.js) içinde tanımlıdır.

Davranış:

- `EXPO_PUBLIC_BACKEND_URL` kullanılır
- fallback olarak production backend URL'i bulunur
- auth token AsyncStorage içinde tutulur

Auth çağrılarında app değeri `investment` olarak gönderilir:

- [src/context/AuthContext.js](/Users/airm4/Desktop/dev/invesment-app/src/context/AuthContext.js)

İstemcinin konuştuğu ana backend namespace'leri:

- `/users`
- `/investment`

## Backend Koleksiyonları

### `SHAREDBACKEND`

- `SHAREDBACKEND_USERS`
- `SHAREDBACKEND_LOGS`

### `INVESTMENT`

Bu uygulamaya ait MongoDB koleksiyonları `INVESTMENT_` ile başlar. Örnekler:

- `INVESTMENT_HOLDINGS`
- `INVESTMENT_MARKET_RATES`
- `INVESTMENT_CRYPTO_QUOTES`
- `INVESTMENT_USER_INFO`

Not:

- market scheduler logları `SHAREDBACKEND_LOGS` içine yazılır ve log kaynağı `INVESTMENT` olarak işaretlenir.

## Piyasa Verileri

| Kaynak | Kapsam | Güncelleme |
|---|---|---|
| OpenExchangeRates | Döviz kurları + değerli metaller | Saatte bir |
| CoinMarketCap | BTC, BNB, XRP | 5 dakikada bir |

Veriler backend'de saklanır; istemci bunları `/investment/market` üzerinden çeker.

## Proje Yapısı

```text
invesment-app/
├── App.js
├── src/
│   ├── components/
│   ├── context/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── theme/
│   └── utils/
└── README.md
```

## Kurulum

```bash
cd invesment-app
npm install
```

`.env` örneği:

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

## İlgili Repo

- [project1-be](/Users/airm4/Desktop/dev/project1-be/README.md)
