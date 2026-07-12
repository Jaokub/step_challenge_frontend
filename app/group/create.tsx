import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useToast } from '../../src/contexts/ToastContext';
import { useGroups } from '../../src/features/group/useGroups';
import { AppText, ScreenHeader } from '../../src/components';
import { spacing, fontSize, gradients } from '../../src/constants/theme';

// Mockup frame 12 — mirrors create-activity's form pattern but kept local to
// the group feature slice rather than importing the admin form components.
export default function CreateGroupScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { handleCreateGroup, isSubmitting } = useGroups(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast(t('groups.groupNameRequired'), 'error');
      return;
    }
    try {
      await handleCreateGroup(name, description, () => {
        showToast(t('groups.createGroupSubmit'), 'success');
        setTimeout(() => (router.canGoBack() ? router.back() : router.push('/(tabs)/groups')), 600);
      });
    } catch (error: any) {
      showToast(error?.message || t('common.error'), 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title={t('groups.createGroupTitle')}
          titleSize={17}
          pathSubtitle="/group/create"
          backChip
          onBack={() => (router.canGoBack() ? router.back() : router.push('/(tabs)/groups'))}
        />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <AppText variant="body-bold" style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
            {t('groups.groupName')}
          </AppText>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
            value={name}
            onChangeText={setName}
            placeholder={t('groups.groupNamePlaceholder')}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <AppText variant="body-bold" style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
            {t('groups.groupDescription')}
          </AppText>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.textPrimary }]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('groups.groupDescriptionPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.noteBox, { backgroundColor: colors.primary + '0F' }]}>
          <AppText style={{ fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 17 }}>
            {t('groups.coordinatorNote')}
          </AppText>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: colors.inputBackground }]}
            onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)/groups'))}
            disabled={isSubmitting}
          >
            <AppText style={{ fontSize: fontSize.md, fontWeight: '700' as any, color: colors.textPrimary }}>
              {t('common.cancel')}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, opacity: isSubmitting ? 0.6 : 1 }} onPress={handleSubmit} disabled={isSubmitting}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
              <AppText style={{ fontSize: fontSize.md, fontWeight: '700' as any, color: colors.onPrimary }}>
                {isSubmitting ? t('groups.creatingGroup') : t('groups.createGroupSubmit')}
              </AppText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  field: { marginBottom: spacing.lg },
  input: {
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: fontSize.sm,
  },
  textArea: { minHeight: 80 },
  noteBox: { borderRadius: 14, padding: spacing.md, marginBottom: spacing.sm },
  btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
  },
  submitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
  },
});
