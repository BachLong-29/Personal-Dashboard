'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { Button, Input } from '@/components/ui';

import { useLogin } from '../hooks/useLogin';
import { loginSchema, type LoginFormValues } from '../schemas';

export function LoginForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');

  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (values: LoginFormValues) => login(values);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-sm space-y-6"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label={t('email')}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="bg-black text-white placeholder:text-white/60"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label={t('password')}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="bg-black text-white placeholder:text-white/60"
          error={errors.password?.message}
          {...register('password')}
        />

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {tCommon('error')}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={isPending}>
          {t('login')}
        </Button>
        <>admin@example.com / Password1</>
      </form>
    </motion.div>
  );
}
