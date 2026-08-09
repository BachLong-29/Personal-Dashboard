'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/libs/utils';
import { findClass } from '@/constants/hero-data';
import { useProfile } from '@/features/profile/hooks/useProfile';
import type { Character } from '@/features/dashboard/types';
import type { UserProfileData, GoalDTO } from '@/types';
import DashboardTopbar from '@/features/dashboard/components/layout/DashboardTopbar';

import { MOCK_TROPHIES } from '../data/mock';
import type { Goal, Trophy, AmbitionsTab, AmbitionsStats } from '../types';
import { GoalsView } from './GoalsView';
import { OverviewView } from './OverviewView';
import { TrophiesView } from './TrophiesView';
import { BingoView } from './BingoView';
import type { GoalFormData } from './GoalModal';
import { GoalModal } from './GoalModal';

import { useGoals } from '../hooks/useGoals';
import { useCreateGoal } from '../hooks/useCreateGoal';
import { useUpdateGoal } from '../hooks/useUpdateGoal';
import { useDeleteGoal } from '../hooks/useDeleteGoal';
import { useToggleMilestone } from '../hooks/useToggleMilestone';

const TABS: { key: AmbitionsTab; icon: string; label: string }[] = [
  { key: 'goals', icon: '◈', label: 'Goals' },
  { key: 'overview', icon: '▦', label: 'Overview' },
  { key: 'trophies', icon: '✧', label: 'Trophies' },
  { key: 'bingo', icon: '⊞', label: 'Bingo' },
];

function dtoToGoal(dto: GoalDTO): Goal {
  return {
    id: dto.id,
    title: dto.title,
    cat: dto.cat,
    rank: dto.rank,
    priority: dto.priority,
    status: dto.status,
    progress: dto.progress,
    xp: dto.xp,
    coins: dto.coins,
    targetDate: dto.targetDate,
    targetLabel: dto.targetLabel,
    createdAt: dto.createdAt,
    daysLeft: dto.daysLeft,
    desc: dto.desc ?? '',
    note: dto.note,
    linkedTrophy: dto.linkedTrophy,
    completedDate: dto.completedDate,
    milestones: dto.milestones,
  };
}

