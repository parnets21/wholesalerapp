// src/components/FormField.jsx
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../utils/theme';

export default function FormField({
  label, value, onChangeText, error,
  keyboardType, secureTextEntry, multiline, editable = true, placeholder, ...rest
}) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          multiline && styles.multiline,
          error && styles.inputError,
          !editable && styles.disabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        editable={editable}
        placeholder={placeholder || ''}
        placeholderTextColor={theme.colors.textDisabled}
        {...rest}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { marginBottom: 14 },
  label:      { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  multiline:  { height: 90, textAlignVertical: 'top' },
  inputError: { borderColor: theme.colors.danger },
  disabled:   { backgroundColor: '#f5f5f5', color: theme.colors.textDisabled },
  errorText:  { fontSize: 12, color: theme.colors.danger, marginTop: 3 },
});
