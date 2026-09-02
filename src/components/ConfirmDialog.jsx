// src/components/ConfirmDialog.jsx
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../utils/theme';

export default function ConfirmDialog({ visible, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirm, danger && { backgroundColor: theme.colors.danger }]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  card:        { backgroundColor: '#fff', borderRadius: 14, padding: 24, width: '82%', elevation: 6 },
  title:       { fontSize: 17, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8 },
  message:     { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 20, lineHeight: 20 },
  actions:     { flexDirection: 'row', gap: 10 },
  btn:         { flex: 1, paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  cancel:      { backgroundColor: '#f0f0f0' },
  confirm:     { backgroundColor: theme.colors.primary },
  cancelText:  { color: theme.colors.textPrimary, fontWeight: '600' },
  confirmText: { color: '#fff', fontWeight: '700' },
});
