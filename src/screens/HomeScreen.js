import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  PanResponder,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../theme/colors';
import { useMarket } from '../context/MarketContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useSettings } from '../context/SettingsContext';
import { formatUSD, formatPercent } from '../utils/formatters';
import { CURRENCY_META, SUPPORTED_CURRENCIES, convertUSDToCurrency, formatCurrency } from '../utils/currency';
import { PREDEFINED_ASSETS, getAssetEmoji } from '../utils/assets';

function RateCard({
  label,
  subLabel,
  value,
  valueLabel,
  subValue,
  subValueLabel,
  change,
  icon,
  iconColor,
  iconBg,
  flag,
  imageUrl,
  favorite,
  onToggleFavorite,
}) {
  const isPositive = change >= 0;

  return (
    <View style={styles.rateCard}>
      <View style={[styles.rateIcon, { backgroundColor: iconBg || Colors.accentLight }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.rateLogo} resizeMode="contain" />
        ) : flag ? (
          <Text style={styles.rateFlag}>{flag}</Text>
        ) : (
          <Ionicons name={icon} size={20} color={iconColor || Colors.primary} />
        )}
      </View>
      <View style={styles.rateInfo}>
        <Text style={styles.rateLabel}>{label}</Text>
        {subLabel ? <Text style={styles.rateSubLabel}>{subLabel}</Text> : null}
      </View>
      <View style={styles.rateValues}>
        <View style={styles.rateValueRow}>
          {valueLabel ? <Text style={styles.rateValueLabel}>{valueLabel}</Text> : null}
          <Text style={styles.rateValue}>{value}</Text>
        </View>
        {subValue ? (
          <View style={styles.rateValueRow}>
            {subValueLabel ? <Text style={styles.rateSubValueLabel}>{subValueLabel}</Text> : null}
            <Text style={styles.rateSubValue}>{subValue}</Text>
          </View>
        ) : null}
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
      {onToggleFavorite ? (
        <View style={styles.rateActions}>
          <TouchableOpacity style={styles.rateFavoriteBtn} onPress={onToggleFavorite} activeOpacity={0.75}>
            <Ionicons name={favorite ? 'star' : 'star-outline'} size={19} color={favorite ? Colors.warning : Colors.textLight} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function FavoriteMiniCard({ item, index, total, onMove, onToggleFavorite, onDragStart, onDragEnd }) {
  const dragAnchor = useRef(0);
  const [dragging, setDragging] = useState(false);
  const { props } = item;
  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        dragAnchor.current = 0;
        setDragging(true);
        Vibration.vibrate(18);
        onDragStart();
      },
      onPanResponderMove: (_, gestureState) => {
        const step = 38;
        if (gestureState.dy - dragAnchor.current > step && index < total - 1) {
          dragAnchor.current += step;
          onMove(1);
        } else if (gestureState.dy - dragAnchor.current < -step && index > 0) {
          dragAnchor.current -= step;
          onMove(-1);
        }
      },
      onPanResponderRelease: () => {
        dragAnchor.current = 0;
        setDragging(false);
        onDragEnd();
      },
      onPanResponderTerminate: () => {
        dragAnchor.current = 0;
        setDragging(false);
        onDragEnd();
      },
    }),
    [index, onDragEnd, onDragStart, onMove, total]
  );

  return (
    <View style={[styles.favoriteMiniCard, dragging && styles.favoriteMiniCardDragging]}>
      <View style={[styles.favoriteMiniIcon, { backgroundColor: props.iconBg || Colors.accentLight }]}>
        {props.imageUrl ? (
          <Image source={{ uri: props.imageUrl }} style={styles.favoriteMiniLogo} resizeMode="contain" />
        ) : props.flag ? (
          <Text style={styles.favoriteMiniFlag}>{props.flag}</Text>
        ) : (
          <Ionicons name={props.icon} size={17} color={props.iconColor || Colors.primary} />
        )}
      </View>
      <View style={styles.favoriteMiniInfo}>
        <Text style={styles.favoriteMiniLabel} numberOfLines={1}>{props.label}</Text>
        <Text style={styles.favoriteMiniSub} numberOfLines={1}>{props.subLabel || props.valueLabel || props.subValueLabel}</Text>
      </View>
      <View style={styles.favoriteMiniValues}>
        <Text style={styles.favoriteMiniValue} numberOfLines={1}>{props.value}</Text>
        {props.subValue ? (
          <Text style={styles.favoriteMiniSubValue} numberOfLines={1}>{props.subValue}</Text>
        ) : null}
      </View>
      <View style={styles.favoriteMiniTools}>
        <TouchableOpacity style={styles.favoriteMiniStar} onPress={onToggleFavorite} activeOpacity={0.75}>
          <Ionicons name="star" size={16} color={Colors.warning} />
        </TouchableOpacity>
        <View style={styles.favoriteMiniDrag} {...panResponder.panHandlers}>
          <Ionicons name="reorder-three-outline" size={22} color={Colors.textLight} />
        </View>
      </View>
    </View>
  );
}

