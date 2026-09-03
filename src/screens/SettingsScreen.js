import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
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
import { CURRENCY_META, LOCAL_CURRENCY_OPTIONS } from '../utils/currency';

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

function CurrencyChoice({ currency, selected, language, onPress }) {
  const meta = CURRENCY_META[currency] || {};
  return (
    <TouchableOpacity
      style={[styles.currencyChoice, selected && styles.currencyChoiceActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.currencyChoiceCode, selected && styles.currencyChoiceCodeActive]}>{currency}</Text>
      <Text style={[styles.currencyChoiceName, selected && styles.currencyChoiceNameActive]} numberOfLines={1}>
        {language === 'en' ? meta.name : meta.localName}
      </Text>
    </TouchableOpacity>
  );
}

function CurrencyPreferencesModal({
  visible,
  language,
  baseCurrency,
  localCurrency,
  onBaseChange,
  onLocalChange,
  onCancel,
  onSave,
  t,
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.currencySheet}>
          <View style={styles.currencySheetHandle} />
          <View style={styles.currencySheetHeader}>
            <TouchableOpacity onPress={onCancel} style={styles.sheetHeaderButton}>
              <Text style={styles.sheetCancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.currencySheetTitle}>{t('currency_preferences')}</Text>
            <TouchableOpacity onPress={onSave} style={styles.sheetHeaderButton}>
              <Text style={styles.sheetSaveText}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.currencySheetInfo}>{t('currency_reset_notice')}</Text>

          <ScrollView
            style={styles.currencySheetScroll}
            contentContainerStyle={[styles.currencySheetContent, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.currencySheetSection}>{t('base_currency')}</Text>
            <View style={styles.currencyChoiceGrid}>
              {LOCAL_CURRENCY_OPTIONS.map((currency) => (
                <CurrencyChoice
                  key={`base-${currency}`}
                  currency={currency}
                  selected={baseCurrency === currency}
                  language={language}
                  onPress={() => onBaseChange(currency)}
                />
              ))}
            </View>

            <Text style={styles.currencySheetSection}>{t('local_currency')}</Text>
            <View style={styles.currencyChoiceGrid}>
              {LOCAL_CURRENCY_OPTIONS.map((currency) => (
                <CurrencyChoice
                  key={`local-${currency}`}
                  currency={currency}
                  selected={localCurrency === currency}
                  language={language}
                  onPress={() => onLocalChange(currency)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout, deleteAccount } = useAuth();
  const { holdings, clearPortfolio, reload: reloadPortfolio } = usePortfolio();
  const { lastUpdated, refresh } = useMarket();
  const {
    localCurrency,
    baseCurrency,
    setCurrencyPreferences,
    language,
    setLanguage,
    t,
  } = useSettings();
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [accountManagementOpen, setAccountManagementOpen] = useState(false);
  const [draftBaseCurrency, setDraftBaseCurrency] = useState(baseCurrency);
  const [draftLocalCurrency, setDraftLocalCurrency] = useState(localCurrency);

  const openCurrencyModal = () => {
    setDraftBaseCurrency(baseCurrency);
    setDraftLocalCurrency(localCurrency);
    setCurrencyModalVisible(true);
  };

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
                {
                  text: t('delete_account'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount();
                    } catch (_error) {
                      Alert.alert(t('error'), t('delete_account_error'));
                    }
                  },
                },
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

  const saveCurrencyPreferences = async () => {
    const changed = draftBaseCurrency !== baseCurrency || draftLocalCurrency !== localCurrency;
    if (!changed) {
      setCurrencyModalVisible(false);
      return;
    }

    const applyChange = async ({ resetPortfolio }) => {
      try {
        await setCurrencyPreferences({ baseCurrency: draftBaseCurrency, localCurrency: draftLocalCurrency, resetPortfolio });
        if (resetPortfolio) await reloadPortfolio();
        setCurrencyModalVisible(false);
        Alert.alert(t('success'), resetPortfolio ? t('currency_preferences_changed_reset') : t('currency_preferences_changed'));
      } catch (err) {
        Alert.alert(t('error'), t('operation_failed_retry'));
      }
    };

    if (!holdings.length) {
      await applyChange({ resetPortfolio: false });
      return;
    }

    Alert.alert(
      t('currency_reset_confirm_title'),
      t('currency_reset_confirm_body'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('currency_reset_confirm_action'),
          style: 'destructive',
          onPress: () => applyChange({ resetPortfolio: true }),
        },
      ]
    );
  };

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString(language === 'en' ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const userInitial = user?.name
    ? user.name.trim()[0].toUpperCase()
    : user?.email?.[0]?.toUpperCase() || t('guest_user')[0];
  const displayName = user?.name || (user ? t('user_fallback') : t('guest_user'));

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
            <Text style={styles.userEmail}>{user?.email || t('guest_user_sub')}</Text>
            <Text style={styles.userSub}>
              {holdings.length} {t('positions_count')}
            </Text>
          </View>
          <View style={[styles.verifiedBadge, !user && styles.guestBadge]}>
            <Ionicons name={user ? 'shield-checkmark' : 'eye-outline'} size={16} color={user ? Colors.success : Colors.primary} />
            <Text style={[styles.verifiedText, !user && styles.guestBadgeText]}>{user ? t('verified') : t('guest_mode')}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {!user ? (
          <>
            <SectionHeader title={t('my_account')} />
            <View style={styles.card}>
              <SettingRow
                icon="log-in-outline"
                iconColor={Colors.primary}
                iconBg={Colors.accentLight}
                label={t('welcome_cta_login')}
                sub={t('settings_login_sub')}
                onPress={() => navigation.navigate('Login')}
              />
            </View>
          </>
        ) : null}

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
            label={t('currency_preferences')}
            sub={`${t('base_currency')}: ${baseCurrency} · ${t('local_currency')}: ${localCurrency}`}
            onPress={openCurrencyModal}
          />
          <View style={styles.currencyDetailBox}>
            <Text style={styles.currencyDetailText}>{t('currency_preferences_details')}</Text>
            <Text style={styles.currencyDetailWarning}>{t('currency_reset_notice')}</Text>
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
            {[{ key: 'en', label: t('english') }, { key: 'tr', label: t('turkish') }].map((item) => (
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

        {user ? (
          <>
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
          </>
        ) : null}

        <SectionHeader title={t('app')} />
        <View style={styles.card}>
          {[
            { icon: 'information-circle-outline', label: t('version'), sub: appVersion, color: Colors.primary },
            { icon: 'mail-outline', label: t('support'), sub: t('support_sub'), color: Colors.success },
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

        {user ? (
          <>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
              <Text style={styles.logoutText}>{t('logout')}</Text>
            </TouchableOpacity>

            <SectionHeader title={t('account_management')} />
            <View style={styles.card}>
              <SettingRow
                icon="settings-outline"
                iconColor={Colors.textSecondary}
                iconBg={Colors.background}
                label={t('account_management')}
                sub={t('account_management_sub')}
                onPress={() => setAccountManagementOpen((open) => !open)}
                right={<Ionicons name={accountManagementOpen ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textLight} />}
              />
              {accountManagementOpen ? (
                <View style={styles.accountManagementActions}>
                  <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount} activeOpacity={0.85}>
                    <Ionicons name="trash" size={18} color="#fff" />
                    <Text style={styles.deleteAccountText}>{t('delete_account')}</Text>
                  </TouchableOpacity>
                  <Text style={styles.deleteAccountWarning}>{t('delete_account_warning')}</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>

      <CurrencyPreferencesModal
        visible={currencyModalVisible}
        language={language}
        baseCurrency={draftBaseCurrency}
        localCurrency={draftLocalCurrency}
        onBaseChange={setDraftBaseCurrency}
        onLocalChange={setDraftLocalCurrency}
        onCancel={() => setCurrencyModalVisible(false)}
        onSave={saveCurrencyPreferences}
        t={t}
      />
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
  guestBadge: { backgroundColor: Colors.accentLight },
  guestBadgeText: { color: Colors.primary },

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
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  currencyDetailBox: {
    marginHorizontal: 14,
    marginBottom: 12,
    marginTop: -2,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  currencyDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  currencyDetailWarning: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 6,
  },
  currencyOption: {
    minWidth: 72,
    flexGrow: 1,
    flexBasis: '22%',
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
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  currencySheet: {
    height: '86%',
    maxHeight: '86%',
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
  },
  currencySheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 10,
  },
  currencySheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sheetHeaderButton: { minWidth: 64, paddingVertical: 8 },
  sheetCancelText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '700' },
  sheetSaveText: { fontSize: 14, color: Colors.primary, fontWeight: '800', textAlign: 'right' },
  currencySheetTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  currencySheetInfo: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.warning + '18',
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  currencySheetScroll: { flex: 1, minHeight: 0 },
  currencySheetContent: { paddingHorizontal: 16 },
  currencySheetSection: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 8,
  },
  currencyChoiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyChoice: {
    width: '31.5%',
    minHeight: 58,
    borderRadius: 12,
    borderWidth: 1.3,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  currencyChoiceActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.accentLight,
  },
  currencyChoiceCode: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  currencyChoiceCodeActive: { color: Colors.primary },
  currencyChoiceName: { fontSize: 10, color: Colors.textLight, marginTop: 3 },
  currencyChoiceNameActive: { color: Colors.textSecondary },

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
  accountManagementActions: { paddingTop: 2 },
});
