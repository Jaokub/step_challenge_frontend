import { AppText } from '../src/components';
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import {
  AppCard,
  AvatarCircle,
  LeaderboardItem,
  EmptyState,
  LoadingScreen,
} from '../src/components';
import { spacing, borderRadius, fontSize } from '../src/constants/theme';
import userService from '../src/features/auth/userService';
import type { LeaderboardUser } from '../src/types';

const { width } = Dimensions.get('window');

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { colors } = useTheme();

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await userService.getLeaderboard({ limit: 50 });
      if (response.success) {
        // Backend returns: { success: true, data: { leaderboard: LeaderboardUser[], pagination: {...} } }
        // Let's verify and parse response.data.leaderboard
        const data = (response.data as any).leaderboard || response.data || [];
        setLeaderboard(data);
      }
    } catch (err) {
      console.warn('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const topThree = leaderboard.slice(0, 3);
  const restOfUsers = leaderboard.slice(3);

  // Helper to render podium column
  const renderPodiumColumn = (user: LeaderboardUser | undefined, rank: number) => {
    if (!user) {
      return <View style={styles.podiumColumnPlaceholder} />;
    }

    const isCurrent = user.id === currentUser?.id;
    let ringColor = '#CD7F32'; // Bronze
    let cardStyle = styles.rank3Card;
    let avatarSize = 56;
    let medal = '🥉';

    if (rank === 1) {
      ringColor = '#FFD700'; // Gold
      cardStyle = styles.rank1Card;
      avatarSize = 72;
      medal = '🥇';
    } else if (rank === 2) {
      ringColor = '#C0C0C0'; // Silver
      cardStyle = styles.rank2Card;
      avatarSize = 64;
      medal = '🥈';
    }

    return (
      <View style={styles.podiumColumn}>
        <AppText style={styles.podiumMedal}>{medal}</AppText>
        <AppCard
          style={[
            styles.podiumCard,
            cardStyle,
            isCurrent && { borderColor: colors.primary, borderWidth: 2 },
          ]}
        >
          <AvatarCircle
            name={user.fullName}
            size={avatarSize}
            uri={user.avatarUrl}
            ringColor={ringColor}
          />
          <AppText
            style={[styles.podiumName, { color: colors.textOnCard }]}
            numberOfLines={1}
          >
            {user.fullName}
          </AppText>
          <AppText
            style={[styles.podiumDept, { color: colors.textCardSecondary }]}
            numberOfLines={1}
          >
            {user.department}
          </AppText>
          <AppText style={[styles.podiumPoints, { color: colors.accent }]}>
            {user.totalPoints.toLocaleString()}
          </AppText>
          <AppText style={[styles.podiumLabel, { color: colors.textCardSecondary }]}>
            pts
          </AppText>
        </AppCard>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('leaderboard.title')}
        </AppText>
        <View style={{ width: 28 }} /> {/* Spacer */}
      </SafeAreaView>

      <FlatList
        data={restOfUsers}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          leaderboard.length > 0 ? (
            <View style={styles.podiumWrapper}>
              {/* Podium display: Rank 2 on left, Rank 1 in center, Rank 3 on right */}
              <View style={styles.podiumContainer}>
                {renderPodiumColumn(topThree[1], 2)}
                {renderPodiumColumn(topThree[0], 1)}
                {renderPodiumColumn(topThree[2], 3)}
              </View>
              {restOfUsers.length > 0 && (
                <AppText style={[styles.subTitle, { color: colors.textSecondary }]}>
                  {t('leaderboard.rank')} 4+
                </AppText>
              )}
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <LeaderboardItem
            rank={index + 4}
            user={{
              fullName: item.fullName,
              department: item.department,
              avatarUrl: item.avatarUrl,
              totalPoints: item.totalPoints,
            }}
            isCurrentUser={item.id === currentUser?.id}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="trophy-outline"
            title={t('leaderboard.noData')}
            subtitle="เริ่มเดินและเข้าร่วมกิจกรรมเพื่อสะสมแต้มเป็นคนแรก!"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    textAlign: 'center',
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  podiumWrapper: {
    marginBottom: spacing.lg,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  podiumColumn: {
    flex: 1,
    alignItems: 'center',
  },
  podiumColumnPlaceholder: {
    flex: 1,
  },
  podiumMedal: {
    fontSize: 26,
    marginBottom: spacing.xs,
  },
  podiumCard: {
    width: '100%',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  rank1Card: {
    height: 190,
    elevation: 4,
  },
  rank2Card: {
    height: 165,
  },
  rank3Card: {
    height: 150,
  },
  podiumName: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  podiumDept: {
    fontSize: 10,
    textAlign: 'center',
  },
  podiumPoints: {
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },
  podiumLabel: {
    fontSize: 10,
    marginTop: -2,
  },
  subTitle: {
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
});
