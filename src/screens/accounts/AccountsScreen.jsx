// src/screens/accounts/AccountsScreen.jsx
// Unified Accounts module — Receivables, Payables, Transactions, Cash Book, Bank Book

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, FlatList, Modal, RefreshControl, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import Icon           from '../../components/Icon';
import EmptyState     from '../../components/EmptyState';
import ErrorMessage   from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { accountsService }           from '../../services/accountsService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { theme }                     from '../../utils/theme';

// ── Design tokens ─────────────────────────────────────────────────────────────
const PRIMARY = theme.colors.primary;   // #2D1B69
const ORANGE  = theme.colors.accent;    // #FF6B35
const BG      = '#F0F2F8';
const WHITE   = '#FFFFFF';
const TEXT    = '#171A2B';
const MUTED   = '#6B7280';
const BORDER  = '#E8EAF0';
const SHADOW  = { shadowColor: '#111827', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 };

// ── Status configs ────────────────────────────────────────────────────────────
const RCV_STATUS = {
  Pending:  { bg: '#FFF7ED', color: '#D97706' },
  Partial:  { bg: '#EFF6FF', color: '#2563EB' },
  Received: { bg: '#ECFDF5', color: '#059669' },
  Overdue:  { bg: '#FEF2F2', color: '#DC2626' },
};
const PAY_STATUS = {
  Pending: { bg: '#FFF7ED', color: '#D97706' },
  Partial: { bg: '#EFF6FF', color: '#2563EB' },
  Paid:    { bg: '#ECFDF5', color: '#059669' },
};
const TXN_TYPE = {
  Received: { bg: '#ECFDF5', color: '#059669', icon: 'arrow-down-circle-outline' },
  Paid:     { bg: '#FEF2F2', color: '#DC2626', icon: 'arrow-up-circle-outline' },
};

const MAIN_TABS = [
  { key: 'receivables',  label: 'Receivables',  icon: 'arrow-down-circle-outline' },
  { key: 'payables',     label: 'Payables',     icon: 'arrow-up-circle-outline' },
  { key: 'transactions', label: 'Transactions', icon: 'swap-horizontal-circle-outline' },
  { key: 'cashbook',     label: 'Cash Book',    icon: 'cash-outline' },
  { key: 'bankbook',     label: 'Bank Book',    icon: 'bank-outline' },
];

const PAY_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'NEFT', 'RTGS'];

