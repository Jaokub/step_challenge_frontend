import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppText } from '../../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import type { Activity } from '../../../types';

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]} 
      onPress={() => router.push(`/activity/${activity.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.dateBox, { backgroundColor: colors.primary + '15' }]}>
        <AppText style={[styles.dateMonth, { color: colors.primary }]}>
          {new Date(activity.startDate).toLocaleString('default', { month: 'short' }).toUpperCase()}
        </AppText>
        <AppText style={[styles.dateDay, { color: colors.primary }]}>
          {new Date(activity.startDate).getDate()}
        </AppText>
      </View>
      <View style={styles.info}>
        <AppText style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {activity.title}
        </AppText>
        <AppText style={[styles.status, { color: colors.textSecondary }]}>
          {activity.status}
        </AppText>
      </View>
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 88, // Ensure touch target
  },
  dateBox: {
    width: 50,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dateMonth: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 20,
    marginTop: -2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '600',
  },
  status: {
    fontSize: 13,
  },
  arrowContainer: {
    padding: 8, // Increase touch area if needed
  }
});
