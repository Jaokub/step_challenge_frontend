import { AppText } from '../../src/components';
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { PrimaryButton } from '../../src/components';
import { spacing, borderRadius, fontSize, shadows } from '../../src/constants/theme';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const { colors } = useTheme();

  const DEPARTMENTS = [
    t('auth.deptComputer'),
    t('auth.deptElectrical'),
    t('auth.deptMechanical'),
    t('auth.deptCivil'),
    t('auth.deptIndustrial'),
    t('auth.deptChemical'),
    t('auth.deptEnvironmental'),
    t('auth.deptSurvey'),
    t('auth.deptMetallurgical'),
    t('auth.deptOther'),
  ];

  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!fullName.trim()) { setError(t('auth.nameRequired')); return; }
    if (!email.trim()) { setError(t('auth.emailRequired')); return; }
    if (!department) { setError(t('auth.departmentRequired')); return; }
    if (!password) { setError(t('auth.passwordRequired')); return; }

    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, fullName.trim(), nickname.trim(), department);
    } catch (err: any) {
      setError(err?.message || err?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const inputContainerStyle = [
    styles.inputContainer,
    { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoSection}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="person-add" size={40} color={colors.primary} />
              </View>
              <AppText style={[styles.appTitle, { color: colors.textPrimary }]}>{t('auth.register')}</AppText>
            </View>

            {/* Register Card */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.error + '15' }]}>
                  <Ionicons name="alert-circle" size={18} color={colors.error} />
                  <AppText style={[styles.errorText, { color: colors.error }]}>{error}</AppText>
                </View>
              ) : null}

              {/* Full Name */}
              <View style={inputContainerStyle}>
                <Ionicons name="person-outline" size={20} color={colors.inputPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.inputText }]}
                  placeholder={t('auth.fullName') || 'Full Name'}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              {/* Nickname */}
              <View style={inputContainerStyle}>
                <Ionicons name="happy-outline" size={20} color={colors.inputPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.inputText }]}
                  placeholder={t('auth.nicknameOptional')}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>

              {/* Email */}
              <View style={inputContainerStyle}>
                <Ionicons name="mail-outline" size={20} color={colors.inputPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.inputText }]}
                  placeholder={t('auth.email')}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Department Picker */}
              <TouchableOpacity
                style={inputContainerStyle}
                onPress={() => setShowDeptPicker(true)}
              >
                <Ionicons name="business-outline" size={20} color={colors.inputPlaceholder} style={styles.inputIcon} />
                <AppText style={[styles.input, { color: department ? colors.inputText : colors.inputPlaceholder }]}>
                  {department || t('auth.department')}
                </AppText>
                <Ionicons name="chevron-down" size={20} color={colors.inputPlaceholder} style={styles.chevron} />
              </TouchableOpacity>

              {/* Password */}
              <View style={inputContainerStyle}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.inputPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.inputText }]}
                  placeholder={t('auth.password')}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inputPlaceholder} />
                </TouchableOpacity>
              </View>

              <PrimaryButton
                title={t('auth.registerButton')}
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={{ marginTop: spacing.sm }}
              />
            </View>

            {/* Login Link */}
            <View style={styles.loginRow}>
              <AppText style={[styles.loginText, { color: colors.textSecondary }]}>{t('auth.hasAccount')} </AppText>
              <TouchableOpacity onPress={() => router.back()}>
                <AppText style={[styles.loginLink, { color: colors.primary }]}>{t('auth.loginHere')}</AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Department Picker Modal */}
        <Modal visible={showDeptPicker} transparent animationType="slide">
          <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setShowDeptPicker(false)}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <AppText style={[styles.modalTitle, { color: colors.textOnCard }]}>{t('auth.department')}</AppText>
              <FlatList
                data={DEPARTMENTS}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.deptItem, department === item && { backgroundColor: colors.primary + '15' }]}
                    onPress={() => { setDepartment(item); setShowDeptPicker(false); }}
                  >
                    <AppText style={[styles.deptText, { color: department === item ? colors.primary : colors.textOnCard }]}>
                      {item}
                    </AppText>
                    {department === item && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  logoSection: { alignItems: 'center', marginBottom: spacing['3xl'] },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  appTitle: { fontSize: fontSize['2xl'] },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    borderWidth: 1,
    ...shadows.card,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.lg, gap: spacing.sm,
  },
  errorText: { fontSize: fontSize.sm, flex: 1 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg, borderWidth: 1,
  },
  inputIcon: { paddingLeft: spacing.lg },
  input: {
    flex: 1, fontSize: fontSize.md,
    paddingVertical: spacing.lg, paddingHorizontal: spacing.md,
  },
  eyeButton: { paddingRight: spacing.lg, paddingVertical: spacing.lg },
  chevron: { paddingRight: spacing.lg },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing['2xl'] },
  loginText: { fontSize: fontSize.md },
  loginLink: { fontSize: fontSize.md },
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl, padding: spacing['2xl'], maxHeight: '60%',
  },
  modalTitle: { fontSize: fontSize.lg,
    marginBottom: spacing.lg, textAlign: 'center',
  },
  deptItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md, marginBottom: spacing.xs,
  },
  deptText: { fontSize: fontSize.md },
});
