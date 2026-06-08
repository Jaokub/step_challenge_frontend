import { AppText } from '../../src/components';
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { PrimaryButton } from '../../src/components';
import { spacing, borderRadius, fontSize, gradients } from '../../src/constants/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) {
      setError(t('auth.emailRequired'));
      return;
    }
    if (!password) {
      setError(t('auth.passwordRequired'));
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (err: any) {
      const msg = err?.message || err?.data?.message || t('auth.invalidCredentials');
      setError(msg);
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
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View style={styles.iconCircle}>
                <Ionicons name="footsteps" size={48} color="#4A6CF7" />
              </View>
              <AppText style={styles.appTitle}>{t('auth.welcomeTitle')}</AppText>
              <AppText style={styles.appSubtitle}>{t('auth.welcomeSubtitle')}</AppText>
            </View>

            {/* Login Card */}
            <View style={styles.card}>
              <AppText style={styles.cardTitle}>{t('auth.login')}</AppText>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#FF5252" />
                  <AppText style={styles.errorText}>{error}</AppText>
                </View>
              ) : null}

              {/* Email Input */}
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
                  autoComplete="email"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.password')}
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <PrimaryButton
                title={t('auth.loginButton')}
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.loginButton}
              />
            </View>

            {/* Register Link */}
            <View style={styles.registerRow}>
              <AppText style={styles.registerText}>{t('auth.noAccount')} </AppText>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <AppText style={styles.registerLink}>{t('auth.registerHere')}</AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(74, 108, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  appTitle: {
    fontSize: fontSize['3xl'],
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  appSubtitle: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.6)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    color: '#1A1A2E',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,82,82,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: '#FF5252',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    paddingLeft: spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: '#1A1A2E',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  eyeButton: {
    paddingRight: spacing.lg,
    paddingVertical: spacing.lg,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
  },
  registerText: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.6)',
  },
  registerLink: {
    fontSize: fontSize.md,
    color: '#4A6CF7',
  },
});
