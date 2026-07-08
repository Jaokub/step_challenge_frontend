import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, GroupCard } from '../../components';
import { spacing, fontSize } from '../../constants/theme';
import type { ChildGroupRef } from '../../types';

// Parent-only section: department groups under this Faculty group. Tapping
// one opens the read-only descendant overview (own full ranking), not the
// full group-detail screen — the parent isn't a member of the child group,
// so member-management actions (QR invite, leave, delete) don't apply.
interface GroupDescendantsSectionProps {
  childGroups: ChildGroupRef[];
}

export const GroupDescendantsSection: React.FC<GroupDescendantsSectionProps> = ({ childGroups }) => {
  const { t } = useTranslation();
  const router = useRouter();

  if (childGroups.length === 0) return null;

  return (
    <View style={styles.container}>
      <AppText variant="body-bold" style={styles.sectionTitle}>
        {t('groups.departmentGroups')}
      </AppText>
      {childGroups.map((child) => (
        <GroupCard
          key={child.id}
          group={{ id: child.id, name: child.name, memberCount: child.memberCount }}
          onPress={() => router.push(`/group/overview/${child.id}?name=${encodeURIComponent(child.name)}`)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md, paddingHorizontal: spacing.xl },
  sectionTitle: { fontSize: fontSize.md, marginBottom: spacing.md },
});
