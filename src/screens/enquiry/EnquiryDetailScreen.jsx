// src/screens/enquiry/EnquiryDetailScreen.jsx
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfirmDialog from '../../components/ConfirmDialog';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import PrimaryButton from '../../components/PrimaryButton';
import { enquiryService } from '../../services/enquiryService';
import { orderService } from '../../services/orderService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { theme } from '../../utils/theme';

const STATUS_TRANSITIONS = { New: ['Viewed','Replied','Negotiation','Confirmed','Cancelled'], Viewed: ['Replied','Negotiation','Confirmed','Cancelled'], Replied: ['Negotiation','Confirmed','Cancelled'], Negotiation: ['Confirmed','Cancelled'] };

export default function EnquiryDetailScreen({ route, navigation }) {
  const { enquiryId } = route.params;
  const [enquiry, setEnquiry]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);
  const [dialog,  setDialog]    = useState({ visible: false, targetStatus: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await enquiryService.get(enquiryId);
      const data = res?.data ?? res;
      setEnquiry(data);
      if (data?.status === 'New') {
        await enquiryService.update(enquiryId, { status: 'Viewed' }).catch(() => {});
        setEnquiry(prev => ({ ...prev, status: 'Viewed' }));
      }
    } catch (e) { setError(e?.message || 'Failed to load enquiry'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [enquiryId]);

  const changeStatus = async (status) => {
    try {
      await enquiryService.update(enquiryId, { status });
      if (status === 'Confirmed') {
        await orderService.create({ enquiry_id: enquiryId, customer_name: enquiry?.retailer_name, status: 'New' }).catch(() => {});
      }
      setEnquiry(prev => ({ ...prev, status }));
      Alert.alert('Success', `Status changed to ${status}`);
    } catch (e) { Alert.alert('Error', e?.message || 'Status update failed'); }
    setDialog({ visible: false, targetStatus: '' });
  };

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} onRetry={load} />;
  if (!enquiry) return <ErrorMessage message="Enquiry not found" />;

  const nextStatuses = STATUS_TRANSITIONS[enquiry.status] || [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <Text style={styles.value}>{enquiry.retailer_name || '—'}</Text>
        <Text style={styles.sub}>{enquiry.retailer_mobile}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product</Text>
        <Text style={styles.value}>{enquiry.product_name || enquiry.product_code || '—'}</Text>
        <Text style={styles.sub}>Qty: {enquiry.qty} {enquiry.unit}  |  Proposed: {formatCurrency(enquiry.proposed_price)}</Text>
      </View>
      {enquiry.distributor_reply ? (
        <View style={styles.replyBox}>
          <Text style={styles.replyLabel}>Your Reply:</Text>
          <Text style={styles.replyText}>{enquiry.distributor_reply}</Text>
        </View>
      ) : null}
      <View style={styles.metaRow}>
        <Text style={styles.sub}>Date: {formatDate(enquiry.created_at)}</Text>
        <View style={styles.statusChip}>
          <Text style={styles.statusText}>{enquiry.status}</Text>
        </View>
      </View>
      {nextStatuses.length > 0 && (
        <View style={styles.actions}>
          <PrimaryButton title="Reply to Enquiry" onPress={() => navigation.navigate('ReplyEnquiry', { enquiryId, enquiry })} style={{ marginBottom: 10 }} />
          <View style={styles.statusRow}>
            {nextStatuses.map(s => (
              <TouchableOpacity key={s} style={[styles.statusBtn, s === 'Confirmed' && styles.confirmed, s === 'Cancelled' && styles.cancelled]}
                onPress={() => setDialog({ visible: true, targetStatus: s })}>
                <Text style={styles.statusBtnText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      <ConfirmDialog
        visible={dialog.visible}
        title={`Change to ${dialog.targetStatus}?`}
        message={dialog.targetStatus === 'Confirmed' ? 'This will auto-create an order.' : undefined}
        onConfirm={() => changeStatus(dialog.targetStatus)}
        onCancel={() => setDialog({ visible: false, targetStatus: '' })}
        danger={dialog.targetStatus === 'Cancelled'}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: theme.colors.background },
  section:     { backgroundColor: theme.colors.surface, borderRadius: 10, padding: 14, marginBottom: 10, elevation: 1 },
  sectionTitle:{ fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
  value:       { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
  sub:         { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  replyBox:    { backgroundColor: '#E8F5E9', borderRadius: 10, padding: 14, marginBottom: 10 },
  replyLabel:  { fontSize: 12, fontWeight: '700', color: theme.colors.secondary, marginBottom: 4 },
  replyText:   { fontSize: 13, color: theme.colors.textPrimary },
  metaRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusChip:  { backgroundColor: theme.colors.primary + '22', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText:  { color: theme.colors.primary, fontWeight: '700', fontSize: 12 },
  actions:     { gap: 8 },
  statusRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn:   { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.primary },
  confirmed:   { backgroundColor: theme.colors.secondary },
  cancelled:   { backgroundColor: theme.colors.danger },
  statusBtnText:{ color: '#fff', fontWeight: '600', fontSize: 13 },
});
