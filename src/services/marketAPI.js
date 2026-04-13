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

  // ── 3. Metal Fiyatları ────────────────────────────────────────────────────
  // Birincil: goldprice.org (ücretsiz, key yok)
  // Fallback:  altın → PAXG (CoinGecko'dan zaten çekildi) ÷ 31.1
  //            gümüş → sabit değer
  async fetchMetalPrices(cryptoPrices = null) {
    try {
      const res = await fetch('https://data-asg.goldprice.org/dbXRates/USD', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const item = Array.isArray(data.items) ? data.items[0] : null;
      if (!item?.xauPrice) throw new Error('Geçersiz yanıt formatı');

      return {
        goldOzUSD:    item.xauPrice,
        silverOzUSD:  item.xagPrice,
        goldGramUSD:  item.xauPrice  / TROY_OZ_TO_GRAM,
        silverGramUSD: item.xagPrice / TROY_OZ_TO_GRAM,
        source: 'goldprice.org',
      };
    } catch (e) {
      console.warn('goldprice.org başarısız, yedek kullanılıyor:', e.message);

      // Altın: PAXG zaten CoinGecko'dan çekildi (1 PAXG = 1 troy oz altın)
      const paxgUsd = cryptoPrices?.['pax-gold']?.usd;
      const goldOz  = paxgUsd || FALLBACK_PRICES.goldGramUSD * TROY_OZ_TO_GRAM;

      return {
        goldOzUSD:    goldOz,
        silverOzUSD:  FALLBACK_PRICES.silverGramUSD * TROY_OZ_TO_GRAM,
        goldGramUSD:  goldOz / TROY_OZ_TO_GRAM,
        silverGramUSD: FALLBACK_PRICES.silverGramUSD,
        source: paxgUsd ? 'paxg-fallback' : 'hardcoded-fallback',
      };
    }
  },

  // ── 4. Tüm Fiyatlar ───────────────────────────────────────────────────────
  async fetchAllPrices(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedPrices && now - lastFetchTime < CACHE_DURATION) {
      return cachedPrices;
    }

    // Forex ve kripto paralel, metaller kripto bittikten sonra
    // (PAXG fallback için kripto sonuçları gerekli)
    const [forex, crypto] = await Promise.all([
      this.fetchForexRates(),
      this.fetchCryptoPrices(),
    ]);

    const metals = await this.fetchMetalPrices(crypto);

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
