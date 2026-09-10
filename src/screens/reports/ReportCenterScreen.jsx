// src/screens/reports/ReportCenterScreen.jsx
// Report Center — links to each report + PDF/Excel export.
import React from 'react';
import { Alert, Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../../components/Icon';
import { reportExportUrl } from '../../services/reportsService';
import { theme } from '../../utils/theme';

const NAVY = theme.colors.primary;

// Reports that have an in-app screen to open, and/or an export type.
const REPORTS = [
  { key: 'sales',      label: 'Sales Report',     icon: 'currency-inr',           color: '#059669', bg: '#ECFDF5', screen: 'SalesReport',   exportType: 'sales' },
  { key: 'purchases',  label: 'Purchase Report',  icon: 'cart-arrow-down',        color: '#DC2626', bg: '#FEF2F2', screen: 'PurchaseList',  exportType: 'purchases' },
  { key: 'expenses',   label: 'Expense Report',   icon: 'receipt-text-outline',   color: '#EA580C', bg: '#FFF7ED', screen: 'ExpenseReport', exportType: 'expenses' },
  { key: 'profit',     label: 'Profit & Loss',    icon: 'chart-line',             color: '#059669', bg: '#ECFDF5', screen: 'PLDashboard' },
  { key: 'analytics',  label: 'Business Analytics',icon: 'chart-box-outline',     color: '#2563EB', bg: '#EFF6FF', screen: 'AnalyticsDashboard' },
  { key: 'customers',  label: 'Customer Report',  icon: 'account-group-outline',  color: '#7C3AED', bg: '#F5F3FF', exportType: 'customers' },
  { key: 'suppliers',  label: 'Supplier Report',  icon: 'domain',                 color: '#0891B2', bg: '#ECFEFF', exportType: 'suppliers' },
  { key: 'inventory',  label: 'Inventory Report', icon: 'warehouse',              color: '#CA8A04', bg: '#FEFCE8', screen: 'Inventory', exportType: 'inventory' },
];

export default function ReportCenterScreen({ navigation }) {
  const doExport = async (type, format) => {
    try {
      const url = await reportExportUrl(type, { format });
      const ok = await Linking.canOpenURL(url);
      if (ok) Linking.openURL(url);
      else Alert.alert('Export', 'Could not open the download link.');
    } catch (e) {
      Alert.alert('Export failed', e?.message || 'Could not export report.');
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Report Center</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={styles.hint}>Open a report or export it as PDF / Excel.</Text>
        {REPORTS.map(r => (
          <View key={r.key} style={styles.card}>
            <TouchableOpacity
              style={styles.cardMain}
              activeOpacity={r.screen ? 0.75 : 1}
              onPress={() => r.screen ? navigation.navigate(r.screen) : null}
            >
              <View style={[styles.iconWrap, { backgroundColor: r.bg }]}>
                <Icon name={r.icon} size={20} color={r.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{r.label}</Text>
                {r.screen ? <Text style={styles.cardSub}>Tap to view</Text> : <Text style={styles.cardSub}>Export only</Text>}
              </View>
              {r.screen ? <Icon name="chevron-right" size={18} color="#C7CCD6" /> : null}
            </TouchableOpacity>

            {r.exportType ? (
              <View style={styles.exportRow}>
                <TouchableOpacity style={[styles.expBtn, { borderColor: '#DC2626' }]} onPress={() => doExport(r.exportType, 'pdf')}>
                  <Icon name="file-pdf-box" size={15} color="#DC2626" />
                  <Text style={[styles.expText, { color: '#DC2626' }]}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.expBtn, { borderColor: '#059669' }]} onPress={() => doExport(r.exportType, 'excel')}>
                  <Icon name="file-excel-box" size={15} color="#059669" />
                  <Text style={[styles.expText, { color: '#059669' }]}>Excel</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: { backgroundColor: NAVY, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  hint: { fontSize: 12.5, color: theme.colors.textSecondary, marginBottom: 12 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  cardMain: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 14.5, fontWeight: '700', color: theme.colors.textPrimary },
  cardSub: { fontSize: 11.5, color: theme.colors.textSecondary, marginTop: 2 },
  exportRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 2 },
  expBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  expText: { fontSize: 12.5, fontWeight: '700' },
});
