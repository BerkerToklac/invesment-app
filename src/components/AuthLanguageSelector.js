import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../theme/colors';
import { useSettings } from '../context/SettingsContext';

export default function AuthLanguageSelector() {
  const { language, setLanguage } = useSettings();

  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <Ionicons name="language-outline" size={14} color="#FFFFFF" style={styles.icon} />

        <TouchableOpacity
          style={[styles.option, language === 'tr' && styles.optionActive]}
          onPress={() => setLanguage('tr')}
          activeOpacity={0.85}
        >
          <Text style={[styles.optionText, language === 'tr' && styles.optionTextActive]}>TR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, language === 'en' && styles.optionActive]}
          onPress={() => setLanguage('en')}
          activeOpacity={0.85}
        >
          <Text style={[styles.optionText, language === 'en' && styles.optionTextActive]}>EN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-end',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 18,
    paddingHorizontal: 6,
    paddingVertical: 5,
    backgroundColor: 'rgba(15,23,42,0.26)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  icon: {
    marginLeft: 2,
    marginRight: 1,
    opacity: 0.95,
  },
  option: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  optionActive: {
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.4,
  },
  optionTextActive: {
    color: Colors.primary,
  },
});
