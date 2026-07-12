import { AppText } from '../src/components';
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { AppCard, SettingsRow, ThemeToggle } from '../src/components';
import { spacing, fontSize } from '../src/constants/theme';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const { signOut, isAdmin } = useAuth();

  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const newLang = currentLang === 'th' ? 'en' : 'th';
    i18n.changeLanguage(newLang);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <AppText style={[styles.title, { color: colors.textPrimary }]}>{t('settings.title')}</AppText>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account */}
        <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.account', 'Account')}
        </AppText>
        <AppCard style={styles.card}>
          <SettingsRow
            icon="person"
            label="Edit Profile & Password"
            onPress={() => router.push('/edit-profile')}
          />
        </AppCard>

        {/* Appearance */}
        <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.appearance')}
        </AppText>
        <AppCard style={styles.card}>
          <View style={styles.themeRow}>
            <View style={styles.themeLabel}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
              <AppText style={[styles.themeLabelText, { color: colors.textPrimary }]}>
                {isDark ? t('settings.darkMode') : t('settings.lightMode')}
              </AppText>
            </View>
            <ThemeToggle />
          </View>
        </AppCard>

        {/* Language */}
        <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.language')}
        </AppText>
        <AppCard style={styles.card}>
          <SettingsRow
            icon="globe"
            label={t('settings.language')}
            value={currentLang === 'th' ? 'ไทย' : 'English'}
            onPress={toggleLanguage}
          />
        </AppCard>

        {/* Admin Panel (admins only) */}
        {isAdmin && (
          <>
            <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Admin Management
            </AppText>
            <AppCard style={styles.card}>
              <SettingsRow
                icon="shield-checkmark"
                label="Admin Dashboard"
                onPress={() => router.push('/admin/dashboard')}
              />
            </AppCard>
          </>
        )}

        {/* About */}
        <AppText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('settings.about')}
        </AppText>
        <AppCard style={styles.card}>
          <SettingsRow
            icon="information-circle"
            label={t('settings.version')}
            value="1.0.0"
          />
        </AppCard>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.card, borderColor: colors.error + '33' }]}
          onPress={async () => {
            await signOut();
            // /settings is a root-level modal with no auth guard, so unlike the
            // profile tab it won't auto-redirect on logout — send to login explicitly.
            router.replace('/(auth)/login');
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <AppText style={[styles.logoutText, { color: colors.error }]}>{t('Logout')}</AppText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  title: { fontSize: fontSize.lg },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'] },
  sectionTitle: { fontSize: fontSize.sm,
    marginTop: spacing.xl, marginBottom: spacing.sm, paddingLeft: spacing.xs,
  },
  card: { padding: spacing.sm },
  themeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  themeLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  themeLabelText: { fontSize: fontSize.md },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginTop: spacing.xl, paddingVertical: spacing.md,
    borderRadius: spacing.md, borderWidth: 1,
  },
  logoutText: { fontSize: fontSize.md, fontWeight: '600' },
});
