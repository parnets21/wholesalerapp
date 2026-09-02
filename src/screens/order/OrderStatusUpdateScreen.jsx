// src/screens/order/OrderStatusUpdateScreen.jsx
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormField from '../../components/FormField';
import PrimaryButton from '../../components/PrimaryButton';
import { orderService } from '../../services/orderService';
import { theme } from '../../utils/theme';

const VALID_TRANSITIONS = {
  New: ['Accepted', 'Cancelled'],
  Accepted: ['Processing', 'Cancelled'],
  Processing: ['Ready', 'Cancelled'],
  Ready: ['Dispatched'],
  Dispatched: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

export default function OrderStatusUpdateScreen({ route, navigation }) {
  const { orderId, currentStatus } = route.params;
  const [selectedStatus, setSelectedStatus] = useState('');
  const [remarks,  setRemarks]  = useState('');
  const [loading,  setLoading]  = useState(false);

  const nextStatuses = VALID_TRANSITIONS[currentStatus] || [];

  const handleUpdate = async () => {
    if (!selectedStatus) { Alert.alert('', 'Please select a status'); return; }
    setLoading(true);
    try {
      await orderService.updateStatus(orderId, { status: selectedStatus, remarks });
      Alert.alert('Success', `Order status updated to ${selectedStatus}`);
      navigation.goBack();
    } catch (e) { Alert.alert('Error', e?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.current}>Current: <Text style={styles.currentValue}>{currentStatus}</Text></Text>
      <Text style={styles.label}>Select New Status</Text>
      {nextStatuses.length === 0
        ? <Text style={styles.noTransition}>No further status transitions available</Text>
        : nextStatuses.map(s => (
            <TouchableOpacity key={s} style={[styles.option, selectedStatus === s && styles.selected]} onPress={() => setSelectedStatus(s)}>
              <View style={styles.radio}>{selectedStatus === s && <View style={styles.radioDot} />}</View>
              <Text style={[styles.optionText, selectedStatus === s && { color: theme.colors.primary }]}>{s}</Text>
            </TouchableOpacity>
          ))
      }
      <FormField label="Remarks (optional)" value={remarks} onChangeText={setRemarks} multiline placeholder="Add any notes..." />
      {nextStatuses.length > 0 && <PrimaryButton title="Update Status" onPress={handleUpdate} loading={loading} style={styles.btn} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { padding: 20, backgroundColor: theme.colors.background, flexGrow: 1 },
  current:       { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 20 },
  currentValue:  { fontWeight: '700', color: theme.colors.textPrimary },
  label:         { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 12 },
  option:        { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: theme.colors.border },
  selected:      { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '08' },
  radio:         { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.primary, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  radioDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  optionText:    { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary },
  noTransition:  { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', padding: 24 },
  btn:           { marginTop: 20 },
});
