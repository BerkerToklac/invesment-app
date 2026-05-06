import { formatTRY, formatUSD } from './formatters';

export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'JPY',
  'GBP',
  'CNY',
  'CHF',
  'AUD',
  'CAD',
  'HKD',
  'SGD',
  'INR',
  'KRW',
  'SEK',
  'MXN',
  'NZD',
  'NOK',
  'TWD',
  'BRL',
  'ZAR',
  'PLN',
  'TRY',
  'DKK',
  'CZK',
  'HUF',
  'RON',
  'BGN',
  'ISK',
  'UAH',
  'RSD',
  'ALL',
  'BAM',
  'MKD',
  'MDL',
  'GEL',
  'AMD',
  'AZN',
  'RUB',
  'BYN',
];

export const LOCAL_CURRENCY_OPTIONS = SUPPORTED_CURRENCIES;

export const CURRENCY_META = {
  USD: { symbol: '$', locale: 'en-US', name: 'US Dollar', localName: 'Dolar' },
  EUR: { symbol: '€', locale: 'de-DE', name: 'Euro', localName: 'Euro' },
  JPY: { symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen', localName: 'Japon Yeni' },
  GBP: { symbol: '£', locale: 'en-GB', name: 'Pound Sterling', localName: 'Sterlin' },
  CNY: { symbol: '¥', locale: 'zh-CN', name: 'Chinese Yuan', localName: 'Çin Yuanı' },
  AUD: { symbol: 'A$', locale: 'en-AU', name: 'Australian Dollar', localName: 'Avustralya Doları' },
  CAD: { symbol: 'C$', locale: 'en-CA', name: 'Canadian Dollar', localName: 'Kanada Doları' },
  CHF: { symbol: 'CHF', locale: 'de-CH', name: 'Swiss Franc', localName: 'İsviçre Frangı' },
  HKD: { symbol: 'HK$', locale: 'zh-HK', name: 'Hong Kong Dollar', localName: 'Hong Kong Doları' },
  SGD: { symbol: 'S$', locale: 'en-SG', name: 'Singapore Dollar', localName: 'Singapur Doları' },
  INR: { symbol: '₹', locale: 'en-IN', name: 'Indian Rupee', localName: 'Hindistan Rupisi' },
  KRW: { symbol: '₩', locale: 'ko-KR', name: 'South Korean Won', localName: 'Güney Kore Wonu' },
  SEK: { symbol: 'kr', locale: 'sv-SE', name: 'Swedish Krona', localName: 'İsveç Kronu' },
  MXN: { symbol: 'MX$', locale: 'es-MX', name: 'Mexican Peso', localName: 'Meksika Pesosu' },
  NZD: { symbol: 'NZ$', locale: 'en-NZ', name: 'New Zealand Dollar', localName: 'Yeni Zelanda Doları' },
  NOK: { symbol: 'kr', locale: 'nb-NO', name: 'Norwegian Krone', localName: 'Norveç Kronu' },
  TWD: { symbol: 'NT$', locale: 'zh-TW', name: 'New Taiwan Dollar', localName: 'Yeni Tayvan Doları' },
  BRL: { symbol: 'R$', locale: 'pt-BR', name: 'Brazilian Real', localName: 'Brezilya Reali' },
  ZAR: { symbol: 'R', locale: 'en-ZA', name: 'South African Rand', localName: 'Güney Afrika Randı' },
  PLN: { symbol: 'zł', locale: 'pl-PL', name: 'Polish Zloty', localName: 'Polonya Zlotisi' },
  TRY: { symbol: '₺', locale: 'tr-TR', name: 'Turkish Lira', localName: 'Türk Lirası' },
  DKK: { symbol: 'kr', locale: 'da-DK', name: 'Danish Krone', localName: 'Danimarka Kronu' },
  CZK: { symbol: 'Kč', locale: 'cs-CZ', name: 'Czech Koruna', localName: 'Çek Korunası' },
  HUF: { symbol: 'Ft', locale: 'hu-HU', name: 'Hungarian Forint', localName: 'Macar Forinti' },
  RON: { symbol: 'lei', locale: 'ro-RO', name: 'Romanian Leu', localName: 'Rumen Leyi' },
  BGN: { symbol: 'лв', locale: 'bg-BG', name: 'Bulgarian Lev', localName: 'Bulgar Levası' },
  ISK: { symbol: 'kr', locale: 'is-IS', name: 'Icelandic Krona', localName: 'İzlanda Kronu' },
  UAH: { symbol: '₴', locale: 'uk-UA', name: 'Ukrainian Hryvnia', localName: 'Ukrayna Grivnası' },
  RSD: { symbol: 'дин', locale: 'sr-RS', name: 'Serbian Dinar', localName: 'Sırp Dinarı' },
  ALL: { symbol: 'L', locale: 'sq-AL', name: 'Albanian Lek', localName: 'Arnavutluk Leki' },
  BAM: { symbol: 'KM', locale: 'bs-BA', name: 'Bosnia-Herzegovina Convertible Mark', localName: 'Bosna-Hersek Markı' },
  MKD: { symbol: 'ден', locale: 'mk-MK', name: 'Macedonian Denar', localName: 'Makedon Dinarı' },
  MDL: { symbol: 'L', locale: 'ro-MD', name: 'Moldovan Leu', localName: 'Moldova Leyi' },
  GEL: { symbol: '₾', locale: 'ka-GE', name: 'Georgian Lari', localName: 'Gürcistan Larisi' },
  AMD: { symbol: '֏', locale: 'hy-AM', name: 'Armenian Dram', localName: 'Ermeni Dramı' },
  AZN: { symbol: '₼', locale: 'az-AZ', name: 'Azerbaijani Manat', localName: 'Azerbaycan Manatı' },
  RUB: { symbol: '₽', locale: 'ru-RU', name: 'Russian Ruble', localName: 'Rus Rublesi' },
  BYN: { symbol: 'Br', locale: 'be-BY', name: 'Belarusian Ruble', localName: 'Belarus Rublesi' },
};

export function getUsdTry(prices) {
  return prices?.forex?.usdTry ?? null;
}

export function getEurUsd(prices) {
  return convertCurrencyToUSD(1, 'EUR', prices);
}

export function getGbpUsd(prices) {
  return convertCurrencyToUSD(1, 'GBP', prices);
}

export function getUsdToCurrencyRate(currency, prices) {
  const upperCurrency = typeof currency === 'string' ? currency.toUpperCase() : 'USD';
  if (upperCurrency === 'USD') return 1;
  return prices?.forex?.rates?.[upperCurrency] ?? prices?.forex?.[`usd${upperCurrency}`] ?? null;
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
  if (currency === 'USD') return formatUSD(value, decimals);

  const upperCurrency = typeof currency === 'string' ? currency.toUpperCase() : 'USD';
  const meta = CURRENCY_META[upperCurrency] || CURRENCY_META.USD;
  if (value === null || value === undefined || isNaN(value)) return `${meta.symbol}0.00`;

  const safeDecimals = Math.min(Math.max(Number(decimals) || 2, 0), 2);
  return `${meta.symbol}${Number(value).toLocaleString(meta.locale, {
    minimumFractionDigits: safeDecimals,
    maximumFractionDigits: safeDecimals,
  })}`;
}

export function getCurrencySymbol(currency) {
  const upperCurrency = typeof currency === 'string' ? currency.toUpperCase() : 'USD';
  return CURRENCY_META[upperCurrency]?.symbol || '$';
}

export function getLocalPerUsd(currency, prices) {
  return getUsdToCurrencyRate(currency, prices);
}

export function getLocalCurrencyOptions(localCurrency, baseCurrency = 'USD') {
  return Array.from(new Set([localCurrency, baseCurrency]));
}
