// src/screens/sales/SalesEntryScreen.jsx
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormField from '../../components/FormField';
import PrimaryButton from '../../components/PrimaryButton';
import { salesService } from '../../services/salesService';
import { calculateLineTotal, formatCurrency } from '../../utils/formatters';
import { theme } from '../../utils/theme';

const PAY_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit'];

export default function SalesEntryScreen({ navigation }) {
  const [customerName, setCustomerName] = useState('');
  const [payMode,  setPayMode]  = useState('Cash');
  const [discount, setDiscount] = useState('0');
  const [items,    setItems]    = useState([{ product_name:'', qty:'', rate:'', gst_rate:'18' }]);
  const [loading,  setLoading]  = useState(false);

  const addItem = () => setItems(prev => [...prev, { product_name:'', qty:'', rate:'', gst_rate:'18' }]);
  const updateItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  let subtotal = 0, totalGST = 0;
  items.forEach(item => {
    const { gst_amount, line_total } = calculateLineTotal(item.qty, item.rate, item.gst_rate);
    subtotal += parseFloat(item.qty || 0) * parseFloat(item.rate || 0);
    totalGST += gst_amount;
  });
  const grandTotal = subtotal + totalGST - parseFloat(discount || 0);

  const handleSave = async () => {
    if (!customerName) { Alert.alert('', 'Please enter customer name'); return; }
    setLoading(true);
    try {
      await salesService.create({ customer_name: customerName, items: items.map(it => ({ ...it, qty: parseFloat(it.qty), rate: parseFloat(it.rate), gst_rate: parseFloat(it.gst_rate) })), discount: parseFloat(discount), payment_mode: payMode, date: new Date().toISOString() });
      Alert.alert('Success', 'Sale recorded');
      navigation.goBack();
    } catch (e) { Alert.alert('Error', e?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <FormField label="Customer Name *" value={customerName} onChangeText={setCustomerName} />
        <Text style={styles.sectionTitle}>Products</Text>
        {items.map((item, i) => (
          <View key={i} style={styles.itemBox}>
            <FormField label="Product Name" value={item.product_name} onChangeText={v => updateItem(i, 'product_name', v)} />
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 6 }}><FormField label="Qty"  value={item.qty}     onChangeText={v => updateItem(i, 'qty', v)}     keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1, marginLeft: 6 }}> <FormField label="Rate" value={item.rate}    onChangeText={v => updateItem(i, 'rate', v)}    keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1, marginLeft: 6 }}> <FormField label="GST %" value={item.gst_rate} onChangeText={v => updateItem(i, 'gst_rate', v)} keyboardType="decimal-pad" /></View>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.addItem} onPress={addItem}>
          <Text style={styles.addItemText}>+ Add Product</Text>
        </TouchableOpacity>
        <FormField label="Discount (₹)" value={discount} onChangeText={setDiscount} keyboardType="decimal-pad" />
        <Text style={styles.sectionTitle}>Payment Mode</Text>
        <View style={styles.pills}>
          {PAY_MODES.map(m => (
            <TouchableOpacity key={m} style={[styles.pill, payMode === m && styles.pillActive]} onPress={() => setPayMode(m)}>
              <Text style={[styles.pillText, payMode === m && styles.pillTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.totals}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>GST</Text><Text style={styles.totalValue}>{formatCurrency(totalGST)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Discount</Text><Text style={[styles.totalValue, { color: theme.colors.danger }]}>-{formatCurrency(parseFloat(discount) || 0)}</Text></View>
          <View style={[styles.totalRow, styles.grandRow]}><Text style={styles.grandLabel}>Grand Total</Text><Text style={styles.grandValue}>{formatCurrency(grandTotal)}</Text></View>
        </View>
        <PrimaryButton title="Save Sale" onPress={handleSave} loading={loading} style={styles.btn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 20, backgroundColor: theme.colors.background, flexGrow: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8, textTransform: 'uppercase' },
  itemBox:      { backgroundColor: '#f0f4ff', borderRadius: 8, padding: 12, marginBottom: 8 },
  row:          { flexDirection: 'row' },
  addItem:      { borderWidth: 1.5, borderColor: theme.colors.primary, borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 16, borderStyle: 'dashed' },
  addItemText:  { color: theme.colors.primary, fontWeight: '600' },
  pills:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill:         { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: theme.colors.border },
  pillActive:   { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  pillText:     { fontSize: 12, color: theme.colors.textSecondary },
  pillTextActive:{ color: '#fff', fontWeight: '700' },
  totals:       { backgroundColor: theme.colors.surface, borderRadius: 10, padding: 14, marginBottom: 16, elevation: 1 },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel:   { fontSize: 13, color: theme.colors.textSecondary },
  totalValue:   { fontSize: 13, fontWeight: '600' },
  grandRow:     { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 8, marginTop: 4 },
  grandLabel:   { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  grandValue:   { fontSize: 17, fontWeight: '800', color: theme.colors.primary },
  btn:          { marginTop: 8 },
});
