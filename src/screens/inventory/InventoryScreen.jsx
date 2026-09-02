// src/screens/inventory/InventoryScreen.jsx
// EzyEnquiry Wholesaler — Full Inventory Dashboard
// Real API: /wholesaler/inventory, /wholesaler/inventory/summary, /wholesaler/warehouses

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon           from '../../components/Icon';
import EmptyState     from '../../components/EmptyState';
import ErrorMessage   from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { inventoryService }    from '../../services/inventoryService';
import { formatCurrency }      from '../../utils/formatters';
import { theme }               from '../../utils/theme';

// ── Design tokens ────────────────────────────────────────────────────────────
const PRIMARY  = theme.colors.primary;   // #2D1B69
const ORANGE   = theme.colors.accent;    // #FF6B35
const BG       = '#F0F2F8';
const WHITE    = '#FFFFFF';
const TEXT     = '#171A2B';
const MUTED    = '#6B7280';
const BORDER   = '#E8EAF0';

const SHADOW = {
  shadowColor: '#111827', shadowOpacity: 0.07,
  shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4,
};

// ── Stock status config ───────────────────────────────────────────────────────
const STATUS_CFG = {
  AVAILABLE:    { label: 'AVAILABLE',  bg: '#ECFDF5', color: '#059669' },
  LOW_STOCK:    { label: 'LOW STOCK',  bg: '#FFFBEB', color: '#D97706' },
  OUT_OF_STOCK: { label: 'OUT OF STOCK', bg: '#FEF2F2', color: '#DC2626' },
};

