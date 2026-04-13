import { TROY_OZ_TO_GRAM } from '../utils/assets';

// Fallback prices for when APIs are unavailable
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
const CACHE_DURATION = 60 * 1000; // 1 minute

export const MarketAPI = {
  async fetchForexRates() {
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=TRY,EUR', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Frankfurter API error');
      const data = await res.json();
      return {
        usdTry: data.rates?.TRY || FALLBACK_PRICES.usdTry,
        eurUsd: data.rates?.EUR || FALLBACK_PRICES.eurUsd,
        eurTry: (data.rates?.EUR || FALLBACK_PRICES.eurUsd) * (data.rates?.TRY || FALLBACK_PRICES.usdTry),
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

  async fetchMetalPrices() {
    try {
      const res = await fetch('https://api.metals.live/v1/spot', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Metals API error');
      const data = await res.json();
      // metals.live returns array of {gold: price, silver: price, ...} per item
      let goldOz = null;
      let silverOz = null;
      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (item.gold) goldOz = item.gold;
          if (item.silver) silverOz = item.silver;
        });
      } else {
        goldOz = data.gold;
        silverOz = data.silver;
      }
      return {
        goldGramUSD: goldOz ? goldOz / TROY_OZ_TO_GRAM : FALLBACK_PRICES.goldGramUSD,
        silverGramUSD: silverOz ? silverOz / TROY_OZ_TO_GRAM : FALLBACK_PRICES.silverGramUSD,
        goldOzUSD: goldOz || FALLBACK_PRICES.goldGramUSD * TROY_OZ_TO_GRAM,
        silverOzUSD: silverOz || FALLBACK_PRICES.silverGramUSD * TROY_OZ_TO_GRAM,
      };
    } catch (e) {
      console.warn('Metals fetch failed, using fallback:', e.message);
      return {
        goldGramUSD: FALLBACK_PRICES.goldGramUSD,
        silverGramUSD: FALLBACK_PRICES.silverGramUSD,
        goldOzUSD: FALLBACK_PRICES.goldGramUSD * TROY_OZ_TO_GRAM,
        silverOzUSD: FALLBACK_PRICES.silverGramUSD * TROY_OZ_TO_GRAM,
      };
    }
  },

  async fetchCryptoPrices() {
    const ids = 'bitcoin,ethereum,binancecoin,ripple,solana,tether,pax-gold,tether-gold';
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) throw new Error('CoinGecko API error');
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

  async fetchAllPrices(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedPrices && now - lastFetchTime < CACHE_DURATION) {
      return cachedPrices;
    }

    const [forex, metals, crypto] = await Promise.all([
      this.fetchForexRates(),
      this.fetchMetalPrices(),
      this.fetchCryptoPrices(),
    ]);

    const prices = {
      forex,
      metals: {
        ...metals,
        goldGramTRY: metals.goldGramUSD * forex.usdTry,
        silverGramTRY: metals.silverGramUSD * forex.usdTry,
      },
      crypto,
      lastUpdated: new Date().toISOString(),
    };

    cachedPrices = prices;
    lastFetchTime = now;
    return prices;
  },

  // Get the current USD price for a given asset id
  getAssetCurrentPrice(assetId, prices) {
    if (!prices) return null;

    const mapping = {
      'gold-gram': prices.metals?.goldGramUSD,
      'silver-gram': prices.metals?.silverGramUSD,
      bitcoin: prices.crypto?.bitcoin?.usd,
      btc: prices.crypto?.bitcoin?.usd,
      ethereum: prices.crypto?.ethereum?.usd,
      eth: prices.crypto?.ethereum?.usd,
      bnb: prices.crypto?.binancecoin?.usd,
      binancecoin: prices.crypto?.binancecoin?.usd,
      xrp: prices.crypto?.ripple?.usd,
      ripple: prices.crypto?.ripple?.usd,
      sol: prices.crypto?.solana?.usd,
      solana: prices.crypto?.solana?.usd,
      usdt: prices.crypto?.tether?.usd,
      tether: prices.crypto?.tether?.usd,
      paxg: prices.crypto?.['pax-gold']?.usd,
      'pax-gold': prices.crypto?.['pax-gold']?.usd,
      xaut: prices.crypto?.['tether-gold']?.usd,
      'tether-gold': prices.crypto?.['tether-gold']?.usd,
      usd: 1,
      eur: prices.forex?.eurUsd,
    };

    return mapping[assetId] || null;
  },

  getAsset24hChange(assetId, prices) {
    if (!prices) return 0;
    const cryptoMap = {
      btc: 'bitcoin',
      eth: 'ethereum',
      bnb: 'binancecoin',
      xrp: 'ripple',
      sol: 'solana',
      usdt: 'tether',
      paxg: 'pax-gold',
      xaut: 'tether-gold',
    };
    const geckoId = cryptoMap[assetId] || assetId;
    return prices.crypto?.[geckoId]?.change24h || 0;
  },
};
