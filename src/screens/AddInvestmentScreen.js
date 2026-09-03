import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useMarket } from '../context/MarketContext';
import { useSettings } from '../context/SettingsContext';
import { PREDEFINED_ASSETS, getLocalizedAssetName } from '../utils/assets';
import { formatUSD, toIstanbulDateStr, formatDateLong } from '../utils/formatters';
import {
  SUPPORTED_CURRENCIES,
  convertCurrencyToUSD,
  convertUSDToCurrency,
  formatCurrency,
  getCurrencySymbol,
  getLocalCurrencyOptions,
} from '../utils/currency';
import { DEFAULT_INVESTMENT_PLATFORM, getPlatformDisplayName } from '../utils/platforms';
import { getUserFacingError } from '../utils/userFacingError';

const FOREX_ASSET_IDS = SUPPORTED_CURRENCIES.map((currency) => currency.toLowerCase());
const CRYPTO_ASSET_IDS = PREDEFINED_ASSETS
  .filter((asset) => asset.type === 'crypto')
  .map((asset) => asset.id);
const HOME_ASSET_IDS = [...FOREX_ASSET_IDS, 'gold-gram', 'silver-gram', 'gold-oz', 'silver-oz', ...CRYPTO_ASSET_IDS];

function sanitizeDecimalInput(value, maxDecimals = 8) {
  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const parts = normalized.split('.');
  if (parts.length === 1) return parts[0];
  const integerPart = parts[0];
  const decimalPart = parts.slice(1).join('').slice(0, maxDecimals);
  return `${integerPart}.${decimalPart}`;
}

function DatePickerField({ value, onChange }) {
  const { t, language } = useSettings();
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const pickerLocale = language === 'en' ? 'en-US' : 'tr-TR';

  const formatted = formatDateLong(value, language);

  const handleChange = (event, selected) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type !== 'dismissed' && selected) onChange(selected);
    } else {
      setTempDate(selected || value);
    }
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.dateTrigger} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
        <View style={styles.dateTriggerLeft}>
          <View style={styles.dateTriggerIcon}>
            <Ionicons name="calendar" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.dateTriggerText}>{formatted}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
          <TouchableOpacity style={styles.dateOverlay} activeOpacity={1} onPress={() => setShowPicker(false)} />
          <View style={styles.dateSheet}>
            <View style={styles.dateSheetHandle} />
            <View style={styles.dateSheetHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.dateSheetBtn}>
                <Text style={styles.dateSheetCancel}>{t('cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.dateSheetTitle}>{t('date_picker_title')}</Text>
              <TouchableOpacity onPress={handleConfirm} style={styles.dateSheetBtn}>
                <Text style={styles.dateSheetConfirm}>{t('ok')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerWrap}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                maximumDate={new Date()}
                minimumDate={new Date(2000, 0, 1)}
                locale={pickerLocale}
                themeVariant="light"
                textColor={Colors.textPrimary}
                style={styles.datePickerIOS}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={handleChange}
          maximumDate={new Date()}
          minimumDate={new Date(2000, 0, 1)}
        />
      )}
    </>
  );
}

