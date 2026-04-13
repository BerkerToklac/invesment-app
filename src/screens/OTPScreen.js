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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';

const OTP_LENGTH = 6;
// Demo mode: any 6-digit code works
const DEMO_CODE = '123456';

export default function OTPScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { email } = route.params;
  const { login } = useAuth();

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputs = useRef([]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value.replace(/[^0-9]/g, '').slice(-1);
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (index === OTP_LENGTH - 1 && value) {
      const code = [...newOtp.slice(0, OTP_LENGTH - 1), value.replace(/[^0-9]/g, '').slice(-1)].join('');
      if (code.length === OTP_LENGTH) {
        handleVerify(code);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      Alert.alert('Eksik Kod', '6 haneli kodu tam girin.');
      return;
    }

    // Demo: accept any 6-digit code
    if (!/^\d{6}$/.test(otpCode)) {
      Alert.alert('Geçersiz Kod', 'Lütfen sadece rakam girin.');
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      // Daha önce kayıt olmuş ve profilini tamamlamış kullanıcı mı?
      const existing = await StorageService.getUser();
      if (existing && existing.email === email && existing.name) {
        await login(email, existing.name, existing.age);
      } else {
        // Yeni kullanıcı → Onboarding
        navigation.replace('Onboarding', { email });
      }
    } catch (e) {
      Alert.alert('Hata', 'Doğrulama başarısız. Lütfen tekrar deneyin.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCountdown(60);
    setCanResend(false);
    setOtp(Array(OTP_LENGTH).fill(''));
    inputs.current[0]?.focus();
    Alert.alert('Kod Gönderildi', `${email} adresine yeni kod gönderildi.\n\n(Demo: Herhangi 6 rakam girin)`);
  };

  const maskedEmail = email.replace(/(.{2})(.+)(@.+)/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

  return (
    <LinearGradient colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]} style={styles.gradient}>
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Kodu Girin</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.emailText}>{maskedEmail}</Text>
            {'\n'}adresine 6 haneli kod gönderdik.
          </Text>
          <View style={styles.demoBadge}>
            <Ionicons name="information-circle" size={14} color={Colors.warning} />
            <Text style={styles.demoText}>Demo: Herhangi 6 rakam girin</Text>
          </View>
        </View>

        {/* OTP Input */}
        <View style={styles.card}>
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputs.current[index] = ref)}
                style={[styles.otpInput, digit && styles.otpInputFilled, loading && styles.otpInputDisabled]}
                value={digit}
                onChangeText={(v) => handleOtpChange(v, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.verifyBtn, (loading || otp.join('').length !== OTP_LENGTH) && styles.verifyBtnDisabled]}
            onPress={() => handleVerify()}
            disabled={loading || otp.join('').length !== OTP_LENGTH}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.verifyBtnText}>Doğrula</Text>
                <Ionicons name="checkmark" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resendBtn, !canResend && styles.resendBtnDisabled]}
            onPress={handleResend}
            disabled={!canResend}
          >
            <Ionicons name="refresh" size={15} color={canResend ? Colors.primary : Colors.textLight} />
            <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
              {canResend ? 'Kodu Tekrar Gönder' : `Yeniden gönder (${countdown}s)`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24 },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '700',
    color: '#fff',
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  demoText: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  otpInput: {
    width: 46,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F2FF',
  },
  otpInputDisabled: { opacity: 0.6 },

  verifyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  resendBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  resendBtnDisabled: {},
  resendText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: Colors.textLight,
  },
});
