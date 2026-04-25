export const PREDEFINED_ASSETS = [
  {
    id: 'gold-gram',
    name: 'Gram Altın',
    shortName: '995/1000',
    type: 'gold',
    unit: 'gram',
    coinGeckoId: null,
    metalKey: 'gold',
    color: '#F59E0B',
    emoji: '🥇',
  },
  {
    id: 'silver-gram',
    name: 'Gram Gümüş',
    shortName: '995/1000',
    type: 'silver',
    unit: 'gram',
    coinGeckoId: null,
    metalKey: 'silver',
    color: '#94A3B8',
    emoji: '🥈',
  },
  {
    id: 'gold-oz',
    name: 'Ons Altın',
    shortName: 'XAU',
    type: 'gold',
    unit: 'ons',
    coinGeckoId: null,
    metalKey: 'gold',
    color: '#F59E0B',
    emoji: '🥇',
  },
  {
    id: 'silver-oz',
    name: 'Ons Gümüş',
    shortName: 'XAG',
    type: 'silver',
    unit: 'ons',
    coinGeckoId: null,
    metalKey: 'silver',
    color: '#94A3B8',
    emoji: '🥈',
  },
  {
    id: 'btc',
    name: 'Bitcoin',
    shortName: 'BTC',
    type: 'crypto',
    unit: 'BTC',
    coinGeckoId: 'bitcoin',
    color: '#F7931A',
    emoji: '₿',
  },
  {
    id: 'eth',
    name: 'Ethereum',
    shortName: 'ETH',
    type: 'crypto',
    unit: 'ETH',
    coinGeckoId: 'ethereum',
    color: '#627EEA',
    emoji: '⬠',
  },
  {
    id: 'bnb',
    name: 'BNB',
    shortName: 'BNB',
    type: 'crypto',
    unit: 'BNB',
    coinGeckoId: 'binancecoin',
    color: '#F0B90B',
    emoji: '🔶',
  },
  {
    id: 'xrp',
    name: 'Ripple',
    shortName: 'XRP',
    type: 'crypto',
    unit: 'XRP',
    coinGeckoId: 'ripple',
    color: '#00AAE4',
    emoji: '💧',
  },
  {
    id: 'sol',
    name: 'Solana',
    shortName: 'SOL',
    type: 'crypto',
    unit: 'SOL',
    coinGeckoId: 'solana',
    color: '#9945FF',
    emoji: '◎',
  },
  {
    id: 'usdt',
    name: 'Tether',
    shortName: 'USDT',
    type: 'crypto',
    unit: 'USDT',
    coinGeckoId: 'tether',
    color: '#26A17B',
    emoji: '💵',
  },
  {
    id: 'paxg',
    name: 'PAX Gold',
    shortName: 'PAXG',
    type: 'crypto',
    unit: 'PAXG',
    coinGeckoId: 'pax-gold',
    color: '#F0C040',
    emoji: '🟡',
  },
  {
    id: 'xaut',
    name: 'Tether Gold (OKX)',
    shortName: 'XAUT',
    type: 'crypto',
    unit: 'XAUT',
    coinGeckoId: 'tether-gold',
    color: '#F0C040',
    emoji: '🟡',
  },
  {
    id: 'usd',
    name: 'Dolar',
    shortName: 'USD',
    type: 'forex',
    unit: 'USD',
    coinGeckoId: null,
    color: '#22C55E',
    emoji: '🇺🇸',
  },
  {
    id: 'eur',
    name: 'Euro',
    shortName: 'EUR',
    type: 'forex',
    unit: 'EUR',
    coinGeckoId: null,
    color: '#10B981',
    emoji: '🇪🇺',
  },
  {
    id: 'gbp',
    name: 'Sterlin',
    shortName: 'GBP',
    type: 'forex',
    unit: 'GBP',
    coinGeckoId: null,
    color: '#0F766E',
    emoji: '🇬🇧',
  },
  {
    id: 'custom',
    name: 'Diğer',
    shortName: 'Özel',
    type: 'other',
    unit: 'adet',
    coinGeckoId: null,
    color: '#8B5CF6',
    emoji: '📦',
  },
];

export const TROY_OZ_TO_GRAM = 31.1034768;

export const getAssetById = (id) => {
  return PREDEFINED_ASSETS.find((a) => a.id === id) || null;
};

export const getLocalizedAssetName = (assetId, language = 'tr') => {
  const names = {
    usd: { tr: 'Dolar', en: 'Dollar' },
    eur: { tr: 'Euro', en: 'Euro' },
    gbp: { tr: 'Sterlin', en: 'Pound Sterling' },
    'gold-gram': { tr: 'Gram Altın', en: 'Gram Gold' },
    'silver-gram': { tr: 'Gram Gümüş', en: 'Gram Silver' },
    'gold-oz': { tr: 'Ons Altın', en: 'Gold Ounce' },
    'silver-oz': { tr: 'Ons Gümüş', en: 'Silver Ounce' },
    btc: { tr: 'Bitcoin', en: 'Bitcoin' },
    bnb: { tr: 'BNB', en: 'BNB' },
    xrp: { tr: 'Ripple', en: 'Ripple' },
    eth: { tr: 'Ethereum', en: 'Ethereum' },
    sol: { tr: 'Solana', en: 'Solana' },
    usdt: { tr: 'Tether', en: 'Tether' },
    paxg: { tr: 'PAX Gold', en: 'PAX Gold' },
    xaut: { tr: 'Tether Gold (OKX)', en: 'Tether Gold (OKX)' },
    custom: { tr: 'Diğer', en: 'Other' },
  };

  return names[assetId]?.[language] || names[assetId]?.tr || getAssetById(assetId)?.name || assetId;
};

export const getAssetColor = (assetId) => {
  const asset = getAssetById(assetId);
  return asset ? asset.color : '#22C55E';
};

export const getAssetEmoji = (assetId) => {
  const asset = getAssetById(assetId);
  return asset ? asset.emoji : '📊';
};

export const ASSET_TYPES = [
  { key: 'all', label: 'Tümü' },
  { key: 'crypto', label: 'Kripto' },
  { key: 'gold', label: 'Altın' },
  { key: 'silver', label: 'Gümüş' },
  { key: 'forex', label: 'Döviz' },
  { key: 'other', label: 'Diğer' },
];
