import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import appConfig from '../../app.json';

import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useMarket } from '../context/MarketContext';
import { useSettings } from '../context/SettingsContext';
import { LOCAL_CURRENCY_OPTIONS } from '../utils/currency';

const appVersion = appConfig?.expo?.version || 'Unknown';

function SettingRow({ icon, iconColor, iconBg, label, sub, right, onPress, danger }) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconBg || Colors.accentLight }]}>
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
  const { user, logout, deleteAccount } = useAuth();
  const { holdings, clearPortfolio, deleteUsdHoldings } = usePortfolio();
  const { lastUpdated, refresh } = useMarket();
  const { localCurrency, setLocalCurrency, language, setLanguage, t } = useSettings();

  const handleLogout = () => {
    Alert.alert(t('logout_confirm_title'), t('logout_confirm_sub'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('delete_account_confirm_title'),
      t('delete_account_confirm_sub'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete_account'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('are_you_sure'),
              t('delete_everything_sub'),
              [
                { text: t('cancel'), style: 'cancel' },
                { text: t('delete_account'), style: 'destructive', onPress: deleteAccount },
              ]
            );
          },
        },
      ]
    );
  };

  const handleClearPortfolio = () => {
    Alert.alert(
      t('clear_portfolio_confirm_title'),
      t('clear_portfolio_confirm_sub'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clearPortfolio();
              Alert.alert(t('success'), t('all_investments_deleted'));
            } catch (err) {
              Alert.alert(t('error'), t('operation_failed_retry'));
            }
          },
        },
      ]
    );
  };

  const handleLocalCurrencyChange = (nextCurrency) => {
    if (nextCurrency === localCurrency) return;

    const hasUsdHoldings = holdings.some((h) => h.assetId === 'usd');
    if (!hasUsdHoldings) {
      setLocalCurrency(nextCurrency);
      return;
    }

    Alert.alert(
      t('local_currency_change_title'),
      t('local_currency_change_body'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('local_currency_change_confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUsdHoldings();
              await setLocalCurrency(nextCurrency);
              Alert.alert(t('success'), t('local_currency_changed_with_usd_deleted'));
            } catch (err) {
              Alert.alert(t('error'), t('operation_failed_retry'));
            }
          },
        },
      ]
    );
  };

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString(language === 'en' ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const userInitial = user?.name
    ? user.name.trim()[0].toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';
  const displayName = user?.name || t('user_fallback');

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.pageTitle}>{t('my_account')}</Text>

        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userSub}>
              {holdings.length} {t('positions_count')}
            </Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
            <Text style={styles.verifiedText}>{t('verified')}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title={t('market_info')} />
        <View style={styles.card}>
          <SettingRow
            icon="time-outline"
            iconColor={Colors.primary}
            iconBg={Colors.accentLight}
            label={t('last_updated')}
            sub={lastUpdatedStr}
            onPress={refresh}
            right={
              <View style={styles.refreshChip}>
                <Ionicons name="refresh" size={13} color={Colors.primary} />
                <Text style={styles.refreshChipText}>{t('update')}</Text>
              </View>
            }
          />
        </View>

        <SectionHeader title={t('currency')} />
        <View style={styles.card}>
          <SettingRow
            icon="globe-outline"
            iconColor={Colors.success}
            iconBg={Colors.successLight}
            label={t('base_currency')}
            sub={t('base_currency_fixed')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="flag-outline"
            iconColor={Colors.danger}
            iconBg={Colors.dangerLight}
            label={t('local_currency')}
            sub={t('local_currency_sub')}
          />
          <View style={styles.currencySelector}>
            {LOCAL_CURRENCY_OPTIONS.map((currency) => (
              <TouchableOpacity
                key={currency}
                style={[styles.currencyOption, localCurrency === currency && styles.currencyOptionActive]}
                onPress={() => handleLocalCurrencyChange(currency)}
              >
                <Text style={[styles.currencyOptionText, localCurrency === currency && styles.currencyOptionTextActive]}>
                  {currency}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <SectionHeader title={t('language')} />
        <View style={styles.card}>
          <SettingRow
            icon="language-outline"
            iconColor={Colors.primary}
            iconBg={Colors.accentLight}
            label={t('language')}
            sub={t('language_sub')}
          />
          <View style={styles.currencySelector}>
            {[{ key: 'tr', label: t('turkish') }, { key: 'en', label: t('english') }].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.currencyOption, language === item.key && styles.currencyOptionActive]}
                onPress={() => setLanguage(item.key)}
              >
                <Text style={[styles.currencyOptionText, language === item.key && styles.currencyOptionTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <SectionHeader title={t('portfolio_section')} />
        <View style={styles.card}>
          <SettingRow
            icon="trash-outline"
            iconColor={Colors.danger}
            iconBg={Colors.dangerLight}
            label={t('clear_portfolio')}
            sub={t('clear_portfolio_sub')}
            onPress={handleClearPortfolio}
            danger
          />
        </View>

        <SectionHeader title={t('app')} />
        <View style={styles.card}>
          {[
            { icon: 'information-circle-outline', label: t('version'), sub: appVersion, color: Colors.primary },
            { icon: 'alert-circle-outline', label: t('disclaimer_title'), sub: t('disclaimer_short'), color: Colors.warning },
          ].map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 && <View style={styles.divider} />}
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

        <View style={styles.disclaimer}>
          <Ionicons name="warning-outline" size={16} color={Colors.warning} />
          <Text style={styles.disclaimerText}>{t('disclaimer_text')}</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount} activeOpacity={0.85}>
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={styles.deleteAccountText}>{t('delete_account')}</Text>
        </TouchableOpacity>

        <Text style={styles.deleteAccountWarning}>
          {t('delete_account_warning')}
        </Text>
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
  userName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  userEmail: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary, marginTop: 1 },
  userSub: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
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
    backgroundColor: Colors.accentLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshChipText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  currencySelector: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  currencyOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  currencyOptionActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.primary,
  },
  currencyOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  currencyOptionTextActive: {
    color: Colors.primary,
  },

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

  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.danger,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 10,
  },
  deleteAccountText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  deleteAccountWarning: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
});
