import type { Metadata } from 'next';

import { AuthPanel } from '@/features/auth/components/AuthPanel';
import { AuthScene } from '@/features/auth/components/AuthScene';

export const metadata: Metadata = { title: 'Register — Aetheria' };

export default function RegisterPage() {
  return (
    <div className="auth-shell">
      <AuthScene />
      <AuthPanel initialMode="register" />
    </div>
  );
}
