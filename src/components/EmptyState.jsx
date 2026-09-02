// src/components/EmptyState.jsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../utils/theme';

export default function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title || 'No data found'}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  icon:      { fontSize: 48, marginBottom: 12 },
  title:     { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, textAlign: 'center' },
  subtitle:  { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 6 },
});
