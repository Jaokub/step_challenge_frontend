import { AppText } from '../../src/components';
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/contexts/AuthContext';
import { PrimaryButton } from '../../src/components';
import { spacing, borderRadius, fontSize } from '../../src/constants/theme';

const DEPARTMENTS = [
  'วิศวกรรมคอมพิวเตอร์',
  'วิศวกรรมไฟฟ้า',
  'วิศวกรรมเครื่องกล',
  'วิศวกรรมโยธา',
  'วิศวกรรมอุตสาหกรรม',
  'วิศวกรรมเคมี',
  'วิศวกรรมสิ่งแวดล้อม',
  'วิศวกรรมสำรวจ',
  'วิศวกรรมโลหการ',
  'อื่นๆ',
];

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();

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

  return (
    <LinearGradient colors={['#0D0D2B', '#161637']} style={styles.container}>
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
              <View style={styles.iconCircle}>
                <Ionicons name="person-add" size={40} color="#4A6CF7" />
              </View>
              <AppText style={styles.appTitle}>{t('auth.register')}</AppText>
            </View>

            {/* Register Card */}
            <View style={styles.card}>
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#FF5252" />
                  <AppText style={styles.errorText}>{error}</AppText>
                </View>
              ) : null}

              {/* Full Name */}
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.fullName') || 'Full Name'}
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              {/* Nickname */}
              <View style={styles.inputContainer}>
                <Ionicons name="happy-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nickname (Optional)"
                  placeholderTextColor="#9CA3AF"
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.email')}
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Department Picker */}
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowDeptPicker(true)}
              >
                <Ionicons name="business-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <AppText style={[styles.input, !department && { color: '#9CA3AF' }]}>
                  {department || t('auth.department')}
                </AppText>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" style={styles.chevron} />
              </TouchableOpacity>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.password')}
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
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
              <AppText style={styles.loginText}>{t('auth.hasAccount')} </AppText>
              <TouchableOpacity onPress={() => router.back()}>
                <AppText style={styles.loginLink}>{t('auth.loginHere')}</AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Department Picker Modal */}
        <Modal visible={showDeptPicker} transparent animationType="slide">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowDeptPicker(false)}>
            <View style={styles.modalContent}>
              <AppText style={styles.modalTitle}>{t('auth.department')}</AppText>
              <FlatList
                data={DEPARTMENTS}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.deptItem, department === item && styles.deptItemActive]}
                    onPress={() => { setDepartment(item); setShowDeptPicker(false); }}
                  >
                    <AppText style={[styles.deptText, department === item && styles.deptTextActive]}>
                      {item}
                    </AppText>
                    {department === item && <Ionicons name="checkmark" size={20} color="#4A6CF7" />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
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
    backgroundColor: 'rgba(74, 108, 247, 0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  appTitle: { fontSize: fontSize['2xl'], color: '#FFFFFF' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,82,82,0.1)', borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.lg, gap: spacing.sm,
  },
  errorText: { fontSize: fontSize.sm, color: '#FF5252', flex: 1 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: borderRadius.lg,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: '#E5E7EB',
  },
  inputIcon: { paddingLeft: spacing.lg },
  input: {
    flex: 1, fontSize: fontSize.md, color: '#1A1A2E',
    paddingVertical: spacing.lg, paddingHorizontal: spacing.md,
  },
  eyeButton: { paddingRight: spacing.lg, paddingVertical: spacing.lg },
  chevron: { paddingRight: spacing.lg },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing['2xl'] },
  loginText: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.6)' },
  loginLink: { fontSize: fontSize.md, color: '#4A6CF7' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl, padding: spacing['2xl'], maxHeight: '60%',
  },
  modalTitle: { fontSize: fontSize.lg, color: '#1A1A2E',
    marginBottom: spacing.lg, textAlign: 'center',
  },
  deptItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md, marginBottom: spacing.xs,
  },
  deptItemActive: { backgroundColor: 'rgba(74, 108, 247, 0.1)' },
  deptText: { fontSize: fontSize.md, color: '#1A1A2E' },
  deptTextActive: { color: '#4A6CF7' },
});