const CRYPTO_RATE_ASSETS = PREDEFINED_ASSETS.filter((asset) => asset.type === 'crypto');
const FAVORITE_SECTION_LABELS = {
  tr: 'Favoriler',
  en: 'Favorites',
};

function getHoldingCostBaseValue(holding, { baseCurrency, prices }) {
  const activeBaseAssetId = (baseCurrency || 'USD').toLowerCase();
  if (holding.assetId === activeBaseAssetId) {
    return holding.amount || 0;
  }

  return convertUSDToCurrency((holding.amount || 0) * (holding.buyPriceUSD || 0), baseCurrency, prices);
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { prices, loading, refreshing, refresh, lastUpdated } = useMarket();
  const { holdings, computeStats } = usePortfolio();
  const {
    localCurrency,
    baseCurrency,
    language,
    homeFavoriteIds,
    setHomeFavoriteIds,
    addHomeFavorite,
    removeHomeFavorite,
    t,
  } = useSettings();
  const [selectedSection, setSelectedSection] = useState('forex');
  const favoriteIds = homeFavoriteIds || [];
  const [favoriteDragging, setFavoriteDragging] = useState(false);

  const saveFavoriteIds = useCallback((nextFavorites) => {
    setHomeFavoriteIds(nextFavorites).catch((error) => console.error('Save home favorites error:', error));
  }, [setHomeFavoriteIds]);

  const toggleFavorite = useCallback((id) => {
    if (favoriteIds.includes(id)) {
      removeHomeFavorite(id).catch((error) => console.error('Remove home favorite error:', error));
      return;
    }

    addHomeFavorite(id).catch((error) => console.error('Add home favorite error:', error));
  }, [addHomeFavorite, favoriteIds, removeHomeFavorite]);

  const moveFavorite = useCallback((id, direction) => {
    const currentIndex = favoriteIds.indexOf(id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= favoriteIds.length) return;

    const nextFavorites = [...favoriteIds];
    const [item] = nextFavorites.splice(currentIndex, 1);
    nextFavorites.splice(nextIndex, 0, item);
    saveFavoriteIds(nextFavorites);
  }, [favoriteIds, saveFavoriteIds]);

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
      sol: prices.crypto?.sol?.usd,
      trx: prices.crypto?.trx?.usd,
      ada: prices.crypto?.ada?.usd,
      xmr: prices.crypto?.xmr?.usd,
      xlm: prices.crypto?.xlm?.usd,
      ltc: prices.crypto?.ltc?.usd,
      avax: prices.crypto?.avax?.usd,
      paxg: prices.crypto?.paxg?.usd,
      xaut: prices.crypto?.xaut?.usd,
    };
    if (map[id] != null) return map[id];

    const currency = typeof id === 'string' ? id.toUpperCase() : '';
    if (currency === 'USD') return 1;
    const usdToCurrency = prices.forex?.rates?.[currency] ?? null;
    return usdToCurrency ? 1 / usdToCurrency : null;
  };

  const portfolioStats = useMemo(() => {
    if (!prices) return null;
    return computeStats(getAssetPrice);
  }, [prices, computeStats]);

  const goldGramUSD = prices?.metals?.goldGramUSD;
  const silverGramUSD = prices?.metals?.silverGramUSD;
  const goldOzUSD = prices?.metals?.goldOzUSD;
  const silverOzUSD = prices?.metals?.silverOzUSD;

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const totalUSD = portfolioStats?.totalCurrentUSD || 0;
  const totalCostBase = (holdings || []).reduce(
    (sum, holding) => sum + (getHoldingCostBaseValue(holding, {
      baseCurrency,
      prices,
    }) || 0),
    0
  );
  const totalBase = convertUSDToCurrency(totalUSD, baseCurrency, prices);
  const totalLocal = convertUSDToCurrency(totalUSD, localCurrency, prices);
  const plBase = totalBase - totalCostBase;
  const plPct = totalCostBase > 0 ? (plBase / totalCostBase) * 100 : 0;
  const portfolioSubValue = localCurrency !== baseCurrency
    ? formatCurrency(totalLocal, localCurrency)
    : formatUSD(totalUSD);

  const baseValue = (usdValue, decimals = 2) =>
    usdValue == null ? '-' : formatCurrency(convertUSDToCurrency(usdValue, baseCurrency, prices), baseCurrency, decimals);
  const baseSubValue = (usdValue, decimals = 2) => {
    if (usdValue == null) return '-';
    if (localCurrency !== baseCurrency) {
      return formatCurrency(convertUSDToCurrency(usdValue, localCurrency, prices), localCurrency, decimals);
    }
    return formatUSD(usdValue, decimals);
  };

  const formatForexCard = (assetCode, usdPrice) => {
    const upperCode = assetCode.toUpperCase();
    const displayPairLabel = `${upperCode}/${localCurrency}`;
    const basePairLabel = `${upperCode}/${baseCurrency}`;

    if (usdPrice == null) {
      return {
        value: '--',
        valueLabel: displayPairLabel,
        subValue: null,
        subValueLabel: basePairLabel,
        subLabel: null,
      };
    }

    if (localCurrency === upperCode) {
      return {
        value: formatCurrency(convertUSDToCurrency(usdPrice, localCurrency, prices), localCurrency, 4),
        valueLabel: displayPairLabel,
        subValue: baseCurrency === upperCode
          ? `1 ${upperCode}`
          : formatCurrency(convertUSDToCurrency(usdPrice, baseCurrency, prices), baseCurrency, 4),
        subValueLabel: basePairLabel,
        subLabel: null,
      };
    }

    return {
      value: formatCurrency(convertUSDToCurrency(usdPrice, localCurrency, prices), localCurrency, 4),
      valueLabel: displayPairLabel,
      subValue: baseCurrency === upperCode
        ? `1 ${upperCode}`
        : formatCurrency(convertUSDToCurrency(usdPrice, baseCurrency, prices), baseCurrency, 4),
      subValueLabel: basePairLabel,
      subLabel: null,
    };
  };

  const forexRates = SUPPORTED_CURRENCIES
    .filter((currency) => currency !== localCurrency)
    .map((currency) => ({
      currency,
      meta: CURRENCY_META[currency],
      rate: formatForexCard(currency.toLowerCase(), getAssetPrice(currency.toLowerCase())),
    }));
  const sectionOptions = [
    { key: 'forex', label: t('forex') },
    { key: 'metals', label: t('metals') },
    { key: 'crypto', label: t('crypto') },
  ];
  const marketItems = useMemo(() => {
    const forexItems = forexRates.map(({ currency, meta, rate }) => ({
      id: `forex:${currency}`,
      section: 'forex',
      props: {
        label: language === 'en' ? meta.name : meta.localName,
        subLabel: rate.subLabel,
        value: rate.value,
        valueLabel: rate.valueLabel,
        subValue: rate.subValue,
        subValueLabel: rate.subValueLabel,
        flag: getAssetEmoji(currency.toLowerCase()),
        icon: currency === 'EUR' ? 'logo-euro' : 'cash-outline',
        iconColor: currency === 'USD' ? '#16A34A' : Colors.primary,
        iconBg: currency === 'USD' ? '#DCFCE7' : Colors.accentLight,
      },
    }));

    const metalItems = [
      {
        id: 'metals:gold-gram',
        props: {
          label: t('gram_gold'),
          subLabel: '995/1000',
          value: baseValue(goldGramUSD, 2),
          subValue: baseSubValue(goldGramUSD, 2),
          icon: 'medal-outline',
          iconColor: Colors.gold,
          iconBg: Colors.warningLight,
        },
      },
      {
        id: 'metals:silver-gram',
        props: {
          label: t('gram_silver'),
          subLabel: '995/1000',
          value: baseValue(silverGramUSD, 4),
          subValue: baseSubValue(silverGramUSD, 2),
          icon: 'medal-outline',
          iconColor: Colors.silver,
          iconBg: Colors.borderLight,
        },
      },
      {
        id: 'metals:gold-oz',
        props: {
          label: t('ounce_gold'),
          subLabel: 'Troy oz / USD',
          value: baseValue(goldOzUSD, 2),
          subValue: baseSubValue(goldOzUSD, 2),
          icon: 'medal-outline',
          iconColor: Colors.gold,
          iconBg: Colors.warningLight,
        },
      },
      {
        id: 'metals:silver-oz',
        props: {
          label: t('ounce_silver'),
          subLabel: 'Troy oz / USD',
          value: baseValue(silverOzUSD, 2),
          subValue: baseSubValue(silverOzUSD, 2),
          icon: 'medal-outline',
          iconColor: Colors.silver,
          iconBg: Colors.borderLight,
        },
      },
    ].map((item) => ({ ...item, section: 'metals' }));

    const cryptoItems = CRYPTO_RATE_ASSETS.map((asset) => {
      const usdValue = prices?.crypto?.[asset.id]?.usd;
      const decimals = usdValue != null && usdValue < 1 ? 4 : 2;

      return {
        id: `crypto:${asset.id}`,
        section: 'crypto',
        props: {
          label: asset.name,
          subLabel: `${asset.shortName} / USD`,
          value: baseValue(usdValue, decimals),
          subValue: baseSubValue(usdValue, decimals),
          change: prices?.crypto?.[asset.id]?.change24h,
          icon: 'logo-bitcoin',
          iconColor: asset.color,
          iconBg: Colors.accentLight,
          imageUrl: asset.iconUrl,
        },
      };
    });

    return [...forexItems, ...metalItems, ...cryptoItems];
  }, [
    baseSubValue,
    baseValue,
    forexRates,
    goldGramUSD,
    goldOzUSD,
    language,
    prices?.crypto,
    silverGramUSD,
    silverOzUSD,
    t,
  ]);
  const marketItemById = useMemo(
    () => Object.fromEntries(marketItems.map((item) => [item.id, item])),
    [marketItems]
  );
  const visibleFavorites = favoriteIds
    .map((id) => marketItemById[id])
    .filter(Boolean);
  const sectionItems = marketItems.filter((item) => item.section === selectedSection);
  const renderMarketItem = (item, options = {}) => (
    <RateCard
      key={item.id}
      {...item.props}
      favorite={favoriteIds.includes(item.id)}
      onToggleFavorite={() => toggleFavorite(item.id)}
    />
  );

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
                <Text style={styles.portfolioValueUSD}>{formatCurrency(totalBase, baseCurrency)}</Text>
                <Text style={styles.portfolioValueTRY}>{portfolioSubValue}</Text>
                <View style={styles.portfolioPLRow}>
                  <View
                    style={[
                      styles.plBadge,
                      { backgroundColor: plBase >= 0 ? Colors.successLight : Colors.dangerLight },
                    ]}
                  >
                    <Ionicons
                      name={plBase >= 0 ? 'trending-up' : 'trending-down'}
                      size={13}
                      color={plBase >= 0 ? Colors.success : Colors.danger}
                    />
                    <Text style={[styles.plText, { color: plBase >= 0 ? Colors.success : Colors.danger }]}>
                      {plBase >= 0 ? '+' : ''}{formatCurrency(plBase, baseCurrency)} ({formatPercent(plPct)})
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
        scrollEnabled={!favoriteDragging}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.lastUpdatedRow}>
          <Ionicons name="time-outline" size={13} color={Colors.textLight} />
          <Text style={styles.lastUpdatedText}>{t('last_updated')}: {lastUpdatedStr}</Text>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{t('live')}</Text>
        </View>

        {!loading && visibleFavorites.length > 0 ? (
          <View style={styles.favoritesSection}>
            <Text style={styles.favoritesTitle}>{FAVORITE_SECTION_LABELS[language] || FAVORITE_SECTION_LABELS.tr}</Text>
            {visibleFavorites.map((item, index) => (
              <FavoriteMiniCard
                key={item.id}
                item={item}
                index={index}
                total={visibleFavorites.length}
                onMove={(direction) => moveFavorite(item.id, direction)}
                onToggleFavorite={() => toggleFavorite(item.id)}
                onDragStart={() => setFavoriteDragging(true)}
                onDragEnd={() => setFavoriteDragging(false)}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.segmentedControl}>
          {sectionOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.segmentButton, selectedSection === option.key && styles.segmentButtonActive]}
              onPress={() => setSelectedSection(option.key)}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.segmentButtonText, selectedSection === option.key && styles.segmentButtonTextActive]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>{t('rates_updating')}</Text>
          </View>
        ) : (
          <>
            {sectionItems.map((item) => renderMarketItem(item))}
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

  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  segmentButton: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: Colors.accentLight,
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    textAlign: 'center',
    flexShrink: 1,
  },
  segmentButtonTextActive: {
    color: Colors.primary,
  },

  favoritesSection: {
    marginBottom: 10,
  },
  favoritesTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  favoriteMiniCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.035,
    shadowRadius: 4,
    elevation: 1,
  },
  favoriteMiniCardDragging: {
    backgroundColor: '#F7FCF8',
    transform: [{ scale: 1.025 }],
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  favoriteMiniIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },
  favoriteMiniLogo: { width: 21, height: 21, borderRadius: 10.5 },
  favoriteMiniFlag: { fontSize: 18 },
  favoriteMiniInfo: {
    flex: 1,
    minWidth: 0,
  },
  favoriteMiniLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  favoriteMiniSub: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 1,
  },
  favoriteMiniValues: {
    minWidth: 96,
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  favoriteMiniValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  favoriteMiniSubValue: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  favoriteMiniChange: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  favoriteMiniTools: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 2,
  },
  favoriteMiniStar: {
    width: 24,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteMiniDrag: {
    width: 28,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
  rateFlag: { fontSize: 22 },
  rateLogo: { width: 24, height: 24, borderRadius: 12 },
  rateInfo: { flex: 1 },
  rateLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  rateSubLabel: { fontSize: 12, color: Colors.textLight, marginTop: 1 },
  rateValues: { minWidth: 148, alignItems: 'stretch', gap: 4 },
  rateValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rateValueLabel: { fontSize: 11, color: Colors.textLight, fontWeight: '600', width: 78, textAlign: 'left' },
  rateValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  rateSubValueLabel: { fontSize: 11, color: Colors.textLight, fontWeight: '600', width: 78, textAlign: 'left' },
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
  rateActions: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  rateFavoriteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
});
