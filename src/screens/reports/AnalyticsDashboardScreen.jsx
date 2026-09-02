// src/screens/reports/AnalyticsDashboardScreen.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { reportsService } from '../../services/reportsService';
import { formatCurrency } from '../../utils/formatters';
import { theme } from '../../utils/theme';

export default function AnalyticsDashboardScreen() {
  const [topProducts,  setTopProducts]  = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [p, c] = await Promise.all([reportsService.topProducts(), reportsService.topCustomers()]);
      setTopProducts(p?.data ?? p ?? []);
      setTopCustomers(c?.data ?? c ?? []);
    } catch (e) { setError(e?.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} onRetry={load} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.heading}>Analytics Dashboard</Text>

      <Text style={styles.sectionTitle}>🏆 Top 10 Products (by Qty Sold)</Text>
      {topProducts.slice(0, 10).map((p, i) => (
        <View key={i} style={styles.rankRow}>
          <Text style={styles.rank}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{p.product_name || p.name}</Text>
            <Text style={styles.itemSub}>{p.total_qty || 0} boxes sold</Text>
          </View>
          <Text style={styles.itemValue}>{formatCurrency(p.total_revenue || 0)}</Text>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>👑 Top 10 Customers (by Revenue)</Text>
      {topCustomers.slice(0, 10).map((c, i) => (
        <View key={i} style={styles.rankRow}>
          <Text style={styles.rank}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{c.name}</Text>
            <Text style={styles.itemSub}>{c.order_count || 0} orders</Text>
          </View>
          <Text style={styles.itemValue}>{formatCurrency(c.total_revenue || 0)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: theme.colors.background },
  heading:      { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 10 },
  rankRow:      { backgroundColor: theme.colors.surface, borderRadius: 8, padding: 12, marginBottom: 6, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  rank:         { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary, textAlign: 'center', lineHeight: 28, color: '#fff', fontWeight: '700', marginRight: 10, fontSize: 13 },
  itemName:     { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
  itemSub:      { fontSize: 12, color: theme.colors.textSecondary },
  itemValue:    { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
});