function AssetIcon({ asset, size = 28 }) {
  if (asset?.iconUrl) {
    return (
      <Image
        source={{ uri: asset.iconUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="contain"
      />
    );
  }

  return <Text style={{ fontSize: Math.round(size * 0.8) }}>{asset?.emoji}</Text>;
}

function AssetPickerModal({ visible, onClose, onSelect, currentId, assets, t }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('forex');
  const categoryOptions = [
    { key: 'forex', label: t('forex') },
    { key: 'metals', label: t('metals') },
    { key: 'crypto', label: t('crypto') },
  ];
  const getAssetSymbolLine = (asset) => {
    return Array.from(new Set([asset.shortName, asset.unit].filter(Boolean))).join(' · ');
  };

  const filtered = useMemo(
    () => {
      const query = search.trim().toLowerCase();
      return assets.filter((a) => {
        const assetCategory = ['gold', 'silver'].includes(a.type) ? 'metals' : a.type;
        const matchesCategory = query || assetCategory === selectedCategory;
        const searchable = [
          a.name,
          a.shortName,
          a.unit,
          a.id,
          getLocalizedAssetName(a.id, 'tr'),
          getLocalizedAssetName(a.id, 'en'),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return matchesCategory && (!query || searchable.includes(query));
      });
    },
    [assets, search, selectedCategory]
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('asset_select')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search_asset')}
            placeholderTextColor={Colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {!search.trim() ? (
          <View style={styles.assetCategoryTabs}>
            {categoryOptions.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[styles.assetCategoryTab, selectedCategory === category.key && styles.assetCategoryTabActive]}
                onPress={() => setSelectedCategory(category.key)}
                activeOpacity={0.85}
              >
                <Text
                  style={[styles.assetCategoryText, selectedCategory === category.key && styles.assetCategoryTextActive]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.assetItem, item.id === currentId && styles.assetItemActive]}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <View style={[styles.assetItemEmoji, { backgroundColor: item.color + '20' }]}>
                <AssetIcon asset={item} size={30} />
              </View>
              <View style={styles.assetItemInfo}>
                <Text style={styles.assetItemName}>{item.name}</Text>
                <Text style={styles.assetItemSymbol}>
                  {getAssetSymbolLine(item)}
                </Text>
              </View>
              {item.id === currentId && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

function FormRow({ label, children }) {
  return (
    <View style={styles.formRow}>
      <Text style={styles.formLabel}>{label}</Text>
      {children}
    </View>
  );
}

function PlatformPickerModal({
  visible,
  onClose,
  platforms,
  selectedPlatform,
  defaultPlatform,
  language,
  onSelect,
  onAdd,
  onDelete,
  t,
}) {
  const insets = useSafeAreaInsets();
  const [platformName, setPlatformName] = useState('');
  const cleanedPlatformName = platformName.trim();

  const handleAdd = async () => {
    if (!cleanedPlatformName) return;
    await onAdd(cleanedPlatformName);
    onSelect(cleanedPlatformName);
    setPlatformName('');
    onClose();
  };

  const handleDelete = (item) => {
    if (item === defaultPlatform) return;
    Alert.alert(
      t('source_platform_delete_title'),
      t('source_platform_delete_body'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('source_platform_delete'),
          style: 'destructive',
          onPress: () => onDelete(item),
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 48 : 0}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('source_platform')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.platformGuide}>
          <Ionicons name="information-circle-outline" size={17} color={Colors.primary} />
          <Text style={styles.platformGuideText}>{t('source_platform_guide')}</Text>
        </View>

        <FlatList
          style={styles.platformList}
          data={platforms}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.platformListContent}
          renderItem={({ item }) => (
            <View style={[styles.platformItem, selectedPlatform === item && styles.platformItemActive]}>
              <TouchableOpacity
                style={styles.platformItemSelect}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                activeOpacity={0.85}
              >
                <View style={styles.platformIcon}>
                  <Ionicons name="business-outline" size={18} color={Colors.primary} />
                </View>
                <View style={styles.platformItemCopy}>
                  <Text style={styles.platformItemText}>{getPlatformDisplayName(item, language)}</Text>
                  {item === defaultPlatform ? (
                    <Text style={styles.platformItemSub}>{t('source_platform_default_locked')}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
              {selectedPlatform === item ? <Ionicons name="checkmark-circle" size={20} color={Colors.primary} /> : null}
              {item !== defaultPlatform ? (
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.platformDeleteBtn} activeOpacity={0.8}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        />

        <View style={[styles.platformAddBox, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
          <Text style={styles.platformAddTitle}>{t('source_platform_add_new')}</Text>
          <TextInput
            style={styles.platformAddInput}
            placeholder={t('source_platform_placeholder')}
            placeholderTextColor={Colors.textLight}
            value={platformName}
            onChangeText={setPlatformName}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity
            style={[styles.platformAddButton, !cleanedPlatformName && styles.platformAddButtonDisabled]}
            onPress={handleAdd}
            disabled={!cleanedPlatformName}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.platformAddButtonText}>{t('source_platform_add')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function AddInvestmentScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { holdings, addHolding, reload: reloadPortfolio } = usePortfolio();
  const { getAssetPrice, prices } = useMarket();
  const {
    localCurrency,
    baseCurrency,
    language,
    investmentPlatforms,
    addInvestmentPlatform,
    removeInvestmentPlatform,
    defaultInvestmentPlatform,
    reloadSettings,
    t,
  } = useSettings();

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [platformPickerVisible, setPlatformPickerVisible] = useState(false);
  const [date, setDate] = useState(new Date());
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState(defaultInvestmentPlatform || DEFAULT_INVESTMENT_PLATFORM);
  const [priceCurrency, setPriceCurrency] = useState(localCurrency);
  const [loading, setLoading] = useState(false);

  const openPlatformPicker = () => {
    setPlatformPickerVisible(true);
    // Platformlar hesap tercihi olarak sunucuda tutulur. Seçici her açıldığında
    // diğer cihazlarda eklenenleri de almak için listeyi yenile.
    reloadSettings();
  };
  const platformOptions = useMemo(() => {
    const defaultPlatformName = defaultInvestmentPlatform || DEFAULT_INVESTMENT_PLATFORM;
    const holdingPlatforms = (holdings || [])
      .map((holding) => holding.sourcePlatform)
      .filter((platform) => typeof platform === 'string' && platform.trim());

    return Array.from(new Set([
      defaultPlatformName,
      ...((investmentPlatforms || []).filter((platform) => typeof platform === 'string' && platform.trim())),
      ...holdingPlatforms,
    ]));
  }, [defaultInvestmentPlatform, holdings, investmentPlatforms]);
  const activeBaseAssetId = (baseCurrency || 'USD').toLowerCase();
  const isBaseCurrencyAsset = selectedAsset?.id === activeBaseAssetId;
  const formatCurrencyInfo = (key) => t(key)
    .replace('{baseCurrency}', baseCurrency)
    .replace('{localCurrency}', localCurrency);
  const baseAssetSaveRateMissing = language === 'en'
    ? 'Purchase rate is missing; the base-currency transaction could not be saved.'
    : 'Alis kuru girilmedi, baz para birimi islemi kaydedilemedi.';

  const priceCurrencyOptions = useMemo(
    () => getLocalCurrencyOptions(localCurrency, baseCurrency),
    [baseCurrency, localCurrency]
  );
  const pickerAssets = useMemo(
    () =>
      HOME_ASSET_IDS
        .map((id) => PREDEFINED_ASSETS.find((asset) => asset.id === id))
        .filter(Boolean)
        .map((asset) => ({
          ...asset,
          name: getLocalizedAssetName(asset.id, language),
        })),
    [language]
  );

  useEffect(() => {
    if (!user) return undefined;

    const timer = setTimeout(() => {
      setPickerVisible(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    setPriceCurrency((current) => (priceCurrencyOptions.includes(current) ? current : localCurrency));
  }, [localCurrency, priceCurrencyOptions]);

  useEffect(() => {
    if (!sourcePlatform || !platformOptions.includes(sourcePlatform)) {
      setSourcePlatform(platformOptions[0] || DEFAULT_INVESTMENT_PLATFORM);
    }
  }, [platformOptions, sourcePlatform]);

  useEffect(() => {
    if (!selectedAsset) return;
    if (selectedAsset.id === activeBaseAssetId) {
      setPriceCurrency(localCurrency);
      setBuyPrice(localCurrency === baseCurrency ? '1' : '');
      return;
    }

    setPriceCurrency(localCurrency);
    setBuyPrice('');
  }, [activeBaseAssetId, baseCurrency, localCurrency, selectedAsset?.id]);

  const currentMarketPriceUSD = selectedAsset ? getAssetPrice(selectedAsset.id) : null;
  const currentMarketPrice = currentMarketPriceUSD
    ? convertUSDToCurrency(currentMarketPriceUSD, isBaseCurrencyAsset ? localCurrency : priceCurrency, prices)
    : null;
  const localMarketPrice = currentMarketPriceUSD ? convertUSDToCurrency(currentMarketPriceUSD, localCurrency, prices) : null;
  const baseMarketPrice = currentMarketPriceUSD ? convertUSDToCurrency(currentMarketPriceUSD, baseCurrency, prices) : null;
  const buyPriceNumber = isBaseCurrencyAsset
    ? (localCurrency === baseCurrency ? 1 : (parseFloat(buyPrice) || 0))
    : (parseFloat(buyPrice) || 0);
  const buyPriceUSD = isBaseCurrencyAsset
    ? convertCurrencyToUSD(buyPriceNumber, localCurrency, prices)
    : convertCurrencyToUSD(
      buyPriceNumber,
      priceCurrency,
      prices
    );
  const amountNumber = parseFloat(amount) || 0;
  const totalCostUSD = amountNumber * buyPriceUSD;
  const enteredTotalCost = amountNumber * buyPriceNumber;
  const totalCostLocal = isBaseCurrencyAsset
    ? enteredTotalCost
    : convertUSDToCurrency(totalCostUSD, localCurrency, prices);
  const totalCostPreviewUSD = totalCostUSD;
  const currentValueUSD = amountNumber * (currentMarketPriceUSD || 0);
  const currentValueLocal = convertUSDToCurrency(currentValueUSD, localCurrency, prices);
  const selectedSourcePlatform = sourcePlatform || defaultInvestmentPlatform || DEFAULT_INVESTMENT_PLATFORM;

  const autofillPrice = () => {
    if (!currentMarketPrice) {
      Alert.alert(t('price_unavailable'), t('price_unavailable_sub'));
      return;
    }
    setBuyPrice(sanitizeDecimalInput(String(currentMarketPrice), 8));
  };

  const validate = () => {
    if (!selectedAsset) return t('select_asset_error');
    if (!amount || amountNumber <= 0) return t('valid_amount_error');
    if (isBaseCurrencyAsset && localCurrency !== baseCurrency && (!buyPrice || buyPriceNumber <= 0)) return t('valid_purchase_price_error');
    if (!isBaseCurrencyAsset && (!buyPrice || buyPriceNumber <= 0)) return t('valid_purchase_price_error');
    if (buyPriceUSD == null || !Number.isFinite(buyPriceUSD) || buyPriceUSD <= 0) return t('price_unavailable_sub');
    if (!date) return t('select_date_error');
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      Alert.alert(t('missing_info'), err);
      return;
    }

    setLoading(true);
    try {
      let buyLocalCurrency = null;
      let buyFxLocalPerUSD = null;
      let buyLocalTotal = null;

      if (isBaseCurrencyAsset) {
        buyLocalCurrency = localCurrency;
        buyFxLocalPerUSD = buyPriceNumber;

        if (buyFxLocalPerUSD == null) {
          Alert.alert(t('error'), baseAssetSaveRateMissing);
          setLoading(false);
          return;
        }

        buyLocalTotal = amountNumber * buyFxLocalPerUSD;
      }

      await addHolding({
        assetId: selectedAsset.id,
        assetName: selectedAsset.name,
        type: selectedAsset.type,
        emoji: selectedAsset.emoji,
        iconUrl: selectedAsset.iconUrl,
        color: selectedAsset.color,
        buyDate: toIstanbulDateStr(date),
        amount: amountNumber,
        buyPriceUSD,
        baseCurrency,
        buyLocalCurrency,
        buyFxLocalPerUSD,
        buyLocalTotal,
        sourcePlatform: selectedSourcePlatform,
        note: '',
      });

      Alert.alert(t('success'), `${selectedAsset.name} ${t('added_to_portfolio')}`, [
        { text: t('ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(t('error'), getUserFacingError(error, t('add_investment_error')));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('add_investment')}</Text>
            <View style={styles.closeBtn} />
          </View>
        </LinearGradient>
        <View style={styles.authGate}>
          <View style={styles.authGateIcon}>
            <Ionicons name="lock-closed-outline" size={42} color={Colors.primary} />
          </View>
          <Text style={styles.authGateTitle}>{t('portfolio_login_title')}</Text>
          <Text style={styles.authGateSubtitle}>{t('portfolio_login_subtitle')}</Text>
          <TouchableOpacity
            style={styles.authGateBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.authGateBtnText}>{t('welcome_cta_login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('add_investment')}</Text>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          <FormRow label={`${t('asset')} *`}>
            <TouchableOpacity style={styles.assetPickerBtn} onPress={() => setPickerVisible(true)}>
              {selectedAsset ? (
                <View style={styles.assetPickerSelected}>
                  <View style={[styles.assetPickerEmoji, { backgroundColor: selectedAsset.color + '20' }]}>
                    <AssetIcon asset={selectedAsset} size={26} />
                  </View>
                  <View>
                    <Text style={styles.assetPickerName}>{selectedAsset.name}</Text>
                    <Text style={styles.assetPickerType}>{selectedAsset.shortName}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.assetPickerPlaceholder}>{t('asset_select')}...</Text>
              )}
              <Ionicons name="chevron-down" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          </FormRow>

          {selectedAsset ? (
            <>
              <FormRow label={`${t('purchase_date')} *`}>
                <DatePickerField value={date} onChange={setDate} />
              </FormRow>

              <FormRow label={t('source_platform')}>
                <TouchableOpacity style={styles.platformPickerBtn} onPress={openPlatformPicker} activeOpacity={0.85}>
                  <View style={styles.platformPickerLeft}>
                    <View style={styles.platformPickerIcon}>
                      <Ionicons name="business-outline" size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.platformPickerTextWrap}>
                      <Text style={[styles.platformPickerText, !sourcePlatform && styles.platformPickerPlaceholder]}>
                        {sourcePlatform ? getPlatformDisplayName(sourcePlatform, language) : t('source_platform_select')}
                      </Text>
                      <Text style={styles.platformPickerHint}>{t('source_platform_hint')}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={Colors.textLight} />
                </TouchableOpacity>
              </FormRow>

              <FormRow label={`${t('amount')} *`}>
                <View style={styles.inputWithSuffix}>
                  <TextInput
                    style={[styles.input, styles.borderlessInput]}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textLight}
                    value={amount}
                    onChangeText={(v) => setAmount(v.replace(',', '.'))}
                    keyboardType="decimal-pad"
                  />
                  <View style={styles.inputSuffix}>
                    <Text style={styles.inputSuffixText}>{selectedAsset.unit || selectedAsset.shortName}</Text>
                  </View>
                </View>
              </FormRow>

              <FormRow label={isBaseCurrencyAsset ? `${t('buy_rate_label')} (${localCurrency}/${baseCurrency}) *` : `${t('purchase_price')} (${priceCurrency}) *`}>
                {!isBaseCurrencyAsset && (
                  <View style={styles.currencyTabs}>
                    {priceCurrencyOptions.map((currency) => (
                      <TouchableOpacity
                        key={currency}
                        style={[styles.currencyTab, priceCurrency === currency && styles.currencyTabActive]}
                        onPress={() => setPriceCurrency(currency)}
                      >
                        <Text style={[styles.currencyTabText, priceCurrency === currency && styles.currencyTabTextActive]}>
                          {currency}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {!isBaseCurrencyAsset && currentMarketPrice && (
                  <View style={styles.marketPriceInfo}>
                    <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                    <Text style={styles.marketPriceText}>
                      {t('current_price')}: <Text style={styles.marketPriceVal}>{formatCurrency(currentMarketPrice, priceCurrency, currentMarketPrice < 1 ? 4 : 2)}</Text>
                    </Text>
                    {priceCurrency !== baseCurrency && baseMarketPrice ? (
                      <Text style={styles.marketPriceSub}>
                        {baseCurrency}: {formatCurrency(baseMarketPrice, baseCurrency, baseMarketPrice < 1 ? 4 : 2)}
                      </Text>
                    ) : null}
                    {priceCurrency !== localCurrency && localMarketPrice ? (
                      <Text style={styles.marketPriceSub}>{localCurrency}: {formatCurrency(localMarketPrice, localCurrency, localMarketPrice < 1 ? 4 : 2)}</Text>
                    ) : null}
                    <TouchableOpacity style={styles.autofillBtn} onPress={autofillPrice}>
                      <Text style={styles.autofillText}>{t('use')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isBaseCurrencyAsset && currentMarketPrice && (
                  <View style={styles.marketPriceInfo}>
                    <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                    <Text style={styles.marketPriceText}>
                      {t('current_price')}: <Text style={styles.marketPriceVal}>{formatCurrency(currentMarketPrice, localCurrency, currentMarketPrice < 1 ? 4 : 2)}</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.autofillBtn}
                      onPress={() => setBuyPrice(sanitizeDecimalInput(String(currentMarketPrice), 8))}
                    >
                      <Text style={styles.autofillText}>{t('use')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.inputWithSuffix}>
                  <View style={styles.inputPrefix}>
                    <Text style={styles.inputPrefixText}>{getCurrencySymbol(isBaseCurrencyAsset ? localCurrency : priceCurrency)}</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.borderlessInput, styles.noLeftRadius]}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textLight}
                    value={buyPrice}
                    onChangeText={(v) => setBuyPrice(sanitizeDecimalInput(v, 8))}
                    keyboardType="decimal-pad"
                    editable={!(isBaseCurrencyAsset && localCurrency === baseCurrency)}
                  />
                </View>
                {isBaseCurrencyAsset ? (
                  <>
                    <Text style={styles.marketPriceSub}>
                      {t('buy_rate_label')}: 1 {baseCurrency} = {localCurrency}
                    </Text>
                    <Text style={styles.marketPriceSub}>{formatCurrencyInfo('base_asset_cost_storage_info')}</Text>
                  </>
                ) : (
                  <Text style={styles.marketPriceSub}>{formatCurrencyInfo('asset_cost_storage_info')}</Text>
                )}
              </FormRow>
            </>
          ) : null}

          {selectedAsset ? <View style={styles.footerSection}>
            {totalCostPreviewUSD > 0 && (
              <View style={styles.totalPreview}>
                <Text style={styles.totalPreviewLabel}>{t('total_cost')}</Text>
                <Text style={styles.totalPreviewValue}>{formatCurrency(totalCostLocal, localCurrency, totalCostLocal < 1 ? 4 : 2)}</Text>
                <Text style={styles.totalPreviewSub}>{t('usd_equivalent')}: {formatUSD(totalCostPreviewUSD)}</Text>
                {currentMarketPriceUSD ? (
                  <>
                    <Text style={styles.totalPreviewSub}>
                      {t('current_value')} ({localCurrency}): {formatCurrency(currentValueLocal, localCurrency, currentValueLocal < 1 ? 4 : 2)}
                    </Text>
                    <Text style={styles.totalPreviewSub}>{t('current_value')} (USD): {formatUSD(currentValueUSD)}</Text>
                  </>
                ) : null}
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.gradientStart, Colors.gradientEnd]}
                style={styles.saveBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>{t('add_to_portfolio')}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <AssetPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={setSelectedAsset}
        currentId={selectedAsset?.id}
        assets={pickerAssets}
        t={t}
      />
      <PlatformPickerModal
        visible={platformPickerVisible}
        onClose={() => setPlatformPickerVisible(false)}
        platforms={platformOptions}
        selectedPlatform={sourcePlatform}
        defaultPlatform={defaultInvestmentPlatform}
        language={language}
        onSelect={setSourcePlatform}
        onAdd={addInvestmentPlatform}
        onDelete={async (platformName) => {
          await removeInvestmentPlatform(platformName);
          await reloadPortfolio();
          if (sourcePlatform === platformName) {
            setSourcePlatform(defaultInvestmentPlatform);
          }
        }}
        t={t}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },

  authGate: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  authGateIcon: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 22,
  },
  authGateTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  authGateSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 26,
  },
  authGateBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  authGateBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },

  formRow: { marginBottom: 16 },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  input: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: 0,
  },
  borderlessInput: {
    flex: 1,
    marginBottom: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  noLeftRadius: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },

  inputWithSuffix: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  inputSuffix: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: Colors.inputBg,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  inputSuffixText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  inputPrefix: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: Colors.inputBg,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  inputPrefixText: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },

  currencyTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  currencyTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
  },
  currencyTabActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.primary,
  },
  currencyTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  currencyTabTextActive: {
    color: Colors.primary,
  },

  assetPickerBtn: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assetPickerSelected: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  assetPickerEmoji: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  assetPickerName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  assetPickerType: { fontSize: 12, color: Colors.textLight, textTransform: 'capitalize' },
  assetPickerPlaceholder: { fontSize: 16, color: Colors.textLight },
  platformPickerBtn: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformPickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  platformPickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformPickerTextWrap: { flex: 1 },
  platformPickerText: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  platformPickerPlaceholder: { color: Colors.textLight },
  platformPickerHint: { fontSize: 11, color: Colors.textSecondary, marginTop: 3, fontWeight: '600' },

  marketPriceInfo: {
    backgroundColor: Colors.accentLight,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    gap: 4,
  },
  marketPriceText: { fontSize: 13, color: Colors.textSecondary },
  marketPriceVal: { fontWeight: '800', color: Colors.primary },
  marketPriceSub: { fontSize: 12, color: Colors.textSecondary },
  autofillBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  autofillText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  totalPreview: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalPreviewLabel: { fontSize: 12, color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalPreviewValue: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginVertical: 4 },
  totalPreviewSub: { fontSize: 13, color: Colors.textSecondary },

  footerSection: {
    marginTop: 'auto',
    paddingTop: 12,
  },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  modalRoot: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cardBg,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  platformGuide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    margin: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
  },
  platformGuideText: { flex: 1, fontSize: 12, lineHeight: 17, color: Colors.textPrimary, fontWeight: '700' },
  platformList: { flex: 1, minHeight: 0 },
  platformListContent: { paddingHorizontal: 16, paddingBottom: 16 },
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  platformItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.accentLight,
  },
  platformIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformItemSelect: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  platformItemCopy: { flex: 1 },
  platformItemText: { fontSize: 15, color: Colors.textPrimary, fontWeight: '800' },
  platformItemSub: { fontSize: 11, color: Colors.textLight, fontWeight: '700', marginTop: 2 },
  platformDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerLight,
  },
  platformAddBox: {
    flexShrink: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.cardBg,
  },
  platformAddTitle: { fontSize: 13, fontWeight: '800', color: Colors.textSecondary, marginBottom: 8 },
  platformAddInput: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  platformAddButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  platformAddButtonDisabled: { opacity: 0.45 },
  platformAddButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    margin: 16,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  assetCategoryTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 4,
    borderRadius: 14,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  assetCategoryTab: {
    flex: 1,
    minWidth: 0,
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  assetCategoryTabActive: {
    backgroundColor: Colors.primary,
  },
  assetCategoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    textAlign: 'center',
    flexShrink: 1,
  },
  assetCategoryTextActive: {
    color: '#fff',
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  assetItemActive: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.accentLight,
  },
  assetItemEmoji: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  assetItemInfo: { flex: 1 },
  assetItemName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  assetItemSymbol: { fontSize: 12, color: Colors.textLight, fontWeight: '700', marginTop: 3 },

  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 52,
  },
  dateTriggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateTriggerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateTriggerText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  dateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dateSheet: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  dateSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  dateSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dateSheetBtn: { minWidth: 50 },
  dateSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dateSheetCancel: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dateSheetConfirm: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '700',
    textAlign: 'right',
  },
  datePickerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  datePickerIOS: {
    width: 320,
    maxWidth: '100%',
  },
});
