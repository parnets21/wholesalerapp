// src/screens/reports/AnalyticsDashboardScreen.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { reportsService } from '../../services/reportsService';
import { formatCurrency } from '../../utils/formatters';
import { theme } from '../../utils/theme';

export default function AnalyticsDashboardScreen() {
  const [top,  setTop]  = useState([]);
  const [slow, setSlow] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await reportsService.analyticsTrend();
      const d = r?.data ?? r ?? {};
      setTop(d.topProducts || []);
      setSlow(d.slowProducts || []);
      setTrend(d.trend || []);
    } catch (e) { setError(e?.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} onRetry={load} />;

  const maxSales = Math.max(...trend.map(t => t.sales || 0), 1);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.heading}>Business Analytics</Text>

      {/* Sales trend graph */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📈 Sales Trend</Text>
        {trend.length === 0 ? <Text style={styles.empty}>No sales data.</Text> : trend.map((t, i) => {
          const w = Math.min(((t.sales || 0) / maxSales) * 100, 100);
          return (
            <View key={i} style={styles.trendRow}>
              <Text style={styles.trendMonth}>{t.month}</Text>
              <View style={styles.barTrack}><View style={[styles.barFill, { width: `${w}%` }]} /></View>
              <Text style={styles.trendVal}>{formatCurrency(t.sales || 0)}</Text>
            </View>
          );
        })}
      </View>

      {/* Top selling */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏆 Top Selling Products</Text>
        {top.length === 0 ? <Text style={styles.empty}>No sales yet.</Text> : top.slice(0, 10).map((p, i) => (
          <View key={i} style={styles.rankRow}>
            <Text style={styles.rank}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={1}>{p.product_name || p.name || 'Product'}</Text>
              <Text style={styles.itemSub}>{p.total_qty || 0} sold</Text>
            </View>
            <Text style={styles.itemValue}>{formatCurrency(p.total_revenue || 0)}</Text>
          </View>
        ))}
      </View>

      {/* Slow moving */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🐌 Slow-Moving Products</Text>
        <Text style={styles.cardHint}>High stock on hand, least recent movement.</Text>
        {slow.length === 0 ? <Text style={styles.empty}>Nothing flagged.</Text> : slow.slice(0, 10).map((p, i) => (
          <View key={i} style={styles.rankRow}>
            <View style={[styles.rank, { backgroundColor: '#D97706' }]}><Text style={styles.rankText}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={1}>{p.product_name || 'Product'}</Text>
              <Text style={styles.itemSub}>In stock: {p.available_stock ?? 0}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: theme.colors.background },
  heading:      { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 14 },
  card:         { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  cardTitle:    { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10 },
  cardHint:     { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 10, marginTop: -6 },
  empty:        { fontSize: 12.5, color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: 12 },

  trendRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  trendMonth:   { width: 58, fontSize: 11, color: theme.colors.textSecondary },
  barTrack:     { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#EEF1F6', overflow: 'hidden' },
  barFill:      { height: 10, borderRadius: 5, backgroundColor: theme.colors.accent },
  trendVal:     { width: 82, textAlign: 'right', fontSize: 11.5, fontWeight: '700', color: theme.colors.textPrimary },

  rankRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  rank:         { width: 26, height: 26, borderRadius: 13, backgroundColor: theme.colors.primary, textAlign: 'center', lineHeight: 26, color: '#fff', fontWeight: '700', marginRight: 10, fontSize: 12, alignItems: 'center', justifyContent: 'center' },
  rankText:     { color: '#fff', fontWeight: '700', fontSize: 12 },
  itemName:     { fontSize: 13.5, fontWeight: '600', color: theme.colors.textPrimary },
  itemSub:      { fontSize: 11.5, color: theme.colors.textSecondary },
  itemValue:    { fontSize: 13, fontWeight: '800', color: '#059669' },
});
