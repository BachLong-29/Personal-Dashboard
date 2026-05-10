'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { Link } from '@/i18n/navigation';
import { Button, Input } from '@/components/ui';

import { useRegister } from '../hooks/useRegister';
import { registerSchema, type RegisterFormValues } from '../schemas';

export function RegisterForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');

  const { mutate: register, isPending, error } = useRegister();

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (values: RegisterFormValues) => register(values);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-sm space-y-6"
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">Enter your details to get started</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label={t('name')}
          type="text"
          autoComplete="name"
          placeholder="John Doe"
          className="bg-black text-white placeholder:text-white/60"
          error={errors.name?.message}
          {...field('name')}
        />

        <Input
          label={t('email')}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="bg-black text-white placeholder:text-white/60"
          error={errors.email?.message}
          {...field('email')}
        />

        <Input
          label={t('password')}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className="bg-black text-white placeholder:text-white/60"
          error={errors.password?.message}
          {...field('password')}
          helperText="Min 8 characters, 1 uppercase, 1 number"
        />

        <Input
          label={t('confirmPassword')}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className="bg-black text-white placeholder:text-white/60"
          error={errors.confirmPassword?.message}
          {...field('confirmPassword')}
        />

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {tCommon('error')}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={isPending}>
          {t('register')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('hasAccount')}{' '}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          {t('login')}
        </Link>
      </p>
    </motion.div>
  );
}
