import type { Achievement } from '../types';

interface AchievementsPanelProps {
  achievements: Achievement[];
}

export function AchievementsPanel({ achievements }: AchievementsPanelProps) {
  return (
    <div className="panel panel-gold">
      <div className="panel-header">
        <span className="panel-header-title">Achievements</span>
        <span className="panel-header-ornament">◆ ◆ ◆</span>
      </div>
      <div className="ach-grid">
        {achievements.map((a) => (
          <div key={a.id} className={`ach-chip${a.earned ? ' earned' : ''}`} title={a.desc}>
            <span className="ach-icon">{a.icon}</span>
            <span className="ach-label">{a.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
