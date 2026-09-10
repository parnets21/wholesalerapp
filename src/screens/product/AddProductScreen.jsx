// src/screens/product/AddProductScreen.jsx
//
// Wholesaler adds a new item/product. Supports Tiles (per-box coverage) and
// Granite (per-sqft) with a live sqft-per-box calculator.
//
import React, { useMemo, useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import FormField from '../../components/FormField';
import Icon from '../../components/Icon';
import { wholesalerProductService } from '../../services/productService';
import { masterService } from '../../services/masterService';
import { BASE_URL } from '../../services/api';
import { theme } from '../../utils/theme';

// Resolve a stored relative image path (e.g. /uploads/products/x.jpg) to a full URL
const IMG_HOST = BASE_URL.replace(/\/api\/?$/, '');
const resolveImg = (u) => (!u ? null : /^https?:\/\//.test(u) ? u : `${IMG_HOST}${u}`);

// Quick-pick chips from platform master values. Tap to fill the field; free-text still works.
function SuggestChips({ options, active, onPick }) {
  const list = Array.isArray(options) ? options : [];
  if (list.length === 0) return null;
  return (
    <View style={chipStyles.wrap}>
      {list.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.name;
        const on = active === val;
        return (
          <TouchableOpacity key={val} style={[chipStyles.chip, on && chipStyles.chipOn]} onPress={() => onPick(val)} activeOpacity={0.8}>
            <Text style={[chipStyles.chipText, on && chipStyles.chipTextOn]}>{val}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const chipStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: -6, marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#fff' },
  chipOn: { backgroundColor: theme.colors.accentLight, borderColor: theme.colors.accent },
  chipText: { fontSize: 11.5, fontWeight: '600', color: theme.colors.textSecondary },
  chipTextOn: { color: theme.colors.accent },
});

export default function AddProductScreen({ navigation, route }) {
  const editing = route?.params?.product || null;   // product object when editing
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  // Existing image URLs (stored on the product) + newly uploaded ones.
  const [imageUrls, setImageUrls] = useState(Array.isArray(editing?.image_urls) ? editing.image_urls : []);
  // Optional catalogue / price-list PDF.
  const [catalogPdf, setCatalogPdf] = useState(editing?.catalog_pdf_url || '');
  const [pdfUploading, setPdfUploading] = useState(false);

  // Platform master dropdown suggestions (size/finish/color/category/brand…)
  const [masters, setMasters] = useState({});
  React.useEffect(() => {
    masterService.all()
      .then(res => setMasters(res?.data?.masters || res?.masters || {}))
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    name: editing?.name || '', size: editing?.size || '', finish: editing?.finish || '',
    color: editing?.color || '', thickness: editing?.thickness || '',
    code:          editing?.code || '',
    category_name: editing?.category_name || '',
    sub_category_name: editing?.sub_category_name || '',
    brand_name:    editing?.brand_name || '',
    material:      editing?.material || '',
    // tile dimensions (inches) for auto sqft/box
    tileW: '', tileL: '',
    pcs_per_box: editing?.pcs_per_box != null ? String(editing.pcs_per_box) : '',
    sqft_per_box: editing?.sqft_per_box != null ? String(editing.sqft_per_box) : '',
    purchase_price: editing?.purchase_price != null ? String(editing.purchase_price) : '',
    selling_price:  editing?.selling_price  != null ? String(editing.selling_price)  : '',
    wholesale_rate: editing?.wholesale_rate != null ? String(editing.wholesale_rate) : '',
    mrp:            editing?.mrp            != null ? String(editing.mrp)            : '',
    gst_percent: editing?.gst_percent != null ? String(editing.gst_percent) : '18',
    hsn_code: editing?.hsn_code || '', description: editing?.description || '',
  });

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };
  const numOnly = (v) => v.replace(/[^0-9.]/g, '');

  // ── Pick + upload a product image ──────────────────────────
  const pickImage = async () => {
    try {
      const results = await pick({ allowMultiSelection: false, type: [types.images], mode: 'import' });
      if (!results || results.length === 0) return;
      const file = results[0];
      setUploading(true);
      const res = await wholesalerProductService.uploadImage({
        uri: file.uri, name: file.name || `photo_${Date.now()}.jpg`, type: file.type || 'image/jpeg',
      });
      const url = res?.data?.url || res?.url;
      if (url) setImageUrls(prev => [...prev, url]);
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      Alert.alert('Upload failed', err?.message || 'Could not upload the image.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url) => setImageUrls(prev => prev.filter(u => u !== url));

  // ── Pick + upload a catalogue / price-list PDF ──────────────
  const pickPdf = async () => {
    try {
      const results = await pick({ allowMultiSelection: false, type: [types.pdf], mode: 'import' });
      if (!results || results.length === 0) return;
      const file = results[0];
      setPdfUploading(true);
      const res = await wholesalerProductService.uploadDoc({
        uri: file.uri, name: file.name || `catalog_${Date.now()}.pdf`, type: file.type || 'application/pdf',
      });
      const url = res?.data?.url || res?.url;
      if (url) setCatalogPdf(url);
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      Alert.alert('Upload failed', err?.message || 'Could not upload the PDF.');
    } finally {
      setPdfUploading(false);
    }
  };

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
      code:       form.code.trim() || undefined,   // blank → backend auto-generates
      unit:       'Sq Ft',
      size:       form.size.trim() || (form.tileW && form.tileL ? `${form.tileW}x${form.tileL}` : ''),
      finish:     form.finish.trim(),
      color:      form.color.trim(),
      thickness:  form.thickness.trim(),
      material:          form.material.trim(),
      category_name:     form.category_name.trim(),
      sub_category_name: form.sub_category_name.trim(),
      brand_name:        form.brand_name.trim(),
      hsn_code:   form.hsn_code.trim(),
      description: form.description.trim(),
      pcs_per_box:  form.pcs_per_box || null,
      sqft_per_box: effectiveSqftPerBox || null,
      purchase_price: form.purchase_price || 0,
      selling_price:  form.selling_price || 0,
      wholesale_rate: form.wholesale_rate || 0,
      mrp:            form.mrp || 0,
      gst_percent:    form.gst_percent || 18,
      image_urls:     imageUrls,
      catalog_pdf_url: catalogPdf,
    };

    setSaving(true);
    try {
      if (editing) {
        await wholesalerProductService.update(editing._id, payload);
        Alert.alert('Success', 'Product updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await wholesalerProductService.create(payload);
        Alert.alert('Success', 'Product added to your catalogue.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (err) {
      Alert.alert('Failed', err?.message || 'Could not save product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{editing ? 'Edit Product' : 'Add New Product'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">

        <View style={styles.card}>
          <FormField label="Product Name *" value={form.name}
            onChangeText={v => set('name', v)} placeholder="e.g. Glossy White Marble Tile" error={errors.name} />

          <FormField label="Size" value={form.size}
            onChangeText={v => set('size', v)} placeholder='e.g. 24x24' />
          <SuggestChips options={masters.size} active={form.size} onPick={v => set('size', v)} />

          <FormField label="Finish" value={form.finish}
            onChangeText={v => set('finish', v)} placeholder="Glossy / Matt" />
          <SuggestChips options={masters.finish} active={form.finish} onPick={v => set('finish', v)} />

          <View style={styles.row}>
            <View style={styles.col}>
              <FormField label="Color" value={form.color} onChangeText={v => set('color', v)} placeholder="White" />
            </View>
            <View style={styles.col}>
              <FormField label="Thickness" value={form.thickness} onChangeText={v => set('thickness', v)} placeholder="e.g. 10mm" />
            </View>
          </View>
          <SuggestChips options={masters.color} active={form.color} onPick={v => set('color', v)} />
        </View>

        {/* Classification */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏷️ Classification</Text>

          <FormField label="Product Code" value={form.code}
            onChangeText={v => set('code', v)} placeholder="Leave blank to auto-generate" />

          <FormField label="Category" value={form.category_name}
            onChangeText={v => set('category_name', v)} placeholder="e.g. Tiles" />
          <SuggestChips options={masters.category} active={form.category_name} onPick={v => set('category_name', v)} />

          <FormField label="Sub-Category" value={form.sub_category_name}
            onChangeText={v => set('sub_category_name', v)} placeholder="e.g. Floor Tiles" />
          <SuggestChips options={masters.sub_category} active={form.sub_category_name} onPick={v => set('sub_category_name', v)} />

          <FormField label="Brand" value={form.brand_name}
            onChangeText={v => set('brand_name', v)} placeholder="e.g. Kajaria" />
          <SuggestChips options={masters.brand} active={form.brand_name} onPick={v => set('brand_name', v)} />

          <FormField label="Material Type" value={form.material}
            onChangeText={v => set('material', v)} placeholder="e.g. Ceramic / Vitrified" />
          <SuggestChips options={masters.material} active={form.material} onPick={v => set('material', v)} />
        </View>

        {/* Product images */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🖼️ Product Images</Text>
          <View style={styles.imgRow}>
            {imageUrls.map((u) => (
              <View key={u} style={styles.imgWrap}>
                <Image source={{ uri: resolveImg(u) }} style={styles.imgThumb} resizeMode="cover" />
                <TouchableOpacity style={styles.imgRemove} onPress={() => removeImage(u)}>
                  <Icon name="close" size={13} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.imgAdd} onPress={pickImage} disabled={uploading} activeOpacity={0.8}>
              <Icon name={uploading ? 'progress-upload' : 'camera-plus-outline'} size={22} color={theme.colors.accent} />
              <Text style={styles.imgAddText}>{uploading ? 'Uploading…' : 'Add'}</Text>
            </TouchableOpacity>
          </View>

          {/* Catalogue / price-list PDF */}
          <Text style={[styles.cardTitle, { marginTop: 16 }]}>📄 Catalogue / Price-list (PDF)</Text>
          {catalogPdf ? (
            <View style={styles.pdfRow}>
              <Icon name="file-pdf-box" size={22} color="#DC2626" />
              <Text style={styles.pdfName} numberOfLines={1}>Catalogue attached</Text>
              <TouchableOpacity onPress={() => setCatalogPdf('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close-circle" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.pdfBtn} onPress={pickPdf} disabled={pdfUploading} activeOpacity={0.8}>
              <Icon name={pdfUploading ? 'progress-upload' : 'file-upload-outline'} size={20} color={theme.colors.accent} />
              <Text style={styles.pdfBtnText}>{pdfUploading ? 'Uploading…' : 'Attach PDF (optional)'}</Text>
            </TouchableOpacity>
          )}
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
              <FormField label="Dealer Rate" value={form.wholesale_rate}
                onChangeText={v => set('wholesale_rate', numOnly(v))} keyboardType="numeric" placeholder="0" />
            </View>
            <View style={styles.col}>
              <FormField label="Retail Rate (MRP)" value={form.mrp}
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
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : (editing ? 'Save Changes' : 'Add Product')}</Text>
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

  imgRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imgWrap: { width: 74, height: 74, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  imgThumb: { width: '100%', height: '100%', borderRadius: 10 },
  imgRemove: {
    position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  imgAdd: {
    width: 74, height: 74, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 2,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.colors.accent, backgroundColor: theme.colors.accentLight,
  },
  imgAddText: { fontSize: 11, fontWeight: '700', color: theme.colors.accent },

  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: theme.colors.accent, backgroundColor: theme.colors.accentLight,
  },
  pdfBtnText: { fontSize: 12.5, fontWeight: '700', color: theme.colors.accent },
  pdfRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
  },
  pdfName: { flex: 1, fontSize: 12.5, fontWeight: '600', color: theme.colors.textPrimary },

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
