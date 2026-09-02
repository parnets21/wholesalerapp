// src/screens/customer/CustomerHistoryScreen.jsx
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';
import SummaryCard from '../../components/SummaryCard';
import { customerService } from '../../services/customerService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { theme } from '../../utils/theme';

const TYPE_ICONS = { order: '📦', enquiry: '💬', payment: '💳' };

export default function CustomerHistoryScreen({ route }) {
  const { customerId } = route.params;
  const [history,  setHistory]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    customerService.history(customerId)
      .then(res => setHistory(res?.data ?? res))
      .catch(e => setError(e?.message))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} />;

  const timeline = history?.timeline || [];
  const summary  = history?.summary  || {};

  return (
    <FlatList
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <>
          <View style={styles.summaryRow}>
            <SummaryCard title="Total Orders" value={summary.totalOrders || 0} color={theme.colors.primary} />
            <View style={{ width: 8 }} />
            <SummaryCard title="Purchase Value" value={formatCurrency(summary.totalPurchaseValue || 0)} color={theme.colors.secondary} />
          </View>
          <SummaryCard title="Outstanding" value={formatCurrency(summary.outstanding || 0)} color={theme.colors.danger} />
          <Text style={styles.sectionTitle}>Activity Timeline</Text>
        </>
      }
      data={timeline}
      keyExtractor={(_, i) => String(i)}
      renderItem={({ item }) => (
        <View style={styles.timelineItem}>
          <View style={styles.timelineDot}><Text>{TYPE_ICONS[item.type] || '📄'}</Text></View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>{item.description || item.type}</Text>
            <View style={styles.row}>
              {item.amount ? <Text style={styles.amount}>{formatCurrency(item.amount)}</Text> : null}
              <Text style={styles.date}>{formatDate(item.date)}</Text>
            </View>
          </View>
        </View>
      )}
      ListEmptyComponent={<EmptyState icon="📋" title="No history found" />}
    />
  );
}

const styles = StyleSheet.create({
  container:       { padding: 16, paddingBottom: 40 },
  summaryRow:      { flexDirection: 'row', marginBottom: 0 },
  sectionTitle:    { fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  timelineItem:    { flexDirection: 'row', marginBottom: 12 },
  timelineDot:     { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', marginRight: 10, elevation: 1 },
  timelineContent: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 8, padding: 10, elevation: 1 },
  timelineTitle:   { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 },
  row:             { flexDirection: 'row', justifyContent: 'space-between' },
  amount:          { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  date:            { fontSize: 12, color: theme.colors.textDisabled },
});
