// src/screens/product/AddProductScreen.jsx
//
// Wholesaler adds a new item/product. Supports Tiles (per-box coverage) and
// Granite (per-sqft) with a live sqft-per-box calculator.
//
import React, { useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import FormField from '../../components/FormField';
import { wholesalerProductService } from '../../services/productService';
import { theme } from '../../utils/theme';

export default function AddProductScreen({ navigation }) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '', size: '', finish: '', color: '', thickness: '',
    // tile dimensions (inches) for auto sqft/box
    tileW: '', tileL: '', pcs_per_box: '',
    sqft_per_box: '',
    purchase_price: '', selling_price: '', wholesale_rate: '', mrp: '',
    gst_percent: '18',
    hsn_code: '', description: '',
  });

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };
  const numOnly = (v) => v.replace(/[^0-9.]/g, '');

  // Auto sqft-per-box = (W_in/12 * L_in/12) * pcs_per_box
  const autoSqftPerBox = useMemo(() => {
    const w = parseFloat(form.tileW), l = parseFloat(form.tileL), p = parseFloat(form.pcs_per_box);
    if (w > 0 && l > 0 && p > 0) {
      return ((w / 12) * (l / 12) * p).toFixed(2);
    }
    return '';
  }, [form.tileW, form.tileL, form.pcs_per_box]);

  const effectiveSqftPerBox = form.sqft_per_box || autoSqftPerBox;

  const handleSave = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.purchase_price) e.purchase_price = 'Purchase rate required';
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      name:       form.name.trim(),
      unit:       'Sq Ft',
      size:       form.size.trim() || (form.tileW && form.tileL ? `${form.tileW}x${form.tileL}` : ''),
      finish:     form.finish.trim(),
      color:      form.color.trim(),
      thickness:  form.thickness.trim(),
      hsn_code:   form.hsn_code.trim(),
      description: form.description.trim(),
      pcs_per_box:  form.pcs_per_box || null,
      sqft_per_box: effectiveSqftPerBox || null,
      purchase_price: form.purchase_price || 0,
      selling_price:  form.selling_price || 0,
      wholesale_rate: form.wholesale_rate || 0,
      mrp:            form.mrp || 0,
      gst_percent:    form.gst_percent || 18,
    };

    setSaving(true);
    try {
      await wholesalerProductService.create(payload);
      Alert.alert('Success', 'Product added to your catalogue.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Failed', err?.message || 'Could not add product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">

        <View style={styles.card}>
          <FormField label="Product Name *" value={form.name}
            onChangeText={v => set('name', v)} placeholder="e.g. Glossy White Marble Tile" error={errors.name} />

          <View style={styles.row}>
            <View style={styles.col}>
              <FormField label="Size" value={form.size}
                onChangeText={v => set('size', v)} placeholder='e.g. 24x24' />
            </View>
            <View style={styles.col}>
              <FormField label="Finish" value={form.finish}
                onChangeText={v => set('finish', v)} placeholder="Glossy / Matt" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <FormField label="Color" value={form.color} onChangeText={v => set('color', v)} placeholder="White" />
            </View>
            <View style={styles.col}>
              <FormField label="Thickness" value={form.thickness} onChangeText={v => set('thickness', v)} placeholder="e.g. 10mm" />
            </View>
          </View>
        </View>

        {/* Coverage calculator */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📐 Coverage</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <FormField label="Tile Width (in)" value={form.tileW}
                onChangeText={v => set('tileW', numOnly(v))} keyboardType="numeric" placeholder="24" />
            </View>
            <View style={styles.col}>
              <FormField label="Tile Length (in)" value={form.tileL}
                onChangeText={v => set('tileL', numOnly(v))} keyboardType="numeric" placeholder="24" />
            </View>
          </View>
          <FormField label="Pieces per Box" value={form.pcs_per_box}
            onChangeText={v => set('pcs_per_box', numOnly(v))} keyboardType="numeric" placeholder="e.g. 4" />

          <View style={styles.calcBox}>
            <Text style={styles.calcLabel}>Sq Ft per Box (auto)</Text>
            <Text style={styles.calcValue}>{autoSqftPerBox || '—'}</Text>
          </View>
          <FormField label="Or enter Sq Ft/Box manually" value={form.sqft_per_box}
            onChangeText={v => set('sqft_per_box', numOnly(v))} keyboardType="numeric"
            placeholder={autoSqftPerBox ? `Auto: ${autoSqftPerBox}` : 'e.g. 16'} />
        </View>

        {/* Pricing */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Pricing (per Sq Ft)</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <FormField label="Purchase Rate *" value={form.purchase_price}
                onChangeText={v => set('purchase_price', numOnly(v))} keyboardType="numeric" placeholder="0" error={errors.purchase_price} />
            </View>
            <View style={styles.col}>
              <FormField label="Selling Rate" value={form.selling_price}
                onChangeText={v => set('selling_price', numOnly(v))} keyboardType="numeric" placeholder="0" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <FormField label="Wholesale Rate" value={form.wholesale_rate}
                onChangeText={v => set('wholesale_rate', numOnly(v))} keyboardType="numeric" placeholder="0" />
            </View>
            <View style={styles.col}>
              <FormField label="MRP" value={form.mrp}
                onChangeText={v => set('mrp', numOnly(v))} keyboardType="numeric" placeholder="0" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <FormField label="GST %" value={form.gst_percent}
                onChangeText={v => set('gst_percent', numOnly(v))} keyboardType="numeric" placeholder="18" />
            </View>
            <View style={styles.col}>
              <FormField label="HSN Code" value={form.hsn_code}
                onChangeText={v => set('hsn_code', v)} placeholder="Optional" />
            </View>
          </View>
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnOff]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Add Product'}</Text>
        </TouchableOpacity>
      </ScrollView>
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

  sectionTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeChip: {
    flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
  },
  typeChipOn: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentLight },
  typeChipText: { fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary },
  typeChipTextOn: { color: theme.colors.accent },

  card: {
    backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 12 },
  hint: { fontSize: 12.5, color: theme.colors.textSecondary, lineHeight: 18 },

  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },

  calcBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.primaryLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12,
  },
  calcLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  calcValue: { fontSize: 18, fontWeight: '900', color: theme.colors.accent },

  saveBtn: {
    backgroundColor: theme.colors.accent, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
  },
  saveBtnOff: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
