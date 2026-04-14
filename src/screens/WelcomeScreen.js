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

const { width, height } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'trending-up-outline',
    color: Colors.success,
    bg: Colors.successLight,
    title: 'Anlık Kur Takibi',
    desc: 'USD, EUR, Altın, Gümüş ve kripto paralar canlı olarak takip edilir.',
  },
  {
    icon: 'pie-chart-outline',
    color: Colors.primaryLight,
    bg: Colors.accentLight,
    title: 'Portföy Analizi',
    desc: 'Yatırımlarının dağılımını, maliyetini ve kar/zararını görselleştir.',
  },
  {
    icon: 'shield-checkmark-outline',
    color: Colors.warning,
    bg: Colors.warningLight,
    title: 'Güvenli & Yerel',
    desc: 'Tüm veriler yalnızca cihazında saklanır, hiçbir yere gönderilmez.',
  },
];

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

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
          <Text style={styles.appName}>Portföy</Text>
          <Text style={styles.headline}>
            Tüm yatırımların{'\n'}tek bir yerde
          </Text>
          <Text style={styles.subHeadline}>
            Döviz, altın ve kripto portföyünü{'\n'}gerçek zamanlı verilerle takip et.
          </Text>
        </Animated.View>

        {/* Feature kartları */}
        <Animated.View
          style={[
            styles.featuresSection,
            { opacity: cardsOpacity, transform: [{ translateY: cardsY }] },
          ]}
        >
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon} size={22} color={f.color} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
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
            <Text style={styles.loginBtnText}>Giriş Yap</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Devam ederek Kullanım Şartlarını kabul etmiş olursunuz.
          </Text>
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
    color: 'rgba(255,255,255,0.7)',
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
    color: 'rgba(255,255,255,0.7)',
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
    color: 'rgba(255,255,255,0.65)',
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
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
