import type { Metadata } from 'next';

import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = { title: 'Register' };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <RegisterForm />
    </div>
  );
}
