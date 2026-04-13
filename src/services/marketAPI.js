import { TROY_OZ_TO_GRAM } from '../utils/assets';

const FALLBACK_PRICES = {
  usdTry: 38.5,
  eurTry: 41.8,
  eurUsd: 1.086,
  goldGramUSD: 106.0,
  silverGramUSD: 1.04,
  crypto: {
    bitcoin: 83000,
    ethereum: 1900,
    binancecoin: 593,
    ripple: 1.32,
    solana: 135,
    tether: 1.0,
    'pax-gold': 3300,
    'tether-gold': 3295,
  },
};

let cachedPrices = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000;

export const MarketAPI = {
  // ── 1. Döviz Kurları ──────────────────────────────────────────────────────
  async fetchForexRates() {
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=TRY,EUR', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const eurPerUsd = data.rates?.EUR;
      const tryPerUsd = data.rates?.TRY;
      return {
        usdTry: tryPerUsd || FALLBACK_PRICES.usdTry,
        eurUsd: eurPerUsd ? 1 / eurPerUsd : FALLBACK_PRICES.eurUsd,
        eurTry: eurPerUsd && tryPerUsd ? tryPerUsd / eurPerUsd : FALLBACK_PRICES.eurTry,
      };
    } catch (e) {
      console.warn('Forex fetch failed, using fallback:', e.message);
      return {
        usdTry: FALLBACK_PRICES.usdTry,
        eurUsd: FALLBACK_PRICES.eurUsd,
        eurTry: FALLBACK_PRICES.eurTry,
      };
    }
  },

  // ── 2. Kripto Fiyatları (PAXG altın için de kullanılır) ───────────────────
  async fetchCryptoPrices() {
    const ids = 'bitcoin,ethereum,binancecoin,ripple,solana,tether,pax-gold,tether-gold';
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const result = {};
      Object.keys(data).forEach((key) => {
        result[key] = {
          usd: data[key].usd,
          change24h: data[key].usd_24h_change || 0,
        };
      });
      return result;
    } catch (e) {
      console.warn('Crypto fetch failed, using fallback:', e.message);
      const result = {};
      Object.keys(FALLBACK_PRICES.crypto).forEach((key) => {
        result[key] = { usd: FALLBACK_PRICES.crypto[key], change24h: 0 };
      });
      return result;
    }
  },

  // ── 3. Gümüş Fiyatı (Yahoo Finance SI=F futures) ─────────────────────────
  // Altın için ayrı API'ye gerek yok: 1 PAXG = 1 troy oz altın,
  // CoinGecko kripto çağrısında zaten geliyor.
  async fetchSilverPrice() {
    try {
      const res = await fetch(
        'https://query1.finance.yahoo.com/v7/finance/quote?symbols=SI%3DF&fields=regularMarketPrice',
        { headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const price = data.quoteResponse?.result?.[0]?.regularMarketPrice;
      if (!price) throw new Error('Fiyat verisi boş');
      return price; // USD / troy oz
    } catch (e) {
      console.warn('Gümüş fiyatı alınamadı, sabit değer kullanılıyor:', e.message);
      return FALLBACK_PRICES.silverGramUSD * TROY_OZ_TO_GRAM;
    }
  },

  // ── 4. Tüm Fiyatlar ───────────────────────────────────────────────────────
  async fetchAllPrices(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedPrices && now - lastFetchTime < CACHE_DURATION) {
      return cachedPrices;
    }

    // Forex, kripto ve gümüş paralel çekilir
    const [forex, crypto, silverOzUSD] = await Promise.all([
      this.fetchForexRates(),
      this.fetchCryptoPrices(),
      this.fetchSilverPrice(),
    ]);

    // Altın: 1 PAXG = 1 troy oz altın (CoinGecko'dan geliyor, ayrı API yok)
    const goldOzUSD   = crypto?.['pax-gold']?.usd ?? FALLBACK_PRICES.goldGramUSD * TROY_OZ_TO_GRAM;
    const goldGramUSD = goldOzUSD / TROY_OZ_TO_GRAM;
    const silverGramUSD = silverOzUSD / TROY_OZ_TO_GRAM;

    const metals = {
      goldOzUSD,
      silverOzUSD,
      goldGramUSD,
      silverGramUSD,
    };

    const prices = {
      forex,
      metals: {
        ...metals,
        goldGramTRY:  metals.goldGramUSD  * forex.usdTry,
        silverGramTRY: metals.silverGramUSD * forex.usdTry,
      },
      crypto,
      lastUpdated: new Date().toISOString(),
    };

    cachedPrices = prices;
    lastFetchTime = now;
    return prices;
  },

  // ── Yardımcı: Varlık güncel USD fiyatı ───────────────────────────────────
  getAssetCurrentPrice(assetId, prices) {
    if (!prices) return null;
    const mapping = {
      'gold-gram':   prices.metals?.goldGramUSD,
      'silver-gram': prices.metals?.silverGramUSD,
      bitcoin:       prices.crypto?.bitcoin?.usd,
      btc:           prices.crypto?.bitcoin?.usd,
      ethereum:      prices.crypto?.ethereum?.usd,
      eth:           prices.crypto?.ethereum?.usd,
      bnb:           prices.crypto?.binancecoin?.usd,
      binancecoin:   prices.crypto?.binancecoin?.usd,
      xrp:           prices.crypto?.ripple?.usd,
      ripple:        prices.crypto?.ripple?.usd,
      sol:           prices.crypto?.solana?.usd,
      solana:        prices.crypto?.solana?.usd,
      usdt:          prices.crypto?.tether?.usd,
      tether:        prices.crypto?.tether?.usd,
      paxg:          prices.crypto?.['pax-gold']?.usd,
      'pax-gold':    prices.crypto?.['pax-gold']?.usd,
      xaut:          prices.crypto?.['tether-gold']?.usd,
      'tether-gold': prices.crypto?.['tether-gold']?.usd,
      usd:           1,
      eur:           prices.forex?.eurUsd,
    };
    return mapping[assetId] ?? null;
  },

  getAsset24hChange(assetId, prices) {
    if (!prices) return 0;
    const cryptoMap = {
      btc:  'bitcoin',
      eth:  'ethereum',
      bnb:  'binancecoin',
      xrp:  'ripple',
      sol:  'solana',
      usdt: 'tether',
      paxg: 'pax-gold',
      xaut: 'tether-gold',
    };
    const geckoId = cryptoMap[assetId] || assetId;
    return prices.crypto?.[geckoId]?.change24h || 0;
  },
};
