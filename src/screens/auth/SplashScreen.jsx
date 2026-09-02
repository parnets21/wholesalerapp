// src/screens/auth/SplashScreen.jsx
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { theme } from '../../utils/theme';
import { getToken, getRegStep } from '../../utils/storage';

const LOGO = require('../../assets/logo.png');

export default function SplashScreen({ navigation }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const textSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Enter animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 750,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(textSlide, {
        toValue: 0,
        duration: 650,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // ── Smart navigation after 3 s ───────────────────────────────────────
    // Decision table:
    //   JWT token present          → RootNavigator handles it (AppStack / PendingStack)
    //                                 so just go to Welcome; RootNavigator will redirect
    //   reg_step = 'docs'          → Registration done, documents not yet uploaded
    //                                 → resume at DocumentUpload
    //   reg_step = 'waiting'       → Docs submitted, waiting for approval
    //                                 → resume at ApprovalWaiting
    //   no step saved              → Fresh install or completed user → Welcome
    const timer = setTimeout(async () => {
      try {
        // If a JWT already exists the user is logged-in; RootNavigator will
        // route them to AppStack/PendingStack automatically — nothing to do here.
        const storedToken = await getToken();
        if (storedToken) {
          navigation.replace('Welcome');
          return;
        }

        // No JWT — check if a registration was started but not finished
        const { step, mobile } = await getRegStep();

        if (step === 'docs') {
          // Registration form submitted, OTP verified, docs not yet uploaded
          navigation.replace('DocumentUpload', { mobile: mobile ?? '' });
          return;
        }

        if (step === 'waiting') {
          // Docs uploaded, waiting for admin approval
          navigation.replace('ApprovalWaiting');
          return;
        }

        // Default — fresh install or no pending registration
        navigation.replace('Welcome');
      } catch (_) {
        // Storage read failed — safe fallback
        navigation.replace('Welcome');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim, textSlide]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.splashBg} />

      {/* Decorative blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />
      <View style={styles.blobCenter} />

      {/* Logo card */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoCard}>
          <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
        </View>
      </Animated.View>

      {/* App name + tagline */}
      <Animated.View
        style={[
          styles.textBlock,
          {
            opacity: fadeAnim,
            transform: [{ translateY: textSlide }],
          },
        ]}
      >
        <Text style={styles.appName}>EzyEnquiry</Text>
        <View style={styles.taglineRow}>
          <View style={styles.taglineDash} />
          <Text style={styles.tagline}>Wholesaler Business Management</Text>
          <View style={styles.taglineDash} />
        </View>
      </Animated.View>

      {/* Bottom powered-by */}
      <Animated.View style={[styles.bottomBadge, { opacity: fadeAnim }]}>
        <View style={styles.accentDot} />
        <Text style={styles.versionText}>v1.0.0</Text>
        <View style={styles.accentDot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.splashBg,   // deep purple — logo color
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Decorative blobs ── */
  blobTopRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: theme.colors.primaryMid,
    opacity: 0.55,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: theme.colors.primaryDark,
    opacity: 0.6,
  },
  blobCenter: {
    position: 'absolute',
    top: '38%',
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.colors.accent,
    opacity: 0.10,
  },

  /* ── Logo ── */
  logoWrapper: {
    marginBottom: 32,
  },
  logoCard: {
    width: 140,
    height: 140,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  logoImage: {
    width: 108,
    height: 108,
  },

  /* ── Text ── */
  textBlock: {
    alignItems: 'center',
    marginTop: 4,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 10,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taglineDash: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.accent,
    opacity: 0.9,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    letterSpacing: 0.4,
  },

  /* ── Bottom badge ── */
  bottomBadge: {
    position: 'absolute',
    bottom: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accentDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
    opacity: 0.8,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
  },
});