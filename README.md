# Portföy — Yatırım Takip Uygulaması

React Native (Expo) ile geliştirilmiş kişisel yatırım portföy takip uygulaması.

## Backend

Bu uygulama, bir üst klasörde yer alan **`../project1-be`** projesini backend olarak kullanır.

`project1-be`, birden fazla mobil uygulamaya (dating, pet, investment…) aynı anda hizmet veren **ortak bir Express.js backend platformudur**. Kimlik doğrulama, kullanıcı yönetimi ve loglama gibi altyapı katmanları tüm uygulamalar tarafından ortaklaşa kullanılır; uygulama özelindeki veriler ise kendi modülleri altında izole tutulur.

Investment uygulamasına özel backend modülü: `project1-be/apps/investment/`

```
project1-be/apps/investment/
├── models/
│   ├── CryptoQuote.js       ← CoinMarketCap anlık görüntüsü (5dk'da bir)
│   ├── InvestmentHolding.js ← Kullanıcı portföy kalemleri
│   └── MarketRate.js        ← OpenExchangeRates anlık görüntüsü (saatte bir)
├── routes/
│   └── investment.js        ← /investment/* endpoint'leri
└── services/
    ├── marketDataService.js ← Zamanlanmış veri çekici
    └── userAccountService.js
```

## DB Koleksiyon Kuralı (Investment)

Bu uygulama ortak backend (`project1-be`) üzerinde çalıştığı için **Investment app'e ait tüm MongoDB koleksiyon adları `INVESTMENT_` ile başlamalıdır**.

Örnek:

- `INVESTMENT_HOLDINGS`
- `INVESTMENT_MARKET_RATES`
- `INVESTMENT_CRYPTO_QUOTES`
- `INVESTMENT_USER_INFO`

Bu kural, yalnızca Investment domain'i için geçerlidir.

## API Endpoint'leri

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| `POST` | `/users/getLoginCode` | — | Giriş kodu e-posta ile gönderilir |
| `POST` | `/users/verifyLoginCode` | — | Kod doğrulanır; JWT döner |
| `GET`  | `/users/me` | JWT | Oturum bilgisi |
| `DELETE` | `/users/me` | JWT | Hesap silme |
| `GET`  | `/investment/market` | — | Döviz + metal + kripto anlık fiyatlar |
| `GET`  | `/investment/portfolio` | JWT | Kullanıcının portföy kalemleri |
| `POST` | `/investment/portfolio` | JWT | Yeni kalem ekle |
| `PUT`  | `/investment/portfolio/:id` | JWT | Kalem güncelle |
| `DELETE` | `/investment/portfolio/:id` | JWT | Kalem sil |

Tüm korumalı endpoint'lerde `Authorization: Bearer <token>` header'ı gerekir.

## Piyasa Verileri

| Kaynak | Kapsam | Güncelleme |
|--------|--------|------------|
| [OpenExchangeRates](https://openexchangerates.org) | Döviz kurları + XAU (altın) + XAG (gümüş) | Saatte bir |
| [CoinMarketCap](https://coinmarketcap.com) | BTC, BNB, XRP | 5 dakikada bir |

Veriler backend'de MongoDB'ye kaydedilir; ön yüz her yeni açılışta `/investment/market` üzerinden tek sorguda alır.

## Proje Yapısı

```
src/
├── context/
│   ├── AuthContext.js      ← JWT auth (sendLoginCode / verifyLoginCode)
│   ├── MarketContext.js    ← Piyasa fiyatları
│   ├── PortfolioContext.js ← Portföy CRUD (backend)
│   └── SettingsContext.js
├── navigation/
│   └── AppNavigator.js
├── screens/
│   ├── HomeScreen.js
│   ├── PortfolioScreen.js
│   ├── AddInvestmentScreen.js
│   ├── LoginScreen.js
│   ├── OTPScreen.js
│   ├── OnboardingScreen.js
│   └── SettingsScreen.js
├── services/
│   ├── apiClient.js  ← HTTP istemcisi (token yönetimi dahil)
│   └── storage.js    ← AsyncStorage (auth user + ayarlar)
├── theme/
│   └── colors.js
└── utils/
    ├── assets.js
    ├── currency.js
    ├── formatters.js
    └── i18n.js
```

## Kurulum

```bash
cd invesment-app
npm install
```

`.env` dosyası (repo'da `.env` olarak bulunur):

```
EXPO_PUBLIC_BACKEND_URL=https://project1-be-1.onrender.com
```

```bash
npx expo start
```

## Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `EXPO_PUBLIC_BACKEND_URL` | Backend base URL |
