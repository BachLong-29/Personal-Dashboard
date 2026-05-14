'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { cn } from '@/libs/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  className?: string;
}

export interface ModalHeadProps {
  tag?: string;
  title: ReactNode;
  className?: string;
}

export interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export interface ModalFootProps {
  children: ReactNode;
  className?: string;
}

export function ModalHead({ tag, title, className }: ModalHeadProps) {
  return (
    <div className={cn('px-6 pt-5 pb-3 relative border-b border-[var(--border-lo)]', className)}>
      {tag && (
        <div className="font-[var(--f-title)] text-[9px] tracking-[0.3em] text-[var(--gold)] mb-1">
          {tag}
        </div>
      )}
      <div className="font-[var(--f-title)] text-[22px] font-bold tracking-[0.04em] text-[var(--text-hi)]">
        {title}
      </div>
    </div>
  );
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div
      className={cn(
        'px-6 py-5 text-[13px] text-[var(--text-md)] leading-relaxed relative',
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

export function Modal({ open, onClose, children, maxWidth = '420px', className }: ModalProps) {
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
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ background: 'oklch(0.03 0.02 270 / 0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-[var(--r-lg)]',
          'border border-[var(--gold)] shadow-[var(--sh-4),var(--sh-glow-gold)]',
          className,
        )}
        style={{
          maxWidth,
          background: 'linear-gradient(180deg, var(--bg-2), var(--bg-1))',
        }}
      >
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
