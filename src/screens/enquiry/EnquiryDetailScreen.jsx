// src/screens/enquiry/EnquiryDetailScreen.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from '../../components/Icon';
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
  const [offers,   setOffers]   = useState([]);
  const [messages, setMessages] = useState([]);
  const [msgText,  setMsgText]  = useState('');
  const [sending,  setSending]  = useState(false);
  const isMarketplace = !!(enquiry?.buyer_company_id);

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
      if (data?.buyer_company_id) loadThread();
    } catch (e) { setError(e?.message || 'Failed to load enquiry'); }
    finally { setLoading(false); }
  };

  // Load offers + messages (marketplace negotiation thread).
  const loadThread = useCallback(async () => {
    const [o, m] = await Promise.all([
      enquiryService.listOffers(enquiryId).then(r => r?.data?.offers ?? r?.offers ?? r?.data ?? []).catch(() => []),
      enquiryService.listMessages(enquiryId).then(r => r?.data?.messages ?? r?.messages ?? []).catch(() => []),
    ]);
    setOffers(Array.isArray(o) ? o : []);
    setMessages(Array.isArray(m) ? m : []);
  }, [enquiryId]);

  const sendMsg = async () => {
    const text = msgText.trim();
    if (!text) return;
    setSending(true);
    try {
      await enquiryService.sendMessage(enquiryId, { message: text, client_message_id: `c${Date.now()}` });
      setMsgText('');
      await loadThread();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not send message.');
    } finally { setSending(false); }
  };

  useEffect(() => { load(); }, [enquiryId]);

  const changeStatus = async (status) => {
    try {
      await enquiryService.update(enquiryId, { status });
      setEnquiry(prev => ({ ...prev, status }));
      if (status === 'Confirmed') {
        // Proper convert: /orders/from-enquiry copies product/qty/rate/gst from the enquiry.
        try {
          const r = await orderService.createFromEnquiry({
            enquiry_id: enquiryId,
            rate: enquiry?.offered_price || enquiry?.proposed_price || undefined,
            gst_percent: enquiry?.gst_percent || undefined,
          });
          const order = r?.data ?? r;
          Alert.alert('Enquiry Confirmed', `Order ${order?.order_code || ''} created.`, [
            { text: 'View Order', onPress: () => order?._id && navigation.navigate('OrderDetail', { orderId: order._id }) },
            { text: 'OK' },
          ]);
        } catch (e) {
          Alert.alert('Confirmed', `Status changed to Confirmed, but order creation failed: ${e?.message || 'unknown error'}`);
        }
      } else {
        Alert.alert('Success', `Status changed to ${status}`);
      }
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
        <Text style={styles.sub}>Code: {enquiry.product_code || '—'}</Text>
        <Text style={styles.sub}>Qty: {enquiry.qty} {enquiry.unit}  |  Proposed: {formatCurrency(enquiry.proposed_price ?? enquiry.offered_price)}</Text>
      </View>

      {/* Delivery location + retailer remarks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery & Remarks</Text>
        <Text style={styles.sub}>📍 Delivery Location: {enquiry.location || enquiry.delivery_location || '—'}</Text>
        <Text style={styles.sub}>📝 Retailer Remarks: {enquiry.remarks || enquiry.notes || '—'}</Text>
      </View>

      {(enquiry.available_quantity != null || enquiry.delivery_timeline) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Quote</Text>
          {enquiry.available_quantity != null ? (
            <Text style={styles.sub}>Available Qty: {enquiry.available_quantity} {enquiry.unit}</Text>
          ) : null}
          {enquiry.delivery_timeline ? (
            <Text style={styles.sub}>Delivery Timeline: {enquiry.delivery_timeline}</Text>
          ) : null}
        </View>
      ) : null}

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

      {/* ── Negotiation thread (marketplace enquiries only) ── */}
      {isMarketplace && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Negotiation</Text>

          {/* Offers history */}
          {offers.length > 0 && offers.map((o) => (
            <View key={o.id || o._id} style={styles.offerCard}>
              <View style={styles.offerTop}>
                <Text style={styles.offerPrice}>{formatCurrency(o.unit_price)} / {o.unit || 'unit'}</Text>
                <View style={[styles.offerStatus, o.status === 'Accepted' && styles.offerAccepted, o.status === 'Rejected' && styles.offerRejected]}>
                  <Text style={styles.offerStatusText}>{o.status}</Text>
                </View>
              </View>
              <Text style={styles.offerMeta}>
                Total {formatCurrency(o.total_amount)}
                {o.available_quantity != null ? `  •  Avail ${o.available_quantity}` : ''}
                {o.delivery_timeline ? `  •  ${o.delivery_timeline}` : ''}
              </Text>
              {o.notes ? <Text style={styles.offerNotes}>{o.notes}</Text> : null}
            </View>
          ))}

          {/* Chat messages */}
          <View style={styles.thread}>
            {messages.length === 0 ? (
              <Text style={styles.threadEmpty}>No messages yet. Start the conversation below.</Text>
            ) : (
              messages.map((m, i) => {
                const mine = m.sender_side === 'seller';
                return (
                  <View key={m._id || i} style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, mine && { color: '#fff' }]}>{m.message}</Text>
                    <Text style={[styles.bubbleTime, mine && { color: 'rgba(255,255,255,0.7)' }]}>
                      {m.sender_side === 'seller' ? 'You' : 'Retailer'} · {formatDate(m.created_at)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Message input */}
          {enquiry.status !== 'Cancelled' && (
            <View style={styles.msgRow}>
              <TextInput
                style={styles.msgInput}
                placeholder="Type a message…"
                placeholderTextColor={theme.colors.textDisabled}
                value={msgText}
                onChangeText={setMsgText}
                multiline
              />
              <TouchableOpacity style={[styles.msgSend, (!msgText.trim() || sending) && { opacity: 0.5 }]}
                onPress={sendMsg} disabled={!msgText.trim() || sending} activeOpacity={0.8}>
                <Icon name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      {nextStatuses.length > 0 && (
        <View style={styles.actions}>
          <PrimaryButton
            title={enquiry.buyer_company_id ? 'Send Offer' : 'Reply to Enquiry'}
            onPress={() => navigation.navigate('ReplyEnquiry', { enquiryId, enquiry })}
            style={{ marginBottom: 10 }}
          />
          {/* Manual enquiries: wholesaler drives status directly. Marketplace
              enquiries are driven by offers the retailer accepts, so we don't
              expose raw status buttons (the backend rejects them anyway). */}
          {!enquiry.buyer_company_id && (
            <View style={styles.statusRow}>
              {nextStatuses.map(s => (
                <TouchableOpacity key={s} style={[styles.statusBtn, s === 'Confirmed' && styles.confirmed, s === 'Cancelled' && styles.cancelled]}
                  onPress={() => setDialog({ visible: true, targetStatus: s })}>
                  <Text style={styles.statusBtnText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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

  offerCard:   { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: theme.colors.border },
  offerTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  offerPrice:  { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },
  offerStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#FEF3C7' },
  offerAccepted:{ backgroundColor: '#DCFCE7' },
  offerRejected:{ backgroundColor: '#FEE2E2' },
  offerStatusText:{ fontSize: 9.5, fontWeight: '700', color: '#92400E' },
  offerMeta:   { fontSize: 11.5, color: theme.colors.textSecondary, marginTop: 4 },
  offerNotes:  { fontSize: 12, color: theme.colors.textPrimary, marginTop: 4, fontStyle: 'italic' },

  thread:      { marginTop: 10 },
  threadEmpty: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: 12 },
  bubble:      { maxWidth: '82%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  bubbleMine:  { backgroundColor: theme.colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleTheirs:{ backgroundColor: '#EEF1F6', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText:  { fontSize: 13.5, color: theme.colors.textPrimary, lineHeight: 19 },
  bubbleTime:  { fontSize: 9.5, color: theme.colors.textSecondary, marginTop: 3 },
  msgRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 6 },
  msgInput:    { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: theme.colors.textPrimary, maxHeight: 100 },
  msgSend:     { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
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
