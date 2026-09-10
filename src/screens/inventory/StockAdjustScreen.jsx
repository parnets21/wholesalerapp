// src/screens/inventory/StockAdjustScreen.jsx
//
// Stock In / Stock Out for the wholesaler's own products.
// Uses PATCH /inventory/adjust (positive = in, negative = out).
//
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import FormField from '../../components/FormField';
import Icon from '../../components/Icon';
import { inventoryService } from '../../services/inventoryService';
import { theme } from '../../utils/theme';

// Structured reason codes for a Stock Out adjustment.
const OUT_REASONS = ['Damage', 'Breakage', 'Audit Correction', 'Return', 'Lost', 'Other'];

export default function StockAdjustScreen({ route, navigation }) {
  const initialMode = route?.params?.mode === 'out' ? 'out' : 'in';
  const [mode, setMode]       = useState(initialMode);   // 'in' | 'out'
  const [product, setProduct] = useState(route?.params?.product || null);
  const [warehouse, setWarehouse] = useState(null);
  const [qty, setQty]         = useState('');
  const [rate, setRate]       = useState('');
  const [reason, setReason]   = useState('');
  const [reasonCode, setReasonCode] = useState('');   // structured reason (Stock Out)
  const [lowAlert, setLowAlert] = useState('');        // configurable low-stock threshold
  const [saving, setSaving]   = useState(false);

  const [warehouses, setWarehouses] = useState([]);
  const [pickProduct, setPickProduct] = useState(false);
  const [pickWarehouse, setPickWarehouse] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    inventoryService.warehouses().then(r => setWarehouses(r?.data ?? r ?? [])).catch(() => {});
  }, []);

  const loadProducts = async (q = '') => {
    setLoadingProducts(true);
    try {
      const r = await inventoryService.productOptions({ limit: 50, search: q });
      setProducts(r?.data?.products ?? r?.products ?? []);
    } catch { setProducts([]); }
    finally { setLoadingProducts(false); }
  };

  const openProductPicker = () => { setPickProduct(true); loadProducts(search); };

  const numOnly = (v) => v.replace(/[^0-9.]/g, '');

  const submit = async () => {
    if (!product?._id) { Alert.alert('Select product', 'Please choose a product first.'); return; }
    const q = parseFloat(qty);
    if (!q || q <= 0) { Alert.alert('Quantity', 'Enter a valid quantity.'); return; }
    if (mode === 'out' && !reasonCode) { Alert.alert('Reason', 'Please select a reason for removing stock.'); return; }

    setSaving(true);
    try {
      // Compose the reason: structured code (Stock Out) + optional note.
      const composedReason = mode === 'out'
        ? [reasonCode, reason.trim()].filter(Boolean).join(' — ') || 'Stock Out'
        : (reason.trim() || 'Stock In');

      await inventoryService.adjust({
        product_id:   product._id,
        warehouse_id: warehouse?._id || undefined,
        adjustment:   mode === 'in' ? q : -q,
        reason:       composedReason,
        ...(mode === 'in' && rate ? { purchase_rate: parseFloat(rate) } : {}),
        ...(lowAlert !== '' ? { low_stock_alert: parseFloat(lowAlert) } : {}),
      });
      Alert.alert('Success', `${mode === 'in' ? 'Stock added' : 'Stock removed'} successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Failed', e?.message || 'Could not update stock.');
    } finally {
      setSaving(false);
    }
  };

  const isIn = mode === 'in';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Stock Adjustment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <TouchableOpacity style={[styles.modeBtn, isIn && styles.modeInActive]} onPress={() => setMode('in')} activeOpacity={0.85}>
            <Icon name="arrow-down-bold-box-outline" size={18} color={isIn ? '#fff' : '#059669'} />
            <Text style={[styles.modeText, isIn && styles.modeTextActive]}>Stock In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, !isIn && styles.modeOutActive]} onPress={() => setMode('out')} activeOpacity={0.85}>
            <Icon name="arrow-up-bold-box-outline" size={18} color={!isIn ? '#fff' : '#DC2626'} />
            <Text style={[styles.modeText, !isIn && styles.modeTextActive]}>Stock Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {/* Product picker */}
          <Text style={styles.label}>Product *</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={openProductPicker} activeOpacity={0.8}>
            <Text style={[styles.pickerText, !product && styles.pickerPlaceholder]} numberOfLines={1}>
              {product ? `${product.name}${product.code ? ` (${product.code})` : ''}` : 'Select a product'}
            </Text>
            <Icon name="chevron-down" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {/* Warehouse picker (optional) */}
          <Text style={styles.label}>Warehouse (optional)</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setPickWarehouse(true)} activeOpacity={0.8}>
            <Text style={[styles.pickerText, !warehouse && styles.pickerPlaceholder]} numberOfLines={1}>
              {warehouse ? warehouse.name : 'Default / Main'}
            </Text>
            <Icon name="chevron-down" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <FormField label="Quantity *" value={qty} onChangeText={v => setQty(numOnly(v))} keyboardType="numeric" placeholder="0" />
          {isIn && (
            <FormField label="Purchase Rate (optional)" value={rate} onChangeText={v => setRate(numOnly(v))} keyboardType="numeric" placeholder="per unit" />
          )}
          {isIn && (
            <FormField label="Low-stock Alert At (optional)" value={lowAlert}
              onChangeText={v => setLowAlert(numOnly(v))} keyboardType="numeric" placeholder="e.g. 100 — notify when stock drops below" />
          )}
          {!isIn && (
            <>
              <Text style={styles.label}>Reason *</Text>
              <View style={styles.reasonWrap}>
                {OUT_REASONS.map(rc => {
                  const on = reasonCode === rc;
                  return (
                    <TouchableOpacity key={rc} style={[styles.reasonChip, on && styles.reasonChipOn]}
                      onPress={() => setReasonCode(rc)} activeOpacity={0.8}>
                      <Text style={[styles.reasonChipText, on && styles.reasonChipTextOn]}>{rc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
          <FormField label={isIn ? 'Reason / Note' : 'Note (optional)'} value={reason} onChangeText={setReason} placeholder={isIn ? 'e.g. New purchase' : 'Extra detail (optional)'} />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: isIn ? '#059669' : '#DC2626' }, saving && { opacity: 0.6 }]}
          onPress={submit} disabled={saving} activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : (isIn ? 'Add Stock' : 'Remove Stock')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Product picker modal */}
      <Modal visible={pickProduct} animationType="slide" transparent onRequestClose={() => setPickProduct(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setPickProduct(false)} activeOpacity={1} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select Product</Text>
            <View style={styles.searchWrap}>
              <Icon name="magnify" size={18} color={theme.colors.textDisabled} />
              <TextInput
                style={styles.searchInput} placeholder="Search…" placeholderTextColor={theme.colors.textDisabled}
                value={search} onChangeText={(t) => { setSearch(t); loadProducts(t); }}
              />
            </View>
            {loadingProducts ? (
              <ActivityIndicator color={theme.colors.accent} style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={products}
                keyExtractor={p => p._id}
                style={{ maxHeight: 360 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.optRow} onPress={() => { setProduct(item); setPickProduct(false); }}>
                    <Text style={styles.optName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.optCode}>{item.code}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.optEmpty}>No products found.</Text>}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Warehouse picker modal */}
      <Modal visible={pickWarehouse} animationType="fade" transparent onRequestClose={() => setPickWarehouse(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setPickWarehouse(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select Warehouse</Text>
            {[{ _id: null, name: 'Default / Main' }, ...warehouses].map(w => (
              <TouchableOpacity key={w._id || 'default'} style={styles.optRow} onPress={() => { setWarehouse(w._id ? w : null); setPickWarehouse(false); }}>
                <Text style={styles.optName}>{w.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  container: { padding: 16, backgroundColor: theme.colors.background, paddingBottom: 60 },

  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: '#fff',
  },
  modeInActive: { backgroundColor: '#059669', borderColor: '#059669' },
  modeOutActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  modeText: { fontSize: 14, fontWeight: '800', color: theme.colors.textSecondary },
  modeTextActive: { color: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
  label: { fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 6, marginTop: 6 },

  reasonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  reasonChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#fff' },
  reasonChipOn: { backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
  reasonChipText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  reasonChipTextOn: { color: '#DC2626' },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 6,
  },
  pickerText: { flex: 1, fontSize: 14, color: theme.colors.textPrimary },
  pickerPlaceholder: { color: theme.colors.textDisabled },

  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 34 },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 12 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.background, borderRadius: 10, paddingHorizontal: 12, height: 44, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, color: theme.colors.textPrimary },
  optRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  optName: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
  optCode: { fontSize: 11.5, color: theme.colors.textSecondary, marginTop: 1 },
  optEmpty: { textAlign: 'center', color: theme.colors.textSecondary, paddingVertical: 20 },
});
