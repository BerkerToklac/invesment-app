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
import { convertUSDToCurrency, formatCurrency, getLocalPerUsd } from '../utils/currency';

function DonutChart({ data, total, size = 180, emptyLabel = '-', totalLabel = 'Total' }) {
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
          <Text style={{ fontSize: 13, color: Colors.textLight }}>{emptyLabel}</Text>
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
        <Text style={styles.donutLabel}>{totalLabel}</Text>
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

function CategoryRow({ label, usdValue, localValue, percent, color, icon }) {
  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryRowTop}>
        <View style={styles.categoryRowLeft}>
          <View style={[styles.categoryIcon, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={16} color={color} />
          </View>
          <View>
            <Text style={styles.categoryLabel}>{label}</Text>
            <Text style={styles.categorySubValue}>{localValue}</Text>
          </View>
        </View>
        <View style={styles.categoryRight}>
          <Text style={styles.categoryValue}>{usdValue}</Text>
          <Text style={styles.categoryPercent}>{percent.toFixed(1)}%</Text>
        </View>
      </View>
      <View style={styles.categoryBarTrack}>
        <View style={[styles.categoryBarFill, { width: `${Math.max(percent, 4)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function HoldingRow({ holding, onDelete, localCurrency, prices }) {
  const { t } = useSettings();
  const pl = holding.plUSD || 0;
  const plPct = holding.plPercent || 0;
  const isUp = pl >= 0;
  const currentLocal = convertUSDToCurrency(holding.currentUSD || 0, localCurrency, prices);
  const costLocal =
    holding.assetId === 'usd' && holding.buyLocalCurrency === localCurrency && holding.buyLocalTotal != null
      ? holding.buyLocalTotal
      : convertUSDToCurrency(holding.costUSD || 0, localCurrency, prices);
  const buyLabel =
    holding.assetId === 'usd' && holding.buyLocalCurrency && holding.buyFxLocalPerUSD != null
      ? `${t('buy_rate_label')}: 1 USD = ${formatCurrency(holding.buyFxLocalPerUSD, holding.buyLocalCurrency)}`
      : `${t('buy_price')}: ${formatUSD(holding.buyPriceUSD)}`;

  return (
    <TouchableOpacity
      style={styles.holdingRow}
      onLongPress={() => {
        Alert.alert(t('delete_position_title'), `"${holding.assetName}" ${t('delete_position_confirm')}`, [
          { text: t('cancel'), style: 'cancel' },
          { text: t('delete'), style: 'destructive', onPress: () => onDelete(holding.id) },
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
          <View style={styles.holdingValueBlock}>
            <Text style={styles.holdingCurrentVal}>{formatUSD(holding.currentUSD)}</Text>
            <Text style={styles.holdingCurrentValLocal}>{formatCurrency(currentLocal, localCurrency)}</Text>
          </View>
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
          {buyLabel} · {t('cost')}: {formatUSD(holding.costUSD)} ({formatCurrency(costLocal, localCurrency)}) · {t('purchase_date')}: {formatDate(holding.buyDate) || '-'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PortfolioScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { prices, refreshing, refresh } = useMarket();
  const { holdings, computeStats, getGroupedHoldings, deleteHolding } = usePortfolio();
  const { localCurrency, t } = useSettings();
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
      gbp: prices.forex?.gbpUsd,
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
  const categoryData = useMemo(() => {
    const categories = {
      forex: { key: 'forex', label: t('forex'), color: '#16A34A', icon: 'cash-outline', totalUSD: 0 },
      metals: { key: 'metals', label: t('metals'), color: '#D4A017', icon: 'diamond-outline', totalUSD: 0 },
      crypto: { key: 'crypto', label: t('crypto'), color: '#0EA5E9', icon: 'logo-bitcoin', totalUSD: 0 },
    };

    grouped.forEach((item) => {
      if (item.type === 'forex') categories.forex.totalUSD += item.totalCurrentUSD;
      else if (item.type === 'crypto') categories.crypto.totalUSD += item.totalCurrentUSD;
      else if (item.type === 'gold' || item.type === 'silver') categories.metals.totalUSD += item.totalCurrentUSD;
    });

    return Object.values(categories)
      .filter((item) => item.totalUSD > 0)
      .map((item) => ({
        ...item,
        percent: totalCurrentUSD > 0 ? (item.totalUSD / totalCurrentUSD) * 100 : 0,
        totalLocal: formatCurrency(convertUSDToCurrency(item.totalUSD, localCurrency, prices), localCurrency),
      }))
      .sort((a, b) => b.totalUSD - a.totalUSD);
  }, [grouped, localCurrency, prices, t, totalCurrentUSD]);
  const isPositive = totalPLUSD >= 0;
  const currentLocalPerUsd = useMemo(() => getLocalPerUsd(localCurrency, prices), [localCurrency, prices]);

  if (holdings.length === 0) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
          style={[styles.emptyHeader, { paddingTop: insets.top + 16 }]}
        >
          <Text style={styles.pageTitle}>{t('portfolio_tab')}</Text>
        </LinearGradient>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="briefcase-outline" size={48} color={Colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>{t('empty_portfolio')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('empty_portfolio_subtitle')}
          </Text>
          <TouchableOpacity style={styles.addFirstBtn} onPress={() => navigation.navigate('AddInvestment')}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addFirstBtnText}>{t('add_first_investment')}</Text>
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
              <Text style={styles.summaryLabel}>{t('total_portfolio_value')}</Text>
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
              <Text style={styles.plLabel}>{t('total_profit_loss')}</Text>
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
            label={t('cost')}
            value={formatUSD(totalCostUSD)}
            sub={formatCurrency(convertUSDToCurrency(totalCostUSD, localCurrency, prices), localCurrency)}
            icon="receipt-outline"
            iconColor={Colors.primary}
            iconBg={Colors.accentLight}
          />
          <StatCard
            label={t('profit_loss')}
            value={(isPositive ? '+' : '') + formatUSD(totalPLUSD)}
            valueColor={isPositive ? Colors.success : Colors.danger}
            sub={formatPercent(totalPLPercent)}
            icon={isPositive ? 'trending-up-outline' : 'trending-down-outline'}
            iconColor={isPositive ? Colors.success : Colors.danger}
            iconBg={isPositive ? Colors.successLight : Colors.dangerLight}
          />
          <StatCard
            label={`${localCurrency} ${t('local_currency_value_suffix')}`}
            value={formatCurrency(totalCurrentLocal, localCurrency)}
            icon="cash-outline"
            iconColor={Colors.warning}
            iconBg={Colors.warningLight}
          />
          <StatCard
            label={t('asset_count')}
            value={`${grouped.length} ${t('assets_count')}`}
            sub={`${holdings.length} ${t('positions_count')}`}
            icon="layers-outline"
            iconColor={Colors.accent}
            iconBg={Colors.accentLight}
          />
        </ScrollView>

        <View style={styles.categoryCard}>
          <View style={styles.categoryCardHeader}>
            <Text style={styles.chartTitle}>{t('category_distribution')}</Text>
            <Text style={styles.categoryCardSub}>{t('share_of_portfolio')}</Text>
          </View>
          {categoryData.map((item) => (
            <CategoryRow
              key={item.key}
              label={item.label}
              usdValue={formatUSD(item.totalUSD)}
              localValue={item.totalLocal}
              percent={item.percent}
              color={item.color}
              icon={item.icon}
            />
          ))}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t('distribution')}</Text>
          <View style={styles.chartContent}>
            <DonutChart
              data={donutData}
              total={totalCurrentUSD}
              size={190}
              emptyLabel={t('portfolio_empty_center')}
              totalLabel={t('total_portfolio_value_short')}
            />
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
            <Text style={[styles.toggleText, showByAsset && styles.toggleTextActive]}>{t('by_asset')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !showByAsset && styles.toggleBtnActive]}
            onPress={() => setShowByAsset(false)}
          >
            <Text style={[styles.toggleText, !showByAsset && styles.toggleTextActive]}>{t('all_transactions')}</Text>
          </TouchableOpacity>
        </View>

        {showByAsset ? (
          <>
            {grouped.map((g) => {
              const groupUp = g.plUSD >= 0;
                const usdRowsForLocal = g.assetId === 'usd'
                  ? enrichedHoldings.filter((h) => h.assetId === 'usd' && h.buyLocalCurrency === localCurrency && h.buyLocalTotal != null)
                  : [];
                const groupCostLocalValue = usdRowsForLocal.length > 0
                  ? usdRowsForLocal.reduce((sum, row) => sum + (row.buyLocalTotal || 0), 0)
                  : convertUSDToCurrency(g.totalCostUSD, localCurrency, prices);
                const groupCurrentLocalValue = convertUSDToCurrency(g.totalCurrentUSD, localCurrency, prices);

              return (
                <View key={g.assetId} style={styles.groupCard}>
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupEmoji, { backgroundColor: g.color + '20' }]}>
                      <Text style={{ fontSize: 22 }}>{g.emoji}</Text>
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{g.assetName}</Text>
                      <Text style={styles.groupAmount}>
                        {formatCrypto(g.totalAmount)} · {t('average_short')} {formatUSD(g.avgBuyPrice, g.avgBuyPrice < 1 ? 4 : 2)}
                      </Text>
                      <Text style={styles.groupCost}>
                        {t('cost')}: {formatUSD(g.totalCostUSD)}
                      </Text>
                      <Text style={styles.groupCostLocal}>
                        {formatCurrency(groupCostLocalValue, localCurrency)}
                      </Text>
                      {g.assetId === 'usd' && currentLocalPerUsd != null ? (() => {
                        const usdRows = usdRowsForLocal;
                        if (usdRows.length === 0) return null;

                        const groupAmountForLocal = usdRows.reduce((sum, row) => sum + (row.amount || 0), 0);
                        const groupBuyLocalTotal = usdRows.reduce((sum, row) => sum + (row.buyLocalTotal || 0), 0);
                        const currentLocalTotal = groupAmountForLocal * currentLocalPerUsd;
                        const localPl = currentLocalTotal - groupBuyLocalTotal;
                        const localPlPct = groupBuyLocalTotal > 0 ? (localPl / groupBuyLocalTotal) * 100 : 0;
                        const localUp = localPl >= 0;

                        return (
                          <Text style={[styles.groupLocalPl, { color: localUp ? Colors.success : Colors.danger }]}>
                            {t('fx_pl_label')} ({localCurrency}): {localPl >= 0 ? '+' : ''}{formatCurrency(localPl, localCurrency)} ({formatPercent(localPlPct)})
                          </Text>
                        );
                      })() : null}
                    </View>
                    <View style={styles.groupRight}>
                      <Text style={styles.groupValue}>{formatUSD(g.totalCurrentUSD)}</Text>
                      <Text style={styles.groupValueLocal}>{formatCurrency(groupCurrentLocalValue, localCurrency)}</Text>
                      <View style={[styles.groupPL, { backgroundColor: groupUp ? Colors.successLight : Colors.dangerLight }]}>
                        <Text style={[styles.groupPLText, { color: groupUp ? Colors.success : Colors.danger }]}>
                          {groupUp ? '+' : ''}{formatUSD(g.plUSD)} ({formatPercent(g.plPercent)})
                        </Text>
                      </View>
                    </View>
                  </View>
                  {enrichedHoldings.filter((h) => h.assetId === g.assetId).map((h) => (
                    <View key={h.id} style={styles.subRow}>
                      <Text style={styles.subDate}>{formatDate(h.buyDate) || '-'}</Text>
                      <Text style={styles.subAmount} numberOfLines={1} ellipsizeMode="tail">
                        {formatCrypto(h.amount)} {t('quantity_unit')}
                      </Text>
                      <Text style={styles.subBuyPrice} numberOfLines={1} ellipsizeMode="tail">
                        {h.assetId === 'usd' && h.buyLocalCurrency && h.buyFxLocalPerUSD != null
                          ? `${t('fx_rate_short')}: ${formatCurrency(h.buyFxLocalPerUSD, h.buyLocalCurrency)}`
                          : `${t('buy_price')}: ${formatUSD(h.buyPriceUSD)}`}
                      </Text>
                      {h.assetId === 'usd' && h.buyLocalCurrency === localCurrency && h.buyLocalTotal != null && currentLocalPerUsd != null ? (() => {
                        const localCurrent = (h.amount || 0) * currentLocalPerUsd;
                        const localPl = localCurrent - h.buyLocalTotal;
                        const localUp = localPl >= 0;
                        return (
                          <Text
                            style={[styles.subLocalPl, { color: localUp ? Colors.success : Colors.danger }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            P/L: {localPl >= 0 ? '+' : ''}{formatCurrency(localPl, localCurrency)}
                          </Text>
                        );
                      })() : null}
                      <View style={styles.subCurrentWrap}>
                        <Text style={styles.subCurrent}>{formatUSD(h.currentUSD)}</Text>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert(t('delete'), t('delete_position_confirm'), [
                              { text: t('cancel'), style: 'cancel' },
                              { text: t('delete'), style: 'destructive', onPress: () => deleteHolding(h.id) },
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
              .sort((a, b) => new Date(b.buyDate) - new Date(a.buyDate))
              .map((h) => (
                <HoldingRow
                  key={h.id}
                  holding={h}
                  onDelete={deleteHolding}
                  localCurrency={localCurrency}
                  prices={prices}
                />
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
  categoryCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryCardSub: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '600',
  },
  categoryRow: {
    marginBottom: 12,
  },
  categoryRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  categoryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  categorySubValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  categoryPercent: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 1,
  },
  categoryBarTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 999,
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
  groupCost: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  groupCostLocal: { fontSize: 11, color: Colors.textLight, marginTop: 1 },
  groupLocalPl: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  groupRight: { alignItems: 'flex-end', gap: 4 },
  groupValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  groupValueLocal: { fontSize: 11, color: Colors.textLight, marginTop: -2 },
  groupPL: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  groupPLText: { fontSize: 11, fontWeight: '700' },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 5,
  },
  subDate: { fontSize: 11, color: Colors.textLight, width: 60, flexShrink: 0 },
  subAmount: { fontSize: 11, color: Colors.textSecondary, minWidth: 52, maxWidth: 68, flexShrink: 1 },
  subBuyPrice: { fontSize: 11, color: Colors.textSecondary, flexShrink: 1, maxWidth: 126 },
  subLocalPl: { fontSize: 11, fontWeight: '600', minWidth: 92, maxWidth: 150, textAlign: 'right' },
  subCurrentWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 2, flexShrink: 0 },
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
  holdingValueBlock: { alignItems: 'flex-end' },
  holdingCurrentVal: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  holdingCurrentValLocal: { fontSize: 11, color: Colors.textLight, marginTop: 1 },
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
