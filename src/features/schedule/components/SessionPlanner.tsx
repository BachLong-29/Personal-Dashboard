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
  const fp = from.split('-');
  const tp = to.split('-');
  const cur = new Date(Number(fp[0]), Number(fp[1]) - 1, Number(fp[2]));
  const end = new Date(Number(tp[0]), Number(tp[1]) - 1, Number(tp[2]));
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
  const parts = time.split(':');
  const total = Math.min(23 * 60 + 59, Number(parts[0]) * 60 + Number(parts[1]) + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function fmtDur(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ') || '0m';
}

function fmtDate(d: string): string {
  const p = d.split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

const MAX_BLOCK_MINUTES = 1440; // absolute hard cap (24h)

export function SessionPlanner({ open, task, onClose }: SessionPlannerProps) {
  const { data: blocks = [] } = useTaskBlocks(task?.id);
  const createBlock = useCreateScheduleBlock();
  const updateBlock = useUpdateScheduleBlock();
  const deleteBlock = useDeleteScheduleBlock();

  // Add-session form
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [durStr, setDurStr] = useState('');

  // Max duration per session (used for auto-fill and shown as a hint on inputs)
  const [maxPerSessionStr, setMaxPerSessionStr] = useState('240');

  // Inline-edit state — the block currently being edited + its draft values
  const [editId, setEditId] = useState<string | null>(null);
  const [eDate, setEDate] = useState('');
  const [eTime, setETime] = useState('');
  const [eDur, setEDur] = useState('');

  const estimate = task?.duration ?? 0;
  const allocated = useMemo(() => blocks.reduce((s, b) => s + b.duration, 0), [blocks]);
  const remaining = Math.max(0, estimate - allocated);
  const pct = estimate > 0 ? Math.min(100, Math.round((allocated / estimate) * 100)) : 0;

  const maxPerSession = Math.min(
    MAX_BLOCK_MINUTES,
    Math.max(1, parseInt(maxPerSessionStr, 10) || 240),
  );

  // Validation helpers
  const addDurNum = parseInt(durStr, 10);
  const addDurError =
    durStr && !Number.isNaN(addDurNum)
      ? addDurNum > MAX_BLOCK_MINUTES
        ? `Tối đa ${MAX_BLOCK_MINUTES} phút (24h)`
        : addDurNum > maxPerSession
          ? `Vượt giới hạn ${maxPerSession} phút/buổi`
          : ''
      : '';

  const editDurNum = parseInt(eDur, 10);
  const editDurError =
    eDur && !Number.isNaN(editDurNum)
      ? editDurNum > MAX_BLOCK_MINUTES
        ? `Tối đa ${MAX_BLOCK_MINUTES} phút`
        : editDurNum > maxPerSession
          ? `Vượt ${maxPerSession} phút`
          : ''
      : '';

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
    if (!useDate || Number.isNaN(dur) || dur < 1 || dur > MAX_BLOCK_MINUTES) return;
    createBlock.mutate(
      { sourceType: 'task', sourceId: task.id, date: useDate, startTime: time, duration: dur },
      { onSuccess: () => setDurStr('') },
    );
  }

  async function handleAutoFill() {
    if (!task || remaining <= 0) return;
    const days = eachDay(task.startDate, task.endDate ?? task.startDate);
    const n = days.length || 1;
    // Cap per-session duration at maxPerSession, rounded to 15-min intervals, min 15
    const base = Math.max(15, Math.min(maxPerSession, Math.round(remaining / n / 15) * 15));
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
      // Overflow goes into an extra block capped at maxPerSession
      await createBlock.mutateAsync({
        sourceType: 'task',
        sourceId: task.id,
        date: days.at(-1) ?? task.startDate,
        startTime: '13:00',
        duration: Math.min(rem, maxPerSession),
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
    if (!eDate || !eTime || Number.isNaN(dur) || dur < 1 || dur > MAX_BLOCK_MINUTES) return;
    updateBlock.mutate(
      { id: editId, date: eDate, startTime: eTime, duration: dur },
      { onSuccess: () => setEditId(null) },
    );
  }

  const busy = createBlock.isPending || updateBlock.isPending || deleteBlock.isPending;

  return (
    <Modal open={open} onClose={onClose} maxWidth="520px" bottomSheet scrollable>
      <ModalHead tag="SESSION PLANNER" title={`${task.icon ?? '❖'} ${task.name}`} />
      <ModalBody scrollable className="flex flex-col gap-4 px-4 sm:px-6">
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
                  <Field label={`Phút (≤${maxPerSession})`}>
                    <input
                      type="number"
                      min={1}
                      max={MAX_BLOCK_MINUTES}
                      value={eDur}
                      onChange={(e) => setEDur(e.target.value)}
                      className={cn(inputCls, 'w-[72px]', editDurError && 'border-[var(--rose)]')}
                    />
                  </Field>
                  <div className="flex items-center gap-1 ml-auto">
                    {editDurError && (
                      <span className="text-[9px] text-[var(--rose)] mr-1">{editDurError}</span>
                    )}
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={busy || !eDur || !!editDurError}
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
                  {b.duration > maxPerSession && (
                    <span className="ml-1 text-[var(--gold)]" title="Vượt max/buổi">
                      ⚠
                    </span>
                  )}
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
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--border)]">
          <div className="flex flex-wrap items-end gap-2">
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
                max={MAX_BLOCK_MINUTES}
                placeholder={
                  remaining > 0
                    ? String(Math.min(remaining, maxPerSession))
                    : String(Math.min(60, maxPerSession))
                }
                value={durStr}
                onChange={(e) => setDurStr(e.target.value)}
                className={cn(inputCls, 'w-[72px]', addDurError && 'border-[var(--rose)]')}
              />
            </Field>
            <button
              type="button"
              onClick={handleAdd}
              disabled={busy || !durStr || !!addDurError}
              className="px-3 py-1.5 text-[10px] font-bold rounded-[var(--r-sm)] border border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)] hover:border-[oklch(0.74_0.17_85_/_0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              + Thêm
            </button>
          </div>
          {/* Hint / error below the whole input row — keeps all fields the same height */}
          {addDurError ? (
            <span className="text-[9px] text-[var(--rose)]">{addDurError}</span>
          ) : (
            <span className="text-[9px] text-[var(--text-lo)]">max {maxPerSession} phút/buổi</span>
          )}
        </div>
      </ModalBody>

      <ModalFoot className="shrink-0">
        <div className="flex items-center justify-between gap-3 w-full flex-wrap">
          {/* Max per session — compact inline config */}
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] uppercase tracking-[0.1em] text-[var(--text-lo)] font-bold font-[var(--font-title)] whitespace-nowrap">
              Max/buổi
            </span>
            <input
              type="number"
              min={15}
              max={MAX_BLOCK_MINUTES}
              value={maxPerSessionStr}
              onChange={(e) => setMaxPerSessionStr(e.target.value)}
              className={cn(inputCls, 'w-[64px] py-1 text-[10px]')}
              title="Thời lượng tối đa mỗi buổi (phút) — dùng cho Auto-fill và cảnh báo nhập liệu"
            />
            <span className="text-[9px] text-[var(--text-lo)]">phút</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
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
