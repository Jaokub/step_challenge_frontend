/**
 * Thin wrapper around the native Google Sign-In module — single import
 * point so the rest of the app never touches `@react-native-google-signin`
 * directly (same facade pattern as src/services/health).
 *
 * NOTE: this is a native module. It requires a new EAS dev-client build
 * (won't work in Expo Go) and EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to be set —
 * see PROGRESS.md.
 */
import { GoogleSignin } from '@react-native-google-signin/google-signin';

let isConfigured = false;

function ensureConfigured() {
  if (isConfigured) return;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  isConfigured = true;
}

/**
 * Runs the native Google Sign-In flow and returns the ID token to send to
 * POST /auth/google. Throws if the user cancels, Play Services are
 * unavailable, or no ID token comes back — callers should catch and show
 * an error toast rather than let this bubble to a crash screen.
 */
export async function getGoogleIdToken(): Promise<string> {
  ensureConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken;
  if (!idToken) {
    throw new Error('Google sign-in did not return an ID token.');
  }
  return idToken;
}
