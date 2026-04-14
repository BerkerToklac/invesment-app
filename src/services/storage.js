import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_USER: '@portfoy_auth_user',
  PORTFOLIO: '@portfoy_holdings',
  SETTINGS: '@portfoy_settings',
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
    await AsyncStorage.multiRemove([KEYS.AUTH_USER, KEYS.PORTFOLIO, KEYS.SETTINGS]);
  },

  // Portfolio Holdings
  async getHoldings() {
    const data = await AsyncStorage.getItem(KEYS.PORTFOLIO);
    return data ? JSON.parse(data) : [];
  },

  async saveHoldings(holdings) {
    await AsyncStorage.setItem(KEYS.PORTFOLIO, JSON.stringify(holdings));
  },

  async addHolding(holding) {
    const holdings = await this.getHoldings();
    const newHolding = {
      ...holding,
      id: `holding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    holdings.push(newHolding);
    await this.saveHoldings(holdings);
    return newHolding;
  },

  async updateHolding(id, updates) {
    const holdings = await this.getHoldings();
    const index = holdings.findIndex((h) => h.id === id);
    if (index !== -1) {
      holdings[index] = { ...holdings[index], ...updates, updatedAt: new Date().toISOString() };
      await this.saveHoldings(holdings);
    }
    return holdings;
  },

  async deleteHolding(id) {
    const holdings = await this.getHoldings();
    const filtered = holdings.filter((h) => h.id !== id);
    await this.saveHoldings(filtered);
    return filtered;
  },

  // Settings
  async getSettings() {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    const defaults = { displayCurrency: 'USD', localCurrency: 'TRY', showTRY: true, notifications: true };
    return data ? { ...defaults, ...JSON.parse(data), displayCurrency: 'USD' } : defaults;
  },

  async saveSettings(settings) {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },
};
