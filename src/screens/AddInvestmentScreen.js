import React, { useState, useMemo } from 'react';
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
import { PREDEFINED_ASSETS } from '../utils/assets';
import { formatUSD, toIstanbulDateStr, formatDateLong } from '../utils/formatters';

// ── Tarih Seçici ─────────────────────────────────────────────────────────────
function DatePickerField({ value, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  // Istanbul saatiyle Türkçe uzun format: "13 Nisan 2026"
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
      {/* Seçici buton */}
      <TouchableOpacity style={styles.dateTrigger} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
        <View style={styles.dateTriggerLeft}>
          <View style={styles.dateTriggerIcon}>
            <Ionicons name="calendar" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.dateTriggerText}>{formatted}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
      </TouchableOpacity>

      {/* iOS → alt sheet modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <TouchableOpacity
            style={styles.dateOverlay}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          />
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

      {/* Android → native dialog */}
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

function AssetPickerModal({ visible, onClose, onSelect, currentId }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      PREDEFINED_ASSETS.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          (a.shortName || '').toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Varlık Seç</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Varlık ara..."
            placeholderTextColor={Colors.textLight}
            value={search}
            onChangeText={setSearch}
            autoFocus
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
                <Text style={styles.assetItemSub}>{item.shortName} · {item.type}</Text>
              </View>
              {item.id === currentId && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              )}
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
  const { getAssetPrice } = useMarket();

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [date, setDate] = useState(new Date());
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);

  const currentMarketPrice = selectedAsset ? getAssetPrice(selectedAsset.id) : null;

  const totalCostUSD = useMemo(() => {
    const a = parseFloat(amount) || 0;
    const p = parseFloat(buyPrice) || 0;
    return a * p;
  }, [amount, buyPrice]);

  const autofillPrice = () => {
    if (!currentMarketPrice) {
      Alert.alert('Fiyat Bulunamadı', 'Bu varlık için güncel fiyat alınamadı.');
      return;
    }
    setBuyPrice(currentMarketPrice.toString());
  };

  const validate = () => {
    if (!selectedAsset) return 'Lütfen bir varlık seçin.';
    if (selectedAsset.id === 'custom' && !customName.trim()) return 'Lütfen varlık adı girin.';
    if (!amount || parseFloat(amount) <= 0) return 'Geçerli bir miktar girin.';
    if (!buyPrice || parseFloat(buyPrice) <= 0) return 'Geçerli bir alış fiyatı girin.';
    if (!date) return 'Tarih seçin.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Eksik Bilgi', err);
      return;
    }

    setLoading(true);
    try {
      const assetName = selectedAsset.id === 'custom' ? customName.trim() : selectedAsset.name;
      await addHolding({
        assetId: selectedAsset.id,
        assetName,
        type: selectedAsset.type,
        emoji: selectedAsset.emoji,
        color: selectedAsset.color,
        date: toIstanbulDateStr(date),
        amount: parseFloat(amount),
        buyPriceUSD: parseFloat(buyPrice),
        notes: '',
      });
      Alert.alert('Başarılı', `${assetName} portföyüne eklendi.`, [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Hata', 'Yatırım eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yatırım Ekle</Text>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Asset Picker */}
          <FormRow label="Varlık *">
            <TouchableOpacity style={styles.assetPickerBtn} onPress={() => setPickerVisible(true)}>
              {selectedAsset ? (
                <View style={styles.assetPickerSelected}>
                  <View style={[styles.assetPickerEmoji, { backgroundColor: selectedAsset.color + '20' }]}>
                    <Text style={{ fontSize: 20 }}>{selectedAsset.emoji}</Text>
                  </View>
                  <View>
                    <Text style={styles.assetPickerName}>{selectedAsset.name}</Text>
                    <Text style={styles.assetPickerType}>{selectedAsset.type}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.assetPickerPlaceholder}>Varlık seçin...</Text>
              )}
              <Ionicons name="chevron-down" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          </FormRow>

          {/* Custom name input */}
          {selectedAsset?.id === 'custom' && (
            <FormRow label="Varlık Adı *">
              <TextInput
                style={styles.input}
                placeholder="Örn: BIST Hisse, Fon..."
                placeholderTextColor={Colors.textLight}
                value={customName}
                onChangeText={setCustomName}
              />
            </FormRow>
          )}

          {/* Current Market Price info */}
          {selectedAsset && currentMarketPrice && (
            <View style={styles.marketPriceInfo}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
              <Text style={styles.marketPriceText}>
                Güncel fiyat: <Text style={styles.marketPriceVal}>{formatUSD(currentMarketPrice)}</Text>
              </Text>
              <TouchableOpacity style={styles.autofillBtn} onPress={autofillPrice}>
                <Text style={styles.autofillText}>Kullan</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Date */}
          <FormRow label="Alış Tarihi *">
            <DatePickerField value={date} onChange={setDate} />
          </FormRow>

          {/* Amount */}
          <FormRow label="Miktar *">
            <View style={styles.inputWithSuffix}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="0.00"
                placeholderTextColor={Colors.textLight}
                value={amount}
                onChangeText={(v) => setAmount(v.replace(',', '.'))}
                keyboardType="decimal-pad"
              />
              {selectedAsset && (
                <View style={styles.inputSuffix}>
                  <Text style={styles.inputSuffixText}>{selectedAsset.unit || selectedAsset.shortName}</Text>
                </View>
              )}
            </View>
          </FormRow>

          {/* Buy Price */}
          <FormRow label="Alış Fiyatı (USD) *">
            <View style={styles.inputWithSuffix}>
              <View style={styles.inputPrefix}>
                <Text style={styles.inputPrefixText}>$</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                placeholder="0.00"
                placeholderTextColor={Colors.textLight}
                value={buyPrice}
                onChangeText={(v) => setBuyPrice(v.replace(',', '.'))}
                keyboardType="decimal-pad"
              />
            </View>
          </FormRow>

          {/* Total Cost Preview */}
          {totalCostUSD > 0 && (
            <View style={styles.totalPreview}>
              <Text style={styles.totalPreviewLabel}>Toplam Maliyet</Text>
              <Text style={styles.totalPreviewValue}>{formatUSD(totalCostUSD)}</Text>
              {currentMarketPrice && (
                <Text style={styles.totalPreviewSub}>
                  Güncel değer: {formatUSD(parseFloat(amount || 0) * currentMarketPrice)}
                </Text>
              )}
            </View>
          )}

          {/* Save Button */}
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
                  <Text style={styles.saveBtnText}>Portföye Ekle</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <AssetPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={setSelectedAsset}
        currentId={selectedAsset?.id}
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
  formLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F2FF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  marketPriceText: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  marketPriceVal: { fontWeight: '800', color: Colors.primary },
  autofillBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
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

  // Modal styles
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
    backgroundColor: '#F0F2FF',
  },
  assetItemEmoji: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  assetItemInfo: { flex: 1 },
  assetItemName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  assetItemSub: { fontSize: 12, color: Colors.textLight, marginTop: 2, textTransform: 'capitalize' },

  // ── Tarih Seçici ──────────────────────────────────────────────────────────
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
    backgroundColor: '#F0F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateTriggerText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // iOS bottom sheet
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
