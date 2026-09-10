// src/screens/expense/ExpenseReportScreen.jsx
// Expense report — Daily / Monthly / Yearly period breakdown + category split.
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../../components/Icon';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { reportsService } from '../../services/reportsService';
import { expenseService } from '../../services/expenseService';
import { formatCurrency } from '../../utils/formatters';
import { theme } from '../../utils/theme';

const NAVY = theme.colors.primary;
const ORANGE = theme.colors.accent;

const pad = n => String(n).padStart(2, '0');
const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function rangeFor(key) {
  const now = new Date(); const y = now.getFullYear(); const m = now.getMonth();
  switch (key) {
    case 'day':   return { from: fmt(new Date(y, m, now.getDate() - 6)), to: fmt(now), group_by: 'day' };
    case 'month': return { from: `${y}-01-01`,                          to: fmt(now), group_by: 'month' };
    case 'year':  return { from: `${y - 4}-01-01`,                      to: fmt(now), group_by: 'year' };
    default:      return { from: `${y}-01-01`, to: fmt(now), group_by: 'month' };
  }
}
const TABS = [{ key: 'day', label: 'Daily' }, { key: 'month', label: 'Monthly' }, { key: 'year', label: 'Yearly' }];

export default function ExpenseReportScreen({ navigation }) {
  const [period, setPeriod]   = useState('month');
  const [data, setData]       = useState(null);
  const [cats, setCats]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const range = rangeFor(period);
    try {
      const [pr, cr] = await Promise.all([
        reportsService.expenseReport(range),
        // Category split for the current month (existing endpoint) shown alongside.
        expenseService.report({ month: `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}` }).catch(() => null),
      ]);
      setData(pr?.data ?? pr ?? {});
      const cd = cr?.data ?? cr;
      setCats(cd?.byCategory || []);
    } catch (e) { setError(e?.message || 'Failed to load expense report'); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} onRetry={load} />;

  const rows   = data?.rows || [];
  const total  = data?.totals?.total ?? rows.reduce((s, r) => s + (r.total || 0), 0);
  const maxVal = Math.max(...rows.map(r => r.total || 0), 1);
  const catTotal = cats.reduce((s, c) => s + (c.total || 0), 0);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.tab, period === t.key && styles.tabActive]} onPress={() => setPeriod(t.key)}>
            <Text style={[styles.tabText, period === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total Expenses</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>

        {/* Period breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>By Period</Text>
          {rows.length === 0 ? <Text style={styles.empty}>No expenses in this period.</Text> : rows.map((r, i) => {
            const w = Math.min(((r.total || 0) / maxVal) * 100, 100);
            return (
              <View key={i} style={styles.row}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowLabel}>{r.period}</Text>
                  <Text style={styles.rowAmt}>{formatCurrency(r.total || 0)}</Text>
                </View>
                <View style={styles.barTrack}><View style={[styles.barFill, { width: `${w}%` }]} /></View>
                <Text style={styles.rowSub}>{r.count || 0} entries</Text>
              </View>
            );
          })}
        </View>

        {/* Category split (this month) */}
        {cats.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>This Month by Category</Text>
            {cats.map((c, i) => {
              const pct = catTotal > 0 ? (c.total / catTotal) * 100 : 0;
              return (
                <View key={i} style={styles.row}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowLabel}>{c.category}</Text>
                    <Text style={styles.rowAmt}>{formatCurrency(c.total)}</Text>
                  </View>
                  <View style={styles.barTrack}><View style={[styles.barFill, { width: `${pct}%`, backgroundColor: '#7C3AED' }]} /></View>
                  <Text style={styles.rowSub}>{c.count} entries · {pct.toFixed(1)}%</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: { backgroundColor: NAVY, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  tabs: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: '#F1F5F9' },
  tabActive: { backgroundColor: NAVY },
  tabText: { fontSize: 12.5, fontWeight: '700', color: theme.colors.textSecondary },
  tabTextActive: { color: '#fff' },
  totalBox: { backgroundColor: NAVY, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 14 },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  totalValue: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 4 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  cardTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 12 },
  empty: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: 16 },
  row: { marginBottom: 14 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  rowLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary, flex: 1, marginRight: 8 },
  rowAmt: { fontSize: 13, fontWeight: '800', color: '#DC2626' },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#EEF1F6', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: ORANGE },
  rowSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4 },
});