// ─────────────────────────────────────────────────────────────────────────────
// COLLECT PAYMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function CollectModal({ visible, item, type, onClose, onDone }) {
  const [amount,  setAmount]  = useState('');
  const [mode,    setMode]    = useState('Cash');
  const [ref,     setRef]     = useState('');
  const [notes,   setNotes]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && item) {
      setAmount(String(item.outstanding || ''));
      setMode('Cash'); setRef(''); setNotes('');
    }
  }, [visible, item]);

  const handle = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('', 'Enter a valid amount'); return; }
    if (amt > (item?.outstanding || 0)) { Alert.alert('', `Max collectable: ${formatCurrency(item.outstanding)}`); return; }
    setLoading(true);
    try {
      if (type === 'receivable') {
        await accountsService.collectReceivable(item._id, { amount: amt, mode, reference: ref, notes });
        Alert.alert('Collected!', `₹${amt.toLocaleString('en-IN')} received from ${item.customer_name}.`);
      } else {
        await accountsService.payPayable(item._id, { amount: amt, mode, reference: ref, notes });
        Alert.alert('Paid!', `₹${amt.toLocaleString('en-IN')} paid to ${item.supplier_name || item.party_name}.`);
      }
      onDone?.();
      onClose();
    } catch (e) { Alert.alert('Error', e?.message || 'Transaction failed'); }
    finally { setLoading(false); }
  };

  if (!visible || !item) return null;
  const partyName = item.customer_name || item.supplier_name || item.party_name || '—';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={mStyles.overlay}>
        <View style={mStyles.sheet}>
          {/* Handle */}
          <View style={mStyles.handle} />

          <Text style={mStyles.title}>
            {type === 'receivable' ? 'Collect Payment' : 'Record Payment'}
          </Text>
          <Text style={mStyles.party}>{partyName}</Text>

          {/* Outstanding */}
          <View style={mStyles.outstandingRow}>
            <Text style={mStyles.outstandingLabel}>Outstanding</Text>
            <Text style={mStyles.outstandingAmt}>{formatCurrency(item.outstanding || 0)}</Text>
          </View>

          {/* Amount input */}
          <Text style={mStyles.fieldLabel}>Amount (₹) *</Text>
          <View style={mStyles.amtInput}>
            <Icon name="currency-inr" size={18} color={PRIMARY} style={{ marginLeft: 12 }} />
            <TextInput
              style={mStyles.amtText}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={MUTED}
            />
          </View>

          {/* Mode */}
          <Text style={mStyles.fieldLabel}>Payment Mode</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
            {PAY_MODES.map(m => (
              <TouchableOpacity key={m}
                style={[mStyles.modePill, mode === m && mStyles.modePillActive]}
                onPress={() => setMode(m)}>
                <Text style={[mStyles.modeText, mode === m && mStyles.modeTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Reference */}
          <Text style={mStyles.fieldLabel}>Reference / UTR (optional)</Text>
          <View style={mStyles.refInput}>
            <TextInput
              style={mStyles.refText}
              value={ref}
              onChangeText={setRef}
              placeholder="Cheque No / UTR / Transaction ID"
              placeholderTextColor={MUTED}
            />
          </View>

          {/* Buttons */}
          <View style={mStyles.btns}>
            <TouchableOpacity style={mStyles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={mStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[mStyles.confirmBtn, loading && { opacity: 0.7 }]}
              onPress={handle}
              disabled={loading}
            >
              <Icon name="check" size={18} color={WHITE} />
              <Text style={mStyles.confirmText}>
                {loading ? 'Processing…' : type === 'receivable' ? 'Collect' : 'Pay'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: TEXT, marginBottom: 4 },
  party: { fontSize: 14, color: MUTED, fontWeight: '600', marginBottom: 14 },
  outstandingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginBottom: 16 },
  outstandingLabel: { fontSize: 12, color: '#DC2626', fontWeight: '700' },
  outstandingAmt: { fontSize: 18, fontWeight: '900', color: '#DC2626' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: MUTED, textTransform: 'uppercase', marginBottom: 6 },
  amtInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F5F8', borderRadius: 12, height: 52, marginBottom: 16 },
  amtText: { flex: 1, fontSize: 18, fontWeight: '700', color: TEXT, paddingHorizontal: 10 },
  modePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#F4F5F8' },
  modePillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  modeText: { fontSize: 12, fontWeight: '700', color: MUTED },
  modeTextActive: { color: WHITE },
  refInput: { backgroundColor: '#F4F5F8', borderRadius: 12, paddingHorizontal: 14, height: 44, justifyContent: 'center', marginBottom: 20 },
  refText: { fontSize: 14, color: TEXT },
  btns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: BORDER, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: MUTED },
  confirmBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 14 },
  confirmText: { fontSize: 14, fontWeight: '700', color: WHITE },
});

