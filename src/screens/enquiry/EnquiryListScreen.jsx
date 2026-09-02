// src/screens/enquiry/EnquiryListScreen.jsx
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  StatusBar,
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
import useEnquiries   from '../../hooks/useEnquiries';
import { formatDate }  from '../../utils/formatters';
import { theme } from '../../utils/theme';

const STATUS_TABS = ['All', 'New', 'Viewed', 'Replied', 'Negotiation', 'Confirmed', 'Cancelled'];

const STATUS_META = {
  New:         { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  Viewed:      { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
  Replied:     { bg: '#FFF7ED', text: '#D97706', dot: '#F59E0B' },
  Negotiation: { bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6' },
  Confirmed:   { bg: '#F0FDF4', text: '#059669', dot: '#10B981' },
  Cancelled:   { bg: '#FEF2F2', text: '#DC2626', dot: '#F87171' },
};

const STATUS_BAR_H = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

export default function EnquiryListScreen({ navigation }) {
  const [tabIdx,  setTabIdx]  = useState(0);
  const [search,  setSearch]  = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { enquiries, loading, error, refetch, unreadCount } = useEnquiries();

  const activeStatus = STATUS_TABS[tabIdx];

  const filtered = (enquiries || []).filter(e => {
    const matchTab    = activeStatus === 'All' || e.status === activeStatus;
    const q           = search.trim().toLowerCase();
    const matchSearch = !q
      || (e.retailer_name  || '').toLowerCase().includes(q)
      || (e.customer_name  || '').toLowerCase().includes(q)
      || (e.product_name   || '').toLowerCase().includes(q)
      || (e.enq_code       || '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* ══════════════════════════════════
          TOP NAVBAR
      ══════════════════════════════════ */}
      <View style={styles.navbar}>
        {/* Decorative circles */}
        <View style={styles.navCircle1} />
        <View style={styles.navCircle2} />

        <View style={styles.navRow}>
          {/* Title + subtitle */}
          <View style={{ flex: 1 }}>
            <Text style={styles.navTitle}>Enquiries</Text>
            <Text style={styles.navSub}>
              {(enquiries || []).length} total
              {unreadCount > 0 ? `  ·  ${unreadCount} new` : ''}
            </Text>
          </View>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount} New</Text>
            </View>
          )}

          {/* Search toggle */}
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => { setShowSearch(v => !v); setSearch(''); }}
            activeOpacity={0.8}
          >
            <Icon name={showSearch ? 'close' : 'magnify'} size={20} color="#fff" />
          </TouchableOpacity>

          {/* Refresh */}
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={refetch}
            activeOpacity={0.8}
          >
            <Icon name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Inline search bar (shown when toggled) */}
        {showSearch && (
          <View style={styles.searchBar}>
            <Icon name="magnify" size={17} color={theme.colors.textDisabled} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, product, code…"
              placeholderTextColor={theme.colors.textDisabled}
              value={search}
              onChangeText={setSearch}
              autoFocus
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Icon name="close-circle" size={16} color={theme.colors.textDisabled} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ══════════════════════════════════
          STATUS FILTER TABS (horizontal scroll)
      ══════════════════════════════════ */}
      <View style={styles.tabBarWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          keyExtractor={t => t}
          contentContainerStyle={styles.tabList}
          renderItem={({ item: tab, index }) => {
            const active = index === tabIdx;
            const count  =
              tab === 'All' ? (enquiries || []).length :
              tab === 'New' ? unreadCount :
              (enquiries || []).filter(e => e.status === tab).length;
            return (
              <TouchableOpacity
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setTabIdx(index)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                      {count > 99 ? '99+' : count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ══════════════════════════════════
          ENQUIRY LIST
      ══════════════════════════════════ */}
      <FlatList
        data={filtered}
        keyExtractor={i => i._id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={refetch}
        renderItem={({ item }) => {
          const meta = STATUS_META[item.status] || STATUS_META.New;
          const isNew = item.status === 'New' && !item.viewed;
          return (
            <TouchableOpacity
              style={[styles.card, isNew && styles.cardNew]}
              onPress={() => navigation.navigate('EnquiryDetail', { enquiryId: item._id })}
              activeOpacity={0.78}
            >
              {/* New indicator strip on left */}
              {isNew && <View style={styles.newStrip} />}

              <View style={styles.cardInner}>
                {/* Row 1: code + status chip */}
                <View style={styles.cardRow}>
                  <View style={styles.codeWrap}>
                    <Icon name="tag-outline" size={12} color={theme.colors.textDisabled} />
                    <Text style={styles.enqCode}>
                      {item.enq_code || `#${item._id?.slice(-6)}`}
                    </Text>
                  </View>
                  <View style={[styles.chip, { backgroundColor: meta.bg }]}>
                    <View style={[styles.chipDot, { backgroundColor: meta.dot }]} />
                    <Text style={[styles.chipText, { color: meta.text }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Customer name */}
                <Text style={styles.customerName} numberOfLines={1}>
                  {item.retailer_name || item.customer_name || 'Customer'}
                </Text>

                {/* Product */}
                <View style={styles.productRow}>
                  <Icon name="cube-outline" size={13} color={theme.colors.textSecondary} />
                  <Text style={styles.productText} numberOfLines={1}>
                    {item.product_name || item.product_code || '—'}
                  </Text>
                </View>

                {/* Meta: qty + location */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Icon name="counter" size={12} color={theme.colors.textDisabled} />
                    <Text style={styles.metaText}>
                      Qty: {item.qty || 0} {item.unit || ''}
                    </Text>
                  </View>
                  {item.offered_price ? (
                    <View style={styles.metaItem}>
                      <Icon name="currency-inr" size={12} color={theme.colors.textDisabled} />
                      <Text style={styles.metaText}>
                        ₹{item.offered_price}
                      </Text>
                    </View>
                  ) : null}
                  {item.location ? (
                    <View style={styles.metaItem}>
                      <Icon name="map-marker-outline" size={12} color={theme.colors.textDisabled} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {item.location}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Footer: date + arrow */}
                <View style={[styles.cardRow, { marginTop: 4 }]}>
                  <View style={styles.metaItem}>
                    <Icon name="clock-outline" size={11} color={theme.colors.textDisabled} />
                    <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                  </View>
                  <View style={styles.arrowBtn}>
                    <Icon name="chevron-right" size={16} color={theme.colors.primary} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon={<Icon name="inbox-outline" size={52} color={theme.colors.textDisabled} />}
            title={`No ${activeStatus === 'All' ? '' : activeStatus + ' '}enquiries`}
            subtitle={search ? 'Try a different search term' : 'Pull down to refresh'}
          />
        }
      />
    </View>
  );
}

// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F4F8' },

  /* ── Navbar ── */
  navbar: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  navCircle1: {
    position: 'absolute', top: -30, right: -30,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  navCircle2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  navSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 1,
  },
  unreadBadge: {
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Search bar (inline, below nav row) ── */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
  },

  /* ── Status filter tab strip ── */
  tabBarWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  tabList: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 7,
    flexDirection: 'row',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F2F4F8',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText:       { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  tabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  tabBadge: {
    backgroundColor: '#E4E8F0',
    borderRadius: 8,
    minWidth: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText:       { fontSize: 9, fontWeight: '800', color: theme.colors.textSecondary },
  tabBadgeTextActive: { color: '#FFFFFF' },

  /* ── Enquiry cards ── */
  list: { padding: 12, paddingBottom: 32 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 2,
    shadowColor: '#1A0F40',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  cardNew: {
    borderColor: theme.colors.accent + '60',
  },
  /* Orange left strip for new enquiries */
  newStrip: {
    width: 4,
    backgroundColor: theme.colors.accent,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardInner: { flex: 1, padding: 13 },

  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  codeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enqCode: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textDisabled,
    letterSpacing: 0.3,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  chipDot:  { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 11, fontWeight: '700' },

  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 5,
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  productText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
  },

  metaRow:  { flexDirection: 'row', gap: 14, marginBottom: 2, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: theme.colors.textDisabled },

  dateText: { fontSize: 11, color: theme.colors.textDisabled, marginLeft: 2 },

  arrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
