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

/** Border + glow + accent color per variant — same gold-pill language as the XP/level-up toasts. */
const TYPE_STYLE: Record<Toast['type'], string> = {
  success:
    'border-[var(--mint)] shadow-[0_0_30px_var(--mint-glow),0_8px_32px_oklch(0_0_0_/_0.5)] text-[var(--mint)]',
  error:
    'border-[var(--crimson)] shadow-[0_0_30px_var(--crimson-glow),0_8px_32px_oklch(0_0_0_/_0.5)] text-[oklch(0.78_0.18_20)]',
  warning:
    'border-[var(--gold)] shadow-[0_0_30px_var(--gold-glow),0_8px_32px_oklch(0_0_0_/_0.5)] text-[var(--gold)]',
  info: 'border-[var(--violet)] shadow-[0_0_30px_var(--violet-glow),0_8px_32px_oklch(0_0_0_/_0.5)] text-[var(--violet)]',
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
  'fixed bottom-[30px] left-1/2 -translate-x-1/2 z-[1200] flex flex-col items-center gap-2 pointer-events-none';

const toastItem = cn(
  'pointer-events-auto flex w-max max-w-[min(90vw,420px)] items-center gap-2.5 rounded-full border px-6 py-2.5',
  'bg-[linear-gradient(135deg,var(--panel2),var(--panel3))]',
  '[font-family:var(--f-title)] text-[13px] font-bold tracking-[0.06em]',
  'animate-[modal-in_0.3s_cubic-bezier(0.34,1.56,0.64,1)]',
);

const toastIcon = 'shrink-0 text-[14px] leading-none';
const toastMessage = 'truncate text-[var(--text-hi)]';
const toastClose =
  'text-[14px] leading-none shrink-0 text-[var(--text-lo)] hover:text-[var(--text-hi)] transition-colors cursor-pointer normal-case tracking-normal font-normal';
