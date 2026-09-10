// src/screens/purchase/PurchaseListScreen.jsx
// Purchase list + report (Daily / Monthly / Yearly period + Supplier-wise).
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, FlatList } from 'react-native';
import Icon from '../../components/Icon';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { purchaseService } from '../../services/purchaseService';
import { reportsService } from '../../services/reportsService';
import { formatCurrency, formatDate } from '../../utils/formatters';
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
const PERIOD_TABS = [{ key: 'day', label: 'Daily' }, { key: 'month', label: 'Monthly' }, { key: 'year', label: 'Yearly' }, { key: 'supplier', label: 'Supplier-wise' }];

export default function PurchaseListScreen({ navigation }) {
  const [mode, setMode] = useState('list');   // 'list' | 'report'
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // report state
  const [period, setPeriod] = useState('month');
  const [report, setReport] = useState(null);
  const [rLoading, setRLoading] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseService.list({ limit: 100 });
      const data = res?.data ?? res ?? {};
      setPurchases(Array.isArray(data) ? data : (data.purchases ?? []));
    } catch { setPurchases([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const loadReport = useCallback(async () => {
    setRLoading(true);
    try {
      if (period === 'supplier') {
        const r = await reportsService.supplierReport({});
        setReport({ kind: 'supplier', ...(r?.data ?? r ?? {}) });
      } else {
        const r = await reportsService.purchaseReport(rangeFor(period));
        setReport({ kind: 'period', ...(r?.data ?? r ?? {}) });
      }
    } catch { setReport(null); }
    finally { setRLoading(false); }
  }, [period]);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { if (mode === 'report') loadReport(); }, [mode, loadReport]);

  const renderPurchase = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.pName} numberOfLines={1}>{item.product_name || item.product_code || 'Item'}</Text>
        <Text style={styles.pAmt}>{formatCurrency(item.total_amount ?? item.amount ?? 0)}</Text>
      </View>
      <Text style={styles.pSub}>
        {item.supplier_name || 'Supplier'} · {item.qty} {item.unit || ''} · {formatDate(item.purchase_date || item.created_at)}
      </Text>
    </View>
  );

  const rows   = report?.rows || [];
  const totals = report?.totals || {};
  const maxVal = Math.max(...rows.map(r => (report?.kind === 'supplier' ? (r.total || 0) : (r.total || 0))), 1);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Purchases</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PurchaseEntry')}><Icon name="plus" size={22} color="#fff" /></TouchableOpacity>
      </View>

      {/* List / Report toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity style={[styles.modeBtn, mode === 'list' && styles.modeOn]} onPress={() => setMode('list')}>
          <Text style={[styles.modeText, mode === 'list' && styles.modeTextOn]}>List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeBtn, mode === 'report' && styles.modeOn]} onPress={() => setMode('report')}>
          <Text style={[styles.modeText, mode === 'report' && styles.modeTextOn]}>Report</Text>
        </TouchableOpacity>
      </View>

      {mode === 'list' ? (
        loading ? <LoadingSpinner /> : (
          <FlatList
            data={purchases}
            keyExtractor={(i, idx) => i._id || String(idx)}
            renderItem={renderPurchase}
            contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadList(); }} colors={[ORANGE]} />}
            ListEmptyComponent={<EmptyState icon="🧾" title="No purchases yet" />}
          />
        )
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={styles.tabs}>
            {PERIOD_TABS.map(t => (
              <TouchableOpacity key={t.key} style={[styles.tab, period === t.key && styles.tabActive]} onPress={() => setPeriod(t.key)}>
                <Text style={[styles.tabText, period === t.key && styles.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {rLoading ? <LoadingSpinner /> : (
            <>
              <View style={styles.sumCard}>
                <Text style={styles.sumLbl}>Total Purchase</Text>
                <Text style={styles.sumVal}>{formatCurrency(totals.total || rows.reduce((s, r) => s + (r.total || 0), 0))}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{report?.kind === 'supplier' ? 'By Supplier' : 'By Period'}</Text>
                {rows.length === 0 ? <Text style={styles.empty}>No data.</Text> : rows.map((r, i) => {
                  const w = Math.min(((r.total || 0) / maxVal) * 100, 100);
                  const label = report?.kind === 'supplier' ? (r.supplier_name || r._id || 'Supplier') : r.period;
                  return (
                    <View key={i} style={styles.repRow}>
                      <View style={styles.repTop}>
                        <Text style={styles.repLabel} numberOfLines={1}>{label}</Text>
                        <Text style={styles.repAmt}>{formatCurrency(r.total || 0)}</Text>
                      </View>
                      <View style={styles.barTrack}><View style={[styles.barFill, { width: `${w}%` }]} /></View>
                      <Text style={styles.repSub}>{r.count || 0} purchase(s)</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: { backgroundColor: NAVY, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },

  modeRow: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  modeBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: '#F1F5F9' },
  modeOn: { backgroundColor: NAVY },
  modeText: { fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary },
  modeTextOn: { color: '#fff' },

  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: '#F1F5F9' },
  tabActive: { backgroundColor: ORANGE },
  tabText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  tabTextActive: { color: '#fff' },

  sumCard: { backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
  sumLbl: { fontSize: 12, color: theme.colors.textSecondary },
  sumVal: { fontSize: 22, fontWeight: '800', color: '#DC2626', marginTop: 4 },

  card: { backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 12 },
  empty: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: 16 },
  pName: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, flex: 1, marginRight: 8 },
  pAmt: { fontSize: 14, fontWeight: '800', color: '#DC2626' },
  pSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },

  repRow: { marginBottom: 14 },
  repTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  repLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary, flex: 1, marginRight: 8 },
  repAmt: { fontSize: 13, fontWeight: '800', color: '#DC2626' },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#EEF1F6', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: ORANGE },
  repSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4 },
});
