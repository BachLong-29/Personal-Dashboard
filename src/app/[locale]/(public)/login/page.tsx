import type { Metadata } from 'next';

import { AuthPanel } from '@/features/auth/components/AuthPanel';
import { AuthScene } from '@/features/auth/components/AuthScene';

export const metadata: Metadata = { title: 'Login — Aetheria' };

export default function LoginPage() {
  return (
    <div className="auth-shell">
      <AuthScene />
      <AuthPanel initialMode="login" />
    </div>
  );
}
