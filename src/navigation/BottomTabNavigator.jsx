// src/navigation/BottomTabNavigator.jsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { theme } from '../utils/theme';
import usePermissions from '../hooks/usePermissions';

import DashboardScreen   from '../screens/dashboard/DashboardScreen';
import EnquiryListScreen from '../screens/enquiry/EnquiryListScreen';
import SalesListScreen   from '../screens/sales/SalesListScreen';
import ProductListScreen from '../screens/product/ProductListScreen';
import ProfileScreen     from '../screens/settings/ProfileScreen';

const Tab = createBottomTabNavigator();

const PRIMARY  = theme.colors.primary;  // #2D1B69
const ACCENT   = theme.colors.accent;   // #FF6B35
const INACTIVE = '#9BA3B8';
const WHITE    = '#FFFFFF';

/* ─────────────────────────────────────────────────────
   Icon-only component — orange active indicator as a
   top border, purple pill behind the active icon
───────────────────────────────────────────────────── */
function TabIcon({ name, nameActive, focused }) {
  // No pill / no top bar highlight. Active tab shows in orange, others grey.
  return (
    <View style={styles.iconWrap}>
      <Icon
        name={focused ? nameActive : name}
        size={24}
        color={focused ? ACCENT : INACTIVE}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 52,
  },
  activeBar: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  activeBarOn: {
    backgroundColor: ACCENT,
  },
  iconPill: {
    width: 44,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconPillOn: {
    backgroundColor: PRIMARY,
  },
});

const TABS = [
  { name: 'Dashboard', label: 'Home',      icon: 'home-outline',                   iconActive: 'home',                   component: DashboardScreen,   module: 'dashboard' },
  { name: 'Enquiries', label: 'Enquiries', icon: 'message-text-outline',           iconActive: 'message-text',           component: EnquiryListScreen, module: 'enquiries' },
  { name: 'Products',  label: 'Products',  icon: 'package-variant-closed',         iconActive: 'package-variant',        component: ProductListScreen, module: 'products'  },
  { name: 'Sales',     label: 'Sales',     icon: 'cash-multiple',                  iconActive: 'cash-multiple',          component: SalesListScreen,   module: 'sales'     },
  { name: 'Profile',   label: 'Profile',   icon: 'account-circle-outline',         iconActive: 'account-circle',         component: ProfileScreen,     module: 'profile'   },
];

// Custom tab button with NO ripple / press highlight — clean tap, no focus effect.
function NoRippleTabButton({ children, onPress, accessibilityState, style }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={null}
      accessibilityState={accessibilityState}
      style={({ pressed }) => [
        { flex: 1, alignItems: 'center', justifyContent: 'center' },
        style,
        pressed && { opacity: 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

export default function BottomTabNavigator() {
  // Safe-area aware height — gesture-nav / notch phones par bar cut nahi hogi
  const insets = useSafeAreaInsets();
  const barHeight = 60 + (Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : Math.max(insets.bottom, 8));
  const { can } = usePermissions();
  // Dashboard + Profile always shown; others gated by role.
  const visibleTabs = TABS.filter(t => t.module === 'dashboard' || t.module === 'profile' || can(t.module));

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarButton: (props) => <NoRippleTabButton {...props} />,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: INACTIVE,
        tabBarHideOnKeyboard: true, // keyboard khulne par bar overlap na kare
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 1,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 6,
        },
        tabBarStyle: {
          backgroundColor: WHITE,
          borderTopWidth: 1,
          borderTopColor: '#ECEFF5',
          height: barHeight,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : Math.max(insets.bottom, 8),
          paddingTop: 6,
          // Heavy elevation/shadow yahi white/grey "halo" band bana raha tha — hata diya.
          elevation: 0,
          shadowColor: 'transparent',
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 0,
        },
      }}
    >
      {visibleTabs.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={tab.icon}
                nameActive={tab.iconActive}
                focused={focused}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}