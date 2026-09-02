// src/screens/dispatch/DispatchEntryScreen.jsx
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FormField    from '../../components/FormField';
import PrimaryButton from '../../components/PrimaryButton';
import { dispatchService }   from '../../services/dispatchService';
import { validateDriverMobile } from '../../utils/validators';
import { theme } from '../../utils/theme';

function SectionHead({ title }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function DispatchEntryScreen({ route, navigation }) {
  const { orderId } = route?.params || {};

  const [form, setForm] = useState({
    order_id:         orderId || '',
    vehicleNo:        '',
    driverName:       '',
    driverMobile:     '',
    lrNo:             '',
    transportName:    '',
    dispatchDate:     '',
    expectedDelivery: '',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: null }));
  };

  const handleSave = async () => {
    const errs = {};
    if (!form.vehicleNo.trim())     errs.vehicleNo     = 'Vehicle number is required';
    if (!form.driverName.trim())    errs.driverName    = 'Driver name is required';
    if (!form.lrNo.trim())          errs.lrNo          = 'LR number is required';
    if (!form.transportName.trim()) errs.transportName = 'Transport name is required';
    const mobileErr = validateDriverMobile(form.driverMobile);
    if (mobileErr) errs.driverMobile = mobileErr;

    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await dispatchService.create({
        order_id:               form.order_id,
        vehicle_no:             form.vehicleNo,
        driver_name:            form.driverName,
        driver_mobile:          form.driverMobile,
        lr_no:                  form.lrNo,
        transport_name:         form.transportName,
        dispatch_date:          form.dispatchDate || new Date().toISOString(),
        expected_delivery_date: form.expectedDelivery,
      });
      Alert.alert('Success', 'Dispatch entry saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to save dispatch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle & Transport */}
        <SectionHead title="Vehicle & Transport" />
        <View style={styles.card}>
          <FormField
            label="Vehicle Number *"
            value={form.vehicleNo}
            onChangeText={v => set('vehicleNo', v.toUpperCase())}
            placeholder="e.g. GJ05AB1234"
            autoCapitalize="characters"
            error={errors.vehicleNo}
          />
          <FormField
            label="Transport Name *"
            value={form.transportName}
            onChangeText={v => set('transportName', v)}
            placeholder="Transport company name"
            error={errors.transportName}
          />
          <FormField
            label="LR Number *"
            value={form.lrNo}
            onChangeText={v => set('lrNo', v)}
            placeholder="Lorry Receipt number"
            error={errors.lrNo}
          />
        </View>

        {/* Driver Details */}
        <SectionHead title="Driver Details" />
        <View style={styles.card}>
          <FormField
            label="Driver Name *"
            value={form.driverName}
            onChangeText={v => set('driverName', v)}
            placeholder="Full name"
            error={errors.driverName}
          />
          <FormField
            label="Driver Mobile *"
            value={form.driverMobile}
            onChangeText={v => set('driverMobile', v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={10}
            placeholder="10-digit mobile"
            error={errors.driverMobile}
          />
        </View>

        {/* Dates */}
        <SectionHead title="Dates" />
        <View style={styles.card}>
          <FormField
            label="Dispatch Date"
            value={form.dispatchDate}
            onChangeText={v => set('dispatchDate', v)}
            placeholder="DD-MM-YYYY (leave blank for today)"
          />
          <FormField
            label="Expected Delivery Date"
            value={form.expectedDelivery}
            onChangeText={v => set('expectedDelivery', v)}
            placeholder="DD-MM-YYYY"
          />
        </View>

        <PrimaryButton
          title={loading ? 'Saving…' : '🚛  Save Dispatch'}
          onPress={handleSave}
          loading={loading}
          style={styles.saveBtn}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  sectionBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: 0.2,
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },

  saveBtn: { marginTop: 24 },
});
