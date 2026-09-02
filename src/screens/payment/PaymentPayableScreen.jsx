// src/screens/payment/PaymentPayableScreen.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { paymentService } from '../../services/paymentService';
import { formatCurrency } from '../../utils/formatters';
import { theme } from '../../utils/theme';

export default function PaymentPayableScreen({ navigation }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await paymentService.payable({}); setSuppliers(res?.data ?? res ?? []); }
    catch (e) { setError(e?.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PaymentEntry', { partyType: 'Supplier', partyId: item._id, partyName: item.name })} activeOpacity={0.75}>
      <View style={styles.row}>
        <View><Text style={styles.name}>{item.name}</Text><Text style={styles.mobile}>{item.mobile}</Text></View>
        <View style={styles.amountBox}>
          <Text style={styles.amount}>{formatCurrency(item.outstanding)}</Text>
          <Text style={styles.amtLabel}>Payable</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} onRetry={load} />;

  return (
    <FlatList
      data={suppliers}
      keyExtractor={i => i._id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      style={{ backgroundColor: theme.colors.background }}
      ListEmptyComponent={<EmptyState icon="✅" title="No pending payables" />}
    />
  );
}

const styles = StyleSheet.create({
  list:      { padding: 12 },
  card:      { backgroundColor: theme.colors.surface, borderRadius: 10, padding: 14, marginBottom: 8, elevation: 2 },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name:      { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  mobile:    { fontSize: 12, color: theme.colors.textSecondary },
  amountBox: { alignItems: 'flex-end' },
  amount:    { fontSize: 17, fontWeight: '800', color: theme.colors.danger },
  amtLabel:  { fontSize: 11, color: theme.colors.textSecondary },
});
