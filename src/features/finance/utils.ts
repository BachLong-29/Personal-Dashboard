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

/** "Today" / "Yesterday" / "Mon, Jan 5" — used as transaction-list group headers. */
export function formatDateGroup(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86_400_000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
