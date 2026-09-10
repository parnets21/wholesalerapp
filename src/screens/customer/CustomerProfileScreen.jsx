// src/screens/customer/CustomerProfileScreen.jsx
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import Icon from '../../components/Icon';
import { customerService } from '../../services/customerService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { theme } from '../../utils/theme';

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '—'}</Text>
  </View>
);

// Match orders/enquiries to this customer by mobile (preferred) or name.
function belongsToCustomer(row, customer) {
  const mob = (customer.mobile || '').replace(/\D/g, '');
  const rowMob = (row.customer_mobile || row.retailer_mobile || '').replace(/\D/g, '');
  if (mob && rowMob) return rowMob === mob;
  const name = (customer.name || '').trim().toLowerCase();
  const rowName = (row.customer_name || row.retailer_name || '').trim().toLowerCase();
  return name && rowName && rowName === name;
}

export default function CustomerProfileScreen({ route, navigation }) {
  const { customerId } = route.params;
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders]     = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await customerService.get(customerId);
        const cust = res?.data ?? res;
        if (!active) return;
        setCustomer(cust);

        // Fetch orders + enquiries by the customer's mobile, then filter to this customer.
        const query = cust?.mobile || cust?.name || '';
        if (query) {
          const [oRes, eRes] = await Promise.all([
            customerService.orders(query).catch(() => null),
            customerService.enquiries(query).catch(() => null),
          ]);
          const allOrders = oRes?.data?.orders || oRes?.orders || oRes?.data || [];
          const allEnq    = eRes?.data?.enquiries || eRes?.enquiries || eRes?.data || [];
          if (active) {
            setOrders((Array.isArray(allOrders) ? allOrders : []).filter(o => belongsToCustomer(o, cust)));
            setEnquiries((Array.isArray(allEnq) ? allEnq : []).filter(e => belongsToCustomer(e, cust)));
          }
        }
      } catch (e) {
        if (active) setError(e?.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [customerId]);

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} />;
  if (!customer) return <ErrorMessage message="Customer not found" />;

  // Outstanding: prefer stored value, else sum of unpaid order totals.
  const outstanding = customer.outstanding != null
    ? customer.outstanding
    : orders.reduce((s, o) => s + (o.balance_due != null ? o.balance_due : 0), 0);

  const totalOrderValue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.avatarBox}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(customer.name || 'C')[0].toUpperCase()}</Text></View>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.mobile}>{customer.mobile}</Text>
      </View>

      {/* Stat strip */}
      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{orders.length}</Text>
          <Text style={styles.statLbl}>Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{enquiries.length}</Text>
          <Text style={styles.statLbl}>Enquiries</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(totalOrderValue)}</Text>
          <Text style={styles.statLbl}>Order Value</Text>
        </View>
      </View>

      <View style={[styles.outstandingBox, { borderColor: outstanding > 0 ? theme.colors.danger : theme.colors.secondary }]}>
        <Text style={styles.outstandingLabel}>Outstanding Balance</Text>
        <Text style={[styles.outstandingAmount, { color: outstanding > 0 ? theme.colors.danger : theme.colors.secondary }]}>{formatCurrency(outstanding || 0)}</Text>
      </View>

      <View style={styles.section}>
        <InfoRow label="Email"   value={customer.email} />
        <InfoRow label="Address" value={customer.address} />
        <InfoRow label="City"    value={customer.city} />
        <InfoRow label="State"   value={customer.state} />
        <InfoRow label="GST No"  value={customer.gst_number} />
      </View>

      {/* Previous Orders */}
      <Text style={styles.blockTitle}>Previous Orders ({orders.length})</Text>
      {orders.length === 0 ? (
        <Text style={styles.emptyLine}>No orders yet.</Text>
      ) : orders.slice(0, 10).map(o => (
        <TouchableOpacity key={o._id} style={styles.rowCard} onPress={() => navigation.navigate('OrderDetail', { orderId: o._id })} activeOpacity={0.85}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle} numberOfLines={1}>{o.product_name || o.order_code || 'Order'}</Text>
            <Text style={styles.rowSub}>{o.order_code} · {formatDate(o.order_date || o.created_at)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.rowAmt}>{formatCurrency(o.total_amount)}</Text>
            <Text style={styles.rowStatus}>{o.status}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Previous Enquiries */}
      <Text style={styles.blockTitle}>Previous Enquiries ({enquiries.length})</Text>
      {enquiries.length === 0 ? (
        <Text style={styles.emptyLine}>No enquiries yet.</Text>
      ) : enquiries.slice(0, 10).map(e => (
        <TouchableOpacity key={e._id} style={styles.rowCard} onPress={() => navigation.navigate('EnquiryDetail', { enquiryId: e._id })} activeOpacity={0.85}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle} numberOfLines={1}>{e.product_name || e.product_code || 'Enquiry'}</Text>
            <Text style={styles.rowSub}>Qty {e.qty} {e.unit || ''} · {formatDate(e.created_at)}</Text>
          </View>
          <Text style={styles.rowStatus}>{e.status}</Text>
        </TouchableOpacity>
      ))}

      <View style={{ height: 12 }} />
      <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('AddCustomer', { customer })}>
        <Text style={styles.linkText}>✏️ Edit Customer</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('CustomerHistory', { customerId })}>
        <Text style={styles.linkText}>📋 View History</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('CustomerLedger', { customerId })}>
        <Text style={styles.linkText}>📒 View Ledger</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('PaymentEntry', { partyType: 'Customer', partyId: customerId, partyName: customer.name })}>
        <Text style={styles.linkText}>💳 Record Payment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:            { flex: 1, backgroundColor: theme.colors.background },
  avatarBox:         { alignItems: 'center', marginBottom: 16 },
  avatar:            { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText:        { fontSize: 32, color: '#fff', fontWeight: '700' },
  name:              { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary },
  mobile:            { fontSize: 14, color: theme.colors.textSecondary },

  statRow:           { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard:          { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  statVal:           { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary },
  statLbl:           { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },

  outstandingBox:    { borderWidth: 2, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  outstandingLabel:  { fontSize: 12, color: theme.colors.textSecondary },
  outstandingAmount: { fontSize: 26, fontWeight: '800' },
  section:           { backgroundColor: theme.colors.surface, borderRadius: 10, padding: 14, marginBottom: 12, elevation: 1 },
  infoRow:           { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  infoLabel:         { fontSize: 13, color: theme.colors.textSecondary },
  infoValue:         { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, maxWidth: '60%', textAlign: 'right' },

  blockTitle:        { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 8, marginBottom: 8 },
  emptyLine:         { fontSize: 12.5, color: theme.colors.textSecondary, marginBottom: 8, fontStyle: 'italic' },
  rowCard:           { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border },
  rowTitle:          { fontSize: 13.5, fontWeight: '700', color: theme.colors.textPrimary },
  rowSub:            { fontSize: 11.5, color: theme.colors.textSecondary, marginTop: 2 },
  rowAmt:            { fontSize: 13.5, fontWeight: '800', color: theme.colors.accent },
  rowStatus:         { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, marginTop: 2 },

  linkBtn:           { backgroundColor: theme.colors.surface, padding: 14, borderRadius: 10, marginBottom: 8, elevation: 1 },
  linkText:          { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
});
