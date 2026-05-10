import type { Analytics, Character } from '../types';
import { MiniBarChart } from './MiniBarChart';

import { cn } from '@/libs/utils';

interface AnalyticsPanelProps {
  analytics: Analytics;
  char: Character;
}

export function AnalyticsPanel({ analytics, char }: AnalyticsPanelProps) {
  const totalXP = analytics.weeklyXP.reduce((a, b) => a + b, 0);
  const totalFocus = analytics.focusHours.reduce((a, b) => a + b, 0).toFixed(1);
  const avgTasks = (analytics.tasksDone.reduce((a, b) => a + b, 0) / 7).toFixed(1);

  return (
    <div className={analyticsOuter}>
      <div className={analyticsWrap}>
        <div className={analyticsGrid}>
          <div className={statCard}>
            <div className={statCardLabel}>Weekly XP</div>
            <div className={cn(statCardVal, statValViolet)}>{totalXP.toLocaleString()}</div>
            <div className={statCardSub}>+12% vs last week</div>
          </div>
          <div className={statCard}>
            <div className={statCardLabel}>Focus Hours</div>
            <div className={cn(statCardVal, statValMint)}>{totalFocus}h</div>
            <div className={statCardSub}>this week</div>
          </div>
          <div className={statCard}>
            <div className={statCardLabel}>Avg. Tasks/Day</div>
            <div className={cn(statCardVal, statValGold)}>{avgTasks}</div>
            <div className={statCardSub}>tasks completed</div>
          </div>
          <div className={statCard}>
            <div className={statCardLabel}>Current Streak</div>
            <div className={cn(statCardVal, statValRose)}>{char.streak}🔥</div>
            <div className={statCardSub}>days in a row</div>
          </div>
        </div>
        <div className={chartCard}>
          <div className={chartTitle}>Weekly XP Gain</div>
          <MiniBarChart
            data={analytics.weeklyXP}
            labels={analytics.weekLabels}
            color="oklch(0.66 0.22 295)"
            maxOverride={800}
          />
        </div>
        <div className={chartCard}>
          <div className={chartTitle}>Focus Hours / Day</div>
          <MiniBarChart
            data={analytics.focusHours}
            labels={analytics.weekLabels}
            color="oklch(0.76 0.16 205)"
            maxOverride={5}
          />
        </div>
        <div className={chartCard}>
          <div className={chartTitle}>Tasks Completed / Day</div>
          <MiniBarChart
            data={analytics.tasksDone}
            labels={analytics.weekLabels}
            color="oklch(0.76 0.14 162)"
            maxOverride={8}
          />
        </div>
      </div>
    </div>
  );
}

const analyticsOuter = 'flex-1 overflow-hidden min-h-0 flex flex-col';
const analyticsWrap = 'flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0';

const analyticsGrid = 'grid grid-cols-2 gap-2.5';

const statCard = 'bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r)] px-[14px] py-3';
const statCardLabel =
  'text-[9px] uppercase tracking-[0.12em] text-[var(--text-mid)] mb-1 font-[var(--font-title)]';
const statCardVal =
  'font-[var(--font-title)] text-[26px] font-bold text-[var(--text-hi)] leading-none';
const statCardSub = 'text-[10px] text-[var(--text-mid)] mt-0.5';

const statValGold = 'text-[var(--gold)]';
const statValViolet = 'text-[var(--violet)]';
const statValMint = 'text-[var(--mint)]';
const statValRose = 'text-[var(--rose)]';

const chartCard =
  'col-span-2 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r)] px-[14px] py-3';
const chartTitle =
  'text-[9px] font-[var(--font-title)] uppercase tracking-[0.12em] text-[var(--text-mid)] mb-2';
