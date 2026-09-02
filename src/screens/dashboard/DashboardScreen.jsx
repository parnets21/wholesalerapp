// src/screens/dashboard/DashboardScreen.jsx

import React, { useCallback, useEffect, useState } from 'react';

import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Icon from '../../components/Icon';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import useAuth from '../../hooks/useAuth';

import { wholesalerProductService } from '../../services/productService';
import { dispatchService } from '../../services/dispatchService';
import { enquiryService } from '../../services/enquiryService';
import { reportsService } from '../../services/reportsService';

import { formatCurrency } from '../../utils/formatters';
import { theme } from '../../utils/theme';

const { width: SW } = Dimensions.get('window');

const NAV    = theme.colors.primary;   // #2D1B69
const ORANGE = theme.colors.accent;    // #FF6B35

const BG             = '#F0F2F8';
const WHITE          = '#FFFFFF';
const TEXT           = '#171A2B';
const TEXT_SECONDARY = '#6B7280';
const BORDER         = '#E8EAF0';

const H_PADDING = 16;
const GAP       = 10;

const STAT_W = (SW - H_PADDING * 2 - GAP) / 2;


/* ============================================================
   HELPERS
============================================================ */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day:     'numeric',
    month:   'short',
    year:    'numeric',
  });
}


/* ============================================================
   SHADOW
============================================================ */

const CARD_SHADOW = {
  shadowColor:   '#111827',
  shadowOpacity: 0.07,
  shadowOffset:  { width: 0, height: 4 },
  shadowRadius:  12,
  elevation:     4,
};


/* ============================================================
   STAT CARD
============================================================ */

function StatCard({ icon, iconBg, iconColor, label, value, sub, subColor, onPress }) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.statTop}>
        <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.statArrow}>
          <Icon name="arrow-top-right" size={12} color="#A1A6B4" />
        </View>
      </View>

      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>

      {sub ? (
        <View style={[styles.statSub, { backgroundColor: `${subColor}15` }]}>
          <View style={[styles.statSubDot, { backgroundColor: subColor }]} />
          <Text style={[styles.statSubText, { color: subColor }]}>{sub}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}


/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({ icon, iconColor, bg, label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.quickIcon, { backgroundColor: bg }]}>
        <Icon name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.quickLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}


/* ============================================================
   SECTION HEADER
============================================================ */

function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <View style={styles.sectionAccent} />
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {action ? (
        <TouchableOpacity style={styles.viewAllBtn} onPress={onAction} activeOpacity={0.75}>
          <Text style={styles.viewAllText}>{action}</Text>
          <Icon name="chevron-right" size={14} color={NAV} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}


/* ============================================================
   ENQUIRY STATUS MAP
============================================================ */

const ENQ_STATUS = {
  New:         { color: '#2563EB', bg: '#EFF6FF' },
  Viewed:      { color: '#6B7280', bg: '#F3F4F6' },
  Replied:     { color: '#D97706', bg: '#FFF7ED' },
  Negotiation: { color: '#7C3AED', bg: '#F5F3FF' },
  Confirmed:   { color: '#059669', bg: '#ECFDF5' },
  Cancelled:   { color: '#DC2626', bg: '#FEF2F2' },
};


/* ============================================================
   ENQUIRY CARD
============================================================ */

function EnqCard({ item, onPress }) {
  const meta = ENQ_STATUS[item.status] || ENQ_STATUS.New;

  const enquiryCode =
    item.enq_code || item.enquiry_code || `#${item._id?.slice(-6) || '------'}`;
  const customer =
    item.retailer_name || item.customer_name || item.retailer?.name || 'Customer';
  const product =
    item.product_name || item.product_code || item.product?.design_name || 'Product';
  const quantity = item.qty ?? item.quantity ?? 0;

  return (
    <TouchableOpacity style={styles.enquiryCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.enquiryStatusLine, { backgroundColor: meta.color }]} />

      <View style={styles.enquiryBody}>
        <View style={styles.enquiryTop}>
          <Text style={styles.enquiryCode}>{enquiryCode}</Text>
          <View style={[styles.statusChip, { backgroundColor: meta.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
            <Text style={[styles.statusText, { color: meta.color }]}>
              {item.status || 'New'}
            </Text>
          </View>
        </View>

        <Text style={styles.customerName} numberOfLines={1}>{customer}</Text>

        <View style={styles.enquiryMeta}>
          <Icon name="cube-outline" size={12} color="#9CA3AF" />
          <Text style={styles.metaText} numberOfLines={1}>{product}</Text>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>Qty {quantity}</Text>
        </View>
      </View>

      <View style={styles.enquiryArrow}>
        <Icon name="chevron-right" size={17} color="#A4A9B5" />
      </View>
    </TouchableOpacity>
  );
}


/* ============================================================
   ALERT ROW
============================================================ */

function AlertRow({ icon, iconColor, bg, accent, title, sub, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.alertRow, { backgroundColor: bg, borderLeftColor: accent }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.alertIcon, { backgroundColor: `${iconColor}18` }]}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>

      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertSub}>{sub}</Text>
      </View>

      <View style={styles.alertArrow}>
        <Icon name="chevron-right" size={16} color={iconColor} />
      </View>
    </TouchableOpacity>
  );
}


