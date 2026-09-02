// src/screens/inventory/StockManagementScreen.jsx
// EzyEnquiry — Wholesaler App — Inventory / Stock Module
// Single file: Stock In / Stock Out / Stock Transfer + Available/Reserved/Damaged
// tracking + Low Stock & Out of Stock alerts. Fully working with local state
// (replace the api.* calls with your real endpoints).

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// ── Theme ──
const COLORS = {
  primary: '#2D1B69',
  accent: '#FF6B35',
  bg: '#F5F6FA',
  white: '#FFFFFF',
  text: '#1A1A2E',
  muted: '#8A8FA3',
  border: '#E4E8F0',
  green: '#1DB954',
  yellow: '#F5A623',
  red: '#E5484D',
};

const LOW_STOCK_THRESHOLD = 100;

// ── Mock data (replace with API) ──
const INITIAL_PRODUCTS = [
  { id: 'P001', code: 'GVT-6001', name: 'Marble Beige Glossy', available: 240, reserved: 20, damaged: 3 },
  { id: 'P002', code: 'GVT-6002', name: 'Carrara White Matt', available: 40, reserved: 5, damaged: 0 },
  { id: 'P003', code: 'WT-3005', name: 'Grey Stone Wall', available: 0, reserved: 0, damaged: 0 },
  { id: 'P004', code: 'GVT-6010', name: 'Sandstone Rustic', available: 610, reserved: 40, damaged: 8 },
];

const WAREHOUSES = ['Warehouse 1', 'Warehouse 2', 'Warehouse 3'];

const TABS = [
  { key: 'IN', label: 'Stock In', icon: 'arrow-down-bold-circle-outline' },
  { key: 'OUT', label: 'Stock Out', icon: 'arrow-up-bold-circle-outline' },
  { key: 'TRANSFER', label: 'Transfer', icon: 'swap-horizontal-circle-outline' },
];

function stockStatus(p) {
  if (p.available <= 0) return { label: 'Out of Stock', color: COLORS.red, dot: '🔴' };
  if (p.available < LOW_STOCK_THRESHOLD) return { label: 'Low Stock', color: COLORS.yellow, dot: '🟡' };
  return { label: 'In Stock', color: COLORS.green, dot: '🟢' };
}

