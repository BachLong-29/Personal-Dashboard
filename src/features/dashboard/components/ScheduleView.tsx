'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/libs/utils';

import { Link } from '@/i18n/navigation';
import { useScheduleState } from '../hooks/useScheduleState';
import type { CenterTab, Quest } from '../types';
import { MonthView } from './MonthView';
import { ScheduleDayViewPanel } from './ScheduleDayViewPanel';
import { WeekView } from './WeekView';

interface ScheduleViewProps {
  onAddQuest?: (quest: Quest) => void;
  onNavigateTab?: (tab: CenterTab) => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

export function ScheduleView({ onAddQuest, onNavigateTab }: ScheduleViewProps) {
  const tDash = useTranslations('dashboard');
  const {
    tab,
    year,
    dayDate,
    weekStart,
    month,
    display,
    setTab,
    setYear,
    setDayDate,
    setWeekStart,
    setMonth,
    setDisplay,
    getMonday,
  } = useScheduleState();

  function handleNavigateDay(date: string) {
    setDayDate(date);
    setTab('day');
  }

  function handleWeekNavigateDay(date: string) {
    setDayDate(date);
    setTab('day');
  }

  return (
    <div className={outerWrap}>
      {/* Sub-tab bar + display toggles + year selector */}
      <div className={controlBar}>
        <div className={subTabGroup}>
          {(['day', 'week', 'month'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={cn(subTab, tab === t && subTabActive)}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className={rightControls}>
          <button
            type="button"
            className={cn(toggleBtn, display.showQuests && toggleBtnActive)}
            onClick={() => setDisplay({ showQuests: !display.showQuests })}
            title="Toggle quests"
          >
            ⚡ Quests
          </button>
          <button
            type="button"
            className={cn(toggleBtn, display.showHabits && toggleBtnActive)}
            onClick={() => setDisplay({ showHabits: !display.showHabits })}
            title="Toggle habits"
          >
            ✦ Habits
          </button>

          <select
            className={yearSelect}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <Link href="/tasks" className={taskLogBtn} title={tDash('scheduleView.openQuestLog')}>
            ❖ {tDash('questLog')}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className={contentArea}>
        {tab === 'day' && (
          <ScheduleDayViewPanel
            date={dayDate}
            onDateChange={(d) => {
              setDayDate(d);
              setWeekStart(getMonday(d));
              setMonth(new Date(d).getMonth());
            }}
            showQuests={display.showQuests}
            showHabits={display.showHabits}
            onAddQuest={onAddQuest}
          />
        )}
        {tab === 'week' && (
          <WeekView
            weekStart={weekStart}
            display={display}
            onWeekChange={(ws) => {
              setWeekStart(ws);
              setYear(new Date(ws).getFullYear());
            }}
            onNavigateDay={handleWeekNavigateDay}
            onNavigateTab={onNavigateTab}
          />
        )}
        {tab === 'month' && (
          <MonthView
            year={year}
            month={month}
            display={display}
            quests={[]}
            onMonthChange={(m, y) => {
              setMonth(m);
              setYear(y);
            }}
            onNavigateDay={handleNavigateDay}
            onNavigateTab={onNavigateTab}
          />
        )}
      </div>
    </div>
  );
}

const outerWrap = 'flex flex-col flex-1 min-h-0 overflow-hidden';

const controlBar =
  'flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] shrink-0 flex-wrap';

const subTabGroup = 'flex gap-1';
const subTab =
  'px-2.5 py-1 text-[9px] font-bold tracking-[0.1em] uppercase font-[var(--font-title)] rounded border border-[var(--border)] bg-[var(--panel2)] text-[var(--text-mid)] cursor-pointer transition-all hover:text-[var(--text-hi)] hover:border-[oklch(0.74_0.17_85_/_0.3)]';
const subTabActive =
  'text-[var(--gold)] border-[oklch(0.74_0.17_85_/_0.5)] bg-[oklch(0.74_0.17_85_/_0.08)] shadow-[0_0_8px_var(--gold-glow)]';

const rightControls = 'flex items-center gap-1.5 ml-auto flex-wrap';

const toggleBtn =
  'px-2 py-1 text-[9px] font-bold tracking-[0.08em] uppercase font-[var(--font-title)] rounded border border-[var(--border)] bg-[var(--panel2)] text-[var(--text-lo)] cursor-pointer transition-all hover:text-[var(--text-mid)]';
const toggleBtnActive =
  'text-[var(--gold)] border-[oklch(0.74_0.17_85_/_0.4)] bg-[oklch(0.74_0.17_85_/_0.06)]';

const yearSelect =
  'bg-[var(--panel2)] border border-[var(--border)] rounded text-[10px] text-[var(--text-hi)] px-2 py-1 cursor-pointer focus:outline-none focus:border-[var(--gold)] transition-colors appearance-none';

const contentArea = 'flex-1 min-h-0 overflow-hidden flex flex-col';

const taskLogBtn =
  'px-2 py-1 text-[9px] font-bold tracking-[0.08em] uppercase font-[var(--font-title)] rounded border border-[oklch(0.66_0.22_295_/_0.4)] bg-[oklch(0.66_0.22_295_/_0.06)] text-[var(--violet)] no-underline transition-all hover:bg-[oklch(0.66_0.22_295_/_0.14)] hover:border-[oklch(0.66_0.22_295_/_0.65)]';
