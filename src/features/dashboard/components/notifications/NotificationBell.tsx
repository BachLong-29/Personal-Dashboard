'use client';

import { useState } from 'react';

import { cn } from '@/libs/utils';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';

interface NotificationBellProps {
  onEndDay?: () => void;
}

export function NotificationBell({ onEndDay }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(bellBtn, open && bellBtnActive)}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && <span className={badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && <NotificationPanel onClose={() => setOpen(false)} onEndDay={onEndDay} />}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const bellBtn =
  'relative w-8 h-8 flex items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] text-[16px] text-[var(--text-mid)] hover:text-[var(--text-hi)] hover:bg-[var(--panel2)] transition-colors shrink-0 cursor-pointer';

const bellBtnActive = 'text-[var(--text-hi)] bg-[var(--panel2)] border-[oklch(0.74_0.17_85_/_0.4)]';

const badge =
  'absolute -top-[5px] -right-[5px] min-w-[16px] h-[16px] px-[3px] rounded-full bg-[var(--rose)] text-white text-[8px] font-black font-[var(--font-title)] flex items-center justify-center leading-none border border-[var(--panel)]';
