import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { PortfolioProvider } from './src/context/PortfolioContext';
import { MarketProvider } from './src/context/MarketContext';
import { SettingsProvider } from './src/context/SettingsContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <PortfolioProvider>
          <MarketProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </MarketProvider>
        </PortfolioProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
