'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/libs/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimelineSegment {
  id: string;
  /** "HH:MM" */
  startTime: string;
  /** minutes */
  duration: number;
  /** Belongs to the task currently being planned → highlighted */
  isCurrent?: boolean;
  /** Preview of the not-yet-saved block being entered in the add form */
  isPreview?: boolean;
}

interface DayTimelineProps {
  segments: TimelineSegment[];
  /** Available work minutes for the day — drives the capacity bar + overload tint */
  capacityMinutes: number;
}

const DAY_MINUTES = 1440;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMin(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function fmtDur(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ') || '0m';
}

function endLabel(startMin: number, duration: number): string {
  const total = startMin + duration;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface PlacedSegment extends TimelineSegment {
  startMin: number;
  /** visual end clamped to the day end */
  endMin: number;
  /** true when the block runs past midnight */
  overflow: boolean;
}

/**
 * Greedy lane packing: each segment goes into the first lane whose last item
 * ends at or before this one starts. Overlapping items therefore stack into
 * separate lanes instead of rendering on top of each other.
 */
function packLanes(segments: TimelineSegment[]): PlacedSegment[][] {
  const placed: PlacedSegment[] = segments
    .map((s) => {
      const startMin = Math.max(0, Math.min(DAY_MINUTES, toMin(s.startTime)));
      const rawEnd = toMin(s.startTime) + s.duration;
      return {
        ...s,
        startMin,
        endMin: Math.min(DAY_MINUTES, rawEnd),
        overflow: rawEnd > DAY_MINUTES,
      };
    })
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  const lanes: PlacedSegment[][] = [];
  for (const seg of placed) {
    // Preview always rides on its own dedicated top lane for visibility.
    const lane = lanes.find((l) => {
      const last = l[l.length - 1];
      return last && !last.isPreview && !seg.isPreview && seg.startMin >= last.endMin;
    });
    if (lane) lane.push(seg);
    else lanes.push([seg]);
  }
  return lanes;
}

// ─── Component ────────────────────────────────────────────────────────────────

const HOUR_TICKS = [0, 6, 12, 18, 24];

export function DayTimeline({ segments, capacityMinutes }: DayTimelineProps) {
  const t = useTranslations('schedule');
  const lanes = useMemo(() => packLanes(segments), [segments]);

  // Capacity uses real (unclamped) minutes of non-preview blocks.
  const usedMinutes = useMemo(
    () => segments.filter((s) => !s.isPreview).reduce((sum, s) => sum + s.duration, 0),
    [segments],
  );
  const previewMinutes = useMemo(
    () => segments.filter((s) => s.isPreview).reduce((sum, s) => sum + s.duration, 0),
    [segments],
  );

  const loadPct = capacityMinutes > 0 ? Math.round((usedMinutes / capacityMinutes) * 100) : 0;
  const previewPct = capacityMinutes > 0 ? Math.round((previewMinutes / capacityMinutes) * 100) : 0;
  const over = usedMinutes + previewMinutes > capacityMinutes && capacityMinutes > 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Capacity ratio */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="uppercase tracking-[0.12em] font-bold font-[var(--font-title)] text-[var(--text-lo)]">
          {t('dayTimeline.dayCapacity')}
        </span>
        <span className="tabular-nums font-bold">
          <span className={over ? 'text-[var(--rose)]' : 'text-[var(--text-hi)]'}>
            {fmtDur(usedMinutes)}
            {previewMinutes > 0 && (
              <span className="text-[var(--gold)]"> +{fmtDur(previewMinutes)}</span>
            )}
          </span>
          <span className="text-[var(--text-lo)]"> / {fmtDur(capacityMinutes)}</span>
          <span className={cn('ml-1', over ? 'text-[var(--rose)]' : 'text-[var(--text-lo)]')}>
            · {loadPct + previewPct}%
          </span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--panel2)] overflow-hidden border border-[var(--border)] flex">
        <div
          className={cn(
            'h-full',
            over ? 'bg-[var(--rose)]' : 'bg-gradient-to-r from-[var(--mint)] to-[var(--cyan)]',
          )}
          style={{ width: `${Math.min(100, loadPct)}%` }}
        />
        {previewMinutes > 0 && (
          <div
            className="h-full bg-[var(--gold)] opacity-70"
            style={{ width: `${Math.min(100 - Math.min(100, loadPct), previewPct)}%` }}
          />
        )}
      </div>

      {/* Timeline */}
      <div className="relative pt-1">
        {/* Hour gridlines */}
        <div className="absolute inset-0 pointer-events-none">
          {HOUR_TICKS.map((h) => (
            <div
              key={h}
              className="absolute top-0 bottom-0 w-px bg-[var(--border)]"
              style={{ left: `${(h / 24) * 100}%` }}
            />
          ))}
        </div>

        {/* Lanes */}
        <div className="relative flex flex-col gap-1">
          {lanes.length === 0 && (
            <div className="h-6 rounded-[var(--r-sm)] border border-dashed border-[var(--border)] flex items-center justify-center text-[9px] text-[var(--text-lo)] italic">
              {t('dayTimeline.empty')}
            </div>
          )}
          {lanes.map((lane, li) => (
            <div key={li} className="relative h-5">
              {lane.map((seg) => {
                const left = (seg.startMin / DAY_MINUTES) * 100;
                const widthPct = ((seg.endMin - seg.startMin) / DAY_MINUTES) * 100;
                // Only label blocks wide enough to fit "HH:MM" without overflowing.
                const showLabel = widthPct >= 9;
                return (
                  <div
                    key={seg.id}
                    className={cn(
                      'absolute top-0 bottom-0 rounded-[3px] border flex items-center justify-center overflow-hidden',
                      seg.isPreview
                        ? 'border-dashed border-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.18)]'
                        : seg.isCurrent
                          ? 'border-[oklch(0.74_0.17_85_/_0.6)] bg-[oklch(0.74_0.17_85_/_0.3)]'
                          : 'border-[var(--border)] bg-[var(--panel3)]',
                    )}
                    style={{ left: `${left}%`, width: `${widthPct}%`, minWidth: '5px' }}
                    title={`${seg.startTime}–${endLabel(seg.startMin, seg.duration)} · ${fmtDur(seg.duration)}${seg.overflow ? ' (qua ngày hôm sau)' : ''}`}
                  >
                    {showLabel && (
                      <span
                        className={cn(
                          'text-[8px] font-bold tabular-nums truncate leading-none px-1',
                          seg.isCurrent || seg.isPreview
                            ? 'text-[var(--gold)]'
                            : 'text-[var(--text-mid)]',
                        )}
                      >
                        {seg.startTime}
                        {seg.overflow && ' →'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Hour labels */}
        <div className="relative mt-1 h-3">
          {HOUR_TICKS.map((h) => (
            <span
              key={h}
              className="absolute text-[8px] text-[var(--text-lo)] tabular-nums -translate-x-1/2"
              style={{
                left: `${(h / 24) * 100}%`,
                transform:
                  h === 0 ? 'translateX(0)' : h === 24 ? 'translateX(-100%)' : 'translateX(-50%)',
              }}
            >
              {String(h).padStart(2, '0')}h
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
