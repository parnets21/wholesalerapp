// src/components/TabBar.jsx
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../utils/theme';

export default function TabBar({ tabs, activeIndex, onTabPress, badgeCounts = {} }) {
  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tabs.map((tab, i) => {
          const isActive = i === activeIndex;
          const count = badgeCounts[tab] || 0;
          return (
            <TouchableOpacity key={tab} style={[styles.tab, isActive && styles.activeTab]} onPress={() => onTabPress(i)} activeOpacity={0.7}>
              <View style={styles.tabInner}>
                <Text style={[styles.tabText, isActive && styles.activeText]}>{tab}</Text>
                {count > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:   { backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  row:       { paddingHorizontal: 8 },
  tab:       { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: theme.colors.primary },
  tabInner:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tabText:   { fontSize: 13, fontWeight: '500', color: theme.colors.textSecondary },
  activeText:{ color: theme.colors.primary, fontWeight: '700' },
  badge:     { backgroundColor: theme.colors.danger, borderRadius: 8, minWidth: 16, paddingHorizontal: 4, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
