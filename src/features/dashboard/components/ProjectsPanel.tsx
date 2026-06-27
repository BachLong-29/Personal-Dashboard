'use client';

import { Icon } from '@/components/common/Icon';
import { Link } from '@/i18n/navigation';
import { cn } from '@/libs/utils';
import { COLOR_CSS } from '@/features/projects/constants';

import { useProjects } from '@/features/projects/hooks/useProjects';

export function ProjectsPanel() {
  const { data: projects = [], isLoading } = useProjects('active');

  return (
    <div className={cn(panelBase, panelViolet, projectsPanel)}>
      <div className={panelHeader}>
        <span className={panelHeaderTitle}>Projects</span>
        <Link href="/projects" className={viewAllLink}>
          <span>VIEW ALL</span>
          <Icon icon="ArrowRight" className="text-[14px]" />
        </Link>
      </div>

      <div className={listWrap}>
        {isLoading ? (
          <div className={emptyState}>◆ Loading… ◆</div>
        ) : projects.length === 0 ? (
          <div className={emptyState}>
            No active projects.
            <Link href="/projects" className="block mt-1 text-[var(--violet)] no-underline">
              + Start a campaign
            </Link>
          </div>
        ) : (
          projects.map((p) => {
            const accent = COLOR_CSS[p.color];
            const pct = Math.round(p.progress * 100);
            return (
              <Link key={p.id} href={`/projects/${p.id}`} className={row}>
                <span
                  className={rowIcon}
                  style={{
                    background: `color-mix(in oklch, ${accent} 14%, transparent)`,
                    borderColor: `color-mix(in oklch, ${accent} 35%, transparent)`,
                  }}
                >
                  {p.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={rowName}>{p.name}</span>
                    <span className={rowPct}>{pct}%</span>
                  </div>
                  <div className={trackWrap}>
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{ width: `${pct}%`, background: accent }}
                    />
                  </div>
                  <div className={rowMeta}>
                    {p.doneTasks}/{p.totalTasks} tasks
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Panel shell (mirrors FocusTimer) ─────────────────────────────────────────
const panelBase =
  "bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] overflow-hidden relative before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:[background-image:repeating-linear-gradient(0deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px),repeating-linear-gradient(90deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px)]";
const panelViolet =
  'border-[oklch(0.66_0.22_295_/_0.35)] shadow-[0_0_20px_oklch(0.66_0.22_295_/_0.08),inset_0_0_20px_oklch(0.66_0.22_295_/_0.03)]';
const projectsPanel = 'shrink-0 flex flex-col max-h-[320px]';

const panelHeader =
  'flex items-center gap-2 px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)] shrink-0';
const panelHeaderTitle =
  'font-[var(--font-title)] text-[10px] font-bold tracking-[0.15em] text-[var(--gold)] uppercase flex-1';
const viewAllLink =
  'inline-flex items-center gap-1 text-[8px] font-bold tracking-[0.1em] text-[var(--text-lo)] hover:text-[var(--gold)] font-[var(--font-title)] transition-colors no-underline';

const listWrap = 'flex-1 overflow-y-auto p-2 flex flex-col gap-1.5';
const emptyState = 'text-[var(--text-lo)] text-center py-6 text-[11px]';

const row =
  'flex items-start gap-2.5 p-2 rounded-[var(--r-sm)] bg-[var(--panel2)] border border-[var(--border)] no-underline cursor-pointer transition-all duration-150 hover:border-[oklch(0.66_0.22_295_/_0.4)] hover:bg-[oklch(0.66_0.22_295_/_0.04)]';
const rowIcon =
  'w-8 h-8 shrink-0 rounded-[var(--r-sm)] flex items-center justify-center text-[16px] border leading-none';
const rowName =
  'flex-1 min-w-0 truncate text-[11px] font-semibold text-[var(--text-hi)] [font-family:var(--f-title)] tracking-[0.02em]';
const rowPct = 'text-[9px] text-[var(--text-lo)] shrink-0 tabular-nums';
const trackWrap = 'h-1.5 mt-1 rounded-full bg-[var(--panel3)] overflow-hidden';
const rowMeta = 'text-[9px] text-[var(--text-mid)] mt-1';