export default function inventory() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [activeTab, setActiveTab] = useState('IN');
  const [history, setHistory] = useState([]); // movement log, latest first
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // 'product' | 'fromWarehouse' | 'toWarehouse'

  // Form state (shared, only relevant fields used per tab)
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');
  const [customer, setCustomer] = useState('');
  const [fromWarehouse, setFromWarehouse] = useState(WAREHOUSES[0]);
  const [toWarehouse, setToWarehouse] = useState(WAREHOUSES[1]);
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const alerts = useMemo(
    () => products.filter(p => p.available < LOW_STOCK_THRESHOLD),
    [products]
  );

  const resetForm = () => {
    setSelectedProductId(null);
    setQuantity('');
    setSupplier('');
    setCustomer('');
  };

  const pushHistory = entry => {
    setHistory(prev => [{ ...entry, id: Date.now().toString(), date: new Date() }, ...prev]);
  };

  const validateCommon = () => {
    if (!selectedProduct) {
      Alert.alert('Select product', 'Please choose a product first.');
      return false;
    }
    const qty = Number(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid quantity', 'Please enter a valid quantity.');
      return false;
    }
    return true;
  };

  const handleStockIn = async () => {
    if (!validateCommon()) return;
    if (!supplier.trim()) {
      Alert.alert('Supplier required', 'Please enter the supplier name.');
      return;
    }
    setSubmitting(true);
    try {
      const qty = Number(quantity);
      // await api.post('/stock/in', { productId: selectedProduct.id, qty, supplier });
      await new Promise(res => setTimeout(res, 500));
      setProducts(prev =>
        prev.map(p => (p.id === selectedProduct.id ? { ...p, available: p.available + qty } : p))
      );
      pushHistory({
        type: 'IN',
        productCode: selectedProduct.code,
        productName: selectedProduct.name,
        qty,
        supplier,
      });
      Alert.alert('Stock In recorded', `${qty} boxes added for ${selectedProduct.name}.`);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockOut = async () => {
    if (!validateCommon()) return;
    const qty = Number(quantity);
    if (qty > selectedProduct.available) {
      Alert.alert('Insufficient stock', `Only ${selectedProduct.available} boxes available.`);
      return;
    }
    setSubmitting(true);
    try {
      // await api.post('/stock/out', { productId: selectedProduct.id, qty, customer });
      await new Promise(res => setTimeout(res, 500));
      setProducts(prev =>
        prev.map(p => (p.id === selectedProduct.id ? { ...p, available: p.available - qty } : p))
      );
      pushHistory({
        type: 'OUT',
        productCode: selectedProduct.code,
        productName: selectedProduct.name,
        qty,
        customer: customer || '—',
      });
      Alert.alert('Stock Out recorded', `${qty} boxes deducted for ${selectedProduct.name}.`);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockTransfer = async () => {
    if (!validateCommon()) return;
    if (fromWarehouse === toWarehouse) {
      Alert.alert('Invalid transfer', 'From and To warehouse cannot be the same.');
      return;
    }
    const qty = Number(quantity);
    if (qty > selectedProduct.available) {
      Alert.alert('Insufficient stock', `Only ${selectedProduct.available} boxes available in source.`);
      return;
    }
    setSubmitting(true);
    try {
      // await api.post('/stock/transfer', { productId: selectedProduct.id, qty, fromWarehouse, toWarehouse });
      await new Promise(res => setTimeout(res, 500));
      // Net available stays same for this simplified single-location model;
      // in a true multi-warehouse schema you'd track per-warehouse quantities.
      pushHistory({
        type: 'TRANSFER',
        productCode: selectedProduct.code,
        productName: selectedProduct.name,
        qty,
        fromWarehouse,
        toWarehouse,
      });
      Alert.alert('Transfer recorded', `${qty} boxes moved from ${fromWarehouse} to ${toWarehouse}.`);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const openPicker = target => {
    setPickerTarget(target);
    setPickerVisible(true);
  };

  const handlePickerSelect = value => {
    if (pickerTarget === 'product') setSelectedProductId(value);
    if (pickerTarget === 'fromWarehouse') setFromWarehouse(value);
    if (pickerTarget === 'toWarehouse') setToWarehouse(value);
    setPickerVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Alerts */}
        {alerts.length > 0 && (
          <View style={styles.alertBanner}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.red} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.alertTitle}>
                {alerts.filter(a => a.available <= 0).length} Out of Stock ·{' '}
                {alerts.filter(a => a.available > 0).length} Low Stock
              </Text>
              {alerts.slice(0, 3).map(a => (
                <Text key={a.id} style={styles.alertLine}>
                  • {a.name} ({a.available} boxes left)
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Stock summary cards */}
        <View style={styles.summaryRow}>
          <SummaryCard label="Total Available" value={products.reduce((s, p) => s + p.available, 0)} color={COLORS.green} />
          <SummaryCard label="Reserved" value={products.reduce((s, p) => s + p.reserved, 0)} color={COLORS.yellow} />
          <SummaryCard label="Damaged" value={products.reduce((s, p) => s + p.damaged, 0)} color={COLORS.red} />
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <MaterialCommunityIcons
                name={t.icon}
                size={18}
                color={activeTab === t.key ? COLORS.white : COLORS.primary}
              />
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <FieldLabel text="Product" />
          <TouchableOpacity style={styles.selectInput} onPress={() => openPicker('product')}>
            <Text style={selectedProduct ? styles.selectText : styles.selectPlaceholder}>
              {selectedProduct ? `${selectedProduct.name} (${selectedProduct.code})` : 'Select product'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.muted} />
          </TouchableOpacity>
          {selectedProduct && (
            <Text style={styles.availableHint}>Currently available: {selectedProduct.available} boxes</Text>
          )}

          <FieldLabel text="Quantity (boxes)" />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 50"
            placeholderTextColor={COLORS.muted}
            value={quantity}
            onChangeText={setQuantity}
          />

          {activeTab === 'IN' && (
            <>
              <FieldLabel text="Supplier" />
              <TextInput
                style={styles.input}
                placeholder="Supplier name"
                placeholderTextColor={COLORS.muted}
                value={supplier}
                onChangeText={setSupplier}
              />
              <Text style={styles.dateHint}>Date: {new Date().toDateString()} (auto)</Text>
            </>
          )}

          {activeTab === 'OUT' && (
            <>
              <FieldLabel text="Customer / Order Ref (optional)" />
              <TextInput
                style={styles.input}
                placeholder="Customer name or order #"
                placeholderTextColor={COLORS.muted}
                value={customer}
                onChangeText={setCustomer}
              />
            </>
          )}

          {activeTab === 'TRANSFER' && (
            <>
              <FieldLabel text="From Warehouse" />
              <TouchableOpacity style={styles.selectInput} onPress={() => openPicker('fromWarehouse')}>
                <Text style={styles.selectText}>{fromWarehouse}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.muted} />
              </TouchableOpacity>

              <FieldLabel text="To Warehouse" />
              <TouchableOpacity style={styles.selectInput} onPress={() => openPicker('toWarehouse')}>
                <Text style={styles.selectText}>{toWarehouse}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.muted} />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.submitBtn}
            disabled={submitting}
            onPress={
              activeTab === 'IN' ? handleStockIn : activeTab === 'OUT' ? handleStockOut : handleStockTransfer
            }
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitBtnText}>
                {activeTab === 'IN' ? 'Add Stock' : activeTab === 'OUT' ? 'Deduct Stock' : 'Transfer Stock'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Per-product stock table */}
        <Text style={styles.sectionHeading}>Stock by Product</Text>
        {products.map(p => {
          const status = stockStatus(p);
          return (
            <View key={p.id} style={styles.stockRowCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stockProductName}>{p.name}</Text>
                <Text style={styles.stockProductCode}>{p.code}</Text>
              </View>
              <StatPill label="Avail" value={p.available} />
              <StatPill label="Resv" value={p.reserved} />
              <StatPill label="Dmg" value={p.damaged} />
              <Text style={{ color: status.color, fontSize: 16 }}>{status.dot}</Text>
            </View>
          );
        })}

        {/* Recent movement history */}
        <Text style={styles.sectionHeading}>Recent Stock Movements</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyHistory}>No stock movements yet.</Text>
        ) : (
          history.map(h => <HistoryRow key={h.id} entry={h} />)
        )}
      </ScrollView>

      {/* Picker modal */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setPickerVisible(false)}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>
              {pickerTarget === 'product' ? 'Select Product' : 'Select Warehouse'}
            </Text>
            <FlatList
              data={pickerTarget === 'product' ? products : WAREHOUSES}
              keyExtractor={item => (pickerTarget === 'product' ? item.id : item)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => handlePickerSelect(pickerTarget === 'product' ? item.id : item)}
                >
                  <Text style={styles.pickerItemText}>
                    {pickerTarget === 'product' ? `${item.name} (${item.code})` : item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ── Small sub-components ──
function FieldLabel({ text }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function SummaryCard({ label, value, color }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function StatPill({ label, value }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statPillValue}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

function HistoryRow({ entry }) {
  const iconMap = { IN: 'arrow-down-bold', OUT: 'arrow-up-bold', TRANSFER: 'swap-horizontal-bold' };
  const colorMap = { IN: COLORS.green, OUT: COLORS.red, TRANSFER: COLORS.primary };
  return (
    <View style={styles.historyRow}>
      <View style={[styles.historyIconWrap, { backgroundColor: colorMap[entry.type] + '20' }]}>
        <MaterialCommunityIcons name={iconMap[entry.type]} size={18} color={colorMap[entry.type]} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyProduct}>{entry.productName} ({entry.productCode})</Text>
        <Text style={styles.historySub}>
          {entry.type === 'IN' && `+${entry.qty} boxes · from ${entry.supplier}`}
          {entry.type === 'OUT' && `-${entry.qty} boxes · ${entry.customer}`}
          {entry.type === 'TRANSFER' && `${entry.qty} boxes · ${entry.fromWarehouse} → ${entry.toWarehouse}`}
        </Text>
      </View>
      <Text style={styles.historyDate}>{entry.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#FDEEEE',
    margin: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5C6C6',
  },
  alertTitle: { fontWeight: '700', color: COLORS.red, fontSize: 13, marginBottom: 4 },
  alertLine: { fontSize: 12, color: COLORS.text },

  summaryRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 4 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  summaryLabel: { fontSize: 11, color: COLORS.muted, marginTop: 4 },

  tabRow: { flexDirection: 'row', marginHorizontal: 12, marginTop: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 9 },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginLeft: 5 },
  tabTextActive: { color: COLORS.white },

  formCard: { backgroundColor: COLORS.white, margin: 12, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  fieldLabel: { fontSize: 12, color: COLORS.muted, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  selectPlaceholder: { fontSize: 14, color: COLORS.muted },
  availableHint: { fontSize: 11, color: COLORS.muted, marginTop: 4 },
  dateHint: { fontSize: 11, color: COLORS.muted, marginTop: 8 },

  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },

  sectionHeading: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginHorizontal: 16, marginTop: 20, marginBottom: 8 },

  stockRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stockProductName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  stockProductCode: { fontSize: 11, color: COLORS.muted },
  statPill: { alignItems: 'center', marginHorizontal: 6 },
  statPillValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  statPillLabel: { fontSize: 9, color: COLORS.muted },

  emptyHistory: { textAlign: 'center', color: COLORS.muted, fontSize: 12, marginTop: 10, marginBottom: 30 },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyIconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  historyProduct: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  historySub: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  historyDate: { fontSize: 10, color: COLORS.muted },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: '60%', padding: 16 },
  pickerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  pickerItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  pickerItemText: { fontSize: 14, color: COLORS.text },
});