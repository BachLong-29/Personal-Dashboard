import { z } from 'zod';

import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const POST = asyncHandler(async (req) => {
  const { data, error } = await validateBody(req, refreshSchema);
  if (error) return error;

  // TODO: verify the refreshToken against DB / signed JWT
  if (!data.refreshToken || data.refreshToken === 'invalid') {
    return unauthorizedResponse('Invalid or expired refresh token');
  }

  return successResponse(
    { accessToken: 'new-mock-access-token', refreshToken: 'new-mock-refresh-token' },
    'Token refreshed',
  );
});
