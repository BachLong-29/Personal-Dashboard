export const defaultLocale = 'en' as const;
export const locales = ['en', 'vi', 'th'] as const;
export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
  th: 'ภาษาไทย',
};
