'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/libs/utils';

interface FocusTimerProps {
  duration: number;
}

export function FocusTimer({ duration }: FocusTimerProps) {
  const [secsLeft, setSecsLeft] = useState(duration * 60);
  const [running, setRunning] = useState(false);
  const [prevDuration, setPrevDuration] = useState(duration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (prevDuration !== duration) {
    setPrevDuration(duration);
    setSecsLeft(duration * 60);
  }

  const totalSecs = duration * 60;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecsLeft((s) => {
          if (s <= 1) {
            setRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const pct = secsLeft / totalSecs;
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const mins = String(Math.floor(secsLeft / 60)).padStart(2, '0');
  const secs = String(secsLeft % 60).padStart(2, '0');

  return (
    <div className={cn(panelBase, panelViolet, focusPanel)}>
      <div className={panelHeader}>
        <span className={panelHeaderTitle}>Focus Timer</span>
        <span className={panelHeaderOrnament}>◆ ◆ ◆</span>
      </div>
      <div className={focusInner}>
        <div className={focusRingWrap}>
          <svg width="110" height="110" className={focusRingSvg}>
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="oklch(0.66 0.22 295)" />
                <stop offset="100%" stopColor="oklch(0.76 0.16 205)" />
              </linearGradient>
            </defs>
            <circle cx="55" cy="55" r={r} className={focusRingBg} />
            <circle
              cx="55"
              cy="55"
              r={r}
              className={focusRingFill}
              strokeDasharray={circ}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="text-center">
            <div className={focusTime}>
              {mins}:{secs}
            </div>
            <div className={focusSublabel}>
              {running ? 'focusing...' : secsLeft === 0 ? '✦ done' : 'ready'}
            </div>
          </div>
        </div>
        <div className={focusControls}>
          <button className={cn(focusBtn, focusBtnStart)} onClick={() => setRunning((r) => !r)}>
            {running ? '⏸ Pause' : secsLeft === 0 ? '↺ Replay' : '▶ Start'}
          </button>
          <button
            className={cn(focusBtn, focusBtnReset)}
            onClick={() => {
              setRunning(false);
              setSecsLeft(totalSecs);
            }}
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  );
}

const panelBase =
  "bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] overflow-hidden relative before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:[background-image:repeating-linear-gradient(0deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px),repeating-linear-gradient(90deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px)]";
const panelViolet =
  'border-[oklch(0.66_0.22_295_/_0.35)] shadow-[0_0_20px_oklch(0.66_0.22_295_/_0.08),inset_0_0_20px_oklch(0.66_0.22_295_/_0.03)]';

const panelHeader = 'flex items-center gap-2 px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)]';
const panelHeaderTitle =
  'font-[var(--font-title)] text-[10px] font-bold tracking-[0.15em] text-[var(--gold)] uppercase flex-1';
const panelHeaderOrnament = 'text-[var(--gold-dim)] text-[8px] tracking-[3px] opacity-60';

const focusPanel = 'shrink-0';
const focusInner = 'p-[14px] flex flex-col items-center gap-2.5';

const focusRingWrap = 'relative w-[110px] h-[110px] flex items-center justify-center';
const focusRingSvg = 'absolute top-0 left-0 rotate-[-90deg]';
const focusRingBg = 'fill-none stroke-[var(--panel3)] [stroke-width:6]';
const focusRingFill =
  'fill-none stroke-[url(#timerGrad)] [stroke-width:6] [stroke-linecap:round] transition-[stroke-dashoffset] duration-1000 linear';

const focusTime =
  'font-[var(--font-title)] text-[22px] font-bold text-[var(--text-hi)] tracking-[0.05em]';
const focusSublabel =
  'text-[9px] text-[var(--text-mid)] tracking-[0.1em] uppercase';

const focusControls = 'flex gap-2';

const focusBtn =
  'px-[14px] py-1.5 rounded-[var(--r-sm)] text-[11px] font-bold cursor-pointer border transition-all duration-200 font-[var(--font-title)] tracking-[0.08em]';
const focusBtnStart =
  'bg-[linear-gradient(135deg,var(--violet-dim),var(--violet))] border-[var(--violet)] text-white shadow-[0_0_12px_var(--violet-glow)] hover:shadow-[0_0_20px_var(--violet-glow),0_0_40px_var(--violet-glow)] hover:scale-[1.02]';
const focusBtnReset =
  'bg-[var(--panel3)] border-[var(--border)] text-[var(--text-mid)] hover:border-[var(--text-mid)] hover:text-[var(--text-hi)]';
