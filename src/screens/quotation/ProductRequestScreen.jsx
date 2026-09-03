// src/screens/quotation/ProductRequestScreen.jsx
//
// Wholesaler raises a request for a product (existing catalog item OR a brand
// new item they describe). Admin will send a quotation back.
//
import React, { useEffect, useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import FormField from '../../components/FormField';
import { quotationService } from '../../services/quotationService';
import { wholesalerProductService } from '../../services/productService';
import { theme } from '../../utils/theme';

export default function ProductRequestScreen({ navigation }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_id: null, product_name: '', product_code: '',
    size: '', finish: '', color: '', unit: 'Sq Ft',
    requested_qty: '', wholesaler_note: '',
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const numOnly = (v) => v.replace(/[^0-9.]/g, '');

  useEffect(() => {
    setCatalogLoading(true);
    wholesalerProductService.listCatalog({ catalog_only: true, limit: 200 })
      .then(res => setCatalog(res?.data?.products || res?.products || []))
      .catch(() => setCatalog([]))
      .finally(() => setCatalogLoading(false));
  }, []);

  const pickProduct = (p) => {
    setForm(f => ({
      ...f,
      product_id: p._id, product_name: p.name || '', product_code: p.code || '',
      size: p.size || '', finish: p.finish || '', color: p.color || '', unit: p.unit || 'Sq Ft',
    }));
    setPickerOpen(false); setPickerSearch('');
  };

  const handleSubmit = async () => {
    if (!form.product_name.trim()) { Alert.alert('Required', 'Enter or select a product name.'); return; }
    setSaving(true);
    try {
      await quotationService.create({
        product_id:    form.product_id || null,
        product_name:  form.product_name.trim(),
        product_code:  form.product_code,
        size:  form.size.trim(), finish: form.finish.trim(), color: form.color.trim(),
        unit:  form.unit,
        requested_qty: form.requested_qty || 0,
        wholesaler_note: form.wholesaler_note.trim(),
      });
      Alert.alert('Request Sent', 'Your request was sent to admin for a quotation.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Failed', err?.message || 'Could not send request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Request a Quotation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <View style={styles.card}>
          <Text style={styles.pickLabel}>Pick from Catalog (optional)</Text>
          <TouchableOpacity style={styles.pickBtn} onPress={() => setPickerOpen(true)} activeOpacity={0.8}>
            <Text style={[styles.pickBtnText, !form.product_id && styles.pickPlaceholder]} numberOfLines={1}>
              {form.product_id ? form.product_name : 'Choose an existing product…'}
            </Text>
            <Text style={styles.pickChevron}>▾</Text>
          </TouchableOpacity>
          <Text style={styles.pickHint}>Or just type the details below for a new item.</Text>

          <FormField label="Product Name *" value={form.product_name}
            onChangeText={v => set('product_name', v)} placeholder="e.g. Italian Marble 32x32" />
          <View style={styles.row}>
            <View style={styles.col}><FormField label="Size" value={form.size} onChangeText={v => set('size', v)} placeholder="24x24" /></View>
            <View style={styles.col}><FormField label="Finish" value={form.finish} onChangeText={v => set('finish', v)} placeholder="Glossy" /></View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}><FormField label="Color" value={form.color} onChangeText={v => set('color', v)} placeholder="White" /></View>
            <View style={styles.col}>
              <FormField label="Qty Needed" value={form.requested_qty}
                onChangeText={v => set('requested_qty', numOnly(v))} keyboardType="numeric" placeholder="e.g. 200" />
            </View>
          </View>
          <FormField label="Note to Admin" value={form.wholesaler_note}
            onChangeText={v => set('wholesaler_note', v)} placeholder="Any specific requirement…" multiline />
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnOff]} onPress={handleSubmit} disabled={saving} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>{saving ? 'Sending...' : 'Send Request'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Catalog picker modal */}
      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setPickerOpen(false)} activeOpacity={1} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Product</Text>
            <View style={styles.modalSearch}>
              <TextInput style={styles.modalSearchInput} placeholder="Search catalog…"
                placeholderTextColor={theme.colors.textDisabled} value={pickerSearch} onChangeText={setPickerSearch} />
            </View>
            {catalogLoading ? (
              <Text style={styles.modalEmpty}>Loading…</Text>
            ) : (
              <FlatList
                data={catalog.filter(p => {
                  const q = pickerSearch.trim().toLowerCase();
                  return !q || (p.name || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q);
                })}
                keyExtractor={p => p._id}
                style={{ maxHeight: 380 }}
                ListEmptyComponent={<Text style={styles.modalEmpty}>No catalog products.</Text>}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.pickRow} onPress={() => pickProduct(item)} activeOpacity={0.7}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickRowName}>{item.name}</Text>
                      <Text style={styles.pickRowMeta}>{item.code} · {item.size || '—'}</Text>
                    </View>
                    <Text style={styles.pickRowArrow}>›</Text>
                  </TouchableOpacity>
                )}
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
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  container: { backgroundColor: theme.colors.background, padding: 16, paddingBottom: 300 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: theme.colors.border },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },

  pickLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 6 },
  pickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: theme.colors.accent, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: theme.colors.accentLight,
  },
  pickBtnText: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.accentDark },
  pickPlaceholder: { color: theme.colors.textSecondary, fontWeight: '500' },
  pickChevron: { fontSize: 14, color: theme.colors.accentDark, marginLeft: 8 },
  pickHint: { fontSize: 11.5, color: theme.colors.textSecondary, marginTop: 6, marginBottom: 8 },

  saveBtn: { backgroundColor: theme.colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnOff: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: 30 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10 },
  modalSearch: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 12, marginBottom: 10 },
  modalSearchInput: { fontSize: 14, color: theme.colors.textPrimary, paddingVertical: Platform.OS === 'ios' ? 10 : 6 },
  modalEmpty: { textAlign: 'center', color: theme.colors.textSecondary, padding: 20, fontSize: 13 },
  pickRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  pickRowName: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
  pickRowMeta: { fontSize: 11.5, color: theme.colors.textSecondary, marginTop: 2 },
  pickRowArrow: { fontSize: 20, color: theme.colors.textDisabled, marginLeft: 8 },
});
