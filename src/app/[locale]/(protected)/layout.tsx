import { redirect } from 'next/navigation';

import { defaultLocale } from '@/i18n/config';

async function getSession() {
  return true;
}

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) {
    // Locale-aware redirect: default locale has no prefix (as-needed strategy)
    redirect(locale === defaultLocale ? '/login' : `/${locale}/login`);
  }

  return <>{children}</>;
}
