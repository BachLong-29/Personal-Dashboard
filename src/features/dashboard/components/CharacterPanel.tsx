import type { Character, DashboardSettings } from '../types';

interface CharacterPanelProps {
  char: Character;
  settings: DashboardSettings;
}

export function CharacterPanel({ char, settings }: CharacterPanelProps) {
  const xpPct = (char.xp / char.xpNext) * 100;
  const displayName = settings.characterName || char.name;

  return (
    <div className="panel panel-gold char-card">
      <div className="corner-tl" />
      <div className="corner-tr" />
      <div className="corner-bl" />
      <div className="corner-br" />
      <div className="panel-header">
        <span
          style={{
            fontSize: 9,
            color: 'var(--gold)',
            fontFamily: 'var(--font-title)',
            fontWeight: 700,
            letterSpacing: '0.15em',
          }}
        >
          PROFILE
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: 'var(--text-mid)' }}>Lv.{char.level}</span>
      </div>
      <div className="char-avatar-wrap">
        <div className="char-halo" />
        <div className="char-avatar-ring">
          <div className="char-avatar-inner">🧝‍♀️</div>
          <div className="char-rank-badge">{char.rank}</div>
        </div>
      </div>
      <div className="char-name">{displayName}</div>
      <div className="char-title-line">◆ {char.title} ◆</div>
      <div className="char-meta">
        <div className="char-meta-item">
          <div className="char-meta-val">{char.level}</div>
          <div className="char-meta-key">Level</div>
        </div>
        <div className="char-divider" />
        <div className="char-meta-item">
          <div className="char-meta-val" style={{ color: 'var(--rose)' }}>{char.streak}</div>
          <div className="char-meta-key">Streak</div>
        </div>
        <div className="char-divider" />
        <div className="char-meta-item">
          <div className="char-meta-val" style={{ color: 'var(--mint)' }}>{char.class}</div>
          <div className="char-meta-key">Class</div>
        </div>
      </div>
      <div className="xp-wrap">
        <div className="xp-label">
          <span>EXP</span>
          <span>
            {char.xp.toLocaleString()} / {char.xpNext.toLocaleString()}
          </span>
        </div>
        <div className="xp-track">
          <div className="xp-fill" style={{ width: `${xpPct}%` }} />
        </div>
      </div>
      <div className="stats-wrap">
        {char.stats.map((s) => (
          <div className="stat-row" key={s.key}>
            <span className="stat-key">{s.key}</span>
            <div className="stat-track">
              <div className="stat-fill" style={{ width: `${s.value}%`, background: s.color }} />
            </div>
            <span className="stat-val">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
