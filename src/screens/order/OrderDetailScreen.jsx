// src/screens/order/OrderDetailScreen.jsx
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import PrimaryButton from '../../components/PrimaryButton';
import { orderService } from '../../services/orderService';
import { calculateLineTotal, formatCurrency, formatDate } from '../../utils/formatters';
import { theme } from '../../utils/theme';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await orderService.get(orderId);
      setOrder(res?.data ?? res);
    } catch (e) { setError(e?.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [orderId]);

  const [acting, setActing] = useState(false);
  const quickStatus = (status, label) => {
    Alert.alert(`${label} Order?`, `Mark this order as ${status}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label, style: status === 'Cancelled' ? 'destructive' : 'default',
        onPress: async () => {
          setActing(true);
          try {
            await orderService.updateStatus(orderId, { status });
            setOrder(prev => ({ ...prev, status }));
            Alert.alert('Done', `Order ${status.toLowerCase()}.`);
          } catch (e) {
            Alert.alert('Failed', e?.message || 'Could not update the order.');
          } finally { setActing(false); }
        },
      },
    ]);
  };

  const [invoicing, setInvoicing] = useState(false);
  const genInvoice = async () => {
    setInvoicing(true);
    try {
      const r = await orderService.generateInvoice(orderId);
      const inv = r?.data ?? r;
      setOrder(prev => ({ ...prev, invoice_no: inv?.invoice_no || prev.invoice_no }));
      Alert.alert('Invoice Generated', `GST Invoice ${inv?.invoice_no || ''} created for this order.`);
    } catch (e) {
      Alert.alert('Failed', e?.message || 'Could not generate invoice.');
    } finally { setInvoicing(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} onRetry={load} />;
  if (!order)  return <ErrorMessage message="Order not found" />;

  const items = order.items || [];
  let subtotal = 0, totalGST = 0;
  items.forEach(item => {
    const { gst_amount, line_total } = calculateLineTotal(item.qty, item.rate, item.gst_rate);
    subtotal += item.qty * item.rate;
    totalGST += gst_amount;
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.orderNo}>{order.order_code || '—'}</Text>
        <Text style={styles.date}>{formatDate(order.created_at)}</Text>
        <View style={styles.statusChip}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Customer</Text>
        <Text style={styles.value}>{order.customer_name}</Text>
        <Text style={styles.sub}>{order.customer_mobile}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Products</Text>
        {items.map((item, i) => {
          const { gst_amount, line_total } = calculateLineTotal(item.qty, item.rate, item.gst_rate);
          return (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <Text style={styles.itemDetail}>{item.qty} × {formatCurrency(item.rate)} + {formatCurrency(gst_amount)} GST = {formatCurrency(line_total)}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.totals}>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text></View>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>GST</Text><Text style={styles.totalValue}>{formatCurrency(totalGST)}</Text></View>
        {order.discount > 0 && <View style={styles.totalRow}><Text style={styles.totalLabel}>Discount</Text><Text style={[styles.totalValue, { color: theme.colors.danger }]}>-{formatCurrency(order.discount)}</Text></View>}
        <View style={[styles.totalRow, styles.grandTotal]}><Text style={styles.grandLabel}>Grand Total</Text><Text style={styles.grandValue}>{formatCurrency(order.grand_total)}</Text></View>
      </View>
      {/* Accept / Reject — only for a new order */}
      {order.status === 'New' && (
        <View style={styles.acceptRow}>
          <TouchableOpacity style={[styles.acceptBtn, acting && { opacity: 0.6 }]} disabled={acting}
            onPress={() => quickStatus('Accepted', 'Accept')} activeOpacity={0.85}>
            <Text style={styles.acceptBtnText}>✓ Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rejectBtn, acting && { opacity: 0.6 }]} disabled={acting}
            onPress={() => quickStatus('Cancelled', 'Reject')} activeOpacity={0.85}>
            <Text style={styles.rejectBtnText}>✕ Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      <PrimaryButton title="Update Status" onPress={() => navigation.navigate('OrderStatusUpdate', { orderId, currentStatus: order.status })} style={{ marginTop: 16, marginBottom: 8 }} />

      {/* Generate GST invoice once the order is accepted */}
      {order.status !== 'New' && order.status !== 'Cancelled' && (
        <TouchableOpacity style={[styles.invoiceBtn, invoicing && { opacity: 0.6 }]} disabled={invoicing}
          onPress={genInvoice} activeOpacity={0.85}>
          <Text style={styles.invoiceBtnText}>
            {order.invoice_no ? `🧾 Invoice ${order.invoice_no}` : (invoicing ? 'Generating…' : '🧾 Generate GST Invoice')}
          </Text>
        </TouchableOpacity>
      )}

      {['New','Accepted','Processing','Ready'].includes(order.status) && (
        <PrimaryButton title="Create Dispatch" onPress={() => navigation.navigate('DispatchEntry', { orderId })} variant="outline" />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: theme.colors.background },
  header:      { backgroundColor: theme.colors.surface, borderRadius: 10, padding: 16, marginBottom: 10, elevation: 2 },
  orderNo:     { fontSize: 20, fontWeight: '800', color: theme.colors.primary },
  date:        { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  statusChip:  { backgroundColor: theme.colors.primary + '22', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8, alignSelf: 'flex-start' },
  statusText:  { color: theme.colors.primary, fontWeight: '700', fontSize: 12 },
  section:     { backgroundColor: theme.colors.surface, borderRadius: 10, padding: 14, marginBottom: 10, elevation: 1 },
  label:       { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, textTransform: 'uppercase', marginBottom: 6 },
  value:       { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  sub:         { fontSize: 12, color: theme.colors.textSecondary },
  itemRow:     { marginBottom: 8 },
  itemName:    { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
  itemDetail:  { fontSize: 12, color: theme.colors.textSecondary },
  totals:      { backgroundColor: theme.colors.surface, borderRadius: 10, padding: 14, marginBottom: 10, elevation: 1 },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel:  { fontSize: 13, color: theme.colors.textSecondary },
  totalValue:  { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary },
  grandTotal:  { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 8, marginTop: 4 },
  grandLabel:  { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  grandValue:  { fontSize: 17, fontWeight: '800', color: theme.colors.primary },

  acceptRow:   { flexDirection: 'row', gap: 10, marginTop: 16 },
  acceptBtn:   { flex: 1, backgroundColor: '#059669', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  acceptBtnText:{ color: '#fff', fontSize: 15, fontWeight: '800' },
  rejectBtn:   { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#DC2626' },
  rejectBtnText:{ color: '#DC2626', fontSize: 15, fontWeight: '800' },
  invoiceBtn:  { backgroundColor: '#0F766E', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  invoiceBtnText:{ color: '#fff', fontSize: 15, fontWeight: '800' },
});
