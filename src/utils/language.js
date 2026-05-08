import { NativeModules, Platform } from 'react-native';

export const SUPPORTED_LANGUAGES = ['tr', 'en'];
export const FALLBACK_LANGUAGE = 'en';

export function normalizeLanguage(value) {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';

  if (normalized === 'tr' || normalized.startsWith('tr-') || normalized.startsWith('tr_')) {
    return 'tr';
  }

  if (normalized === 'en' || normalized.startsWith('en-') || normalized.startsWith('en_')) {
    return 'en';
  }

  return FALLBACK_LANGUAGE;
}

function matchSupportedLanguage(value) {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';

  if (normalized.startsWith('tr')) {
    return 'tr';
  }

  if (normalized.startsWith('en')) {
    return 'en';
  }

  return null;
}

function getNativeLocaleCandidates() {
  const candidates = [];

  if (Platform.OS === 'ios') {
    const settings = NativeModules.SettingsManager?.settings || {};
    candidates.push(settings.AppleLocale, settings.AppleLanguages?.[0]);
  }

  candidates.push(NativeModules.I18nManager?.localeIdentifier);

  return candidates.filter(Boolean);
}

export function detectDeviceLanguage() {
  try {
    const localeCandidates = [
      ...getNativeLocaleCandidates(),
      Intl.DateTimeFormat().resolvedOptions().locale,
      Intl.NumberFormat().resolvedOptions().locale,
    ].filter(Boolean);

    for (const locale of localeCandidates) {
      const language = matchSupportedLanguage(String(locale));
      if (language) {
        return language;
      }
    }
  } catch (_error) {
    return FALLBACK_LANGUAGE;
  }

  return FALLBACK_LANGUAGE;
}
