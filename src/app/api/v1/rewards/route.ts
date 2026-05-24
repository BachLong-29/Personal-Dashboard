import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { RewardModel } from '@/server/models/reward.model';
import { asyncHandler, createdResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody, validateSearchParams } from '@/server/validate';
import type { Reward, RewardListResponse } from '@/types/reward';
import type { IReward } from '@/server/models/reward.model';

// ─── Constants ────────────────────────────────────────────────────────────────

const REWARD_COLORS   = ['gold', 'mint', 'violet', 'cyan', 'rose', 'amber', 'blue'] as const;
const REWARD_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
const REWARD_STATUSES = ['active', 'inactive', 'limited', 'sold_out'] as const;
const SORT_FIELDS     = ['name', 'coinCost', 'gemCost', 'createdAt', 'rarity'] as const;

// ─── Schemas ──────────────────────────────────────────────────────────────────

const unlockConditionSchema = z.object({
  minLevel: z.number().int().min(1).optional(),
  minRank:  z.string().min(1).max(50).optional(),
});

const createSchema = z.object({
  name:             z.string().min(1).max(100),
  description:      z.string().max(500).optional(),
  icon:             z.string().max(10).optional(),
  color:            z.enum(REWARD_COLORS).optional().default('gold'),
  rarity:           z.enum(REWARD_RARITIES).optional().default('common'),
  status:           z.enum(REWARD_STATUSES).optional().default('active'),
  coinCost:         z.number().int().min(0).optional(),
  gemCost:          z.number().int().min(0).optional(),
  unlockCondition:  unlockConditionSchema.optional(),
  stock:            z.number().int().min(0).optional(),
});

const querySchema = z.object({
  /** Full-text search on name / description */
  search:  z.string().optional(),
  rarity:  z.enum(REWARD_RARITIES).optional(),
  status:  z.enum(REWARD_STATUSES).optional(),
  sortBy:  z.enum(SORT_FIELDS).optional().default('createdAt'),
  order:   z.enum(['asc', 'desc']).optional().default('desc'),
  page:    z.coerce.number().int().min(1).optional().default(1),
  limit:   z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ─── Serializer ───────────────────────────────────────────────────────────────

function serialize(r: IReward): Reward {
  return {
    id:               r._id.toString(),
    userId:           r.userId.toString(),
    name:             r.name,
    description:      r.description,
    icon:             r.icon,
    color:            r.color,
    rarity:           r.rarity,
    status:           r.status,
    coinCost:         r.coinCost,
    gemCost:          r.gemCost,
    unlockCondition:  r.unlockCondition
      ? { minLevel: r.unlockCondition.minLevel, minRank: r.unlockCondition.minRank }
      : undefined,
    stock:            r.stock,
    active:           r.active,
    createdAt:        r.createdAt.toISOString(),
    updatedAt:        r.updatedAt.toISOString(),
  };
}

// ─── GET /api/v1/rewards ──────────────────────────────────────────────────────

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data: query, error: queryError } = validateSearchParams(
    req.nextUrl.searchParams,
    querySchema,
  );
  if (queryError) return queryError;

  await connectDB();

  // ── Build filter ─────────────────────────────────────────────────────────
  const filter: Record<string, unknown> = { userId: user.sub, active: true };

  if (query.rarity) filter.rarity = query.rarity;
  if (query.status) filter.status = query.status;

  if (query.search) {
    const regex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { description: regex }];
  }

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sortOrder = query.order === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [query.sortBy]: sortOrder };
  // Always break ties by createdAt desc
  if (query.sortBy !== 'createdAt') sort.createdAt = -1;

  // ── Pagination ────────────────────────────────────────────────────────────
  const page  = query.page;
  const limit = query.limit;
  const skip  = (page - 1) * limit;

  const [items, total] = await Promise.all([
    RewardModel.find(filter).sort(sort).skip(skip).limit(limit),
    RewardModel.countDocuments(filter),
  ]);

  const response: RewardListResponse = {
    items:      items.map(serialize),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  return successResponse(response);
});

// ─── POST /api/v1/rewards ─────────────────────────────────────────────────────

export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, createSchema);
  if (error) return error;

  await connectDB();

  const reward = await RewardModel.create({
    userId:           user.sub,
    name:             data.name,
    description:      data.description,
    icon:             data.icon,
    color:            data.color,
    rarity:           data.rarity,
    status:           data.status,
    coinCost:         data.coinCost,
    gemCost:          data.gemCost,
    unlockCondition:  data.unlockCondition,
    stock:            data.stock,
  });

  return createdResponse(serialize(reward), 'Reward created successfully');
});
