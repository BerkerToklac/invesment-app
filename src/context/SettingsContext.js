import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { StorageService } from '../services/storage';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  displayCurrency: 'USD',
  localCurrency: 'TRY',
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
    if (!['TRY', 'EUR'].includes(currency)) return settings;
    return updateSettings({ localCurrency: currency });
  }, [settings, updateSettings]);

  const value = useMemo(() => ({
    settings,
    loading,
    displayCurrency: 'USD',
    localCurrency: settings.localCurrency || 'TRY',
    notifications: settings.notifications ?? true,
    updateSettings,
    setLocalCurrency,
    reloadSettings: loadSettings,
  }), [loadSettings, loading, settings, setLocalCurrency, updateSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
