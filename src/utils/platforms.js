export const DEFAULT_INVESTMENT_PLATFORM = 'Kişisel Kasam';

const DEFAULT_INVESTMENT_PLATFORM_LABELS = {
  tr: 'Kişisel Kasam',
  en: 'Personal Safe',
};

export function getPlatformDisplayName(platform, language = 'tr') {
  const normalizedPlatform = typeof platform === 'string' && platform.trim()
    ? platform.trim()
    : DEFAULT_INVESTMENT_PLATFORM;

  if (normalizedPlatform === DEFAULT_INVESTMENT_PLATFORM) {
    return DEFAULT_INVESTMENT_PLATFORM_LABELS[language] || DEFAULT_INVESTMENT_PLATFORM_LABELS.tr;
  }

  return normalizedPlatform;
}
