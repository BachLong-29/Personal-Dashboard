import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { PenaltyLogModel } from '@/server/models/penalty-log.model';
import { UserProfileModel } from '@/server/models/user-profile.model';
import { asyncHandler, notFoundResponse, successResponse, unauthorizedResponse } from '@/server';

const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S'] as const;

const ESCALATIONS = [
  { xpLoss: 100, coinLoss: 20, streakBreak: false, rankDemote: false },
  { xpLoss: 200, coinLoss: 40, streakBreak: true, rankDemote: false },
  { xpLoss: 350, coinLoss: 80, streakBreak: true, rankDemote: true },
  { xpLoss: 500, coinLoss: 120, streakBreak: true, rankDemote: true },
] as const;

// POST /api/v1/penalty/fail — apply consequences and escalate penalty tier
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  const penalty = await PenaltyLogModel.findOne({ userId: user.sub, status: 'pending' });
  if (!penalty) return notFoundResponse('No active penalty found');

  const escIdx = Math.min(penalty.tier - 1, ESCALATIONS.length - 1);
  const esc = ESCALATIONS[escIdx] ?? ESCALATIONS[0];

  // Apply consequences to profile
  const profile = await UserProfileModel.findOne({ userId: user.sub });
  if (profile) {
    const curRankIdx = RANKS.indexOf(profile.rank as (typeof RANKS)[number]);
    const demotedRank = esc.rankDemote && curRankIdx > 0 ? RANKS[curRankIdx - 1] : profile.rank;

    await UserProfileModel.findOneAndUpdate(
      { userId: user.sub },
      {
        $set: {
          xp: Math.max(0, profile.xp - esc.xpLoss),
          coins: Math.max(0, profile.coins - esc.coinLoss),
          streak: esc.streakBreak ? 0 : profile.streak,
          rank: demotedRank,
        },
      },
    );
  }

  // Escalate tier (max 4), keep status 'pending'
  const nextTier = Math.min(penalty.tier + 1, 4);
  const updated = await PenaltyLogModel.findByIdAndUpdate(
    penalty._id,
    { $set: { tier: nextTier } },
    { new: true },
  );

  return successResponse(updated, 'Penalty consequence applied');
});
