import type { Types } from 'mongoose';

import { EventModel } from '@/server/models/event.model';
import type { IEvent } from '@/server/models/event.model';

export type EventOverrideInput = {
  /** The occurrence being amended, as the rule generated it. */
  date: string;
  cancelled: boolean;
  /** Where it moves to — defaults to `date` when only the time changes. */
  newDate?: string;
  startTime?: string;
  duration?: number;
};

/**
 * Cancels or moves one occurrence of a repeating series.
 *
 * One override row per occurrence — amending the same day again replaces it.
 * Display fields stay on the series so a rename reaches this occurrence too.
 * Shared by `POST /events/:id/override` and the assistant.
 */
export function applyEventOverride(
  userId: string,
  seriesId: Types.ObjectId,
  data: EventOverrideInput,
): Promise<IEvent | null> {
  return EventModel.findOneAndUpdate(
    { userId, seriesRef: seriesId, overrideDate: new Date(data.date) },
    {
      $set: {
        userId,
        seriesRef: seriesId,
        overrideDate: new Date(data.date),
        startDate: new Date(data.newDate ?? data.date),
        cancelled: data.cancelled,
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.duration !== undefined && { duration: data.duration }),
      },
    },
    { new: true, upsert: true, runValidators: true },
  );
}