export function AchievementsPage() {
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

  const [tab, setTab] = useState<AmbitionsTab>('goals');
  const [modal, setModal] = useState<{ mode: 'new' | 'edit'; goal?: Goal } | null>(null);

  // API hooks
  const { data: rawGoals = [] } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const toggleMilestone = useToggleMilestone();

  const goals: Goal[] = useMemo(() => rawGoals.map(dtoToGoal), [rawGoals]);

  // Trophies still from mock (no trophy API yet)
  const trophies: Trophy[] = MOCK_TROPHIES;

  const stats = useMemo<AmbitionsStats>(() => {
    const active = goals.filter((g) => g.status === 'in-progress').length;
    const completed = goals.filter((g) => g.status === 'completed').length;
    const notStarted = goals.filter((g) => g.status === 'not-started').length;
    const total = goals.filter((g) => g.status !== 'archived').length;
    const denom = total || 1;
    const activeGoals = goals.filter(
      (g) => g.status === 'in-progress' || g.status === 'not-started',
    );
    const avgProgress = activeGoals.length
      ? Math.round((activeGoals.reduce((a, g) => a + g.progress, 0) / activeGoals.length) * 100)
      : 0;
    const milestonesTotal = goals.reduce((a, g) => a + g.milestones.length, 0);
    const milestonesDone = goals.reduce((a, g) => a + g.milestones.filter((m) => m.done).length, 0);
    const unlockedT = trophies.filter((t) => t.unlocked).length;
    return {
      total,
      active,
      completed,
      notStarted,
      completionRate: Math.round((completed / denom) * 100),
      avgProgress,
      completedThisYear: completed,
      milestonesTotal,
      milestonesDone,
      trophies: unlockedT,
      totalTrophies: trophies.length,
      lockedTrophies: trophies.length - unlockedT,
    };
  }, [goals, trophies]);

  const tabCounts: Partial<Record<AmbitionsTab, number>> = {
    goals: goals.filter((g) => g.status !== 'archived').length,
    trophies: stats.trophies,
  };

  const handleToggleMilestone = (goalId: string, msId: string) => {
    toggleMilestone.mutate({ goalId, milestoneId: msId });
  };

  const handleAction = (
    action: 'edit' | 'complete' | 'archive' | 'restore' | 'delete',
    goal: Goal,
  ) => {
    if (action === 'edit') {
      setModal({ mode: 'edit', goal });
      return;
    }
    if (action === 'complete') {
      updateGoal.mutate({ id: goal.id, status: 'completed' });
      return;
    }
    if (action === 'archive') {
      updateGoal.mutate({ id: goal.id, status: 'archived' });
      return;
    }
    if (action === 'restore') {
      const status =
        goal.progress >= 1 ? 'completed' : goal.progress > 0 ? 'in-progress' : 'not-started';
      updateGoal.mutate({ id: goal.id, status });
      return;
    }
    if (action === 'delete') {
      deleteGoal.mutate(goal.id);
    }
  };

  const handleSave = (data: GoalFormData) => {
    if (modal?.mode === 'edit' && modal.goal) {
      updateGoal.mutate({
        id: modal.goal.id,
        title: data.title,
        desc: data.desc,
        cat: data.cat,
        rank: data.rank,
        priority: data.priority,
        targetDate: data.targetDate,
      });
    } else {
      createGoal.mutate({
        title: data.title,
        desc: data.desc,
        cat: data.cat,
        rank: data.rank,
        priority: data.priority,
        targetDate: data.targetDate,
        milestones: data.milestone ? [{ label: data.milestone, done: false }] : [],
      });
    }
    setModal(null);
  };

  return (
    <>
      <div className="flex flex-col h-screen">
        <DashboardTopbar char={char} dateStr={dateStr} />

        {/* Page body */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Page header */}
          <div className="shrink-0 px-4 md:px-6 py-3 sm:py-4 bg-[var(--panel)] border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3">
            {/* Left: title block */}
            <div className="flex-1 min-w-0">
              <div className="text-[8px] font-bold tracking-[0.2em] text-[var(--gold)] font-[var(--font-title)] mb-1">
                ✦ &nbsp; CHRONICLE · 2026 &nbsp; ✦
              </div>
              <h1 className="font-[var(--font-title)] text-[20px] sm:text-[22px] md:text-[26px] font-black text-[var(--text-hi)] tracking-[0.04em] leading-none mb-1.5">
                Ambitions &amp; Glory
              </h1>
              <p className="text-[10px] text-[var(--text-mid)] tracking-[0.04em]">
                <span className="text-[var(--cyan)] font-bold">{stats.active}</span> ambitions in
                motion
                {' · '}
                <span className="text-[var(--mint)] font-bold">{stats.completed}</span> conquered
                {' · '}
                <span className="text-[var(--gold)] font-bold">{stats.trophies}</span> trophies
                earned
                {' · '}
                <span className="text-[var(--gold)] font-bold">{stats.completionRate}%</span>{' '}
                completion
              </p>
            </div>

            {/* Right: tabs + action */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* Tab switcher */}
              <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
                <div className="flex bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] p-0.5 gap-0.5 min-w-max">
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.key)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-[10px] font-bold font-[var(--font-title)] tracking-[0.06em] transition-colors',
                        tab === t.key
                          ? 'bg-[oklch(0.74_0.17_85_/_0.15)] text-[var(--gold)]'
                          : 'text-[var(--text-lo)] hover:text-[var(--text-mid)]',
                      )}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                      {tabCounts[t.key] != null && (
                        <span
                          className={cn(
                            'text-[8px] px-1.5 py-0.5 rounded-full',
                            tab === t.key
                              ? 'bg-[oklch(0.74_0.17_85_/_0.2)] text-[var(--gold)]'
                              : 'bg-[var(--panel)] text-[var(--text-lo)]',
                          )}
                        >
                          {tabCounts[t.key]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* New goal — only on goals tab */}
              {tab === 'goals' && (
                <button
                  type="button"
                  onClick={() => setModal({ mode: 'new' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[oklch(0.74_0.17_85_/_0.12)] border border-[oklch(0.74_0.17_85_/_0.4)] rounded-[var(--r-sm)] text-[10px] font-bold text-[var(--gold)] font-[var(--font-title)] hover:bg-[oklch(0.74_0.17_85_/_0.22)] transition-colors"
                >
                  <span>＋</span> New Goal
                </button>
              )}
            </div>
          </div>

          {/* Tab content — scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-5">
            {tab === 'goals' && (
              <GoalsView
                goals={goals}
                stats={stats}
                onAction={handleAction}
                onToggleMilestone={handleToggleMilestone}
                onNew={() => setModal({ mode: 'new' })}
              />
            )}
            {tab === 'overview' && (
              <OverviewView
                allGoals={goals}
                stats={stats}
                trophies={trophies}
                streak={char.streak}
              />
            )}
            {tab === 'trophies' && <TrophiesView trophies={trophies} stats={stats} />}
            {tab === 'bingo' && (
              <BingoView
                goals={goals}
                streak={char.streak}
                coins={char.coins}
                gems={char.gems}
                onCompleteGoal={(goal) => handleAction('complete', goal)}
                onToggleMilestone={handleToggleMilestone}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <GoalModal
          mode={modal.mode}
          goal={modal.goal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}

// ── Character helpers (same pattern as MainDashboard) ─────────────────────────

function buildEmptyChar(): Character {
  return {
    name: '',
    title: '',
    level: 1,
    rank: 'E',
    class: '',
    streak: 0,
    xp: 0,
    xpNext: 1000,
    coins: 0,
    gems: 0,
    stats: [
      { key: 'DIS', value: 0, color: 'var(--gold)' },
      { key: 'WIS', value: 0, color: 'var(--violet)' },
      { key: 'END', value: 0, color: 'var(--mint)' },
      { key: 'COM', value: 0, color: 'var(--cyan)' },
      { key: 'SER', value: 0, color: 'var(--rose)' },
    ],
  };
}

function profileToCharacter(profile: UserProfileData): Character {
  const heroClass = findClass(profile.classId);
  const scale = (v: number) => Math.round((v / Math.max(profile.statPool, 1)) * 100);
  return {
    name: profile.heroName || 'Hero',
    title: profile.title,
    level: profile.level,
    rank: profile.rank || 'E',
    class: heroClass.name,
    streak: profile.streak,
    xp: profile.xp ?? 0,
    xpNext: profile.xpNext ?? 0,
    coins: profile.coins ?? 0,
    gems: profile.gems ?? 0,
    stats: [
      { key: 'DIS', value: scale(profile.stats.discipline), color: 'var(--gold)' },
      { key: 'WIS', value: scale(profile.stats.wisdom), color: 'var(--violet)' },
      { key: 'END', value: scale(profile.stats.endurance), color: 'var(--mint)' },
      { key: 'COM', value: scale(profile.stats.composition), color: 'var(--cyan)' },
      { key: 'SER', value: scale(profile.stats.serenity), color: 'var(--rose)' },
    ],
  };
}
