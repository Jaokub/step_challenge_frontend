import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, HealthStatCard } from '../../components';
import { spacing, fontSize } from '../../constants/theme';
import { Podium, LeaderboardMember } from '../friend/Podium';
import type { GroupOverallStats, GroupRankingRow } from '../../types';

const getInitials = (name: string): string =>
  name.split(' ').map((p) => p.charAt(0)).join('').toUpperCase().slice(0, 2);

const toPodiumMember = (row: GroupRankingRow, currentUserId?: string): LeaderboardMember => ({
  id: row.id,
  rank: row.rank,
  name: row.fullName,
  avatar: getInitials(row.fullName),
  steps: row.steps ?? 0,
  distanceKm: row.distance,
  isMe: row.id === currentUserId,
});

interface GroupOverviewSectionProps {
  overallStats: GroupOverallStats | null;
  top3: GroupRankingRow[];
  isLoading: boolean;
  currentUserId?: string;
}

export const GroupOverviewSection: React.FC<GroupOverviewSectionProps> = ({
  overallStats,
  top3,
  isLoading,
  currentUserId,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <AppText variant="body-bold" style={styles.sectionTitle}>
        {t('groups.overallStats')}
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
        {/* The points stat card was removed: ranking is by step count and no
            points figure belongs in the UI. This card was displaying a real
            `totalPoints` value on a reachable screen. */}
        <HealthStatCard icon="footsteps-outline" label={t('health.steps')} value={overallStats?.totalSteps ?? 0} />
        <HealthStatCard icon="people-outline" label={t('common.members')} value={overallStats?.memberCount ?? 0} />
      </ScrollView>

      {top3.length > 0 && (
        <>
          <AppText variant="body-bold" style={styles.sectionTitle}>
            {t('groups.topRankers')}
          </AppText>
          <Podium isLoading={isLoading} topThree={top3.map((r) => toPodiumMember(r, currentUserId))} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.md, marginBottom: spacing.md, paddingHorizontal: spacing.xl },
  statsRow: { paddingHorizontal: spacing.xl, gap: spacing.md, marginBottom: spacing.md },
});
