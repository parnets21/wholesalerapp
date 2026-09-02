// src/components/SummaryCard.jsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../utils/theme';

export default function SummaryCard({ title, value, subtitle, color, onPress }) {
  const accent  = color || theme.colors.primary;
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.card, { borderLeftColor: accent }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {onPress ? <Text style={[styles.arrow, { color: accent }]}>› View all</Text> : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title:    { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  value:    { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 },
  arrow:    { fontSize: 12, fontWeight: '700', marginTop: 6 },
});
