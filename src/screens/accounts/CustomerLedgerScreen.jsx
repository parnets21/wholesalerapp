// src/screens/accounts/CustomerLedgerScreen.jsx
// Full customer ledger — debit/credit/balance rows with running total

import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList, RefreshControl, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import Icon           from '../../components/Icon';
import EmptyState     from '../../components/EmptyState';
import ErrorMessage   from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { accountsService }           from '../../services/accountsService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { theme }                     from '../../utils/theme';

const PRIMARY = theme.colors.primary;
const BG      = '#F0F2F8';
const WHITE   = '#FFFFFF';
const TEXT    = '#171A2B';
const MUTED   = '#6B7280';
const BORDER  = '#E8EAF0';
const SHADOW  = { shadowColor: '#111827', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 3 };

const TYPE_CFG = {
  Sale:    { color: '#DC2626', bg: '#FEF2F2', icon: 'receipt-text-outline',    label: 'SALE' },
  Payment: { color: '#059669', bg: '#ECFDF5', icon: 'cash-check',              label: 'PAID' },
  default: { color: '#6B7280', bg: '#F3F4F6', icon: 'swap-horizontal',         label: 'TXN'  },
};

export default function CustomerLedgerScreen({ route, navigation }) {
  const { customerId, customerName } = route?.params || {};
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const [from,       setFrom]       = useState('');
  const [to,         setTo]         = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await accountsService.customerLedger(customerId, {
        from_date: from || undefined,
        to_date:   to   || undefined,
      });
      setData(res?.data ?? res);
    } catch (e) { setError(e?.message || 'Failed to load ledger'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [customerId, from, to]);

  useEffect(() => { load(); }, [customerId]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading && !data) return <LoadingSpinner fullScreen />;
  if (error)            return <ErrorMessage message={error} onRetry={load} />;

  const ledger  = data?.ledger  || [];
  const closing = data?.closingBalance ?? 0;
  const cust    = data?.customer;

  const renderRow = ({ item, index }) => {
    const cfg = TYPE_CFG[item.type] || TYPE_CFG.default;
    const isFirst = index === 0;
    return (
      <View style={[styles.ledgerRow, isFirst && styles.ledgerRowFirst]}>
        {/* Date & type */}
        <View style={styles.ledgerLeft}>
          <View style={[styles.typeDot, { backgroundColor: cfg.bg }]}>
            <Icon name={cfg.icon} size={13} color={cfg.color} />
          </View>
          <View style={styles.ledgerInfo}>
            <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
            <Text style={styles.ledgerDate}>{formatDate(item.date)}</Text>
            {item.sale_code && <Text style={styles.ledgerRef}>{item.sale_code}</Text>}
          </View>
        </View>

        {/* Amounts */}
        <View style={styles.ledgerAmounts}>
          {item.debit > 0 ? (
            <Text style={styles.debitText}>{formatCurrency(item.debit)}</Text>
          ) : (
            <Text style={styles.creditText}>{formatCurrency(item.credit)}</Text>
          )}
          <Text style={[
            styles.balanceText,
            { color: (item.balance || 0) > 0 ? '#DC2626' : '#059669' }
          ]}>
            {formatCurrency(Math.abs(item.balance || 0))}
            {(item.balance || 0) > 0 ? ' Dr' : ' Cr'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerDecor} />
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={WHITE} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Customer Ledger</Text>
            {customerName || cust?.name ? (
              <Text style={styles.headerSub}>{customerName || cust?.name}</Text>
            ) : null}
          </View>
        </View>

        {/* Closing balance pill */}
        <View style={styles.closingStrip}>
          <View style={styles.closingItem}>
            <Text style={styles.closingLabel}>Closing Balance</Text>
            <Text style={[styles.closingValue, { color: closing > 0 ? '#FCA5A5' : '#86EFAC' }]}>
              {formatCurrency(Math.abs(closing))}
              {closing > 0 ? ' Dr' : ' Cr'}
            </Text>
          </View>
          <View style={styles.closingDivider} />
          <View style={styles.closingItem}>
            <Text style={styles.closingLabel}>Total Transactions</Text>
            <Text style={styles.closingValue}>{ledger.length}</Text>
          </View>
        </View>

        {/* Date filters */}
        <View style={styles.filterRow}>
          <View style={styles.filterInput}>
            <Icon name="calendar-start" size={14} color={MUTED} />
            <TextInput
              style={styles.filterText}
              placeholder="From YYYY-MM-DD"
              placeholderTextColor={MUTED}
              value={from}
              onChangeText={setFrom}
            />
          </View>
          <View style={styles.filterInput}>
            <Icon name="calendar-end" size={14} color={MUTED} />
            <TextInput
              style={styles.filterText}
              placeholder="To YYYY-MM-DD"
              placeholderTextColor={MUTED}
              value={to}
              onChangeText={setTo}
            />
          </View>
          <TouchableOpacity style={styles.filterApply} onPress={load}>
            <Icon name="filter" size={16} color={WHITE} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Column headers */}
      <View style={styles.colHeader}>
        <Text style={[styles.colText, { flex: 1 }]}>Date / Type</Text>
        <Text style={[styles.colText, styles.colRight]}>Amount</Text>
        <Text style={[styles.colText, styles.colRight]}>Balance</Text>
      </View>

      <FlatList
        data={ledger}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderRow}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
        ListEmptyComponent={<EmptyState icon="📒" title="No ledger entries" subtitle="Transactions with this customer appear here" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  header: { backgroundColor: PRIMARY, paddingBottom: 12, overflow: 'hidden' },
  headerDecor: { position: 'absolute', top: -30, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: WHITE },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: 1 },

  closingStrip: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingVertical: 10 },
  closingItem: { flex: 1, alignItems: 'center' },
  closingLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '600', textTransform: 'uppercase' },
  closingValue: { fontSize: 17, fontWeight: '800', color: WHITE, marginTop: 2 },
  closingDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  filterInput: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: WHITE, borderRadius: 10, paddingHorizontal: 10, height: 38 },
  filterText: { flex: 1, fontSize: 12, color: TEXT },
  filterApply: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  colHeader: { flexDirection: 'row', backgroundColor: '#EDE8FF', paddingHorizontal: 16, paddingVertical: 8 },
  colText: { fontSize: 10, fontWeight: '700', color: PRIMARY, textTransform: 'uppercase' },
  colRight: { textAlign: 'right', minWidth: 80 },

  list: { paddingBottom: 30 },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER },
  ledgerRowFirst: { borderTopWidth: 0 },
  ledgerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeDot: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ledgerInfo: { flex: 1 },
  typeLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  ledgerDate: { fontSize: 12, color: TEXT, fontWeight: '600', marginTop: 1 },
  ledgerRef: { fontSize: 10, color: MUTED, marginTop: 1 },
  ledgerAmounts: { alignItems: 'flex-end', gap: 3 },
  debitText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  creditText: { fontSize: 13, fontWeight: '700', color: '#059669' },
  balanceText: { fontSize: 11, fontWeight: '700' },
});
