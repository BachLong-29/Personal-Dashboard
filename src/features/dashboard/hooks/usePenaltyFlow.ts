import { useCallback, useEffect, useRef, useState } from 'react';

import { ESCALATIONS } from '../constants';
import type { Character, PenaltyState, Quest } from '../types';
import { useCreateNotification } from './useNotificationActions';
import { useCompletePenalty, useCreatePenalty, useFailPenalty } from './usePenalty';

interface Params {
  quests: Quest[];
  applyGamePatch: (updater: (prev: Character) => Character) => void;
  onToast: (t: { xp: number; coins: number }) => void;
}

export function usePenaltyFlow({ quests, applyGamePatch, onToast }: Params) {
  const { mutate: createPenalty } = useCreatePenalty();
  const { mutate: completePenalty } = useCompletePenalty();
  const { mutate: failPenalty } = useFailPenalty();

  const { mutate: createNotification } = useCreateNotification();
  const notifyRef = useRef(createNotification);
  useEffect(() => {
    notifyRef.current = createNotification;
  }, [createNotification]);

  const [penaltyState, setPenaltyState] = useState<PenaltyState | null>(null);
  const [penaltyFailed, setPenaltyFailed] = useState(false);

  // Ref for the deferred state transition after failure animation
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (failTimerRef.current) clearTimeout(failTimerRef.current);
    },
    [],
  );

  const handleEndDay = useCallback(() => {
    const unfinished = quests.filter((q) => !q.done);
    const pool = unfinished.length ? unfinished : quests.slice(0, 1);
    createPenalty(pool.map((q) => ({ id: q.id, title: q.title, difficulty: q.difficulty })));
    setPenaltyState({ tier: 1, unfinished: pool });
    if (unfinished.length > 0) {
      notifyRef.current({
        type: 'reminder',
        title: '⚠ Penalty Quest Issued',
        message: `You left ${unfinished.length} quest${unfinished.length > 1 ? 's' : ''} unfinished. A corrective penalty task has been assigned.`,
      });
    }
  }, [quests, createPenalty]);

  const handlePenaltyComplete = useCallback(() => {
    completePenalty();
    onToast({ xp: 50, coins: 10 });
    setPenaltyState(null);
    notifyRef.current({
      type: 'reward',
      title: '✓ Penalty Quest Complete',
      message: 'You completed the corrective task. Consequences averted. Well done.',
    });
  }, [completePenalty, onToast]);

  const handlePenaltyFail = useCallback(() => {
    if (!penaltyState) return;
    const esc = ESCALATIONS[Math.min(penaltyState.tier - 1, ESCALATIONS.length - 1)];
    if (!esc) return;
    applyGamePatch((c) => ({
      ...c,
      stats: c.stats.map((s) => ({ ...s, value: Math.max(0, s.value - esc.statLoss) })),
    }));
    failPenalty();
    setPenaltyFailed(true);
    setPenaltyState(null);
    const nextTier = Math.min(penaltyState.tier + 1, 4);
    notifyRef.current({
      type: 'system',
      title: '☠ Penalty Escalated',
      message: `You failed the penalty quest. Consequences applied. ${nextTier <= 4 ? `Tier ${nextTier} now active.` : 'Maximum penalty reached.'}`,
    });
  }, [penaltyState, applyGamePatch, failPenalty]);

  const handleFailureContinue = useCallback(() => {
    const nextTier = Math.min((penaltyState?.tier ?? 1) + 1, 4);
    setPenaltyFailed(false);
    if (failTimerRef.current) clearTimeout(failTimerRef.current);
    failTimerRef.current = setTimeout(() => {
      const unfinished = quests.filter((q) => !q.done);
      setPenaltyState({
        tier: nextTier,
        unfinished: unfinished.length ? unfinished : quests.slice(0, 1),
      });
      failTimerRef.current = null;
    }, 400);
  }, [penaltyState, quests]);

  return {
    penaltyState,
    penaltyFailed,
    handleEndDay,
    handlePenaltyComplete,
    handlePenaltyFail,
    handleFailureContinue,
  };
}
