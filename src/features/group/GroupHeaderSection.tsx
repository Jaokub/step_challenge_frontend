import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { AppText, Skeleton, ScreenHeader } from '../../components';
import { spacing } from '../../constants/theme';
import { AppGroup } from '../../types';
import { LeaderboardMember, Podium } from '../friend/Podium';
import { RankSummaryCard } from '../friend/RankSummaryCard';
import { ModalType } from './GroupActionModals';

interface GroupHeaderSectionProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  groups: AppGroup[];
  requestsCount: number;
  setModalType: (type: ModalType) => void;
  handleShowGroupInvite: (groupId: string) => void;
  isLoadingData: boolean;
  myEntry?: LeaderboardMember;
  topThree: LeaderboardMember[];
  isGroupTab: boolean;
  accentColor: string;
}

export const GroupHeaderSection: React.FC<GroupHeaderSectionProps> = ({
  activeTab,
  setActiveTab,
  groups,
  requestsCount,
  setModalType,
  handleShowGroupInvite,
  isLoadingData,
  myEntry,
  topThree,
  isGroupTab,
  accentColor,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <>
      <ScreenHeader
        title={t('groups.friendsAndGroups')}
        rightActions={
          <>
            <TouchableOpacity onPress={() => setModalType('REQUESTS')} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              {requestsCount > 0 && (
                <View style={styles.badge}>
                  <AppText style={styles.badgeText}>{requestsCount}</AppText>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalType('JOIN')} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
              <Ionicons name="people-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/add-friend')} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
              <Ionicons name="person-add-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </>
        }
      />

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'friends' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.divider }
            ]}
            onPress={() => setActiveTab('friends')}
          >
            <AppText style={[styles.tabText, activeTab === 'friends' ? { color: '#fff' } : { color: colors.textPrimary }]}>
              {t('groups.friends')}
            </AppText>
          </TouchableOpacity>


          {groups.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[
                styles.tabPill,
                activeTab === g.id ? { backgroundColor: accentColor, borderColor: accentColor } : { backgroundColor: colors.card, borderColor: colors.divider }
              ]}
              onPress={() => setActiveTab(g.id)}
              onLongPress={() => handleShowGroupInvite(g.id)}
            >
              <AppText style={[styles.tabText, activeTab === g.id ? { color: '#1A1A2E' } : { color: colors.textPrimary }]}>
                {g.name}
              </AppText>
              {activeTab === g.id && (
                <Ionicons name="qr-code-outline" size={12} color="#1A1A2E" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.tabPill, { backgroundColor: colors.card, borderColor: colors.divider, paddingHorizontal: 12 }]}
            onPress={() => setModalType('CREATE')}
          >
            <Ionicons name="add" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {isLoadingData ? (
        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md }}>
          <Skeleton height={80} borderRadius={16} style={{ marginBottom: spacing.xl }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 180, marginBottom: spacing.xl }}>
            <Skeleton width="30%" height={120} borderRadius={16} />
            <Skeleton width="34%" height={160} borderRadius={16} />
            <Skeleton width="30%" height={100} borderRadius={16} />
          </View>
        </View>
      ) : (
        <>
          {myEntry && <RankSummaryCard member={myEntry} accentColor={accentColor} isGroupTab={isGroupTab} />}
          <Podium topThree={topThree} accentColor={accentColor} />
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  tabText: {
    fontSize: 13,
  },
});
