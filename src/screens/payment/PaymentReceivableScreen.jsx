// src/screens/payment/PaymentReceivableScreen.jsx
// Redirects to the unified AccountsScreen on the Receivables tab
import React, { useEffect } from 'react';
import { View } from 'react-native';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function PaymentReceivableScreen({ navigation }) {
  useEffect(() => {
    // Redirect to the unified Accounts screen
    navigation.replace('CustomerLedger', {});
  }, []);
  return <View style={{ flex: 1 }}><LoadingSpinner /></View>;
}
