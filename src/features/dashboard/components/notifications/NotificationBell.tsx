'use client';

import { useRef, useState } from 'react';

import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { cn } from '@/libs/utils';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  // Wraps both the trigger and the panel so a click on the bell itself never
  // races with the outside-click handler (mousedown-close then click-reopen).
  useOnClickOutside(containerRef, () => setOpen(false));

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={cn(bellBtn, open && bellBtnActive)}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && <span className={badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const bellBtn =
  'relative w-8 h-8 flex items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] text-[16px] text-[var(--text-mid)] hover:text-[var(--text-hi)] hover:bg-[var(--panel2)] transition-colors shrink-0 cursor-pointer';

const bellBtnActive = 'text-[var(--text-hi)] bg-[var(--panel2)] border-[oklch(0.74_0.17_85_/_0.4)]';

const badge =
  'absolute -top-[5px] -right-[5px] min-w-[16px] h-[16px] px-[3px] rounded-full bg-[var(--rose)] text-white text-[8px] font-black font-[var(--font-title)] flex items-center justify-center leading-none border border-[var(--panel)]';
