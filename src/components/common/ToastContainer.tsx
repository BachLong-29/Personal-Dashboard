'use client';

import { useEffect } from 'react';

import { cn } from '@/libs/utils';
import { useUIStore, type Toast } from '@/stores/ui.store';

const AUTO_DISMISS_MS = 5000;

const TYPE_ICON: Record<Toast['type'], string> = {
  success: '✓',
  error: '⚠',
  warning: '⚠',
  info: 'ℹ',
};

const TYPE_STYLE: Record<Toast['type'], string> = {
  success: 'border-[oklch(0.76_0.14_162_/_0.4)] text-[oklch(0.85_0.14_162)]',
  error: 'border-[oklch(0.62_0.24_22_/_0.5)] text-[oklch(0.85_0.18_22)]',
  warning: 'border-[oklch(0.74_0.17_85_/_0.45)] text-[var(--gold)]',
  info: 'border-[oklch(0.66_0.22_295_/_0.4)] text-[oklch(0.82_0.14_295)]',
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useUIStore((s) => s.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  return (
    <div className={cn(toastItem, TYPE_STYLE[toast.type])} role="alert">
      <span className={toastIcon}>{TYPE_ICON[toast.type]}</span>
      <span className={toastMessage}>{toast.message}</span>
      <button
        type="button"
        className={toastClose}
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

/** Global toast feed — mounted once near the app root, driven by useUIStore. */
export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className={container}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const container =
  'fixed bottom-4 right-4 z-[1200] flex flex-col gap-2 w-[min(320px,calc(100vw-2rem))] pointer-events-none';

const toastItem =
  'pointer-events-auto flex items-start gap-2 px-3 py-2.5 rounded-[var(--r-sm)] border bg-[var(--panel)] shadow-[0_8px_24px_oklch(0_0_0_/_0.45)] text-[12px] leading-snug animate-[modal-in_0.2s_ease-out]';

const toastIcon = 'text-[14px] leading-none shrink-0 mt-[1px]';
const toastMessage = 'flex-1 text-[var(--text-hi)]';
const toastClose =
  'text-[14px] leading-none shrink-0 text-[var(--text-lo)] hover:text-[var(--text-hi)] transition-colors cursor-pointer';
