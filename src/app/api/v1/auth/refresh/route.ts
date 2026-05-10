import { z } from 'zod';

import { connectDB } from '@/libs/mongodb';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/libs/jwt';
import { UserModel } from '@/server/models/user.model';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const POST = asyncHandler(async (req) => {
  const { data, error } = await validateBody(req, refreshSchema);
  if (error) return error;

  let payload;
  try {
    payload = verifyRefreshToken(data.refreshToken);
  } catch {
    return unauthorizedResponse('Invalid or expired refresh token');
  }

  await connectDB();

  const user = await UserModel.findById(payload.sub);
  if (!user) return unauthorizedResponse('User not found');

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ sub: user._id.toString() });

  return successResponse({ accessToken, refreshToken }, 'Token refreshed');
});
