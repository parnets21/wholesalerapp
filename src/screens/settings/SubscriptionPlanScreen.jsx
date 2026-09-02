// src/screens/settings/SubscriptionPlanScreen.jsx
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import useAuth from '../../hooks/useAuth';
import { theme } from '../../utils/theme';

const PLANS = [
  { name: 'Free',     color: '#757575', price: '₹0',      features: ['5 Products', '10 Enquiries/month', 'Basic Dashboard'] },
  { name: 'Silver',   color: '#9E9E9E', price: '₹999/mo', features: ['100 Products', 'Unlimited Enquiries', 'Sales Reports', 'FCM Notifications'] },
  { name: 'Gold',     color: '#FBBC04', price: '₹1,999/mo',features: ['Unlimited Products', 'All Reports', 'PDF Export', 'Staff Management', 'Customer Ledger'] },
  { name: 'Platinum', color: '#1A73E8', price: '₹3,999/mo',features: ['Everything in Gold', 'Analytics Dashboard', 'Priority Support', 'Multi-Warehouse'] },
];

export default function SubscriptionPlanScreen() {
  const { user } = useAuth();
  const currentPlan = user?.subscription_plan || 'Free';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={styles.heading}>Subscription Plans</Text>
      <View style={styles.currentBox}>
        <Text style={styles.currentLabel}>Current Plan</Text>
        <Text style={styles.currentPlan}>{currentPlan}</Text>
      </View>
      {PLANS.map(plan => {
        const isCurrent = plan.name === currentPlan;
        return (
          <View key={plan.name} style={[styles.planCard, { borderColor: plan.color }, isCurrent && styles.activePlan]}>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </View>
            {plan.features.map(f => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
            {!isCurrent && (
              <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: plan.color }]}>
                <Text style={styles.upgradeBtnText}>Upgrade to {plan.name}</Text>
              </TouchableOpacity>
            )}
            {isCurrent && <Text style={styles.activeBadge}>✓ Current Plan</Text>}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: theme.colors.background },
  heading:      { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 12 },
  currentBox:   { backgroundColor: theme.colors.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  currentLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  currentPlan:  { color: '#fff', fontSize: 22, fontWeight: '800' },
  planCard:     { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1.5, padding: 16, marginBottom: 12, elevation: 1 },
  activePlan:   { borderWidth: 2, elevation: 4 },
  planHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  planName:     { fontSize: 18, fontWeight: '800' },
  planPrice:    { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
  featureRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  checkmark:    { color: theme.colors.secondary, fontWeight: '700', marginRight: 8 },
  featureText:  { fontSize: 13, color: theme.colors.textSecondary },
  upgradeBtn:   { marginTop: 12, paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  upgradeBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  activeBadge:  { marginTop: 12, fontSize: 13, fontWeight: '700', color: theme.colors.secondary, textAlign: 'center' },
});
