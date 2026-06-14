import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { GoalModel } from '@/server/models/goal.model';
import { asyncHandler, createdResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';
import type { IGoal } from '@/server/models/goal.model';
import type { GoalDTO } from '@/types/goal';

const GOAL_CATS       = ['career', 'health', 'learning', 'finance', 'personal'] as const;
const GOAL_RANKS      = ['S', 'A', 'B', 'C', 'D'] as const;
const GOAL_PRIORITIES = ['high', 'medium', 'low'] as const;

// XP and coins awarded by rank
const RANK_REWARD: Record<string, { xp: number; coins: number }> = {
  S: { xp: 880, coins: 240 },
  A: { xp: 560, coins: 150 },
  B: { xp: 420, coins: 110 },
  C: { xp: 300, coins: 80 },
  D: { xp: 180, coins: 50 },
};

const milestoneSchema = z.object({
  label: z.string().min(1).max(200),
  done:  z.boolean().default(false),
});

const createSchema = z.object({
  title:        z.string().min(1, 'Title is required').max(100),
  cat:          z.enum(GOAL_CATS),
  rank:         z.enum(GOAL_RANKS),
  priority:     z.enum(GOAL_PRIORITIES),
  targetDate:   z.string().min(1, 'Target date is required'),
  desc:         z.string().max(500).optional(),
  note:         z.string().max(500).optional(),
  linkedTrophy: z.string().optional(),
  milestones:   z.array(milestoneSchema).default([]),
});

export function serialize(g: IGoal): GoalDTO {
  const target   = new Date(g.targetDate);
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000));
  const targetLabel = target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    id:            g._id.toString(),
    userId:        g.userId.toString(),
    title:         g.title,
    cat:           g.cat,
    rank:          g.rank,
    priority:      g.priority,
    status:        g.status,
    progress:      g.progress,
    xp:            g.xp,
    coins:         g.coins,
    targetDate:    g.targetDate,
    targetLabel,
    daysLeft,
    desc:          g.desc,
    note:          g.note,
    linkedTrophy:  g.linkedTrophy,
    completedDate: g.completedDate,
    milestones:    g.milestones.map((m) => ({
      id:    (m as unknown as { _id: { toString(): string } })._id.toString(),
      label: m.label,
      done:  m.done,
    })),
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  };
}

// GET /api/v1/goals
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // optional filter

  await connectDB();

  const filter: Record<string, unknown> = { userId: user.sub, active: true };
  if (status) filter.status = status;

  const goals = await GoalModel.find(filter).sort({ createdAt: -1 });

  return successResponse(goals.map(serialize));
});

// POST /api/v1/goals
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, createSchema);
  if (error) return error;

  const reward = RANK_REWARD[data.rank] ?? RANK_REWARD.B!;

  await connectDB();

  const goal = await GoalModel.create({
    userId:       user.sub,
    title:        data.title,
    cat:          data.cat,
    rank:         data.rank,
    priority:     data.priority,
    targetDate:   data.targetDate,
    desc:         data.desc,
    note:         data.note,
    linkedTrophy: data.linkedTrophy,
    milestones:   data.milestones,
    xp:           reward.xp,
    coins:        reward.coins,
    status:       'not-started',
    progress:     0,
  });

  return createdResponse(serialize(goal), 'Goal created');
});
