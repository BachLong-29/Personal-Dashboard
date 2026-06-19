'use client';

// Shown when a task is dragged to a day outside its [start, due] range (Flexible mode).

interface WeekDropDialogProps {
  taskTitle: string;
  /** Human-readable target date, e.g. "Jun 07" */
  targetDateLabel: string;
  onExtend: () => void;
  onMove: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function WeekDropDialog({
  taskTitle,
  targetDateLabel,
  onExtend,
  onMove,
  onCancel,
  loading,
}: WeekDropDialogProps) {
  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-[380px] bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] shadow-[0_24px_64px_oklch(0_0_0_/_0.6)] flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
            <span className="text-[11px] text-[var(--rose)]">⚠</span>
            <div>
              <div className="text-[7px] tracking-[0.18em] text-[var(--text-lo)] font-[var(--font-title)] font-bold uppercase">
                Out of Range
              </div>
              <div className="text-[13px] font-bold text-[var(--text-hi)] font-[var(--font-title)] tracking-[0.05em] leading-none">
                Reschedule Beyond Span
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4">
            <p className="text-[11px] text-[var(--text-mid)] leading-relaxed">
              Lịch mới của <span className="font-bold text-[var(--text-hi)]">{taskTitle}</span> (
              {targetDateLabel}) nằm ngoài phạm vi task. Bạn muốn:
            </p>

            <div className="flex flex-col gap-2">
              <button type="button" className={optBtn} disabled={loading} onClick={onExtend}>
                <span className="text-[var(--gold)]">⤢</span> Gia hạn Task
                <span className="ml-auto text-[8px] text-[var(--text-lo)]">đổi hạn chót</span>
              </button>
              <button type="button" className={optBtn} disabled={loading} onClick={onMove}>
                <span className="text-[var(--violet)]">↷</span> Di chuyển lịch
                <span className="ml-auto text-[8px] text-[var(--text-lo)]">dời ngày bắt đầu</span>
              </button>
              <button type="button" className={cancelBtn} disabled={loading} onClick={onCancel}>
                Huỷ
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const optBtn =
  'flex items-center gap-2 w-full px-3 py-2.5 rounded-[var(--r-sm)] border border-[var(--border)] text-[11px] font-bold text-[var(--text-hi)] hover:border-[oklch(0.74_0.17_85_/_0.4)] hover:bg-[var(--panel2)] transition-all disabled:opacity-40 disabled:cursor-not-allowed';
const cancelBtn =
  'w-full px-3 py-2 rounded-[var(--r-sm)] text-[10px] font-bold text-[var(--text-lo)] hover:text-[var(--text-mid)] transition-colors disabled:opacity-40';
