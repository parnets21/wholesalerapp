// src/screens/product/ProductListScreen.jsx
// Wholesaler Product Catalog — View Only
// Admin/Manufacturer ke products dikhata hai.
// Wholesaler sirf apni Dealer Rate / Retail Rate set kar sakta hai.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import Icon from '../../components/Icon';
import { wholesalerProductService } from '../../services/productService';
import useAuth from '../../hooks/useAuth';
import { theme } from '../../utils/theme';

const NAV = theme.colors.primary;   // #2D1B69
const OR  = theme.colors.accent;    // #FF6B35

const FILTER_KEYS = [
  { key: 'size',     label: 'Size'     },
  { key: 'finish',   label: 'Finish'   },
  { key: 'material', label: 'Material' },
  { key: 'color',    label: 'Color'    },
];

// ── Price row helper ─────────────────────────────────────────
const money = (n) => (n == null || n === '' || Number(n) === 0) ? '—' : '₹' + Number(n).toLocaleString('en-IN');
function PriceRow({ label, value, strong }) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={[styles.priceVal, strong && styles.priceValStrong]}>{value}</Text>
    </View>
  );
}

// ── Product card ─────────────────────────────────────────────
function ProductCard({ item, onPress, isMine, onDelete }) {
  const imageUrl  = item.image_urls?.[0];
  const catName   = item.category_id?.name || item.category || '—';
  const brandName = item.brand_id?.name    || item.brand    || '—';
  const unit = item.unit || 'Sq Ft';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <View style={styles.thumb}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.thumbImg} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Icon name="image-outline" size={26} color={theme.colors.textDisabled} />
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name || '—'}</Text>
            {isMine && (
              <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="trash-can-outline" size={18} color={theme.colors.danger} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.cardCode}>{item.code}{isMine ? '  · My item' : ''}</Text>

          <View style={styles.chipRow}>
            {item.size   ? <View style={styles.specChip}><Text style={styles.specChipText}>{item.size}</Text></View>   : null}
            {item.finish ? <View style={styles.specChip}><Text style={styles.specChipText}>{item.finish}</Text></View> : null}
            {item.color  ? <View style={styles.specChip}><Text style={styles.specChipText}>{item.color}</Text></View>  : null}
          </View>
          <Text style={styles.cardCat} numberOfLines={1}>{catName} · {brandName}</Text>
        </View>
      </View>

      {/* Full price breakup */}
      <View style={styles.priceBox}>
        <Text style={styles.priceBoxTitle}>Price Breakup (per {unit})</Text>
        <PriceRow label="Purchase" value={money(item.purchase_price)} />
        <PriceRow label="Selling"  value={money(item.selling_price)} />
        <PriceRow label="Wholesale" value={money(item.wholesale_rate)} />
        <PriceRow label="Dealer"   value={money(item.dealer_price)} />
        <PriceRow label="Retail"   value={money(item.retail_price)} />
        <PriceRow label="MRP"      value={money(item.mrp)} />
        <View style={styles.priceDivider} />
        <PriceRow label="GST" value={`${item.gst_percent ?? 18}%`} />
        {(item.pcs_per_box || item.sqft_per_box) ? (
          <PriceRow label="Per Box"
            value={`${item.pcs_per_box || '—'} pcs · ${item.sqft_per_box || '—'} sqft`} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ── Filter bottom sheet ───────────────────────────────────────
function FilterSheet({ visible, onClose, filterOptions, activeFilters, onApply }) {
  const [local, setLocal] = useState({ ...activeFilters });

  useEffect(() => {
    if (visible) setLocal({ ...activeFilters });
  }, [visible, activeFilters]);

  const toggle = (key, val) =>
    setLocal(prev => ({ ...prev, [key]: prev[key] === val ? '' : val }));

  const clearAll = () =>
    setLocal({ size: '', finish: '', material: '', color: '' });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={styles.sheetDismiss} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter Products</Text>
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clearAll}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {FILTER_KEYS.map(({ key, label }) => (
              <View key={key} style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>{label}</Text>
                <View style={styles.filterOptions}>
                  {(filterOptions[key + 's'] || []).length === 0 ? (
                    <Text style={styles.noOpts}>No options</Text>
                  ) : (
                    (filterOptions[key + 's'] || []).map(opt => {
                      const active = local[key] === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.filterOpt, active && styles.filterOptActive]}
                          onPress={() => toggle(key, opt)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.filterOptText, active && styles.filterOptTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => { onApply(local); onClose(); }}
          >
            <Icon name="check" size={18} color="#fff" />
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════
export default function ProductListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const myCompanyId = user?.company_id ? String(user.company_id) : null;

  const confirmDelete = (item) => {
    Alert.alert(
      'Delete Product',
      `Delete "${item.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await wholesalerProductService.delete(item._id);
              setProducts(prev => prev.filter(p => p._id !== item._id));
            } catch (e) {
              Alert.alert('Failed', e?.message || 'Could not delete product.');
            }
          },
        },
      ]
    );
  };

  const [products,      setProducts]      = useState([]);
  const [pagination,    setPagination]    = useState({ page: 1, totalPages: 1, total: 0 });
  const [search,        setSearch]        = useState('');
  const [activeFilters, setActiveFilters] = useState({ size: '', finish: '', material: '', color: '' });
  const [filterOptions, setFilterOptions] = useState({ sizes: [], finishes: [], materials: [], colors: [] });
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState(null);

  const searchTimer = useRef(null);
  const currentPage = useRef(1);

  // Load filter options once
  useEffect(() => {
    wholesalerProductService.getFilters()
      .then(res => setFilterOptions(res?.data ?? {}))
      .catch(() => {});
  }, []);

  // Load / reload products
  const loadProducts = useCallback(async (page = 1, append = false) => {
    if (page === 1) { append ? setRefreshing(true) : setLoading(true); }
    else setLoadingMore(true);
    setError(null);

    try {
      const params = {
        page, limit: 20,
        ...(search.trim()          && { search:   search.trim() }),
        ...(activeFilters.size     && { size:     activeFilters.size }),
        ...(activeFilters.finish   && { finish:   activeFilters.finish }),
        ...(activeFilters.material && { material: activeFilters.material }),
        ...(activeFilters.color    && { color:    activeFilters.color }),
      };

      const res  = await wholesalerProductService.listCatalog(params);
      const data = res?.data ?? res ?? {};
      const list = data.products ?? [];
      const pag  = data.pagination ?? { page: 1, totalPages: 1, total: list.length };

      setProducts(prev => (append && page > 1) ? [...prev, ...list] : list);
      setPagination(pag);
      currentPage.current = page;
    } catch (e) {
      setError(e?.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [search, activeFilters]);

  useEffect(() => { loadProducts(1); }, [loadProducts]);

  // Reload the list whenever the screen regains focus (e.g. after Add Product / Buy).
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { loadProducts(1); });
    return unsub;
  }, [navigation, loadProducts]);

  const handleSearch = (text) => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    // search state change triggers useEffect → loadProducts
  };

  const handleRefresh    = () => loadProducts(1, true);
  const handleLoadMore   = () => {
    if (!loadingMore && currentPage.current < pagination.totalPages)
      loadProducts(currentPage.current + 1, true);
  };
  const handleApplyFilters = (f) => setActiveFilters(f);

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  // ── Status bar height for Android ─────────────────────────
  const statusBarHeight = Platform.OS === 'android'
    ? (StatusBar.currentHeight ?? 24)
    : insets.top;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={NAV} />

      {/* ══════════════════════════════════════
          CUSTOM TOP HEADER
      ══════════════════════════════════════ */}
      <View style={[styles.header, { paddingTop: statusBarHeight + 10 }]}>
        {/* decorative circles */}
        <View style={styles.hCircle1} />
        <View style={styles.hCircle2} />

        {/* Title row */}
        <View style={styles.headerContent}>
          <View style={styles.headerTitleBlock}>
            <View style={styles.headerIconWrap}>
              <Icon name="package-variant-closed" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Product Catalog</Text>
              <Text style={styles.headerSub}>
                {loading ? 'Loading…' : `${pagination.total} products available`}
              </Text>
            </View>
          </View>

          {/* Filter button */}
          <TouchableOpacity
            style={[styles.headerFilterBtn, activeFilterCount > 0 && styles.headerFilterBtnActive]}
            onPress={() => setFilterVisible(true)}
            activeOpacity={0.82}
          >
            <Icon name="filter-variant" size={20} color={activeFilterCount > 0 ? NAV : '#fff'} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search bar — inside header */}
        <View style={styles.searchWrap}>
          <Icon name="magnify" size={18} color={theme.colors.textDisabled} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by code, name, design…"
            placeholderTextColor={theme.colors.textDisabled}
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close-circle" size={16} color={theme.colors.textDisabled} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Active filter chips ── */}
      {activeFilterCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeFilterRow}
          style={styles.activeFilterScroll}
        >
          {FILTER_KEYS.filter(f => activeFilters[f.key]).map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={styles.activeChip}
              onPress={() => setActiveFilters(p => ({ ...p, [key]: '' }))}
              activeOpacity={0.8}
            >
              <Text style={styles.activeChipText}>{label}: {activeFilters[key]}</Text>
              <Icon name="close-circle" size={13} color={NAV} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Rate legend strip ── */}
      <View style={styles.legendStrip}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Rate set</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#D1D5DB' }]} />
          <Text style={styles.legendText}>Rate pending</Text>
        </View>
        {!loading && (
          <Text style={styles.legendCount}>{pagination.total} total</Text>
        )}
      </View>

      {/* ── Error ── */}
      {error && !loading && (
        <View style={styles.errorBox}>
          <Icon name="wifi-off" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadProducts(1)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Product list ── */}
      {loading && products.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={NAV} />
          <Text style={styles.loadingText}>Loading products…</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              isMine={myCompanyId && String(item.company_id) === myCompanyId}
              onDelete={() => confirmDelete(item)}
              onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}
              colors={[NAV]} tintColor={NAV} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator size="small" color={NAV} style={{ marginVertical: 20 }} />
              : null
          }
          ListEmptyComponent={
            !loading && !error ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Icon name="package-variant-closed" size={44} color={theme.colors.textDisabled} />
                </View>
                <Text style={styles.emptyTitle}>No products found</Text>
                <Text style={styles.emptySub}>
                  {activeFilterCount > 0 || search
                    ? 'Try adjusting your search or filters'
                    : 'No products available yet'}
                </Text>
                {(activeFilterCount > 0 || search) && (
                  <TouchableOpacity
                    style={styles.clearFiltersBtn}
                    onPress={() => {
                      setSearch('');
                      setActiveFilters({ size: '', finish: '', material: '', color: '' });
                    }}
                  >
                    <Text style={styles.clearFiltersBtnText}>Clear Search & Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
        />
      )}

      {/* ── Filter sheet ── */}
      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        filterOptions={filterOptions}
        activeFilters={activeFilters}
        onApply={handleApplyFilters}
      />

      {/* ── Bottom action bar: Add Product + Buy ── */}
      <View style={[styles.fabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity
          style={styles.fabSecondary}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Icon name="plus" size={18} color={NAV} />
          <Text style={styles.fabSecondaryText}>Add Product</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fabPrimary}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('PurchaseEntry')}
        >
          <Icon name="cart-outline" size={18} color="#fff" />
          <Text style={styles.fabPrimaryText}>Buy Item</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F2F8' },

  /* ── Custom Header ── */
  header: {
    backgroundColor: NAV,
    paddingHorizontal: 16,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  hCircle1: {
    position: 'absolute', top: -30, right: -30,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  hCircle2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleBlock: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1,
  },
  headerFilterBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  headerFilterBtnActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  filterBadge: {
    position: 'absolute', top: 5, right: 5,
    width: 15, height: 15, borderRadius: 8,
    backgroundColor: OR, justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },

  /* Search inside header */
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 10 : 4,
    elevation: 0,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: theme.colors.textPrimary,
    paddingVertical: 0,
  },

  /* Active filter chips */
  activeFilterScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    maxHeight: 46,
  },
  activeFilterRow: {
    paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center',
  },
  activeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: theme.colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: NAV + '30',
  },
  activeChipText: { fontSize: 11, fontWeight: '600', color: NAV },

  /* Legend strip */
  legendStrip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    gap: 12,
  },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  legendText:  { fontSize: 11, color: theme.colors.textSecondary },
  legendCount: { marginLeft: 'auto', fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary },

  /* Error */
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, padding: 12, backgroundColor: '#FEF2F2',
    borderRadius: 10, borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 12, color: '#DC2626' },
  retryBtn:  { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#DC2626', borderRadius: 6 },
  retryText: { fontSize: 11, color: '#fff', fontWeight: '700' },

  /* Loading */
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  loadingText: { fontSize: 13, color: theme.colors.textSecondary },

  /* Product list */
  list: { padding: 12, paddingBottom: 90 },

  /* Product card */
  card: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 12,
    borderWidth: 1, borderColor: theme.colors.border,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  thumb: { width: 78, height: 92 },
  thumbPlaceholder: {
    width: 78, height: 92, backgroundColor: '#F0EEF8',
    justifyContent: 'center', alignItems: 'center',
  },
  thumbImg: { width: 78, height: 92 },
  cardBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName:     { flex: 1, fontSize: 14.5, fontWeight: '800', color: theme.colors.textPrimary },
  cardCode:     { fontSize: 11, color: theme.colors.textSecondary },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  specChip: {
    backgroundColor: '#F0EEF8', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  specChipText: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: '500' },
  cardCat:      { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },

  /* Price breakup box */
  priceBox: {
    backgroundColor: '#FAFBFC',
    borderTopWidth: 1, borderTopColor: theme.colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  priceBoxTitle: {
    fontSize: 10.5, fontWeight: '800', color: OR,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  priceLabel: { fontSize: 12.5, color: theme.colors.textSecondary },
  priceVal:   { fontSize: 12.5, fontWeight: '700', color: theme.colors.textPrimary },
  priceValStrong: { color: OR },
  priceDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 6 },

  /* Empty */
  empty: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32, gap: 10 },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#F0EEF8',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle:       { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary },
  emptySub:         { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  clearFiltersBtn:  { marginTop: 8, paddingHorizontal: 18, paddingVertical: 9, backgroundColor: NAV, borderRadius: 20 },
  clearFiltersBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  /* Filter sheet */
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetDismiss: { flex: 1 },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingBottom: 34,
    maxHeight: '82%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB',
    alignSelf: 'center', marginTop: 10, marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    marginBottom: 12,
  },
  sheetTitle:       { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary },
  clearAll:         { fontSize: 13, fontWeight: '700', color: OR },
  filterGroup:      { marginBottom: 18 },
  filterGroupLabel: {
    fontSize: 11, fontWeight: '800', color: theme.colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  filterOptions:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noOpts:              { fontSize: 12, color: theme.colors.textDisabled, fontStyle: 'italic' },
  filterOpt: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#F4F6FA',
  },
  filterOptActive:     { backgroundColor: NAV, borderColor: NAV },
  filterOptText:       { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  filterOptTextActive: { color: '#fff' },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: NAV, borderRadius: 14, height: 50, marginTop: 10,
  },
  applyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  /* Bottom action bar */
  fabBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 14, paddingTop: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  fabSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    height: 48, borderRadius: 12,
    backgroundColor: theme.colors.accentLight,
    borderWidth: 1.5, borderColor: NAV,
  },
  fabSecondaryText: { fontSize: 14, fontWeight: '800', color: NAV },
  fabPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    height: 48, borderRadius: 12, backgroundColor: OR,
  },
  fabPrimaryText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
