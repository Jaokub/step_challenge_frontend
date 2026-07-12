import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText, GradientText, Skeleton } from '../../components';
import { spacing, gradients } from '../../constants/theme';
import type { EventIndividualRow, EventGroupRow, EventScope } from '../../types';

const ROW_HEIGHT = 64;
const ROW_RADIUS = 20; // mockup frame 5 ranking-row radius (not borderRadius.lg)

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

// Top-3 medal tint — pulled from the central gold/silver/bronze gradient
// tokens (theme.ts) instead of one-off hardcoded hex, so a brand update to
// those tokens propagates here automatically.
const medalGradient = (rank: number) => {
  if (rank === 1) return gradients.gold;
  if (rank === 2) return gradients.silver;
  if (rank === 3) return gradients.bronze;
  return null;
};

/** Shared ranking list for both the individual and group-sum event boards. */
const EventRankingList: React.FC<Props> = ({ scope, ranking, isLoading, colors, currentUserId }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={{ gap: 10 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} width="100%" height={ROW_HEIGHT} borderRadius={ROW_RADIUS} />
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
            {medalGradient(row.rank) ? (
              <GradientText colors={medalGradient(row.rank)!} variant="heading-bold" style={styles.rank}>
                {row.rank}
              </GradientText>
            ) : (
              <AppText variant="heading-bold" style={[styles.rank, { color: colors.textSecondary }]}>
                {row.rank}
              </AppText>
            )}
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
    borderRadius: ROW_RADIUS,
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
