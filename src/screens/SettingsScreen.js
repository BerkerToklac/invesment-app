import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useMarket } from '../context/MarketContext';

function SettingRow({ icon, iconColor, iconBg, label, sub, right, onPress, danger }) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconBg || '#F0F2FF' }]}>
        <Ionicons name={icon} size={18} color={iconColor || Colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, danger && { color: Colors.danger }]}>{label}</Text>
        {sub ? <Text style={styles.settingSub}>{sub}</Text> : null}
      </View>
      <View style={styles.settingRight}>
        {right || (onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />)}
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { holdings, deleteHolding } = usePortfolio();
  const { prices, lastUpdated, refresh } = useMarket();
  const [showTRY, setShowTRY] = useState(true);

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkmak istediğinden emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  const handleClearPortfolio = () => {
    Alert.alert(
      'Portföyü Temizle',
      'Tüm yatırım kayıtları silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            for (const h of holdings) {
              await deleteHolding(h.id);
            }
            Alert.alert('Tamam', 'Tüm yatırım kayıtları silindi.');
          },
        },
      ]
    );
  };

  const usdTry = prices?.forex?.usdTry;
  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const userInitial = user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.pageTitle}>Hesabım</Text>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userSub}>{holdings.length} yatırım kaydı</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
            <Text style={styles.verifiedText}>Doğrulandı</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Market Info */}
        <SectionHeader title="Piyasa Bilgisi" />
        <View style={styles.card}>
          <SettingRow
            icon="time-outline"
            iconColor={Colors.primary}
            iconBg="#F0F2FF"
            label="Son Güncelleme"
            sub={`Kurlar: ${lastUpdatedStr}`}
            onPress={refresh}
            right={
              <View style={styles.refreshChip}>
                <Ionicons name="refresh" size={13} color={Colors.primary} />
                <Text style={styles.refreshChipText}>Güncelle</Text>
              </View>
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="cash-outline"
            iconColor={Colors.warning}
            iconBg={Colors.warningLight}
            label="USD/TRY Kuru"
            sub={usdTry ? `1 USD = ₺${usdTry.toFixed(4)}` : 'Yükleniyor...'}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="globe-outline"
            iconColor={Colors.success}
            iconBg={Colors.successLight}
            label="Ana Para Birimi"
            sub="USD (Dolar) — Değiştirilemez"
          />
        </View>

        {/* Display Settings */}
        <SectionHeader title="Görünüm" />
        <View style={styles.card}>
          <SettingRow
            icon="flag-outline"
            iconColor={Colors.danger}
            iconBg={Colors.dangerLight}
            label="TRY Değerini Göster"
            sub="Portföy değerini TL olarak da göster"
            right={
              <Switch
                value={showTRY}
                onValueChange={setShowTRY}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* API Info */}
        <SectionHeader title="Veri Kaynakları" />
        <View style={styles.card}>
          {[
            { label: 'Döviz Kurları', sub: 'Frankfurter (api.frankfurter.app)', icon: 'swap-horizontal-outline', color: Colors.primary },
            { label: 'Altın / Gümüş', sub: 'Metals.live spot fiyatlar', icon: 'diamond-outline', color: Colors.warning },
            { label: 'Kripto Paralar', sub: 'CoinGecko (coingecko.com)', icon: 'logo-bitcoin', color: '#F7931A' },
          ].map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <View style={styles.divider} />}
              <SettingRow
                icon={item.icon}
                iconColor={item.color}
                iconBg={item.color + '20'}
                label={item.label}
                sub={item.sub}
              />
            </React.Fragment>
          ))}
        </View>

        {/* Portfolio Actions */}
        <SectionHeader title="Portföy" />
        <View style={styles.card}>
          <SettingRow
            icon="trash-outline"
            iconColor={Colors.danger}
            iconBg={Colors.dangerLight}
            label="Portföyü Temizle"
            sub="Tüm yatırım kayıtlarını sil"
            onPress={handleClearPortfolio}
            danger
          />
        </View>

        {/* About */}
        <SectionHeader title="Uygulama" />
        <View style={styles.card}>
          {[
            { icon: 'information-circle-outline', label: 'Versiyon', sub: '1.0.0', color: Colors.primary },
            { icon: 'alert-circle-outline', label: 'Sorumluluk Reddi', sub: 'Bu uygulama yatırım tavsiyesi vermez', color: Colors.warning },
          ].map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <View style={styles.divider} />}
              <SettingRow
                icon={item.icon}
                iconColor={item.color}
                iconBg={item.color + '20'}
                label={item.label}
                sub={item.sub}
              />
            </React.Fragment>
          ))}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="warning-outline" size={16} color={Colors.warning} />
          <Text style={styles.disclaimerText}>
            Bu uygulama yalnızca kişisel takip amacıyla geliştirilmiştir. Gösterilen fiyatlar
            bilgi amaçlıdır ve yatırım tavsiyesi niteliği taşımaz. Gerçek zamanlı fiyatlar
            borsadan farklılık gösterebilir.
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: 20, paddingBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 16 },

  userCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  userInfo: { flex: 1 },
  userEmail: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  userSub: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: { fontSize: 11, color: Colors.success, fontWeight: '700' },

  scroll: { flex: 1, paddingHorizontal: 16 },

  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },

  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  settingSub: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  settingRight: { alignItems: 'flex-end' },

  divider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 62 },

  refreshChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F2FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshChipText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  disclaimer: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.warningLight,
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.dangerLight,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: Colors.danger },
});
