import { useTranslation } from 'react-i18next';
import AppText from './AppText';
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, fontSize, spacing } from '../constants/theme';

interface LeaderboardUser {
  fullName: string;
  department: string;
  avatarUrl?: string;
  totalPoints: number;
}

interface LeaderboardItemProps {
  rank: number;
  user: LeaderboardUser;
  isCurrentUser?: boolean;
  onPress?: () => void;
  index?: number;
}

const getMedalEmoji = (rank: number): string | null => {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return null;
  }
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({
  rank,
  user,
  isCurrentUser = false,
  onPress,
  index,
}) => {
  const { colors } = useTheme();
  const medal = getMedalEmoji(rank);
  const delay = (index !== undefined ? index : rank - 1) * 100;

  const containerStyle = [
    styles.container,
    {
      backgroundColor: isCurrentUser
        ? colors.primary + '15'
        : colors.card,
      borderColor: isCurrentUser ? colors.primary : colors.cardBorder,
    },
  ];

  const content = (
    <>
      {/* Rank */}
      <View style={styles.rankContainer}>
        {medal ? (
          <AppText style={styles.medal}>{medal}</AppText>
        ) : (
          <AppText style={[styles.rank, { color: colors.textCardSecondary }]}>
            {rank}
          </AppText>
        )}
      </View>

      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: colors.primaryLight + '30',
          },
        ]}
      >
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <AppText style={[styles.initials, { color: colors.primary }]}>
            {getInitials(user.fullName)}
          </AppText>
        )}
      </View>

      {/* User info */}
      <View style={styles.info}>
        <AppText
          style={[
            styles.name,
            {
              color: isCurrentUser ? colors.primary : colors.textOnCard,
            },
          ]}
          numberOfLines={1}
        >
          {user.fullName}
          {isCurrentUser ? ' (You)' : ''}
        </AppText>
        <AppText
          style={[styles.department, { color: colors.textCardSecondary }]}
          numberOfLines={1}
        >
          {user.department}
        </AppText>
      </View>

      {/* Points */}
      <View style={styles.pointsContainer}>
        <AppText style={[styles.points, { color: colors.accent }]}>
          {user.totalPoints.toLocaleString()}
        </AppText>
        <AppText style={[styles.pointsLabel, { color: colors.textCardSecondary }]}>
          pts
        </AppText>
      </View>
    </>
  );

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  if (onPress) {
    return (
      <AnimatedTouchable
        activeOpacity={0.7}
        onPress={onPress}
        style={containerStyle}
        entering={FadeInDown.delay(delay).springify().damping(14)}
      >
        {content}
      </AnimatedTouchable>
    );
  }

  return (
    <Animated.View 
      style={containerStyle} 
      entering={FadeInDown.delay(delay).springify().damping(14)}
    >
      {content}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medal: {
    fontSize: 22,
  },
  rank: {
    fontSize: fontSize.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  initials: {
    fontSize: fontSize.sm,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
  },
  department: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  points: {
    fontSize: fontSize.lg,
  },
  pointsLabel: {
    fontSize: fontSize.xs,
  },
});

export default LeaderboardItem;
