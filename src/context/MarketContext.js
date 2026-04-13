import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MarketAPI } from '../services/marketAPI';

const MarketContext = createContext(null);

export const MarketProvider = ({ children }) => {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchPrices = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      const data = await MarketAPI.fetchAllPrices(forceRefresh);
      setPrices(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError('Fiyatlar alınamadı');
      console.error('Market fetch error:', e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchPrices();
      setLoading(false);
    };
    init();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchPrices(true), 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchPrices(true);
    setRefreshing(false);
  };

  const getAssetPrice = (assetId) => {
    return MarketAPI.getAssetCurrentPrice(assetId, prices);
  };

  const getAssetChange = (assetId) => {
    return MarketAPI.getAsset24hChange(assetId, prices);
  };

  return (
    <MarketContext.Provider
      value={{
        prices,
        loading,
        refreshing,
        error,
        lastUpdated,
        refresh,
        getAssetPrice,
        getAssetChange,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used within MarketProvider');
  return ctx;
};
