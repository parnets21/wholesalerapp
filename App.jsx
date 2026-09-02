/**
 * WholesalerApp — EzyEnquiry Wholesaler Mobile App
 * React Native 0.87.0
 *
 * @react-native-firebase/messaging v26 — modular API only.
 */

import React, { useEffect } from 'react';
import {
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { theme } from './src/utils/theme';

// ── Navigation theme — purple bg so Android nav bar area stays purple ────────
const NAV_THEME = {
  dark: false,
  colors: {
    primary:      theme.colors.primary,
    background:   theme.colors.splashBg,   // ← purple, not white
    card:         theme.colors.surface,
    text:         theme.colors.textPrimary,
    border:       theme.colors.border,
    notification: theme.colors.danger,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium:  { fontFamily: 'System', fontWeight: '500' },
    bold:    { fontFamily: 'System', fontWeight: '700' },
    heavy:   { fontFamily: 'System', fontWeight: '900' },
  },
};

// ── Request notification permission ─────────────────────────────────────────
async function askNotificationPermission() {
  try {
    const msgInstance = getMessaging();
    const status      = await requestPermission(msgInstance);
    const granted =
      status === AuthorizationStatus.AUTHORIZED ||
      status === AuthorizationStatus.PROVISIONAL;
    console.log('[FCM] Permission', granted ? 'granted' : 'denied');
    return granted;
  } catch (err) {
    console.warn('[FCM] requestPermission error:', err.message);
    return false;
  }
}

// ── Approval Success Modal ───────────────────────────────────────────────────
function ApprovalSuccessModal() {
  return (
    <AuthContext.Consumer>
      {({ approvalModal, dismissApprovalModal }) => {
        if (!approvalModal?.visible) return null;

        const name = approvalModal.ownerName
          ? `Congratulations ${approvalModal.ownerName}!`
          : 'Congratulations!';

        return (
          <Modal
            transparent
            animationType="fade"
            visible={approvalModal.visible}
            onRequestClose={dismissApprovalModal}
            statusBarTranslucent
          >
            <View style={modalStyles.overlay}>
              <View style={modalStyles.card}>
                <View style={modalStyles.iconCircle}>
                  <Text style={modalStyles.iconText}>✓</Text>
                </View>
                <Text style={modalStyles.title}>
                  Registration Approved{'\n'}Successfully
                </Text>
                <Text style={modalStyles.name}>{name}</Text>
                <Text style={modalStyles.body}>
                  Your registration has been approved successfully.{'\n'}
                  You can now access your dashboard.
                </Text>
                <TouchableOpacity
                  style={modalStyles.okBtn}
                  onPress={dismissApprovalModal}
                  activeOpacity={0.85}
                >
                  <Text style={modalStyles.okBtnText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        );
      }}
    </AuthContext.Consumer>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────
function App() {
  useEffect(() => {
    const msgInstance = getMessaging();

    // 1. Request notification permission
    askNotificationPermission();

    // 2. Foreground messages — approval type handled by AuthContext; show Alert for others
    const unsubForeground = onMessage(msgInstance, async remoteMessage => {
      const data = remoteMessage?.data ?? {};
      if (data.type === 'approval') return; // AuthContext handles approval pushes

      const title = remoteMessage?.notification?.title || 'EzyEnquiry';
      const body  = remoteMessage?.notification?.body  || '';
      if (title || body) {
        const { Alert } = require('react-native');
        Alert.alert(title, body);
      }
    });

    // 3. Background tap — auth state refresh handled in AuthContext
    const unsubBackground = onNotificationOpenedApp(msgInstance, remoteMessage => {
      console.log('[FCM] Background tap:', JSON.stringify(remoteMessage?.data ?? {}));
    });

    // 4. Quit state tap
    getInitialNotification(msgInstance).then(remoteMessage => {
      if (remoteMessage) {
        console.log('[FCM] Quit-state tap:', JSON.stringify(remoteMessage?.data ?? {}));
      }
    });

    return () => {
      unsubForeground();
      unsubBackground();
    };
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer theme={NAV_THEME}>
            <StatusBar
              barStyle="light-content"
              backgroundColor={theme.colors.splashBg}
              translucent={false}
            />
            <RootNavigator />
            <ApprovalSuccessModal />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default App;

// ── Modal Styles ─────────────────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F0FDF4',
    borderWidth: 3,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 36,
    color: '#16A34A',
    fontWeight: '900',
    lineHeight: 42,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 28,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  okBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 5,
  },
  okBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
