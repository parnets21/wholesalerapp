// src/screens/auth/WelcomeScreen.jsx
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../utils/theme';

const LOGO = require('../../assets/logo.png');

const FEATURES = [
  { icon: '📦', label: 'Inventory' },
  { icon: '🧾', label: 'Orders' },
  { icon: '💰', label: 'Finance' },
];

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      {/* Decorative glow blobs — pointerEvents none so they never block button taps */}
      <View pointerEvents="none" style={styles.blobTop} />
      <View pointerEvents="none" style={styles.blobBottom} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 1. Logo badge ── */}
        <View style={styles.logoOuter}>
          <View style={styles.logoWrap}>
            <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
          </View>
        </View>

        {/* ── 2. App name + tagline ── */}
        <Text style={styles.appName}>
          Ezy<Text style={styles.appNameAccent}>Enquiry</Text>
        </Text>
        <View style={styles.taglinePill}>
          <Text style={styles.tagline}>WHOLESALER BUSINESS PLATFORM</Text>
        </View>

        {/* ── 3. Feature chips ── */}
        <View style={styles.features}>
          {FEATURES.map(f => (
            <View key={f.label} style={styles.featureChip}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* ── 4. White card ── */}
        <View style={styles.card}>
          <View style={styles.accentBar} />

          <Text style={styles.cardLabel}>GET STARTED</Text>

          {/* Login — solid orange (brand) */}
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Login to Your Account</Text>
          </TouchableOpacity>

          {/* Create Account — navy outline */}
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => navigation.navigate('Registration')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnSecondaryText}>Create New Account</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing you agree to our{' '}
            <Text
              style={styles.termsLink}
              onPress={() => navigation.navigate('TermsOfService')}
            >
              Terms of Service
            </Text>
            {' & '}
            <Text
              style={styles.termsLink}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const ORANGE = theme.colors.accent;   // #FD5C02
const NAVY   = theme.colors.primary;  // #01152D

const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: '#0A1F3A',   // softer navy (less harsh than pure #01152D)
    overflow: 'hidden',
  },

  /* Decorative soft glows — gentle, low-opacity so they don't glare */
  blobTop: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(253,92,2,0.12)',
  },
  blobBottom: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(46,86,140,0.28)',   // soft blue-navy glow
  },

  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 44,
    paddingHorizontal: 24,
  },

  /* Logo */
  logoOuter: {
    width: 108,
    height: 108,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(253,92,2,0.35)',
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  logoImg: {
    width: 60,
    height: 60,
  },

  /* App name */
  appName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 10,
    textAlign: 'center',
  },
  appNameAccent: {
    color: ORANGE,
  },
  taglinePill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 22,
  },
  tagline: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.5,
    textAlign: 'center',
  },

  /* Feature chips */
  features: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  featureChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 84,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  featureIcon: {
    fontSize: 22,
    marginBottom: 5,
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.80)',
  },

  /* White card — smaller, refined */
  card: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(1,21,45,0.06)',
    elevation: 10,
    shadowColor: '#01152D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: ORANGE,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: ORANGE,
    textAlign: 'center',
    marginBottom: 14,
  },

  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#14243B',            // soft navy, not harsh black
    textAlign: 'left',
    marginBottom: 8,
  },
  sub: {
    fontSize: 13.5,
    color: '#5B6B7F',            // warm muted slate
    textAlign: 'left',
    lineHeight: 21,
    marginBottom: 24,
  },

  /* Login — solid orange */
  btnPrimary: {
    backgroundColor: ORANGE,
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    elevation: 4,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  btnPrimaryText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* Create Account — soft orange-tinted outline */
  btnSecondary: {
    backgroundColor: '#FFF7F2',   // faint warm orange tint fill
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(253,92,2,0.55)',
    width: '100%',
    marginBottom: 14,
  },
  btnSecondaryText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: theme.colors.accentDark,   // #D94B00 — readable orange
    letterSpacing: 0.3,
  },

  terms: {
    textAlign: 'center',
    fontSize: 10.5,
    color: theme.colors.textDisabled,
    lineHeight: 16,
  },
  termsLink: {
    color: ORANGE,
    fontWeight: '700',
  },

  bottomSpace: {
    height: 30,
  },
});
