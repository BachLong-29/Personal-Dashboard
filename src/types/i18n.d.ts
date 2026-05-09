import type en from '@/i18n/locales/en/common.json';

type Messages = typeof en;

declare global {
  // Augmented by next-intl — enables full type-safety for useTranslations() keys
  interface IntlMessages extends Messages {}
}
