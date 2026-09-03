// src/navigation/AppStack.jsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { theme } from '../utils/theme';
import BottomTabNavigator from './BottomTabNavigator';

// ── Enquiry ──────────────────────────────────────────────────
import EnquiryDetailScreen      from '../screens/enquiry/EnquiryDetailScreen';
import ReplyEnquiryScreen       from '../screens/enquiry/ReplyEnquiryScreen';

// ── Orders ───────────────────────────────────────────────────
import OrderDetailScreen        from '../screens/order/OrderDetailScreen';
import OrderStatusUpdateScreen  from '../screens/order/OrderStatusUpdateScreen';

// ── Products — View + Add ────────────────────────────────────
import ProductDetailScreen      from '../screens/product/ProductDetailScreen';
import AddProductScreen         from '../screens/product/AddProductScreen';

// ── Purchase (Buy items) ─────────────────────────────────────
import PurchaseEntryScreen      from '../screens/purchase/PurchaseEntryScreen';

// ── Quotations (request → admin quote → accept/reject) ───────
import QuotationListScreen      from '../screens/quotation/QuotationListScreen';
import ProductRequestScreen     from '../screens/quotation/ProductRequestScreen';

// ── Invoices (generated after admin approves an order) ───────
import InvoiceListScreen        from '../screens/invoice/InvoiceListScreen';
import InvoiceDetailScreen      from '../screens/invoice/InvoiceDetailScreen';

// ── Dispatch ─────────────────────────────────────────────────
import DispatchEntryScreen      from '../screens/dispatch/DispatchEntryScreen';
import DispatchTrackingScreen   from '../screens/dispatch/DispatchTrackingScreen';

// ── Customers ────────────────────────────────────────────────
import CustomerListScreen       from '../screens/customer/CustomerListScreen';
import CustomerProfileScreen    from '../screens/customer/CustomerProfileScreen';
import CustomerHistoryScreen    from '../screens/customer/CustomerHistoryScreen';

// ── Sales ────────────────────────────────────────────────────
import SalesEntryScreen         from '../screens/sales/SalesEntryScreen';
import SalesListScreen          from '../screens/sales/SalesListScreen';
import SalesReportScreen        from '../screens/sales/SalesReportScreen';

// ── Payments ─────────────────────────────────────────────────
import PaymentReceivableScreen  from '../screens/payment/PaymentReceivableScreen';
import PaymentPayableScreen     from '../screens/payment/PaymentPayableScreen';
import PaymentEntryScreen       from '../screens/payment/PaymentEntryScreen';

// ── Accounts ─────────────────────────────────────────────────
import CustomerLedgerScreen    from '../screens/accounts/CustomerLedgerScreen';
import AccountsScreen          from '../screens/accounts/AccountsScreen';

// ── Finance ──────────────────────────────────────────────────
import PLDashboardScreen        from '../screens/profitloss/PLDashboardScreen';
import ExpenseEntryScreen       from '../screens/expense/ExpenseEntryScreen';
import ExpenseListScreen        from '../screens/expense/ExpenseListScreen';
import ExpenseReportScreen      from '../screens/expense/ExpenseReportScreen';

// ── Inventory ────────────────────────────────────────────────
import InventoryScreen          from '../screens/inventory/InventoryScreen';

// ── Notifications & Reports ───────────────────────────────────
import NotificationListScreen   from '../screens/notifications/NotificationListScreen';
import AnalyticsDashboardScreen from '../screens/reports/AnalyticsDashboardScreen';

// ── Profile / Settings ────────────────────────────────────────
import ProfileScreen            from '../screens/settings/ProfileScreen';
import SubscriptionPlanScreen   from '../screens/settings/SubscriptionPlanScreen';

const Stack = createNativeStackNavigator();

