import type { Analytics, Character } from '../types';
import { MiniBarChart } from './MiniBarChart';

interface AnalyticsPanelProps {
  analytics: Analytics;
  char: Character;
}

export function AnalyticsPanel({ analytics, char }: AnalyticsPanelProps) {
  const totalXP = analytics.weeklyXP.reduce((a, b) => a + b, 0);
  const totalFocus = analytics.focusHours.reduce((a, b) => a + b, 0).toFixed(1);
  const avgTasks = (analytics.tasksDone.reduce((a, b) => a + b, 0) / 7).toFixed(1);

  return (
    <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="analytics-wrap">
        <div className="analytics-grid">
          <div className="stat-card">
            <div className="stat-card-label">Weekly XP</div>
            <div className="stat-card-val violet">{totalXP.toLocaleString()}</div>
            <div className="stat-card-sub">+12% vs last week</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Focus Hours</div>
            <div className="stat-card-val mint">{totalFocus}h</div>
            <div className="stat-card-sub">this week</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Avg. Tasks/Day</div>
            <div className="stat-card-val gold">{avgTasks}</div>
            <div className="stat-card-sub">tasks completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Current Streak</div>
            <div className="stat-card-val rose">{char.streak}🔥</div>
            <div className="stat-card-sub">days in a row</div>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Weekly XP Gain</div>
          <MiniBarChart
            data={analytics.weeklyXP}
            labels={analytics.weekLabels}
            color="oklch(0.66 0.22 295)"
            maxOverride={800}
          />
        </div>
        <div className="chart-card">
          <div className="chart-title">Focus Hours / Day</div>
          <MiniBarChart
            data={analytics.focusHours}
            labels={analytics.weekLabels}
            color="oklch(0.76 0.16 205)"
            maxOverride={5}
          />
        </div>
        <div className="chart-card">
          <div className="chart-title">Tasks Completed / Day</div>
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
