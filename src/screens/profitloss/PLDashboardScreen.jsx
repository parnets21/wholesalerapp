// src/screens/profitloss/PLDashboardScreen.jsx
// Full P&L: income statement + expense breakdown + date range + warehouse filter

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Modal, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import Icon         from '../../components/Icon';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { reportsService }  from '../../services/reportsService';
import { inventoryService } from '../../services/inventoryService';
import { formatCurrency }  from '../../utils/formatters';
import { theme }           from '../../utils/theme';

const PRIMARY = theme.colors.primary;
const ORANGE  = theme.colors.accent;
const BG      = '#F0F2F8';
const WHITE   = '#FFFFFF';
const TEXT    = '#171A2B';
const MUTED   = '#6B7280';
const BORDER  = '#E8EAF0';

const SHADOW = {
  shadowColor: '#111827', shadowOpacity: 0.07,
  shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4,
};

// ── Period presets ────────────────────────────────────────────────────────────
function getDateRange(key) {
  const now   = new Date();
  const y     = now.getFullYear();
  const m     = now.getMonth();
  const d     = now.getDate();
  const pad   = n => String(n).padStart(2, '0');
  const fmt   = dt => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

  switch (key) {
    case 'today':       return { from: fmt(now), to: fmt(now) };
    case 'week': {
      const mon = new Date(now); mon.setDate(d - now.getDay() + 1);
      return { from: fmt(mon), to: fmt(now) };
    }
    case 'month':       return { from: `${y}-${pad(m + 1)}-01`, to: fmt(now) };
    case 'last_month': {
      const lm = new Date(y, m, 0);
      return { from: `${lm.getFullYear()}-${pad(lm.getMonth() + 1)}-01`,
               to:   `${lm.getFullYear()}-${pad(lm.getMonth() + 1)}-${pad(lm.getDate())}` };
    }
    case 'quarter': {
      const qs = Math.floor(m / 3) * 3;
      return { from: `${y}-${pad(qs + 1)}-01`, to: fmt(now) };
    }
    case 'year':        return { from: `${y}-01-01`, to: fmt(now) };
    default:            return { from: `${y}-${pad(m + 1)}-01`, to: fmt(now) };
  }
}

