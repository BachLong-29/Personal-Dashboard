'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { useLogin } from '../hooks/useLogin';
import { loginSchema, type LoginFormValues } from '../schemas';
import { AuthInput } from './AuthInput';

function RememberMeToggle() {
  const [checked, setChecked] = useState(false);
  return (
    <button
      type="button"
      className="auth-check-pill"
      onClick={() => setChecked((v) => !v)}
      aria-pressed={checked}
    >
      <div className={`auth-check-box${checked ? ' checked' : ''}`} aria-hidden="true">
        {checked && '✓'}
      </div>
      <span>Remember me</span>
    </button>
  );
}

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
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="ap-body">
        <AuthInput
          label={t('email')}
          icon="✉"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <AuthInput
          label={t('password')}
          icon="🔑"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          showPasswordToggle
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="row-between">
          <RememberMeToggle />
          <button type="button" className="auth-link-btn">
            Forgot password?
          </button>
        </div>

        {error && (
          <div className="auth-alert kind-error" role="alert">
            <div className="auth-alert-icon">⚠</div>
            <div className="auth-alert-msg">{tCommon('error')}</div>
          </div>
        )}

        <button type="submit" className="auth-primary-btn" disabled={isPending}>
          <span className="auth-pb-ornament">⟡</span>
          <span>{isPending ? 'ENTERING...' : t('login').toUpperCase()}</span>
          {isPending && <div className="auth-pb-loader" aria-hidden="true" />}
          <div className="auth-pb-shine" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
