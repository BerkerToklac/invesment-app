# MoneyBook (invesment-app)

`invesment-app`, Expo ile geliştirilen MoneyBook mobil istemcisidir. Uygulama e-posta koduyla giriş, piyasa verisi görüntüleme, portföy yönetimi ve kullanıcı ayarlarını içerir.

Backend karşılığı `/Users/airm4/Desktop/Coding/project1-be` reposundaki `apps/investment`, ortak `/users` ve `apps/admin` alanlarıdır.

## Guncel Durum

- Mobil istemci aktif gelistirme altindadir.
- Backend baglantisi `EXPO_PUBLIC_BACKEND_URL` uzerinden yonetilir.
- Piyasa verisi backendde OpenExchangeRates + CoinMarketCap birlesimiyle uretilir, istemci `/investment/market` endpointinden ceker.
- Portföy ekleme/düzenleme, platform yeniden atama, para birimi değişikliği ve hesap silme işlemleri backend tarafında atomik yürütülür; işlem başarısız olursa yarım kayıt bırakılmaz.
- Mobil arayüz backend’in teknik hata metnini doğrudan göstermez; kullanıcıya güvenli ve kısa mesaj verilir.
- Yönetim panelinde MoneyBook kullanıcıları, portföy/platform detayları ve silinen hesap snapshotları incelenebilir.

Not: Mobil release davranisi BoomDating/Petsy ile ayni modeldedir; mobil degisiklikler store review ve kullanici update sonrasinda canli olur.

## Ozellikler

- e-posta kodu ile giris
- doviz, kiymetli maden ve kripto fiyatlari
- portfoy CRUD
- onboarding sirasinda baz para birimi ve yerel para birimi secimi
- ayarlardan baz / yerel para birimini tek popup icinde degistirme
- para birimi degisiminde portfoy sifirlama uyarisi
- alis kaynagi / platform takibi
- kullanici tanimli platform listesi
- kategori ve platform dagilimi
- Turkce / Ingilizce dil destegi

## Para Birimi Modeli

### Baz Para Birimi

- portfoyun ana referans para birimidir
- toplam deger, maliyet ve kar/zarar bu para birimine gore yorumlanir
- degistirildiginde mevcut portfoy sifirlanir

### Yerel Para Birimi

- rakamlarin ekranda hangi para biriminde gosterilecegini belirler
- baz para birimi varligi eklenirken alis kuru bu para birimi uzerinden girilir
- degistirildiginde mevcut portfoy sifirlanir

## API Endpoint'leri

| Method | Endpoint | Auth | Aciklama |
|---|---|---|---|
| `POST` | `/users/getLoginCode` | Hayir | Giris kodu e-posta ile gonderilir |
| `POST` | `/users/verifyLoginCode` | Hayir | Kod dogrulanir, JWT doner |
| `GET` | `/users/me` | Evet | Oturum bilgisi |
| `DELETE` | `/users/me` | Evet | Hesap silme |
| `GET` | `/investment/market` | Hayir | Doviz, metal ve kripto fiyatlari |
| `GET` | `/investment/profile` | Evet | Profil bilgisi |
| `PUT` | `/investment/profile` | Evet | Profil guncelleme |
| `PUT` | `/investment/onboarding` | Evet | Onboarding profilini ve para birimi tercihlerini kaydet |
| `GET` | `/investment/preferences` | Evet | Favoriler ve alis kaynaklari |
| `PUT` | `/investment/preferences/currency` | Evet | Para birimi tercihlerini atomik güncelle |
| `PUT` | `/investment/preferences/home-favorites` | Evet | Favori siralamasini guncelle |
| `POST` | `/investment/preferences/home-favorites` | Evet | Favori ekle |
| `DELETE` | `/investment/preferences/home-favorites/:favoriteId` | Evet | Favori sil |
| `POST` | `/investment/preferences/investment-platforms` | Evet | Alis kaynagi ekle |
| `DELETE` | `/investment/preferences/investment-platforms/:platformName` | Evet | Alis kaynagi sil |
| `GET` | `/investment/portfolio` | Evet | Portfoy kalemleri |
| `POST` | `/investment/portfolio` | Evet | Yeni kalem ekle |
| `PUT` | `/investment/portfolio/:id` | Evet | Kalem guncelle |
| `DELETE` | `/investment/portfolio/:id` | Evet | Kalem sil |
| `PUT` | `/investment/portfolio/source-platform/reassign` | Evet | Platforma bagli kayitlari baska platforma tasi |
| `DELETE` | `/investment/portfolio/all` | Evet | Tum portfoyu temizle |

## Frontend-Backend Entegrasyonu

Backend istemcisi: `src/services/apiClient.js`

Davranis:

- `EXPO_PUBLIC_BACKEND_URL` kullanilir
- auth token AsyncStorage icinde tutulur
- auth cagrilarinda app degeri `investment` olarak gonderilir

Ana namespace'ler:

- `/users`
- `/investment`

## Dil, hata ve hesap yönetimi

- Türkçe ve İngilizce desteklenir; tanınmayan dil değerlerinde İngilizce fallback kullanılır.
- API istemcisi kullanıcıya yalnız ürün diline çevrilmiş, teknik ayrıntı içermeyen hata mesajları döndürür.
- Hesap silme Ayarlar içindeki hesap yönetimi alanındadır ve iki aşamalı sistem onayı ister.
- Silinen hesabın aktif verileri kaldırılır; silme anındaki snapshot yönetim panelindeki MoneyBook > Silinen Hesaplar alanına taşınır.
- Destek adresi `support@48labs.tr`dir.
- Uygulama sürümü `app.json` içindeki `expo.version` alanındadır.

## Kurulum

```bash
npm install
```

`.env` dosyasi olusturun:

```env
EXPO_PUBLIC_BACKEND_URL=https://project1-be-1.onrender.com
```

Uygulamayi baslatin:

```bash
npm start
```

Alternatif komutlar:

```bash
npm run android
npm run ios
npm run web
```

## Ilgili Repo

- [project1-be](/Users/airm4/Desktop/Coding/project1-be/README.md)
