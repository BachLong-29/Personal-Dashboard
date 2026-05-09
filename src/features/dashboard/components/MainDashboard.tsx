'use client';

import { useState } from 'react';

import { DEFAULT_SETTINGS, ESCALATIONS, QUOTES, RANKS, SKIP_CONFIRM_STORAGE_KEY } from '../constants';
import { MOCK_ACHIEVEMENTS, MOCK_ANALYTICS, MOCK_CHARACTER, MOCK_QUESTS, MOCK_SCHEDULE } from '../data/mock';
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
import { DashboardTopbar } from './DashboardTopbar';
import { FocusTimer } from './FocusTimer';
import { GuildPanel } from './GuildPanel';
import { PenaltyFailureModal, PenaltyModal } from './PenaltyModal';
import { QuestPanel } from './QuestPanel';
import { SchedulePanel } from './SchedulePanel';
import { XPToast } from './XPToast';

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

  function completeQuest(quest: Quest, burstPos: BurstPos | null) {
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
  }

  function handleToggleQuest(id: number, burstPos: BurstPos | null) {
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
  }

  function handleConfirmQuest(dontShowAgain: boolean) {
    if (!pendingQuest) return;
    if (dontShowAgain) {
      setSkipConfirm(true);
      localStorage.setItem(SKIP_CONFIRM_STORAGE_KEY, JSON.stringify({ date: new Date().toDateString() }));
    }
    completeQuest(pendingQuest.quest, pendingQuest.burstPos);
    setPendingQuest(null);
  }

  function handleToggleSchedule(idx: number) {
    setSchedule((prev) => prev.map((s, i) => (i === idx ? { ...s, done: !s.done } : s)));
  }

  function handleAddQuest(quest: Quest) {
    setQuests((prev) => [quest, ...prev]);
  }

  function handleEndDay() {
    const unfinished = quests.filter((q) => !q.done);
    setPenaltyState({ tier: 1, unfinished: unfinished.length ? unfinished : quests.slice(0, 1) });
  }

  function handlePenaltyComplete() {
    setToast({ xp: 50, coins: 10 });
    setPenaltyState(null);
  }

  function handlePenaltyFail() {
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
  }

  function handleFailureContinue() {
    const nextTier = Math.min((penaltyState?.tier ?? 1) + 1, 4);
    setPenaltyFailed(false);
    setTimeout(() => {
      const unfinished = quests.filter((q) => !q.done);
      setPenaltyState({ tier: nextTier, unfinished: unfinished.length ? unfinished : quests.slice(0, 1) });
    }, 400);
  }

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

      <div className="dashboard">
        <div className="left-col">
          <CharacterPanel char={char} settings={settings} />
          <AchievementsPanel achievements={achievements} />
        </div>

        <div className="center-col">
          <div className="center-tabs">
            {CENTER_TABS.map((t) => (
              <button
                key={t.key}
                className={`tab-btn${centerTab === t.key ? ' active' : ''}`}
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
              className="panel panel-gold"
              style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}
            >
              <div className="corner-tl" />
              <div className="corner-tr" />
              <div className="corner-bl" />
              <div className="corner-br" />
              <div className="panel-header">
                <span className="panel-header-title">Today&apos;s Schedule</span>
                <span className="panel-header-ornament">◆ ◆ ◆</span>
              </div>
              <SchedulePanel schedule={schedule} onToggle={handleToggleSchedule} />
            </div>
          )}
          {centerTab === 'stats' && (
            <div
              className="panel panel-violet"
              style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}
            >
              <div className="panel-header">
                <span className="panel-header-title">Weekly Analytics</span>
                <span className="panel-header-ornament">◆ ◆ ◆</span>
              </div>
              <AnalyticsPanel analytics={MOCK_ANALYTICS} char={char} />
            </div>
          )}
        </div>

        <div className="right-col">
          <FocusTimer duration={settings.timerDuration} />
          {settings.showQuoteCard && (
            <div className="motivation-card">
              <div className="motivation-label">◆ Daily Wisdom</div>
              <div className="motivation-text">&ldquo;{quote?.text}&rdquo;</div>
              <div className="motivation-author">{quote?.author}</div>
            </div>
          )}
          {settings.showGuildPanel && <GuildPanel />}
        </div>
      </div>
    </>
  );
}
