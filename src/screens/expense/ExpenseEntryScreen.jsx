// src/screens/expense/ExpenseEntryScreen.jsx
// All 12 expense categories, payment modes, date, vendor, reference fields

import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import FormField    from '../../components/FormField';
import PrimaryButton from '../../components/PrimaryButton';
import Icon         from '../../components/Icon';
import { expenseService } from '../../services/expenseService';
import { EXPENSE_CATEGORIES } from './ExpenseListScreen';
import { theme }             from '../../utils/theme';

const PAY_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Online'];

function SectionHead({ title }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function ExpenseEntryScreen({ navigation }) {
  const [category, setCategory] = useState('Transport');
  const [payMode,  setPayMode]  = useState('Cash');
  const [form,     setForm]     = useState({
    amount: '', description: '', expense_date: '',
    reference: '', vendor: '',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: null }));
  };

  const handleSave = async () => {
    const amt = parseFloat(form.amount);
    const errs = {};
    if (!amt || amt <= 0) errs.amount = 'Amount must be greater than zero';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await expenseService.create({
        category,
        amount:       amt,
        description:  form.description  || '',
        expense_date: form.expense_date ? new Date(form.expense_date).toISOString() : new Date().toISOString(),
        payment_mode: payMode,
        reference:    form.reference    || '',
      });
      Alert.alert('Success', 'Expense recorded successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCat = EXPENSE_CATEGORIES.find(c => c.key === category) || EXPENSE_CATEGORIES[0];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* ── Category ─────────────────────────────────────────────────── */}
        <SectionHead title="Expense Category" />
        <View style={styles.card}>
          <View style={styles.catGrid}>
            {EXPENSE_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catBtn, category === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]}
                onPress={() => setCategory(cat.key)}
                activeOpacity={0.8}
              >
                <Icon name={cat.icon} size={16}
                  color={category === cat.key ? '#fff' : cat.color} />
                <Text style={[styles.catBtnText,
                  category === cat.key && { color: '#fff' }
                ]} numberOfLines={1}>
                  {cat.key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Selected category display */}
          <View style={[styles.selectedCat, { backgroundColor: selectedCat.bg }]}>
            <Icon name={selectedCat.icon} size={18} color={selectedCat.color} />
            <Text style={[styles.selectedCatText, { color: selectedCat.color }]}>
              {selectedCat.key} selected
            </Text>
          </View>
        </View>

        {/* ── Amount & Date ────────────────────────────────────────────── */}
        <SectionHead title="Amount & Date" />
        <View style={styles.card}>
          <FormField
            label="Amount (₹) *"
            value={form.amount}
            onChangeText={v => set('amount', v)}
            keyboardType="decimal-pad"
            error={errors.amount}
            placeholder="0.00"
          />
          <FormField
            label="Expense Date"
            value={form.expense_date}
            onChangeText={v => set('expense_date', v)}
            placeholder="YYYY-MM-DD (leave blank for today)"
          />
        </View>

        {/* ── Payment Mode ─────────────────────────────────────────────── */}
        <SectionHead title="Payment Mode" />
        <View style={styles.card}>
          <View style={styles.pills}>
            {PAY_MODES.map(m => (
              <TouchableOpacity key={m}
                style={[styles.pill, payMode === m && styles.pillActive]}
                onPress={() => setPayMode(m)}>
                <Text style={[styles.pillText, payMode === m && styles.pillTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Description & Reference ──────────────────────────────────── */}
        <SectionHead title="Details" />
        <View style={styles.card}>
          <FormField
            label="Description"
            value={form.description}
            onChangeText={v => set('description', v)}
            multiline
            placeholder="What is this expense for?"
          />
          <FormField
            label="Reference / Invoice #"
            value={form.reference}
            onChangeText={v => set('reference', v)}
            placeholder="Optional reference number"
          />
        </View>

        <PrimaryButton title={loading ? 'Saving…' : '💸  Save Expense'}
          onPress={handleSave} loading={loading} style={styles.saveBtn} />
        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8, gap: 8 },
  sectionBar:  { width: 4, height: 18, borderRadius: 2, backgroundColor: theme.colors.primary },
  sectionTitle:{ fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary },

  card: {
    backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: theme.colors.border, gap: 4,
  },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
    borderWidth: 1.5, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface, minWidth: 80,
  },
  catBtnText: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary },
  selectedCat: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 10, marginTop: 4,
  },
  selectedCatText: { fontSize: 13, fontWeight: '700' },

  pills:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: theme.colors.border },
  pillActive:    { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  pillText:      { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600' },
  pillTextActive:{ color: '#fff', fontWeight: '700' },

  saveBtn: { marginTop: 20 },
});
