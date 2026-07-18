import AppText from './AppText';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, fontSize, shadows, spacing } from '../constants/theme';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/formatDate';

import type { Activity } from '../types';

interface ActivityCardProps {
  activity: Activity;
  onPress: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onPress }) => {
  const { colors } = useTheme();
  const { i18n } = useTranslation();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          ...shadows.card,
          shadowColor: colors.cardShadow,
        },
      ]}
    >
      {/* Blue accent dot */}
      <View style={[styles.accentDot, { backgroundColor: colors.primary }]} />

      <View style={styles.content}>
        {/* Header: Title */}
        <View style={styles.header}>
          <AppText
            style={[styles.title, { color: colors.textOnCard }]}
            numberOfLines={2}
          >
            {activity.title}
          </AppText>
        </View>

        {/* Location */}
        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color={colors.textCardSecondary}
          />
          <AppText
            style={[styles.infoText, { color: colors.textCardSecondary }]}
            numberOfLines={1}
          >
            {activity.location}
          </AppText>
        </View>

        {/* Date */}
        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.textCardSecondary}
          />
          <AppText style={[styles.infoText, { color: colors.textCardSecondary }]}>
            {formatDate(activity.startDate, i18n.language, 'short')} – {formatDate(activity.endDate, i18n.language, 'short')}
          </AppText>
        </View>

        {/* Footer: Participants + Status */}
        <View style={styles.footer}>
          <View style={styles.participantRow}>
            <Ionicons
              name="people-outline"
              size={14}
              color={colors.textCardSecondary}
            />
            <AppText
              style={[styles.infoText, { color: colors.textCardSecondary }]}
            >
              {activity.participantCount ?? 0}
              {activity.maxParticipants
                ? ` / ${activity.maxParticipants}`
                : ''}
            </AppText>
          </View>
          <StatusBadge status={activity.status} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  accentDot: {
    width: 4,
    borderTopLeftRadius: borderRadius.xl,
    borderBottomLeftRadius: borderRadius.xl,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    flex: 1,
    marginRight: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ActivityCard;
