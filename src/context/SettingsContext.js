import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { StorageService } from '../services/storage';
import { translate } from '../utils/i18n';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  displayCurrency: 'USD',
  localCurrency: 'TRY',
  baseCurrency: 'USD',
  language: 'tr',
  notifications: true,
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const settingsRef = useRef(DEFAULT_SETTINGS);

  const loadSettings = useCallback(async () => {
    try {
      const stored = await StorageService.getSettings();
      const nextSettings = { ...DEFAULT_SETTINGS, ...(stored || {}) };
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
      displayCurrency: 'USD',
    };
    settingsRef.current = nextSettings;
    setSettings(nextSettings);
    await StorageService.saveSettings(nextSettings);
    return nextSettings;
  }, []);

  const setLocalCurrency = useCallback(async (currency) => {
    if (!['TRY', 'EUR', 'GBP', 'USD'].includes(currency)) return settings;
    return updateSettings({ localCurrency: currency });
  }, [settings, updateSettings]);

  const setBaseCurrency = useCallback(async (currency) => {
    if (!['TRY', 'EUR', 'GBP', 'USD'].includes(currency)) return settings;
    return updateSettings({ baseCurrency: currency });
  }, [settings, updateSettings]);

  const setCurrencyPreferences = useCallback(async ({ baseCurrency, localCurrency }) => {
    const updates = {};

    if (baseCurrency && ['TRY', 'EUR', 'GBP', 'USD'].includes(baseCurrency)) {
      updates.baseCurrency = baseCurrency;
    }

    if (localCurrency && ['TRY', 'EUR', 'GBP', 'USD'].includes(localCurrency)) {
      updates.localCurrency = localCurrency;
    }

    if (!Object.keys(updates).length) return settingsRef.current;
    return updateSettings(updates);
  }, [updateSettings]);

  const setLanguage = useCallback(async (language) => {
    if (!['tr', 'en'].includes(language)) return settings;
    return updateSettings({ language });
  }, [settings, updateSettings]);

  const value = useMemo(() => ({
    settings,
    loading,
    displayCurrency: 'USD',
    localCurrency: settings.localCurrency || 'TRY',
    baseCurrency: settings.baseCurrency || 'USD',
    language: settings.language || 'tr',
    notifications: settings.notifications ?? true,
    updateSettings,
    setLocalCurrency,
    setBaseCurrency,
    setCurrencyPreferences,
    setLanguage,
    reloadSettings: loadSettings,
    t: (key) => translate(settings.language || 'tr', key),
  }), [loadSettings, loading, settings, setBaseCurrency, setCurrencyPreferences, setLanguage, setLocalCurrency, updateSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
