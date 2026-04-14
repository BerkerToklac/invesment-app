import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { Colors } from '../theme/colors';
import { useMarket } from '../context/MarketContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useSettings } from '../context/SettingsContext';
import { formatUSD, formatPercent, formatCrypto, formatDate } from '../utils/formatters';
import { convertUSDToCurrency, formatCurrency } from '../utils/currency';

function DonutChart({ data, total, size = 180 }) {
  const radius = size / 2 - 20;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;

  if (!data || data.length === 0 || total === 0) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={radius} stroke={Colors.border} strokeWidth={strokeWidth} fill="none" />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: Colors.textLight }}>Boş</Text>
        </View>
      </View>
    );
  }

  let offset = 0;
  const segments = data.map((item) => {
    const pct = item.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const seg = { ...item, dash, gap, offset };
    offset += dash;
    return seg;
  });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {segments.map((seg, i) => (
          <Circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            stroke={seg.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="round"
          />
        ))}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={styles.donutCenter}>{formatUSD(total)}</Text>
        <Text style={styles.donutLabel}>Toplam</Text>
      </View>
    </View>
  );
}

function StatCard({ label, value, valueColor, sub, icon, iconColor, iconBg }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg || Colors.accentLight }]}>
        <Ionicons name={icon} size={16} color={iconColor || Colors.primary} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor && { color: valueColor }]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function HoldingRow({ holding, onDelete }) {
  const pl = holding.plUSD || 0;
  const plPct = holding.plPercent || 0;
  const isUp = pl >= 0;

  return (
    <TouchableOpacity
      style={styles.holdingRow}
      onLongPress={() => {
        Alert.alert('Pozisyon Sil', `"${holding.assetName}" pozisyonunu silmek istiyor musunuz?`, [
          { text: 'İptal', style: 'cancel' },
          { text: 'Sil', style: 'destructive', onPress: () => onDelete(holding.id) },
        ]);
      }}
      activeOpacity={0.75}
    >
      <View style={[styles.holdingEmoji, { backgroundColor: holding.color + '20' }]}>
        <Text style={{ fontSize: 20 }}>{holding.emoji}</Text>
      </View>

      <View style={styles.holdingInfo}>
        <View style={styles.holdingTopRow}>
          <Text style={styles.holdingName}>{holding.assetName}</Text>
          <Text style={styles.holdingCurrentVal}>{formatUSD(holding.currentUSD)}</Text>
        </View>
        <View style={styles.holdingBottomRow}>
          <Text style={styles.holdingAmount}>
            {formatCrypto(holding.amount)} × {formatUSD(holding.currentPrice, holding.currentPrice < 1 ? 4 : 2)}
          </Text>
          <View style={[styles.holdingPL, { backgroundColor: isUp ? Colors.successLight : Colors.dangerLight }]}>
            <Ionicons
              name={isUp ? 'arrow-up' : 'arrow-down'}
              size={10}
              color={isUp ? Colors.success : Colors.danger}
            />
            <Text style={[styles.holdingPLText, { color: isUp ? Colors.success : Colors.danger }]}>
              {isUp ? '+' : ''}{formatUSD(pl)} ({formatPercent(plPct)})
            </Text>
          </View>
        </View>
        <Text style={styles.holdingMeta}>
          Alış: {formatUSD(holding.buyPriceUSD)} · Maliyet: {formatUSD(holding.costUSD)} · {formatDate(holding.date)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PortfolioScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { prices, refreshing, refresh } = useMarket();
  const { holdings, computeStats, getGroupedHoldings, deleteHolding } = usePortfolio();
  const { localCurrency } = useSettings();
  const [showByAsset, setShowByAsset] = useState(true);

  const getAssetPrice = (id) => {
    if (!prices) return null;
    const map = {
      'gold-gram': prices.metals?.goldGramUSD,
      'silver-gram': prices.metals?.silverGramUSD,
      'gold-oz': prices.metals?.goldOzUSD,
      'silver-oz': prices.metals?.silverOzUSD,
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

  const stats = useMemo(() => computeStats(getAssetPrice), [prices, computeStats]);
  const grouped = useMemo(() => getGroupedHoldings(getAssetPrice), [prices, getGroupedHoldings]);
  const { enrichedHoldings = [], totalCostUSD = 0, totalCurrentUSD = 0, totalPLUSD = 0, totalPLPercent = 0 } = stats || {};

  const totalCurrentLocal = convertUSDToCurrency(totalCurrentUSD, localCurrency, prices);
  const donutData = grouped.map((g) => ({
    label: g.assetName,
    value: g.totalCurrentUSD,
    color: g.color,
  }));
  const isPositive = totalPLUSD >= 0;

  if (holdings.length === 0) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
          style={[styles.emptyHeader, { paddingTop: insets.top + 16 }]}
        >
          <Text style={styles.pageTitle}>Portföyüm</Text>
        </LinearGradient>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="briefcase-outline" size={48} color={Colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>Portföyün Boş</Text>
          <Text style={styles.emptySubtitle}>
            İlk yatırımını ekleyerek portföyünü oluşturmaya başla.
          </Text>
          <TouchableOpacity style={styles.addFirstBtn} onPress={() => navigation.navigate('AddInvestment')}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addFirstBtnText}>İlk Yatırımı Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
          style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardTop}>
              <Text style={styles.summaryLabel}>Toplam Portföy Değeri</Text>
              <TouchableOpacity style={styles.refreshCardBtn} onPress={refresh}>
                <Ionicons name="refresh" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.summaryValueUSD}>{formatUSD(totalCurrentUSD)}</Text>
            <Text style={styles.summaryValueTRY}>{formatCurrency(totalCurrentLocal, localCurrency)}</Text>
            <View style={styles.summaryPLRow}>
              <View style={[styles.plBadge, { backgroundColor: isPositive ? Colors.successLight : Colors.dangerLight }]}>
                <Ionicons
                  name={isPositive ? 'trending-up' : 'trending-down'}
                  size={13}
                  color={isPositive ? Colors.success : Colors.danger}
                />
                <Text style={[styles.plBadgeText, { color: isPositive ? Colors.success : Colors.danger }]}>
                  {isPositive ? '+' : ''}{formatUSD(totalPLUSD)} ({formatPercent(totalPLPercent)})
                </Text>
              </View>
              <Text style={styles.plLabel}>Toplam Kar/Zarar</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <StatCard
            label="Maliyet"
            value={formatUSD(totalCostUSD)}
            icon="receipt-outline"
            iconColor={Colors.primary}
            iconBg={Colors.accentLight}
          />
          <StatCard
            label="Kar / Zarar"
            value={(isPositive ? '+' : '') + formatUSD(totalPLUSD)}
            valueColor={isPositive ? Colors.success : Colors.danger}
            sub={formatPercent(totalPLPercent)}
            icon={isPositive ? 'trending-up-outline' : 'trending-down-outline'}
            iconColor={isPositive ? Colors.success : Colors.danger}
            iconBg={isPositive ? Colors.successLight : Colors.dangerLight}
          />
          <StatCard
            label={`${localCurrency} Değeri`}
            value={formatCurrency(totalCurrentLocal, localCurrency)}
            icon="cash-outline"
            iconColor={Colors.warning}
            iconBg={Colors.warningLight}
          />
          <StatCard
            label="Varlık Sayısı"
            value={`${grouped.length} varlık`}
            sub={`${holdings.length} pozisyon`}
            icon="layers-outline"
            iconColor={Colors.accent}
            iconBg={Colors.accentLight}
          />
        </ScrollView>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Dağılım</Text>
          <View style={styles.chartContent}>
            <DonutChart data={donutData} total={totalCurrentUSD} size={190} />
            <View style={styles.legend}>
              {grouped.map((g) => {
                const pct = totalCurrentUSD > 0 ? (g.totalCurrentUSD / totalCurrentUSD) * 100 : 0;
                return (
                  <View key={g.assetId} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: g.color }]} />
                    <View style={styles.legendInfo}>
                      <Text style={styles.legendName} numberOfLines={1}>{g.assetName}</Text>
                      <Text style={styles.legendPct}>{pct.toFixed(1)}%</Text>
                    </View>
                    <Text style={styles.legendVal}>{formatUSD(g.totalCurrentUSD)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, showByAsset && styles.toggleBtnActive]}
            onPress={() => setShowByAsset(true)}
          >
            <Text style={[styles.toggleText, showByAsset && styles.toggleTextActive]}>Varlıklara Göre</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !showByAsset && styles.toggleBtnActive]}
            onPress={() => setShowByAsset(false)}
          >
            <Text style={[styles.toggleText, !showByAsset && styles.toggleTextActive]}>Tüm İşlemler</Text>
          </TouchableOpacity>
        </View>

        {showByAsset ? (
          <>
            {grouped.map((g) => {
              const groupUp = g.plUSD >= 0;
              return (
                <View key={g.assetId} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupEmoji, { backgroundColor: g.color + '20' }]}>
                      <Text style={{ fontSize: 22 }}>{g.emoji}</Text>
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{g.assetName}</Text>
                      <Text style={styles.groupAmount}>
                        {formatCrypto(g.totalAmount)} · Ort. {formatUSD(g.avgBuyPrice, g.avgBuyPrice < 1 ? 4 : 2)}
                      </Text>
                    </View>
                    <View style={styles.groupRight}>
                      <Text style={styles.groupValue}>{formatUSD(g.totalCurrentUSD)}</Text>
                      <View style={[styles.groupPL, { backgroundColor: groupUp ? Colors.successLight : Colors.dangerLight }]}>
                        <Text style={[styles.groupPLText, { color: groupUp ? Colors.success : Colors.danger }]}>
                          {groupUp ? '+' : ''}{formatUSD(g.plUSD)} ({formatPercent(g.plPercent)})
                        </Text>
                      </View>
                    </View>
                  </View>
                  {enrichedHoldings.filter((h) => h.assetId === g.assetId).map((h) => (
                    <View key={h.id} style={styles.subRow}>
                      <Text style={styles.subDate}>{formatDate(h.date)}</Text>
                      <Text style={styles.subAmount}>{formatCrypto(h.amount)} adet</Text>
                      <Text style={styles.subBuyPrice}>Alış: {formatUSD(h.buyPriceUSD)}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.subCurrent}>{formatUSD(h.currentUSD)}</Text>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert('Sil', 'Bu pozisyonu silmek istiyor musunuz?', [
                              { text: 'İptal', style: 'cancel' },
                              { text: 'Sil', style: 'destructive', onPress: () => deleteHolding(h.id) },
                            ])
                          }
                        >
                          <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </>
        ) : (
          <>
            {enrichedHoldings
              .slice()
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((h) => (
                <HoldingRow key={h.id} holding={h} onDelete={deleteHolding} />
              ))}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => navigation.navigate('AddInvestment')}
        activeOpacity={0.85}
      >
        <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.fabGradient}>
          <Ionicons name="add" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  emptyHeader: { paddingHorizontal: 20, paddingBottom: 20 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  emptySubtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  addFirstBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addFirstBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  headerWrap: { marginBottom: 8 },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  summaryCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
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
  summaryValueUSD: { fontSize: 34, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1 },
  summaryValueTRY: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginTop: 2, marginBottom: 8 },
  summaryPLRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  plBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  plBadgeText: { fontSize: 13, fontWeight: '700' },
  plLabel: { fontSize: 12, color: Colors.textLight },

  scroll: { flex: 1 },

  statsScroll: { paddingLeft: 16, paddingTop: 16, paddingBottom: 4 },
  statCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 14,
    marginRight: 10,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: { fontSize: 11, color: Colors.textLight, fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  statSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  chartCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  chartContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  donutCenter: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  donutLabel: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendInfo: { flex: 1 },
  legendName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  legendPct: { fontSize: 11, color: Colors.textLight },
  legendVal: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },

  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: Colors.primary },
  toggleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: '#fff' },

  groupCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  groupEmoji: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  groupAmount: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  groupRight: { alignItems: 'flex-end', gap: 4 },
  groupValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  groupPL: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  groupPLText: { fontSize: 11, fontWeight: '700' },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 6,
  },
  subDate: { fontSize: 11, color: Colors.textLight, width: 70 },
  subAmount: { fontSize: 11, color: Colors.textSecondary, flex: 1 },
  subBuyPrice: { fontSize: 11, color: Colors.textSecondary },
  subCurrent: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },

  holdingRow: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  holdingEmoji: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  holdingInfo: { flex: 1 },
  holdingTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  holdingName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  holdingCurrentVal: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  holdingBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  holdingAmount: { fontSize: 12, color: Colors.textSecondary },
  holdingPL: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  holdingPLText: { fontSize: 11, fontWeight: '700' },
  holdingMeta: { fontSize: 11, color: Colors.textLight },

  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
