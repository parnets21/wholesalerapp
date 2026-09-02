// src/components/ErrorBoundary.jsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../utils/theme';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>💥</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>{this.state.error?.message || 'An unexpected error occurred'}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => this.setState({ hasError: false, error: null })}>
            <Text style={styles.btnText}>Reload App</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 },
  icon:      { fontSize: 56, marginBottom: 16 },
  title:     { fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8 },
  subtitle:  { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  btn:       { backgroundColor: theme.colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
});
