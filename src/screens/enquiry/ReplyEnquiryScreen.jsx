// src/screens/enquiry/ReplyEnquiryScreen.jsx
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import FormField from '../../components/FormField';
import PrimaryButton from '../../components/PrimaryButton';
import { enquiryService } from '../../services/enquiryService';
import { theme } from '../../utils/theme';

export default function ReplyEnquiryScreen({ route, navigation }) {
  const { enquiryId } = route.params;
  const [form,    setForm]    = useState({ rate: '', quantity: '', deliveryDate: '', message: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };

  const handleSubmit = async () => {
    const errs = {};
    if (!form.rate)    errs.rate = 'Rate is required';
    if (!form.quantity) errs.quantity = 'Quantity is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await enquiryService.reply(enquiryId, {
        offered_price:     parseFloat(form.rate),
        qty:               parseFloat(form.quantity),
        delivery_date:     form.deliveryDate,
        distributor_reply: form.message,
      });
      Alert.alert('Success', 'Reply sent successfully');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to send reply');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>Fill in your reply details</Text>
        <FormField label="Your Rate (₹) *"   value={form.rate}        onChangeText={v => set('rate', v)}        keyboardType="decimal-pad" error={errors.rate} />
        <FormField label="Quantity *"         value={form.quantity}    onChangeText={v => set('quantity', v)}    keyboardType="decimal-pad" error={errors.quantity} />
        <FormField label="Delivery Date"      value={form.deliveryDate} onChangeText={v => set('deliveryDate', v)} placeholder="DD-MM-YYYY" />
        <FormField label="Message / Remarks"  value={form.message}     onChangeText={v => set('message', v)}    multiline />
        <PrimaryButton title="Send Reply" onPress={handleSubmit} loading={loading} style={styles.btn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: theme.colors.background, flexGrow: 1 },
  subtitle:  { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 18 },
  btn:       { marginTop: 8 },
});
