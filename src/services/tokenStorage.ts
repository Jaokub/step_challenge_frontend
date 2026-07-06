/**
 * Token storage — single place that decides WHERE auth tokens live.
 *
 * Currently backed by AsyncStorage (plaintext). To upgrade to the device
 * keychain/keystore:
 *
 *   1. npx expo install expo-secure-store
 *   2. Rebuild the dev client (native module): npx expo prebuild && npx expo run:android / run:ios
 *   3. Uncomment the three SECURE-STORE blocks below and delete the
 *      AsyncStorage implementations they replace.
 *
 * (The import is kept commented out so Metro doesn't fail to resolve the
 * module before it's installed.)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
// SECURE-STORE: uncomment after installing expo-secure-store
// import * as SecureStore from 'expo-secure-store';
// import { Platform } from 'react-native';

/** AsyncStorage key for the JWT access token */
export const TOKEN_KEY = '@step_challenge_access_token';

/** AsyncStorage key for the JWT refresh token */
export const REFRESH_TOKEN_KEY = '@step_challenge_refresh_token';

// SecureStore keys must be alphanumeric/._- only (no '@'), so map them:
// const secureKey = (key: string) => key.replace('@', '');

export const getToken = async (key: string): Promise<string | null> => {
  // SECURE-STORE:
  // if (Platform.OS !== 'web') return SecureStore.getItemAsync(secureKey(key));
  return AsyncStorage.getItem(key);
};

export const setToken = async (key: string, value: string): Promise<void> => {
  // SECURE-STORE:
  // if (Platform.OS !== 'web') return SecureStore.setItemAsync(secureKey(key), value);
  await AsyncStorage.setItem(key, value);
};

export const clearTokens = async (): Promise<void> => {
  // SECURE-STORE:
  // if (Platform.OS !== 'web') {
  //   await Promise.all([
  //     SecureStore.deleteItemAsync(secureKey(TOKEN_KEY)),
  //     SecureStore.deleteItemAsync(secureKey(REFRESH_TOKEN_KEY)),
  //   ]);
  //   return;
  // }
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
};
