// src/screens/auth/ApprovalWaitingScreen.jsx
//
// Shown when user is logged-in but company status is NOT yet Approved.
//
// Spec requirements:
//  • NO Logout button on this screen
//  • Back navigation MUST work (Android hardware back + optional header back)
//  • "Check Now" polls /approval-status from backend (source of truth)
//  • FCM approval push triggers approvalModal in AuthContext → App.jsx modal
//  • When isApproved becomes true (via FCM or polling), RootNavigator
//    automatically switches to AppStack — no manual navigation needed here
//
import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import useAuth from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { theme } from '../../utils/theme';

const LOGO = require('../../assets/logo.png');

export default function ApprovalWaitingScreen({ navigation }) {
  const { refreshUser, isApproved: authApproved, user } = useAuth();

  const [checking,    setChecking]    = useState(false);
  const [localStatus, setLocalStatus] = useState(
    user?.company_status || 'Pending'
  );
  // Set when admin requests document resubmission (status Pending + a reason).
  const [resubmitReason, setResubmitReason] = useState('');
  // Set when admin suspends the company.
  const [suspendReason, setSuspendReason] = useState('');

  // ── Sync when FCM push triggers isApproved in AuthContext ────────────────
  useEffect(() => {
    if (authApproved) setLocalStatus('Approved');
  }, [authApproved]);

  // ── On mount: fetch latest status so a resubmission request shows up ─────
  useEffect(() => {
    (async () => {
      try {
        const res = await authService.getApprovalStatus();
        const s   = res?.data ?? res;
        if (s?.status) {
          setLocalStatus(s.status);
          setResubmitReason(s.status === 'Pending' ? (s.rejectReason || '') : '');
          setSuspendReason(s.status === 'Suspended' ? (s.suspendReason || '') : '');
        }
      } catch {}
    })();
  }, []);

  // ── Android hardware back — allow going back to Welcome ──────────────────
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigation?.canGoBack?.()) {
        navigation.goBack();
      } else if (navigation?.navigate) {
        navigation.navigate('Welcome');
      }
      return true; // event handled
    });
    return () => handler.remove();
  }, [navigation]);

  // ── Derived booleans ─────────────────────────────────────────────────────
  const isApprovedLocal = localStatus === 'Approved';
  const isRejected      = localStatus === 'Rejected';
  const isSuspended     = localStatus === 'Suspended';
  const isPending       = !isApprovedLocal && !isRejected && !isSuspended;

  // ── Manual "Check Now" — hit backend, do NOT trust only AsyncStorage ─────
  const handleCheckNow = useCallback(async () => {
    setChecking(true);
    try {
      // Use lightweight approval-status endpoint (faster than /me)
      const res       = await authService.getApprovalStatus();
      const statusRes = res?.data ?? res;
      const newStatus = statusRes?.status || 'Pending';

      setLocalStatus(newStatus);
      // Pending + a reject reason = admin asked to re-upload documents.
      setResubmitReason(newStatus === 'Pending' ? (statusRes?.rejectReason || '') : '');
      setSuspendReason(newStatus === 'Suspended' ? (statusRes?.suspendReason || '') : '');

      if (newStatus === 'Approved') {
        // Also refresh the full user in AuthContext so RootNavigator flips
        await refreshUser();
        // The approvalModal is shown by App.jsx via AuthContext.
        // RootNavigator automatically switches to AppStack when isApproved→true.
      }
      // No Alert needed — status pill updates immediately, modal shown if approved
    } catch {
      // Silent fail — status pill retains last known state
    } finally {
      setChecking(false);
    }
  }, [refreshUser]);

  // ── Back button handler (header / in-card) ───────────────────────────────
  const handleBack = useCallback(() => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else if (navigation?.navigate) {
      navigation.navigate('Welcome');
    }
  }, [navigation]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.circleDecorTL} />
        <View style={styles.circleDecorBR} />

        {/* Back button — top-left */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.75}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.logoBox}>
          <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
        </View>
        <Text style={styles.headerTitle}>EzyEnquiry Wholesaler</Text>
        <Text style={styles.headerSub}>Account Verification</Text>
      </View>

      {/* ── Main card ── */}
      <View style={styles.card}>

        {/* Status icon */}
        <View style={[
          styles.iconCircle,
          isRejected      && styles.iconCircleRejected,
          isApprovedLocal && styles.iconCircleApproved,
        ]}>
          <Text style={styles.statusIcon}>
            {isApprovedLocal ? '🎉' : isRejected ? '❌' : isSuspended ? '🚫' : '⏳'}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {isApprovedLocal
            ? 'Account Approved!'
            : isRejected
              ? 'Application Rejected'
              : isSuspended
                ? 'Account Suspended'
                : 'Registration Under Review'}
        </Text>

        {/* Message */}
        <Text style={styles.message}>
          {isApprovedLocal
            ? 'Your company has been approved by admin. Your dashboard is opening now.'
            : isRejected
              ? 'Your application has been rejected. Please contact support for assistance.'
              : isSuspended
                ? `Your account has been suspended by admin.${suspendReason ? `\n\nReason: ${suspendReason}` : ''}\n\nPlease contact support to restore access.`
                : 'Your registration has been submitted successfully.\n\nOur team is reviewing your registration. You will be notified once your account is approved.'}
        </Text>

        {/* Status pill */}
        <View style={[
          styles.statusPill,
          (isRejected || isSuspended) && styles.statusPillRejected,
          isApprovedLocal && styles.statusPillApproved,
        ]}>
          <View style={[
            styles.statusDot,
            (isRejected || isSuspended) && styles.statusDotRejected,
            isApprovedLocal && styles.statusDotApproved,
          ]} />
          <Text style={[
            styles.statusPillText,
            (isRejected || isSuspended) && styles.statusPillTextRejected,
            isApprovedLocal && styles.statusPillTextApproved,
          ]}>
            Status: {
              isApprovedLocal ? 'Approved'
                : isRejected  ? 'Rejected'
                : isSuspended ? 'Suspended'
                              : '● Under Review'
            }
          </Text>
        </View>

        {/* What happens next — only when Pending */}
        {isPending && (
          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>What happens next?</Text>
            {[
              { icon: '📋', text: 'Admin reviews your documents',     done: true },
              { icon: '🔍', text: 'Business verification check',      done: false },
              { icon: '✅', text: 'Account approved by admin',        done: false },
              { icon: '📱', text: 'You get notified in the app',      done: false },
            ].map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepBubble, s.done && styles.stepBubbleDone]}>
                  <Text style={styles.stepIcon}>{s.icon}</Text>
                </View>
                <Text style={[styles.stepText, s.done && styles.stepTextDone]}>
                  {s.text}
                </Text>
                {s.done && <Text style={styles.stepCheck}>✓</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Resubmission requested — admin asked to re-upload documents */}
        {isPending && !!resubmitReason && (
          <View style={styles.resubmitBox}>
            <Text style={styles.resubmitTitle}>Document Resubmission Required</Text>
            <Text style={styles.resubmitMsg}>{resubmitReason}</Text>
            <TouchableOpacity
              style={styles.resubmitBtn}
              onPress={() => navigation.navigate('DocumentUpload', { mobile: user?.mobile, resubmit: true })}
              activeOpacity={0.85}
            >
              <Text style={styles.resubmitBtnText}>📤  Re-upload Documents</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Check Status button — only when Pending */}
        {isPending && (
          <TouchableOpacity
            style={[styles.checkBtn, checking && styles.checkBtnDisabled]}
            onPress={handleCheckNow}
            disabled={checking}
            activeOpacity={0.85}
          >
            <Text style={styles.checkBtnText}>
              {checking ? '⏳  Checking Status…' : '🔄  Check Status'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Approved state — dashboard will open automatically via RootNavigator */}
        {isApprovedLocal && (
          <View style={styles.successBox}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>Registration Approved!</Text>
            <Text style={styles.successMsg}>
              Your account has been approved.{'\n'}
              Your dashboard is opening now…
            </Text>
          </View>
        )}

        {/* Rejected state */}
        {isRejected && (
          <View style={styles.rejectedBox}>
            <Text style={styles.rejectedTitle}>What to do next?</Text>
            <Text style={styles.rejectedMsg}>
              Please contact our support team with your registration details
              to understand the reason and reapply.
            </Text>
          </View>
        )}

        {/* Contact support — shown always */}
        <View style={styles.supportRow}>
          <Text style={styles.supportText}>Need help?{'  '}</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.supportLink}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* ── NO LOGOUT BUTTON on this screen (per spec) ── */}

      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    paddingBottom: 48,
  },

  // Header
  header: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 48,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  circleDecorTL: {
    position: 'absolute', top: -50, left: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  circleDecorBR: {
    position: 'absolute', bottom: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // Back button — top-left inside header
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    zIndex: 10,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  logoBox: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 8,
  },
  logoImage:   { width: 58, height: 58 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  headerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.78)' },

  // Card
  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20, marginTop: -22,
    borderRadius: 22, padding: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.10, shadowRadius: 14, elevation: 6,
  },

  // Status icon circle
  iconCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#FFF8E8',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 18,
    borderWidth: 3, borderColor: theme.colors.warning,
  },
  iconCircleRejected: { backgroundColor: '#FFF0EE', borderColor: theme.colors.danger },
  iconCircleApproved: { backgroundColor: '#F0FDF4', borderColor: '#22C55E' },
  statusIcon: { fontSize: 38 },

  title: {
    fontSize: 22, fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center', marginBottom: 10,
  },
  message: {
    fontSize: 13, color: theme.colors.textSecondary,
    textAlign: 'center', lineHeight: 21, marginBottom: 18,
  },

  // Status pill
  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF8E8',
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20, marginBottom: 20, gap: 6,
  },
  statusPillRejected: { backgroundColor: '#FFF0EE' },
  statusPillApproved: { backgroundColor: '#F0FDF4' },
  statusDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: theme.colors.warning,
  },
  statusDotRejected: { backgroundColor: theme.colors.danger },
  statusDotApproved: { backgroundColor: '#22C55E' },
  statusPillText:         { fontSize: 13, fontWeight: '700', color: theme.colors.orange },
  statusPillTextRejected: { color: theme.colors.danger },
  statusPillTextApproved: { color: '#16A34A' },

  // Steps card
  stepsCard: {
    width: '100%',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 14, padding: 16, marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 14, fontWeight: '700',
    color: theme.colors.textPrimary, marginBottom: 12,
  },
  stepRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  stepBubble:    { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  stepBubbleDone:{ backgroundColor: theme.colors.secondary },
  stepIcon:      { fontSize: 16 },
  stepText:      { flex: 1, fontSize: 13, color: theme.colors.textSecondary },
  stepTextDone:  { color: theme.colors.secondary, fontWeight: '600' },
  stepCheck:     { fontSize: 14, color: theme.colors.secondary, fontWeight: '800' },

  // Check Status button
  checkBtn: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginBottom: 14,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30, shadowRadius: 8, elevation: 4,
  },
  checkBtnDisabled: { opacity: 0.65 },
  checkBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // Resubmission box
  resubmitBox: {
    width: '100%', backgroundColor: '#FFF8E8', borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#FDE68A',
  },
  resubmitTitle: { fontSize: 14, fontWeight: '800', color: '#B45309', marginBottom: 6 },
  resubmitMsg:   { fontSize: 13, color: '#7C5E10', lineHeight: 20, marginBottom: 12 },
  resubmitBtn:   { backgroundColor: theme.colors.accent, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  resubmitBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Approved success box
  successBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: 14, padding: 18,
    alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  successEmoji: { fontSize: 40, marginBottom: 8 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#059669', marginBottom: 6 },
  successMsg:   { fontSize: 13, color: '#065F46', textAlign: 'center', lineHeight: 20 },

  // Rejected box
  rejectedBox: {
    width: '100%',
    backgroundColor: '#FFF0EE',
    borderRadius: 14, padding: 16,
    marginBottom: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  rejectedTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.danger, marginBottom: 6 },
  rejectedMsg:   { fontSize: 13, color: '#7F1D1D', lineHeight: 20 },

  // Support row
  supportRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
  },
  supportText: { fontSize: 13, color: theme.colors.textSecondary },
  supportLink: { fontSize: 13, color: theme.colors.primary, fontWeight: '700' },
});
