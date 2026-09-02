// src/screens/settings/MoreMenuScreen.jsx
import React from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '../../components/Icon';
import { theme } from '../../utils/theme';

const MENU_SECTIONS = [
  {
    title: 'Sales',
    items: [
      { label: 'Sales Entry',       icon: 'pencil-plus-outline',   color: '#059669', screen: 'SalesEntry' },
      { label: 'Sales List',        icon: 'format-list-bulleted',  color: theme.colors.primary, screen: 'SalesList' },
      { label: 'Sales Report',      icon: 'chart-bar',             color: '#2563EB', screen: 'SalesReport' },
    ],
  },
  {
    title: 'Payments & Finance',
    items: [
      { label: 'Payment Receivable', icon: 'cash-plus',            color: '#059669', screen: 'PaymentReceivable' },
      { label: 'Payment Payable',    icon: 'cash-minus',           color: '#DC2626', screen: 'PaymentPayable' },
      { label: 'Customer Ledger',    icon: 'book-account-outline', color: '#0891B2', screen: 'CustomerLedger', params: { customerId: '' } },
      { label: 'Expenses',           icon: 'receipt-text-outline', color: '#DC2626', screen: 'ExpenseList' },
      { label: 'Expense Report',     icon: 'chart-line',           color: '#7C3AED', screen: 'ExpenseReport' },
      { label: 'Profit & Loss',      icon: 'trending-up',          color: '#059669', screen: 'PLDashboard' },
    ],
  },
  {
    title: 'Dispatch & Customers',
    items: [
      { label: 'Dispatch Tracking',  icon: 'truck-delivery-outline', color: '#0891B2', screen: 'DispatchTracking' },
      { label: 'Customers',          icon: 'account-group-outline',  color: '#7C3AED', screen: 'CustomerList' },
      { label: 'Follow-ups',         icon: 'calendar-check-outline', color: '#D97706', screen: 'CustomerHistory' },
    ],
  },
  {
    title: 'Reports & Analytics',
    items: [
      { label: 'Report Center',      icon: 'file-chart-outline',     color: '#2563EB', screen: 'ReportCenter' },
      { label: 'Analytics',          icon: 'chart-arc',              color: '#7C3AED', screen: 'AnalyticsDashboard' },
      { label: 'Notifications',      icon: 'bell-outline',           color: theme.colors.accent, screen: 'NotificationList' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'My Profile',         icon: 'account-circle-outline', color: theme.colors.primary, screen: 'Profile' },
      { label: 'Subscription Plan',  icon: 'star-circle-outline',    color: '#D97706', screen: 'SubscriptionPlan' },
    ],
  },
];

function MenuRow({ icon, label, color, onPress, isLast }) {
  return (
    <TouchableOpacity
      style={[s.row, !isLast && s.rowBorder]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <View style={[s.iconBox, { backgroundColor: color + '18' }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <Text style={s.label}>{label}</Text>
      <Icon name="chevron-right" size={16} color={theme.colors.textDisabled} />
    </TouchableOpacity>
  );
}

export default function MoreMenuScreen({ navigation }) {
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Simple header */}
      <View style={s.header}>
        <View style={s.hCircle} />
        <Text style={s.heading}>More</Text>
        <Text style={s.headingSub}>All features & shortcuts</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {MENU_SECTIONS.map(section => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <View style={s.card}>
              {section.items.map((item, i) => (
                <MenuRow
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  color={item.color}
                  isLast={i === section.items.length - 1}
                  onPress={() => navigation.navigate(item.screen, item.params || {})}
                />
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const SHADOW = {
  shadowColor: '#1A0F40',
  shadowOpacity: 0.07,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 6,
  elevation: 3,
};

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F2F4F8' },

  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 14,
    paddingBottom: 20, paddingHorizontal: 20,
    overflow: 'hidden',
  },
  hCircle: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heading:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  headingSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  scroll: { padding: 14, paddingTop: 16 },

  section:      { marginBottom: 14 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 6, paddingLeft: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14, overflow: 'hidden',
    ...SHADOW,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 14, fontWeight: '500', color: theme.colors.textPrimary },
});
