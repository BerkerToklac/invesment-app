import { formatEUR, formatTRY, formatUSD } from './formatters';

export const LOCAL_CURRENCY_OPTIONS = ['TRY', 'EUR', 'USD'];

export function getUsdTry(prices) {
  return prices?.forex?.usdTry || 38.5;
}

export function getEurUsd(prices) {
  return prices?.forex?.eurUsd || 1.086;
}

export function convertUSDToCurrency(value, currency, prices) {
  const amount = Number(value) || 0;
  if (currency === 'TRY') return amount * getUsdTry(prices);
  if (currency === 'EUR') return amount / getEurUsd(prices);
  return amount;
}

export function convertCurrencyToUSD(value, currency, prices) {
  const amount = Number(value) || 0;
  if (currency === 'TRY') return amount / getUsdTry(prices);
  if (currency === 'EUR') return amount * getEurUsd(prices);
  return amount;
}

export function formatCurrency(value, currency, decimals = 2) {
  if (currency === 'TRY') return formatTRY(value, decimals);
  if (currency === 'EUR') return formatEUR(value, decimals);
  return formatUSD(value, decimals);
}

export function getCurrencySymbol(currency) {
  if (currency === 'TRY') return '₺';
  if (currency === 'EUR') return '€';
  return '$';
}

export function getLocalCurrencyOptions(localCurrency) {
  return Array.from(new Set([localCurrency, 'USD']));
}
