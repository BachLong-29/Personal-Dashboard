// Shared style constants across Task Management components

// ─── Difficulty badge colours ─────────────────────────────────────────────────
export const diffColors: Record<string, string> = {
  S: 'bg-[oklch(0.74_0.17_85_/_0.2)] text-[var(--gold)]',
  A: 'bg-[oklch(0.72_0.18_5_/_0.15)] text-[var(--rose)]',
  B: 'bg-[oklch(0.66_0.22_295_/_0.15)] text-[var(--violet)]',
  C: 'bg-[oklch(0.76_0.16_205_/_0.12)] text-[var(--cyan)]',
  D: 'bg-[oklch(0.76_0.14_162_/_0.12)] text-[var(--mint)]',
};

// ─── Deadline urgency colours ─────────────────────────────────────────────────
export const urgencyColors: Record<string, string> = {
  done:    'text-[var(--mint)]',
  now:     'text-[var(--rose)] animate-pulse',
  today:   'text-[var(--gold)]',
  evening: 'text-[var(--violet)]',
  soon:    'text-[var(--cyan)]',
  later:   'text-[var(--text-lo)]',
  month:   'text-[var(--text-lo)]',
};

// ─── Panel chrome ─────────────────────────────────────────────────────────────
export const panelBase =
  'bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)]';
export const sidePanel =
  'bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] p-3 shrink-0';
export const panelHead =
  'flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] shrink-0';
export const panelEyebrow =
  'text-[8px] tracking-[0.18em] text-[var(--text-lo)] font-[var(--font-title)] font-bold';
export const panelTitle =
  'text-[13px] font-bold text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.05em]';

// ─── Quest card expanded actions ──────────────────────────────────────────────
const qcxBtnBase =
  'text-[9px] font-bold px-2 py-[4px] rounded-[var(--r-sm)] border font-[var(--font-title)] tracking-[0.06em] transition-all duration-150';
export const qcxBtnPrimary =
  `${qcxBtnBase} bg-[oklch(0.66_0.22_295_/_0.15)] border-[oklch(0.66_0.22_295_/_0.4)] text-[var(--violet)] hover:bg-[oklch(0.66_0.22_295_/_0.25)]`;
export const qcxBtnGhost =
  `${qcxBtnBase} bg-transparent border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)] hover:border-[oklch(0.74_0.17_85_/_0.3)]`;
export const qcxBtnDanger =
  `${qcxBtnBase} bg-transparent border-[oklch(0.62_0.24_22_/_0.3)] text-[var(--rose)] hover:bg-[oklch(0.62_0.24_22_/_0.1)]`;

// ─── Shared icon buttons ──────────────────────────────────────────────────────
export const btnIconMini =
  'w-5 h-5 flex items-center justify-center text-[10px] text-[var(--text-lo)] hover:text-[var(--text-hi)] hover:bg-[var(--panel2)] rounded border border-transparent hover:border-[var(--border)] transition-all';
export const btnIcon =
  'w-7 h-7 flex items-center justify-center text-[11px] text-[var(--text-lo)] hover:text-[var(--text-hi)] bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] hover:border-[oklch(0.74_0.17_85_/_0.3)] transition-all';
export const btnSecondary =
  'px-3 py-1 text-[9px] font-bold text-[var(--text-mid)] bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] hover:text-[var(--text-hi)] hover:border-[oklch(0.74_0.17_85_/_0.3)] transition-all font-[var(--font-title)] tracking-[0.08em]';
