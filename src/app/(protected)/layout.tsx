import { redirect } from 'next/navigation';

import { AUTH_ROUTES } from '@/constants/auth';

// Swap this for a real session check (JWT/cookie) when auth is wired up
async function getSession() {
  return true;
}

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect(AUTH_ROUTES.LOGIN);
  }

  return <>{children}</>;
}
