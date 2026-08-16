/** Placeholder shown instead of an amount when the user has toggled amounts hidden. */
export const AMOUNT_MASK = '••••••';

export function formatCurrency(amount: number, currency = 'VND'): string {
  if (currency === 'VND') {
    return `${Math.round(amount).toLocaleString('vi-VN')}₫`;
  }
  return amount.toLocaleString('en-US', { style: 'currency', currency });
}

/** Digits-only string (as typed/stored) → "1,000,000" for display in an amount input. */
export function formatAmountInput(digits: string): string {
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}

/** Strips everything but digits — use on amount-input onChange before storing state. */
export function toAmountDigits(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}

/** Signed digits string (e.g. "-10000") → "-10,000" for display in a balance input. */
export function formatSignedAmountInput(value: string): string {
  if (!value || value === '-') return value;
  const negative = value.startsWith('-');
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return negative ? '-' : '';
  const formatted = Number(digits).toLocaleString('en-US');
  return negative ? `-${formatted}` : formatted;
}

/** Strips everything but digits and a leading minus — use on signed amount-input onChange. */
export function toSignedAmountDigits(raw: string): string {
  const negative = raw.trim().startsWith('-');
  const digits = raw.replace(/[^\d]/g, '');
  return negative ? `-${digits}` : digits;
}

/**
 * "Today" / "Yesterday" / "Mon, Jan 5" — used as transaction-list group headers.
 * Pass translated `labels` so the relative days follow the UI language.
 */
export function formatDateGroup(
  dateStr: string,
  labels?: { today: string; yesterday: string },
  locale = 'en-US',
): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86_400_000);

  if (diffDays === 0) return labels?.today ?? 'Today';
  if (diffDays === 1) return labels?.yesterday ?? 'Yesterday';
  return date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "YYYY-MM" → first/last day of that month, as "YYYY-MM-DD" (for the `from`/`to` API filters). */
export function getMonthRange(month: string): { from: string; to: string } {
  const parts = month.split('-');
  const year = Number(parts[0]);
  const mo = Number(parts[1]);
  const lastDay = new Date(year, mo, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, '0')}` };
}

/** Last `count` months (incl. current) as Select options — value "YYYY-MM", label "Jan 2026". */
export function getMonthOptions(count = 12, locale = 'en-US'): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
    return { value, label };
  });
}

/** Today in the user's local timezone as "YYYY-MM-DD" — the day the ledger considers "today". */
export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Current month as "YYYY-MM". */
export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** "YYYY-MM" shifted by `delta` months (negative to go back). */
export function shiftMonth(month: string, delta: number): string {
  const parts = month.split('-');
  const year = Number(parts[0]);
  const mo = Number(parts[1]);
  const d = new Date(year, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** "YYYY-MM" → "August 2026". */
export function formatMonthLabel(month: string, locale = 'en-US'): string {
  const parts = month.split('-');
  const year = Number(parts[0]);
  const mo = Number(parts[1]);
  const d = new Date(year, mo - 1, 1);
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}