/* ============================================================
   MAIN DASHBOARD
============================================================ */

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();

  const [dashData,   setDashData]   = useState(null);
  const [enquiries,  setEnquiries]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);


  /* ── Load ── */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboardResult, enquiryResult] = await Promise.allSettled([
        reportsService.dashboard(),
        enquiryService.list({}),
      ]);

      if (dashboardResult.status === 'fulfilled') {
        const value =
          dashboardResult.value?.data ?? dashboardResult.value ?? {};
        setDashData(value);
      }

      if (enquiryResult.status === 'fulfilled') {
        const value = enquiryResult.value?.data ?? enquiryResult.value;
        setEnquiries(Array.isArray(value) ? value : []);
      }
    } catch (err) {
      if (!dashData) setError('Could not load dashboard. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);


  /* ── Loading ── */
  if (loading && !dashData) return <LoadingSpinner fullScreen />;

  /* ── Error ── */
  if (!dashData && error) return <ErrorMessage message={error} onRetry={load} />;


  /* ── Data ── */
  const sd         = dashData || {};
  const orders     = sd.orders || {};
  const lowStock   = sd.lowStockCount   ?? sd.low_stock_count   ?? 0;
  const outOfStock = sd.outOfStockCount ?? sd.out_of_stock_count ?? 0;
  const paymentDue = sd.paymentDue      ?? sd.payment_due       ?? 0;

  const enquiryNew = enquiries.filter(i => i.status === 'New').length;
  const enquiryActive = enquiries.filter(
    i => !['Confirmed', 'Cancelled'].includes(i.status)
  ).length;
  const enquiryConfirmed = enquiries.filter(i => i.status === 'Confirmed').length;
  const recentEnquiries  = enquiries.slice(0, 4);


  /* ── Quick Actions ── */
  const QUICK_ACTIONS = [
    {
      icon: 'package-variant',
      iconColor: '#7C3AED',
      bg: '#F3EFFF',
      label: 'Products',
      onPress: () => navigation.navigate('Products'),
    },
    {
      icon: 'message-text-outline',
      iconColor: NAV,
      bg: '#EDEAFF',
      label: 'Enquiries',
      onPress: () => navigation.navigate('Enquiries'),
    },
    {
      icon: 'currency-inr',
      iconColor: '#D97706',
      bg: '#FFF4E8',
      label: 'Sales',
      onPress: () => navigation.navigate('SalesList'),
    },
    {
      icon: 'warehouse',
      iconColor: '#0891B2',
      bg: '#E8F9FC',
      label: 'Inventory',
      onPress: () => navigation.navigate('Inventory'),
    },
    {
      icon: 'truck-delivery',
      iconColor: '#2563EB',
      bg: '#EEF5FF',
      label: 'Dispatch',
      onPress: () => navigation.navigate('DispatchTracking'),
    },
    {
      icon: 'receipt-text-outline',
      iconColor: '#DC2626',
      bg: '#FFF0F0',
      label: 'Expense',
      onPress: () => navigation.navigate('ExpenseList'),
    },
    {
      icon: 'chart-line',
      iconColor: '#059669',
      bg: '#EAFAF4',
      label: 'Profit & Loss',
      onPress: () => navigation.navigate('PLDashboard'),
    },
    {
      icon: 'bank-outline',
      iconColor: '#7C3AED',
      bg: '#F3EFFF',
      label: 'Accounts',
      onPress: () => navigation.navigate('Accounts'),
    },
  ];


  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={NAV} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            colors={[NAV]}
            tintColor={NAV}
          />
        }
      >

        {/* ====================================================
            HEADER
        ==================================================== */}

        <View style={styles.header}>
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />
          <View style={styles.headerCircle3} />

          {/* Top row */}
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{getGreeting()} 👋</Text>
              <Text style={styles.companyName} numberOfLines={1}>
                {user?.company_name || user?.companyName || 'EzyEnquiry'}
              </Text>
              <View style={styles.dateRow}>
                <Icon name="calendar-today" size={12} color="rgba(255,255,255,0.70)" />
                <Text style={styles.dateText}>{todayLabel()}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => navigation.navigate('NotificationList')}
              activeOpacity={0.8}
            >
              <Icon name="bell-outline" size={22} color="#FFFFFF" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          {/* Header summary strip */}
          <View style={styles.headerSummary}>
            <View style={styles.headerSummaryItem}>
              <Text style={styles.headerSummaryValue}>{enquiryActive}</Text>
              <Text style={styles.headerSummaryLabel}>Active Enquiries</Text>
            </View>
            <View style={styles.headerSummaryDivider} />
            <View style={styles.headerSummaryItem}>
              <Text style={styles.headerSummaryValue}>
                {orders.pending ?? orders.pending_orders ?? 0}
              </Text>
              <Text style={styles.headerSummaryLabel}>Pending Orders</Text>
            </View>
            <View style={styles.headerSummaryDivider} />
            <View style={styles.headerSummaryItem}>
              <Text style={styles.headerSummaryValue}>{lowStock}</Text>
              <Text style={styles.headerSummaryLabel}>Low Stock</Text>
            </View>
          </View>
        </View>


        {/* ====================================================
            KPI CARDS
        ==================================================== */}

        <View style={styles.statGrid}>
          <StatCard
            icon="currency-inr"
            iconBg="#E6F7EF"
            iconColor="#059669"
            label="Today's Sales"
            value={formatCurrency(sd.todaySales ?? 0)}
            sub="Revenue"
            subColor="#059669"
            onPress={() => navigation.navigate('SalesList')}
          />
          <StatCard
            icon="shopping-outline"
            iconBg="#FFF2E4"
            iconColor="#D97706"
            label="Today's Orders"
            value={String(orders.todayTotal ?? orders.today_total ?? orders.total ?? 0)}
            sub="Orders"
            subColor="#D97706"
            onPress={() => navigation.navigate('SalesList')}
          />
          <StatCard
            icon="clock-alert-outline"
            iconBg="#FFF8D9"
            iconColor="#CA8A04"
            label="Pending Orders"
            value={String(orders.pending ?? orders.pending_orders ?? 0)}
            sub="Pending"
            subColor="#CA8A04"
            onPress={() => navigation.navigate('SalesList')}
          />
          <StatCard
            icon="credit-card-off-outline"
            iconBg="#FFF0F0"
            iconColor="#DC2626"
            label="Outstanding"
            value={formatCurrency(paymentDue)}
            sub="Receivable"
            subColor="#DC2626"
            onPress={() => navigation.navigate('PaymentReceivable')}
          />
        </View>


        {/* ====================================================
            QUICK ACTIONS
        ==================================================== */}

        <View style={styles.block}>
          <SectionHeader title="Quick Actions" subtitle="Manage your business" />

          <View style={styles.quickCard}>
            <View style={styles.quickGrid}>
              {QUICK_ACTIONS.map(action => (
                <QuickAction key={action.label} {...action} />
              ))}
            </View>
          </View>
        </View>


        {/* ====================================================
            ENQUIRIES
        ==================================================== */}

        <View style={styles.block}>
          <SectionHeader
            title="Recent Enquiries"
            subtitle="Retailer enquiry overview"
            action="View All"
            onAction={() => navigation.navigate('Enquiries')}
          />

          {/* Summary chips */}
          <View style={styles.enquirySummary}>
            {[
              { label: 'Total',  value: enquiries.length,  color: NAV,       bg: '#EDEAFF' },
              { label: 'New',    value: enquiryNew,         color: '#2563EB', bg: '#EFF6FF' },
              { label: 'Active', value: enquiryActive,      color: '#D97706', bg: '#FFF7ED' },
              { label: 'Done',   value: enquiryConfirmed,   color: '#059669', bg: '#ECFDF5' },
            ].map(item => (
              <TouchableOpacity
                key={item.label}
                style={[styles.enquirySummaryItem, { backgroundColor: item.bg }]}
                onPress={() => navigation.navigate('Enquiries')}
                activeOpacity={0.8}
              >
                <Text style={[styles.enquirySummaryValue, { color: item.color }]}>
                  {item.value}
                </Text>
                <Text style={[styles.enquirySummaryLabel, { color: item.color }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* List */}
          <View style={styles.listCard}>
            {recentEnquiries.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Icon name="message-text-outline" size={28} color={NAV} />
                </View>
                <Text style={styles.emptyTitle}>No enquiries yet</Text>
                <Text style={styles.emptySubtitle}>
                  New retailer enquiries will appear here.
                </Text>
              </View>
            ) : (
              recentEnquiries.map(item => (
                <EnqCard
                  key={item._id || item.id}
                  item={item}
                  onPress={() =>
                    navigation.navigate('EnquiryDetail', {
                      enquiryId: item._id || item.id,
                    })
                  }
                />
              ))
            )}

            {enquiries.length > 4 ? (
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation.navigate('Enquiries')}
              >
                <Text style={styles.seeAllText}>
                  See all {enquiries.length} enquiries
                </Text>
                <Icon name="arrow-right" size={14} color={NAV} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>


        {/* ====================================================
            ALERTS
        ==================================================== */}

        {(lowStock > 0 || outOfStock > 0 || paymentDue > 0) ? (
          <View style={styles.block}>
            <SectionHeader title="Alerts" subtitle="Requires your attention" />

            {lowStock > 0 ? (
              <AlertRow
                icon="alert-circle-outline"
                iconColor="#D97706"
                bg="#FFFBEB"
                accent="#F59E0B"
                title={`Low Stock — ${lowStock} product${lowStock > 1 ? 's' : ''}`}
                sub="Tap to view and restock"
                onPress={() => navigation.navigate('Inventory')}
              />
            ) : null}

            {outOfStock > 0 ? (
              <AlertRow
                icon="close-circle-outline"
                iconColor="#DC2626"
                bg="#FEF2F2"
                accent="#F87171"
                title={`Out of Stock — ${outOfStock} product${outOfStock > 1 ? 's' : ''}`}
                sub="Immediate restocking needed"
                onPress={() => navigation.navigate('Inventory')}
              />
            ) : null}

            {paymentDue > 0 ? (
              <AlertRow
                icon="cash-clock"
                iconColor="#7C3AED"
                bg="#F5F3FF"
                accent="#8B5CF6"
                title={`Payment Due — ${formatCurrency(paymentDue)}`}
                sub="Outstanding receivables"
                onPress={() => navigation.navigate('PaymentReceivable')}
              />
            ) : null}
          </View>
        ) : null}


        <View style={styles.bottomSpace} />

      </ScrollView>
    </View>
  );
}


/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({

  /* Root */
  root:          { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 32 },


  /* ── Header ── */
  header: {
    backgroundColor: NAV,
    paddingTop:        52,
    paddingHorizontal: 20,
    paddingBottom:     76,
    overflow:          'hidden',
  },

  headerCircle1: {
    position:        'absolute',
    width:           220,
    height:          220,
    borderRadius:    110,
    right:           -80,
    top:             -100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerCircle2: {
    position:        'absolute',
    width:           130,
    height:          130,
    borderRadius:    65,
    right:           50,
    top:             20,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerCircle3: {
    position:        'absolute',
    width:           160,
    height:          160,
    borderRadius:    80,
    left:            -80,
    bottom:          -90,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  headerTop: {
    flexDirection: 'row',
    alignItems:   'flex-start',
  },
  headerText: { flex: 1 },

  greeting: {
    fontSize:    12,
    fontWeight:  '500',
    color:       'rgba(255,255,255,0.72)',
    marginBottom: 5,
  },
  companyName: {
    fontSize:     23,
    fontWeight:   '800',
    color:        '#FFFFFF',
    letterSpacing: 0.1,
    marginBottom:  8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  dateText: {
    fontSize: 11,
    color:    'rgba(255,255,255,0.68)',
  },

  notificationBtn: {
    width:           46,
    height:          46,
    borderRadius:    15,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.20)',
    marginLeft:      14,
  },
  notificationDot: {
    position:        'absolute',
    width:           8,
    height:          8,
    borderRadius:    4,
    right:           9,
    top:             8,
    backgroundColor: ORANGE,
    borderWidth:     1.5,
    borderColor:     NAV,
  },

  /* Header summary strip */
  headerSummary: {
    flexDirection:   'row',
    alignItems:      'center',
    marginTop:       26,
    padding:         14,
    borderRadius:    18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.14)',
  },
  headerSummaryItem: {
    flex:          1,
    alignItems:    'center',
  },
  headerSummaryValue: {
    fontSize:   18,
    fontWeight: '800',
    color:      '#FFFFFF',
    marginBottom: 3,
  },
  headerSummaryLabel: {
    fontSize: 9.5,
    color:    'rgba(255,255,255,0.62)',
  },
  headerSummaryDivider: {
    width:           1,
    height:          32,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },


  /* ── KPI Grid ── */
  statGrid: {
    flexDirection:    'row',
    flexWrap:         'wrap',
    gap:              GAP,
    paddingHorizontal: H_PADDING,
    marginTop:        -52,
    zIndex:           5,
  },

  statCard: {
    width:           STAT_W,
    minHeight:       148,
    backgroundColor: WHITE,
    borderRadius:    18,
    padding:         15,
    ...CARD_SHADOW,
  },
  statTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  statIcon: {
    width:          40,
    height:         40,
    borderRadius:   13,
    alignItems:     'center',
    justifyContent: 'center',
  },
  statArrow: {
    width:          26,
    height:         26,
    borderRadius:   9,
    backgroundColor: '#F4F5F8',
    alignItems:     'center',
    justifyContent: 'center',
  },
  statValue: {
    marginTop:     14,
    fontSize:      20,
    fontWeight:    '800',
    color:         TEXT,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize:   11.5,
    fontWeight: '600',
    color:      TEXT_SECONDARY,
    marginTop:  3,
  },
  statSub: {
    flexDirection:  'row',
    alignItems:     'center',
    alignSelf:      'flex-start',
    marginTop:      9,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:   8,
    gap:            4,
  },
  statSubDot: {
    width:        5,
    height:       5,
    borderRadius: 3,
  },
  statSubText: {
    fontSize:   9.5,
    fontWeight: '700',
  },


  /* ── Block ── */
  block: {
    marginTop:        24,
    paddingHorizontal: H_PADDING,
  },


  /* ── Section Header ── */
  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   12,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  sectionAccent: {
    width:           4,
    height:          26,
    borderRadius:    3,
    backgroundColor: NAV,
    marginRight:     9,
  },
  sectionTitle: {
    fontSize:   15,
    fontWeight: '800',
    color:      TEXT,
  },
  sectionSubtitle: {
    fontSize:  9.5,
    color:     TEXT_SECONDARY,
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingVertical: 5,
    paddingLeft:   8,
  },
  viewAllText: {
    fontSize:   11,
    fontWeight: '700',
    color:      NAV,
  },


  /* ── Quick Actions ── */
  quickCard: {
    backgroundColor: WHITE,
    borderRadius:    20,
    paddingVertical: 18,
    paddingHorizontal: 8,
    ...CARD_SHADOW,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
  },
  quickAction: {
    width:          '25%',
    minHeight:      90,
    alignItems:     'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  quickIcon: {
    width:          54,
    height:         54,
    borderRadius:   17,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   8,
  },
  quickLabel: {
    fontSize:   10,
    lineHeight: 13.5,
    fontWeight: '700',
    color:      TEXT,
    textAlign:  'center',
    maxWidth:   70,
  },


  /* ── Enquiry Summary ── */
  enquirySummary: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  12,
  },
  enquirySummaryItem: {
    flex:           1,
    minHeight:      70,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  enquirySummaryValue: {
    fontSize:   19,
    fontWeight: '800',
  },
  enquirySummaryLabel: {
    fontSize:   9.5,
    fontWeight: '600',
    marginTop:  3,
    opacity:    0.85,
  },


  /* ── List card ── */
  listCard: {
    backgroundColor: WHITE,
    borderRadius:    18,
    overflow:        'hidden',
    ...CARD_SHADOW,
  },


  /* ── Enquiry Card ── */
  enquiryCard: {
    minHeight:      84,
    flexDirection:  'row',
    alignItems:     'stretch',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  enquiryStatusLine: { width: 4 },
  enquiryBody: {
    flex:             1,
    paddingVertical:  12,
    paddingHorizontal: 13,
  },
  enquiryTop: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   5,
  },
  enquiryCode: {
    fontSize:      9.5,
    fontWeight:    '700',
    color:         '#9CA3AF',
    letterSpacing: 0.3,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    paddingHorizontal: 7,
    paddingVertical:   3,
    borderRadius:  7,
  },
  statusDot: {
    width:        5,
    height:       5,
    borderRadius: 3,
  },
  statusText: {
    fontSize:   9,
    fontWeight: '700',
  },
  customerName: {
    fontSize:     13,
    fontWeight:   '700',
    color:        TEXT,
    marginBottom: 5,
  },
  enquiryMeta: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  metaText: {
    fontSize: 10,
    color:    TEXT_SECONDARY,
    flexShrink: 1,
  },
  metaDot: {
    width:        3,
    height:       3,
    borderRadius: 2,
    backgroundColor: '#C5C8D0',
  },
  enquiryArrow: {
    width:          34,
    alignItems:     'center',
    justifyContent: 'center',
  },


  /* ── See All ── */
  seeAllBtn: {
    minHeight:      44,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            5,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  seeAllText: {
    fontSize:   11,
    fontWeight: '700',
    color:      NAV,
  },


  /* ── Empty State ── */
  emptyState: {
    minHeight:       180,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width:          58,
    height:         58,
    borderRadius:   18,
    backgroundColor: '#EDEAFF',
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   12,
  },
  emptyTitle: {
    fontSize:     14,
    fontWeight:   '800',
    color:        TEXT,
    marginBottom: 5,
  },
  emptySubtitle: {
    fontSize:   11,
    color:      TEXT_SECONDARY,
    textAlign:  'center',
    lineHeight: 16,
  },


  /* ── Alerts ── */
  alertRow: {
    minHeight:       68,
    flexDirection:   'row',
    alignItems:      'center',
    borderLeftWidth: 4,
    borderRadius:    14,
    marginBottom:    9,
    paddingHorizontal: 12,
    ...CARD_SHADOW,
  },
  alertIcon: {
    width:          38,
    height:         38,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    11,
  },
  alertContent: { flex: 1 },
  alertTitle: {
    fontSize:     12,
    fontWeight:   '800',
    color:        TEXT,
    marginBottom: 3,
  },
  alertSub: {
    fontSize: 10,
    color:    TEXT_SECONDARY,
  },
  alertArrow: {
    width:      28,
    alignItems: 'center',
  },


  /* Bottom */
  bottomSpace: { height: 20 },
});
