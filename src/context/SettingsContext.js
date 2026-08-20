import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from './AuthContext';
import { apiClient } from '../services/apiClient';
import { StorageService } from '../services/storage';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { translate } from '../utils/i18n';
import { detectDeviceLanguage, normalizeLanguage, SUPPORTED_LANGUAGES } from '../utils/language';
import { DEFAULT_INVESTMENT_PLATFORM } from '../utils/platforms';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  localCurrency: 'TRY',
  baseCurrency: 'USD',
  language: detectDeviceLanguage(),
  notifications: true,
  homeFavoriteIds: [],
  investmentPlatforms: [DEFAULT_INVESTMENT_PLATFORM],
};

function sanitizeSettings(settings) {
  return {
    localCurrency: settings.localCurrency,
    baseCurrency: settings.baseCurrency,
    language: normalizeLanguage(settings.language),
    notifications: settings.notifications,
    homeFavoriteIds: Array.isArray(settings.homeFavoriteIds) ? settings.homeFavoriteIds : [],
    investmentPlatforms: settings.investmentPlatforms,
  };
}

function normalizePreferenceList(value) {
  return Array.isArray(value)
    ? value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
    : [];
}

export const SettingsProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const settingsRef = useRef(DEFAULT_SETTINGS);

  const applyPreferences = useCallback((currentSettings, preferences) => {
    if (!preferences) return currentSettings;

    const nextSettings = {
      ...currentSettings,
      baseCurrency: preferences.baseCurrency || currentSettings.baseCurrency,
      localCurrency: preferences.localCurrency || currentSettings.localCurrency,
      homeFavoriteIds: normalizePreferenceList(preferences.homeFavoriteIds),
      investmentPlatforms: normalizePreferenceList(preferences.investmentPlatforms),
    };

    if (!nextSettings.investmentPlatforms.includes(DEFAULT_INVESTMENT_PLATFORM)) {
      nextSettings.investmentPlatforms = [DEFAULT_INVESTMENT_PLATFORM, ...nextSettings.investmentPlatforms];
    }

    return sanitizeSettings(nextSettings);
  }, []);

  const loadSettings = useCallback(async () => {
    if (authLoading) {
      return;
    }

    try {
      const stored = await StorageService.getSettings();
      let nextSettings = sanitizeSettings({ ...DEFAULT_SETTINGS, ...(stored || {}) });
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
      if (!user && !nextSettings.homeFavoriteIds.length) {
        nextSettings.homeFavoriteIds = normalizePreferenceList(await StorageService.getHomeFavorites());
      }

      if (user) {
        const data = await apiClient.get('/investment/preferences');
        nextSettings = applyPreferences(nextSettings, data?.preferences);
        await StorageService.saveHomeFavorites([]);

        const remoteExtraPlatforms = (nextSettings.investmentPlatforms || [])
          .filter((platform) => platform !== DEFAULT_INVESTMENT_PLATFORM);
        const localExtraPlatforms = normalizePreferenceList(stored?.investmentPlatforms)
          .filter((platform) => platform !== DEFAULT_INVESTMENT_PLATFORM);
        if (!remoteExtraPlatforms.length && localExtraPlatforms.length) {
          let platformData = null;
          for (const platformName of localExtraPlatforms) {
            platformData = await apiClient.post('/investment/preferences/investment-platforms', { platformName });
          }
          nextSettings = applyPreferences(nextSettings, platformData?.preferences);
        }
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
  }, [applyPreferences, authLoading, user]);

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
    await StorageService.saveSettings(user ? {
      ...sanitizedSettings,
      homeFavoriteIds: [],
      investmentPlatforms: [DEFAULT_INVESTMENT_PLATFORM],
    } : sanitizedSettings);
    return sanitizedSettings;
  }, [user]);

  const setCurrencyPreferences = useCallback(async ({ baseCurrency, localCurrency, resetPortfolio = false }) => {
    const updates = {};

    if (baseCurrency && SUPPORTED_CURRENCIES.includes(baseCurrency)) {
      updates.baseCurrency = baseCurrency;
    }

    if (localCurrency && SUPPORTED_CURRENCIES.includes(localCurrency)) {
      updates.localCurrency = localCurrency;
    }

    if (!Object.keys(updates).length) return settingsRef.current;
    if (user) {
      const data = await apiClient.put('/investment/preferences/currency', { ...updates, resetPortfolio });
      const nextSettings = applyPreferences({ ...settingsRef.current, ...updates }, data?.preferences);
      settingsRef.current = nextSettings;
      setSettings(nextSettings);
      await StorageService.saveSettings({ ...nextSettings, homeFavoriteIds: [], investmentPlatforms: [DEFAULT_INVESTMENT_PLATFORM] });
      return nextSettings;
    }
    return updateSettings(updates);
  }, [applyPreferences, updateSettings, user]);

  const applyCurrencyPreferencesLocally = useCallback(async ({ baseCurrency, localCurrency }) => {
    return updateSettings({ baseCurrency, localCurrency });
  }, [updateSettings]);

  const setLanguage = useCallback(async (language) => {
    if (!SUPPORTED_LANGUAGES.includes(language)) return settings;
    return updateSettings({ language });
  }, [settings, updateSettings]);

  const addInvestmentPlatform = useCallback(async (platformName) => {
    const cleaned = typeof platformName === 'string' ? platformName.trim() : '';
    if (!cleaned) return settingsRef.current.investmentPlatforms || DEFAULT_SETTINGS.investmentPlatforms;

    const current = settingsRef.current.investmentPlatforms || DEFAULT_SETTINGS.investmentPlatforms;
    const exists = current.some((item) => item.toLocaleLowerCase('tr-TR') === cleaned.toLocaleLowerCase('tr-TR'));
    const nextPlatforms = exists ? current : [...current, cleaned];

    if (!exists) {
      if (user) {
        const data = await apiClient.post('/investment/preferences/investment-platforms', { platformName: cleaned });
        const nextSettings = applyPreferences(settingsRef.current, data?.preferences);
        settingsRef.current = nextSettings;
        setSettings(nextSettings);
        return nextSettings.investmentPlatforms;
      }

      await updateSettings({ investmentPlatforms: nextPlatforms });
    }

    return nextPlatforms;
  }, [applyPreferences, updateSettings, user]);

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

    if (user) {
      const data = await apiClient.delete(`/investment/preferences/investment-platforms/${encodeURIComponent(cleaned)}`);
      const nextSettings = applyPreferences(settingsRef.current, data?.preferences);
      settingsRef.current = nextSettings;
      setSettings(nextSettings);
      return nextSettings.investmentPlatforms;
    }

    await updateSettings({ investmentPlatforms: normalizedPlatforms });
    return normalizedPlatforms;
  }, [applyPreferences, updateSettings, user]);

  const setHomeFavoriteIds = useCallback(async (favoriteIds) => {
    const nextFavorites = normalizePreferenceList(favoriteIds);
    if (user) {
      const data = await apiClient.put('/investment/preferences/home-favorites', { favoriteIds: nextFavorites });
      const nextSettings = applyPreferences(settingsRef.current, data?.preferences);
      settingsRef.current = nextSettings;
      setSettings(nextSettings);
      return nextSettings.homeFavoriteIds;
    }

    await updateSettings({ homeFavoriteIds: nextFavorites });
    await StorageService.saveHomeFavorites(nextFavorites);
    return nextFavorites;
  }, [applyPreferences, updateSettings, user]);

  const addHomeFavorite = useCallback(async (favoriteId) => {
    const cleaned = typeof favoriteId === 'string' ? favoriteId.trim() : '';
    if (!cleaned) return settingsRef.current.homeFavoriteIds || [];

    if (user) {
      const data = await apiClient.post('/investment/preferences/home-favorites', { favoriteId: cleaned });
      const nextSettings = applyPreferences(settingsRef.current, data?.preferences);
      settingsRef.current = nextSettings;
      setSettings(nextSettings);
      return nextSettings.homeFavoriteIds;
    }

    const current = settingsRef.current.homeFavoriteIds || [];
    const nextFavorites = current.includes(cleaned) ? current : [...current, cleaned];
    await setHomeFavoriteIds(nextFavorites);
    return nextFavorites;
  }, [applyPreferences, setHomeFavoriteIds, user]);

  const removeHomeFavorite = useCallback(async (favoriteId) => {
    const cleaned = typeof favoriteId === 'string' ? favoriteId.trim() : '';
    if (!cleaned) return settingsRef.current.homeFavoriteIds || [];

    if (user) {
      const data = await apiClient.delete(`/investment/preferences/home-favorites/${encodeURIComponent(cleaned)}`);
      const nextSettings = applyPreferences(settingsRef.current, data?.preferences);
      settingsRef.current = nextSettings;
      setSettings(nextSettings);
      return nextSettings.homeFavoriteIds;
    }

    const nextFavorites = (settingsRef.current.homeFavoriteIds || []).filter((item) => item !== cleaned);
    await setHomeFavoriteIds(nextFavorites);
    return nextFavorites;
  }, [applyPreferences, setHomeFavoriteIds, user]);

  const value = useMemo(() => ({
    settings,
    loading,
    localCurrency: settings.localCurrency || 'TRY',
    baseCurrency: settings.baseCurrency || 'USD',
    language: normalizeLanguage(settings.language),
    notifications: settings.notifications ?? true,
    homeFavoriteIds: settings.homeFavoriteIds || [],
    investmentPlatforms: settings.investmentPlatforms || DEFAULT_SETTINGS.investmentPlatforms,
    updateSettings,
    setCurrencyPreferences,
    applyCurrencyPreferencesLocally,
    setLanguage,
    setHomeFavoriteIds,
    addHomeFavorite,
    removeHomeFavorite,
    addInvestmentPlatform,
    removeInvestmentPlatform,
    defaultInvestmentPlatform: DEFAULT_INVESTMENT_PLATFORM,
    reloadSettings: loadSettings,
    t: (key) => translate(normalizeLanguage(settings.language), key),
  }), [addHomeFavorite, addInvestmentPlatform, applyCurrencyPreferencesLocally, loadSettings, loading, removeHomeFavorite, removeInvestmentPlatform, setHomeFavoriteIds, settings, setCurrencyPreferences, setLanguage, updateSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
