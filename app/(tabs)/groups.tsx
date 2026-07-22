import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useToast } from '../../src/contexts/ToastContext';
import { useGroups } from '../../src/features/group/useGroups';
import { AppText, ScreenHeader, EmptyState, Skeleton, CustomModal, PrimaryButton } from '../../src/components';
import { spacing, fontSize, borderRadius, gradients } from '../../src/constants/theme';
import type { AppGroup } from '../../src/types';

const GROUP_CAP = 3;

/**
 * Accept either a raw invite code or a pasted invite link and pull out the
 * code. Supports `?inviteCode=` / `?code=` query params, or falls back to
 * the last path segment for any other link shape — otherwise the whole
 * input is treated as the code itself.
 */
function extractInviteCode(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('://')) {
    try {
      const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
      const fromQuery = url.searchParams.get('inviteCode') || url.searchParams.get('code');
      if (fromQuery) return fromQuery.toUpperCase();
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length) return segments[segments.length - 1].toUpperCase();
    } catch {
      // Not a parseable URL — fall through and treat as a plain code.
    }
  }
  return trimmed.toUpperCase();
}

// Groups tab (mockup frame 11 "My Groups") — now the Groups tab root itself
// (no back arrow, per ScreenHeader's optional onBack), since Friends & Groups
// was split into separate tabs. Each card gets Ranking (-> per-group podium
// at /group/[id]/ranking) and Overview (-> the existing /group/[id] detail
// page) buttons, replacing the old whole-card tap.
export default function GroupsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { groups, isLoading, isRefreshing, handleRefresh, handleJoinGroup, isSubmitting } = useGroups(true);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteInput, setInviteInput] = useState('');

  const ownedCount = groups.filter((g) => g.myRole === 'OWNER').length;
  const atCap = ownedCount >= GROUP_CAP;

  const closeJoinModal = () => {
    setShowJoinModal(false);
    setInviteInput('');
  };

  const submitJoin = async () => {
    if (!inviteInput.trim()) return;
    try {
      await handleJoinGroup(extractInviteCode(inviteInput), () => {
        showToast(t('groups.joinGroupSuccess'), 'success');
        closeJoinModal();
      });
    } catch (error: any) {
      showToast(error?.message || t('common.error'), 'error');
    }
  };

  const renderItem = ({ item }: { item: AppGroup }) => {
    const isCoordinator = item.myRole === 'OWNER';
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.cardTop}>
          <AppText variant="body-bold" style={{ flex: 1, fontSize: fontSize.md, color: colors.textPrimary }} numberOfLines={1}>
            {item.name}
          </AppText>
          {isCoordinator && (
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coordBadge}>
              <AppText style={{ fontSize: 10, fontWeight: '700' as any, color: colors.onPrimary }}>
                {t('groups.coordinatorBadge')}
              </AppText>
            </LinearGradient>
          )}
        </View>
        <AppText style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
          {t('groups.memberCountLabel', { count: item.memberCount ?? 0 })}
        </AppText>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.rankingBtn, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}
            onPress={() => router.push(`/group/${item.id}/ranking?name=${encodeURIComponent(item.name)}`)}
            activeOpacity={0.85}
          >
            <Ionicons name="trophy-outline" size={14} color={colors.textPrimary} />
            <AppText style={{ fontSize: 13, fontWeight: '700' as any, color: colors.textPrimary }}>
              {t('groups.rankingAction')}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.overviewBtn, { backgroundColor: colors.textPrimary }]}
            onPress={() => router.push(`/group/${item.id}`)}
            activeOpacity={0.85}
          >
            <AppText style={{ fontSize: 13, fontWeight: '700' as any, color: colors.background }}>
              {t('groups.overviewAction')}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader title={t('groups.myGroups')} titleSize={21} />
      </SafeAreaView>

      <View style={styles.ctaWrap}>
        {atCap ? (
          <View style={[styles.ctaDisabled, { backgroundColor: colors.inputBackground }]}>
            <AppText style={{ fontSize: fontSize.sm, fontWeight: '700' as any, color: colors.textSecondary, textAlign: 'center' }}>
              {t('groups.createGroupCapFull')}
            </AppText>
          </View>
        ) : (
          <TouchableOpacity onPress={() => router.push('/group/create')}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
              <AppText style={{ fontSize: fontSize.sm, fontWeight: '700' as any, color: colors.onPrimary }}>
                {t('groups.createGroupCapPill', { count: ownedCount })}
              </AppText>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.joinCta, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}
          onPress={() => setShowJoinModal(true)}
        >
          <Ionicons name="key-outline" size={16} color={colors.textPrimary} />
          <AppText style={{ fontSize: fontSize.sm, fontWeight: '700' as any, color: colors.textPrimary }}>
            {t('groups.joinGroup')}
          </AppText>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton width="100%" height={104} borderRadius={20} />
          <Skeleton width="100%" height={104} borderRadius={20} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={t('groups.myGroupsEmptyTitle')}
              subtitle={t('groups.myGroupsEmptySubtitle')}
            />
          }
        />
      )}

      <CustomModal
        visible={showJoinModal}
        onClose={closeJoinModal}
        title={t('groups.joinGroup')}
        description={t('groups.joinGroupModalDesc')}
      >
        <TextInput
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.inputBorder }]}
          placeholder={t('groups.inviteCodeOrLinkPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={inviteInput}
          onChangeText={setInviteInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <PrimaryButton
          title={isSubmitting ? t('common.loading') : t('groups.joinGroup')}
          onPress={submitJoin}
          disabled={isSubmitting || !inviteInput.trim()}
        />
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  ctaWrap: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: spacing.sm },
  cta: { paddingVertical: 11, borderRadius: 14, alignItems: 'center' },
  ctaDisabled: { paddingVertical: 11, borderRadius: 14, alignItems: 'center' },
  joinCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  input: {
    fontSize: fontSize.md,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'], gap: spacing.md },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: spacing.xs },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  coordBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  rankingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  overviewBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
});
