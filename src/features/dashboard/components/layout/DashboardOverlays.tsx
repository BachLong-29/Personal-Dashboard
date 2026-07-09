import { memo } from 'react';

import type { BurstPos, PendingQuest, PenaltyState } from '../../types';
import { BurstParticles } from '../feedback/BurstParticles';
import { ConfirmQuestModal } from '../schedule/ConfirmQuestModal';
import { LevelUpToast } from '../feedback/LevelUpToast';
import { PenaltyFailureModal } from '../penalty/PenaltyFailureModal';
import { PenaltyModal } from '../penalty/PenaltyModal';
import { XPToast } from '../feedback/XPToast';

interface Props {
  burst: BurstPos | null;
  animationsEnabled: boolean;
  onBurstDone: () => void;
  toast: { xp: number; coins: number } | null;
  onToastDone: () => void;
  levelUp: { level: number; rank?: string } | null;
  onLevelUpDone: () => void;
  penaltyState: PenaltyState | null;
  penaltyFailed: boolean;
  pendingQuest: PendingQuest | null;
  onPenaltyComplete: () => void;
  onPenaltyFail: () => void;
  onFailureContinue: () => void;
  onConfirmQuest: (skipNextPrompt: boolean) => void;
  onCancelQuest: () => void;
}

/**
 * Group essential modals
 */
export const DashboardOverlays = memo(function DashboardOverlays({
  burst,
  animationsEnabled,
  onBurstDone,
  toast,
  onToastDone,
  levelUp,
  onLevelUpDone,
  penaltyState,
  penaltyFailed,
  pendingQuest,
  onPenaltyComplete,
  onPenaltyFail,
  onFailureContinue,
  onConfirmQuest,
  onCancelQuest,
}: Props) {
  return (
    <>
      {burst && animationsEnabled && (
        <BurstParticles x={burst.x} y={burst.y} onDone={onBurstDone} />
      )}
      {toast && <XPToast xp={toast.xp} coins={toast.coins} onDone={onToastDone} />}
      {levelUp && <LevelUpToast level={levelUp.level} rank={levelUp.rank} onDone={onLevelUpDone} />}
      {penaltyState && (
        <PenaltyModal
          unfinished={penaltyState.unfinished}
          tier={penaltyState.tier}
          onComplete={onPenaltyComplete}
          onFail={onPenaltyFail}
        />
      )}
      {penaltyFailed && (
        <PenaltyFailureModal tier={penaltyState?.tier ?? 1} onContinue={onFailureContinue} />
      )}
      {pendingQuest && (
        <ConfirmQuestModal
          quest={pendingQuest.quest}
          onConfirm={onConfirmQuest}
          onCancel={onCancelQuest}
        />
      )}
    </>
  );
});
