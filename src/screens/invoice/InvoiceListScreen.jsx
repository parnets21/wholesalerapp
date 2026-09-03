// src/screens/invoice/InvoiceListScreen.jsx
//
// Invoices generated for this wholesaler (after admin approves an order).
// Each card has a View button → full branded invoice detail + download.
//
import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator, FlatList, Platform, RefreshControl, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import Icon from '../../components/Icon';
import { invoiceService } from '../../services/invoiceService';
import { theme } from '../../utils/theme';

const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const PAY_META = {
  Paid:             { bg: '#DCFCE7', fg: '#047857' },
  'Partially Paid': { bg: '#FEF3C7', fg: '#B45309' },
  Unpaid:           { bg: '#FEE2E2', fg: '#DC2626' },
  Overdue:          { bg: '#FEE2E2', fg: '#DC2626' },
  Cancelled:        { bg: '#F1F5F9', fg: '#64748B' },
};

export default function InvoiceListScreen({ navigation }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await invoiceService.list({ limit: 100 });
      setRows(res?.data?.invoices || res?.invoices || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openDetail = (item) => navigation.navigate('InvoiceDetail', { invoiceId: item._id, invoice: item });

  const renderItem = ({ item }) => {
    const meta = PAY_META[item.payment_status] || PAY_META.Unpaid;
    const itemCount = (item.items || []).length;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.iconBox}>
            <Icon name="receipt-text-outline" size={20} color={theme.colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.invNo}>{item.invoice_no}</Text>
            <Text style={styles.meta}>
              {item.order_no ? `${item.order_no} · ` : ''}{fmtDate(item.invoice_date)}
            </Text>
            <Text style={styles.metaSub}>{itemCount} item{itemCount === 1 ? '' : 's'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.total}>{money(item.grand_total)}</Text>
            <View style={[styles.badge, { backgroundColor: meta.bg }]}>
              <Text style={[styles.badgeText, { color: meta.fg }]}>{item.payment_status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFoot}>
          {item.balance_due > 0 ? (
            <Text style={styles.balDue}>Balance due: <Text style={{ color: '#DC2626', fontWeight: '800' }}>{money(item.balance_due)}</Text></Text>
          ) : (
            <Text style={styles.paidText}>✓ Fully paid</Text>
          )}
          <TouchableOpacity style={styles.viewBtn} onPress={() => openDetail(item)} activeOpacity={0.85}>
            <Icon name="eye-outline" size={16} color="#fff" />
            <Text style={styles.viewBtnText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>My Invoices</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.accent} /></View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={r => r._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[theme.colors.accent]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="receipt-text-outline" size={44} color={theme.colors.textDisabled} />
              <Text style={styles.emptyTitle}>No invoices yet</Text>
              <Text style={styles.emptySub}>Invoices appear here once an admin approves your order.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF4E8', alignItems: 'center', justifyContent: 'center' },
  invNo: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary },
  meta: { fontSize: 11.5, color: theme.colors.textSecondary, marginTop: 2 },
  metaSub: { fontSize: 11, color: theme.colors.textDisabled, marginTop: 1 },
  total: { fontSize: 16, fontWeight: '900', color: theme.colors.accent },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, marginTop: 4 },
  badgeText: { fontSize: 10, fontWeight: '800' },

  cardFoot: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  balDue: { fontSize: 12, color: theme.colors.textSecondary },
  paidText: { fontSize: 12, fontWeight: '700', color: '#047857' },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8,
  },
  viewBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  empty: { alignItems: 'center', paddingTop: 70, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary },
  emptySub: { fontSize: 12.5, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
});
