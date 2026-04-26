import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from './AuthContext';

const PortfolioContext = createContext(null);

export const PortfolioProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setHoldings([]);
      setLoading(false);
      return;
    }

    loadHoldings();
  }, [user, authLoading]);

  const loadHoldings = async () => {
    if (!user) {
      setHoldings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiClient.get('/investment/portfolio');
      // Normalize _id → id so the rest of the app keeps using h.id
      setHoldings((data.holdings || []).map((h) => ({ ...h, id: h._id, baseCurrency: h.baseCurrency || 'USD' })));
    } catch (e) {
      console.error('Load holdings error:', e);
    } finally {
      setLoading(false);
    }
  };

  const addHolding = async (holdingData) => {
    if (!user) throw new Error('Not authenticated');
    const data = await apiClient.post('/investment/portfolio', holdingData);
    const newHolding = { ...data.holding, id: data.holding._id };
    setHoldings((prev) => [...prev, newHolding]);
    return newHolding;
  };

  const updateHolding = async (id, updates) => {
    if (!user) throw new Error('Not authenticated');
    const data = await apiClient.put(`/investment/portfolio/${id}`, updates);
    const updated = { ...data.holding, id: data.holding._id };
    setHoldings((prev) => prev.map((h) => (h.id === id ? updated : h)));
  };

  const deleteHolding = async (id) => {
    if (!user) throw new Error('Not authenticated');
    await apiClient.delete(`/investment/portfolio/${id}`);
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  const deleteUsdHoldings = async () => {
    if (!user) throw new Error('Not authenticated');
    await apiClient.delete('/investment/portfolio/usd/all');
    setHoldings((prev) => prev.filter((h) => h.assetId !== 'usd'));
  };

  const deleteBaseCurrencyHoldings = async (currency) => {
    if (!user) throw new Error('Not authenticated');
    const upperCurrency = typeof currency === 'string' ? currency.trim().toUpperCase() : '';
    await apiClient.delete(`/investment/portfolio/base/${upperCurrency}`);
    setHoldings((prev) => prev.filter((h) => (h.baseCurrency || 'USD') !== upperCurrency));
  };

  const deleteBaseAssetHoldings = async (currency) => {
    if (!user) throw new Error('Not authenticated');
    const assetId = typeof currency === 'string' ? currency.trim().toLowerCase() : '';
    await apiClient.delete(`/investment/portfolio/base-asset/${assetId.toUpperCase()}`);
    setHoldings((prev) => prev.filter((h) => (h.assetId || '').toLowerCase() !== assetId));
  };

  const clearPortfolio = async () => {
    if (!user) throw new Error('Not authenticated');
    await apiClient.delete('/investment/portfolio/all');
    setHoldings([]);
  };

  const computeStats = useCallback(
    (getAssetPrice) => {
      let totalCostUSD = 0;
      let totalCurrentUSD = 0;

      const enriched = holdings.map((h) => {
        const currentPrice = h.assetId === 'custom' ? h.buyPriceUSD : (getAssetPrice(h.assetId) ?? h.buyPriceUSD);
        const costUSD = h.amount * h.buyPriceUSD;
        const currentUSD = h.amount * currentPrice;
        const plUSD = currentUSD - costUSD;
        const plPercent = costUSD > 0 ? (plUSD / costUSD) * 100 : 0;

        totalCostUSD += costUSD;
        totalCurrentUSD += currentUSD;

        return {
          ...h,
          currentPrice,
          costUSD,
          currentUSD,
          plUSD,
          plPercent,
        };
      });

      const totalPLUSD = totalCurrentUSD - totalCostUSD;
      const totalPLPercent = totalCostUSD > 0 ? (totalPLUSD / totalCostUSD) * 100 : 0;

      return {
        enrichedHoldings: enriched,
        totalCostUSD,
        totalCurrentUSD,
        totalPLUSD,
        totalPLPercent,
      };
    },
    [holdings]
  );

  const getGroupedHoldings = useCallback(
    (getAssetPrice) => {
      const map = {};
      holdings.forEach((h) => {
        const currentPrice = h.assetId === 'custom' ? h.buyPriceUSD : (getAssetPrice(h.assetId) ?? h.buyPriceUSD);
        const costUSD = h.amount * h.buyPriceUSD;
        const currentUSD = h.amount * currentPrice;
        if (!map[h.assetId]) {
          map[h.assetId] = {
            assetId: h.assetId,
            assetName: h.assetName,
            totalAmount: 0,
            totalCostUSD: 0,
            totalCurrentUSD: 0,
            avgBuyPrice: 0,
            currentPrice,
            color: h.color || '#22C55E',
            emoji: h.emoji || '📊',
            type: h.type || 'other',
          };
        }
        map[h.assetId].totalAmount += h.amount;
        map[h.assetId].totalCostUSD += costUSD;
        map[h.assetId].totalCurrentUSD += currentUSD;
        map[h.assetId].currentPrice = currentPrice;
      });

      return Object.values(map).map((g) => ({
        ...g,
        avgBuyPrice: g.totalAmount > 0 ? g.totalCostUSD / g.totalAmount : 0,
        plUSD: g.totalCurrentUSD - g.totalCostUSD,
        plPercent: g.totalCostUSD > 0 ? ((g.totalCurrentUSD - g.totalCostUSD) / g.totalCostUSD) * 100 : 0,
      }));
    },
    [holdings]
  );

  return (
    <PortfolioContext.Provider
      value={{
        holdings,
        loading,
        addHolding,
        updateHolding,
        deleteHolding,
        deleteUsdHoldings,
        deleteBaseCurrencyHoldings,
        deleteBaseAssetHoldings,
        clearPortfolio,
        computeStats,
        getGroupedHoldings,
        reload: loadHoldings,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider');
  return ctx;
};