const PERIOD_TABS = [
  { key: 'today',      label: 'Today' },
  { key: 'week',       label: 'This Week' },
  { key: 'month',      label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'quarter',    label: 'This Quarter' },
  { key: 'year',       label: 'This Year' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Row components
// ─────────────────────────────────────────────────────────────────────────────
function PLRow({ label, value, bold, color, indent, separator }) {
  return (
    <>
      {separator && <View style={styles.separator} />}
      <View style={[styles.plRow, bold && styles.plRowBold]}>
        <Text style={[styles.plLabel, bold && styles.plLabelBold, indent && styles.plIndent]}>
          {label}
        </Text>
        <Text style={[styles.plValue, bold && styles.plValueBold, color && { color }]}>
          {value < 0
            ? `− ${formatCurrency(Math.abs(value))}`
            : formatCurrency(Math.abs(value))}
        </Text>
      </View>
    </>
  );
}

function KPICard({ label, value, color, icon, iconBg }) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.kpiValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(Math.abs(value))}
      </Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function PLDashboardScreen({ navigation }) {
  const [period,     setPeriod]     = useState('month');
  const [warehouse,  setWarehouse]  = useState('all');
  const [warehouses, setWarehouses] = useState([]);
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [showWH,     setShowWH]     = useState(false);

  useEffect(() => {
    inventoryService.warehouses()
      .then(r => setWarehouses(r?.data ?? r ?? []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { from, to } = getDateRange(period);
      const params = { from_date: from, to_date: to };
      if (warehouse !== 'all') params.warehouse_id = warehouse;
      const res = await reportsService.plReport(params);
      setData(res?.data ?? res);
    } catch (e) { setError(e?.message || 'Failed to load P&L'); }
    finally { setLoading(false); }
  }, [period, warehouse]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <View style={styles.screen}>
      <PLHeader navigation={navigation} period={period} setPeriod={setPeriod}
        warehouse={warehouse} setShowWH={setShowWH} warehouses={warehouses} />
      <LoadingSpinner />
    </View>
  );

  if (error) return (
    <View style={styles.screen}>
      <PLHeader navigation={navigation} period={period} setPeriod={setPeriod}
        warehouse={warehouse} setShowWH={setShowWH} warehouses={warehouses} />
      <ErrorMessage message={error} onRetry={load} />
    </View>
  );

  const d             = data || {};
  const totalSales    = d.totalSales     || 0;
  const totalPurchase = d.totalPurchase  || 0;
  const totalExpenses = d.totalExpenses  || 0;
  const opExpenses    = d.operatingExpenses || 0;
  const salary        = d.totalSalary    || 0;
  const marketing     = d.marketingCost  || 0;
  const grossProfit   = totalSales - totalPurchase;
  const netProfit     = d.netProfit      ?? (grossProfit - totalExpenses - salary);
  const margin        = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0.0';
  const expBreakdown  = d.expenseBreakdown || [];

  return (
    <View style={styles.screen}>
      <PLHeader navigation={navigation} period={period} setPeriod={setPeriod}
        warehouse={warehouse} setShowWH={setShowWH} warehouses={warehouses} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <View style={styles.kpiGrid}>
          <KPICard label="Net Sales" value={totalSales} color="#059669" iconBg="#DCFCE7" icon="trending-up" />
          <KPICard label="COGS" value={totalPurchase} color="#DC2626" iconBg="#FEF2F2" icon="package-variant" />
          <KPICard label="Gross Profit" value={grossProfit} color={grossProfit >= 0 ? '#059669' : '#DC2626'} iconBg={grossProfit >= 0 ? '#DCFCE7' : '#FEF2F2'} icon="chart-bar" />
          <KPICard label="Net Profit" value={netProfit} color={netProfit >= 0 ? '#059669' : '#DC2626'} iconBg={netProfit >= 0 ? '#DCFCE7' : '#FEF2F2'} icon="currency-inr" />
        </View>

        {/* Margin badge */}
        <View style={[styles.marginBadge, { backgroundColor: netProfit >= 0 ? '#DCFCE7' : '#FEF2F2' }]}>
          <Icon name={netProfit >= 0 ? 'trending-up' : 'trending-down'} size={16}
            color={netProfit >= 0 ? '#059669' : '#DC2626'} />
          <Text style={[styles.marginText, { color: netProfit >= 0 ? '#059669' : '#DC2626' }]}>
            Profit Margin: {margin}%
          </Text>
        </View>

        {/* ── Income Statement ─────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Income Statement</Text>
          <PLRow label="Sales Revenue"        value={totalSales}    color="#059669" />
          <PLRow label="Cost of Goods Sold"   value={-totalPurchase} color="#DC2626" indent />
          <PLRow label="Gross Profit"         value={grossProfit}   bold
            color={grossProfit >= 0 ? '#059669' : '#DC2626'} separator />
          {opExpenses > 0    && <PLRow label="Operating Expenses" value={-opExpenses}   indent color="#DC2626" />}
          {salary > 0        && <PLRow label="Salary / Payroll"   value={-salary}       indent color="#DC2626" />}
          {marketing > 0     && <PLRow label="Marketing Cost"     value={-marketing}    indent color="#DC2626" />}
          <PLRow label="Net Profit"   value={netProfit}  bold separator
            color={netProfit >= 0 ? '#059669' : '#DC2626'} />
        </View>

        {/* ── Expense Breakdown ─────────────────────────────────────────── */}
        {expBreakdown.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Expense Breakdown</Text>
            {expBreakdown.map((row, i) => (
              <View key={i} style={styles.expRow}>
                <View style={styles.expRowLeft}>
                  <View style={[styles.expDot, { backgroundColor: '#' + Math.abs(row.category?.charCodeAt(0) * 120000 || 0).toString(16).padStart(6, '0').slice(0, 6) }]} />
                  <Text style={styles.expCat}>{row.category}</Text>
                  <Text style={styles.expCount}>({row.count})</Text>
                </View>
                <Text style={styles.expAmt}>{formatCurrency(row.total)}</Text>
              </View>
            ))}
            <View style={styles.separator} />
            <View style={styles.expRow}>
              <Text style={[styles.expCat, { fontWeight: '800' }]}>Total Expenses</Text>
              <Text style={[styles.expAmt, { color: '#DC2626', fontWeight: '800' }]}>
                {formatCurrency(totalExpenses + salary)}
              </Text>
            </View>
          </View>
        )}

        {/* ── Monthly Trend ────────────────────────────────────────────── */}
        {d.trend?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Trend</Text>
            {d.trend.slice().reverse().map((t, i) => {
              const max = Math.max(...d.trend.map(x => x.sales || 0), 1);
              const pct = Math.min(((t.sales || 0) / max) * 100, 100);
              return (
                <View key={i} style={styles.trendRow}>
                  <Text style={styles.trendMonth}>{t.month}</Text>
                  <View style={styles.trendBarWrap}>
                    <View style={[styles.trendBar, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.trendVal}>{formatCurrency(t.sales || 0)}</Text>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* ── Warehouse Picker ──────────────────────────────────────────── */}
      <Modal visible={showWH} transparent animationType="fade" onRequestClose={() => setShowWH(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowWH(false)}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select Warehouse</Text>
            {[{ _id: 'all', name: 'All Warehouses' }, ...warehouses].map(w => (
              <TouchableOpacity key={w._id}
                style={[styles.pickerItem, warehouse === w._id && styles.pickerItemActive]}
                onPress={() => { setWarehouse(w._id); setShowWH(false); }}>
                <Icon name="warehouse" size={16} color={warehouse === w._id ? WHITE : PRIMARY} />
                <Text style={[styles.pickerText, warehouse === w._id && styles.pickerTextActive]}>{w.name}</Text>
                {warehouse === w._id && <Icon name="check" size={16} color={WHITE} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function PLHeader({ navigation, period, setPeriod, warehouse, setShowWH, warehouses }) {
  const whName = warehouse === 'all' ? 'All Warehouses'
    : warehouses.find(w => w._id === warehouse)?.name || 'Warehouse';
  return (
    <View style={styles.header}>
      <View style={styles.headerDecor} />
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Profit & Loss</Text>
          <Text style={styles.headerSub}>Financial Performance</Text>
        </View>
        <TouchableOpacity style={styles.whBtn} onPress={() => setShowWH(true)}>
          <Icon name="warehouse" size={14} color={WHITE} />
          <Text style={styles.whBtnText} numberOfLines={1}>{whName.split(' ')[0]}</Text>
          <Icon name="chevron-down" size={13} color={WHITE} />
        </TouchableOpacity>
      </View>
      {/* Period tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.periodTabs}>
        {PERIOD_TABS.map(t => (
          <TouchableOpacity key={t.key}
            style={[styles.periodBtn, period === t.key && styles.periodBtnActive]}
            onPress={() => setPeriod(t.key)} activeOpacity={0.8}>
            <Text style={[styles.periodText, period === t.key && styles.periodTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: BG },
  content: { padding: 16, paddingBottom: 40, gap: 12 },

  header: { backgroundColor: PRIMARY, paddingBottom: 4, overflow: 'hidden' },
  headerDecor: {
    position: 'absolute', top: -30, right: -40, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: WHITE },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  whBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  whBtnText: { color: WHITE, fontSize: 11, fontWeight: '700', maxWidth: 70 },

  periodTabs: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  periodBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  periodBtnActive: { backgroundColor: ORANGE },
  periodText:      { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  periodTextActive:{ color: WHITE },

  // KPI
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    flex: 1, minWidth: 140, backgroundColor: WHITE, borderRadius: 16,
    padding: 14, alignItems: 'center', ...SHADOW,
  },
  kpiIcon:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  kpiValue: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  kpiLabel: { fontSize: 10, color: MUTED, fontWeight: '600', textAlign: 'center' },

  marginBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 10, borderRadius: 12,
  },
  marginText: { fontSize: 14, fontWeight: '800' },

  // Cards
  card: { backgroundColor: WHITE, borderRadius: 16, padding: 16, ...SHADOW },
  cardTitle: { fontSize: 14, fontWeight: '800', color: TEXT, marginBottom: 12 },

  // P&L rows
  plRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  plRowBold:  { backgroundColor: '#F8F9FC', borderRadius: 8, paddingHorizontal: 8 },
  plLabel:    { fontSize: 13, color: TEXT, flex: 1 },
  plLabelBold:{ fontWeight: '800', fontSize: 14 },
  plIndent:   { paddingLeft: 12 },
  plValue:    { fontSize: 13, fontWeight: '600', textAlign: 'right' },
  plValueBold:{ fontWeight: '800', fontSize: 14 },
  separator:  { height: 1, backgroundColor: BORDER, marginVertical: 4 },

  // Expense breakdown
  expRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: BORDER },
  expRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  expDot: { width: 8, height: 8, borderRadius: 4 },
  expCat:  { fontSize: 13, color: TEXT },
  expCount:{ fontSize: 11, color: MUTED },
  expAmt:  { fontSize: 13, fontWeight: '700', color: TEXT },

  // Trend
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  trendMonth: { fontSize: 11, color: MUTED, width: 60 },
  trendBarWrap: { flex: 1, height: 8, backgroundColor: '#F0F2F8', borderRadius: 4, overflow: 'hidden' },
  trendBar: { height: '100%', backgroundColor: PRIMARY, borderRadius: 4 },
  trendVal: { fontSize: 11, fontWeight: '700', color: TEXT, width: 70, textAlign: 'right' },

  // Warehouse picker
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  pickerTitle: { fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 14 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 6, backgroundColor: '#F4F5F8' },
  pickerItemActive: { backgroundColor: PRIMARY },
  pickerText:       { flex: 1, fontSize: 14, fontWeight: '600', color: TEXT },
  pickerTextActive: { color: WHITE },
});
