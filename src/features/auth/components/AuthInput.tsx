'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, icon = '◈', error, showPasswordToggle, type, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const inputType = showPasswordToggle && showPassword ? 'text' : type;

    return (
      <div className={`auth-field${focused ? ' is-focus' : ''}${error ? ' is-error' : ''}`}>
        <div className="auth-field-label">
          <span className="fl-ico">{icon}</span>
          <span>{label}</span>
          <span className="fl-line" />
        </div>
        <div className="auth-field-wrap">
          <input
            ref={ref}
            type={inputType}
            className="auth-field-input"
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {showPasswordToggle && (
            <div className="auth-field-trailing">
              <button
                type="button"
                className="auth-field-eye"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '○' : '●'}
              </button>
            </div>
          )}
        </div>
        {error && (
          <div className="auth-field-err" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  },
);

AuthInput.displayName = 'AuthInput';
