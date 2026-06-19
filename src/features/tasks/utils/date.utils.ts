export function toLocalDate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

export function todayISO(): string {
  return toLocalDate(new Date());
}

/** Real calendar date for a day-offset from today (0 = today). */
export function offsetToISO(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toLocalDate(d);
}

/**
 * Whether `dateISO` falls within a task's [startDate, dueDate] span.
 * An undefined `dueDate` means open-ended → always in range.
 */
export function isInRange(dateISO: string, startDate?: string, dueDate?: string): boolean {
  if (startDate && dateISO < startDate) return false;
  if (dueDate && dateISO > dueDate) return false;
  return true;
}
