import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { AppText, AvatarCircle, PointsBadge } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { gradients, dashboardAccents, spacing } from '../../constants/theme';
import type { User } from '../../types';

interface ProfileHeaderCardProps {
  profile: User | null;
  stats: { totalGroups: number; totalActivities: number; totalCheckIns: number };
}

/**
 * Top profile card — avatar/name/email/points + groups/activities/check-ins
 * mini stats. Uses the same mint-tinted gradient as the dashboard goal card
 * (mockup: linear-gradient(150deg,#15332e,#131a1c) dark / (#e3f6ef,#f0f8dd) light).
 */
export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({ profile, stats }) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const cardGradient = isDark ? gradients.goalCard : gradients.goalCardLight;
  const borderColor = dashboardAccents.goalCardBorder[isDark ? 'dark' : 'light'];
  const name = profile?.nickname || profile?.fullName || 'User';

  return (
    <LinearGradient
      colors={cardGradient}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.card, { borderColor }]}
    >
      <View style={styles.top}>
        <AvatarCircle uri={profile?.avatarUrl} name={name} size={66} ringColor={colors.primary} />
        <View style={styles.info}>
          <AppText variant="heading-sm" style={[styles.name, { color: colors.textPrimary }]}>
            {name}
          </AppText>
          <AppText style={[styles.email, { color: colors.textSecondary }]}>{profile?.email || ''}</AppText>
          <View style={{ marginTop: spacing.sm }}>
            <PointsBadge points={profile?.totalPoints || 0} size="sm" />
          </View>
        </View>
      </View>

      <View style={[styles.statsRow, { borderTopColor: borderColor }]}>
        <View style={styles.statItem}>
          <AppText variant="numeric" style={[styles.statValue, { color: colors.textPrimary }]}>
            {stats.totalGroups}
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.groups')}</AppText>
        </View>
        <View style={styles.statItem}>
          <AppText variant="numeric" style={[styles.statValue, { color: colors.textPrimary }]}>
            {stats.totalActivities}
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.activities')}</AppText>
        </View>
        <View style={styles.statItem}>
          <AppText variant="numeric" style={[styles.statValue, { color: colors.textPrimary }]}>
            {stats.totalCheckIns}
          </AppText>
          <AppText style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile.checkins')}</AppText>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    borderWidth: 1,
    padding: spacing.xl,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: 20,
  },
  email: {
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default ProfileHeaderCard;
