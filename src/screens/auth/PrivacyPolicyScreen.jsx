// src/screens/auth/PrivacyPolicyScreen.jsx
//
// Full Privacy Policy page.
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
    title: '1. Information We Collect',
    body:
      'When you register and use the EzyEnquiry Wholesaler App, we collect:\n\n• Business information: company name, owner name, business type, GST/PAN numbers.\n• Contact details: mobile number, email address, business address.\n• KYC documents: GST certificate, PAN card, trade license, registration certificate.\n• Device information: device type, OS version, FCM push token (for notifications).\n• Usage data: screens visited, actions performed, timestamps.',
  },
  {
    title: '2. How We Use Your Information',
    body:
      'We use the information we collect to:\n\n• Verify your identity and business for account approval.\n• Provide and improve the App services.\n• Send important notifications (e.g., approval status, order updates).\n• Comply with legal and regulatory obligations.\n• Detect and prevent fraud or unauthorised access.',
  },
  {
    title: '3. Push Notifications',
    body:
      'The App uses Firebase Cloud Messaging (FCM) to deliver push notifications including account approval status updates, order alerts, and other business notifications. You can disable push notifications through your device settings; however, this may affect timely delivery of important information.',
  },
  {
    title: '4. Data Sharing',
    body:
      'We do not sell your personal information to third parties. We may share data with:\n\n• Service providers: cloud hosting, database, and communication services necessary to operate the App.\n• Legal authorities: where required by law or to protect rights and safety.\n\nAll third-party providers are bound by confidentiality obligations.',
  },
  {
    title: '5. Data Storage & Security',
    body:
      'Your data is stored on secured servers. We implement industry-standard security measures including encrypted transmission (HTTPS/TLS), access controls, and regular security reviews. However, no method of transmission over the internet is 100% secure.',
  },
  {
    title: '6. Data Retention',
    body:
      'We retain your data for as long as your account is active or as needed to provide services. Upon account deletion request, we will delete your personal data within 30 days, subject to legal retention requirements.',
  },
  {
    title: '7. Your Rights',
    body:
      'You have the right to:\n\n• Access the personal data we hold about you.\n• Request correction of inaccurate data.\n• Request deletion of your data (subject to legal obligations).\n• Withdraw consent for processing where applicable.\n\nTo exercise these rights, contact us at support@ezyenquiry.com.',
  },
  {
    title: '8. Cookies & Tracking',
    body:
      'The mobile App does not use browser cookies. We may use analytics tools to understand usage patterns. These tools collect anonymised, aggregated data only.',
  },
  {
    title: '9. Children\'s Privacy',
    body:
      'The App is intended for business use by adults (18+). We do not knowingly collect personal information from individuals under 18.',
  },
  {
    title: '10. Changes to This Policy',
    body:
      'We may update this Privacy Policy from time to time. We will notify you of significant changes through the App. Continued use after changes constitutes acceptance.',
  },
  {
    title: '11. Contact Us',
    body:
      'For privacy-related questions or requests:\n\nEzyEnquiry Support\nEmail: support@ezyenquiry.com',
  },
];

export default function PrivacyPolicyScreen({ navigation }) {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <Text style={styles.headerSub}>Last updated: January 2025</Text>
      </View>

      {/* Content card */}
      <View style={styles.card}>
        <Text style={styles.intro}>
          EzyEnquiry is committed to protecting your privacy. This Privacy Policy
          explains how we collect, use, and safeguard your information when you use
          our Wholesaler App.
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
