// src/screens/auth/LoginScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FormField from '../../components/FormField';
import PrimaryButton from '../../components/PrimaryButton';
import { authService } from '../../services/authService';
import { validateMobile } from '../../utils/validators';
import { theme } from '../../utils/theme';

const LOGO = require('../../assets/logo.png');

export default function LoginScreen({ route, navigation }) {
  const prefilled = route?.params?.mobile ?? '';
  const [mobile,  setMobile]  = useState(prefilled);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefilled && prefilled.length === 10) {
      handleSendOTP(prefilled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendOTP = async (num = mobile) => {
    const { valid, error: err } = validateMobile(num);
    if (!valid) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      const res = await authService.sendOTP(num);
      // Dev mode: backend returns OTP in response — auto-fill for easy testing
      const devOtp = res?.data?.otp || res?.otp;
      navigation.navigate('OTP', { mobile: num, devOtp: devOtp || null });
    } catch (e) {
      // 404 = mobile not registered → redirect to Registration
      if (e?.status === 404) {
        Alert.alert(
          'Not Registered',
          'This mobile number is not registered. Would you like to create an account?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Register',
              onPress: () => navigation.navigate('Registration', { mobile: num }),
            },
          ]
        );
      } else {
        Alert.alert('Error', e?.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.splashBg} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.circleDecor} />
          <View style={styles.logoBox}>
            <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Login to EzyEnquiry Wholesaler</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enter Mobile Number</Text>
          <Text style={styles.cardSub}>We'll send a 6-digit OTP to verify your number</Text>

          <FormField
            label="Mobile Number"
            value={mobile}
            onChangeText={t => { setMobile(t.replace(/\D/g, '')); setError(''); }}
            keyboardType="number-pad"
            placeholder="Enter 10-digit mobile number"
            maxLength={10}
            error={error}
          />

          <TouchableOpacity
            style={[styles.btn, (loading || mobile.length < 10) && styles.btnDisabled]}
            onPress={() => handleSendOTP()}
            disabled={loading || mobile.length < 10}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>{loading ? 'Sending OTP…' : 'Send OTP →'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Registration')}
            style={styles.link}
          >
            <Text style={styles.linkText}>
              New here?{'  '}
              <Text style={styles.linkBold}>Create an Account</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Welcome')}>
          <Text style={styles.backText}>← Back to Welcome</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: theme.colors.background, paddingBottom: 32 },

  header: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 48,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  circleDecor: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.primaryMid,
    opacity: 0.5,
  },
  logoBox: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  logoImage: { width: 62, height: 62 },
  title:    { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.78)' },

  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 4 },
  cardSub:   { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 20 },

  btn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  btnDisabled: { backgroundColor: theme.colors.textDisabled, shadowOpacity: 0, elevation: 0 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },

  link:     { marginTop: 18, alignItems: 'center' },
  linkText: { fontSize: 14, color: theme.colors.textSecondary },
  linkBold: { color: theme.colors.primary, fontWeight: '700' },

  backBtn: { marginTop: 20, alignItems: 'center' },
  backText: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },
});
