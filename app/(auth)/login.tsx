import { AppText } from '../../src/components';
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { PrimaryButton, OutlineButton } from '../../src/components';
import { spacing, borderRadius, fontSize, shadows } from '../../src/constants/theme';
import { getGoogleIdToken } from '../../src/services/googleSignIn';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn, signInWithGoogle } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
      // Let the _layout or index handle redirection, or manually route:
      router.replace('/');
    } catch (err: any) {
      const msg = err?.message || err?.data?.message || t('auth.invalidCredentials');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const idToken = await getGoogleIdToken();
      const signedInUser = await signInWithGoogle(idToken);
      router.replace(signedInUser.department ? '/' : '/edit-profile');
    } catch (err: any) {
      const msg = err?.message || err?.data?.message || t('auth.googleSignInFailed');
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

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
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="footsteps" size={48} color={colors.primary} />
              </View>
              <AppText style={[styles.appTitle, { color: colors.textPrimary }]}>{t('auth.welcomeTitle')}</AppText>
              <AppText style={[styles.appSubtitle, { color: colors.textSecondary }]}>{t('auth.welcomeSubtitle')}</AppText>
            </View>

            {/* Login Card */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <AppText style={[styles.cardTitle, { color: colors.textOnCard }]}>{t('auth.login')}</AppText>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.error + '15' }]}>
                  <Ionicons name="alert-circle" size={18} color={colors.error} />
                  <AppText style={[styles.errorText, { color: colors.error }]}>{error}</AppText>
                </View>
              ) : null}

              {/* Email Input */}
              <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                <Ionicons name="mail-outline" size={20} color={colors.inputPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.inputText }]}
                  placeholder={t('auth.email')}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              {/* Password Input */}
              <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.inputPlaceholder} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.inputText }]}
                  placeholder={t('auth.password')}
                  placeholderTextColor={colors.inputPlaceholder}
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
                    color={colors.inputPlaceholder}
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

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
                <AppText style={[styles.dividerText, { color: colors.textSecondary }]}>{t('auth.orDivider')}</AppText>
                <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
              </View>

              {/* Google Sign-In */}
              <OutlineButton
                title={t('auth.continueWithGoogle')}
                onPress={handleGoogleSignIn}
                loading={googleLoading}
                disabled={googleLoading || loading}
              />
            </View>

            {/* Register Link */}
            <View style={styles.registerRow}>
              <AppText style={[styles.registerText, { color: colors.textSecondary }]}>{t('auth.noAccount')} </AppText>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <AppText style={[styles.registerLink, { color: colors.primary }]}>{t('auth.registerHere')}</AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  appTitle: {
    fontSize: fontSize['3xl'],
    marginBottom: spacing.xs,
  },
  appSubtitle: {
    fontSize: fontSize.md,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    borderWidth: 1,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  inputIcon: {
    paddingLeft: spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: fontSize.sm,
    marginHorizontal: spacing.md,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
  },
  registerText: {
    fontSize: fontSize.md,
  },
  registerLink: {
    fontSize: fontSize.md,
  },
});
