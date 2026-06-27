'use client';

import { CoinIcon } from '@/components/common/CoinIcon';
import { Link } from '@/i18n/navigation';
import { cn } from '@/libs/utils';
import type { ProjectDTO } from '@/types/project';

import { COLOR_CSS, PRIORITY_CSS } from '../constants';

function deadlineLabel(deadline?: string): { text: string; overdue: boolean } | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((d.getTime() - today.getTime()) / 86_400_000);
  const text = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { text, overdue: days < 0 };
}

export function ProjectCard({ project }: { project: ProjectDTO }) {
  const accent = COLOR_CSS[project.color];
  const pct = Math.round(project.progress * 100);
  const dl = deadlineLabel(project.deadline);
  const completed = project.status === 'completed';
  const overdue = dl?.overdue && !completed;

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        'group relative flex flex-col gap-3 p-4 no-underline',
        'bg-[var(--panel)] border rounded-[var(--r)] transition-all duration-200',
        'hover:-translate-y-0.5',
        completed
          ? 'border-[var(--gold)] shadow-[var(--sh-glow-gold)]'
          : 'border-[var(--border)] hover:border-[var(--border-hi)]',
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span
          className="w-10 h-10 shrink-0 rounded-[var(--r-sm)] flex items-center justify-center text-[20px] border"
          style={{
            background: `color-mix(in oklch, ${accent} 12%, transparent)`,
            borderColor: `color-mix(in oklch, ${accent} 35%, transparent)`,
          }}
        >
          {project.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="flex-1 min-w-0 truncate text-[14px] font-bold text-[var(--text-hi)] [font-family:var(--f-title)] tracking-[0.02em]">
              {project.name}
            </h3>
            {completed && <span className="text-[var(--gold)] text-[13px]">✓</span>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-[8px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-[3px]"
              style={{
                color: PRIORITY_CSS[project.priority],
                background: `color-mix(in oklch, ${PRIORITY_CSS[project.priority]} 14%, transparent)`,
              }}
            >
              {project.priority}
            </span>
            {project.description && (
              <span className="text-[10px] text-[var(--text-lo)] truncate">
                {project.description}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1">
        <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${pct}%`, background: accent }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--text-mid)] font-bold">
            {project.doneTasks}/{project.totalTasks} tasks
          </span>
          <span className="text-[var(--text-lo)]">{pct}%</span>
        </div>
      </div>

      {/* Footer: reward + deadline */}
      <div className="flex items-center justify-between text-[10px] [font-family:var(--f-title)] tracking-[0.04em]">
        <span className="flex items-center gap-2 text-[var(--text-mid)]">
          <span className="text-[var(--gold)]">✦ {project.xp} XP</span>
          <span className="text-[var(--text-lo)]">·</span>
          <span className="text-[var(--gold)]">
            <CoinIcon /> {project.coins}
          </span>
        </span>
        {dl && (
          <span className={overdue ? 'text-[var(--rose)] font-bold' : 'text-[var(--text-lo)]'}>
            {overdue ? '⚠ ' : '⏱ '}
            {dl.text}
          </span>
        )}
      </div>
    </Link>
  );
}
