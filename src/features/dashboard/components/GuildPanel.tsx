import type { GuildMember } from '../types';

const GUILD_MEMBERS: GuildMember[] = [
  { name: 'Zephyr Cole', level: 31, avatar: '🧙‍♂️', online: true },
  { name: 'Nova Kim', level: 28, avatar: '🧝‍♀️', online: true },
  { name: 'Rein Ashford', level: 19, avatar: '⚔️', online: false },
  { name: 'Luna Vale', level: 22, avatar: '🌙', online: true },
];

const onlineCount = GUILD_MEMBERS.filter((m) => m.online).length;

export function GuildPanel() {
  return (
    <div className="panel guild-panel">
      <div className="panel-header">
        <span className="panel-header-title">Guild ◆ Aetheria</span>
        <span style={{ fontSize: 9, color: 'var(--mint)' }}>{onlineCount} Online</span>
      </div>
      <div className="guild-list">
        {GUILD_MEMBERS.map((m, i) => (
          <div key={i} className="guild-member">
            <div className="guild-avatar">{m.avatar}</div>
            <span className="guild-name">{m.name}</span>
            <span className="guild-level">Lv.{m.level}</span>
            <div className={m.online ? 'guild-online' : 'guild-offline'} />
          </div>
        ))}
      </div>
    </div>
  );
}
