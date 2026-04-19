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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../theme/colors';
import { usePortfolio } from '../context/PortfolioContext';
import { useMarket } from '../context/MarketContext';
import { useSettings } from '../context/SettingsContext';
import { PREDEFINED_ASSETS, getLocalizedAssetName } from '../utils/assets';
import { formatUSD, toIstanbulDateStr, formatDateLong } from '../utils/formatters';
import { convertCurrencyToUSD, convertUSDToCurrency, formatCurrency, getCurrencySymbol, getLocalCurrencyOptions } from '../utils/currency';

const HOME_ASSET_IDS = ['usd', 'eur', 'gold-gram', 'silver-gram', 'gold-oz', 'silver-oz', 'btc', 'bnb', 'xrp'];

function sanitizeTwoDecimalInput(value) {
  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const parts = normalized.split('.');
  if (parts.length === 1) return parts[0];
  const integerPart = parts[0];
  const decimalPart = parts.slice(1).join('').slice(0, 2);
  return `${integerPart}.${decimalPart}`;
}

function DatePickerField({ value, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  const formatted = formatDateLong(value);

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
                <Text style={styles.dateSheetCancel}>İptal</Text>
              </TouchableOpacity>
              <Text style={styles.dateSheetTitle}>Tarih Seç</Text>
              <TouchableOpacity onPress={handleConfirm} style={styles.dateSheetBtn}>
                <Text style={styles.dateSheetConfirm}>Tamam</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleChange}
              maximumDate={new Date()}
              minimumDate={new Date(2000, 0, 1)}
              locale="tr-TR"
              style={{ width: '100%' }}
            />
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

function AssetPickerModal({ visible, onClose, onSelect, currentId, assets, t }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      assets.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          (a.shortName || '').toLowerCase().includes(search.toLowerCase())
      ),
    [assets, search]
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
                <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
              </View>
              <View style={styles.assetItemInfo}>
                <Text style={styles.assetItemName}>{item.name}</Text>
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

export default function AddInvestmentScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { addHolding } = usePortfolio();
  const { getAssetPrice, prices } = useMarket();
  const { localCurrency, language, t } = useSettings();

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [date, setDate] = useState(new Date());
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [priceCurrency, setPriceCurrency] = useState(localCurrency);
  const [loading, setLoading] = useState(false);
  const isUsdAsset = selectedAsset?.id === 'usd';

  const priceCurrencyOptions = useMemo(() => getLocalCurrencyOptions(localCurrency), [localCurrency]);

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
    setPriceCurrency((current) => (priceCurrencyOptions.includes(current) ? current : localCurrency));
  }, [localCurrency, priceCurrencyOptions]);

  useEffect(() => {
    if (!selectedAsset) return;
    if (selectedAsset.id === 'usd') {
      setPriceCurrency(localCurrency);
      setBuyPrice(localCurrency === 'USD' ? '1' : '');
      return;
    }

    setPriceCurrency(localCurrency);
    setBuyPrice('');
  }, [localCurrency, selectedAsset?.id]);

  const currentMarketPriceUSD = selectedAsset ? getAssetPrice(selectedAsset.id) : null;
  const currentMarketPrice = currentMarketPriceUSD
    ? (priceCurrency === 'USD' ? currentMarketPriceUSD : convertUSDToCurrency(currentMarketPriceUSD, priceCurrency, prices))
    : null;
  const localMarketPrice = currentMarketPriceUSD ? convertUSDToCurrency(currentMarketPriceUSD, localCurrency, prices) : null;
  const buyPriceNumber = isUsdAsset
    ? (localCurrency === 'USD' ? 1 : (parseFloat(buyPrice) || 0))
    : (parseFloat(buyPrice) || 0);
  const buyPriceUSD = isUsdAsset ? 1 : convertCurrencyToUSD(buyPriceNumber, priceCurrency, prices);
  const amountNumber = parseFloat(amount) || 0;
  const totalCostUSD = amountNumber * buyPriceUSD;
  const totalCostLocal = convertUSDToCurrency(totalCostUSD, localCurrency, prices);
  const currentValueUSD = amountNumber * (currentMarketPriceUSD || 0);
  const currentValueLocal = convertUSDToCurrency(currentValueUSD, localCurrency, prices);

  const autofillPrice = () => {
    if (isUsdAsset) {
      Alert.alert(t('info') || 'Bilgi', 'USD varlığında alış kuru manuel girilir.');
      return;
    }

    if (!currentMarketPrice) {
      Alert.alert(t('price_unavailable'), t('price_unavailable_sub'));
      return;
    }
    setBuyPrice(sanitizeTwoDecimalInput(currentMarketPrice.toFixed(2)));
  };

  const validate = () => {
    if (!selectedAsset) return t('select_asset_error');
    if (!amount || amountNumber <= 0) return t('valid_amount_error');
    if (isUsdAsset && localCurrency !== 'USD' && (!buyPrice || buyPriceNumber <= 0)) return t('valid_purchase_price_error');
    if (!isUsdAsset && (!buyPrice || buyPriceNumber <= 0)) return t('valid_purchase_price_error');
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

      if (isUsdAsset) {
        buyLocalCurrency = localCurrency;
        buyFxLocalPerUSD = localCurrency === 'USD' ? 1 : buyPriceNumber;

        if (buyFxLocalPerUSD == null) {
          Alert.alert(t('error'), 'Alış kuru girilmedi, USD işlemi kaydedilemedi.');
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
        color: selectedAsset.color,
        buyDate: toIstanbulDateStr(date),
        amount: amountNumber,
        buyPriceUSD,
        buyLocalCurrency,
        buyFxLocalPerUSD,
        buyLocalTotal,
        note: '',
      });

      Alert.alert(t('success'), `${selectedAsset.name} ${t('added_to_portfolio')}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(t('error'), t('add_investment_error'));
    } finally {
      setLoading(false);
    }
  };

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
                    <Text style={{ fontSize: 20 }}>{selectedAsset.emoji}</Text>
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

              <FormRow label={isUsdAsset ? `Alış Kuru (${localCurrency}/USD) *` : `${t('purchase_price')} (${priceCurrency}) *`}>
                {!isUsdAsset && (
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

                {!isUsdAsset && currentMarketPrice && (
                  <View style={styles.marketPriceInfo}>
                    <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                    <Text style={styles.marketPriceText}>
                      {t('current_price')}: <Text style={styles.marketPriceVal}>{formatCurrency(currentMarketPrice, priceCurrency, currentMarketPrice < 1 ? 4 : 2)}</Text>
                    </Text>
                    {priceCurrency !== 'USD' && currentMarketPriceUSD ? (
                      <Text style={styles.marketPriceSub}>USD: {formatUSD(currentMarketPriceUSD, currentMarketPriceUSD < 1 ? 4 : 2)}</Text>
                    ) : null}
                    {priceCurrency !== localCurrency && localMarketPrice ? (
                      <Text style={styles.marketPriceSub}>{localCurrency}: {formatCurrency(localMarketPrice, localCurrency, localMarketPrice < 1 ? 4 : 2)}</Text>
                    ) : null}
                    <TouchableOpacity style={styles.autofillBtn} onPress={autofillPrice}>
                      <Text style={styles.autofillText}>{t('use')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isUsdAsset && localCurrency !== 'USD' && currentMarketPrice && (
                  <View style={styles.marketPriceInfo}>
                    <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                    <Text style={styles.marketPriceText}>
                      Referans güncel kur: <Text style={styles.marketPriceVal}>{formatCurrency(currentMarketPrice, localCurrency, 2)}</Text>
                    </Text>
                    <Text style={styles.marketPriceSub}>Geçmiş işlemin için alış kurunu elle girebilirsin.</Text>
                    <TouchableOpacity
                      style={styles.autofillBtn}
                      onPress={() => setBuyPrice(sanitizeTwoDecimalInput(currentMarketPrice.toFixed(2)))}
                    >
                      <Text style={styles.autofillText}>{t('use')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.inputWithSuffix}>
                  <View style={styles.inputPrefix}>
                    <Text style={styles.inputPrefixText}>{getCurrencySymbol(priceCurrency)}</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.borderlessInput, styles.noLeftRadius]}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textLight}
                    value={buyPrice}
                    onChangeText={(v) => setBuyPrice(sanitizeTwoDecimalInput(v))}
                    keyboardType="decimal-pad"
                    editable={!(isUsdAsset && localCurrency === 'USD')}
                  />
                </View>
                {isUsdAsset ? (
                  <Text style={styles.marketPriceSub}>
                    USD birim fiyatı sabit 1 USD. Bu alanda 1 USD'nin {localCurrency} karşılığını giriyorsun.
                  </Text>
                ) : null}
              </FormRow>
            </>
          ) : null}

          {selectedAsset ? <View style={styles.footerSection}>
            {totalCostUSD > 0 && (
              <View style={styles.totalPreview}>
                <Text style={styles.totalPreviewLabel}>{t('total_cost')}</Text>
                <Text style={styles.totalPreviewValue}>{formatCurrency(totalCostLocal, localCurrency, totalCostLocal < 1 ? 4 : 2)}</Text>
                <Text style={styles.totalPreviewSub}>{t('usd_equivalent')}: {formatUSD(totalCostUSD)}</Text>
                {currentMarketPriceUSD ? (
                  <>
                    <Text style={styles.totalPreviewSub}>
                      {t('current_value')} ({localCurrency}): {formatCurrency(currentValueLocal, localCurrency, currentValueLocal < 1 ? 4 : 2)}
                    </Text>
                    <Text style={styles.totalPreviewSub}>Güncel değer (USD): {formatUSD(currentValueUSD)}</Text>
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
});