function getStockStatus(item) {
  if ((item.available_stock || 0) <= 0)
    return STATUS_CFG.OUT_OF_STOCK;
  if ((item.available_stock || 0) <= (item.low_stock_alert || 50))
    return STATUS_CFG.LOW_STOCK;
  return STATUS_CFG.AVAILABLE;
}

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'reserved',  label: 'Reserved' },
  { key: 'picking',   label: 'Picking' },
  { key: 'packed',    label: 'Packed' },
  { key: 'low',       label: 'Low Stock' },
  { key: 'out',       label: 'Out of Stock' },
  { key: 'blocked',   label: 'Blocked' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY CARD
// ─────────────────────────────────────────────────────────────────────────────
function SummaryCard({ icon, iconBg, iconColor, label, value, onPress }) {
  return (
    <TouchableOpacity style={styles.summaryCard} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.summaryIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STOCK BUCKET ROW
// ─────────────────────────────────────────────────────────────────────────────
function BucketRow({ label, value, color, icon }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.bucketRow}>
      <View style={styles.bucketLeft}>
        <View style={[styles.bucketDot, { backgroundColor: color }]} />
        <Text style={styles.bucketLabel}>{label}</Text>
      </View>
      <Text style={[styles.bucketValue, { color }]}>{value}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY CARD
// ─────────────────────────────────────────────────────────────────────────────
function InventoryCard({ item, onPress }) {
  const st = getStockStatus(item);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.cardAccent, { backgroundColor: st.color }]} />
      <View style={styles.cardBody}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.product_name || '—'}
            </Text>
            <Text style={styles.productCode}>{item.product_code || ''}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: st.color }]} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        {/* Warehouse */}
        {item.warehouse_name ? (
          <View style={styles.warehouseRow}>
            <Icon name="warehouse" size={12} color={MUTED} />
            <Text style={styles.warehouseText}>{item.warehouse_name}</Text>
            {item.warehouse_city ? (
              <Text style={styles.warehouseCity}> · {item.warehouse_city}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Stock buckets */}
        <View style={styles.bucketsGrid}>
          <View style={styles.bucketChip}>
            <Text style={styles.bucketChipVal}>{item.physical_stock ?? 0}</Text>
            <Text style={styles.bucketChipLbl}>Physical</Text>
          </View>
          <View style={[styles.bucketChip, styles.bucketChipHL]}>
            <Text style={[styles.bucketChipVal, { color: '#059669' }]}>{item.available_stock ?? 0}</Text>
            <Text style={styles.bucketChipLbl}>Available</Text>
          </View>
          {(item.reserved_stock > 0) && (
            <View style={styles.bucketChip}>
              <Text style={[styles.bucketChipVal, { color: '#D97706' }]}>{item.reserved_stock}</Text>
              <Text style={styles.bucketChipLbl}>Reserved</Text>
            </View>
          )}
          {(item.picking_stock > 0) && (
            <View style={styles.bucketChip}>
              <Text style={[styles.bucketChipVal, { color: '#7C3AED' }]}>{item.picking_stock}</Text>
              <Text style={styles.bucketChipLbl}>Picking</Text>
            </View>
          )}
          {(item.packed_stock > 0) && (
            <View style={styles.bucketChip}>
              <Text style={[styles.bucketChipVal, { color: '#0891B2' }]}>{item.packed_stock}</Text>
              <Text style={styles.bucketChipLbl}>Packed</Text>
            </View>
          )}
          {(item.blocked_stock > 0) && (
            <View style={styles.bucketChip}>
              <Text style={[styles.bucketChipVal, { color: '#DC2626' }]}>{item.blocked_stock}</Text>
              <Text style={styles.bucketChipLbl}>Blocked</Text>
            </View>
          )}
        </View>

        {/* Category / brand chips */}
        <View style={styles.chipRow}>
          {item.category_name ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{item.category_name}</Text>
            </View>
          ) : null}
          {item.brand_name ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{item.brand_name}</Text>
            </View>
          ) : null}
          {item.unit ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{item.unit}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.cardArrow}>
        <Icon name="chevron-right" size={16} color="#B0B5C3" />
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function DetailModal({ visible, itemId, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !itemId) return;
    setLoading(true);
    inventoryService.get(itemId)
      .then(r => setData(r?.data ?? r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, itemId]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Icon name="arrow-left" size={22} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Stock Detail</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <LoadingSpinner />
        ) : !data ? (
          <EmptyState icon="📦" title="No data" subtitle="Could not load inventory detail" />
        ) : (
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Product info */}
            <View style={styles.detailCard}>
              <Text style={styles.detailProductName}>{data.product_name}</Text>
              <Text style={styles.detailProductCode}>{data.product_code}</Text>
              <View style={styles.detailMeta}>
                {data.category_name ? <Text style={styles.metaTag}>{data.category_name}</Text> : null}
                {data.brand_name    ? <Text style={styles.metaTag}>{data.brand_name}</Text>    : null}
                {data.size          ? <Text style={styles.metaTag}>{data.size}</Text>          : null}
                {data.finish        ? <Text style={styles.metaTag}>{data.finish}</Text>        : null}
                {data.unit          ? <Text style={styles.metaTag}>{data.unit}</Text>          : null}
              </View>
            </View>

            {/* Warehouse */}
            {data.warehouse_name ? (
              <View style={styles.warehouseCard}>
                <Icon name="warehouse" size={18} color={PRIMARY} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.warehouseCardName}>{data.warehouse_name}</Text>
                  {data.warehouse_city ? (
                    <Text style={styles.warehouseCardCity}>{data.warehouse_city}</Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Stock summary */}
            <View style={styles.detailCard}>
              <Text style={styles.detailSection}>Stock Summary</Text>
              <BucketRow label="Physical Stock"  value={data.physical_stock}  color="#374151" />
              <BucketRow label="Available Stock" value={data.available_stock} color="#059669" />
              <BucketRow label="Reserved / Hold" value={data.reserved_stock}  color="#D97706" />
              <BucketRow label="Picking"         value={data.picking_stock}   color="#7C3AED" />
              <BucketRow label="Packed"          value={data.packed_stock}    color="#0891B2" />
              <BucketRow label="Blocked"         value={data.blocked_stock}   color="#DC2626" />
              <BucketRow label="Dispatched (total)" value={data.dispatched_qty} color="#6B7280" />
              <View style={styles.divider} />
              <View style={styles.bucketRow}>
                <Text style={[styles.bucketLabel, { fontWeight: '700' }]}>Low Stock Alert at</Text>
                <Text style={[styles.bucketValue, { color: '#D97706', fontWeight: '700' }]}>
                  {data.low_stock_alert ?? 50} units
                </Text>
              </View>
              {data.purchase_rate > 0 && (
                <View style={styles.bucketRow}>
                  <Text style={styles.bucketLabel}>Purchase Rate</Text>
                  <Text style={[styles.bucketValue, { color: PRIMARY }]}>
                    {formatCurrency(data.purchase_rate)}
                  </Text>
                </View>
              )}
            </View>

            {/* Movement history */}
            {data.movements?.length > 0 && (
              <View style={styles.detailCard}>
                <Text style={styles.detailSection}>Movement History</Text>
                {data.movements.slice(0, 15).map((m, i) => (
                  <View key={i} style={styles.movementRow}>
                    <View style={[styles.movementBadge, {
                      backgroundColor: m.movement_type === 'Stock In' ? '#ECFDF5'
                        : m.movement_type === 'Reversal' ? '#EFF6FF' : '#FEF2F2',
                    }]}>
                      <Text style={[styles.movementType, {
                        color: m.movement_type === 'Stock In' ? '#059669'
                          : m.movement_type === 'Reversal' ? '#2563EB' : '#DC2626',
                      }]}>
                        {m.movement_type === 'Stock In' ? '+' : '−'}{m.quantity} {m.unit || ''}
                      </Text>
                    </View>
                    <View style={styles.movementInfo}>
                      <Text style={styles.movementNote} numberOfLines={1}>
                        {m.notes || m.reference_type || '—'}
                      </Text>
                      <Text style={styles.movementDate}>
                        {m.movement_date
                          ? new Date(m.movement_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </Text>
                    </View>
                    <View style={styles.movementStock}>
                      <Text style={styles.movementStockVal}>{m.new_stock}</Text>
                      <Text style={styles.movementStockLbl}>closing</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function InventoryScreen({ navigation }) {
  const [summary,    setSummary]    = useState(null);
  const [inventory,  setInventory]  = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const [activeTab,  setActiveTab]  = useState('all');
  const [search,     setSearch]     = useState('');
  const [warehouse,  setWarehouse]  = useState('all');
  const [showWHPicker, setShowWHPicker] = useState(false);
  const [detailId,   setDetailId]   = useState(null);
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchTimer = useRef(null);

  const LIMIT = 30;

  // ── Load summary ────────────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    try {
      const r = await inventoryService.summary();
      setSummary(r?.data ?? r);
    } catch (_) {}
  }, []);

  // ── Load warehouses ─────────────────────────────────────────────────────────
  const loadWarehouses = useCallback(async () => {
    try {
      const r = await inventoryService.warehouses();
      setWarehouses(r?.data ?? r ?? []);
    } catch (_) {}
  }, []);

  // ── Load inventory list ─────────────────────────────────────────────────────
  const loadInventory = useCallback(async (pg = 1, append = false) => {
    if (pg === 1) { setLoading(true); setError(null); }
    else          setLoadingMore(true);

    try {
      const params = {
        page:  pg,
        limit: LIMIT,
        stock_status: activeTab === 'all' ? undefined : activeTab,
      };
      if (warehouse !== 'all') params.warehouse_id = warehouse;
      if (search.trim())       params.search        = search.trim();

      const res  = await inventoryService.list(params);
      const list = res?.data?.inventory ?? res?.inventory ?? [];
      const pag  = res?.data?.pagination ?? res?.pagination;

      if (append) setInventory(prev => [...prev, ...list]);
      else        setInventory(list);

      setHasMore(pag ? pg < pag.totalPages : list.length === LIMIT);
      setPage(pg);
    } catch (e) {
      if (!append) setError(e?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [activeTab, warehouse, search]);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    loadSummary();
    loadWarehouses();
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadInventory(1, false);
  }, [activeTab, warehouse]);

  // ── Debounced search ────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      loadInventory(1, false);
    }, 380);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSummary();
    loadInventory(1, false);
  };

  const onEndReached = () => {
    if (!loadingMore && hasMore) loadInventory(page + 1, true);
  };

  const s = summary || {};

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* ── Purple Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />

        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={WHITE} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Inventory</Text>
            <Text style={styles.headerSub}>Stock Management</Text>
          </View>
          <TouchableOpacity style={styles.whBtn} onPress={() => setShowWHPicker(true)}>
            <Icon name="warehouse" size={16} color={WHITE} />
            <Text style={styles.whBtnText} numberOfLines={1}>
              {warehouse === 'all'
                ? 'All WH'
                : (warehouses.find(w => w._id === warehouse)?.name?.split(' ')[0] || 'WH')}
            </Text>
            <Icon name="chevron-down" size={14} color={WHITE} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Icon name="magnify" size={18} color={MUTED} style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search product, code..."
            placeholderTextColor={MUTED}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 10 }}>
              <Icon name="close-circle" size={18} color={MUTED} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Summary strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.summaryStrip} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          <SummaryCard icon="package-variant" iconBg="#EDE8FF" iconColor={PRIMARY}
            label="Products" value={s.total_products ?? 0}
            onPress={() => setActiveTab('all')} />
          <SummaryCard icon="check-circle-outline" iconBg="#DCFCE7" iconColor="#059669"
            label="Available" value={s.total_available ?? 0}
            onPress={() => setActiveTab('available')} />
          <SummaryCard icon="lock-outline" iconBg="#FEF3C7" iconColor="#D97706"
            label="Reserved" value={s.total_reserved ?? 0}
            onPress={() => setActiveTab('reserved')} />
          <SummaryCard icon="package-variant-closed" iconBg="#EFF6FF" iconColor="#2563EB"
            label="Packed" value={s.total_packed ?? 0}
            onPress={() => setActiveTab('packed')} />
          <SummaryCard icon="alert-circle-outline" iconBg="#FFFBEB" iconColor="#D97706"
            label="Low Stock" value={s.low_stock ?? 0}
            onPress={() => setActiveTab('low')} />
          <SummaryCard icon="close-circle-outline" iconBg="#FEF2F2" iconColor="#DC2626"
            label="Out of Stock" value={s.out_of_stock ?? 0}
            onPress={() => setActiveTab('out')} />
          {s.total_stock_value > 0 && (
            <SummaryCard icon="currency-inr" iconBg="#F0FDF4" iconColor="#059669"
              label="Stock Value" value={formatCurrency(s.total_stock_value)} />
          )}
        </ScrollView>
      </View>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {loading && !inventory.length ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => loadInventory(1)} />
      ) : (
        <FlatList
          data={inventory}
          keyExtractor={i => i._id?.toString() ?? String(Math.random())}
          renderItem={({ item }) => (
            <InventoryCard item={item} onPress={() => setDetailId(item._id)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore
            ? <ActivityIndicator color={PRIMARY} style={{ marginVertical: 16 }} />
            : null}
          ListEmptyComponent={
            <EmptyState
              icon="📦"
              title="No inventory found"
              subtitle="Try changing filters or warehouse"
            />
          }
        />
      )}

      {/* ── Warehouse Picker ──────────────────────────────────────────────── */}
      <Modal visible={showWHPicker} transparent animationType="fade" onRequestClose={() => setShowWHPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowWHPicker(false)}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select Warehouse</Text>
            {[{ _id: 'all', name: 'All Warehouses' }, ...warehouses].map(w => (
              <TouchableOpacity
                key={w._id}
                style={[styles.pickerItem, warehouse === w._id && styles.pickerItemActive]}
                onPress={() => { setWarehouse(w._id); setShowWHPicker(false); }}
              >
                <Icon name="warehouse" size={16} color={warehouse === w._id ? WHITE : PRIMARY} />
                <Text style={[styles.pickerText, warehouse === w._id && styles.pickerTextActive]}>
                  {w.name}
                </Text>
                {warehouse === w._id && <Icon name="check" size={16} color={WHITE} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Detail Modal ─────────────────────────────────────────────────── */}
      <DetailModal
        visible={!!detailId}
        itemId={detailId}
        onClose={() => setDetailId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: PRIMARY,
    paddingBottom:   12,
    overflow:        'hidden',
  },
  headerDecor1: {
    position: 'absolute', top: -40, right: -30,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerDecor2: {
    position: 'absolute', bottom: 10, left: -50,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerTop: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingTop:     52,
    paddingBottom:  12,
    gap:            10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitles: { flex: 1 },
  headerTitle:  { fontSize: 20, fontWeight: '800', color: WHITE },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  whBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10,
  },
  whBtnText: { color: WHITE, fontSize: 11, fontWeight: '700', maxWidth: 70 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 12,
    marginHorizontal: 16, marginBottom: 12,
    height: 44,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: TEXT,
    paddingHorizontal: 10,
  },

  summaryStrip: { paddingBottom: 4 },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12, padding: 10, alignItems: 'center', minWidth: 80,
  },
  summaryIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  summaryValue: { fontSize: 16, fontWeight: '800', color: WHITE, marginBottom: 2 },
  summaryLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textAlign: 'center' },

  // ── Tabs ─────────────────────────────────────────────────────────────────
  tabsContainer: {
    backgroundColor: WHITE,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  tabsScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tabBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#F0F2F8',
  },
  tabBtnActive: { backgroundColor: PRIMARY },
  tabText:      { fontSize: 12, fontWeight: '700', color: MUTED },
  tabTextActive: { color: WHITE },

  // ── List ─────────────────────────────────────────────────────────────────
  list: { padding: 14, paddingBottom: 30 },

  // ── Inventory Card ────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: WHITE, borderRadius: 16,
    marginBottom: 10, overflow: 'hidden', ...SHADOW,
  },
  cardAccent: { width: 4 },
  cardBody:   { flex: 1, padding: 14, gap: 8 },
  cardArrow:  { width: 32, alignItems: 'center', justifyContent: 'center' },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleWrap: { flex: 1, marginRight: 8 },
  productName: { fontSize: 14, fontWeight: '800', color: TEXT, marginBottom: 2 },
  productCode: { fontSize: 11, color: MUTED, fontWeight: '600' },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '800' },

  warehouseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  warehouseText: { fontSize: 11, color: MUTED, fontWeight: '600' },
  warehouseCity: { fontSize: 11, color: MUTED },

  bucketsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bucketChip: {
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    minWidth: 60,
  },
  bucketChipHL: { backgroundColor: '#F0FDF4' },
  bucketChipVal: { fontSize: 14, fontWeight: '800', color: TEXT },
  bucketChipLbl: { fontSize: 9, color: MUTED, fontWeight: '600', marginTop: 1 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: '#EDE8FF', borderRadius: 6,
  },
  chipText: { fontSize: 10, color: PRIMARY, fontWeight: '600' },

  // ── Warehouse Picker ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: WHITE, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36,
  },
  pickerTitle: { fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 14 },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 12, marginBottom: 6,
    backgroundColor: '#F4F5F8',
  },
  pickerItemActive: { backgroundColor: PRIMARY },
  pickerText:       { flex: 1, fontSize: 14, fontWeight: '600', color: TEXT },
  pickerTextActive: { color: WHITE },

  // ── Detail Modal ──────────────────────────────────────────────────────────
  modalContainer: { flex: 1, backgroundColor: BG },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PRIMARY, paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: 16,
  },
  modalClose: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { flex: 1, textAlign: 'center', color: WHITE, fontSize: 16, fontWeight: '800' },
  modalContent: { padding: 16, paddingBottom: 40, gap: 12 },

  detailCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 16, ...SHADOW,
  },
  detailProductName: { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 4 },
  detailProductCode: { fontSize: 13, color: MUTED, fontWeight: '600', marginBottom: 10 },
  detailMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaTag: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: '#EDE8FF', borderRadius: 8,
    fontSize: 11, color: PRIMARY, fontWeight: '600',
  },

  warehouseCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: WHITE, borderRadius: 16, padding: 16, ...SHADOW,
  },
  warehouseCardName: { fontSize: 14, fontWeight: '700', color: TEXT },
  warehouseCardCity: { fontSize: 12, color: MUTED, marginTop: 2 },

  detailSection: { fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', marginBottom: 10 },
  bucketRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  bucketLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bucketDot:  { width: 8, height: 8, borderRadius: 4 },
  bucketLabel:{ fontSize: 13, color: TEXT },
  bucketValue:{ fontSize: 14, fontWeight: '800' },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 8 },

  movementRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  movementBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  movementType: { fontSize: 12, fontWeight: '800' },
  movementInfo: { flex: 1 },
  movementNote: { fontSize: 12, color: TEXT, fontWeight: '600' },
  movementDate: { fontSize: 10, color: MUTED, marginTop: 2 },
  movementStock: { alignItems: 'flex-end' },
  movementStockVal: { fontSize: 13, fontWeight: '800', color: TEXT },
  movementStockLbl: { fontSize: 9, color: MUTED },
});
