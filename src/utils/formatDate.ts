/**
 * Shared date formatting so every screen renders dates the same way for a
 * given app language, instead of each screen hardcoding its own locale/style.
 */

export type DateStyle = 'short' | 'long' | 'weekday' | 'datetime';

const LOCALE: Record<'en' | 'th', string> = {
  en: 'en-US',
  th: 'th-TH',
};

/**
 * @param date - Date, ISO string, or anything `new Date()` accepts.
 * @param lang - App language code (e.g. `i18n.language`); defaults to English.
 * @param style - 'short' -> "5 Jul 2026", 'long' -> "5 July 2026",
 *   'weekday' -> "Sun, 5 Jul", 'datetime' -> "5 July 2026, 14:30".
 */
export const formatDate = (
  date: Date | string,
  lang: string = 'en',
  style: DateStyle = 'short'
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = LOCALE[lang === 'th' ? 'th' : 'en'];

  const options: Intl.DateTimeFormatOptions =
    style === 'long'
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : style === 'weekday'
      ? { weekday: 'short', day: 'numeric', month: 'short' }
      : style === 'datetime'
      ? { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short', year: 'numeric' };

  return d.toLocaleDateString(locale, options);
};
