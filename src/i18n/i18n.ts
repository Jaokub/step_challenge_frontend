import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import th from './locales/th.json';
import en from './locales/en.json';

const LANGUAGE_KEY = '@step_challenge_language';

// Language detector that reads from AsyncStorage
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
      callback(savedLang || 'th');
    } catch {
      callback('th');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch {
      // Silently fail
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      th: { translation: th },
      en: { translation: en },
    },
    fallbackLng: 'th',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
export { LANGUAGE_KEY };
