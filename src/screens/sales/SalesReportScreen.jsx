// src/screens/sales/SalesEntryScreen.jsx
//
// ASSUMPTIONS (adjust to match your actual service files):
// - productService.search(query, { warehouseId }) -> [{ _id, product_name, selling_rate, gst_rate, available_stock }]
// - customerService.search(query) -> [{ _id, name, mobile, outstanding }]
// - useAuth() -> { activeCompanyId, activeWarehouseId }  (your logged-in company/warehouse context)
// - salesService.create() now sends product_id + warehouse_id + customer_id + amount_paid
//
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FormField from '../../components/FormField';
import PrimaryButton from '../../components/PrimaryButton';
import { salesService } from '../../services/salesService';
import { productService } from '../../services/productService';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../hooks/useAuth';
import { calculateLineTotal, formatCurrency } from '../../utils/formatters';
import { theme } from '../../utils/theme';

const PAY_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Credit'];

const emptyItem = () => ({
  product_id: null,
  product_name: '',
  available_stock: null,
  qty: '',
  rate: '',
  gst_rate: '18',
});

export default function SalesEntryScreen({ navigation }) {
  const { activeCompanyId, activeWarehouseId } = useAuth();

  const [customer, setCustomer] = useState(null); // { _id, name, mobile } or null for walk-in
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerResults, setCustomerResults] = useState([]);

  const [payMode, setPayMode] = useState('Cash');
  const [discount, setDiscount] = useState('0');
  const [amountPaid, setAmountPaid] = useState(''); // only relevant when payMode === 'Credit'
  const [items, setItems] = useState([emptyItem()]);
  const [productModalOpenFor, setProductModalOpenFor] = useState(null); // index of item being edited
  const [productResults, setProductResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (i) => setItems(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);
  const updateItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  // --- Customer search -----------------------------------------------
  const searchCustomers = async (q) => {
    setCustomerNameInput(q);
    if (q.trim().length < 2) { setCustomerResults([]); return; }
    try { setCustomerResults(await customerService.search(q)); } catch { /* non-fatal */ }
  };
  const pickCustomer = (c) => {
    setCustomer(c);
    setCustomerNameInput(c.name);
    setCustomerModalOpen(false);
  };

  // --- Product search (pulls live stock from inventory) --------------
  const searchProducts = async (q) => {
    if (q.trim().length < 2) { setProductResults([]); return; }
    try { setProductResults(await productService.search(q, { warehouseId: activeWarehouseId })); } catch { /* non-fatal */ }
  };
  const pickProduct = (i, p) => {
    updateItem(i, 'product_id', p._id);
    updateItem(i, 'product_name', p.product_name);
    updateItem(i, 'available_stock', p.available_stock);
    updateItem(i, 'rate', String(p.selling_rate ?? ''));
    updateItem(i, 'gst_rate', String(p.gst_rate ?? '18'));
    setProductModalOpenFor(null);
    setProductResults([]);
  };

  // --- Totals (only over valid, non-empty rows) -----------------------
  const validItems = items.filter(it => it.product_id && Number(it.qty) > 0 && Number(it.rate) >= 0);
  let subtotal = 0, totalGST = 0;
  validItems.forEach(item => {
    const { gst_amount } = calculateLineTotal(item.qty, item.rate, item.gst_rate);
    subtotal += parseFloat(item.qty) * parseFloat(item.rate);
    totalGST += gst_amount;
  });
  const discountNum = Math.max(0, parseFloat(discount) || 0);
  const grandTotal = Math.max(0, subtotal + totalGST - discountNum);

  const overstockItems = validItems.filter(it => it.available_stock != null && Number(it.qty) > it.available_stock);

  // --- Validation -------------------------------------------------------
  const validate = () => {
    if (!customer && !customerNameInput.trim()) return 'Please enter or select a customer';
    if (validItems.length === 0) return 'Add at least one valid product with quantity and rate';
    if (items.some(it => (it.product_name || it.qty || it.rate) && !(it.product_id && Number(it.qty) > 0))) {
      return 'One of the product rows is incomplete — pick a product and enter a valid quantity';
    }
    if (overstockItems.length > 0) {
      return `Not enough stock for: ${overstockItems.map(i => i.product_name).join(', ')}`;
    }
    if (payMode === 'Credit') {
      const paid = parseFloat(amountPaid) || 0;
      if (paid < 0 || paid > grandTotal) return 'Amount paid must be between 0 and the grand total';
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { Alert.alert('', err); return; }

    setLoading(true);
    try {
      const paidAmount = payMode === 'Credit' ? (parseFloat(amountPaid) || 0) : grandTotal;
      await salesService.create({
        company_id: activeCompanyId,
        warehouse_id: activeWarehouseId,
        customer_id: customer?._id ?? null,
        customer_name: customer?.name ?? customerNameInput.trim(),
        items: validItems.map(it => ({
          product_id: it.product_id,
          product_name: it.product_name,
          qty: parseFloat(it.qty),
          rate: parseFloat(it.rate),
          gst_rate: parseFloat(it.gst_rate),
        })),
        discount: discountNum,
        payment_mode: payMode,
        amount_paid: paidAmount,
        outstanding: Math.max(0, grandTotal - paidAmount),
        date: new Date().toISOString(),
      });
      Alert.alert('Success', 'Sale recorded');
      navigation.goBack();
    } catch (e) {
      // Server is the source of truth on stock — a 409/insufficient-stock response should
      // surface here if two people sold the last boxes at the same time.
      Alert.alert('Error', e?.message || 'Failed to save sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <FormField
              label="Customer Name *"
              value={customerNameInput}
              onChangeText={(v) => { setCustomer(null); searchCustomers(v); }}
            />
          </View>
          <TouchableOpacity style={styles.smallBtn} onPress={() => setCustomerModalOpen(true)}>
            <Text style={styles.smallBtnText}>Find</Text>
          </TouchableOpacity>
        </View>
        {customer?.outstanding > 0 && (
          <Text style={styles.warnText}>Existing outstanding: {formatCurrency(customer.outstanding)}</Text>
        )}

        <Text style={styles.sectionTitle}>Products</Text>
        {items.map((item, i) => (
          <View key={i} style={styles.itemBox}>
            <View style={styles.row}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => { setProductModalOpenFor(i); setProductResults([]); }}
              >
                <FormField
                  label="Product"
                  value={item.product_name}
                  editable={false}
                  placeholder="Tap to select from inventory"
                />
              </TouchableOpacity>
              {items.length > 1 && (
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(i)}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {item.available_stock != null && (
              <Text style={[styles.stockText, Number(item.qty) > item.available_stock && styles.warnText]}>
                In stock: {item.available_stock}
              </Text>
            )}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 6 }}><FormField label="Qty" value={item.qty} onChangeText={v => updateItem(i, 'qty', v)} keyboardType="decimal-pad" /></View>
              <View style={{ flex: 1, marginLeft: 6 }}> <FormField label="Rate" value={item.rate} onChangeText={v => updateItem(i, 'rate', v)} keyboardType="decimal-pad" /></View>
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
        {payMode === 'Credit' && (
          <FormField
            label={`Amount Paid Now (of ${formatCurrency(grandTotal)})`}
            value={amountPaid}
            onChangeText={setAmountPaid}
            keyboardType="decimal-pad"
          />
        )}

        <View style={styles.totals}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>GST</Text><Text style={styles.totalValue}>{formatCurrency(totalGST)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Discount</Text><Text style={[styles.totalValue, { color: theme.colors.danger }]}>-{formatCurrency(discountNum)}</Text></View>
          <View style={[styles.totalRow, styles.grandRow]}><Text style={styles.grandLabel}>Grand Total</Text><Text style={styles.grandValue}>{formatCurrency(grandTotal)}</Text></View>
          {payMode === 'Credit' && (
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Outstanding</Text><Text style={[styles.totalValue, { color: theme.colors.danger }]}>{formatCurrency(Math.max(0, grandTotal - (parseFloat(amountPaid) || 0)))}</Text></View>
          )}
        </View>

        <PrimaryButton title="Save Sale" onPress={handleSave} loading={loading} style={styles.btn} />
      </ScrollView>

      {/* Customer picker modal */}
      <Modal visible={customerModalOpen} animationType="slide" onRequestClose={() => setCustomerModalOpen(false)}>
        <View style={styles.modal}>
          <TextInput
            style={styles.modalSearch}
            placeholder="Search customer by name or mobile"
            value={customerNameInput}
            onChangeText={searchCustomers}
            autoFocus
          />
          <ScrollView>
            {customerResults.map(c => (
              <TouchableOpacity key={c._id} style={styles.modalRow} onPress={() => pickCustomer(c)}>
                <Text style={styles.modalRowTitle}>{c.name}</Text>
                <Text style={styles.modalRowSub}>{c.mobile}{c.outstanding > 0 ? ` • Due ${formatCurrency(c.outstanding)}` : ''}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalClose} onPress={() => setCustomerModalOpen(false)}>
            <Text style={styles.modalCloseText}>Use "{customerNameInput}" as new walk-in customer</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Product picker modal */}
      <Modal visible={productModalOpenFor !== null} animationType="slide" onRequestClose={() => setProductModalOpenFor(null)}>
        <View style={styles.modal}>
          <TextInput
            style={styles.modalSearch}
            placeholder="Search product by name or code"
            onChangeText={searchProducts}
            autoFocus
          />
          <ScrollView>
            {productResults.map(p => (
              <TouchableOpacity key={p._id} style={styles.modalRow} onPress={() => pickProduct(productModalOpenFor, p)}>
                <Text style={styles.modalRowTitle}>{p.product_name}</Text>
                <Text style={styles.modalRowSub}>Stock: {p.available_stock} • Rate: {formatCurrency(p.selling_rate)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 20, backgroundColor: theme.colors.background, flexGrow: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8, textTransform: 'uppercase' },
  itemBox:      { backgroundColor: '#f0f4ff', borderRadius: 8, padding: 12, marginBottom: 8 },
  row:          { flexDirection: 'row', alignItems: 'center' },
  smallBtn:     { marginLeft: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, backgroundColor: theme.colors.primary },
  smallBtnText: { color: '#fff', fontWeight: '700' },
  removeBtn:    { marginLeft: 8, padding: 8 },
  removeBtnText:{ color: theme.colors.danger, fontWeight: '700', fontSize: 16 },
  stockText:    { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 6 },
  warnText:     { color: theme.colors.danger, fontSize: 12, fontWeight: '600', marginBottom: 8 },
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
  modal:        { flex: 1, padding: 16, paddingTop: 50, backgroundColor: theme.colors.background },
  modalSearch:  { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, marginBottom: 12 },
  modalRow:     { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  modalRowTitle:{ fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  modalRowSub:  { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  modalClose:   { padding: 14, alignItems: 'center' },
  modalCloseText:{ color: theme.colors.primary, fontWeight: '600' },
});