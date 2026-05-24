import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { RewardModel } from '@/server/models/reward.model';
import {
  asyncHandler,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from '@/server';
import { validateBody } from '@/server/validate';
import type { Reward } from '@/types/reward';
import type { IReward } from '@/server/models/reward.model';

const REWARD_COLORS   = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'] as const;
const REWARD_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
const REWARD_STATUSES = ['active', 'inactive', 'limited', 'sold_out'] as const;

const unlockConditionSchema = z.object({
  minLevel: z.number().int().min(1).optional(),
  minRank:  z.string().min(1).max(50).optional(),
});

const updateSchema = z.object({
  name:            z.string().min(1).max(100).optional(),
  description:     z.string().max(500).optional().nullable(),
  icon:            z.string().max(10).optional().nullable(),
  color:           z.enum(REWARD_COLORS).optional(),
  rarity:          z.enum(REWARD_RARITIES).optional(),
  status:          z.enum(REWARD_STATUSES).optional(),
  coinCost:        z.number().int().min(0).optional().nullable(),
  gemCost:         z.number().int().min(0).optional().nullable(),
  unlockCondition: unlockConditionSchema.optional().nullable(),
  stock:           z.number().int().min(0).optional().nullable(),
  active:          z.boolean().optional(),
});

function serialize(r: IReward): Reward {
  return {
    id:              r._id.toString(),
    userId:          r.userId.toString(),
    name:            r.name,
    description:     r.description,
    icon:            r.icon,
    color:           r.color,
    rarity:          r.rarity,
    status:          r.status,
    coinCost:        r.coinCost,
    gemCost:         r.gemCost,
    unlockCondition: r.unlockCondition
      ? { minLevel: r.unlockCondition.minLevel, minRank: r.unlockCondition.minRank }
      : undefined,
    stock:           r.stock,
    active:          r.active,
    createdAt:       r.createdAt.toISOString(),
    updatedAt:       r.updatedAt.toISOString(),
  };
}

// PATCH /api/v1/rewards/:id
export const PATCH = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  const { data, error } = await validateBody(req, updateSchema);
  if (error) return error;

  await connectDB();

  const setData: Record<string, unknown> = {};
  const unsetData: Record<string, 1> = {};

  // Nullable fields — null → $unset, value → $set
  const nullableFields = [
    'description', 'icon', 'coinCost', 'gemCost', 'unlockCondition', 'stock',
  ] as const;

  for (const key of nullableFields) {
    const val = data[key];
    if (val === null)       unsetData[key] = 1;
    else if (val !== undefined) setData[key] = val;
  }

  // Non-nullable scalar fields
  const scalarFields = ['name', 'color', 'rarity', 'status', 'active'] as const;
  for (const key of scalarFields) {
    if (data[key] !== undefined) setData[key] = data[key];
  }

  const updateOp: Record<string, unknown> = {};
  if (Object.keys(setData).length > 0)   updateOp.$set   = setData;
  if (Object.keys(unsetData).length > 0) updateOp.$unset = unsetData;

  const reward = await RewardModel.findOneAndUpdate(
    { _id: id, userId: user.sub },
    updateOp,
    { new: true },
  );

  if (!reward) return notFoundResponse('Reward not found');

  return successResponse(serialize(reward), 'Reward updated');
});

// DELETE /api/v1/rewards/:id  — soft delete
export const DELETE = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  await connectDB();

  const reward = await RewardModel.findOneAndUpdate(
    { _id: id, userId: user.sub },
    { active: false },
    { new: true },
  );

  if (!reward) return notFoundResponse('Reward not found');

  return successResponse(null, 'Reward deleted');
});
