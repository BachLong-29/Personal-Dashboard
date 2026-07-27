import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { verifyAccessToken } from '@/libs/jwt';
import { TOKEN_KEYS } from '@/constants/auth';
import { defaultLocale } from '@/i18n/config';
import { ToastContainer } from '@/components/common/ToastContainer';
import { GlobalSearch } from '@/features/search/components/GlobalSearch';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEYS.ACCESS)?.value;
  if (!token) return null;

  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
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
    redirect(locale === defaultLocale ? '/login' : `/${locale}/login`);
  }

  return (
    <>
      {children}
      <GlobalSearch />
      <ToastContainer />
    </>
  );
}