// ─────────────────────────────────────────────────────────────────────────────
// RECEIVABLES TAB
// ─────────────────────────────────────────────────────────────────────────────
function ReceivablesTab({ onCollect }) {
  const [items,      setItems]     = useState([]);
  const [summary,    setSummary]   = useState({ total: 0, outstanding: 0, received: 0, count: 0 });
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing]= useState(false);
  const [error,      setError]     = useState(null);
  const [filter,     setFilter]    = useState('All');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (filter !== 'All') params.status = filter;
      const res  = await accountsService.receivables(params);
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : data?.receivables ?? [];
      setItems(list);
      setSummary({
        total:       list.reduce((s, i) => s + (i.invoice_amount || 0), 0),
        outstanding: list.reduce((s, i) => s + (i.outstanding   || 0), 0),
        received:    list.reduce((s, i) => s + (i.received       || 0), 0),
        count:       list.length,
      });
    } catch (e) { setError(e?.message || 'Failed'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { load(); }, [filter]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const renderItem = ({ item }) => {
    const st = RCV_STATUS[item.status] || RCV_STATUS.Pending;
    const pct = item.invoice_amount > 0
      ? Math.min(100, Math.round((item.received / item.invoice_amount) * 100))
      : 0;
    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: st.color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={styles.cardLeft}>
              <Text style={styles.partyName} numberOfLines={1}>{item.customer_name || '—'}</Text>
              {item.rcv_code && <Text style={styles.refCode}>{item.rcv_code}</Text>}
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.outstandingAmt}>{formatCurrency(item.outstanding || 0)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: st.color }]} />
                <Text style={[styles.statusText, { color: st.color }]}>{item.status || 'Pending'}</Text>
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressWrap}>
            <View style={styles.progressBg}>
              <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: pct >= 100 ? '#059669' : PRIMARY }]} />
            </View>
            <Text style={styles.progressText}>{pct}% collected</Text>
          </View>

          <View style={styles.cardMeta}>
            <View style={styles.metaChip}>
              <Icon name="receipt-text-outline" size={11} color={MUTED} />
              <Text style={styles.metaText}>Inv: {formatCurrency(item.invoice_amount || 0)}</Text>
            </View>
            <View style={styles.metaChip}>
              <Icon name="check-circle-outline" size={11} color="#059669" />
              <Text style={styles.metaText}>Rcvd: {formatCurrency(item.received || 0)}</Text>
            </View>
            {item.due_date && (
              <View style={styles.metaChip}>
                <Icon name="calendar-clock" size={11} color={MUTED} />
                <Text style={styles.metaText}>Due: {formatDate(item.due_date)}</Text>
              </View>
            )}
          </View>

          {item.status !== 'Received' && (
            <TouchableOpacity
              style={styles.collectBtn}
              onPress={() => onCollect(item, 'receivable')}
              activeOpacity={0.8}
            >
              <Icon name="cash-plus" size={15} color={WHITE} />
              <Text style={styles.collectBtnText}>Collect Payment</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Summary strip */}
      <View style={styles.summaryStrip}>
        <SummaryPill label="Total Invoice" value={formatCurrency(summary.total)} color="#374151" />
        <SummaryPill label="Outstanding" value={formatCurrency(summary.outstanding)} color="#DC2626" highlight />
        <SummaryPill label="Collected" value={formatCurrency(summary.received)} color="#059669" />
      </View>

      {/* Filter tabs */}
      <FilterRow tabs={['All', 'Pending', 'Partial', 'Received', 'Overdue']} active={filter} onChange={setFilter} />

      {loading && !items.length ? <LoadingSpinner /> :
       error ? <ErrorMessage message={error} onRetry={load} /> : (
        <FlatList
          data={items}
          keyExtractor={i => i._id || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
          ListEmptyComponent={<EmptyState icon="✅" title="No receivables" subtitle="Receivables appear after orders are delivered" />}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYABLES TAB
// ─────────────────────────────────────────────────────────────────────────────
function PayablesTab({ onCollect }) {
  const [items,      setItems]     = useState([]);
  const [summary,    setSummary]   = useState({ total: 0, outstanding: 0, paid: 0 });
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing]= useState(false);
  const [error,      setError]     = useState(null);
  const [filter,     setFilter]    = useState('All');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (filter !== 'All') params.status = filter;
      const res  = await accountsService.payables(params);
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : data?.payables ?? [];
      setItems(list);
      setSummary({
        total:       list.reduce((s, i) => s + (i.invoice_amount || 0), 0),
        outstanding: list.reduce((s, i) => s + (i.outstanding   || 0), 0),
        paid:        list.reduce((s, i) => s + (i.paid           || 0), 0),
      });
    } catch (e) { setError(e?.message || 'Failed'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { load(); }, [filter]);

  const renderItem = ({ item }) => {
    const st = PAY_STATUS[item.status] || PAY_STATUS.Pending;
    const pct = item.invoice_amount > 0
      ? Math.min(100, Math.round(((item.paid || 0) / item.invoice_amount) * 100))
      : 0;

    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: st.color }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={styles.cardLeft}>
              <Text style={styles.partyName} numberOfLines={1}>{item.supplier_name || item.party_name || '—'}</Text>
              {item.payable_code && <Text style={styles.refCode}>{item.payable_code}</Text>}
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.outstandingAmt, { color: '#DC2626' }]}>{formatCurrency(item.outstanding || 0)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: st.color }]} />
                <Text style={[styles.statusText, { color: st.color }]}>{item.status || 'Pending'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.progressWrap}>
            <View style={styles.progressBg}>
              <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: pct >= 100 ? '#059669' : ORANGE }]} />
            </View>
            <Text style={styles.progressText}>{pct}% paid</Text>
          </View>

          <View style={styles.cardMeta}>
            <View style={styles.metaChip}>
              <Icon name="receipt-text-outline" size={11} color={MUTED} />
              <Text style={styles.metaText}>Total: {formatCurrency(item.invoice_amount || 0)}</Text>
            </View>
            <View style={styles.metaChip}>
              <Icon name="check-circle-outline" size={11} color="#059669" />
              <Text style={styles.metaText}>Paid: {formatCurrency(item.paid || 0)}</Text>
            </View>
          </View>

          {item.status !== 'Paid' && (
            <TouchableOpacity
              style={[styles.collectBtn, { backgroundColor: '#DC2626' }]}
              onPress={() => onCollect(item, 'payable')}
              activeOpacity={0.8}
            >
              <Icon name="cash-minus" size={15} color={WHITE} />
              <Text style={styles.collectBtnText}>Record Payment</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.summaryStrip}>
        <SummaryPill label="Total Payable" value={formatCurrency(summary.total)} color="#374151" />
        <SummaryPill label="Outstanding" value={formatCurrency(summary.outstanding)} color="#DC2626" highlight />
        <SummaryPill label="Paid" value={formatCurrency(summary.paid)} color="#059669" />
      </View>
      <FilterRow tabs={['All', 'Pending', 'Partial', 'Paid']} active={filter} onChange={setFilter} />
      {loading && !items.length ? <LoadingSpinner /> :
       error ? <ErrorMessage message={error} onRetry={() => load()} /> : (
        <FlatList
          data={items}
          keyExtractor={i => i._id || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="✅" title="No payables" subtitle="Supplier payables appear here after purchases" />}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTIONS TAB
// ─────────────────────────────────────────────────────────────────────────────
function TransactionsTab() {
  const [items,      setItems]     = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing]= useState(false);
  const [error,      setError]     = useState(null);
  const [filter,     setFilter]    = useState('All');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (filter !== 'All') params.type = filter;
      const res  = await accountsService.transactions(params);
      const data = res?.data ?? res;
      setItems(Array.isArray(data) ? data : data?.transactions ?? []);
    } catch (e) { setError(e?.message || 'Failed'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { load(); }, [filter]);

  const totalIn  = items.filter(i => i.type === 'Received').reduce((s, i) => s + (i.amount || 0), 0);
  const totalOut = items.filter(i => i.type === 'Paid').reduce((s,     i) => s + (i.amount || 0), 0);

  const renderItem = ({ item }) => {
    const cfg = TXN_TYPE[item.type] || TXN_TYPE.Received;
    return (
      <View style={styles.txnRow}>
        <View style={[styles.txnIcon, { backgroundColor: cfg.bg }]}>
          <Icon name={cfg.icon} size={20} color={cfg.color} />
        </View>
        <View style={styles.txnInfo}>
          <Text style={styles.txnParty} numberOfLines={1}>{item.party_name || '—'}</Text>
          <View style={styles.txnMeta}>
            <Text style={styles.txnDate}>{formatDate(item.txn_date)}</Text>
            {item.mode && <Text style={styles.txnMode}>{item.mode}</Text>}
            {item.txn_code && <Text style={styles.txnCode}>{item.txn_code}</Text>}
          </View>
          {item.reference && (
            <Text style={styles.txnRef} numberOfLines={1}>Ref: {item.reference}</Text>
          )}
        </View>
        <Text style={[styles.txnAmount, { color: cfg.color }]}>
          {item.type === 'Received' ? '+' : '−'}
          {formatCurrency(item.amount || 0)}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* In / Out summary */}
      <View style={styles.summaryStrip}>
        <SummaryPill label="Money In" value={formatCurrency(totalIn)} color="#059669" />
        <SummaryPill label="Money Out" value={formatCurrency(totalOut)} color="#DC2626" />
        <SummaryPill label="Net" value={formatCurrency(totalIn - totalOut)} color={totalIn >= totalOut ? '#059669' : '#DC2626'} />
      </View>
      <FilterRow tabs={['All', 'Received', 'Paid']} active={filter} onChange={setFilter} />
      {loading && !items.length ? <LoadingSpinner /> :
       error ? <ErrorMessage message={error} onRetry={load} /> : (
        <FlatList
          data={items}
          keyExtractor={i => i._id || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} colors={[PRIMARY]} />}
          ListEmptyComponent={<EmptyState icon="💳" title="No transactions" subtitle="Payment transactions appear here" />}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOK TABS (Cash Book / Bank Book)
// ─────────────────────────────────────────────────────────────────────────────
function BookTab({ type }) {
  const [entries,    setEntries]   = useState([]);
  const [totals,     setTotals]    = useState({ in: 0, out: 0, closing: 0 });
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing]= useState(false);
  const [error,      setError]     = useState(null);
  const [from,       setFrom]      = useState('');
  const [to,         setTo]        = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (from) params.from_date = from;
      if (to)   params.to_date   = to;
      const fn  = type === 'cash' ? accountsService.cashBook : accountsService.bankBook;
      const res = await fn(params);
      const data = res?.data ?? res;
      setEntries(data?.entries || []);
      setTotals({ in: data?.totalIn || 0, out: data?.totalOut || 0, closing: data?.closingBalance || 0 });
    } catch (e) { setError(e?.message || 'Failed'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [type, from, to]);

  useEffect(() => { load(); }, [type]);

  const ENTRY_CFG = {
    Receipt: { color: '#059669', bg: '#ECFDF5', icon: 'arrow-down-circle-outline' },
    Credit:  { color: '#059669', bg: '#ECFDF5', icon: 'bank-plus' },
    Payment: { color: '#DC2626', bg: '#FEF2F2', icon: 'arrow-up-circle-outline' },
    Debit:   { color: '#DC2626', bg: '#FEF2F2', icon: 'bank-minus' },
    Expense: { color: '#D97706', bg: '#FFF7ED', icon: 'cash-minus' },
  };

  const renderItem = ({ item }) => {
    const cfg = ENTRY_CFG[item.type] || ENTRY_CFG.Receipt;
    return (
      <View style={styles.bookRow}>
        <View style={[styles.bookIcon, { backgroundColor: cfg.bg }]}>
          <Icon name={cfg.icon} size={16} color={cfg.color} />
        </View>
        <View style={styles.bookInfo}>
          <Text style={styles.bookDesc} numberOfLines={1}>{item.description || '—'}</Text>
          <Text style={styles.bookDate}>{formatDate(item.date)}</Text>
          {item.ref && <Text style={styles.bookRef}>{item.ref}</Text>}
          {item.mode && <Text style={styles.bookMode}>{item.mode}</Text>}
        </View>
        <View style={styles.bookAmounts}>
          {item.debit > 0 ? (
            <Text style={styles.inAmt}>+{formatCurrency(item.debit)}</Text>
          ) : (
            <Text style={styles.outAmt}>−{formatCurrency(item.credit)}</Text>
          )}
          <Text style={[styles.bookBalance, { color: (item.balance || 0) >= 0 ? '#059669' : '#DC2626' }]}>
            {formatCurrency(Math.abs(item.balance || 0))}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Summary */}
      <View style={styles.summaryStrip}>
        <SummaryPill label="Total In" value={formatCurrency(totals.in)} color="#059669" />
        <SummaryPill label="Total Out" value={formatCurrency(totals.out)} color="#DC2626" />
        <SummaryPill label="Closing" value={formatCurrency(Math.abs(totals.closing))} color={totals.closing >= 0 ? '#059669' : '#DC2626'} />
      </View>

      {/* Date filter */}
      <View style={styles.dateFilterRow}>
        <View style={styles.dateInput}>
          <Icon name="calendar-start" size={14} color={MUTED} />
          <TextInput style={styles.dateInputText} placeholder="From YYYY-MM-DD"
            placeholderTextColor={MUTED} value={from} onChangeText={setFrom} />
        </View>
        <View style={styles.dateInput}>
          <Icon name="calendar-end" size={14} color={MUTED} />
          <TextInput style={styles.dateInputText} placeholder="To YYYY-MM-DD"
            placeholderTextColor={MUTED} value={to} onChangeText={setTo} />
        </View>
        <TouchableOpacity style={styles.goBtn} onPress={load}>
          <Text style={styles.goBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Column headers */}
      <View style={styles.bookColHeader}>
        <Text style={styles.bookColText}>Description</Text>
        <Text style={[styles.bookColText, { textAlign: 'right' }]}>Amount / Balance</Text>
      </View>

      {loading && !entries.length ? <LoadingSpinner /> :
       error ? <ErrorMessage message={error} onRetry={load} /> : (
        <FlatList
          data={entries}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} colors={[PRIMARY]} />}
          ListEmptyComponent={<EmptyState icon="📒" title="No entries" subtitle="Transactions appear after recording payments" />}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────
function SummaryPill({ label, value, color, highlight }) {
  return (
    <View style={[styles.summaryPill, highlight && styles.summaryPillHighlight]}>
      <Text style={[styles.summaryPillVal, { color }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.summaryPillLbl}>{label}</Text>
    </View>
  );
}

function FilterRow({ tabs, active, onChange }) {
  return (
    <View style={styles.filterRowWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRowContent}>
        {tabs.map(t => (
          <TouchableOpacity key={t}
            style={[styles.filterPill, active === t && styles.filterPillActive]}
            onPress={() => onChange(t)} activeOpacity={0.8}>
            <Text style={[styles.filterPillText, active === t && styles.filterPillTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function AccountsScreen({ navigation }) {
  const [activeTab,  setActiveTab]  = useState('receivables');
  const [collectItem, setCollectItem] = useState(null);
  const [collectType, setCollectType] = useState('receivable');
  const [refresh,    setRefresh]    = useState(0);

  const openCollect = (item, type) => {
    setCollectItem(item);
    setCollectType(type);
  };
  const closeCollect = () => setCollectItem(null);
  const afterCollect = () => { setRefresh(r => r + 1); };

  const renderTab = () => {
    switch (activeTab) {
      case 'receivables':  return <ReceivablesTab key={`rcv-${refresh}`} onCollect={openCollect} />;
      case 'payables':     return <PayablesTab    key={`pay-${refresh}`} onCollect={openCollect} />;
      case 'transactions': return <TransactionsTab key={`txn-${refresh}`} />;
      case 'cashbook':     return <BookTab key="cash" type="cash" />;
      case 'bankbook':     return <BookTab key="bank" type="bank" />;
      default:             return null;
    }
  };

  return (
    <View style={styles.screen}>
      {/* ── Purple Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={WHITE} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Accounts</Text>
            <Text style={styles.headerSub}>Financial Records</Text>
          </View>
          <TouchableOpacity
            style={styles.ledgerBtn}
            onPress={() => navigation.navigate('CustomerList', { forLedger: true })}
          >
            <Icon name="book-account-outline" size={18} color={WHITE} />
            <Text style={styles.ledgerBtnText}>Ledger</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tab Bar ────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}>
          {MAIN_TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Icon name={tab.icon} size={16}
                color={activeTab === tab.key ? WHITE : MUTED} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Tab Content ────────────────────────────────────────────────── */}
      <View style={{ flex: 1 }}>
        {renderTab()}
      </View>

      {/* ── Collect Payment Modal ───────────────────────────────────────── */}
      <CollectModal
        visible={!!collectItem}
        item={collectItem}
        type={collectType}
        onClose={closeCollect}
        onDone={afterCollect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: { backgroundColor: PRIMARY, paddingBottom: 12, overflow: 'hidden' },
  headerDecor1: { position: 'absolute', top: -40, right: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)' },
  headerDecor2: { position: 'absolute', bottom: 10, left: -50, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: WHITE },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  ledgerBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  ledgerBtnText: { color: WHITE, fontSize: 12, fontWeight: '700' },

  // ── Tab bar ────────────────────────────────────────────────────────────────
  tabBar: { backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER },
  tabBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F2F8' },
  tabActive: { backgroundColor: PRIMARY },
  tabText: { fontSize: 12, fontWeight: '700', color: MUTED },
  tabTextActive: { color: WHITE },

  // ── Summary strip ──────────────────────────────────────────────────────────
  summaryStrip: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER },
  summaryPill: { flex: 1, alignItems: 'center', backgroundColor: '#F8F9FC', borderRadius: 12, padding: 10 },
  summaryPillHighlight: { backgroundColor: '#FEF2F2' },
  summaryPillVal: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  summaryPillLbl: { fontSize: 9, color: MUTED, fontWeight: '600', textTransform: 'uppercase' },

  // ── Filter row ─────────────────────────────────────────────────────────────
  filterRowWrap: { backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER },
  filterRowContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F2F8' },
  filterPillActive: { backgroundColor: PRIMARY },
  filterPillText: { fontSize: 11, fontWeight: '700', color: MUTED },
  filterPillTextActive: { color: WHITE },

  list: { padding: 14, paddingBottom: 30 },

  // ── Receivable / Payable card ──────────────────────────────────────────────
  card: { flexDirection: 'row', alignItems: 'stretch', backgroundColor: WHITE, borderRadius: 16, marginBottom: 10, overflow: 'hidden', ...SHADOW },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, marginRight: 8 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  partyName: { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 2 },
  refCode: { fontSize: 11, color: MUTED, fontWeight: '600' },
  outstandingAmt: { fontSize: 16, fontWeight: '900', color: PRIMARY },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBg: { flex: 1, height: 5, backgroundColor: '#F0F2F8', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 10, color: MUTED, fontWeight: '600', minWidth: 70 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F4F5F8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  metaText: { fontSize: 10, color: MUTED, fontWeight: '600' },
  collectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 10 },
  collectBtnText: { color: WHITE, fontWeight: '700', fontSize: 13 },

  // ── Transaction row ────────────────────────────────────────────────────────
  txnRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, padding: 14, marginBottom: 8, borderRadius: 14, gap: 12, ...SHADOW },
  txnIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1 },
  txnParty: { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 3 },
  txnMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  txnDate: { fontSize: 11, color: MUTED },
  txnMode: { fontSize: 10, color: PRIMARY, fontWeight: '700', backgroundColor: '#EDE8FF', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 },
  txnCode: { fontSize: 10, color: MUTED },
  txnRef: { fontSize: 10, color: MUTED, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '800' },

  // ── Book rows ──────────────────────────────────────────────────────────────
  dateFilterRow: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER },
  dateInput: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F4F5F8', borderRadius: 10, paddingHorizontal: 10, height: 38 },
  dateInputText: { flex: 1, fontSize: 11, color: TEXT },
  goBtn: { paddingHorizontal: 16, height: 38, backgroundColor: PRIMARY, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  goBtnText: { color: WHITE, fontWeight: '700', fontSize: 13 },
  bookColHeader: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#EDE8FF', paddingHorizontal: 16, paddingVertical: 8 },
  bookColText: { fontSize: 10, fontWeight: '700', color: PRIMARY, textTransform: 'uppercase' },
  bookRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER, gap: 10 },
  bookIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bookInfo: { flex: 1 },
  bookDesc: { fontSize: 13, fontWeight: '600', color: TEXT, marginBottom: 2 },
  bookDate: { fontSize: 10, color: MUTED },
  bookRef: { fontSize: 10, color: MUTED },
  bookMode: { fontSize: 10, color: PRIMARY, fontWeight: '700' },
  bookAmounts: { alignItems: 'flex-end', gap: 2 },
  inAmt: { fontSize: 13, fontWeight: '700', color: '#059669' },
  outAmt: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  bookBalance: { fontSize: 10, fontWeight: '700' },
});
