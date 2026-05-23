interface DayProgressProps {
  done: number;
  total: number;
  pct: number;
}

export function DayProgress({ done, total, pct }: DayProgressProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-[11px] font-bold text-[var(--text-mid)]">
        <strong className="text-[var(--text-hi)]">{done}</strong>
        <span className="text-[var(--text-lo)]">/{total}</span>
      </div>
      <div className="w-[80px] h-[4px] bg-[var(--panel2)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--gold)] to-[var(--violet)] rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] text-[var(--text-lo)] font-[var(--font-title)]">{pct}%</div>
    </div>
  );
}
