// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  JWT_TOKEN:     '@wholesaler_jwt',
  USER_DATA:     '@wholesaler_user',
  FCM_TOKEN:     '@wholesaler_fcm',
  NOTIFICATIONS: '@wholesaler_notifications',

  // Registration flow state — persisted across app restarts
  // Possible values:
  //   null          → no registration in progress
  //   'otp'         → registered but OTP not yet verified  (unused currently — kept for future)
  //   'docs'        → OTP verified, documents not yet uploaded
  //   'waiting'     → docs submitted, waiting for admin approval
  REG_STEP:      '@wholesaler_reg_step',
  REG_MOBILE:    '@wholesaler_reg_mobile',
};

export const getToken    = () => AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
export const setToken    = (t) => AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, t);
export const removeToken = () => AsyncStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);

export const getUser   = async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
  return raw ? JSON.parse(raw) : null;
};
export const setUser    = (u) => AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(u));
export const removeUser = () => AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);

// ── Registration progress helpers ─────────────────────────────────────────

/**
 * Save the current registration step so the app can resume after a restart.
 * @param {'otp'|'docs'|'waiting'} step
 * @param {string} mobile  — mobile number used during registration
 */
export const setRegStep = (step, mobile) =>
  Promise.all([
    AsyncStorage.setItem(STORAGE_KEYS.REG_STEP,   step),
    AsyncStorage.setItem(STORAGE_KEYS.REG_MOBILE, mobile ?? ''),
  ]);

/** Read back the saved step + mobile. Returns { step, mobile } or { step: null, mobile: null }. */
export const getRegStep = async () => {
  const [step, mobile] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.REG_STEP),
    AsyncStorage.getItem(STORAGE_KEYS.REG_MOBILE),
  ]);
  return { step: step ?? null, mobile: mobile ?? null };
};

/** Clear registration progress — call after successful login or logout. */
export const clearRegStep = () =>
  Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.REG_STEP),
    AsyncStorage.removeItem(STORAGE_KEYS.REG_MOBILE),
  ]);
