import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storage';

const PortfolioContext = createContext(null);

export const PortfolioProvider = ({ children }) => {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHoldings();
  }, []);

  const loadHoldings = async () => {
    try {
      const data = await StorageService.getHoldings();
      setHoldings(data);
    } catch (e) {
      console.error('Load holdings error:', e);
    } finally {
      setLoading(false);
    }
  };

  const addHolding = async (holdingData) => {
    const newHolding = await StorageService.addHolding(holdingData);
    setHoldings((prev) => [...prev, newHolding]);
    return newHolding;
  };

  const updateHolding = async (id, updates) => {
    const updated = await StorageService.updateHolding(id, updates);
    setHoldings(updated);
  };

  const deleteHolding = async (id) => {
    const filtered = await StorageService.deleteHolding(id);
    setHoldings(filtered);
  };

  // Compute portfolio stats given current prices
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

  // Group holdings by assetId for chart
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
