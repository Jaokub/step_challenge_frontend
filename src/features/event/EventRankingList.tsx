import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, Skeleton } from '../../components';
import { spacing, borderRadius, gradients } from '../../constants/theme';
import type { EventIndividualRow, EventGroupRow, EventScope } from '../../types';

const ROW_HEIGHT = 64;

const initialsOf = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

interface Props {
  scope: EventScope;
  ranking: (EventIndividualRow | EventGroupRow)[];
  isLoading: boolean;
  colors: any;
  currentUserId?: string;
}

const rankColor = (rank: number, colors: any) => {
  if (rank === 1) return '#f5c451';
  if (rank === 2) return '#c4cdd5';
  if (rank === 3) return '#d79a6a';
  return colors.textSecondary;
};

/** Shared ranking list for both the individual and group-sum event boards. */
const EventRankingList: React.FC<Props> = ({ scope, ranking, isLoading, colors, currentUserId }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={{ gap: 10 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} width="100%" height={ROW_HEIGHT} borderRadius={borderRadius.lg} />
        ))}
      </View>
    );
  }

  if (!ranking.length) {
    return (
      <View style={styles.empty}>
        <AppText style={{ color: colors.textSecondary }}>{t('events.noParticipants')}</AppText>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {ranking.map((row) => {
        const isGroup = scope === 'group';
        const key = isGroup ? (row as EventGroupRow).groupId : (row as EventIndividualRow).id;
        const name = isGroup ? (row as EventGroupRow).groupName : (row as EventIndividualRow).fullName;
        const steps = isGroup ? (row as EventGroupRow).totalSteps : (row as EventIndividualRow).steps;
        const sub = isGroup
          ? t('events.memberCount', { count: (row as EventGroupRow).memberCount })
          : (row as EventIndividualRow).department || '';
        const isMe = !isGroup && (row as EventIndividualRow).id === currentUserId;

        return (
          <View
            key={key}
            style={[
              styles.row,
              {
                height: ROW_HEIGHT,
                backgroundColor: colors.card,
                borderColor: isMe ? colors.primary : colors.cardBorder,
                borderWidth: isMe ? 1.5 : 1,
              },
            ]}
          >
            <AppText variant="heading-bold" style={[styles.rank, { color: rankColor(row.rank, colors) }]}>
              {row.rank}
            </AppText>
            {/* Mockup frame 5: individual rows get a brand-gradient initials chip;
                group rows don't (no single person to represent). */}
            {!isGroup && (
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <AppText variant="heading-bold" style={[styles.avatarText, { color: colors.onPrimary }]}>
                  {initialsOf(name || '')}
                </AppText>
              </LinearGradient>
            )}
            <View style={styles.info}>
              <AppText numberOfLines={1} style={[styles.name, { color: colors.textPrimary }]}>
                {name}
              </AppText>
              {!!sub && (
                <AppText numberOfLines={1} style={[styles.sub, { color: colors.textSecondary }]}>
                  {sub}
                </AppText>
              )}
            </View>
            <AppText variant="heading-bold" style={[styles.steps, { color: colors.textPrimary }]}>
              {steps.toLocaleString()}
            </AppText>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rank: { width: 20, textAlign: 'center', fontSize: 15 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 12 },
  info: { flex: 1 },
  name: { fontSize: 15 },
  sub: { fontSize: 12, marginTop: 2 },
  steps: { fontSize: 16, lineHeight: 20 },
  empty: { alignItems: 'center', paddingVertical: spacing['3xl'] },
});

export default EventRankingList;
