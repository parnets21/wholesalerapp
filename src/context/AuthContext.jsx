// src/context/AuthContext.jsx
//
// Central auth state + FCM token registration + approval detection.
//
// @react-native-firebase/messaging v26 — modular API only.
// Import named functions, NOT the old  messaging()  style.
//
import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import { authService } from '../services/authService';
import {
  getToken as getStoredToken,
  getUser,
  removeToken,
  removeUser,
  setToken,
  setUser,
  clearRegStep,
} from '../utils/storage';

export const AuthContext = createContext({});

// ── Helpers ────────────────────────────────────────────────────────────────
function deriveApproved(userData) {
  if (!userData) return false;
  // Backend sends company_status: 'Approved' (capital A) from buildUserResponse
  return (
    userData.company_status === 'Approved' ||
    userData.is_approved === true
  );
}

// ── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,       setUserState]  = useState(null);
  const [token,      setTokenState] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading,  setIsLoading]  = useState(true);

  // Approval success modal state — shown when FCM push or polling detects approval
  // { visible: boolean, ownerName: string }
  const [approvalModal, setApprovalModal] = useState({ visible: false, ownerName: '' });

  // Keep a ref to refreshUser so FCM listeners always call the latest version
  const refreshUserRef = useRef(null);

  // ── Restore session on app start ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getStoredToken();
        if (storedToken) {
          // Prefer the lightweight status endpoint to avoid heavy join on startup
          let userData = null;
          try {
            const statusRes = await authService.getApprovalStatus();
            // getApprovalStatus returns { status, ownerName, companyId, companyName }
            // We also need full user data — fall through to getMe for the full object
            userData = null; // force getMe below
          } catch (_) {}

          // Always get full user object for dashboard name etc.
          const me       = await authService.getMe();
          userData       = me?.user || me?.data || me;

          const approved = deriveApproved(userData);
          setUserState(userData);
          setTokenState(storedToken);
          setIsApproved(approved);
        }
      } catch {
        // Token invalid / expired — clear everything
        await removeToken();
        await removeUser();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Save FCM token to backend whenever JWT token is available ────────────
  useEffect(() => {
    if (!token) return;

    let unsubRefresh;

    (async () => {
      try {
        const msgInstance = getMessaging();
        const fcmToken    = await getToken(msgInstance);
        if (fcmToken) {
          await authService.saveFCMToken(fcmToken);
          console.log('[FCM] Token saved:', fcmToken.slice(0, 20) + '…');
        }
      } catch (err) {
        console.warn('[FCM] Could not save FCM token:', err.message);
      }

      // Listen for token rotation — save new token automatically
      const msgInstance  = getMessaging();
      unsubRefresh = onTokenRefresh(msgInstance, async newToken => {
        try {
          await authService.saveFCMToken(newToken);
          console.log('[FCM] Refreshed token saved:', newToken.slice(0, 20) + '…');
        } catch (_) {}
      });
    })();

    return () => {
      if (unsubRefresh) unsubRefresh();
    };
  }, [token]);

  // ── FCM approval listeners ────────────────────────────────────────────────
  // Backend sends data payload:
  //   { type: 'approval', status: 'Approved', ownerName, companyId, userId }
  // All three lifecycle cases handled below.
  useEffect(() => {
    if (!token) return;

    const msgInstance = getMessaging();

    function handleApprovalPush(remoteMessage, source) {
      const data = remoteMessage?.data ?? {};
      if (data.type === 'approval' && data.status === 'Approved') {
        console.log(`[FCM] Approval push received (${source}) — refreshing user…`);
        // Show the approval success modal with the owner name from the push payload
        const ownerName = data.ownerName || '';
        setApprovalModal({ visible: true, ownerName });
        // Refresh auth state so RootNavigator switches to AppStack
        refreshUserRef.current?.();
      }
    }

    // App OPEN (foreground)
    const unsubForeground = onMessage(msgInstance, msg =>
      handleApprovalPush(msg, 'foreground')
    );

    // App in BACKGROUND — user tapped notification
    const unsubBackground = onNotificationOpenedApp(msgInstance, msg =>
      handleApprovalPush(msg, 'background-tap')
    );

    // App was CLOSED — user tapped notification to open
    getInitialNotification(msgInstance).then(msg => {
      if (msg) handleApprovalPush(msg, 'quit-state');
    });

    return () => {
      unsubForeground();
      unsubBackground();
    };
  }, [token]);

  // ── Auth actions ──────────────────────────────────────────────────────────
  const login = useCallback(async (newToken, userData) => {
    await setToken(newToken);
    await setUser(userData);
    const approved = deriveApproved(userData);
    setTokenState(newToken);
    setUserState(userData);
    setIsApproved(approved);
    return approved;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch (_) {}
    await removeToken();
    await removeUser();
    await clearRegStep();          // reset any incomplete registration flow
    setTokenState(null);
    setUserState(null);
    setIsApproved(false);
    setApprovalModal({ visible: false, ownerName: '' });
  }, []);

  /**
   * refreshUser — re-fetches /me from backend and updates auth state.
   * Called by FCM listeners, "Check Now" button, and background/quit-state taps.
   * Returns the updated userData object (or null on error).
   */
  const refreshUser = useCallback(async () => {
    try {
      const me       = await authService.getMe();
      const userData = me?.user || me?.data || me;
      const approved = deriveApproved(userData);
      setUserState(userData);
      setIsApproved(approved);
      await setUser(userData);
      return userData;
    } catch {
      return null;
    }
  }, []);

  // Dismiss the approval modal (called by ApprovalWaitingScreen / RootNavigator after OK)
  const dismissApprovalModal = useCallback(() => {
    setApprovalModal({ visible: false, ownerName: '' });
  }, []);

  // Keep ref in sync with latest refreshUser so FCM closures always get fresh version
  useEffect(() => {
    refreshUserRef.current = refreshUser;
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isApproved,
      isLoading,
      approvalModal,
      login,
      logout,
      refreshUser,
      dismissApprovalModal,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
