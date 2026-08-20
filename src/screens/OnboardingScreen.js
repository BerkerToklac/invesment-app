import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import AuthLanguageSelector from '../components/AuthLanguageSelector';
import { useSettings } from '../context/SettingsContext';
import { CURRENCY_META, LOCAL_CURRENCY_OPTIONS } from '../utils/currency';

function CurrencyStrip({ title, value, onChange, language, options = LOCAL_CURRENCY_OPTIONS }) {
  return (
    <View style={styles.currencyBlock}>
      <View style={styles.fieldLabelRow}>
        <Ionicons name="cash-outline" size={15} color={Colors.primary} />
        <Text style={styles.fieldLabel}>{title}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.currencyStrip}
        style={styles.currencyStripScroll}
      >
        {options.map((currency) => {
          const meta = CURRENCY_META[currency] || {};
          const selected = value === currency;
          return (
            <TouchableOpacity
              key={`${title}-${currency}`}
              style={[styles.currencyChip, selected && styles.currencyChipActive]}
              onPress={() => onChange(currency)}
              activeOpacity={0.85}
            >
              <Text style={[styles.currencyChipCode, selected && styles.currencyChipCodeActive]}>
                {currency}
              </Text>
              <Text style={[styles.currencyChipName, selected && styles.currencyChipNameActive]} numberOfLines={1}>
                {language === 'en' ? meta.name : meta.localName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function OnboardingScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();
  const email = route?.params?.email || user?.email || '';
  const { baseCurrency, localCurrency, language, applyCurrencyPreferencesLocally, t } = useSettings();

  const [name, setName]   = useState('');
  const [selectedBaseCurrency, setSelectedBaseCurrency] = useState(baseCurrency || 'USD');
  const [selectedLocalCurrency, setSelectedLocalCurrency] = useState(localCurrency || 'TRY');
  const [loading, setLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const submittingRef = useRef(false);

  // Giriş animasyonları
  const fadeIn   = useRef(new Animated.Value(0)).current;
  const slideUp  = useRef(new Animated.Value(40)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;
  const btnFade  = useRef(new Animated.Value(0)).current;

  // Profil önizleme animasyonu
  const avatarScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideUp, { toValue: 0, friction: 7, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(cardSlide, { toValue: 0, friction: 7, useNativeDriver: true }),
      ]),
      Animated.timing(btnFade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  // Avatar animasyonu adı değiştikçe
  useEffect(() => {
    Animated.spring(avatarScale, {
      toValue: name.trim() ? 1.0 : 0.85,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [name]);

  const firstLetter = name.trim() ? name.trim()[0].toUpperCase() : null;
  const canContinue = name.trim().length >= 2;
  const localCurrencyOptions = [
    'TRY',
    ...LOCAL_CURRENCY_OPTIONS.filter((currency) => currency !== 'TRY'),
  ];

  const handleSave = async () => {
    if (submittingRef.current) return;

    if (name.trim().length < 2) {
      Alert.alert(t('onboarding_missing_info_title'), t('onboarding_missing_info_body'));
      return;
    }

    submittingRef.current = true;
    Keyboard.dismiss();
    setLoading(true);
    try {
      await updateProfile(name.trim(), {
        baseCurrency: selectedBaseCurrency,
        localCurrency: selectedLocalCurrency,
      });
      await applyCurrencyPreferencesLocally({ baseCurrency: selectedBaseCurrency, localCurrency: selectedLocalCurrency });
    } catch (e) {
      Alert.alert(t('error'), t('onboarding_save_error'));
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
      style={styles.gradient}
    >
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={[styles.langWrap, { top: insets.top + 10 }]}> 
        <AuthLanguageSelector />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.inner,
            { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Üst başlık */}
          <Animated.View
            style={[styles.header, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}
          >
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>{t('onboarding_step_badge')} 🎉</Text>
            </View>
            <Text style={styles.title}>{t('onboarding_title')}</Text>
            <Text style={styles.subtitle}>
              {t('onboarding_subtitle_line1')}{'\n'}{t('onboarding_subtitle_line2')}
            </Text>
          </Animated.View>

          {/* Profil Önizleme Kartı */}
          <Animated.View
            style={[styles.previewCard, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}
          >
            {/* Avatar */}
            <Animated.View style={[styles.avatarWrap, { transform: [{ scale: avatarScale }] }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(230,235,255,0.95)']}
                style={styles.avatarGradient}
              >
                {firstLetter ? (
                  <Text style={styles.avatarLetter}>{firstLetter}</Text>
                ) : (
                  <Ionicons name="person" size={32} color={Colors.primary} />
                )}
              </LinearGradient>
              <View style={styles.avatarRing} />
            </Animated.View>

            <View style={styles.previewInfo}>
              <Text style={styles.previewName} numberOfLines={1}>
                {name.trim() || t('onboarding_name_placeholder')}
              </Text>
              <Text style={styles.previewDetail}>
                {email}
              </Text>
            </View>
          </Animated.View>

          {/* Form Kartı */}
          <Animated.View
            style={[styles.formCard, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}
          >
            <View style={styles.currencyNotice}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
              <View style={styles.currencyNoticeCopy}>
                <Text style={styles.currencyNoticeTitle}>{t('currency_preferences')}</Text>
                <Text style={styles.currencyNoticeText}>{t('onboarding_currency_intro')}</Text>
                <Text style={styles.currencyNoticeText}>{t('onboarding_currency_notice')}</Text>
              </View>
            </View>

            <CurrencyStrip
              title={t('base_currency')}
              value={selectedBaseCurrency}
              onChange={setSelectedBaseCurrency}
              language={language}
            />

            <CurrencyStrip
              title={t('local_currency')}
              value={selectedLocalCurrency}
              onChange={setSelectedLocalCurrency}
              language={language}
              options={localCurrencyOptions}
            />

            {/* İsim */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="person-outline" size={15} color={Colors.primary} />
                <Text style={styles.fieldLabel}>{t('onboarding_name_placeholder')}</Text>
                <Text style={styles.fieldRequired}>*</Text>
              </View>
              <View style={[styles.fieldInput, nameFocused && styles.fieldInputFocused]}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('onboarding_name_input_placeholder')}
                  placeholderTextColor="rgba(255,255,255,0.75)"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  editable={!loading}
                  maxLength={50}
                  selectionColor="rgba(255,255,255,0.95)"
                />
                {name.trim().length >= 2 && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                )}
              </View>
            </View>
          </Animated.View>

          {/* Gizlilik notu */}
          <View style={styles.privacyRow}>
            <Ionicons name="lock-closed-outline" size={13} color="rgba(255,255,255,0.4)" />
            <Text style={styles.privacyText}>
              {t('onboarding_privacy_note')}
            </Text>
          </View>

          {/* Devam Butonu */}
          <Animated.View style={{ opacity: btnFade, width: '100%' }}>
            <TouchableOpacity
              style={[styles.btn, !canContinue && styles.btnDisabled]}
              onPress={handleSave}
              disabled={loading || !canContinue}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <Text style={[styles.btnText, !canContinue && styles.btnTextDisabled]}>
                    {t('onboarding_start')}
                  </Text>
                  <Ionicons
                    name="rocket-outline"
                    size={20}
                    color={canContinue ? Colors.primary : 'rgba(100,116,139,0.5)'}
                  />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },

  circle1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -60,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 40,
    left: -50,
  },

  inner: {
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 22,
  },
  langWrap: {
    position: 'absolute',
    right: 20,
    zIndex: 20,
  },

  // Başlık
  header: { alignItems: 'center', gap: 10 },
  stepBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  stepText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '700',
  },

  // Profil Önizleme
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
  },
  avatarWrap: { position: 'relative', width: 60, height: 60 },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarLetter: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
  },
  avatarRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    top: -4,
    left: -4,
  },
  previewInfo: { flex: 1 },
  previewName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  previewDetail: {
    fontSize: 12,
    color: '#fff',
    lineHeight: 17,
    fontWeight: '700',
  },

  // Form
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 22,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    gap: 16,
  },
  fieldBlock: { gap: 8, paddingVertical: 4 },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  fieldRequired: { fontSize: 14, color: Colors.danger, fontWeight: '700' },
  fieldOptional: { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginLeft: 2 },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 52,
  },
  fieldInputFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  currencyBlock: { gap: 8, width: '100%' },
  currencyStripScroll: { width: '100%', flexGrow: 0 },
  currencyStrip: { gap: 8, paddingRight: 6 },
  currencyChip: {
    width: 104,
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1.3,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  currencyChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.accentLight,
  },
  currencyChipCode: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  currencyChipCodeActive: { color: Colors.primary },
  currencyChipName: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 3,
    fontWeight: '700',
  },
  currencyChipNameActive: { color: Colors.textPrimary },
  currencyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    padding: 10,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
  },
  currencyNoticeCopy: { flex: 1, gap: 4 },
  currencyNoticeTitle: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  currencyNoticeText: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 17,
    fontWeight: '700',
  },

  // Gizlilik
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },

  // Buton
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    height: 58,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  btnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
  },
  btnTextDisabled: {
    color: 'rgba(255,255,255,0.45)',
  },
});
