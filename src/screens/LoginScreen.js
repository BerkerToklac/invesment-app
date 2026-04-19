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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import AuthLanguageSelector from '../components/AuthLanguageSelector';
import LegalLinksModal from '../components/LegalLinksModal';

import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const { width } = Dimensions.get('window');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sendLoginCode } = useAuth();
  const { t } = useSettings();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  // Animasyonlar
  const focusBorder = useRef(new Animated.Value(0)).current;
  const iconScale  = useRef(new Animated.Value(0.85)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const titleY     = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const inputY     = useRef(new Animated.Value(30)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(iconScale,   { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(iconOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, friction: 7, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(inputOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(inputY, { toValue: 0, friction: 7, useNativeDriver: true }),
      ]),
      Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(focusBorder, { toValue: 1, duration: 220, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setFocused(false);
    Animated.timing(focusBorder, { toValue: 0, duration: 220, useNativeDriver: false }).start();
  };

  const borderColor = focusBorder.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.85)'],
  });
  const inputBg = focusBorder.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.16)'],
  });

  const isReady = isValidEmail(email.trim());

  const handleContinue = async () => {
    if (!isReady) {
      Alert.alert(t('login_invalid_email_title'), t('login_invalid_email_body'));
      return;
    }
    setLoading(true);
    try {
      await sendLoginCode(email.trim().toLowerCase());
      navigation.navigate('OTP', { email: email.trim().toLowerCase() });
    } catch {
      Alert.alert(t('error'), t('login_code_send_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
      style={styles.gradient}
    >
      {/* dekoratif daireler */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Geri butonu */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <AuthLanguageSelector />
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.inner, { paddingBottom: insets.bottom + 32 }]}>

          {/* İkon */}
          <Animated.View style={[styles.iconWrap, { opacity: iconOpacity, transform: [{ scale: iconScale }] }]}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail" size={32} color={Colors.primary} />
            </View>
            {/* Parlama halkası */}
            <View style={styles.iconRing} />
          </Animated.View>

          {/* Başlık */}
          <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], alignItems: 'center' }}>
            <Text style={styles.title}>{t('login_email_title')}</Text>
            <Text style={styles.subtitle}>
              {t('login_email_subtitle_line1')}{"\n"}{t('login_email_subtitle_line2')}
            </Text>
          </Animated.View>

          {/* Input */}
          <Animated.View style={{ opacity: inputOpacity, transform: [{ translateY: inputY }], width: '100%' }}>
            <Animated.View style={[styles.inputWrap, { borderColor, backgroundColor: inputBg }]}>
              <Ionicons
                name="mail-outline"
                size={19}
                color={focused ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.75)'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="ornek@email.com"
                placeholderTextColor="rgba(255,255,255,0.82)"
                value={email}
                onChangeText={setEmail}
                onFocus={handleFocus}
                onBlur={handleBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                selectionColor="rgba(255,255,255,0.8)"
              />
              {/* Geçerli email checkmark */}
              {isReady && (
                <View style={styles.validBadge}>
                  <Ionicons name="checkmark" size={14} color={Colors.success} />
                </View>
              )}
            </Animated.View>

            {/* Alt hint */}
            <Text style={styles.inputHint}>
              {focused
                ? t('login_hint_focused')
                : t('login_hint_unfocused')}
            </Text>
          </Animated.View>

          {/* Buton */}
          <Animated.View style={{ opacity: btnOpacity, width: '100%' }}>
            <TouchableOpacity
              style={[styles.btn, !isReady && styles.btnDisabled]}
              onPress={handleContinue}
              disabled={loading || !isReady}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <Text style={[styles.btnText, !isReady && styles.btnTextDisabled]}>
                    {t('login_continue')}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={19}
                    color={isReady ? Colors.primary : 'rgba(100,116,139,0.6)'}
                  />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Güvenlik notu */}
          <View style={styles.securityRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color="rgba(255,255,255,0.45)" />
            <Text style={styles.securityText}>
              {t('login_security_note')}
            </Text>
          </View>

          <LegalLinksModal />

        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },

  circle1: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -100,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 60,
    left: -60,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  kav: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },

  // İkon
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 14,
    zIndex: 2,
  },
  iconRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  // Başlık
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },

  // Input
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 58,
    width: '100%',
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  validBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  btnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
  },
  btnTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },

  // Güvenlik notu
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
});
