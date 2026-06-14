'use client';

import { useRef } from 'react';

import { useRouter } from '@/i18n/navigation';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { cn } from '@/libs/utils';
import { useNotifications, type Notification } from '../hooks/useNotifications';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '../hooks/useNotificationActions';

const SCHEDULE_STORAGE_KEY = 'aetheria_schedule_state';

function getNextMondayStr(): string {
  const d = new Date();
  const day = d.getDay();
  // Sunday → +1 day; any other day → next week's Monday
  const toMonday = day === 0 ? 1 : 7 - day + 1;
  d.setDate(d.getDate() + toMonday);
  return d.toISOString().substring(0, 10);
}

const TYPE_ICON: Record<string, string> = {
  planning: '📋',
  'monthly-plan': '🗓',
  reminder: '⏰',
  system: '⚙️',
  reward: '🏆',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface NotificationPanelProps {
  onClose: () => void;
  onEndDay?: () => void;
}

export function NotificationPanel({ onClose, onEndDay }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(panelRef, onClose);

  const router = useRouter();
  const { data: notifications = [], isLoading } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();
  const { mutate: dismiss } = useDeleteNotification();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleItemClick = (n: Notification) => {
    if (!n.isRead) markRead(n._id);

    if (n.type === 'planning') {
      const weekStart = getNextMondayStr();
      try {
        const prev = JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY) ?? '{}') as Record<
          string,
          unknown
        >;
        localStorage.setItem(
          SCHEDULE_STORAGE_KEY,
          JSON.stringify({
            ...prev,
            tab: 'week',
            weekStart,
            year: new Date(weekStart).getFullYear(),
          }),
        );
      } catch {
        /* ignore */
      }
      onClose();
      router.push('/dashboard?tab=schedule');
    }

    if (n.type === 'monthly-plan') {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      try {
        const prev = JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY) ?? '{}') as Record<
          string,
          unknown
        >;
        localStorage.setItem(
          SCHEDULE_STORAGE_KEY,
          JSON.stringify({
            ...prev,
            tab: 'month',
            month: nextMonth.getMonth(),
            year: nextMonth.getFullYear(),
          }),
        );
      } catch {
        /* ignore */
      }
      onClose();
      router.push('/dashboard?tab=schedule');
    }
  };

  return (
    <div ref={panelRef} className={panel}>
      {/* corner accents */}
      <div className={cn(corner, 'top-[5px] left-[5px] border-t-[1.5px] border-l-[1.5px]')} />
      <div className={cn(corner, 'top-[5px] right-[5px] border-t-[1.5px] border-r-[1.5px]')} />
      <div className={cn(corner, 'bottom-[5px] left-[5px] border-b-[1.5px] border-l-[1.5px]')} />
      <div className={cn(corner, 'bottom-[5px] right-[5px] border-b-[1.5px] border-r-[1.5px]')} />

      {/* Header */}
      <div className={header}>
        <span className={headerTitle}>Notifications</span>
        {unreadCount > 0 && (
          <button type="button" className={markAllBtn} onClick={() => markAllRead()}>
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className={list}>
        {isLoading && <div className={emptyState}>Loading…</div>}
        {!isLoading && notifications.length === 0 && (
          <div className={emptyState}>No notifications</div>
        )}
        {notifications.map((n) => (
          <div
            key={n._id}
            className={cn(
              item,
              !n.isRead && itemUnread,
              (n.type === 'planning' || n.type === 'monthly-plan') && itemClickable,
            )}
            onClick={() => handleItemClick(n)}
          >
            <span className={itemIcon}>{TYPE_ICON[n.type] ?? '🔔'}</span>
            <div className={itemBody}>
              <div className={itemTitle}>{n.title}</div>
              <div className={itemMessage}>{n.message}</div>
              <div className={itemTime}>{timeAgo(n.createdAt)}</div>
            </div>
            <button
              type="button"
              className={dismissBtn}
              onClick={(e) => {
                e.stopPropagation();
                dismiss(n._id);
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Footer — End Day */}
      {onEndDay && (
        <div className={footer}>
          <button
            type="button"
            className={endDayBtn}
            onClick={() => {
              onEndDay();
              onClose();
            }}
          >
            <span>⚠</span>
            <span>End Day</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const panel =
  'absolute top-[calc(100%+8px)] right-0 z-50 w-[360px] max-h-[480px] flex flex-col bg-[var(--panel)] border border-[oklch(0.74_0.17_85_/_0.35)] rounded-[var(--r)] shadow-[0_8px_32px_oklch(0_0_0_/_0.4),0_0_20px_oklch(0.74_0.17_85_/_0.08)] overflow-hidden';

const corner = 'absolute w-3 h-3 pointer-events-none border-[var(--gold-dim)]';

const header =
  'flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0';

const headerTitle =
  'font-[var(--font-title)] text-[12px] font-bold tracking-[0.1em] text-[var(--text-hi)] uppercase';

const markAllBtn =
  'text-[10px] text-[var(--gold)] font-[var(--font-title)] tracking-[0.06em] cursor-pointer hover:opacity-70 transition-opacity';

const list = 'flex-1 overflow-y-auto';

const emptyState =
  'flex items-center justify-center h-[100px] text-[12px] text-[var(--text-lo)] font-[var(--font-title)] tracking-[0.05em]';

const item =
  'flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-[var(--border)] last:border-b-0 transition-colors duration-150 hover:bg-[var(--panel2)]';

const itemUnread = 'bg-[oklch(0.74_0.17_85_/_0.04)]';

const itemClickable =
  'hover:bg-[oklch(0.66_0.22_295_/_0.08)] [&_div:last-child]:text-[var(--violet)]';

const itemIcon = 'text-[18px] leading-none shrink-0 mt-[2px]';

const itemBody = 'flex-1 min-w-0';

const itemTitle =
  'font-[var(--font-title)] text-[11px] font-bold text-[var(--text-hi)] tracking-[0.04em] truncate';

const itemMessage = 'text-[11px] text-[var(--text-mid)] leading-[1.5] mt-[2px]';

const itemTime = 'text-[9px] text-[var(--text-lo)] tracking-[0.06em] mt-[4px]';

const dismissBtn =
  'w-5 h-5 flex items-center justify-center text-[16px] text-[var(--text-lo)] hover:text-[var(--rose)] transition-colors shrink-0 cursor-pointer leading-none mt-[-2px]';

const footer = 'shrink-0 px-3 py-2.5 border-t border-[var(--border)]';

const endDayBtn =
  'flex items-center justify-center gap-2 w-full py-[8px] rounded-[var(--r-sm)] border border-[oklch(0.62_0.24_22_/_0.4)] bg-[oklch(0.62_0.24_22_/_0.08)] text-[oklch(0.85_0.18_22)] font-[var(--font-title)] text-[10px] font-bold tracking-[0.18em] cursor-pointer transition-all duration-200 hover:bg-[oklch(0.62_0.24_22_/_0.18)] hover:border-[oklch(0.62_0.24_22_/_0.7)] hover:shadow-[0_0_12px_var(--danger-glow)]';
