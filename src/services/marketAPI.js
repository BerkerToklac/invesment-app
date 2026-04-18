import { TROY_OZ_TO_GRAM } from '../utils/assets';

// Backend base URL — OpenExchangeRates (döviz+metaller) ve CoinMarketCap
// (kripto) verilerini saatte bir / 5 dakikada bir çekerek DB'de saklar.
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://project1-be-1.onrender.com';

function transformResponse(json) {
  const ratesData = json.rates?.data || {};

  const usdTry  = ratesData.TRY  ?? null;
  const eurRaw  = ratesData.EUR  ?? null; // 1 USD = eurRaw EUR
  const eurUsd  = eurRaw  ? 1 / eurRaw  : null;
  const eurTry  = (usdTry != null && eurRaw != null) ? usdTry / eurRaw : null;

  const xauRaw      = ratesData.XAU ?? null; // 1 USD = xauRaw troy oz gold
  const xagRaw      = ratesData.XAG ?? null;
  const goldOzUSD   = xauRaw ? 1 / xauRaw : null;
  const silverOzUSD = xagRaw ? 1 / xagRaw : null;
  const goldGramUSD   = goldOzUSD   != null ? goldOzUSD   / TROY_OZ_TO_GRAM : null;
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
    forex: { usdTry, eurUsd, eurTry },
    metals: {
      goldOzUSD,
      silverOzUSD,
      goldGramUSD,
      silverGramUSD,
      goldGramTRY:   (goldGramUSD   != null && usdTry != null) ? goldGramUSD   * usdTry : null,
      silverGramTRY: (silverGramUSD != null && usdTry != null) ? silverGramUSD * usdTry : null,
    },
    crypto,
    ratesUpdatedAt:  json.rates?.fetchedAt  ?? null,
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

  // ── Yardımcı: Varlık güncel USD fiyatı ───────────────────────────────────
  getAssetCurrentPrice(assetId, prices) {
    if (!prices) return null;
    const mapping = {
      'gold-gram':   prices.metals?.goldGramUSD,
      'silver-gram': prices.metals?.silverGramUSD,
      'gold-oz':     prices.metals?.goldOzUSD,
      'silver-oz':   prices.metals?.silverOzUSD,
      btc:           prices.crypto?.btc?.usd,
      bnb:           prices.crypto?.bnb?.usd,
      xrp:           prices.crypto?.xrp?.usd,
      usd:           1,
      eur:           prices.forex?.eurUsd,
    };
    return mapping[assetId] ?? null;
  },

  getAsset24hChange(assetId, prices) {
    if (!prices) return null;
    return prices.crypto?.[assetId]?.change24h ?? null;
  },
};
