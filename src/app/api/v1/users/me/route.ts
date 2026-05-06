import type { NextRequest } from 'next/server';

import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';

export const GET = asyncHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorizedResponse();
  }

  // TODO: decode JWT, load user from DB
  const mockUser = {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin',
    role: 'admin' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return successResponse(mockUser);
});
