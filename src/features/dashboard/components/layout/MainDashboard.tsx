'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { useProfile } from '@/features/profile/hooks/useProfile';

import { DEFAULT_SETTINGS, QUOTES } from '../../constants';
import { useCharacterProgress } from '../../hooks/useCharacterProgress';
import { useDailyInit } from '../../hooks/useDailyInit';
import { usePenaltyFlow } from '../../hooks/usePenaltyFlow';
import { useQuestOrchestration } from '../../hooks/useQuestOrchestration';
import type { BurstPos, CenterTab, Character, DashboardSettings } from '../../types';
import { buildEmptyChar, profileToCharacter } from '../../utils/character.utils';
import { useOverdueReview } from '@/features/tasks/hooks/useOverdueReview';
import { OverdueReviewModal } from '@/features/tasks/components/shared/OverdueReviewModal';
import { useUIStore } from '@/stores/ui.store';
import { useTaskById } from '../../hooks/useTaskById';
import { useUpdateTask } from '../../hooks/useUpdateTask';
import { EditTaskModal } from '@/features/tasks/components/shared/EditTaskModal';
import { taskToUITask } from '@/features/tasks/data/adapters';
import type { UpdateTaskPayload } from '@/types';
import { CenterColumn } from './CenterColumn';
import DashboardTopbar from './DashboardTopbar';
import { DashboardOverlays } from './DashboardOverlays';
import { LeftColumn } from './LeftColumn';
import { MobileNav } from './MobileNav';
import { RightColumn } from './RightColumn';

type MobilePanel = 'center' | 'character' | 'timer';

