import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { AppText, Skeleton } from '../../components';
import { spacing } from '../../constants/theme';
import type { SiblingGroupOverview } from '../../types';

// Deliberately no ranking / member list here — siblings only ever see each
// other's overall stats, never a member breakdown. See groupOverview.service.js.
// Mockup frame 13/15 "กลุ่มใกล้เคียง": plain white row, name + total steps —
// no icon circle, no points badge.
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
      <AppText variant="body-bold" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {t('groups.siblingGroups')}
      </AppText>

      {isLoading ? (
        <Skeleton width="100%" height={48} borderRadius={18} />
      ) : (
        siblings.map((sibling) => (
          <View
            key={sibling.groupId}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            <AppText variant="body-semiBold" style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {sibling.groupName}
            </AppText>
            <AppText variant="heading-bold" style={[styles.steps, { color: colors.textPrimary }]}>
              {sibling.overallStats.totalSteps.toLocaleString()}
            </AppText>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  sectionTitle: { fontSize: 14, lineHeight: 17, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  name: { flex: 1, fontSize: 13, lineHeight: 15 },
  steps: { fontSize: 13, lineHeight: 15 },
});
