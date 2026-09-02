// src/screens/auth/TermsOfServiceScreen.jsx
//
// Full Terms of Service page.
// Reuses existing app design system — same header style as other auth screens.
//
import React from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../utils/theme';

const LOGO = require('../../assets/logo.png');

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body:
      'By accessing or using the EzyEnquiry Wholesaler application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.',
  },
  {
    title: '2. Use of the App',
    body:
      'The App is intended for registered wholesale business owners and their authorised staff. You agree to:\n\n• Provide accurate and complete registration information.\n• Keep your login credentials confidential.\n• Not use the App for any unlawful or unauthorised purpose.\n• Not attempt to reverse-engineer, copy, or distribute any part of the App.',
  },
  {
    title: '3. Account Registration & Approval',
    body:
      'New accounts are subject to admin approval before access is granted. EzyEnquiry reserves the right to approve, reject, or revoke accounts at its sole discretion. You will be notified of the approval decision via the App and/or push notification.',
  },
  {
    title: '4. Data & Privacy',
    body:
      'Your use of the App is also governed by our Privacy Policy. By using the App you consent to the collection and use of information as described in our Privacy Policy.',
  },
  {
    title: '5. Intellectual Property',
    body:
      'All content, trademarks, logos, and software in the App are the property of EzyEnquiry or its licensors. You may not reproduce or redistribute any part of the App without prior written consent.',
  },
  {
    title: '6. Limitation of Liability',
    body:
      'To the maximum extent permitted by law, EzyEnquiry shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of or inability to use the App.',
  },
  {
    title: '7. Modifications',
    body:
      'EzyEnquiry may update these Terms at any time. Continued use of the App after changes are posted constitutes your acceptance of the revised Terms.',
  },
  {
    title: '8. Governing Law',
    body:
      'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.',
  },
  {
    title: '9. Contact',
    body:
      'For questions regarding these Terms, please contact us at:\nsupport@ezyenquiry.com',
  },
];

export default function TermsOfServiceScreen({ navigation }) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.circleDecor} />

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.logoBox}>
          <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
        </View>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <Text style={styles.headerSub}>Last updated: January 2025</Text>
      </View>

      {/* Content card */}
      <View style={styles.card}>
        <Text style={styles.intro}>
          Please read these Terms of Service carefully before using the EzyEnquiry
          Wholesaler App. These terms outline your rights and responsibilities as a user.
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.closeBtnText}>← Back to Welcome</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    paddingBottom: 40,
  },

  header: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 44,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  circleDecor: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: theme.colors.primaryMid, opacity: 0.5,
  },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    zIndex: 10,
  },
  backBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  logoBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 8, elevation: 6,
  },
  logoImage:   { width: 52, height: 52 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.72)' },

  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16, marginTop: -18,
    borderRadius: 20, padding: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },

  intro: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 21,
    marginBottom: 20,
    fontStyle: 'italic',
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 21,
  },

  closeBtn: {
    marginTop: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 4,
  },
  closeBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