const DOW_TO_HABIT_DAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export default function MainDashboard() {
  const settings: DashboardSettings = DEFAULT_SETTINGS;

  // Stable date strings — computed once on mount, never stale within a session.
  // Local date (not UTC) so habit/task logs match the same format used by /tasks.
  const todayDateStr = useMemo(() => {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
  }, []);
  const todayDayStr = useMemo(() => DOW_TO_HABIT_DAY[new Date().getDay()] ?? 'mon', []);
  const dateStr = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [],
  );

  // Character — one-time initialization from profile API
  const [char, setChar] = useState<Character>(buildEmptyChar);
  const charInitialized = useRef(false);
  const { data: profileData } = useProfile();
  useEffect(() => {
    const profile = profileData?.profile;
    if (!profile || charInitialized.current) return;
    setChar(profileToCharacter(profile));
    charInitialized.current = true;
  }, [profileData]);

  // Feedback state
  const [burst, setBurst] = useState<BurstPos | null>(null);
  const [toast, setToast] = useState<{ xp: number; coins: number } | null>(null);
  const [levelUp, setLevelUp] = useState<{ level: number; rank?: string } | null>(null);

  const handleBurstDone = useCallback(() => setBurst(null), []);
  const handleToastDone = useCallback(() => setToast(null), []);
  const handleLevelUpDone = useCallback(() => setLevelUp(null), []);
  const handleLevelUp = useCallback(
    (level: number, rank?: string) => setLevelUp({ level, rank }),
    [],
  );

  const { awardProgress, applyGamePatch } = useCharacterProgress(char, setChar, handleLevelUp);

  const onBurst = useCallback(
    (pos: BurstPos) => {
      if (settings.animationsEnabled) setBurst(pos);
    },
    [settings.animationsEnabled],
  );
  const onToast = useCallback((reward: { xp: number; coins: number }) => setToast(reward), []);

  // Daily init effects (rollover, Sunday reminder, monthly reminder)
  useDailyInit();

  // Quest / habit / task orchestration
  const { quests, pendingQuest, handleConfirmQuest, handleAddQuest, handleCancelQuest } =
    useQuestOrchestration({
      todayDateStr,
      todayDayStr,
      animationsEnabled: settings.animationsEnabled,
      onAwardProgress: awardProgress,
      onBurst,
      onToast,
    });

  // Penalty state machine
  const {
    penaltyState,
    penaltyFailed,
    handleEndDay,
    handlePenaltyComplete,
    handlePenaltyFail,
    handleFailureContinue,
  } = usePenaltyFlow({ quests, applyGamePatch, onToast });

  // Overdue task review
  const {
    overdueItems,
    showModal: showOverdueModal,
    dismissModal: dismissOverdueModal,
    removeItem: removeOverdueItem,
  } = useOverdueReview();

  // Restore failed task flow (triggered by notification click)
  const pendingRestoreTaskId = useUIStore((s) => s.pendingRestoreTaskId);
  const setPendingRestoreTaskId = useUIStore((s) => s.setPendingRestoreTaskId);
  const { data: restoreTask } = useTaskById(pendingRestoreTaskId);
  const { mutate: updateTaskForRestore } = useUpdateTask();

  function handleRestoreSave(id: string, payload: UpdateTaskPayload, onSuccess: () => void) {
    updateTaskForRestore(
      { id, ...payload, active: true },
      {
        onSuccess: () => {
          setPendingRestoreTaskId(null);
          onSuccess();
        },
      },
    );
  }

  // Navigation state
  const searchParams = useSearchParams();
  const [centerTab, setCenterTab] = useState<CenterTab>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'habits' || tab === 'schedule' || tab === 'stats') return tab;
    return 'schedule';
  });
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('center');

  const handleTabChange = useCallback((tab: CenterTab) => {
    setCenterTab(tab);
    setMobilePanel('center');
  }, []);

  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)] ?? QUOTES[0]);

  return (
    <>
      {/* Group essential modals */}
      <DashboardOverlays
        burst={burst}
        animationsEnabled={settings.animationsEnabled}
        onBurstDone={handleBurstDone}
        toast={toast}
        onToastDone={handleToastDone}
        levelUp={levelUp}
        onLevelUpDone={handleLevelUpDone}
        penaltyState={penaltyState}
        penaltyFailed={penaltyFailed}
        pendingQuest={pendingQuest}
        onPenaltyComplete={handlePenaltyComplete}
        onPenaltyFail={handlePenaltyFail}
        onFailureContinue={handleFailureContinue}
        onConfirmQuest={handleConfirmQuest}
        onCancelQuest={handleCancelQuest}
      />

      <OverdueReviewModal
        open={showOverdueModal}
        items={overdueItems}
        onRemoveItem={removeOverdueItem}
        onDismiss={dismissOverdueModal}
      />

      {/* Restore failed task — triggered by clicking a "Quest Failed" notification */}
      {restoreTask && pendingRestoreTaskId && (
        <EditTaskModal
          task={taskToUITask(restoreTask)}
          open={true}
          onClose={() => setPendingRestoreTaskId(null)}
          onSave={handleRestoreSave}
          saving={false}
        />
      )}

      {/* h-screen flex-col: establishes the flex context so flex-1/min-h-0 work on children */}
      <div className="flex flex-col h-screen">
        <DashboardTopbar char={char} dateStr={dateStr} onEndDay={handleEndDay} />

        {/* Desktop / Tablet layout (1025px+) */}
        {/* 1025–1279px: 2 columns [220px + 1fr]. 1280px+: 3 columns [220px + 1fr + 260px] */}
        <div className="hidden min-[1025px]:grid min-[1025px]:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_260px] gap-3 p-3 flex-1 overflow-hidden min-h-0">
          <div className="flex flex-col gap-2.5 overflow-y-auto overflow-x-hidden">
            <LeftColumn char={char} settings={settings} />
          </div>
          <CenterColumn
            tab={centerTab}
            onTabChange={handleTabChange}
            onAddQuest={handleAddQuest}
            todayDateStr={todayDateStr}
          />
          {/* Right column — wide desktop only (xl+) */}
          <div className="hidden xl:flex flex-col gap-2.5 overflow-y-auto overflow-x-hidden">
            <RightColumn settings={settings} quote={quote} />
          </div>
        </div>

        {/* Mobile layout (≤ 1024px) — pb-14 reserves space for fixed bottom nav */}
        <div className="flex flex-col min-[1025px]:hidden flex-1 overflow-hidden min-h-0 pb-14">
          {mobilePanel === 'character' && (
            <div className="flex flex-col gap-2.5 overflow-y-auto overflow-x-hidden p-3 flex-1">
              <LeftColumn char={char} settings={settings} />
            </div>
          )}
          {mobilePanel === 'timer' && (
            <div className="flex flex-col gap-2.5 overflow-y-auto overflow-x-hidden p-3 flex-1">
              <RightColumn settings={settings} quote={quote} />
            </div>
          )}
          {mobilePanel === 'center' && (
            <div className="flex flex-col gap-2.5 flex-1 overflow-hidden min-h-0 p-3">
              <CenterColumn
                tab={centerTab}
                onTabChange={handleTabChange}
                onAddQuest={handleAddQuest}
                todayDateStr={todayDateStr}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav — fixed to viewport, outside the h-screen wrapper */}
      <MobileNav
        centerTab={centerTab}
        mobilePanel={mobilePanel}
        onTabChange={handleTabChange}
        onPanelChange={setMobilePanel}
      />
    </>
  );
}
