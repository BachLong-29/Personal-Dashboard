import { useEffect, useRef } from 'react';

import { MONTHLY_REMINDER_KEY, QUEST_ROLLOVER_KEY, SUNDAY_REMINDER_KEY } from '../constants';
import type { PenaltyUnfinishedItem } from '../types';
import { useCreateNotification } from './useNotificationActions';
import { useRolloverQuests } from './useRolloverQuests';

interface Params {
  /** Called with yesterday's leftover quests once rollover runs, if any. */
  onQuestsRolledOver: (items: PenaltyUnfinishedItem[]) => void;
}

export function useDailyInit({ onQuestsRolledOver }: Params) {
  const { mutate: rolloverQuests } = useRolloverQuests();
  const rolloverRef = useRef(rolloverQuests);
  useEffect(() => {
    rolloverRef.current = rolloverQuests;
  }, [rolloverQuests]);

  const onQuestsRolledOverRef = useRef(onQuestsRolledOver);
  useEffect(() => {
    onQuestsRolledOverRef.current = onQuestsRolledOver;
  }, [onQuestsRolledOver]);

  const { mutate: createNotification } = useCreateNotification();
  const notifyRef = useRef(createNotification);
  useEffect(() => {
    notifyRef.current = createNotification;
  }, [createNotification]);

  useEffect(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem(QUEST_ROLLOVER_KEY) === today) return;
    rolloverRef.current(undefined, {
      onSuccess: (data) => {
        localStorage.setItem(QUEST_ROLLOVER_KEY, today);
        if (data.items.length > 0) onQuestsRolledOverRef.current(data.items);
      },
    });
  }, []);

  useEffect(() => {
    if (new Date().getDay() !== 0) return;
    const today = new Date().toDateString();
    if (localStorage.getItem(SUNDAY_REMINDER_KEY) === today) return;
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    notifyRef.current(
      {
        type: 'planning',
        title: 'Plan Your Week 📋',
        message: "It's Sunday! Take a moment to plan your quests and goals for tomorrow.",
        expiresAt: endOfDay.toISOString(),
        dedupeKey: `planning:sunday:${today}`,
      },
      { onSuccess: () => localStorage.setItem(SUNDAY_REMINDER_KEY, today) },
    );
  }, []);

  useEffect(() => {
    const now = new Date();
    if (now.getDate() !== 29) return;
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    if (localStorage.getItem(MONTHLY_REMINDER_KEY) === monthKey) return;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthName = nextMonth.toLocaleString('en-US', { month: 'long' });
    notifyRef.current(
      {
        type: 'monthly-plan',
        title: `Plan for ${nextMonthName} 🗓`,
        message: `${nextMonthName} is coming up. Take time today to set your goals and quests for the month ahead.`,
        dedupeKey: `monthly-plan:${monthKey}`,
      },
      { onSuccess: () => localStorage.setItem(MONTHLY_REMINDER_KEY, monthKey) },
    );
  }, []);
}
