'use client';

import { useEffect, useRef, useState } from 'react';

import DashboardTopbar from '@/features/dashboard/components/DashboardTopbar';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { buildEmptyChar, profileToCharacter } from '@/features/dashboard/utils/character.utils';
import type { Character } from '@/features/dashboard/types';

import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from './ProjectCard';
import { ProjectFormModal } from './ProjectFormModal';

type Filter = 'active' | 'completed' | 'all';

export function ProjectsList() {
  // ── Character for the topbar ────────────────────────────────────────────────
  const { data: profileData } = useProfile();
  const charInitialized = useRef(false);
  const [char, setChar] = useState<Character>(() => buildEmptyChar());
  useEffect(() => {
    const profile = profileData?.profile;
    if (!profile || charInitialized.current) return;
    setChar(profileToCharacter(profile));
    charInitialized.current = true;
  }, [profileData]);

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const [filter, setFilter] = useState<Filter>('active');
  const { data: projects = [], isLoading } = useProjects(filter === 'all' ? undefined : filter);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)] overflow-hidden">
      <DashboardTopbar char={char} dateStr={dateStr} onEndDay={() => {}} />

      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 gap-4">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] tracking-[0.3em] text-[var(--gold)] [font-family:var(--f-title)]">
              CAMPAIGNS
            </div>
            <h1 className="text-[22px] font-bold text-[var(--text-hi)] [font-family:var(--f-title)] tracking-[0.03em]">
              Projects
            </h1>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1 bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)] p-1">
            {(['active', 'completed', 'all'] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={
                  'px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] rounded-[var(--r-sm)] transition-all [font-family:var(--f-title)] ' +
                  (filter === f
                    ? 'bg-[oklch(0.74_0.17_85_/_0.14)] text-[var(--gold)]'
                    : 'text-[var(--text-mid)] hover:text-[var(--text-hi)]')
                }
              >
                {f}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] [font-family:var(--f-title)] rounded-[var(--r-sm)] bg-gradient-to-br from-[var(--gold-2)] to-[var(--gold)] text-[#0a0400] border border-[var(--gold)] hover:-translate-y-px transition-all"
          >
            ＋ New Project
          </button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-[13px] text-[var(--text-lo)] py-10 text-center">
            Loading projects…
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="text-[40px] opacity-60">📦</div>
            <div className="text-[14px] text-[var(--text-mid)] font-bold">No projects yet</div>
            <div className="text-[12px] text-[var(--text-lo)]">
              Create a project to group related tasks into one campaign.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>

      <ProjectFormModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
