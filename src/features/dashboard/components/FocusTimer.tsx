'use client';

import { useEffect, useRef, useState } from 'react';

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
    <div className="focus-panel panel panel-violet">
      <div className="panel-header">
        <span className="panel-header-title">Focus Timer</span>
        <span className="panel-header-ornament">◆ ◆ ◆</span>
      </div>
      <div className="focus-inner">
        <div className="focus-ring-wrap">
          <svg width="110" height="110" className="focus-ring-svg">
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="oklch(0.66 0.22 295)" />
                <stop offset="100%" stopColor="oklch(0.76 0.16 205)" />
              </linearGradient>
            </defs>
            <circle cx="55" cy="55" r={r} className="focus-ring-bg" />
            <circle
              cx="55"
              cy="55"
              r={r}
              className="focus-ring-fill"
              strokeDasharray={circ}
              strokeDashoffset={offset}
            />
          </svg>
          <div style={{ textAlign: 'center' }}>
            <div className="focus-time">
              {mins}:{secs}
            </div>
            <div className="focus-sublabel">
              {running ? 'focusing...' : secsLeft === 0 ? '✦ done' : 'ready'}
            </div>
          </div>
        </div>
        <div className="focus-controls">
          <button className="focus-btn start" onClick={() => setRunning((r) => !r)}>
            {running ? '⏸ Pause' : secsLeft === 0 ? '↺ Replay' : '▶ Start'}
          </button>
          <button
            className="focus-btn reset"
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
