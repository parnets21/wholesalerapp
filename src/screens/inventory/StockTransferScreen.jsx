// src/screens/inventory/StockTransferScreen.jsx
// Warehouse → Warehouse stock transfer + recent transfer log.
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import Icon from '../../components/Icon';
import FormField from '../../components/FormField';
import { inventoryService } from '../../services/inventoryService';
import { theme } from '../../utils/theme';

const NAVY   = theme.colors.primary;
const ORANGE = theme.colors.accent;

const STATUS_COLOR = {
  Pending:      { bg: '#FFFBEB', color: '#D97706' },
  'In Transit': { bg: '#EFF6FF', color: '#2563EB' },
  Completed:    { bg: '#ECFDF5', color: '#059669' },
  Cancelled:    { bg: '#FEF2F2', color: '#DC2626' },
};

export default function StockTransferScreen({ navigation, route }) {
  const preset = route?.params?.product || null;

  const [product, setProduct]     = useState(preset || null);
  const [fromWh, setFromWh]       = useState(null);
  const [toWh, setToWh]           = useState(null);
  const [qty, setQty]             = useState('');
  const [note, setNote]           = useState('');
  const [saving, setSaving]       = useState(false);

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts]     = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch]         = useState('');

  const [picker, setPicker] = useState(null); // 'product' | 'from' | 'to' | null

  const [transfers, setTransfers] = useState([]);
  const [loadingLog, setLoadingLog] = useState(true);

  useEffect(() => {
    inventoryService.warehouses().then(r => setWarehouses(r?.data ?? r ?? [])).catch(() => {});
  }, []);

  const loadLog = useCallback(async () => {
    setLoadingLog(true);
    try {
      const r = await inventoryService.transfers({ limit: 20 });
      setTransfers(r?.data?.transfers ?? r?.transfers ?? []);
    } catch { setTransfers([]); }
    finally { setLoadingLog(false); }
  }, []);
  useEffect(() => { loadLog(); }, [loadLog]);

  const loadProducts = async (q = '') => {
    setLoadingProducts(true);
    try {
      const r = await inventoryService.productOptions({ limit: 50, search: q });
      setProducts(r?.data?.products ?? r?.products ?? []);
    } catch { setProducts([]); }
    finally { setLoadingProducts(false); }
  };

  const openProductPicker = () => { setPicker('product'); loadProducts(search); };
  const numOnly = (v) => v.replace(/[^0-9.]/g, '');

  const submit = async () => {
    if (!product?._id)  { Alert.alert('Product', 'Please choose a product.'); return; }
    if (!fromWh?._id)   { Alert.alert('Source', 'Select the source warehouse.'); return; }
    if (!toWh?._id)     { Alert.alert('Destination', 'Select the destination warehouse.'); return; }
    if (fromWh._id === toWh._id) { Alert.alert('Warehouses', 'Source and destination must differ.'); return; }
    const q = parseFloat(qty);
    if (!q || q <= 0)   { Alert.alert('Quantity', 'Enter a valid quantity.'); return; }

    setSaving(true);
    try {
      await inventoryService.transfer({
        from_warehouse: fromWh._id,
        to_warehouse:   toWh._id,
        product_id:     product._id,
        quantity:       q,
        notes:          note.trim(),
      });
      Alert.alert('Success', 'Stock transfer created.', [
        { text: 'OK', onPress: () => { setQty(''); setNote(''); loadLog(); } },
      ]);
    } catch (e) {
      Alert.alert('Failed', e?.message || 'Could not create transfer.');
    } finally {
      setSaving(false);
    }
  };

  const pickerData = picker === 'product' ? products : warehouses;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Stock Transfer</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.label}>Product *</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={openProductPicker} activeOpacity={0.8}>
            <Text style={[styles.pickerText, !product && styles.pickerPlaceholder]} numberOfLines={1}>
              {product ? `${product.name}${product.code ? ` (${product.code})` : ''}` : 'Select a product'}
            </Text>
            <Icon name="chevron-down" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {/* From → To */}
          <View style={styles.whRow}>
            <View style={styles.whCol}>
              <Text style={styles.label}>From *</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setPicker('from')} activeOpacity={0.8}>
                <Text style={[styles.pickerText, !fromWh && styles.pickerPlaceholder]} numberOfLines={1}>
                  {fromWh ? fromWh.name : 'Source'}
                </Text>
                <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.arrowWrap}>
              <Icon name="arrow-right-bold" size={20} color={ORANGE} />
            </View>
            <View style={styles.whCol}>
              <Text style={styles.label}>To *</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setPicker('to')} activeOpacity={0.8}>
                <Text style={[styles.pickerText, !toWh && styles.pickerPlaceholder]} numberOfLines={1}>
                  {toWh ? toWh.name : 'Destination'}
                </Text>
                <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <FormField label="Quantity *" value={qty} onChangeText={v => setQty(numOnly(v))} keyboardType="numeric" placeholder="0" />
          <FormField label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. Rebalancing stock" />
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>{saving ? 'Transferring…' : 'Transfer Stock'}</Text>
        </TouchableOpacity>

        {/* Transfer log */}
        <Text style={styles.logTitle}>Recent Transfers</Text>
        {loadingLog ? (
          <ActivityIndicator color={ORANGE} style={{ marginVertical: 16 }} />
        ) : transfers.length === 0 ? (
          <Text style={styles.logEmpty}>No transfers yet.</Text>
        ) : (
          transfers.map(t => {
            const sc = STATUS_COLOR[t.status] || STATUS_COLOR.Pending;
            return (
              <View key={t._id} style={styles.logRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logProduct} numberOfLines={1}>{t.product_name || 'Product'}</Text>
                  <Text style={styles.logRoute} numberOfLines={1}>
                    {(t.from_warehouse_name || 'Source')} → {(t.to_warehouse_name || 'Dest')}
                  </Text>
                </View>
                <View style={styles.logRight}>
                  <Text style={styles.logQty}>{t.quantity}</Text>
                  <View style={[styles.logBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.logBadgeText, { color: sc.color }]}>{t.status}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Picker modal (product / warehouse) */}
      <Modal visible={!!picker} animationType="slide" transparent onRequestClose={() => setPicker(null)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setPicker(null)} activeOpacity={1} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              {picker === 'product' ? 'Select Product' : picker === 'from' ? 'Source Warehouse' : 'Destination Warehouse'}
            </Text>

            {picker === 'product' && (
              <View style={styles.searchWrap}>
                <Icon name="magnify" size={18} color={theme.colors.textDisabled} />
                <TextInput
                  style={styles.searchInput} placeholder="Search…" placeholderTextColor={theme.colors.textDisabled}
                  value={search} onChangeText={(t) => { setSearch(t); loadProducts(t); }}
                />
              </View>
            )}

            {picker === 'product' && loadingProducts ? (
              <ActivityIndicator color={ORANGE} style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={pickerData}
                keyExtractor={(it) => it._id}
                style={{ maxHeight: 360 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.optRow}
                    onPress={() => {
                      if (picker === 'product') setProduct(item);
                      else if (picker === 'from') setFromWh(item);
                      else setToWh(item);
                      setPicker(null);
                    }}
                  >
                    <Text style={styles.optName} numberOfLines={1}>{item.name}</Text>
                    {item.code ? <Text style={styles.optCode}>{item.code}</Text> : null}
                    {item.city ? <Text style={styles.optCode}>{item.city}</Text> : null}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.optEmpty}>Nothing found.</Text>}
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: NAVY,
    paddingTop: Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },

  container: { backgroundColor: theme.colors.background, padding: 16, paddingBottom: 60 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },

  label: { fontSize: 12.5, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 6, marginTop: 4 },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8,
  },
  pickerText: { flex: 1, fontSize: 14, color: theme.colors.textPrimary },
  pickerPlaceholder: { color: theme.colors.textDisabled },

  whRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  whCol: { flex: 1 },
  arrowWrap: { paddingBottom: 18 },

  saveBtn: { backgroundColor: ORANGE, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 22 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  logTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10 },
  logEmpty: { fontSize: 12.5, color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: 16 },
  logRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border,
  },
  logProduct: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary },
  logRoute: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  logRight: { alignItems: 'flex-end', gap: 4 },
  logQty: { fontSize: 14, fontWeight: '800', color: NAVY },
  logBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  logBadgeText: { fontSize: 9.5, fontWeight: '700' },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
  sheetTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 12 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: 10, paddingHorizontal: 12, marginBottom: 10,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: theme.colors.textPrimary },
  optRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optName: { flex: 1, fontSize: 14, color: theme.colors.textPrimary, fontWeight: '600' },
  optCode: { fontSize: 11, color: theme.colors.textSecondary, marginLeft: 8 },
  optEmpty: { textAlign: 'center', color: theme.colors.textSecondary, paddingVertical: 16 },
});
