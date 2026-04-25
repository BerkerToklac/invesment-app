import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { StorageService } from '../services/storage';
import { translate } from '../utils/i18n';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  displayCurrency: 'USD',
  localCurrency: 'TRY',
  language: 'tr',
  notifications: true,
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const stored = await StorageService.getSettings();
      setSettings({ ...DEFAULT_SETTINGS, ...(stored || {}) });
    } catch (error) {
      console.error('Load settings error:', error);
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
      ...settings,
      ...updates,
      displayCurrency: 'USD',
    };
    setSettings(nextSettings);
    await StorageService.saveSettings(nextSettings);
    return nextSettings;
  }, [settings]);

  const setLocalCurrency = useCallback(async (currency) => {
    if (!['TRY', 'EUR', 'GBP', 'USD'].includes(currency)) return settings;
    return updateSettings({ localCurrency: currency });
  }, [settings, updateSettings]);

  const setLanguage = useCallback(async (language) => {
    if (!['tr', 'en'].includes(language)) return settings;
    return updateSettings({ language });
  }, [settings, updateSettings]);

  const value = useMemo(() => ({
    settings,
    loading,
    displayCurrency: 'USD',
    localCurrency: settings.localCurrency || 'TRY',
    language: settings.language || 'tr',
    notifications: settings.notifications ?? true,
    updateSettings,
    setLocalCurrency,
    setLanguage,
    reloadSettings: loadSettings,
    t: (key) => translate(settings.language || 'tr', key),
  }), [loadSettings, loading, settings, setLanguage, setLocalCurrency, updateSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
