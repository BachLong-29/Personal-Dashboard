import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { BudgetModel } from '@/server/models/budget.model';
import { listBudgetsWithSpent } from '@/server/services/finance-budget';
import { asyncHandler, notFoundResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';

const updateSchema = z.object({
  limit: z.number().min(1),
});

// PATCH /api/v1/finance/budgets/:id — only `limit` is editable
export const PATCH = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;
  const { data, error } = await validateBody(req, updateSchema);
  if (error) return error;

  await connectDB();

  const budget = await BudgetModel.findOneAndUpdate(
    { _id: id, userId: user.sub },
    { $set: { limit: data.limit } },
    { new: true },
  );
  if (!budget) return notFoundResponse('Budget not found');

  const monthBudgets = await listBudgetsWithSpent(user.sub, budget.month);
  const updated = monthBudgets.find((b) => b.id === budget._id.toString());

  return successResponse(updated, 'Budget updated');
});

// DELETE /api/v1/finance/budgets/:id
export const DELETE = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  await connectDB();

  const budget = await BudgetModel.findOneAndDelete({ _id: id, userId: user.sub });
  if (!budget) return notFoundResponse('Budget not found');

  return successResponse(null, 'Budget deleted');
});
