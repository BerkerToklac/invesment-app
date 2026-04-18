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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export default function OnboardingScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { email } = route.params;
  const { updateProfile } = useAuth();

  const [name, setName]   = useState('');
  const [age, setAge]     = useState('');
  const [loading, setLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [ageFocused, setAgeFocused]   = useState(false);

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
  const displayName = name.trim() || 'Kullanıcı';
  const parsedAge   = parseInt(age, 10);
  const ageValid    = age === '' || (parsedAge >= 10 && parsedAge <= 120);
  const canContinue = name.trim().length >= 2 && (age === '' || ageValid);

  const handleSave = async () => {
    if (name.trim().length < 2) {
      Alert.alert('Eksik Bilgi', 'Lütfen en az 2 karakterlik bir isim girin.');
      return;
    }
    if (age && !ageValid) {
      Alert.alert('Geçersiz Yaş', 'Lütfen 10 ile 120 arasında bir yaş girin.');
      return;
    }
    setLoading(true);
    try {
      await updateProfile(name.trim(), age ? parsedAge : null);
      navigation.replace('App');
    } catch (e) {
      Alert.alert('Hata', 'Profil kaydedilemedi.');
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
              <Text style={styles.stepText}>Son adım 🎉</Text>
            </View>
            <Text style={styles.title}>Seni tanıyalım</Text>
            <Text style={styles.subtitle}>
              Portföyünü kişiselleştirmek için{'\n'}birkaç bilgiye ihtiyacımız var.
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
                {name.trim() || 'İsminiz'}
              </Text>
              <Text style={styles.previewDetail}>
                {age ? `${age} yaşında · ` : ''}
                {email}
              </Text>
            </View>
          </Animated.View>

          {/* Form Kartı */}
          <Animated.View
            style={[styles.formCard, { opacity: cardFade, transform: [{ translateY: cardSlide }] }]}
          >
            {/* İsim */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="person-outline" size={15} color="rgba(255,255,255,0.6)" />
                <Text style={styles.fieldLabel}>Ad Soyad</Text>
                <Text style={styles.fieldRequired}>*</Text>
              </View>
              <View style={[styles.fieldInput, nameFocused && styles.fieldInputFocused]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Adınızı girin"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  autoCapitalize="words"
                  returnKeyType="next"
                  maxLength={50}
                  selectionColor="rgba(255,255,255,0.7)"
                />
                {name.trim().length >= 2 && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                )}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.fieldDivider} />

            {/* Yaş */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="calendar-outline" size={15} color="rgba(255,255,255,0.6)" />
                <Text style={styles.fieldLabel}>Yaş</Text>
                <Text style={styles.fieldOptional}>(isteğe bağlı)</Text>
              </View>
              <View style={[styles.fieldInput, ageFocused && styles.fieldInputFocused]}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Yaşınızı girin"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={age}
                  onChangeText={(v) => setAge(v.replace(/[^0-9]/g, '').slice(0, 3))}
                  onFocus={() => setAgeFocused(true)}
                  onBlur={() => setAgeFocused(false)}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  maxLength={3}
                  selectionColor="rgba(255,255,255,0.7)"
                />
                {age && !ageValid && (
                  <Ionicons name="warning" size={18} color={Colors.warning} />
                )}
                {age && ageValid && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                )}
              </View>
              {age && !ageValid && (
                <Text style={styles.fieldError}>Lütfen geçerli bir yaş girin (10–120)</Text>
              )}
            </View>
          </Animated.View>

          {/* Gizlilik notu */}
          <View style={styles.privacyRow}>
            <Ionicons name="lock-closed-outline" size={13} color="rgba(255,255,255,0.4)" />
            <Text style={styles.privacyText}>
              Bilgileriniz yalnızca cihazınızda saklanır.
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
                    Başlayalım
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
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Profil Önizleme
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
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
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 17,
  },

  // Form
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 22,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: 0,
  },
  fieldBlock: { gap: 8, paddingVertical: 4 },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  fieldRequired: { fontSize: 14, color: Colors.danger, fontWeight: '700' },
  fieldOptional: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 2 },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    height: 52,
  },
  fieldInputFocused: {
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  fieldError: {
    fontSize: 12,
    color: Colors.warning,
    marginLeft: 2,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 12,
  },

  // Gizlilik
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
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
