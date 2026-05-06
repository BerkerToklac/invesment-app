import { TROY_OZ_TO_GRAM } from '../utils/assets';

// Backend base URL - OpenExchangeRates (forex + metals) and CoinMarketCap
// (crypto) data are fetched by the backend and stored in the DB.
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://project1-be-1.onrender.com';

function transformResponse(json) {
  const ratesData = json.rates?.data || {};

  const usdTry = ratesData.TRY ?? null;
  const usdEur = ratesData.EUR ?? null; // 1 USD = x EUR
  const usdGbp = ratesData.GBP ?? null; // 1 USD = x GBP
  const eurUsd = usdEur ? 1 / usdEur : null;
  const gbpUsd = usdGbp ? 1 / usdGbp : null;
  const eurTry = usdTry != null && usdEur != null ? usdTry / usdEur : null;
  const gbpTry = usdTry != null && usdGbp != null ? usdTry / usdGbp : null;
  const eurGbp = usdGbp != null && usdEur != null ? usdGbp / usdEur : null;

  const xauRaw = ratesData.XAU ?? null; // 1 USD = x troy oz gold
  const xagRaw = ratesData.XAG ?? null;
  const goldOzUSD = xauRaw ? 1 / xauRaw : null;
  const silverOzUSD = xagRaw ? 1 / xagRaw : null;
  const goldGramUSD = goldOzUSD != null ? goldOzUSD / TROY_OZ_TO_GRAM : null;
  const silverGramUSD = silverOzUSD != null ? silverOzUSD / TROY_OZ_TO_GRAM : null;

  const crypto = {};
  (json.crypto?.data || []).forEach((q) => {
    const symbol = q.symbol?.toLowerCase();
    if (symbol) {
      crypto[symbol] = {
        usd: q.price ?? null,
        change24h: q.percentChange24h ?? null,
      };
    }
  });

  return {
    forex: {
      rates: { USD: 1, ...ratesData },
      usdTry,
      usdEur,
      eurUsd,
      eurTry,
      usdGbp,
      gbpUsd,
      gbpTry,
      eurGbp,
    },
    metals: {
      goldOzUSD,
      silverOzUSD,
      goldGramUSD,
      silverGramUSD,
      goldGramTRY: goldGramUSD != null && usdTry != null ? goldGramUSD * usdTry : null,
      silverGramTRY: silverGramUSD != null && usdTry != null ? silverGramUSD * usdTry : null,
    },
    crypto,
    ratesUpdatedAt: json.rates?.fetchedAt ?? null,
    cryptoUpdatedAt: json.crypto?.fetchedAt ?? null,
    lastUpdated: new Date().toISOString(),
  };
}

export const MarketAPI = {
  async fetchAllPrices() {
    const res = await fetch(`${BACKEND_URL}/investment/market`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return transformResponse(json);
  },

  getAssetCurrentPrice(assetId, prices) {
    if (!prices) return null;
    const mapping = {
      'gold-gram': prices.metals?.goldGramUSD,
      'silver-gram': prices.metals?.silverGramUSD,
      'gold-oz': prices.metals?.goldOzUSD,
      'silver-oz': prices.metals?.silverOzUSD,
      btc: prices.crypto?.btc?.usd,
      eth: prices.crypto?.eth?.usd,
      bnb: prices.crypto?.bnb?.usd,
      xrp: prices.crypto?.xrp?.usd,
    };
    if (mapping[assetId] != null) return mapping[assetId];

    const currency = typeof assetId === 'string' ? assetId.toUpperCase() : '';
    const usdToCurrency = prices.forex?.rates?.[currency] ?? null;
    if (currency === 'USD') return 1;
    return usdToCurrency ? 1 / usdToCurrency : null;
  },

  getAsset24hChange(assetId, prices) {
    if (!prices) return null;
    return prices.crypto?.[assetId]?.change24h ?? null;
  },
};
