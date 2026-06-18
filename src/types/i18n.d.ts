import type en from '@/i18n/locales/en/common.json';

type Messages = typeof en;

declare global {
  // Augmented by next-intl — enables full type-safety for useTranslations() keys.
  // Interface-extends is the next-intl-recommended shape; the empty body is intentional.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}
