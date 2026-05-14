'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { useRegister } from '../hooks/useRegister';
import { registerSchema, type RegisterFormValues } from '../schemas';
import { AuthInput } from './AuthInput';

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
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="ap-body">
        <AuthInput
          label={t('name')}
          icon="👤"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          error={errors.name?.message}
          {...field('name')}
        />

        <AuthInput
          label={t('email')}
          icon="✉"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...field('email')}
        />

        <AuthInput
          label={t('password')}
          icon="🔑"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          showPasswordToggle
          error={errors.password?.message}
          {...field('password')}
        />

        <AuthInput
          label={t('confirmPassword')}
          icon="🔒"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          showPasswordToggle
          error={errors.confirmPassword?.message}
          {...field('confirmPassword')}
        />

        {error && (
          <div className="auth-alert kind-error" role="alert">
            <div className="auth-alert-icon">⚠</div>
            <div className="auth-alert-msg">{tCommon('error')}</div>
          </div>
        )}

        <button type="submit" className="auth-primary-btn" disabled={isPending}>
          <span className="auth-pb-ornament">✦</span>
          <span>{isPending ? 'CREATING...' : t('register').toUpperCase()}</span>
          {isPending && <div className="auth-pb-loader" aria-hidden="true" />}
          <div className="auth-pb-shine" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
