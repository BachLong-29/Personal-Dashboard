'use client';

import { cn } from '@/libs/utils';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warn';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  info: 'ⓘ',
  warn: '⚠',
};

const iconBg: Record<ToastVariant, string> = {
  success: 'bg-[oklch(0.76_0.14_162_/_0.15)] text-[var(--mint)]',
  error: 'bg-[oklch(0.74_0.18_5_/_0.15)] text-[var(--rose)]',
  info: 'bg-[oklch(0.78_0.16_205_/_0.15)] text-[var(--cyan)]',
  warn: 'bg-[oklch(0.78_0.16_65_/_0.15)] text-[var(--warning)]',
};

const borderColor: Record<ToastVariant, string> = {
  success: 'border-l-[var(--mint)]',
  error: 'border-l-[var(--rose)]',
  info: 'border-l-[var(--cyan)]',
  warn: 'border-l-[var(--warning)]',
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  return (
    <div
      className={cn(
        'flex gap-3 items-start bg-[var(--bg-2)] border border-[var(--border-hi)] border-l-[3px] rounded-[var(--r-md)]',
        'px-4 py-3 shadow-[var(--sh-3)] w-80',
        borderColor[item.variant],
      )}
    >
      <span
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-[14px] shrink-0',
          iconBg[item.variant],
        )}
      >
        {icons[item.variant]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-[var(--f-title)] text-[13px] tracking-[0.06em] text-[var(--text-hi)]">
          {item.title}
        </div>
        {item.message && (
          <div className="text-[11px] text-[var(--text-md)] mt-0.5 leading-relaxed">
            {item.message}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-[var(--text-lo)] hover:text-[var(--text-hi)] text-[14px] transition-colors shrink-0"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...item, id }]);
      const duration = item.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  return (
    <ToastContext value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastCard item={item} onDismiss={() => dismiss(item.id)} />
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function Toast({
  variant,
  title,
  message,
  onDismiss,
  // className,
}: Omit<ToastItem, 'id' | 'duration'> & { onDismiss?: () => void; className?: string }) {
  return (
    <ToastCard item={{ id: '', variant, title, message }} onDismiss={onDismiss ?? (() => {})} />
  );
}
