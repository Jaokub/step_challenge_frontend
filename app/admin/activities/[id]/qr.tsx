import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../../src/contexts/ThemeContext';
import { AppText, ScreenHeader, LoadingScreen, ErrorState } from '../../../../src/components';
import { spacing, fontSize, gradients } from '../../../../src/constants/theme';
import activityService from '../../../../src/features/activity/activityService';
import checkinService from '../../../../src/features/activity/checkinService';
import { queryKeys } from '../../../../src/constants/queryKeys';

export default function ActivityQrScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const { data: activity, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.activities.detail(id),
    queryFn: async () => {
      const res = await activityService.getActivityById(id);
      if (!res.success) throw new Error(res.message || t('admin.loadActivityError'));
      return res.data;
    },
    enabled: !!id,
  });

  const { data: checkinsResult } = useQuery({
    queryKey: queryKeys.activities.checkins(id),
    queryFn: async () => {
      const res = await checkinService.getCheckinsByActivity(id);
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    enabled: !!id,
    refetchInterval: 5000, // live-ish counter while this screen is open
  });

  const liveCount = checkinsResult?.totalCheckIns ?? activity?.participantCount ?? 0;

  const handleShare = async () => {
    if (!activity) return;
    try {
      await Share.share({ message: activity.qrCode });
    } catch {}
  };

  if (isPending) return <LoadingScreen message={t('common.loading')} />;

  if (error || !activity) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ErrorState title={t('admin.loadActivityError')} message={(error as any)?.message ?? ''} onRetry={refetch} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title={activity.title}
          pathSubtitle={`/admin/activities/${id}/qr`}
          backChip
          onBack={() => (router.canGoBack() ? router.back() : router.push('/admin/activities'))}
        />
      </SafeAreaView>

      <View style={styles.body}>
        <View style={[styles.qrCard, { backgroundColor: '#FFFFFF', borderColor: colors.cardBorder }]}>
          <QRCode value={activity.qrCode} size={220} color="#000000" backgroundColor="#FFFFFF" />
        </View>

        <View style={{ alignItems: 'center' }}>
          <AppText variant="body-bold" style={{ fontSize: fontSize.md, color: colors.textPrimary, textAlign: 'center' }}>
            {t('admin.qrSubtitle')}
          </AppText>
        </View>

        <LinearGradient
          colors={gradients.mint}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.liveCard, { borderColor: colors.primary + '2E' }]}
        >
          <AppText variant="heading-bold" style={{ fontSize: fontSize['2xl'], color: colors.textPrimary }}>
            {t('admin.qrLiveCount', { count: liveCount })}
          </AppText>
          <AppText style={{ fontSize: fontSize.sm, color: colors.primary, marginTop: 2 }}>
            {t('admin.qrLiveLabel')}
          </AppText>
        </LinearGradient>

        <View style={{ width: '100%', gap: spacing.sm }}>
          <TouchableOpacity
            style={[styles.viewAttendeesBtn, { backgroundColor: colors.textPrimary }]}
            onPress={() => router.push(`/admin/activities/${id}/attendees`)}
          >
            <AppText style={{ fontSize: fontSize.sm, fontWeight: '700' as any, color: colors.background }}>
              {t('admin.qrViewAttendees')}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
            <AppText style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{t('admin.qrShare')}</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    padding: spacing.xl,
  },
  qrCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: 'rgba(20,32,29,0.35)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
  },
  liveCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    borderRadius: 20,
    borderWidth: 1,
  },
  viewAttendeesBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
});
