import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { EventModel } from '@/server/models/event.model';
import { expandEvents } from '@/server/services/event-expand';
import { asyncHandler, createdResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody, validateSearchParams } from '@/server/validate';
import type { IEvent } from '@/server/models/event.model';
import type { EventDTO } from '@/types/event';
import type { TaskColor } from '@/types/task';

const EVENT_COLORS = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'] as const;
const EVENT_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const recurrenceSchema = z.object({
  freq: z.enum(['weekly', 'monthly']),
  days: z.array(z.enum(EVENT_DAYS)).min(1).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  interval: z.number().int().min(1).max(12).default(1),
});

const createSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(100),
    note: z.string().max(500).optional(),
    tagId: z.string().min(1),
    color: z.enum(EVENT_COLORS),
    icon: z.string().min(1),
    allDay: z.boolean().default(false),
    startTime: z.string().regex(TIME_RE, 'Must be HH:MM').optional(),
    duration: z.number().int().min(1).max(1440).optional(),
    startDate: z.string().regex(DATE_RE, 'Must be YYYY-MM-DD'),
    endDate: z.string().regex(DATE_RE, 'Must be YYYY-MM-DD').optional(),
    recurrence: recurrenceSchema.optional(),
    busy: z.boolean().default(true),
  })
  .superRefine(checkShape);

/** Timed events need a time and a length; each frequency needs its own day field. */
export function checkShape(
  data: {
    allDay?: boolean;
    startTime?: string;
    duration?: number;
    recurrence?: { freq: 'weekly' | 'monthly'; days?: string[]; dayOfMonth?: number };
  },
  ctx: z.RefinementCtx,
) {
  if (data.allDay === false) {
    if (!data.startTime)
      ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'Start time is required' });
    if (!data.duration)
      ctx.addIssue({ code: 'custom', path: ['duration'], message: 'Duration is required' });
  }
  const rule = data.recurrence;
  if (!rule) return;
  if (rule.freq === 'weekly' && !rule.days?.length) {
    ctx.addIssue({
      code: 'custom',
      path: ['recurrence', 'days'],
      message: 'Pick at least one day',
    });
  }
  if (rule.freq === 'monthly' && !rule.dayOfMonth) {
    ctx.addIssue({
      code: 'custom',
      path: ['recurrence', 'dayOfMonth'],
      message: 'Day of month is required',
    });
  }
}

export function serialize(e: IEvent): EventDTO {
  return {
    id: e._id.toString(),
    userId: e.userId.toString(),
    title: e.title ?? '',
    note: e.note,
    tagId: e.tagId ?? '',
    color: (e.color ?? 'gold') as TaskColor,
    icon: e.icon ?? '',
    allDay: e.allDay,
    startTime: e.startTime,
    duration: e.duration,
    startDate: e.startDate.toISOString().substring(0, 10),
    endDate: e.endDate?.toISOString().substring(0, 10),
    recurrence: e.recurrence,
    seriesRef: e.seriesRef?.toString(),
    overrideDate: e.overrideDate?.toISOString().substring(0, 10),
    cancelled: e.cancelled,
    busy: e.busy,
    paused: e.paused,
    active: e.active,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

const querySchema = z.object({
  from: z.string().regex(DATE_RE).optional(),
  to: z.string().regex(DATE_RE).optional(),
});

// GET /api/v1/events — rules by default, expanded occurrences when given a range
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data: query, error } = validateSearchParams(req.nextUrl.searchParams, querySchema);
  if (error) return error;

  await connectDB();

  if (query.from && query.to) {
    return successResponse(await expandEvents(user.sub, query.from, query.to));
  }

  // Override rows are an implementation detail of a series — never listed.
  const events = await EventModel.find({
    userId: user.sub,
    active: true,
    seriesRef: { $exists: false },
  }).sort({ startDate: 1 });

  return successResponse(events.map(serialize));
});

// POST /api/v1/events
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, createSchema);
  if (error) return error;

  await connectDB();

  const event = await EventModel.create({
    userId: user.sub,
    title: data.title,
    note: data.note,
    tagId: data.tagId,
    color: data.color,
    icon: data.icon,
    allDay: data.allDay,
    startTime: data.allDay ? undefined : data.startTime,
    duration: data.allDay ? undefined : data.duration,
    startDate: new Date(data.startDate),
    // An end date only bounds a repeating rule.
    endDate: data.recurrence && data.endDate ? new Date(data.endDate) : undefined,
    recurrence: data.recurrence,
    busy: data.busy,
  });

  return createdResponse(serialize(event), 'Event created successfully');
});
