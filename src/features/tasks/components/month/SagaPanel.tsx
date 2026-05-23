import { ACTIVITY, catOf, COLOR_VAR, type UITask } from '../../data/mock';

interface SagaPanelProps {
  sagas: UITask[];
}

export function SagaPanel({ sagas }: SagaPanelProps) {
  return (
    <div className="w-[220px] shrink-0 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] p-3 overflow-y-auto flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
        <span className="text-[8px] tracking-[0.18em] text-[var(--text-lo)] font-[var(--font-title)] font-bold">
          BOUND SAGAS
        </span>
        <span className="flex-1 h-px bg-[var(--border)]" />
        <h3 className="text-[12px] font-bold text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.05em]">
          Active Quest Lines
        </h3>
      </div>

      {/* Saga list */}
      <div className="flex flex-col gap-2">
        {sagas.length === 0 ? (
          <div className="text-[10px] text-[var(--text-lo)] text-center py-4 opacity-50">
            No active sagas
          </div>
        ) : (
          sagas.map((s) => <SagaCard key={s.id} saga={s} />)
        )}
      </div>

      {/* Activity feed */}
      <ActivityFeed />
    </div>
  );
}

// ─── Saga card ────────────────────────────────────────────────────────────────

function SagaCard({ saga }: { saga: UITask }) {
  const c = catOf(saga.cat);
  const catColor = COLOR_VAR[c.color] ?? 'var(--text-lo)';

  return (
    <div
      className="flex gap-2.5 p-2.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] hover:border-[oklch(0.74_0.17_85_/_0.3)] transition-all duration-150"
      style={{ borderLeftColor: catColor, borderLeftWidth: 2 }}
    >
      {/* Icon */}
      <div
        className="w-7 h-7 rounded-[var(--r-sm)] flex items-center justify-center text-[14px] shrink-0"
        style={{ background: `${catColor}18`, color: catColor }}
      >
        ⌬
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-[var(--text-hi)] truncate mb-[2px]">
          {saga.title}
        </div>
        <div className="text-[9px] text-[var(--text-lo)] truncate mb-1.5">{saga.desc}</div>
        <div className="flex items-center gap-2 text-[8px] text-[var(--text-lo)] mb-1.5">
          <span>{saga.subtasksDone}/{saga.subtasks} chapters</span>
          <span className="opacity-40">·</span>
          <span>{saga.deadline}</span>
          <span className="ml-auto font-bold text-[var(--violet)]">+{saga.xp} XP</span>
        </div>
        <div className="h-[3px] bg-[var(--panel)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${saga.progress * 100}%`,
              background: `linear-gradient(to right, ${catColor}, oklch(0.66 0.22 295))`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────────────

function ActivityFeed() {
  return (
    <div className="pt-3 border-t border-[var(--border)]">
      <div className="text-[8px] tracking-[0.12em] text-[var(--text-lo)] font-bold mb-2">
        RECENT ECHOES
      </div>
      <ul className="flex flex-col gap-1">
        {ACTIVITY.map((a, i) => (
          <li key={i} className="flex items-center gap-2 py-[3px]">
            <span className="text-[10px] shrink-0">{a.icon}</span>
            <span className="text-[9px] text-[var(--text-mid)] flex-1 truncate">{a.text}</span>
            <span className="text-[8px] text-[var(--text-lo)] shrink-0">{a.ts}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
