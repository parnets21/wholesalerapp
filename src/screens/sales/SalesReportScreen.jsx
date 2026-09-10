// src/screens/sales/SalesReportScreen.jsx
// Real sales report — Daily / Weekly / Monthly / Yearly period breakdown.
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../../components/Icon';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { reportsService } from '../../services/reportsService';
import { formatCurrency } from '../../utils/formatters';
import { theme } from '../../utils/theme';

const NAVY = theme.colors.primary;
const ORANGE = theme.colors.accent;

const pad = n => String(n).padStart(2, '0');
const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// period → { from, to, group_by }
function rangeFor(key) {
  const now = new Date(); const y = now.getFullYear(); const m = now.getMonth();
  switch (key) {
    case 'day':   return { from: fmt(new Date(y, m, now.getDate() - 6)), to: fmt(now), group_by: 'day' };   // last 7 days
    case 'week':  return { from: fmt(new Date(y, m - 2, 1)),            to: fmt(now), group_by: 'week' };   // ~12 weeks
    case 'month': return { from: `${y}-01-01`,                          to: fmt(now), group_by: 'month' };  // this year by month
    case 'year':  return { from: `${y - 4}-01-01`,                      to: fmt(now), group_by: 'year' };   // 5 years
    default:      return { from: `${y}-01-01`, to: fmt(now), group_by: 'month' };
  }
}

const TABS = [
  { key: 'day',   label: 'Daily' },
  { key: 'week',  label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'year',  label: 'Yearly' },
];

export default function SalesReportScreen({ navigation }) {
  const [period, setPeriod]   = useState('month');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await reportsService.getSalesReport(rangeFor(period));
      setData(r?.data ?? r ?? {});
    } catch (e) { setError(e?.message || 'Failed to load sales report'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const rows    = data?.rows || [];
  const totals  = data?.totals || {};
  const grand   = rows.reduce((s, r) => s + (r.total_sales || 0), 0);
  const gstSum  = rows.reduce((s, r) => s + (r.total_gst || 0), 0);
  const orders  = rows.reduce((s, r) => s + (r.order_count || 0), 0);
  const maxVal  = Math.max(...rows.map(r => r.total_sales || 0), 1);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Report</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Period tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tab, period === t.key && styles.tabActive]} onPress={() => setPeriod(t.key)}>
            <Text style={[styles.tabText, period === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} onRetry={load} /> : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[ORANGE]} />}>

          {/* Summary cards */}
          <View style={styles.summaryRow}>
            <View style={styles.sumCard}>
              <Text style={[styles.sumVal, { color: '#059669' }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(grand)}</Text>
              <Text style={styles.sumLbl}>Total Sales</Text>
            </View>
            <View style={styles.sumCard}>
              <Text style={[styles.sumVal, { color: NAVY }]}>{orders}</Text>
              <Text style={styles.sumLbl}>Orders</Text>
            </View>
            <View style={styles.sumCard}>
              <Text style={[styles.sumVal, { color: '#D97706' }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(gstSum)}</Text>
              <Text style={styles.sumLbl}>GST</Text>
            </View>
          </View>

          {/* Breakdown */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Breakdown</Text>
            {rows.length === 0 ? (
              <Text style={styles.empty}>No sales in this period.</Text>
            ) : rows.map((r, i) => {
              const w = Math.min(((r.total_sales || 0) / maxVal) * 100, 100);
              return (
                <View key={i} style={styles.row}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowPeriod}>{r.period}</Text>
                    <Text style={styles.rowAmt}>{formatCurrency(r.total_sales || 0)}</Text>
                  </View>
                  <View style={styles.barTrack}><View style={[styles.barFill, { width: `${w}%` }]} /></View>
                  <Text style={styles.rowSub}>{r.order_count || 0} orders · GST {formatCurrency(r.total_gst || 0)}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    backgroundColor: NAVY, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },

  tabs: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: '#F1F5F9' },
  tabActive: { backgroundColor: NAVY },
  tabText: { fontSize: 12.5, fontWeight: '700', color: theme.colors.textSecondary },
  tabTextActive: { color: '#fff' },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  sumCard: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  sumVal: { fontSize: 16, fontWeight: '800' },
  sumLbl: { fontSize: 10.5, color: theme.colors.textSecondary, marginTop: 3 },

  card: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
  cardTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 12 },
  empty: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: 16 },
  row: { marginBottom: 14 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  rowPeriod: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary },
  rowAmt: { fontSize: 13, fontWeight: '800', color: '#059669' },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#EEF1F6', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: ORANGE },
  rowSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4 },
});
