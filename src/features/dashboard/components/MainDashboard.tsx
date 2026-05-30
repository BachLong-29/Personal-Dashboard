'use client';

import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { cn } from '@/libs/utils';

import {
  DEFAULT_SETTINGS,
  ESCALATIONS,
  HABIT_COINS,
  HABIT_XP,
  TASK_XP,
  TASK_COINS,
  QUOTES,
  RANKS,
  SKIP_CONFIRM_STORAGE_KEY,
  QUEST_ROLLOVER_KEY,
} from '../constants';
import { MOCK_ACHIEVEMENTS } from '../data/mock';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { useCharacterProgress } from '../hooks/useCharacterProgress';
import { useRolloverQuests } from '../hooks/useRolloverQuests';
import { findClass } from '@/constants/hero-data';
import type { UserProfileData } from '@/types';
import { useHabitLogs } from '../hooks/useHabitLogs';
import { useHabits } from '../hooks/useHabits';
import { useQuests } from '../hooks/useQuests';
import { useTasks } from '../hooks/useTasks';
import { useToggleHabitLog } from '../hooks/useToggleHabitLog';
import { useUpdateTask } from '../hooks/useUpdateTask';
import { useTaskLogs } from '../hooks/useTaskLogs';
import { useToggleTaskLog } from '../hooks/useToggleTaskLog';
import type { Task } from '@/types';
import type {
  Achievement,
  BurstPos,
  Character,
  CenterTab,
  DashboardSettings,
  Difficulty,
  Habit,
  HabitColor,
  PendingQuest,
  PenaltyState,
  Quest,
  QuestType,
} from '../types';
import { AchievementsPanel } from './AchievementsPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { BurstParticles } from './BurstParticles';
import { CharacterPanel } from './CharacterPanel';
import { ConfirmQuestModal } from './ConfirmQuestModal';
import { FocusTimer } from './FocusTimer';
import { GuildPanel } from './GuildPanel';
import { HabitPanel } from './HabitPanel';
import { PenaltyFailureModal, PenaltyModal } from './PenaltyModal';
import { QuestPanel } from './QuestPanel';
import { ScheduleView } from './ScheduleView';
import { XPToast } from './XPToast';
import DashboardTopbar from './DashboardTopbar';

function loadSkipConfirm(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(SKIP_CONFIRM_STORAGE_KEY);
    if (!saved) return false;
    const { date } = JSON.parse(saved) as { date: string };
    return date === new Date().toDateString();
  } catch {
    return false;
  }
}

