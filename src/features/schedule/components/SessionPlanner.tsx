'use client';

import { useMemo, useState } from 'react';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/libs/utils';

import type { ScheduleBlock } from '@/types';

import { useCalendarInsights } from '../hooks/useCalendarInsights';
import {
  useCreateScheduleBlock,
  useDeleteScheduleBlock,
  useUpdateScheduleBlock,
  useTaskBlocks,
} from '../hooks/useScheduleBlocks';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlannerTask {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  /** Estimate in minutes */
  duration?: number;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate?: string;
}

interface SessionPlannerProps {
  open: boolean;
  task: PlannerTask | null;
  onClose: () => void;
}

// ─── Date / time helpers ────────────────────────────────────────────────────────

function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const cur = new Date(fy!, fm! - 1, fd!);
  const end = new Date(ty!, tm! - 1, td!);
  while (cur <= end) {
    out.push(
      [
        cur.getFullYear(),
        String(cur.getMonth() + 1).padStart(2, '0'),
        String(cur.getDate()).padStart(2, '0'),
      ].join('-'),
    );
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = Math.min(23 * 60 + 59, h! * 60 + m! + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function fmtDur(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ') || '0m';
}

function fmtDate(d: string): string {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y!, m! - 1, day!).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SessionPlanner({ open, task, onClose }: SessionPlannerProps) {
  const { data: blocks = [] } = useTaskBlocks(task?.id);
  const createBlock = useCreateScheduleBlock();
  const updateBlock = useUpdateScheduleBlock();
  const deleteBlock = useDeleteScheduleBlock();

  // Add-session form
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [durStr, setDurStr] = useState('');

  // Inline-edit state — the block currently being edited + its draft values
  const [editId, setEditId] = useState<string | null>(null);
  const [eDate, setEDate] = useState('');
  const [eTime, setETime] = useState('');
  const [eDur, setEDur] = useState('');

  const estimate = task?.duration ?? 0;
  const allocated = useMemo(() => blocks.reduce((s, b) => s + b.duration, 0), [blocks]);
  const remaining = Math.max(0, estimate - allocated);
  const pct = estimate > 0 ? Math.min(100, Math.round((allocated / estimate) * 100)) : 0;

  // Insights range: task span + any block dates (blocks may sit outside the span)
  const range = useMemo(() => {
    if (!task) return null;
    const all = [task.startDate, task.endDate ?? task.startDate, ...blocks.map((b) => b.date)];
    return {
      from: all.reduce((a, b) => (a < b ? a : b)),
      to: all.reduce((a, b) => (a > b ? a : b)),
    };
  }, [task, blocks]);

  const { data: insights } = useCalendarInsights(
    range?.from ?? '',
    range?.to ?? '',
    open && !!range,
  );

  const { hardIds, softIds, overloadedDates } = useMemo(() => {
    const hard = new Set<string>();
    const soft = new Set<string>();
    for (const c of insights?.conflicts ?? []) {
      const set = c.type === 'hard' ? hard : soft;
      set.add(c.a.id);
      set.add(c.b.id);
    }
    const over = (insights?.capacity ?? [])
      .filter((c) => c.status === 'overloaded')
      .map((c) => c.date);
    return { hardIds: hard, softIds: soft, overloadedDates: over };
  }, [insights]);

  if (!task) return null;

  const sorted = [...blocks].sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date),
  );

  function handleAdd() {
    if (!task) return;
    const dur = parseInt(durStr, 10);
    const useDate = date || task.startDate;
    if (!useDate || Number.isNaN(dur) || dur < 1) return;
    createBlock.mutate(
      { sourceType: 'task', sourceId: task.id, date: useDate, startTime: time, duration: dur },
      { onSuccess: () => setDurStr('') },
    );
  }

  async function handleAutoFill() {
    if (!task || remaining <= 0) return;
    const days = eachDay(task.startDate, task.endDate ?? task.startDate);
    const n = days.length || 1;
    const base = Math.max(15, Math.round(remaining / n / 15) * 15);
    let rem = remaining;
    for (const d of days) {
      if (rem <= 0) break;
      const dur = Math.min(rem, base);
      await createBlock.mutateAsync({
        sourceType: 'task',
        sourceId: task.id,
        date: d,
        startTime: '09:00',
        duration: dur,
      });
      rem -= dur;
    }
    if (rem > 0) {
      await createBlock.mutateAsync({
        sourceType: 'task',
        sourceId: task.id,
        date: days[n - 1]!,
        startTime: '13:00',
        duration: rem,
      });
    }
  }

  function startEdit(b: ScheduleBlock) {
    setEditId(b.id);
    setEDate(b.date);
    setETime(b.startTime);
    setEDur(String(b.duration));
  }

  function cancelEdit() {
    setEditId(null);
  }

  function saveEdit() {
    if (!editId) return;
    const dur = parseInt(eDur, 10);
    if (!eDate || !eTime || Number.isNaN(dur) || dur < 1) return;
    updateBlock.mutate(
      { id: editId, date: eDate, startTime: eTime, duration: dur },
      { onSuccess: () => setEditId(null) },
    );
  }

  const busy = createBlock.isPending || updateBlock.isPending || deleteBlock.isPending;

  return (
    <Modal open={open} onClose={onClose} maxWidth="520px">
      <ModalHead tag="SESSION PLANNER" title={`${task.icon ?? '❖'} ${task.name}`} />
      <ModalBody className="max-h-[calc(80vh-130px)] overflow-y-auto flex flex-col gap-4">
        {/* Allocation bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-[10px]">
            <span className="text-[var(--text-lo)] uppercase tracking-[0.12em] font-bold font-[var(--font-title)]">
              Đã phân bổ
            </span>
            <span className="text-[var(--text-hi)] font-bold tabular-nums">
              {fmtDur(allocated)} / {estimate > 0 ? fmtDur(estimate) : '—'}
              {estimate > 0 && <span className="text-[var(--text-lo)]"> · {pct}%</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--panel2)] overflow-hidden border border-[var(--border)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--gold)] to-[oklch(0.68_0.22_60)] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          {estimate > 0 && remaining > 0 && (
            <div className="mt-1 text-[9px] text-[var(--text-lo)]">
              Còn lại {fmtDur(remaining)} chưa xếp
            </div>
          )}
        </div>

        {/* Overload banner */}
        {overloadedDates.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--r-sm)] bg-[oklch(0.62_0.24_22_/_0.08)] border border-[oklch(0.62_0.24_22_/_0.3)]">
            <span className="text-[var(--rose)] text-[11px]">🔥</span>
            <span className="text-[9px] text-[var(--text-mid)]">
              Ngày quá tải:{' '}
              <b className="text-[var(--text-hi)]">{overloadedDates.map(fmtDate).join(', ')}</b>
            </span>
          </div>
        )}

        {/* Block list */}
        <div className="flex flex-col gap-1.5">
          {sorted.length === 0 && (
            <div className="text-[10px] text-[var(--text-lo)] italic py-2 text-center">
              Chưa có buổi nào. Thêm thủ công hoặc dùng Auto-fill.
            </div>
          )}
          {sorted.map((b) => {
            const calId = `block:${b.id}`;
            const hard = hardIds.has(calId);
            const soft = softIds.has(calId);

            // ── Inline edit row ──────────────────────────────────────────────
            if (editId === b.id) {
              return (
                <div
                  key={b.id}
                  className="flex flex-wrap items-end gap-2 px-2.5 py-2 rounded-[var(--r-sm)] border border-[var(--gold)] bg-[var(--panel2)]"
                >
                  <Field label="Ngày">
                    <input
                      type="date"
                      value={eDate}
                      onChange={(e) => setEDate(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Giờ">
                    <input
                      type="time"
                      value={eTime}
                      onChange={(e) => setETime(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Phút">
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={eDur}
                      onChange={(e) => setEDur(e.target.value)}
                      className={cn(inputCls, 'w-[64px]')}
                    />
                  </Field>
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={busy || !eDur}
                      className="px-2.5 py-1.5 text-[10px] font-bold rounded-[var(--r-sm)] border border-[oklch(0.76_0.14_162_/_0.4)] text-[var(--mint)] hover:bg-[oklch(0.76_0.14_162_/_0.1)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Lưu"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={busy}
                      className="px-2.5 py-1.5 text-[10px] font-bold rounded-[var(--r-sm)] border border-[var(--border)] text-[var(--text-lo)] hover:text-[var(--text-hi)] transition-all disabled:opacity-40"
                      title="Hủy"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            }

            // ── Display row ──────────────────────────────────────────────────
            return (
              <div
                key={b.id}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-2 rounded-[var(--r-sm)] border bg-[var(--panel2)]',
                  hard
                    ? 'border-[oklch(0.62_0.24_22_/_0.5)]'
                    : soft
                      ? 'border-[oklch(0.74_0.17_85_/_0.4)]'
                      : 'border-[var(--border)]',
                )}
              >
                <span className="text-[10px] text-[var(--text-hi)] font-semibold w-[92px] shrink-0">
                  {fmtDate(b.date)}
                </span>
                <span className="text-[10px] text-[var(--text-mid)] tabular-nums">
                  {b.startTime}–{addMinutes(b.startTime, b.duration)}
                </span>
                <span className="text-[9px] text-[var(--text-lo)] ml-auto tabular-nums">
                  {fmtDur(b.duration)}
                </span>
                {hard && (
                  <span className="text-[9px] text-[var(--rose)]" title="Trùng giờ">
                    ✕ trùng
                  </span>
                )}
                {!hard && soft && (
                  <span className="text-[9px] text-[var(--gold)]" title="Nghỉ quá ngắn">
                    ⚠ sát
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => startEdit(b)}
                  disabled={busy}
                  className="w-5 h-5 flex items-center justify-center text-[var(--text-lo)] hover:text-[var(--gold)] rounded transition-colors disabled:opacity-40"
                  title="Sửa buổi"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => deleteBlock.mutate(b.id)}
                  disabled={busy}
                  className="w-5 h-5 flex items-center justify-center text-[var(--text-lo)] hover:text-[var(--rose)] rounded transition-colors disabled:opacity-40"
                  title="Xóa buổi"
                >
                  🗑
                </button>
              </div>
            );
          })}
        </div>

        {/* Add-session form */}
        <div className="flex items-end gap-2 pt-1 border-t border-[var(--border)]">
          <Field label="Ngày">
            <input
              type="date"
              value={date || task.startDate}
              min={task.startDate}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Giờ">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Phút">
            <input
              type="number"
              min={1}
              max={1440}
              placeholder={remaining > 0 ? String(Math.min(remaining, 120)) : '60'}
              value={durStr}
              onChange={(e) => setDurStr(e.target.value)}
              className={cn(inputCls, 'w-[64px]')}
            />
          </Field>
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy || !durStr}
            className="px-3 py-1.5 text-[10px] font-bold rounded-[var(--r-sm)] border border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)] hover:border-[oklch(0.74_0.17_85_/_0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            + Thêm
          </button>
        </div>
      </ModalBody>

      <ModalFoot>
        <div className="flex items-center justify-between gap-3 w-full">
          {remaining > 0 && estimate > 0 ? (
            <Button variant="ghost" onClick={handleAutoFill} disabled={busy}>
              ⚡ Auto-fill ({fmtDur(remaining)})
            </Button>
          ) : (
            <span />
          )}
          <Button variant="primary" onClick={onClose} disabled={busy}>
            {allocated > 0 ? '✓ Xong' : 'Để sau'}
          </Button>
        </div>
      </ModalFoot>
    </Modal>
  );
}

// ─── Small field wrapper ────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[8px] uppercase tracking-[0.12em] text-[var(--text-lo)] font-bold font-[var(--font-title)]">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  'px-2 py-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] text-[11px] text-[var(--text-hi)] outline-none focus:border-[var(--gold)] transition-colors';
