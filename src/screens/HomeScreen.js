import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../theme/colors';
import { useMarket } from '../context/MarketContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useSettings } from '../context/SettingsContext';
import { formatUSD, formatPercent } from '../utils/formatters';
import { convertUSDToCurrency, formatCurrency, getEurUsd, getGbpUsd } from '../utils/currency';

function RateCard({ label, subLabel, value, subValue, change, icon, iconColor, iconBg }) {
  const isPositive = change >= 0;

  return (
    <View style={styles.rateCard}>
      <View style={[styles.rateIcon, { backgroundColor: iconBg || Colors.accentLight }]}>
        <Ionicons name={icon} size={20} color={iconColor || Colors.primary} />
      </View>
      <View style={styles.rateInfo}>
        <Text style={styles.rateLabel}>{label}</Text>
        {subLabel ? <Text style={styles.rateSubLabel}>{subLabel}</Text> : null}
      </View>
      <View style={styles.rateValues}>
        <Text style={styles.rateValue}>{value}</Text>
        {subValue ? <Text style={styles.rateSubValue}>{subValue}</Text> : null}
        {change !== undefined && change !== null ? (
          <View style={[styles.changeBadge, { backgroundColor: isPositive ? Colors.successLight : Colors.dangerLight }]}>
            <Ionicons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={11}
              color={isPositive ? Colors.success : Colors.danger}
            />
            <Text style={[styles.changeText, { color: isPositive ? Colors.success : Colors.danger }]}>
              {formatPercent(change, 2)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function formatDisplayValue(value, formatter, decimals = 2) {
  if (value === null || value === undefined) return '-';
  return formatter(value, decimals);
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { prices, loading, refreshing, refresh, lastUpdated } = useMarket();
  const { computeStats } = usePortfolio();
  const { localCurrency, t } = useSettings();

  const getAssetPrice = (id) => {
    if (!prices) return null;
    const map = {
      'gold-gram': prices.metals?.goldGramUSD,
      'silver-gram': prices.metals?.silverGramUSD,
      'gold-oz': prices.metals?.goldOzUSD,
      'silver-oz': prices.metals?.silverOzUSD,
      btc: prices.crypto?.btc?.usd,
      eth: prices.crypto?.eth?.usd,
      bnb: prices.crypto?.bnb?.usd,
      xrp: prices.crypto?.xrp?.usd,
      usd: 1,
      eur: prices.forex?.eurUsd,
      gbp: prices.forex?.gbpUsd,
    };
    return map[id] ?? null;
  };

  const portfolioStats = useMemo(() => {
    if (!prices) return null;
    return computeStats(getAssetPrice);
  }, [prices, computeStats]);

  const eurUsd = getEurUsd(prices);
  const gbpUsd = getGbpUsd(prices);
  const goldGramUSD = prices?.metals?.goldGramUSD;
  const silverGramUSD = prices?.metals?.silverGramUSD;
  const goldOzUSD = prices?.metals?.goldOzUSD;
  const silverOzUSD = prices?.metals?.silverOzUSD;

  const btcChange = prices?.crypto?.btc?.change24h;
  const ethChange = prices?.crypto?.eth?.change24h;
  const bnbChange = prices?.crypto?.bnb?.change24h;
  const xrpChange = prices?.crypto?.xrp?.change24h;

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const totalUSD = portfolioStats?.totalCurrentUSD || 0;
  const totalLocal = convertUSDToCurrency(totalUSD, localCurrency, prices);
  const plUSD = portfolioStats?.totalPLUSD || 0;
  const plPct = portfolioStats?.totalPLPercent || 0;

  const localSub = (usdValue, decimals = 2) =>
    usdValue == null ? '-' : formatCurrency(convertUSDToCurrency(usdValue, localCurrency, prices), localCurrency, decimals);

  const formatForexCard = (assetCode, usdPrice) => {
    const upperCode = assetCode.toUpperCase();

    if (usdPrice == null) {
      return { value: '--', subValue: null, subLabel: `${upperCode} / ${localCurrency}` };
    }

    if (localCurrency === upperCode) {
      return {
        value: formatUSD(usdPrice, 4),
        subValue: `1 ${upperCode}`,
        subLabel: `${upperCode} / USD`,
      };
    }

    return {
      value: formatCurrency(convertUSDToCurrency(usdPrice, localCurrency, prices), localCurrency, 4),
      subValue: formatUSD(usdPrice, 4),
      subLabel: `${upperCode} / ${localCurrency}`,
    };
  };

  const dollarRate = {
    value: formatCurrency(convertUSDToCurrency(1, localCurrency, prices), localCurrency, 4),
    subValue: '1 USD',
    subLabel: `USD / ${localCurrency}`,
  };
  const euroRate = formatForexCard('eur', eurUsd);
  const poundRate = formatForexCard('gbp', gbpUsd);

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
          style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.portfolioCard}>
            <View style={styles.portfolioCardTop}>
              <Text style={styles.portfolioLabel}>{t('total_portfolio_value')}</Text>
              <TouchableOpacity style={styles.refreshCardBtn} onPress={refresh}>
                <Ionicons name="refresh" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            {loading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginVertical: 8 }} />
            ) : (
              <>
                <Text style={styles.portfolioValueUSD}>{formatUSD(totalUSD)}</Text>
                <Text style={styles.portfolioValueTRY}>{formatCurrency(totalLocal, localCurrency)}</Text>
                <View style={styles.portfolioPLRow}>
                  <View
                    style={[
                      styles.plBadge,
                      { backgroundColor: plUSD >= 0 ? Colors.successLight : Colors.dangerLight },
                    ]}
                  >
                    <Ionicons
                      name={plUSD >= 0 ? 'trending-up' : 'trending-down'}
                      size={13}
                      color={plUSD >= 0 ? Colors.success : Colors.danger}
                    />
                    <Text style={[styles.plText, { color: plUSD >= 0 ? Colors.success : Colors.danger }]}>
                      {plUSD >= 0 ? '+' : ''}{formatUSD(plUSD)} ({formatPercent(plPct)})
                    </Text>
                  </View>
                  <Text style={styles.plLabel}>{t('total_profit_loss')}</Text>
                </View>
              </>
            )}
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.lastUpdatedRow}>
          <Ionicons name="time-outline" size={13} color={Colors.textLight} />
          <Text style={styles.lastUpdatedText}>{t('last_updated')}: {lastUpdatedStr}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('exchange_rates')}</Text>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{t('live')}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>{t('rates_updating')}</Text>
          </View>
        ) : (
          <>
            <RateCard
              label={t('dollar')}
              subLabel={dollarRate.subLabel}
              value={dollarRate.value}
              subValue={dollarRate.subValue}
              icon="cash-outline"
              iconColor="#16A34A"
              iconBg="#DCFCE7"
            />
            <RateCard
              label={t('euro')}
              subLabel={euroRate.subLabel}
              value={euroRate.value}
              subValue={euroRate.subValue}
              icon="logo-euro"
              iconColor={Colors.primary}
              iconBg={Colors.accentLight}
            />
            <RateCard
              label={t('pound')}
              subLabel={poundRate.subLabel}
              value={poundRate.value}
              subValue={poundRate.subValue}
              icon="cash-outline"
              iconColor="#0F766E"
              iconBg="#CCFBF1"
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('metals')}</Text>
            </View>

            <RateCard
              label={t('gram_gold')}
              subLabel="995/1000"
              value={formatDisplayValue(goldGramUSD, formatUSD, 2)}
              subValue={localSub(goldGramUSD, 2)}
              icon="medal-outline"
              iconColor={Colors.gold}
              iconBg={Colors.warningLight}
            />
            <RateCard
              label={t('gram_silver')}
              subLabel="995/1000"
              value={formatDisplayValue(silverGramUSD, formatUSD, 4)}
              subValue={localSub(silverGramUSD, 2)}
              icon="medal-outline"
              iconColor={Colors.silver}
              iconBg={Colors.borderLight}
            />
            <RateCard
              label={t('ounce_gold')}
              subLabel="Troy oz / USD"
              value={formatDisplayValue(goldOzUSD, formatUSD, 2)}
              subValue={localSub(goldOzUSD, 2)}
              icon="medal-outline"
              iconColor={Colors.gold}
              iconBg={Colors.warningLight}
            />
            <RateCard
              label={t('ounce_silver')}
              subLabel="Troy oz / USD"
              value={formatDisplayValue(silverOzUSD, formatUSD, 2)}
              subValue={localSub(silverOzUSD, 2)}
              icon="medal-outline"
              iconColor={Colors.silver}
              iconBg={Colors.borderLight}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('crypto')}</Text>
            </View>

            <RateCard
              label={t('bitcoin')}
              subLabel="BTC / USD"
              value={formatDisplayValue(prices?.crypto?.btc?.usd, formatUSD)}
              subValue={localSub(prices?.crypto?.btc?.usd, 2)}
              change={btcChange}
              icon="logo-bitcoin"
              iconColor="#F7931A"
              iconBg="#FEF3C7"
            />
            <RateCard
              label="Ethereum"
              subLabel="ETH / USD"
              value={formatDisplayValue(prices?.crypto?.eth?.usd, formatUSD)}
              subValue={localSub(prices?.crypto?.eth?.usd, 2)}
              change={ethChange}
              icon="logo-bitcoin"
              iconColor="#627EEA"
              iconBg="#E0E7FF"
            />
            <RateCard
              label="BNB"
              subLabel="BNB / USD"
              value={formatDisplayValue(prices?.crypto?.bnb?.usd, formatUSD)}
              subValue={localSub(prices?.crypto?.bnb?.usd, 2)}
              change={bnbChange}
              icon="cube-outline"
              iconColor="#F0B90B"
              iconBg="#FEF3C7"
            />
            <RateCard
              label={t('ripple')}
              subLabel="XRP / USD"
              value={formatDisplayValue(prices?.crypto?.xrp?.usd, formatUSD, 4)}
              subValue={localSub(prices?.crypto?.xrp?.usd, 4)}
              change={xrpChange}
              icon="water-outline"
              iconColor="#00AAE4"
              iconBg={Colors.accentLight}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  headerWrap: { marginBottom: 8 },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },

  portfolioCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  portfolioCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  portfolioLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refreshCardBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioValueUSD: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  portfolioValueTRY: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  portfolioPLRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  plBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  plText: { fontSize: 13, fontWeight: '700' },
  plLabel: { fontSize: 12, color: Colors.textLight },

  scroll: { flex: 1, paddingHorizontal: 16 },

  lastUpdatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
    marginTop: 4,
  },
  lastUpdatedText: { fontSize: 12, color: Colors.textLight },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.success,
  },
  liveText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
  },

  rateCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rateIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rateInfo: { flex: 1 },
  rateLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  rateSubLabel: { fontSize: 12, color: Colors.textLight, marginTop: 1 },
  rateValues: { alignItems: 'flex-end', gap: 2 },
  rateValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  rateSubValue: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  changeText: { fontSize: 11, fontWeight: '700' },

  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
});
