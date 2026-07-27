import { useEffect, useRef } from 'react';

import { MONTHLY_REMINDER_KEY, QUEST_ROLLOVER_KEY, SUNDAY_REMINDER_KEY } from '../constants';
import { useCreateNotification } from './useNotificationActions';
import { useRolloverQuests } from './useRolloverQuests';

export function useDailyInit() {
  const { mutate: rolloverQuests } = useRolloverQuests();
  const rolloverRef = useRef(rolloverQuests);
  useEffect(() => {
    rolloverRef.current = rolloverQuests;
  }, [rolloverQuests]);

  const { mutate: createNotification } = useCreateNotification();
  const notifyRef = useRef(createNotification);
  useEffect(() => {
    notifyRef.current = createNotification;
  }, [createNotification]);

  useEffect(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem(QUEST_ROLLOVER_KEY) === today) return;
    rolloverRef.current(undefined, {
      onSuccess: () => localStorage.setItem(QUEST_ROLLOVER_KEY, today),
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
