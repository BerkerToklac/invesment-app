import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../theme/colors';
import { useSettings } from '../context/SettingsContext';

export default function LegalLinksModal() {
  const { t } = useSettings();
  const [activeDoc, setActiveDoc] = useState(null);

  const title = useMemo(() => {
    if (activeDoc === 'terms') return t('legal_terms_title');
    if (activeDoc === 'privacy') return t('legal_privacy_title');
    return '';
  }, [activeDoc, t]);

  const body = useMemo(() => {
    if (activeDoc === 'terms') return t('legal_terms_body');
    if (activeDoc === 'privacy') return t('legal_privacy_body');
    return '';
  }, [activeDoc, t]);

  return (
    <>
      <Text style={styles.disclaimerText}>
        {t('legal_accept_prefix')}{' '}
        <Text style={styles.linkText} onPress={() => setActiveDoc('terms')}>
          {t('legal_terms_link')}
        </Text>
        {' '}{t('legal_accept_and')}{' '}
        <Text style={styles.linkText} onPress={() => setActiveDoc('privacy')}>
          {t('legal_privacy_link')}
        </Text>
        {' '}{t('legal_accept_suffix')}
      </Text>

      <Modal
        visible={Boolean(activeDoc)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDoc(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={() => setActiveDoc(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bodyWrap} contentContainerStyle={{ paddingBottom: 8 }}>
              <Text style={styles.bodyText}>{body}</Text>
            </ScrollView>

            <TouchableOpacity style={styles.okBtn} onPress={() => setActiveDoc(null)}>
              <Text style={styles.okBtnText}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  disclaimerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.86)',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputBg,
  },
  bodyWrap: {
    maxHeight: 340,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  okBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
  },
  okBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
