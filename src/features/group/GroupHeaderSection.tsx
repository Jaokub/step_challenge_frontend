import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { AppText, ScreenHeader } from '../../components';
import { spacing, gradients } from '../../constants/theme';
import { AppGroup } from '../../types';

interface Pill {
  key: string;
  label: string;
}

interface GroupHeaderSectionProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  groups: AppGroup[];
  requestsCount: number;
  onOpenRequests: () => void;
}

// Mockup frame 10 header: 3 icons only — my groups (new in v4, links to
// frame 11), notifications, add-friend. The pre-existing "join by invite
// code" icon has no home in this mockup (joining is via shared invite link
// elsewhere); it's dropped here rather than kept as an unrequested 4th icon
// — see PROGRESS.md for the flagged gap. The JOIN modal/hook code itself is
// untouched so it can be wired to a real entry point later.
export const GroupHeaderSection: React.FC<GroupHeaderSectionProps> = ({
  activeTab,
  setActiveTab,
  groups,
  requestsCount,
  onOpenRequests,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const pills: Pill[] = [
    { key: 'friends', label: t('groups.friends') },
    ...groups.map((g) => ({ key: g.id, label: g.name })),
  ];

  return (
    <>
      <ScreenHeader
        title={t('groups.friendsAndGroups')}
        titleSize={20}
        rightActions={
          <>
            <TouchableOpacity
              onPress={() => router.push('/group/my-groups')}
              style={[styles.iconBtn, { backgroundColor: colors.inputBackground }]}
              accessibilityLabel={t('groups.myGroups')}
            >
              <Ionicons name="grid-outline" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onOpenRequests}
              style={[styles.iconBtn, { backgroundColor: colors.inputBackground }]}
              accessibilityLabel={t('groups.friendRequests')}
            >
              <Ionicons name="notifications-outline" size={16} color={colors.textPrimary} />
              {requestsCount > 0 && (
                <View style={styles.badge}>
                  <AppText style={styles.badgeText}>{requestsCount}</AppText>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/add-friend')}
              style={[styles.iconBtn, { backgroundColor: colors.inputBackground }]}
              accessibilityLabel={t('friend.addFriend')}
            >
              <Ionicons name="person-add-outline" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </>
        }
      />

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {pills.map((pill) => {
            const active = activeTab === pill.key;
            return active ? (
              <LinearGradient
                key={pill.key}
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tabPill}
              >
                <TouchableOpacity onPress={() => setActiveTab(pill.key)}>
                  <AppText style={[styles.tabText, { color: colors.onPrimary }]}>{pill.label}</AppText>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                key={pill.key}
                style={[styles.tabPill, { backgroundColor: colors.inputBackground }]}
                onPress={() => setActiveTab(pill.key)}
              >
                <AppText style={[styles.tabText, { color: colors.textSecondary }]}>{pill.label}</AppText>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.addPill, { backgroundColor: colors.inputBackground }]}
            onPress={() => router.push('/group/create')}
            accessibilityLabel={t('groups.createGroupTitle')}
          >
            <Ionicons name="add" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabsContainer: {
    marginBottom: spacing.md,
  },
  tabsScroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  addPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
