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
import { useAuth } from '../context/AuthContext';
import { formatUSD, formatTRY, formatPercent } from '../utils/formatters';

const TROY_OZ = 31.1034768;

function RateCard({ label, subLabel, value, subValue, change, icon, iconColor, iconBg }) {
  const isPositive = change >= 0;
  return (
    <View style={styles.rateCard}>
      <View style={[styles.rateIcon, { backgroundColor: iconBg || '#F0F2FF' }]}>
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

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { prices, loading, refreshing, refresh, lastUpdated } = useMarket();
  const { computeStats, getGroupedHoldings } = usePortfolio();
  const { user } = useAuth();

  const getAssetPrice = (id) => {
    if (!prices) return null;
    const map = {
      'gold-gram': prices.metals?.goldGramUSD,
      'silver-gram': prices.metals?.silverGramUSD,
      btc: prices.crypto?.bitcoin?.usd,
      eth: prices.crypto?.ethereum?.usd,
      bnb: prices.crypto?.binancecoin?.usd,
      xrp: prices.crypto?.ripple?.usd,
      sol: prices.crypto?.solana?.usd,
      usdt: prices.crypto?.tether?.usd,
      paxg: prices.crypto?.['pax-gold']?.usd,
      xaut: prices.crypto?.['tether-gold']?.usd,
      usd: 1,
      eur: prices.forex?.eurUsd,
    };
    return map[id] ?? null;
  };

  const portfolioStats = useMemo(() => {
    if (!prices) return null;
    return computeStats(getAssetPrice);
  }, [prices, computeStats]);

  const usdTry = prices?.forex?.usdTry || 38.5;
  const eurTry = prices?.forex?.eurTry || 41.8;
  const eurUsd = prices?.forex?.eurUsd || 1.086;
  const goldGramUSD = prices?.metals?.goldGramUSD || 106;
  const silverGramUSD = prices?.metals?.silverGramUSD || 1.04;
  const goldGramTRY = goldGramUSD * usdTry;
  const silverGramTRY = silverGramUSD * usdTry;
  const goldOzUSD = goldGramUSD * TROY_OZ;

  const btcChange = prices?.crypto?.bitcoin?.change24h || 0;
  const bnbChange = prices?.crypto?.binancecoin?.change24h || 0;
  const xrpChange = prices?.crypto?.ripple?.change24h || 0;

  const userInitial = user?.email?.[0]?.toUpperCase() || 'U';
  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const totalUSD = portfolioStats?.totalCurrentUSD || 0;
  const totalTRY = totalUSD * usdTry;
  const plUSD = portfolioStats?.totalPLUSD || 0;
  const plPct = portfolioStats?.totalPLPercent || 0;

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <View>
              <Text style={styles.headerGreeting}>Portföyüm</Text>
              <Text style={styles.headerEmail} numberOfLines={1}>{user?.email}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={refresh}>
              <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Portfolio Summary Card */}
        <View style={styles.portfolioCard}>
          <Text style={styles.portfolioLabel}>Toplam Portföy Değeri</Text>
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 8 }} />
          ) : (
            <>
              <Text style={styles.portfolioValueUSD}>{formatUSD(totalUSD)}</Text>
              <Text style={styles.portfolioValueTRY}>{formatTRY(totalTRY)}</Text>
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
                <Text style={styles.plLabel}>Toplam Kar/Zarar</Text>
              </View>
            </>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {[
              { icon: 'add-circle', label: 'Ekle', onPress: () => navigation.navigate('AddInvestment') },
              { icon: 'swap-horizontal', label: 'Dönüştür', onPress: () => {} },
              { icon: 'pie-chart', label: 'Portföy', onPress: () => navigation.navigate('Portföy') },
              { icon: 'refresh-circle', label: 'Güncelle', onPress: refresh },
            ].map((action) => (
              <TouchableOpacity key={action.label} style={styles.actionBtn} onPress={action.onPress}>
                <View style={styles.actionIconWrap}>
                  <Ionicons name={action.icon} size={22} color={Colors.primary} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Last updated */}
        <View style={styles.lastUpdatedRow}>
          <Ionicons name="time-outline" size={13} color={Colors.textLight} />
          <Text style={styles.lastUpdatedText}>Son güncelleme: {lastUpdatedStr}</Text>
        </View>

        {/* Exchange Rates Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Döviz Kurları</Text>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Canlı</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Kurlar güncelleniyor...</Text>
          </View>
        ) : (
          <>
            <RateCard
              label="Dolar"
              subLabel="USD / TRY"
              value={`₺${usdTry.toFixed(4)}`}
              subValue="1 USD"
              icon="cash-outline"
              iconColor="#22C55E"
              iconBg="#DCFCE7"
            />
            <RateCard
              label="Euro"
              subLabel="EUR / TRY"
              value={`₺${eurTry.toFixed(4)}`}
              subValue={`$${eurUsd.toFixed(4)}`}
              icon="logo-euro"
              iconColor="#3B82F6"
              iconBg="#DBEAFE"
            />

            {/* Metals Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Metaller</Text>
            </View>

            <RateCard
              label="Altın (Gram)"
              subLabel="Fiziki 995"
              value={formatUSD(goldGramUSD, 2)}
              subValue={formatTRY(goldGramTRY, 2)}
              icon="diamond-outline"
              iconColor={Colors.gold}
              iconBg={Colors.warningLight}
            />
            <RateCard
              label="Gümüş (Gram)"
              subLabel="Spot"
              value={formatUSD(silverGramUSD, 4)}
              subValue={formatTRY(silverGramTRY, 2)}
              icon="sparkles-outline"
              iconColor={Colors.silver}
              iconBg={Colors.borderLight}
            />
            <RateCard
              label="Altın (Ons)"
              subLabel="Troy oz / USD"
              value={formatUSD(goldOzUSD, 2)}
              icon="medal-outline"
              iconColor={Colors.gold}
              iconBg={Colors.warningLight}
            />

            {/* Crypto Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Kripto</Text>
            </View>

            {prices?.crypto?.bitcoin && (
              <RateCard
                label="Bitcoin"
                subLabel="BTC / USD"
                value={formatUSD(prices.crypto.bitcoin.usd)}
                change={btcChange}
                icon="logo-bitcoin"
                iconColor="#F7931A"
                iconBg="#FEF3C7"
              />
            )}
            {prices?.crypto?.binancecoin && (
              <RateCard
                label="BNB"
                subLabel="BNB / USD"
                value={formatUSD(prices.crypto.binancecoin.usd)}
                change={bnbChange}
                icon="cube-outline"
                iconColor="#F0B90B"
                iconBg="#FEF3C7"
              />
            )}
            {prices?.crypto?.ripple && (
              <RateCard
                label="XRP"
                subLabel="XRP / USD"
                value={`$${prices.crypto.ripple.usd.toFixed(4)}`}
                change={xrpChange}
                icon="water-outline"
                iconColor="#00AAE4"
                iconBg="#DBEAFE"
              />
            )}
            {prices?.crypto?.['pax-gold'] && (
              <RateCard
                label="PAX Gold"
                subLabel="PAXG / USD"
                value={formatUSD(prices.crypto['pax-gold'].usd)}
                change={prices.crypto['pax-gold'].change24h}
                icon="star-outline"
                iconColor={Colors.gold}
                iconBg={Colors.warningLight}
              />
            )}
            {prices?.crypto?.['tether-gold'] && (
              <RateCard
                label="Tether Gold"
                subLabel="XAUT / USD"
                value={formatUSD(prices.crypto['tether-gold'].usd)}
                change={prices.crypto['tether-gold'].change24h}
                icon="star-outline"
                iconColor={Colors.gold}
                iconBg={Colors.warningLight}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  headerGradient: { paddingHorizontal: 20, paddingBottom: 0 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  headerGreeting: { color: '#fff', fontSize: 16, fontWeight: '700' },
  headerEmail: { color: 'rgba(255,255,255,0.65)', fontSize: 12, maxWidth: 180 },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  portfolioCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  portfolioLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    marginBottom: 16,
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

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },

  scroll: { flex: 1, paddingTop: 32, paddingHorizontal: 16 },

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
