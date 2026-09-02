// src/components/PrimaryButton.jsx
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { theme } from '../utils/theme';

export default function PrimaryButton({ title, onPress, loading, disabled, style, variant = 'primary' }) {
  const isDisabled = disabled || loading;
  const bgColor = variant === 'outline' ? 'transparent' : isDisabled ? '#a0bde8' : theme.colors.primary;
  const textColor = variant === 'outline' ? theme.colors.primary : '#fff';
  const borderStyle = variant === 'outline' ? { borderWidth: 1.5, borderColor: theme.colors.primary } : {};

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: bgColor }, borderStyle, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator size="small" color={variant === 'outline' ? theme.colors.primary : '#fff'} />
        : <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn:  { paddingVertical: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 15, fontWeight: '700' },
});
