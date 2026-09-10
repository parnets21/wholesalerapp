// src/screens/staff/AddStaffScreen.jsx
//
// Add or edit a staff member. The chosen role is stored as `designation`;
// the backend maps designation → access role on staff login.
//
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import FormField from '../../components/FormField';
import Icon from '../../components/Icon';
import { employeeService, STAFF_ROLES } from '../../services/employeeService';
import { theme } from '../../utils/theme';

export default function AddStaffScreen({ route, navigation }) {
  const editing = route?.params?.staff || null;
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name:   editing?.name   || '',
    mobile: editing?.mobile || '',
    email:  editing?.email  || '',
    role:   STAFF_ROLES.find(r => (editing?.designation || '').toLowerCase().includes(r.key.toLowerCase()))?.key || 'Sales Executive',
  });

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };

  const handleSave = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    const mob = form.mobile.replace(/\D/g, '');
    if (mob.length !== 10) e.mobile = 'Enter a valid 10-digit mobile';
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      name:        form.name.trim(),
      mobile:      mob,
      email:       form.email.trim(),
      designation: form.role,   // backend derives access role from this
    };

    setSaving(true);
    try {
      if (editing) {
        await employeeService.update(editing._id, payload);
        Alert.alert('Success', 'Staff updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await employeeService.create(payload);
        Alert.alert('Success', 'Staff added. They can now log in via the staff app with their mobile.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert('Failed', err?.message || 'Could not save staff.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{editing ? 'Edit Staff' : 'Add Staff'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <FormField label="Full Name *" value={form.name} onChangeText={v => set('name', v)} placeholder="Staff member name" error={errors.name} />
          <FormField label="Mobile *" value={form.mobile} onChangeText={v => set('mobile', v.replace(/[^0-9]/g, ''))} keyboardType="phone-pad" placeholder="10-digit mobile" error={errors.mobile} maxLength={10} />
          <FormField label="Email (optional)" value={form.email} onChangeText={v => set('email', v)} keyboardType="email-address" placeholder="name@example.com" />
        </View>

        <Text style={styles.roleTitle}>Role & Access</Text>
        <View style={styles.card}>
          {STAFF_ROLES.map(r => {
            const active = form.role === r.key;
            return (
              <TouchableOpacity key={r.key} style={[styles.roleRow, active && styles.roleRowActive]} onPress={() => set('role', r.key)} activeOpacity={0.85}>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <Icon name="check" size={13} color="#fff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleLabel, active && { color: theme.colors.accent }]}>{r.label}</Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : (editing ? 'Save Changes' : 'Add Staff')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  container: { padding: 16, backgroundColor: theme.colors.background, paddingBottom: 60 },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 14 },
  roleTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },

  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  roleRowActive: {},
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  roleLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
  roleDesc: { fontSize: 11.5, color: theme.colors.textSecondary, marginTop: 1 },

  saveBtn: { backgroundColor: theme.colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
