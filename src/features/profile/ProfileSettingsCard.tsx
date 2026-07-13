import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText, SettingsRow, SegmentedToggle, SwitchToggle } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize, borderRadius, shadows } from '../../constants/theme';

interface ProfileSettingsCardProps {
  isAdmin: boolean;
  showAppleHealthSync: boolean;
  onCopySyncToken: () => void;
}

const PlainRow: React.FC<{ label: string; onPress?: () => void; children: React.ReactNode }> = ({
  label,
  onPress,
  children,
}) => {
  const { colors } = useTheme();
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper activeOpacity={0.6} onPress={onPress} style={styles.plainRow}>
      <AppText style={[styles.plainLabel, { color: colors.textOnCard }]}>{label}</AppText>
      {children}
    </Wrapper>
  );
};

const Divider: React.FC = () => {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.divider }]} />;
};

/**
 * Settings menu — top block mirrors the mockup exactly (compact segmented
 * toggles for ภาษา/ธีม, a switch for การแจ้งเตือน, and a chevron row into the
 * full /settings screen). The functional rows that don't appear in the
 * mockup (admin panel, Apple Health sync, privacy, help) are kept below in
 * the app's existing icon-row style so nothing is lost — see profile.tsx.
 */
export const ProfileSettingsCard: React.FC<ProfileSettingsCardProps> = ({
  isAdmin,
  showAppleHealthSync,
  onCopySyncToken,
}) => {
  const { t, i18n } = useTranslation();
  const { colors, isDark, toggleTheme } = useTheme();
  const [notifOn, setNotifOn] = useState(true);

  const langIndex: 0 | 1 = i18n.language === 'th' ? 0 : 1;
  const themeIndex: 0 | 1 = isDark ? 0 : 1;
  const hasExtraRows = isAdmin || showAppleHealthSync;

  return (
    <View>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder, shadowColor: colors.cardShadow },
        ]}
      >
        <PlainRow label={t('profile.languageLabel')}>
          <SegmentedToggle
            options={[t('profile.langThai'), t('profile.langEn')]}
            selectedIndex={langIndex}
            onChange={(index) => i18n.changeLanguage(index === 0 ? 'th' : 'en')}
          />
        </PlainRow>
        <Divider />
        <PlainRow label={t('profile.themeLabel')}>
          <SegmentedToggle
            options={[t('profile.dark'), t('profile.light')]}
            selectedIndex={themeIndex}
            onChange={() => toggleTheme()}
          />
        </PlainRow>
        <Divider />
        <PlainRow label={t('profile.notification')}>
          <SwitchToggle value={notifOn} onValueChange={setNotifOn} />
        </PlainRow>
        <Divider />
        <PlainRow label={t('profile.accountSettings')} onPress={() => router.push('/settings')}>
          <Ionicons name="chevron-forward" size={18} color={colors.textCardSecondary} />
        </PlainRow>
      </View>

      {hasExtraRows && (
        <View
          style={[
            styles.extraCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder, shadowColor: colors.cardShadow },
          ]}
        >
          {isAdmin && (
            <SettingsRow
              icon="shield-half-outline"
              label={t('profile.adminPanel')}
              onPress={() => router.push('/admin/dashboard')}
            />
          )}
          {showAppleHealthSync && (
            <SettingsRow icon="fitness-outline" label="Connect Apple Health" onPress={onCopySyncToken} />
          )}
          <SettingsRow icon="lock-closed-outline" label={t('profile.privacy')} onPress={() => {}} />
          <SettingsRow icon="help-circle-outline" label={t('profile.help')} onPress={() => {}} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    ...shadows.card,
  },
  extraCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  plainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  plainLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
  },
});

export default ProfileSettingsCard;
