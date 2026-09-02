// src/components/LoadingSpinner.jsx
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { theme } from '../utils/theme';

export default function LoadingSpinner({ size = 'large', color, fullScreen = false }) {
  const spinnerColor = color || theme.colors.primary;
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={spinnerColor} />
      </View>
    );
  }
  return (
    <View style={styles.center}>
      <ActivityIndicator size={size} color={spinnerColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
