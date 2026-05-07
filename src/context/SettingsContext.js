import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { StorageService } from '../services/storage';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { translate } from '../utils/i18n';
import { DEFAULT_INVESTMENT_PLATFORM } from '../utils/platforms';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  localCurrency: 'TRY',
  baseCurrency: 'USD',
  language: 'tr',
  notifications: true,
  investmentPlatforms: [DEFAULT_INVESTMENT_PLATFORM],
};

function sanitizeSettings(settings) {
  return {
    localCurrency: settings.localCurrency,
    baseCurrency: settings.baseCurrency,
    language: settings.language,
    notifications: settings.notifications,
    investmentPlatforms: settings.investmentPlatforms,
  };
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const settingsRef = useRef(DEFAULT_SETTINGS);

  const loadSettings = useCallback(async () => {
    try {
      const stored = await StorageService.getSettings();
      const nextSettings = sanitizeSettings({ ...DEFAULT_SETTINGS, ...(stored || {}) });
      if (!SUPPORTED_CURRENCIES.includes(nextSettings.localCurrency)) {
        nextSettings.localCurrency = DEFAULT_SETTINGS.localCurrency;
      }
      if (!SUPPORTED_CURRENCIES.includes(nextSettings.baseCurrency)) {
        nextSettings.baseCurrency = DEFAULT_SETTINGS.baseCurrency;
      }
      if (!Array.isArray(nextSettings.investmentPlatforms)) {
        nextSettings.investmentPlatforms = DEFAULT_SETTINGS.investmentPlatforms;
      }
      if (!nextSettings.investmentPlatforms.includes(DEFAULT_INVESTMENT_PLATFORM)) {
        nextSettings.investmentPlatforms = [DEFAULT_INVESTMENT_PLATFORM, ...nextSettings.investmentPlatforms];
      }
      settingsRef.current = nextSettings;
      setSettings(nextSettings);
    } catch (error) {
      console.error('Load settings error:', error);
      settingsRef.current = DEFAULT_SETTINGS;
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(async (updates) => {
    const nextSettings = {
      ...DEFAULT_SETTINGS,
      ...settingsRef.current,
      ...updates,
    };
    const sanitizedSettings = sanitizeSettings(nextSettings);
    settingsRef.current = sanitizedSettings;
    setSettings(sanitizedSettings);
    await StorageService.saveSettings(sanitizedSettings);
    return sanitizedSettings;
  }, []);

  const setCurrencyPreferences = useCallback(async ({ baseCurrency, localCurrency }) => {
    const updates = {};

    if (baseCurrency && SUPPORTED_CURRENCIES.includes(baseCurrency)) {
      updates.baseCurrency = baseCurrency;
    }

    if (localCurrency && SUPPORTED_CURRENCIES.includes(localCurrency)) {
      updates.localCurrency = localCurrency;
    }

    if (!Object.keys(updates).length) return settingsRef.current;
    return updateSettings(updates);
  }, [updateSettings]);

  const setLanguage = useCallback(async (language) => {
    if (!['tr', 'en'].includes(language)) return settings;
    return updateSettings({ language });
  }, [settings, updateSettings]);

  const addInvestmentPlatform = useCallback(async (platformName) => {
    const cleaned = typeof platformName === 'string' ? platformName.trim() : '';
    if (!cleaned) return settingsRef.current.investmentPlatforms || DEFAULT_SETTINGS.investmentPlatforms;

    const current = settingsRef.current.investmentPlatforms || DEFAULT_SETTINGS.investmentPlatforms;
    const exists = current.some((item) => item.toLocaleLowerCase('tr-TR') === cleaned.toLocaleLowerCase('tr-TR'));
    const nextPlatforms = exists ? current : [...current, cleaned];

    if (!exists) {
      await updateSettings({ investmentPlatforms: nextPlatforms });
    }

    return nextPlatforms;
  }, [updateSettings]);

  const removeInvestmentPlatform = useCallback(async (platformName) => {
    const cleaned = typeof platformName === 'string' ? platformName.trim() : '';
    if (!cleaned || cleaned === DEFAULT_INVESTMENT_PLATFORM) {
      return settingsRef.current.investmentPlatforms || DEFAULT_SETTINGS.investmentPlatforms;
    }

    const current = settingsRef.current.investmentPlatforms || DEFAULT_SETTINGS.investmentPlatforms;
    const nextPlatforms = current.filter((item) => item !== cleaned);
    const normalizedPlatforms = nextPlatforms.includes(DEFAULT_INVESTMENT_PLATFORM)
      ? nextPlatforms
      : [DEFAULT_INVESTMENT_PLATFORM, ...nextPlatforms];

    await updateSettings({ investmentPlatforms: normalizedPlatforms });
    return normalizedPlatforms;
  }, [updateSettings]);

  const value = useMemo(() => ({
    settings,
    loading,
    localCurrency: settings.localCurrency || 'TRY',
    baseCurrency: settings.baseCurrency || 'USD',
    language: settings.language || 'tr',
    notifications: settings.notifications ?? true,
    investmentPlatforms: settings.investmentPlatforms || DEFAULT_SETTINGS.investmentPlatforms,
    updateSettings,
    setCurrencyPreferences,
    setLanguage,
    addInvestmentPlatform,
    removeInvestmentPlatform,
    defaultInvestmentPlatform: DEFAULT_INVESTMENT_PLATFORM,
    reloadSettings: loadSettings,
    t: (key) => translate(settings.language || 'tr', key),
  }), [addInvestmentPlatform, loadSettings, loading, removeInvestmentPlatform, settings, setCurrencyPreferences, setLanguage, updateSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
