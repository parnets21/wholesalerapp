// src/screens/enquiry/ReplyEnquiryScreen.jsx
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import FormField from '../../components/FormField';
import PrimaryButton from '../../components/PrimaryButton';
import { enquiryService } from '../../services/enquiryService';
import { theme } from '../../utils/theme';

export default function ReplyEnquiryScreen({ route, navigation }) {
  const { enquiryId, enquiry } = route.params;
  // Retailer marketplace enquiries have a buyer_company_id → use the offer flow.
  const isMarketplace = !!(enquiry?.buyer_company_id);

  const [form,    setForm]    = useState({
    rate: '', gst: enquiry?.gst_percent != null ? String(enquiry.gst_percent) : '18',
    transport: '', packing: '', message: '',
    available_qty: '', timeline: '',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };

  const handleSubmit = async () => {
    const errs = {};
    if (!form.rate) errs.rate = 'Rate is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (isMarketplace) {
        // Structured offer against a retailer marketplace enquiry.
        await enquiryService.sendOffer(enquiryId, {
          unit_price:        parseFloat(form.rate),
          gst_percent:       form.gst ? parseFloat(form.gst) : undefined,
          transport_charge:  form.transport ? parseFloat(form.transport) : 0,
          packing_charge:    form.packing ? parseFloat(form.packing) : 0,
          available_quantity: form.available_qty ? parseFloat(form.available_qty) : undefined,
          delivery_timeline: form.timeline,
          notes:             form.message,
        });
      } else {
        // Manual enquiry → PATCH reply (status becomes Replied).
        await enquiryService.reply(enquiryId, {
          status:             'Replied',
          offered_price:      parseFloat(form.rate),
          available_quantity: form.available_qty ? parseFloat(form.available_qty) : undefined,
          delivery_timeline:  form.timeline,
          negotiation_note:   form.message,
          distributor_reply:  form.message,
        });
      }
      Alert.alert('Success', 'Reply sent successfully');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to send reply');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>
          {isMarketplace
            ? `Send your offer${enquiry?.qty ? ` for ${enquiry.qty} ${enquiry.unit || ''}` : ''}`
            : 'Fill in your reply details'}
        </Text>
        <FormField label="Your Rate (₹ per unit) *" value={form.rate} onChangeText={v => set('rate', v)} keyboardType="decimal-pad" error={errors.rate} />
        <FormField label={`Available Quantity${enquiry?.unit ? ` (${enquiry.unit})` : ''}`} value={form.available_qty}
          onChangeText={v => set('available_qty', v)} keyboardType="decimal-pad" placeholder={enquiry?.qty ? `Requested: ${enquiry.qty}` : 'How much can you supply'} />
        <FormField label="Delivery Timeline" value={form.timeline} onChangeText={v => set('timeline', v)} placeholder="e.g. 3-5 days / Ready stock" />
        {isMarketplace && (
          <>
            <FormField label="GST %" value={form.gst} onChangeText={v => set('gst', v)} keyboardType="decimal-pad" />
            <FormField label="Transport Charge (₹)" value={form.transport} onChangeText={v => set('transport', v)} keyboardType="decimal-pad" placeholder="0" />
            <FormField label="Packing Charge (₹)" value={form.packing} onChangeText={v => set('packing', v)} keyboardType="decimal-pad" placeholder="0" />
          </>
        )}
        <FormField label="Message / Remarks" value={form.message} onChangeText={v => set('message', v)} multiline />
        <PrimaryButton title={isMarketplace ? 'Send Offer' : 'Send Reply'} onPress={handleSubmit} loading={loading} style={styles.btn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: theme.colors.background, flexGrow: 1 },
  subtitle:  { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 18 },
  btn:       { marginTop: 8 },
});
