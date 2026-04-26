import { formatEUR, formatGBP, formatTRY, formatUSD } from './formatters';

export const LOCAL_CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'TRY'];

export function getUsdTry(prices) {
  return prices?.forex?.usdTry ?? null;
}

export function getEurUsd(prices) {
  return prices?.forex?.eurUsd ?? null;
}

export function getGbpUsd(prices) {
  return prices?.forex?.gbpUsd ?? null;
}

export function getUsdToCurrencyRate(currency, prices) {
  if (currency === 'TRY') return prices?.forex?.usdTry ?? null;
  if (currency === 'EUR') return prices?.forex?.usdEur ?? null;
  if (currency === 'GBP') return prices?.forex?.usdGbp ?? null;
  return 1;
}

export function convertUSDToCurrency(value, currency, prices) {
  const amount = Number(value) || 0;
  const rate = getUsdToCurrencyRate(currency, prices);
  return rate != null ? amount * rate : null;
}

export function convertCurrencyToUSD(value, currency, prices) {
  const amount = Number(value) || 0;
  const rate = getUsdToCurrencyRate(currency, prices);
  return rate != null ? amount / rate : null;
}

export function formatCurrency(value, currency, decimals = 2) {
  if (currency === 'TRY') return formatTRY(value, decimals);
  if (currency === 'EUR') return formatEUR(value, decimals);
  if (currency === 'GBP') return formatGBP(value, decimals);
  return formatUSD(value, decimals);
}

export function getCurrencySymbol(currency) {
  if (currency === 'TRY') return '₺';
  if (currency === 'EUR') return '€';
  if (currency === 'GBP') return '£';
  return '$';
}

export function getLocalPerUsd(currency, prices) {
  return getUsdToCurrencyRate(currency, prices);
}

export function getLocalCurrencyOptions(localCurrency, baseCurrency = 'USD') {
  return Array.from(new Set([localCurrency, baseCurrency]));
}
