'use client';

import { useRouter } from '@/i18n/navigation';
import { cn } from '@/libs/utils';
import { useUIStore } from '@/stores/ui.store';
import { toLocalDate } from '@/features/tasks/utils/date.utils';
import {
  useNotifications,
  useUnreadNotificationCount,
  type Notification,
} from '../../hooks/useNotifications';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '../../hooks/useNotificationActions';

function getNextMondayStr(): string {
  const d = new Date();
  const day = d.getDay();
  // Sunday → +1 day; any other day → next week's Monday
  const toMonday = day === 0 ? 1 : 7 - day + 1;
  d.setDate(d.getDate() + toMonday);
  return toLocalDate(d);
}

const CLICKABLE_TYPES = new Set<Notification['type']>([
  'planning',
  'monthly-plan',
  'system',
  'deadline',
  'overload',
  'conflict',
]);

const TYPE_ICON: Record<string, string> = {
  planning: '📋',
  'monthly-plan': '🗓',
  reminder: '⏰',
  system: '⚙️',
  reward: '🏆',
  deadline: '⚠',
  overload: '🔥',
  conflict: '✕',
};

// Titles are authored server-side with a leading/trailing icon glyph baked in
// (e.g. "⚠ Đến hạn: ...", "Plan Your Week 📋") — but the panel already shows
// that same glyph via TYPE_ICON, so leaving it in the title doubles it up
// visually. Strip it if (and only if) it matches one of TYPE_ICON's own
// values, so this can never go out of sync with what's actually shown.
// Split on the variation-selector code point (rather than a regex literal
// containing it directly, which is easy to mis-paste as an invisible char).
const VARIATION_SELECTOR_16 = String.fromCharCode(0xfe0f);
const ICON_GLYPHS = [
  ...new Set(Object.values(TYPE_ICON).map((g) => g.split(VARIATION_SELECTOR_16).join(''))),
]
  .join('')
  .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const EDGE_ICON_REGEX = new RegExp(
  `^[${ICON_GLYPHS}]\\uFE0F?\\s+|\\s+[${ICON_GLYPHS}]\\uFE0F?$`,
  'gu',
);

function cleanTitle(title: string): string {
  return title.replace(EDGE_ICON_REGEX, '').trim();
}

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
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const router = useRouter();
  const setPendingRestoreTaskId = useUIStore((s) => s.setPendingRestoreTaskId);
  const setPendingScheduleNav = useUIStore((s) => s.setPendingScheduleNav);
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();
  const { mutate: dismiss } = useDeleteNotification();

  const handleItemClick = (n: Notification) => {
    if (!n.isRead) markRead(n._id);

    // "Quest Failed" notification — open edit modal for the failed task
    if (n.type === 'system') {
      if (n.entityId) {
        setPendingRestoreTaskId(n.entityId);
      }
      onClose();
      return;
    }

    if (n.type === 'planning') {
      const weekStart = getNextMondayStr();
      setPendingScheduleNav({ tab: 'week', weekStart, year: new Date(weekStart).getFullYear() });
      onClose();
      router.push('/dashboard?tab=schedule');
      return;
    }

    if (n.type === 'monthly-plan') {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      setPendingScheduleNav({
        tab: 'month',
        month: nextMonth.getMonth(),
        year: nextMonth.getFullYear(),
      });
      onClose();
      router.push('/dashboard?tab=schedule');
      return;
    }

    // Deadline/overload/conflict — jump to today's day view where the user
    // can see and resolve the underlying schedule issue.
    if (n.type === 'deadline' || n.type === 'overload' || n.type === 'conflict') {
      const today = toLocalDate(new Date());
      setPendingScheduleNav({ tab: 'day', dayDate: today, year: new Date(today).getFullYear() });
      onClose();
      router.push('/dashboard?tab=schedule');
    }
  };

  return (
    <div className={panel}>
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
              CLICKABLE_TYPES.has(n.type) && itemClickable,
            )}
            onClick={() => handleItemClick(n)}
          >
            <span className={itemIcon}>{TYPE_ICON[n.type] ?? '🔔'}</span>
            <div className={itemBody}>
              <div className={itemTitle}>{cleanTitle(n.title)}</div>
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
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

// Mobile: `fixed` + viewport-relative inset, independent of where the trigger
// sits (the bell is on the *left* of the mobile topbar but the *right* on
// desktop) — anchoring to the trigger's own wrapper with a fixed 360px width
// pushed the panel mostly off-screen on narrow viewports. Desktop keeps the
// original trigger-anchored `absolute` positioning.
const panel =
  'fixed left-3 right-3 top-[60px] max-h-[calc(100dvh-80px)] min-[1025px]:absolute min-[1025px]:inset-auto min-[1025px]:left-auto min-[1025px]:right-0 min-[1025px]:top-[calc(100%+8px)] min-[1025px]:w-[360px] min-[1025px]:max-h-[480px] z-50 flex flex-col bg-[var(--panel)] border border-[oklch(0.74_0.17_85_/_0.35)] rounded-[var(--r)] shadow-[0_8px_32px_oklch(0_0_0_/_0.4),0_0_20px_oklch(0.74_0.17_85_/_0.08)] overflow-hidden';

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
