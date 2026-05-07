import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_INVESTMENT_PLATFORM } from '../utils/platforms';

const KEYS = {
  AUTH_USER: '@portfoy_auth_user',
  SETTINGS: '@portfoy_settings',
  HOME_FAVORITES: '@moneybook_home_favorites',
};

export const StorageService = {
  // Auth
  async saveUser(userData) {
    const data =
      typeof userData === 'string'
        ? { email: userData, loggedAt: new Date().toISOString() }
        : userData;
    await AsyncStorage.setItem(KEYS.AUTH_USER, JSON.stringify(data));
  },

  async updateUser(updates) {
    const current = await this.getUser();
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(KEYS.AUTH_USER, JSON.stringify(updated));
    return updated;
  },

  async getUser() {
    const data = await AsyncStorage.getItem(KEYS.AUTH_USER);
    return data ? JSON.parse(data) : null;
  },

  async removeUser() {
    await AsyncStorage.removeItem(KEYS.AUTH_USER);
  },

  async deleteAllData() {
    await AsyncStorage.multiRemove([KEYS.AUTH_USER, KEYS.SETTINGS, KEYS.HOME_FAVORITES]);
  },

  // Settings
  async getSettings() {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    const defaults = {
      localCurrency: 'TRY',
      baseCurrency: 'USD',
      language: 'tr',
      notifications: true,
      investmentPlatforms: [DEFAULT_INVESTMENT_PLATFORM],
    };
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
  },

  async saveSettings(settings) {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  async getHomeFavorites() {
    const data = await AsyncStorage.getItem(KEYS.HOME_FAVORITES);
    return data ? JSON.parse(data) : [];
  },

  async saveHomeFavorites(favorites) {
    await AsyncStorage.setItem(KEYS.HOME_FAVORITES, JSON.stringify(favorites));
  },
};
