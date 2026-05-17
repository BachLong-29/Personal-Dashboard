'use client';

import { useCallback, useEffect, useState } from 'react';

export type ScheduleSubTab = 'day' | 'week' | 'month';

export interface ScheduleDisplayOptions {
  showQuests: boolean;
  showHabits: boolean;
}

interface ScheduleState {
  tab: ScheduleSubTab;
  year: number;
  dayDate: string;
  weekStart: string;
  month: number;
  display: ScheduleDisplayOptions;
}

const STORAGE_KEY = 'aetheria_schedule_state';

function getTodayStr(): string {
  return new Date().toISOString().substring(0, 10);
}

function getMonday(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().substring(0, 10);
}

function defaultState(): ScheduleState {
  const today = getTodayStr();
  return {
    tab: 'day',
    year: new Date().getFullYear(),
    dayDate: today,
    weekStart: getMonday(today),
    month: new Date().getMonth(),
    display: { showQuests: true, showHabits: true },
  };
}

function loadState(): ScheduleState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...(JSON.parse(raw) as Partial<ScheduleState>) };
  } catch {
    return defaultState();
  }
}

export function useScheduleState() {
  const [state, setState] = useState<ScheduleState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }, [state]);

  const setTab = useCallback((tab: ScheduleSubTab) => setState((s) => ({ ...s, tab })), []);
  const setYear = useCallback(
    (year: number) =>
      setState((s) => ({
        ...s,
        year,
        dayDate: s.dayDate.replace(/^\d{4}/, String(year)),
        weekStart: s.weekStart.replace(/^\d{4}/, String(year)),
      })),
    [],
  );
  const setDayDate = useCallback(
    (dayDate: string) =>
      setState((s) => ({
        ...s,
        dayDate,
        year: new Date(dayDate).getFullYear(),
      })),
    [],
  );
  const setWeekStart = useCallback(
    (weekStart: string) =>
      setState((s) => ({
        ...s,
        weekStart,
        year: new Date(weekStart).getFullYear(),
      })),
    [],
  );
  const setMonth = useCallback(
    (month: number) => setState((s) => ({ ...s, month })),
    [],
  );
  const setDisplay = useCallback(
    (display: Partial<ScheduleDisplayOptions>) =>
      setState((s) => ({ ...s, display: { ...s.display, ...display } })),
    [],
  );

  return {
    ...state,
    setTab,
    setYear,
    setDayDate,
    setWeekStart,
    setMonth,
    setDisplay,
    getMonday,
  };
}
