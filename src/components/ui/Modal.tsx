'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/libs/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  className?: string;
  /** Show an ✕ close button in the top-right corner */
  closeButton?: boolean;
  /** Constrain height to 90dvh and allow inner content to scroll */
  scrollable?: boolean;
  /** Extra inline styles merged onto the container (use for dynamic colors/overrides) */
  containerStyle?: CSSProperties;
  /**
   * On screens narrower than sm (640 px) render as a bottom sheet:
   * slides up from the bottom, full-width, top-rounded corners only.
   * On sm+ it falls back to the normal centered modal.
   */
  bottomSheet?: boolean;
}

export interface ModalHeadProps {
  tag?: string;
  title: ReactNode;
  className?: string;
}

export interface ModalBodyProps {
  children: ReactNode;
  className?: string;
  /** Makes the body flex-1 + overflow-y-auto (use when Modal has scrollable prop) */
  scrollable?: boolean;
}

export interface ModalFootProps {
  children: ReactNode;
  className?: string;
}

export function ModalHead({ tag, title, className }: ModalHeadProps) {
  return (
    <div className={cn('px-6 pt-5 pb-3 relative border-b border-[var(--border-lo)]', className)}>
      {tag && (
        <div className="[font-family:var(--f-title)] text-[9px] tracking-[0.3em] text-[var(--gold)] mb-1">
          {tag}
        </div>
      )}
      <div className="[font-family:var(--f-title)] text-[22px] font-bold tracking-[0.04em] text-[var(--text-hi)]">
        {title}
      </div>
    </div>
  );
}

export function ModalBody({ children, className, scrollable }: ModalBodyProps) {
  return (
    <div
      className={cn(
        'px-6 py-5 text-[13px] text-[var(--text-md)] leading-relaxed relative',
        scrollable && 'flex-1 overflow-y-auto',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ModalFoot({ children, className }: ModalFootProps) {
  return (
    <div className={cn('px-6 pb-5 pt-3 flex gap-2 justify-end relative', className)}>
      {children}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  children,
  maxWidth = '420px',
  className,
  closeButton,
  scrollable,
  containerStyle,
  bottomSheet,
}: ModalProps) {
  const t = useTranslations('common');

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[1000] flex justify-center',
        bottomSheet ? 'items-end sm:items-center sm:p-4' : 'items-center p-4',
      )}
      style={{ background: 'oklch(0.03 0.02 270 / 0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden',
          'border border-[var(--gold)] shadow-[var(--sh-4),var(--sh-glow-gold)]',
          bottomSheet
            ? 'rounded-t-[20px] sm:rounded-[var(--r-lg)] animate-sheet-in sm:animate-[modal-in_0.3s_cubic-bezier(0.34,1.56,0.64,1)]'
            : 'rounded-t-[20px] sm:rounded-[var(--r-lg)] animate-[modal-in_0.3s_cubic-bezier(0.34,1.56,0.64,1)]',
          scrollable && 'flex flex-col max-h-[90dvh] sm:max-h-[85vh]',
          className,
        )}
        style={{
          maxWidth,
          background: 'linear-gradient(180deg, var(--bg-2), var(--bg-1))',
          ...containerStyle,
        }}
      >
        {closeButton && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-[var(--r-sm)] text-[var(--text-lo)] hover:text-[var(--text-hi)] hover:bg-[var(--panel2)] transition-all text-[13px]"
            aria-label={t('modal.close')}
          >
            ✕
          </button>
        )}
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(ellipse at top, var(--gold-glow), transparent 60%)',
          }}
        />
        {children}
      </div>
    </div>
  );
}
