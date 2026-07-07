import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { gradients, activityAccents, spacing } from '../../constants/theme';
import type { Activity } from '../../types';
import { isMockActivity } from './mockActivities';

const GRAD_START = { x: 0, y: 0 };
const GRAD_END = { x: 1, y: 1 };

interface ActivityCardProps {
  activity: Activity;
}

/** Derives the day/month badge text, a time label ("All day" for long spans), and a days-remaining label. */
function useActivityMeta(activity: Activity) {
  const { i18n, t } = useTranslation();
  const start = new Date(activity.startDate);
  const end = new Date(activity.endDate);
  const spanHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  const isAllDay = spanHours >= 20;
  const monthShort = t('months.short', { returnObjects: true }) as string[];
  const day = start.getDate().toString().padStart(2, '0');
  const month = monthShort[start.getMonth()] ?? '';
  const timeStr = isAllDay
    ? t('activity.allDay')
    : start.toLocaleTimeString(i18n.language === 'th' ? 'th-TH' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(start) - startOfDay(new Date())) / (1000 * 60 * 60 * 24));
  const daysLabel = dayDiff > 0 ? t('activities.daysLeft', { count: dayDiff }) : dayDiff === 0 ? t('activities.today') : t('activities.ended');

  return { day, month, timeStr, daysLabel };
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { day, month, timeStr, daysLabel } = useActivityMeta(activity);
  const [expanded, setExpanded] = useState(false);

  const isMock = isMockActivity(activity.id);
  const participantCount = activity.participantCount ?? 0;
  const tone = isDark ? 'dark' : 'light';
  const heroColors = isDark ? gradients.heroCard : gradients.heroCardLight;
  const badgeLabel = activity.totalDistance
    ? `${activity.totalDistance} ${t('dashboard.km')}`
    : `+${activity.points} pt`;
  const avatarColors = activityAccents.dateBoxText.map((c) => c[tone]);
  // `colors.card` and `colors.inputBackground` are the same value in dark mode, so the stat
  // chips need their own tone-aware background to actually stand out against the card.
  const statChipBg = isDark ? colors.background : colors.inputBackground;

  const handleJoinPress = () => {
    if (isMock) {
      showToast(t('activities.mockNotice'), 'info');
      return;
    }
    router.push(`/activity/${activity.id}`);
  };

  const toggleExpand = () => setExpanded((prev) => !prev);

  const capacityText = activity.maxParticipants
    ? `${participantCount} / ${activity.maxParticipants} ${t('activity.people')}`
    : `${participantCount}${t('activity.participantsUncapped')}`;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <LinearGradient colors={heroColors as any} start={GRAD_START} end={GRAD_END} style={styles.heroBlock}>
        <View
          style={[
            styles.dateBadge,
            { backgroundColor: isDark ? 'rgba(12,16,19,0.5)' : 'rgba(255,255,255,0.7)' },
          ]}
        >
          <AppText variant="heading-bold" style={{ fontSize: 20, lineHeight: 24, color: colors.primary }}>
            {day}
          </AppText>
          <AppText style={{ fontSize: 11, color: isDark ? '#cfe9e3' : '#3f7268' }}>{month}</AppText>
        </View>
        <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={styles.distanceBadge}>
          <AppText variant="body-bold" style={{ fontSize: 12, color: colors.onPrimary }}>
            {badgeLabel}
          </AppText>
        </LinearGradient>
      </LinearGradient>

      <View style={styles.content}>
        <AppText
          variant="heading-bold"
          style={{ fontSize: 16, lineHeight: 20, color: colors.textPrimary, marginBottom: 6 }}
          numberOfLines={1}
        >
          {activity.title}
        </AppText>
        <View style={styles.metaRow}>
          <View style={styles.metaLeftGroup}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <AppText style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 4 }}>{timeStr}</AppText>
            </View>
            <View style={[styles.metaItem, { marginLeft: 12, flexShrink: 1 }]}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <AppText style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 4 }} numberOfLines={1}>
                {activity.location}
              </AppText>
            </View>
          </View>
          <View style={[styles.daysChip, { backgroundColor: colors.primary + '1f' }]}>
            <AppText variant="body-semiBold" style={{ fontSize: 11, color: colors.primary }} numberOfLines={1}>
              {daysLabel}
            </AppText>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.avatarStackRow}>
            {avatarColors.map((c, idx) => (
              <View
                key={`${activity.id}-avatar-${idx}`}
                style={[
                  styles.avatarDot,
                  { backgroundColor: c, borderColor: colors.card, marginLeft: idx === 0 ? 0 : -9 },
                ]}
              />
            ))}
            <AppText style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 8 }}>
              +{participantCount} {t('activity.people')}
            </AppText>
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={handleJoinPress}>
            <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={styles.joinPill}>
              <AppText variant="body-bold" style={{ fontSize: 13, color: colors.onPrimary }}>
                {t('activities.join')}
              </AppText>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {expanded && (
          <View style={[styles.expandedSection, { borderTopColor: colors.divider }]}>
            <AppText style={{ fontSize: 13, lineHeight: 20, color: colors.textSecondary }}>
              {activity.description || t('activity.noDescription')}
            </AppText>

            <View style={styles.statsGrid}>
              <View style={[styles.statChip, { backgroundColor: statChipBg }]}>
                <AppText style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 3 }}>
                  {t('activity.people')}
                </AppText>
                <AppText variant="body-bold" style={{ fontSize: 14, color: colors.textPrimary }}>
                  {capacityText}
                </AppText>
              </View>
              {!!activity.expectedSteps && (
                <View style={[styles.statChip, { backgroundColor: statChipBg }]}>
                  <AppText style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 3 }}>
                    {t('activities.expectedSteps')}
                  </AppText>
                  <AppText variant="body-bold" style={{ fontSize: 14, color: colors.textPrimary }}>
                    {activity.expectedSteps.toLocaleString()}
                  </AppText>
                </View>
              )}
              <View style={[styles.statChip, { backgroundColor: statChipBg }]}>
                <AppText style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 3 }}>pt</AppText>
                <AppText variant="body-bold" style={{ fontSize: 14, color: colors.primary }}>
                  +{activity.points}
                </AppText>
              </View>
            </View>

            {activity.isCheckedIn && (
              <View style={[styles.checkedInRow, { backgroundColor: colors.primary + '1f' }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <AppText style={{ fontSize: 12, color: colors.primary }}>{t('activities.checkedIn')}</AppText>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity activeOpacity={0.7} onPress={toggleExpand} style={styles.toggleRow}>
          <AppText variant="body-semiBold" style={{ fontSize: 13, color: colors.primary }}>
            {expanded ? t('activities.showLess') : t('activities.showMore')}
          </AppText>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  heroBlock: {
    height: 104,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  dateBadge: {
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 9,
    alignItems: 'center',
  },
  distanceBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  content: {
    padding: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metaLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
  },
  joinPill: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  expandedSection: {
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 14,
    gap: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statChip: {
    flexGrow: 1,
    minWidth: 90,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 14,
  },
});
