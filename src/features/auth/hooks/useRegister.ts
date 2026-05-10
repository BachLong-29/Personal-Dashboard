'use client';

import { useMutation } from '@tanstack/react-query';

import { useRouter } from '@/i18n/navigation';
import { authEndpoints } from '@/services/endpoints/auth';

import type { RegisterFormValues } from '../schemas';

async function register(credentials: RegisterFormValues) {
  const { data } = await authEndpoints.register(credentials);
  return data;
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      router.push('/login');
    },
  });
}
