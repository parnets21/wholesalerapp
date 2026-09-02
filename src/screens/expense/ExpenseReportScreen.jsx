// src/screens/expense/ExpenseReportScreen.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { expenseService } from '../../services/expenseService';
import { formatCurrency } from '../../utils/formatters';
import { theme } from '../../utils/theme';

export default function ExpenseReportScreen() {
  const now = new Date();
  const [month,   setMonth]   = useState(now.getMonth());
  const [year,    setYear]    = useState(now.getFullYear());
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    try { const res = await expenseService.report({ month: monthStr }); setData(res?.data ?? res); }
    catch (e) { setError(e?.message); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const categories = data?.byCategory || [];
  const total = categories.reduce((s, c) => s + (c.total || 0), 0);

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} onRetry={load} />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}>
          <Text style={styles.navBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}>
          <Text style={styles.navBtn}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total Expenses</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>
      {categories.map((cat, i) => {
        const pct = total > 0 ? (cat.total / total) * 100 : 0;
        return (
          <View key={i} style={styles.catRow}>
            <View style={styles.catInfo}>
              <Text style={styles.catName}>{cat.category}</Text>
              <Text style={styles.catCount}>{cat.count} entries</Text>
            </View>
            <View style={styles.catRight}>
              <Text style={styles.catAmount}>{formatCurrency(cat.total)}</Text>
              <View style={styles.bar}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
              <Text style={styles.pct}>{pct.toFixed(1)}%</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: theme.colors.background },
  monthNav:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 10, padding: 12, marginBottom: 12, elevation: 1 },
  navBtn:     { fontSize: 24, color: theme.colors.primary, paddingHorizontal: 8 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
  totalBox:   { backgroundColor: theme.colors.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  totalValue: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 4 },
  catRow:     { backgroundColor: theme.colors.surface, borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1 },
  catInfo:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName:    { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
  catCount:   { fontSize: 12, color: theme.colors.textSecondary },
  catRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catAmount:  { fontSize: 14, fontWeight: '700', color: theme.colors.danger, width: 80 },
  bar:        { flex: 1, height: 6, backgroundColor: '#FFE0B2', borderRadius: 3, overflow: 'hidden' },
  fill:       { height: 6, backgroundColor: theme.colors.danger, borderRadius: 3 },
  pct:        { fontSize: 11, color: theme.colors.textSecondary, width: 36, textAlign: 'right' },
});
