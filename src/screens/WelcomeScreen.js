import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import AuthLanguageSelector from '../components/AuthLanguageSelector';
import LegalLinksModal from '../components/LegalLinksModal';
import { useSettings } from '../context/SettingsContext';

const { width, height } = Dimensions.get('window');

const FEATURE_ITEMS = [
  {
    icon: 'trending-up-outline',
    color: Colors.success,
    bg: Colors.successLight,
    titleKey: 'welcome_feature_live_title',
    descKey: 'welcome_feature_live_desc',
  },
  {
    icon: 'pie-chart-outline',
    color: Colors.primaryLight,
    bg: Colors.accentLight,
    titleKey: 'welcome_feature_portfolio_title',
    descKey: 'welcome_feature_portfolio_desc',
  },
  {
    icon: 'shield-checkmark-outline',
    color: Colors.warning,
    bg: Colors.warningLight,
    titleKey: 'welcome_feature_secure_title',
    descKey: 'welcome_feature_secure_desc',
  },
];

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useSettings();

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(30)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsY = useRef(new Animated.Value(40)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.sequence([
      // Header giriş
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(headerY, { toValue: 0, friction: 7, useNativeDriver: true }),
      ]),
      // Feature kartları
      Animated.parallel([
        Animated.timing(cardsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(cardsY, { toValue: 0, friction: 7, useNativeDriver: true }),
      ]),
      // Buton
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(btnScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
      style={styles.gradient}
    >
      {/* Dekoratif arka plan */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <View style={[styles.langFloating, { top: insets.top + 10 }]}> 
        <AuthLanguageSelector />
      </View>

      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>

        {/* Logo + Başlık */}
        <Animated.View
          style={[
            styles.headerSection,
            { opacity: headerOpacity, transform: [{ translateY: headerY }] },
          ]}
        >
          <View style={styles.logoCircle}>
            <Ionicons name="trending-up" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>{t('portfolio_tab')}</Text>
          <Text style={styles.headline}>
            {t('welcome_headline_line1')}{'\n'}{t('welcome_headline_line2')}
          </Text>
          <Text style={styles.subHeadline}>
            {t('welcome_subheadline_line1')}{'\n'}{t('welcome_subheadline_line2')}
          </Text>
        </Animated.View>

        {/* Feature kartları */}
        <Animated.View
          style={[
            styles.featuresSection,
            { opacity: cardsOpacity, transform: [{ translateY: cardsY }] },
          ]}
        >
          {FEATURE_ITEMS.map((f) => (
            <View key={f.titleKey} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon} size={22} color={f.color} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{t(f.titleKey)}</Text>
                <Text style={styles.featureDesc}>{t(f.descKey)}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Buton */}
        <Animated.View
          style={[
            styles.btnSection,
            { opacity: btnOpacity, transform: [{ scale: btnScale }] },
          ]}
        >
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.88}
          >
            <Text style={styles.loginBtnText}>{t('welcome_cta_login')}</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>

          <LegalLinksModal />
        </Animated.View>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },

  bgCircle1: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -80,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 80,
    left: -80,
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  langFloating: {
    position: 'absolute',
    right: 20,
    zIndex: 20,
  },

  // Header
  headerSection: { alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  subHeadline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 4,
  },

  // Features
  featuresSection: { gap: 10 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 17,
  },

  // Button
  btnSection: { gap: 14 },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 17,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  loginBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  disclaimer: {},
});
