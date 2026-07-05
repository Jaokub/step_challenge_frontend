import { AppText } from '../../src/components';
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import {
  AppCard,
  PrimaryButton,
  StatusBadge,
  PointsBadge,
  AvatarCircle,
  LoadingScreen,
} from '../../src/components';
import { spacing, borderRadius, fontSize } from '../../src/constants/theme';
import activityService from '../../src/features/activity/activityService';
import type { Activity } from '../../src/types';
import { formatDate } from '../../src/utils/formatDate';

const { width } = Dimensions.get('window');

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { isAdmin } = useAuth();
  const { colors } = useTheme();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivity = useCallback(async () => {
    if (!id) return;
    try {
      const response = await activityService.getActivityById(id);
      if (response.success) {
        setActivity(response.data);
      }
    } catch (err) {
      console.warn('Activity fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivity();
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!activity) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <AppText style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('activities.title')}
          </AppText>
          <View style={{ width: 28 }} />
        </SafeAreaView>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
          <AppText style={[styles.errorText, { color: colors.textPrimary }]}>{t('activity.notFound')}</AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {activity.title}
        </AppText>
        {isAdmin ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/admin/edit-activity/${activity.id}`)}
          >
            <Ionicons name="create-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Banner Card / Top Hero Area */}
        <AppCard style={styles.heroCard}>
          <View style={styles.heroRow}>
            <StatusBadge status={activity.status} />
            <PointsBadge points={activity.points} size="md" />
          </View>
          <AppText style={[styles.activityTitle, { color: colors.textOnCard }]}>
            {activity.title}
          </AppText>
          {activity.isCheckedIn && (
            <View style={styles.checkedInRow}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              <AppText style={styles.checkedInText}>{t('activities.checkedIn')}</AppText>
            </View>
          )}
        </AppCard>

        {/* Details Card */}
        <AppCard style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight + '20' }]}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </View>
            <View style={styles.detailText}>
              <AppText style={[styles.detailLabel, { color: colors.textCardSecondary }]}>
                {t('activities.date')}
              </AppText>
              <AppText style={[styles.detailValue, { color: colors.textOnCard }]}>
                {t('activity.start')} {formatDate(activity.startDate, i18n.language, 'datetime')}
              </AppText>
              <AppText style={[styles.detailValue, { color: colors.textOnCard }]}>
                {t('activity.end')} {formatDate(activity.endDate, i18n.language, 'datetime')}
              </AppText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight + '20' }]}>
              <Ionicons name="location" size={20} color={colors.primary} />
            </View>
            <View style={styles.detailText}>
              <AppText style={[styles.detailLabel, { color: colors.textCardSecondary }]}>
                {t('activities.location')}
              </AppText>
              <AppText style={[styles.detailValue, { color: colors.textOnCard }]}>
                {activity.location}
              </AppText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight + '20' }]}>
              <Ionicons name="people" size={20} color={colors.primary} />
            </View>
            <View style={styles.detailText}>
              <AppText style={[styles.detailLabel, { color: colors.textCardSecondary }]}>
                {t('common.participants')}
              </AppText>
              <AppText style={[styles.detailValue, { color: colors.textOnCard }]}>
                {activity.participantCount ?? 0}
                {activity.maxParticipants ? ` / ${activity.maxParticipants} ${t('activity.people')}` : t('activity.participantsUncapped')}
              </AppText>
            </View>
          </View>
        </AppCard>

        {/* Description */}
        <AppText style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t('activities.description')}
        </AppText>
        <AppCard style={styles.descCard}>
          <AppText style={[styles.description, { color: colors.textOnCard }]}>
            {activity.description || t('activity.noDescription')}
          </AppText>
        </AppCard>

        {/* Organizer */}
        {activity.createdBy && (
          <>
            <AppText style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('activity.creator')}</AppText>
            <AppCard style={styles.organizerCard}>
              <AvatarCircle
                name={activity.createdBy.fullName}
                size={40}
                uri={activity.createdBy.avatarUrl}
              />
              <View style={styles.organizerInfo}>
                <AppText style={[styles.organizerName, { color: colors.textOnCard }]}>
                  {activity.createdBy.fullName}
                </AppText>
                <AppText style={[styles.organizerDept, { color: colors.textCardSecondary }]}>
                  {activity.createdBy.department}
                </AppText>
              </View>
            </AppCard>
          </>
        )}

        {/* Check-In CTA Button */}
        {activity.status === 'ONGOING' && !activity.isCheckedIn && (
          <PrimaryButton
            title={t('activities.checkIn')}
            onPress={() => router.push('/(tabs)/scan')}
            icon="qr-code"
            style={styles.ctaButton}
          />
        )}

        <View style={{ height: spacing['4xl'] }} />
      </ScrollView>
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
  editButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: fontSize.lg,
    marginTop: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  heroCard: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  activityTitle: {
    fontSize: fontSize.xl,
    lineHeight: 28,
  },
  checkedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    backgroundColor: 'rgba(76,175,80,0.12)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  checkedInText: {
    fontSize: fontSize.sm,
    color: '#4CAF50',
  },
  detailsCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  descCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: fontSize.sm,
  },
  organizerDept: {
    fontSize: fontSize.xs,
  },
  ctaButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
