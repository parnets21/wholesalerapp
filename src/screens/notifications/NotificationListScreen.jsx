// src/screens/notifications/NotificationListScreen.jsx
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import useNotifications from '../../hooks/useNotifications';
import { formatDate } from '../../utils/formatters';
import { theme } from '../../utils/theme';

const TYPE_ICONS = { 'New Enquiry':'💬', 'New Order':'📦', 'Payment Due':'💳', 'Stock Low':'⚠️', 'Dispatch Update':'🚛' };
const NAV_MAP    = { 'New Enquiry':'EnquiryDetail', 'New Order':'OrderDetail', 'Dispatch Update':'DispatchTracking', 'Payment Due':'PaymentReceivable', 'Stock Low':'LowStockAlert' };

export default function NotificationListScreen({ navigation }) {
  const { notifications, loading, markRead } = useNotifications();

  const handlePress = async (item) => {
    await markRead(item._id);
    const screen = NAV_MAP[item.type];
    if (screen && item.reference_id) {
      const paramKey = item.reference_type === 'Enquiry' ? 'enquiryId' : item.reference_type === 'Order' ? 'orderId' : null;
      navigation.navigate(screen, paramKey ? { [paramKey]: item.reference_id } : {});
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.card, !item.is_read && styles.unread]} onPress={() => handlePress(item)} activeOpacity={0.75}>
      <Text style={styles.icon}>{TYPE_ICONS[item.type] || '🔔'}</Text>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.time}>{formatDate(item.created_at)}</Text>
      </View>
      {!item.is_read && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <FlatList
      data={notifications}
      keyExtractor={(_, i) => String(i)}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      style={{ backgroundColor: theme.colors.background }}
      ListEmptyComponent={<EmptyState icon="🔔" title="No notifications" subtitle="You're all caught up!" />}
    />
  );
}

const styles = StyleSheet.create({
  list:    { padding: 12 },
  card:    { backgroundColor: theme.colors.surface, borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', elevation: 1 },
  unread:  { backgroundColor: '#EEF5FF', borderLeftWidth: 3, borderLeftColor: theme.colors.primary },
  icon:    { fontSize: 24, marginRight: 12, marginTop: 2 },
  content: { flex: 1 },
  title:   { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 2 },
  message: { fontSize: 13, color: theme.colors.textSecondary },
  time:    { fontSize: 11, color: theme.colors.textDisabled, marginTop: 4 },
  dot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginTop: 4 },
});
