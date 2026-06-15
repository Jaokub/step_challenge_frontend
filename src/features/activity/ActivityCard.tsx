import { useTranslation } from 'react-i18next';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppText } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius } from '../../constants/theme';
import type { Activity } from '../../types';

interface ActivityCardProps {
  activity: Activity;
}

// Helper to generate consistent mock colors/categories if not provided by backend
const getMockData = (id: string, t: any) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ['#b0f237', '#00e5ff', '#a855f7', '#f59e0b', '#ff4d6d'];
  const categories = [t('activity.run'), t('activity.bike'), t('activity.yoga'), t('activity.swim'), t('activity.hiit')];
  return {
    color: colors[hash % colors.length],
    category: categories[hash % categories.length]
  };
};

export function ActivityCard({ activity }: ActivityCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { color, category } = getMockData(activity.id, t);
  
  const participants = activity.participantCount || 0;
  const maxParticipants = activity.maxParticipants || 100;
  const pct = Math.min(100, Math.round((participants / maxParticipants) * 100));

  const startDate = new Date(activity.startDate);
  const dateStr = startDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = startDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider }]} 
      onPress={() => router.push(`/activity/${activity.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.topAccent, { backgroundColor: color }]} />
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: color + '20' }]}>
            <AppText style={[styles.badgeText, { color }]}>{category}</AppText>
          </View>
          <AppText style={[styles.pointsText, { color: colors.primary }]}>+{activity.points} pt</AppText>
        </View>

        <AppText style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {activity.title}
        </AppText>
        <AppText style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {activity.description}
        </AppText>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
            <AppText style={[styles.detailText, { color: colors.textSecondary }]}>{dateStr}</AppText>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} style={{ marginLeft: spacing.sm }} />
            <AppText style={[styles.detailText, { color: colors.textSecondary }]}>{timeStr}</AppText>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <AppText style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
              {activity.location}
            </AppText>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
              <AppText style={[styles.detailText, { color: colors.textSecondary }]}>
                {participants}/{maxParticipants} {t('activity.people')}
              </AppText>
            </View>
            <AppText style={[styles.detailText, { color: colors.textSecondary }]}>{pct}%</AppText>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.divider }]}>
            <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topAccent: {
    height: 6,
    width: '100%',
  },
  content: {
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  detailsContainer: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  progressSection: {
    marginTop: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  }
});
