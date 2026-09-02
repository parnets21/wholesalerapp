// src/screens/customer/CustomerProfileScreen.jsx
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { customerService } from '../../services/customerService';
import { formatCurrency } from '../../utils/formatters';
import { theme } from '../../utils/theme';

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '—'}</Text>
  </View>
);

export default function CustomerProfileScreen({ route, navigation }) {
  const { customerId } = route.params;
  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    customerService.get(customerId).then(res => setCustomer(res?.data ?? res)).catch(e => setError(e?.message)).finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} />;
  if (!customer) return <ErrorMessage message="Customer not found" />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.avatarBox}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(customer.name || 'C')[0].toUpperCase()}</Text></View>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.mobile}>{customer.mobile}</Text>
      </View>

      <View style={[styles.outstandingBox, { borderColor: customer.outstanding > 0 ? theme.colors.danger : theme.colors.secondary }]}>
        <Text style={styles.outstandingLabel}>Outstanding Balance</Text>
        <Text style={[styles.outstandingAmount, { color: customer.outstanding > 0 ? theme.colors.danger : theme.colors.secondary }]}>{formatCurrency(customer.outstanding || 0)}</Text>
      </View>

      <View style={styles.section}>
        <InfoRow label="Email"   value={customer.email} />
        <InfoRow label="Address" value={customer.address} />
        <InfoRow label="City"    value={customer.city} />
        <InfoRow label="State"   value={customer.state} />
        <InfoRow label="GST No"  value={customer.gst_number} />
      </View>

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
  outstandingBox:    { borderWidth: 2, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 },
  outstandingLabel:  { fontSize: 12, color: theme.colors.textSecondary },
  outstandingAmount: { fontSize: 26, fontWeight: '800' },
  section:           { backgroundColor: theme.colors.surface, borderRadius: 10, padding: 14, marginBottom: 12, elevation: 1 },
  infoRow:           { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  infoLabel:         { fontSize: 13, color: theme.colors.textSecondary },
  infoValue:         { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, maxWidth: '60%', textAlign: 'right' },
  linkBtn:           { backgroundColor: theme.colors.surface, padding: 14, borderRadius: 10, marginBottom: 8, elevation: 1 },
  linkText:          { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
});
