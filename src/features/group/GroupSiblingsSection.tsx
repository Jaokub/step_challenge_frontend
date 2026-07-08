import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { AppText, PointsBadge, Skeleton } from '../../components';
import { spacing, borderRadius, fontSize } from '../../constants/theme';
import type { SiblingGroupOverview } from '../../types';

// Deliberately no ranking / member list here — siblings only ever see each
// other's overall stats, never a member breakdown. See groupOverview.service.js.
interface GroupSiblingsSectionProps {
  siblings: SiblingGroupOverview[];
  isLoading: boolean;
}

export const GroupSiblingsSection: React.FC<GroupSiblingsSectionProps> = ({ siblings, isLoading }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (!isLoading && siblings.length === 0) return null;

  return (
    <View style={styles.container}>
      <AppText variant="body-bold" style={styles.sectionTitle}>
        {t('groups.siblingGroups')}
      </AppText>

      {isLoading ? (
        <Skeleton width="100%" height={64} borderRadius={borderRadius.xl} />
      ) : (
        siblings.map((sibling) => (
          <View
            key={sibling.groupId}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.info}>
              <AppText style={[styles.name, { color: colors.textOnCard }]} numberOfLines={1}>
                {sibling.groupName}
              </AppText>
              <AppText style={[styles.meta, { color: colors.textCardSecondary }]}>
                {sibling.overallStats.memberCount} {t('common.members')} · {sibling.overallStats.totalSteps.toLocaleString()} {t('health.stepsUnit')}
              </AppText>
            </View>
            <PointsBadge points={sibling.overallStats.totalPoints} size="sm" />
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md, paddingHorizontal: spacing.xl },
  sectionTitle: { fontSize: fontSize.md, marginBottom: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  info: { flex: 1 },
  name: { fontSize: fontSize.md, marginBottom: 2 },
  meta: { fontSize: fontSize.xs },
});
