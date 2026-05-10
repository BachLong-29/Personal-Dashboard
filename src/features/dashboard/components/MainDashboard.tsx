'use client';

import { useState } from 'react';

import { cn } from '@/libs/utils';

import {
  DEFAULT_SETTINGS,
  ESCALATIONS,
  QUOTES,
  RANKS,
  SKIP_CONFIRM_STORAGE_KEY,
} from '../constants';
import {
  MOCK_ACHIEVEMENTS,
  MOCK_ANALYTICS,
  MOCK_CHARACTER,
  MOCK_QUESTS,
  MOCK_SCHEDULE,
} from '../data/mock';
import type {
  Achievement,
  BurstPos,
  Character,
  CenterTab,
  DashboardSettings,
  PendingQuest,
  PenaltyState,
  Quest,
  ScheduleItem,
} from '../types';
import { AchievementsPanel } from './AchievementsPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { BurstParticles } from './BurstParticles';
import { CharacterPanel } from './CharacterPanel';
import { ConfirmQuestModal } from './ConfirmQuestModal';
import { FocusTimer } from './FocusTimer';
import { GuildPanel } from './GuildPanel';
import { PenaltyFailureModal, PenaltyModal } from './PenaltyModal';
import { QuestPanel } from './QuestPanel';
import { SchedulePanel } from './SchedulePanel';
import { XPToast } from './XPToast';
import DashboardTopbar from './DashboardTopbar';

const CENTER_TABS: { key: CenterTab; label: string }[] = [
  { key: 'quests', label: 'Quests' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'stats', label: 'Stats' },
];

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
  const [quests, setQuests] = useState<Quest[]>(MOCK_QUESTS);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(MOCK_SCHEDULE);
  const [char, setChar] = useState<Character>(MOCK_CHARACTER);
  const [achievements, setAchievements] = useState<Achievement[]>(MOCK_ACHIEVEMENTS);
  const [settings] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [centerTab, setCenterTab] = useState<CenterTab>('quests');
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

    setChar((c) => {
      const newXp = c.xp + quest.xp;
      const leveled = newXp >= c.xpNext;
      return {
        ...c,
        xp: leveled ? newXp - c.xpNext : newXp,
        coins: c.coins + quest.coins,
        gems: c.gems + (quest.difficulty === 'S' ? 5 : 0),
        level: leveled ? c.level + 1 : c.level,
        xpNext: leveled ? Math.round(c.xpNext * 1.3) : c.xpNext,
      };
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

  const handleToggleQuest = (id: number, burstPos: BurstPos | null) => {
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

  const handleConfirmQuest = (dontShowAgain: boolean) => {
    if (!pendingQuest) return;
    if (dontShowAgain) {
      setSkipConfirm(true);
      localStorage.setItem(
        SKIP_CONFIRM_STORAGE_KEY,
        JSON.stringify({ date: new Date().toDateString() }),
      );
    }
    // completeQuest(pendingQuest.quest, pendingQuest.burstPos);
    setPendingQuest(null);
  };

  const handleToggleSchedule = (idx: number) => {
    setSchedule((prev) => prev.map((s, i) => (i === idx ? { ...s, done: !s.done } : s)));
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
    setChar((c) => {
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
            {CENTER_TABS.map((t) => (
              <button
                key={t.key}
                className={cn(
                  tabButtonBase,
                  tabButtonHover,
                  centerTab === t.key && tabButtonActive,
                )}
                onClick={() => setCenterTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {centerTab === 'quests' && (
            <QuestPanel
              quests={quests}
              onToggle={handleToggleQuest}
              onAddQuest={handleAddQuest}
              animationsEnabled={settings.animationsEnabled}
            />
          )}
          {centerTab === 'schedule' && (
            <div
              className={cn(panelBase, panelGold, 'flex-1 overflow-hidden min-h-0 flex flex-col')}
            >
              <div className={cornerTL} />
              <div className={cornerTR} />
              <div className={cornerBL} />
              <div className={cornerBR} />
              <div className={panelHeader}>
                <span className={panelHeaderTitle}>Today&apos;s Schedule</span>
                <span className={panelHeaderOrnament}>◆ ◆ ◆</span>
              </div>
              <SchedulePanel schedule={schedule} onToggle={handleToggleSchedule} />
            </div>
          )}
          {centerTab === 'stats' && (
            <div
              className={cn(panelBase, panelViolet, 'flex-1 overflow-hidden min-h-0 flex flex-col')}
            >
              <div className={panelHeader}>
                <span className={panelHeaderTitle}>Weekly Analytics</span>
                <span className={panelHeaderOrnament}>◆ ◆ ◆</span>
              </div>
              <AnalyticsPanel analytics={MOCK_ANALYTICS} char={char} />
            </div>
          )}
        </div>

        <div className={scrollCol}>
          <FocusTimer duration={settings.timerDuration} />
          {settings.showQuoteCard && (
            <div className={motivationCard}>
              <div className={motivationLabel}>◆ Daily Wisdom</div>
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
