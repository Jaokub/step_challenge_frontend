import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../components';
import { spacing, borderRadius, layout, fontSize, gradients } from '../../constants/theme';

/**
 * Dashboard entry point into the Events (step-count competition) feature.
 * Kept self-contained so it can be dropped into the dashboard scroll without
 * touching the oversized DashboardComponents file.
 */
const EventsEntryCard: React.FC<{ colors: any }> = ({ colors }) => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/events')}>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="trophy" size={22} color={colors.onPrimary} />
          </View>
          <View style={styles.text}>
            <AppText variant="heading-bold" style={[styles.title, { color: colors.onPrimary }]}>
              {t('events.title')}
            </AppText>
            <AppText style={[styles.subtitle, { color: colors.onPrimary }]}>{t('events.entrySubtitle')}</AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.onPrimary} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: layout.screenPaddingX },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7, 32, 27, 0.12)',
  },
  text: { flex: 1 },
  title: { fontSize: fontSize.lg },
  subtitle: { fontSize: fontSize.sm, opacity: 0.8, marginTop: 2 },
});

export default EventsEntryCard;
