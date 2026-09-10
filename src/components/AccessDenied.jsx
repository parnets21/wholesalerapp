// src/components/AccessDenied.jsx
// Shown when a role tries to open a screen its permissions don't allow.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from './Icon';
import { theme } from '../utils/theme';

export default function AccessDenied({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon name="lock-outline" size={40} color={theme.colors.accent} />
      </View>
      <Text style={styles.title}>Access Restricted</Text>
      <Text style={styles.subtitle}>
        You don't have permission to view this section. Please contact your company owner if you need access.
      </Text>
      {navigation?.canGoBack?.() ? (
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconWrap:  { width: 80, height: 80, borderRadius: 24, backgroundColor: theme.colors.accentLight, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title:     { fontSize: 19, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 8 },
  subtitle:  { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 19, marginBottom: 26 },
  btn:       { backgroundColor: theme.colors.primary, paddingHorizontal: 30, paddingVertical: 13, borderRadius: 12 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
});
