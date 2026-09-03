// src/screens/invoice/InvoiceDetailScreen.jsx
//
// Full invoice detail — EazyEnquiry branded. Shows company/owner, item list,
// complete price breakup, and a Download (PDF) button.
//
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import { invoiceService } from '../../services/invoiceService';
import { generateAndShareInvoice } from '../../utils/invoicePdf';
import { theme } from '../../utils/theme';

const logo = require('../../assets/logo.png');

const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const PAY_META = {
  Paid:             { bg: '#DCFCE7', fg: '#047857' },
  'Partially Paid': { bg: '#FEF3C7', fg: '#B45309' },
  Unpaid:           { bg: '#FEE2E2', fg: '#DC2626' },
  Overdue:          { bg: '#FEE2E2', fg: '#DC2626' },
  Cancelled:        { bg: '#F1F5F9', fg: '#64748B' },
};

export default function InvoiceDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { invoiceId, invoice: passed } = route.params || {};
  const [invoice, setInvoice] = useState(passed || null);
  const [loading, setLoading] = useState(!passed);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Always fetch the full invoice (includes company block) for the detail view.
    let active = true;
    (async () => {
      try {
        const res = await invoiceService.get(invoiceId || passed?._id);
        const data = res?.data || res;
        if (active && data) setInvoice(data);
      } catch {
        // keep passed data if fetch fails
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [invoiceId, passed]);

  const onDownload = async () => {
    if (!invoice) return;
    setDownloading(true);
    try {
      await generateAndShareInvoice(invoice);
    } catch (e) {
      Alert.alert('Download failed', e?.message || 'Could not generate the invoice PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !invoice) {
    return (
      <View style={styles.screen}>
        <Header navigation={navigation} />
        <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.accent} /></View>
      </View>
    );
  }
  if (!invoice) {
    return (
      <View style={styles.screen}>
        <Header navigation={navigation} />
        <View style={styles.center}><Text style={styles.muted}>Invoice not found.</Text></View>
      </View>
    );
  }

  const c = invoice.company || {};
  const meta = PAY_META[invoice.payment_status] || PAY_META.Unpaid;
  const items = invoice.items || [];

  return (
    <View style={styles.screen}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 120 + insets.bottom }}>
        {/* Branded invoice sheet */}
        <View style={styles.sheet}>
          {/* Brand header */}
          <View style={styles.brandRow}>
            <View style={styles.brandLeft}>
              <Image source={logo} style={styles.logo} resizeMode="contain" />
              <View>
                <Text style={styles.brandName}>Eazy<Text style={{ color: theme.colors.accent }}>Enquiry</Text></Text>
                <Text style={styles.brandTag}>Wholesale & Trade Platform</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.invWord}>INVOICE</Text>
              <Text style={styles.invNo}>{invoice.invoice_no}</Text>
              <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                <Text style={[styles.badgeText, { color: meta.fg }]}>{invoice.payment_status}</Text>
              </View>
            </View>
          </View>

          <View style={styles.rule} />

          {/* Billed to + details */}
          <View style={styles.metaRow}>
            <View style={styles.metaBox}>
              <Text style={styles.metaHead}>BILLED TO</Text>
              <Text style={styles.metaStrong}>{c.name || invoice.customer_name || '—'}</Text>
              {c.owner_name ? <Text style={styles.metaLine}>{c.owner_name}</Text> : null}
              {c.address ? <Text style={styles.metaLine}>{c.address}</Text> : null}
              {c.mobile ? <Text style={styles.metaLine}>📞 {c.mobile}</Text> : null}
              {c.gst_number ? <Text style={styles.metaLine}>GSTIN: {c.gst_number}</Text> : null}
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaHead}>DETAILS</Text>
              {invoice.order_no ? <Text style={styles.metaLine}>Order: <Text style={styles.b}>{invoice.order_no}</Text></Text> : null}
              <Text style={styles.metaLine}>Date: <Text style={styles.b}>{fmtDate(invoice.invoice_date)}</Text></Text>
              <Text style={styles.metaLine}>Status: <Text style={styles.b}>{invoice.payment_status}</Text></Text>
            </View>
          </View>

          {/* Items table */}
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 2.4 }]}>ITEM</Text>
            <Text style={[styles.th, styles.tRight, { flex: 0.8 }]}>QTY</Text>
            <Text style={[styles.th, styles.tRight, { flex: 1 }]}>RATE</Text>
            <Text style={[styles.th, styles.tRight, { flex: 1.1 }]}>AMOUNT</Text>
          </View>
          {items.length === 0 ? (
            <Text style={styles.noItems}>No items</Text>
          ) : items.map((it, i) => (
            <View key={i} style={styles.tr}>
              <View style={{ flex: 2.4 }}>
                <Text style={styles.itName} numberOfLines={2}>{it.product_name || 'Item'}</Text>
                {it.product_code ? <Text style={styles.itSub}>{it.product_code}</Text> : null}
                {(it.size || it.finish || it.color) ? (
                  <Text style={styles.itSub}>{[it.size, it.finish, it.color].filter(Boolean).join(' · ')}</Text>
                ) : null}
              </View>
              <Text style={[styles.td, styles.tRight, { flex: 0.8 }]}>{it.qty} {it.unit || ''}</Text>
              <Text style={[styles.td, styles.tRight, { flex: 1 }]}>{money(it.rate)}</Text>
              <Text style={[styles.td, styles.tRight, { flex: 1.1, fontWeight: '700' }]}>{money(it.total)}</Text>
            </View>
          ))}

          {/* Totals */}
          <View style={styles.totalsWrap}>
            <View style={styles.totals}>
              <Row label="Subtotal" value={money(invoice.subtotal)} />
              <Row label="GST" value={money(invoice.gst_amount)} />
              {invoice.discount_amount ? <Row label="Discount" value={`- ${money(invoice.discount_amount)}`} /> : null}
              <View style={styles.grandRow}>
                <Text style={styles.grandLabel}>Grand Total</Text>
                <Text style={styles.grandVal}>{money(invoice.grand_total)}</Text>
              </View>
              <Row label="Paid" value={money(invoice.paid_amount)} />
              <Row label="Balance Due" value={money(invoice.balance_due)} strong danger={invoice.balance_due > 0} />
            </View>
          </View>

          {invoice.remarks ? <Text style={styles.remarks}>Note: {invoice.remarks}</Text> : null}

          <Text style={styles.footNote}>Computer-generated invoice from EazyEnquiry. Thank you for your business.</Text>
        </View>
      </ScrollView>

      {/* Download bar */}
      <View style={[styles.downloadBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={[styles.dlBtn, downloading && styles.dlBtnOff]} onPress={onDownload} disabled={downloading} activeOpacity={0.9}>
          {downloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="download" size={20} color="#fff" />
          )}
          <Text style={styles.dlBtnText}>{downloading ? 'Preparing…' : 'Download Invoice'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Header({ navigation }) {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
        <View style={{ width: 24 }} />
      </View>
    </>
  );
}

function Row({ label, value, strong, danger }) {
  return (
    <View style={styles.sumRow}>
      <Text style={[styles.sumLabel, strong && styles.sumLabelStrong]}>{label}</Text>
      <Text style={[styles.sumVal, strong && styles.sumValStrong, danger && { color: '#DC2626' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: theme.colors.textSecondary },

  sheet: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme.colors.border },

  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  logo: { width: 42, height: 42, borderRadius: 10 },
  brandName: { fontSize: 18, fontWeight: '900', color: theme.colors.textPrimary },
  brandTag: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 1 },
  invWord: { fontSize: 20, fontWeight: '900', letterSpacing: 2, color: theme.colors.textPrimary },
  invNo: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, marginTop: 6 },
  badgeText: { fontSize: 10, fontWeight: '800' },

  rule: { height: 3, backgroundColor: theme.colors.accent, borderRadius: 2, marginVertical: 14 },

  metaRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  metaBox: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12 },
  metaHead: { fontSize: 10, letterSpacing: 1, color: theme.colors.textSecondary, fontWeight: '800', marginBottom: 6 },
  metaStrong: { fontSize: 13.5, fontWeight: '800', color: theme.colors.textPrimary },
  metaLine: { fontSize: 12, color: theme.colors.textPrimary, marginTop: 2 },
  b: { fontWeight: '700' },

  tableHead: { flexDirection: 'row', backgroundColor: theme.colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 8 },
  th: { color: '#fff', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4 },
  tRight: { textAlign: 'right' },
  tr: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border, alignItems: 'flex-start' },
  itName: { fontSize: 12.5, fontWeight: '600', color: theme.colors.textPrimary },
  itSub: { fontSize: 10.5, color: theme.colors.textSecondary, marginTop: 1 },
  td: { fontSize: 12.5, color: theme.colors.textPrimary },
  noItems: { textAlign: 'center', color: theme.colors.textSecondary, padding: 16, fontSize: 12 },

  totalsWrap: { alignItems: 'flex-end', marginTop: 14 },
  totals: { width: '72%' },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  sumLabel: { fontSize: 12.5, color: theme.colors.textSecondary },
  sumLabelStrong: { fontWeight: '800', color: theme.colors.textPrimary },
  sumVal: { fontSize: 12.5, fontWeight: '700', color: theme.colors.textPrimary },
  sumValStrong: { fontSize: 14, fontWeight: '900' },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 2, borderTopColor: theme.colors.primary, marginTop: 6, paddingTop: 8 },
  grandLabel: { fontSize: 14, fontWeight: '900', color: theme.colors.textPrimary },
  grandVal: { fontSize: 17, fontWeight: '900', color: theme.colors.accent },

  remarks: { fontSize: 11.5, color: theme.colors.textSecondary, marginTop: 16, fontStyle: 'italic' },
  footNote: { fontSize: 10.5, color: theme.colors.textDisabled, textAlign: 'center', marginTop: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border },

  downloadBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 14, paddingTop: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  dlBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: theme.colors.accent, borderRadius: 14, paddingVertical: 15,
  },
  dlBtnOff: { opacity: 0.7 },
  dlBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