const H = {
  headerStyle:      { backgroundColor: theme.colors.primary },
  headerTintColor:  '#fff',
  headerTitleStyle: { fontWeight: '700' },
  headerShown:      true,
};

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />

      {/* ── Enquiry ── */}
      <Stack.Screen name="EnquiryDetail"     component={EnquiryDetailScreen}     options={{ ...H, title: 'Enquiry Detail' }} />
      <Stack.Screen name="ReplyEnquiry"      component={ReplyEnquiryScreen}      options={{ ...H, title: 'Reply to Enquiry' }} />

      {/* ── Orders ── */}
      <Stack.Screen name="OrderDetail"       component={OrderDetailScreen}       options={{ ...H, title: 'Order Detail' }} />
      <Stack.Screen name="OrderStatusUpdate" component={OrderStatusUpdateScreen} options={{ ...H, title: 'Update Status' }} />

      {/* ── Products ── */}
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddProduct"    component={AddProductScreen}    options={{ headerShown: false }} />

      {/* ── Purchase (Buy) ── */}
      <Stack.Screen name="PurchaseEntry" component={PurchaseEntryScreen} options={{ headerShown: false }} />

      {/* ── Quotations ── */}
      <Stack.Screen name="QuotationList"  component={QuotationListScreen}  options={{ headerShown: false }} />
      <Stack.Screen name="ProductRequest" component={ProductRequestScreen} options={{ headerShown: false }} />

      {/* ── Invoices ── */}
      <Stack.Screen name="InvoiceList"   component={InvoiceListScreen}   options={{ headerShown: false }} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ headerShown: false }} />

      {/* ── Dispatch ── */}
      <Stack.Screen name="DispatchEntry"     component={DispatchEntryScreen}     options={{ ...H, title: 'New Dispatch' }} />
      <Stack.Screen name="DispatchTracking"  component={DispatchTrackingScreen}  options={{ ...H, title: 'Dispatch Tracking' }} />

      {/* ── Customers ── */}
      <Stack.Screen name="CustomerList"      component={CustomerListScreen}      options={{ ...H, title: 'Customers' }} />
      <Stack.Screen name="CustomerProfile"   component={CustomerProfileScreen}   options={{ ...H, title: 'Customer Profile' }} />
      <Stack.Screen name="CustomerHistory"   component={CustomerHistoryScreen}   options={{ ...H, title: 'Follow-ups' }} />

      {/* ── Sales ── */}
      <Stack.Screen name="SalesEntry"        component={SalesEntryScreen}        options={{ ...H, title: 'New Sale' }} />
      <Stack.Screen name="SalesList"         component={SalesListScreen}         options={{ ...H, title: 'Sales' }} />
      <Stack.Screen name="SalesReport"       component={SalesReportScreen}       options={{ ...H, title: 'Sales Report' }} />

      {/* ── Payments ── */}
      <Stack.Screen name="PaymentReceivable" component={PaymentReceivableScreen} options={{ ...H, title: 'Payment Receivable' }} />
      <Stack.Screen name="PaymentPayable"    component={PaymentPayableScreen}    options={{ ...H, title: 'Payment Payable' }} />
      <Stack.Screen name="PaymentEntry"      component={PaymentEntryScreen}      options={{ ...H, title: 'Payment Entry' }} />

      {/* ── Accounts ── */}
      <Stack.Screen name="Accounts"       component={AccountsScreen}       options={{ ...H, title: 'Accounts' }} />
      <Stack.Screen name="CustomerLedger" component={CustomerLedgerScreen} options={{ ...H, title: 'Customer Ledger' }} />

      {/* ── Finance ── */}
      <Stack.Screen name="PLDashboard"       component={PLDashboardScreen}       options={{ ...H, title: 'Profit & Loss' }} />
      <Stack.Screen name="ExpenseEntry"      component={ExpenseEntryScreen}      options={{ ...H, title: 'New Expense' }} />
      <Stack.Screen name="ExpenseList"       component={ExpenseListScreen}       options={{ ...H, title: 'Expenses' }} />
      <Stack.Screen name="ExpenseReport"     component={ExpenseReportScreen}     options={{ ...H, title: 'Expense Report' }} />

      {/* ── Inventory ── */}
      <Stack.Screen name="Inventory" component={InventoryScreen} options={{ ...H, title: 'Stock Management' }} />

      {/* ── Notifications & Reports ── */}
      <Stack.Screen name="NotificationList"   component={NotificationListScreen}   options={{ ...H, title: 'Notifications' }} />
      <Stack.Screen name="ReportCenter"       component={AnalyticsDashboardScreen} options={{ ...H, title: 'Reports' }} />
      <Stack.Screen name="AnalyticsDashboard" component={AnalyticsDashboardScreen} options={{ ...H, title: 'Analytics' }} />

      {/* ── Profile / Settings ── */}
      <Stack.Screen name="Profile"          component={ProfileScreen}          options={{ ...H, title: 'My Profile' }} />
      <Stack.Screen name="SubscriptionPlan" component={SubscriptionPlanScreen} options={{ ...H, title: 'Subscription' }} />
    </Stack.Navigator>
  );
}
