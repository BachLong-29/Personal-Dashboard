import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { FinanceGoalModel } from '@/server/models/finance-goal.model';
import { GoalContributionModel } from '@/server/models/goal-contribution.model';
import { listGoalsWithProgress, syncGoalStatus } from '@/server/services/finance-goals';
import {
  asyncHandler,
  createdResponse,
  errorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from '@/server';
import { validateBody } from '@/server/validate';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const createSchema = z.object({
  /** Positive puts money in, negative takes it back out. */
  amount: z.number().refine((v) => v !== 0, 'Amount must not be zero'),
  date: z.string().regex(DAY_RE).optional(),
  note: z.string().max(200).optional(),
});

// GET /api/v1/finance/goals/:id/contributions
export const GET = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;
  await connectDB();

  const contributions = await GoalContributionModel.find({ userId: user.sub, goalId: id })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  return successResponse(
    contributions.map((c) => ({
      id: c._id.toString(),
      goalId: c.goalId.toString(),
      amount: c.amount,
      date: c.date.toISOString().substring(0, 10),
      note: c.note,
      createdAt: c.createdAt.toISOString(),
    })),
  );
});

// POST /api/v1/finance/goals/:id/contributions
export const POST = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;
  const { data, error } = await validateBody(req, createSchema);
  if (error) return error;

  await connectDB();

  const goal = await FinanceGoalModel.findOne({ _id: id, userId: user.sub });
  if (!goal) return notFoundResponse('Goal not found');

  // Taking out more than went in would put the goal below zero — the ledger of a goal is
  // its contributions, so guard here rather than clamping the total afterwards.
  if (data.amount < 0) {
    const existing = await GoalContributionModel.find({ userId: user.sub, goalId: id }).lean();
    const total = existing.reduce((sum, c) => sum + c.amount, 0);
    if (total + data.amount < 0) {
      return errorResponse('Cannot withdraw more than the goal holds', 409);
    }
  }

  const date = data.date ?? new Date().toISOString().substring(0, 10);

  await GoalContributionModel.create({
    userId: user.sub,
    goalId: id,
    amount: data.amount,
    date: new Date(`${date}T00:00:00.000Z`),
    note: data.note,
  });

  await syncGoalStatus(user.sub, goal._id.toString());

  const goals = await listGoalsWithProgress(user.sub, date.substring(0, 7), date);
  return createdResponse(
    goals.find((g) => g.id === goal._id.toString()) ?? null,
    'Contribution saved',
  );
});