export default function MainDashboard() {
  const t = useTranslations('dashboard');

  const todayDateStr = new Date().toISOString().substring(0, 10);
  const todayDay = new Date().getDay();
  const DOW_TO_HABIT_DAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const todayDayStr = DOW_TO_HABIT_DAY[todayDay];

  const { mutate: rolloverQuests } = useRolloverQuests();
  const rolloverRef = useRef(rolloverQuests);
  useEffect(() => {
    rolloverRef.current = rolloverQuests;
  }, [rolloverQuests]);

  useEffect(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem(QUEST_ROLLOVER_KEY) === today) return;
    rolloverRef.current(undefined, {
      onSuccess: () => localStorage.setItem(QUEST_ROLLOVER_KEY, today),
    });
  }, []);

  const { data: serverQuests, isLoading: questsLoading } = useQuests();
  const { data: habits = [] } = useHabits();
  const { data: habitLogs = [] } = useHabitLogs(todayDateStr);
  const { mutate: toggleHabitLog } = useToggleHabitLog();
  const { data: allTasks = [] } = useTasks();
  const { mutate: updateTask } = useUpdateTask();
  const { data: apiTaskLogs = [] } = useTaskLogs(todayDateStr);
  const { mutate: toggleTaskLog } = useToggleTaskLog();

  const [quests, setQuests] = useState<Quest[]>([]);
  const questsInitialized = useRef(false);

  const [habitDoneMap, setHabitDoneMap] = useState<Record<string, boolean>>({});
  const [taskDoneMap, setTaskDoneMap] = useState<Record<string, boolean>>({});

  /** taskId → true when today's session has been logged (multi-day tasks) */
  const taskLoggedMap = useMemo<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const log of apiTaskLogs) map[log.taskId] = true;
    return map;
  }, [apiTaskLogs]);

  useEffect(() => {
    if (serverQuests && !questsInitialized.current) {
      setQuests(serverQuests as Quest[]);
      questsInitialized.current = true;
    }
  }, [serverQuests]);

  useEffect(() => {
    const map: Record<string, boolean> = {};
    for (const log of habitLogs) {
      map[log.habitId] = log.done;
    }
    startTransition(() => setHabitDoneMap(map));
  }, [habitLogs]);

  // Build today's task quests — tasks whose date range spans today
  const todayTaskQuests = useMemo<Quest[]>(() => {
    return (allTasks as Task[])
      .filter(
        (t) =>
          t.active && t.startDate <= todayDateStr && (t.endDate ?? t.startDate) >= todayDateStr,
      )
      .map((t) => {
        const isMultiDay = !!t.endDate && t.endDate > t.startDate;
        // Multi-day: "done" in day view = today's session logged, not overall status
        const done = isMultiDay
          ? (taskDoneMap[t.id] ?? taskLoggedMap[t.id] ?? false)
          : (taskDoneMap[t.id] ?? t.status === 'done');
        return {
          id: `task-${t.id}`,
          title: t.name,
          desc: t.note ?? t.tagId,
          type: 'task' as QuestType,
          difficulty: 'C' as Difficulty,
          xp: TASK_XP,
          coins: TASK_COINS,
          done,
          tags: [t.tagId],
          taskId: t.id,
          habitIcon: t.icon,
          habitColor: t.color as HabitColor,
        };
      });
  }, [allTasks, todayDateStr, taskDoneMap, taskLoggedMap]);

  // Build today's habit quests
  const todayHabitQuests = useMemo<Quest[]>(() => {
    return (habits as Habit[])
      .filter(
        (h) => h.active && !!todayDayStr && h.schedule.some((e) => e.days.includes(todayDayStr)),
      )
      .map((h) => ({
        id: `habit-${h.id}`,
        title: h.name,
        desc: h.note ?? h.tagId,
        type: 'habit' as QuestType,
        difficulty: 'C' as Difficulty,
        xp: HABIT_XP,
        coins: HABIT_COINS,
        done: habitDoneMap[h.id] ?? false,
        tags: [h.tagId],
        habitId: h.id,
        habitColor: h.color,
        habitIcon: h.icon,
      }));
  }, [habits, todayDayStr, habitDoneMap]);

  const allQuests = useMemo<Quest[]>(
    () => [...todayTaskQuests, ...todayHabitQuests, ...quests],
    [todayTaskQuests, todayHabitQuests, quests],
  );

  const { data: profileData } = useProfile();
  const charInitialized = useRef(false);

  const [char, setChar] = useState<Character>(() => buildEmptyChar());
  const { awardProgress, applyGamePatch } = useCharacterProgress(char, setChar);

  useEffect(() => {
    const profile = profileData?.profile;
    if (!profile || charInitialized.current) return;
    setChar(profileToCharacter(profile));
    charInitialized.current = true;
  }, [profileData]);
  const searchParams = useSearchParams();
  const [achievements, setAchievements] = useState<Achievement[]>(MOCK_ACHIEVEMENTS);
  const [settings] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [centerTab, setCenterTab] = useState<CenterTab>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'habits' || tab === 'schedule' || tab === 'stats') return tab;
    return 'quests';
  });
  const [burst, setBurst] = useState<BurstPos | null>(null);
  const [toast, setToast] = useState<{ xp: number; coins: number } | null>(null);
  const [penaltyState, setPenaltyState] = useState<PenaltyState | null>(null);
  const [penaltyFailed, setPenaltyFailed] = useState(false);
  const [pendingQuest, setPendingQuest] = useState<PendingQuest | null>(null);
  const [skipConfirm, setSkipConfirm] = useState(loadSkipConfirm);

  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)] ?? QUOTES[0]);

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const completeQuest = (quest: Quest, burstPos: BurstPos | null) => {
    const newQuests = quests.map((q) => (q.id === quest.id ? { ...q, done: true } : q));
    const allDone = newQuests.length > 0 && newQuests.every((q) => q.done);

    awardProgress({
      xp: quest.xp,
      coins: quest.coins,
      gems: quest.difficulty === 'S' ? 5 : 0,
    });
    if (burstPos && settings.animationsEnabled) setBurst(burstPos);
    setToast({ xp: quest.xp, coins: quest.coins });
    setAchievements((prev) => {
      const withFirstS = prev.map((a) =>
        a.id === 'firstS' && quest.difficulty === 'S' ? { ...a, earned: true } : a,
      );
      return allDone
        ? withFirstS.map((a) => (a.id === 'perfect' ? { ...a, earned: true } : a))
        : withFirstS;
    });
    setQuests(newQuests);
  };

  const handleToggleHabit = (habitId: string, burstPos: BurstPos | null) => {
    const currentDone = habitDoneMap[habitId] ?? false;
    const newDone = !currentDone;

    setHabitDoneMap((prev) => ({ ...prev, [habitId]: newDone }));
    toggleHabitLog({ habitId, date: todayDateStr, done: newDone });

    if (newDone) {
      awardProgress({ xp: HABIT_XP, coins: HABIT_COINS });
      if (burstPos && settings.animationsEnabled) setBurst(burstPos);
      setToast({ xp: HABIT_XP, coins: HABIT_COINS });
    }
  };

  const handleToggleTask = (taskId: string, burstPos: BurstPos | null) => {
    const task = (allTasks as Task[]).find((t) => t.id === taskId);
    const isMultiDay = !!task?.endDate && task.endDate > task.startDate;

    if (isMultiDay) {
      // Multi-day: toggle today's session log — does NOT mark the task fully done
      const currentLogged = taskDoneMap[taskId] ?? taskLoggedMap[taskId] ?? false;
      const nextLogged = !currentLogged;

      setTaskDoneMap((prev) => ({ ...prev, [taskId]: nextLogged }));
      toggleTaskLog({ taskId, date: todayDateStr });

      // Transition to in_progress on first log
      if (nextLogged && task?.status === 'todo') {
        updateTask({ id: taskId, status: 'in_progress' });
      }

      if (nextLogged) {
        awardProgress({ xp: TASK_XP, coins: TASK_COINS });
        if (burstPos && settings.animationsEnabled) setBurst(burstPos);
        setToast({ xp: TASK_XP, coins: TASK_COINS });
      }
      return;
    }

    // Single-day task: toggle done status as before
    const currentDone = taskDoneMap[taskId] ?? task?.status === 'done';
    const newDone = !currentDone;
    setTaskDoneMap((prev) => ({ ...prev, [taskId]: newDone }));
    updateTask({ id: taskId, status: newDone ? 'done' : 'todo' });
    if (newDone) {
      awardProgress({ xp: TASK_XP, coins: TASK_COINS });
      if (burstPos && settings.animationsEnabled) setBurst(burstPos);
      setToast({ xp: TASK_XP, coins: TASK_COINS });
    }
  };

  const handleToggleQuest = (id: string, burstPos: BurstPos | null) => {
    if (id.startsWith('task-')) {
      handleToggleTask(id.slice('task-'.length), burstPos);
      return;
    }
    if (id.startsWith('habit-')) {
      handleToggleHabit(id.slice('habit-'.length), burstPos);
      return;
    }
    const quest = quests.find((q) => q.id === id);
    if (!quest) return;
    if (quest.done) {
      setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, done: false } : q)));
      return;
    }
    if (skipConfirm) {
      completeQuest(quest, burstPos);
    } else {
      setPendingQuest({ quest, burstPos });
    }
  };

  const handleConfirmQuest = (skipNextPrompt: boolean) => {
    if (!pendingQuest) return;
    if (skipNextPrompt) {
      setSkipConfirm(true);
      localStorage.setItem(
        SKIP_CONFIRM_STORAGE_KEY,
        JSON.stringify({ date: new Date().toDateString() }),
      );
    }
    completeQuest(pendingQuest.quest, pendingQuest.burstPos);
    setPendingQuest(null);
  };

  const handleAddQuest = (quest: Quest) => {
    setQuests((prev) => [quest, ...prev]);
  };

  const handleEndDay = () => {
    const unfinished = quests.filter((q) => !q.done);
    setPenaltyState({ tier: 1, unfinished: unfinished.length ? unfinished : quests.slice(0, 1) });
  };

  const handlePenaltyComplete = () => {
    setToast({ xp: 50, coins: 10 });
    setPenaltyState(null);
  };

  const handlePenaltyFail = () => {
    if (!penaltyState) return;
    const esc = ESCALATIONS[Math.min(penaltyState.tier - 1, ESCALATIONS.length - 1)];
    if (!esc) return;
    applyGamePatch((c) => {
      const curIdx = RANKS.indexOf(c.rank as (typeof RANKS)[number]);
      const demotedRank = RANKS[curIdx - 1];
      return {
        ...c,
        xp: Math.max(0, c.xp - esc.xpLoss),
        coins: Math.max(0, c.coins - esc.coinLoss),
        streak: esc.streakBreak ? 0 : c.streak,
        stats: c.stats.map((s) => ({ ...s, value: Math.max(0, s.value - esc.statLoss) })),
        rank: esc.rankDemote && curIdx > 0 && demotedRank ? demotedRank : c.rank,
      };
    });
    setPenaltyFailed(true);
    setPenaltyState(null);
  };

  const handleFailureContinue = () => {
    const nextTier = Math.min((penaltyState?.tier ?? 1) + 1, 4);
    setPenaltyFailed(false);
    setTimeout(() => {
      const unfinished = quests.filter((q) => !q.done);
      setPenaltyState({
        tier: nextTier,
        unfinished: unfinished.length ? unfinished : quests.slice(0, 1),
      });
    }, 400);
  };

  return (
    <>
      {burst && settings.animationsEnabled && (
        <BurstParticles x={burst.x} y={burst.y} onDone={() => setBurst(null)} />
      )}
      {toast && <XPToast xp={toast.xp} coins={toast.coins} onDone={() => setToast(null)} />}
      {penaltyState && (
        <PenaltyModal
          unfinished={penaltyState.unfinished}
          tier={penaltyState.tier}
          onComplete={handlePenaltyComplete}
          onFail={handlePenaltyFail}
        />
      )}
      {penaltyFailed && (
        <PenaltyFailureModal tier={penaltyState?.tier ?? 1} onContinue={handleFailureContinue} />
      )}
      {pendingQuest && (
        <ConfirmQuestModal
          quest={pendingQuest.quest}
          onConfirm={handleConfirmQuest}
          onCancel={() => setPendingQuest(null)}
        />
      )}

      <DashboardTopbar char={char} dateStr={dateStr} onEndDay={handleEndDay} />

      <div className={dashboardLayout}>
        <div className={scrollCol}>
          <CharacterPanel char={char} settings={settings} />
          <AchievementsPanel achievements={achievements} />
        </div>

        <div className={centerCol}>
          <div className={centerTabs}>
            {(
              [
                { key: 'quests', label: t('tabs.quests') },
                { key: 'habits', label: t('tabs.habits') },
                { key: 'schedule', label: t('tabs.schedule') },
                { key: 'stats', label: t('tabs.stats') },
              ] satisfies { key: CenterTab; label: string }[]
            ).map((tab) => (
              <Button
                key={tab.key}
                type="button"
                variant="ghost"
                className={cn(
                  tabButtonBase,
                  tabButtonHover,
                  centerTab === tab.key && tabButtonActive,
                )}
                onClick={() => setCenterTab(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {centerTab === 'quests' && (
            <QuestPanel
              quests={allQuests}
              onToggle={handleToggleQuest}
              onAddQuest={handleAddQuest}
              animationsEnabled={settings.animationsEnabled}
              isLoading={questsLoading}
            />
          )}
          {centerTab === 'habits' && <HabitPanel todayStr={todayDateStr} />}
          {centerTab === 'schedule' && (
            <div
              className={cn(panelBase, panelGold, 'flex-1 overflow-hidden min-h-0 flex flex-col')}
            >
              <div className={cornerTL} />
              <div className={cornerTR} />
              <div className={cornerBL} />
              <div className={cornerBR} />
              <div className={panelHeader}>
                <span className={panelHeaderTitle}>{t('schedule.title')}</span>
                <span className={panelHeaderOrnament}>◆ ◆ ◆</span>
              </div>
              <ScheduleView quests={quests} onNavigateTab={setCenterTab} />
            </div>
          )}
          {centerTab === 'stats' && (
            <div
              className={cn(panelBase, panelViolet, 'flex-1 overflow-hidden min-h-0 flex flex-col')}
            >
              <div className={panelHeader}>
                <span className={panelHeaderTitle}>{t('analytics.title')}</span>
                <span className={panelHeaderOrnament}>◆ ◆ ◆</span>
              </div>
              <AnalyticsPanel />
            </div>
          )}
        </div>

        <div className={scrollCol}>
          <FocusTimer duration={settings.timerDuration} />
          {settings.showQuoteCard && (
            <div className={motivationCard}>
              <div className={motivationLabel}>◆ {t('motivation.dailyWisdom')}</div>
              <div className={motivationText}>&ldquo;{quote?.text}&rdquo;</div>
              <div className={motivationAuthor}>{quote?.author}</div>
            </div>
          )}
          {settings.showGuildPanel && <GuildPanel />}
        </div>
      </div>
    </>
  );
}

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

const dashboardLayout = 'grid grid-cols-[220px_1fr_260px] gap-3 p-3 flex-1 overflow-hidden min-h-0';

const scrollCol = 'flex flex-col gap-2.5 overflow-y-auto overflow-x-hidden';
const centerCol = 'flex flex-col gap-2.5 overflow-hidden min-h-0';
const centerTabs = 'flex gap-1 shrink-0';

const tabButtonBase =
  'font-[var(--font-title)] text-[10px] tracking-[0.12em] font-bold text-[var(--text-mid)] bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r-sm)] px-[14px] py-[7px] cursor-pointer transition-all duration-200 uppercase';
const tabButtonHover = 'hover:text-[var(--text-hi)] hover:border-[oklch(0.74_0.17_85_/_0.3)]';
const tabButtonActive =
  'text-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.08)] border-[oklch(0.74_0.17_85_/_0.5)] shadow-[0_0_12px_var(--gold-glow)]';

const panelBase =
  "bg-[var(--panel)] border border-[var(--border)] rounded-[var(--r)] overflow-hidden relative before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:[background-image:repeating-linear-gradient(0deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px),repeating-linear-gradient(90deg,transparent,transparent_28px,oklch(1_0_0_/_0.012)_28px,oklch(1_0_0_/_0.012)_29px)]";
const panelGold =
  'border-[oklch(0.74_0.17_85_/_0.35)] shadow-[0_0_20px_oklch(0.74_0.17_85_/_0.06),inset_0_0_20px_oklch(0.74_0.17_85_/_0.03)]';
const panelViolet =
  'border-[oklch(0.66_0.22_295_/_0.35)] shadow-[0_0_20px_oklch(0.66_0.22_295_/_0.08),inset_0_0_20px_oklch(0.66_0.22_295_/_0.03)]';

const panelHeader =
  'flex items-center gap-2 px-[14px] pt-[10px] pb-[8px] border-b border-[var(--border)]';
const panelHeaderTitle =
  'font-[var(--font-title)] text-[10px] font-bold tracking-[0.15em] text-[var(--gold)] uppercase flex-1';
const panelHeaderOrnament = 'text-[var(--gold-dim)] text-[8px] tracking-[3px] opacity-60';

const cornerBase = 'absolute w-3 h-3 pointer-events-none border-[var(--gold-dim)]';
const cornerTL = cn(cornerBase, 'top-[5px] left-[5px] border-t-[1.5px] border-l-[1.5px]');
const cornerTR = cn(cornerBase, 'top-[5px] right-[5px] border-t-[1.5px] border-r-[1.5px]');
const cornerBL = cn(cornerBase, 'bottom-[5px] left-[5px] border-b-[1.5px] border-l-[1.5px]');
const cornerBR = cn(cornerBase, 'bottom-[5px] right-[5px] border-b-[1.5px] border-r-[1.5px]');

const motivationCard =
  'bg-[linear-gradient(135deg,oklch(0.35_0.15_295_/_0.25),oklch(0.28_0.12_270_/_0.2))] border border-[oklch(0.66_0.22_295_/_0.3)] rounded-[var(--r)] px-[14px] py-3 shrink-0';
const motivationLabel =
  'text-[8px] tracking-[0.12em] uppercase text-[var(--violet)] font-[var(--font-title)] mb-[5px]';
const motivationText = 'text-[11px] text-[var(--text-hi)] leading-[1.6] italic';
const motivationAuthor = 'text-[9px] text-[var(--text-mid)] mt-1 text-right';
