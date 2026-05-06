import { z } from 'zod';

import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const POST = asyncHandler(async (req) => {
  const { data, error } = await validateBody(req, loginSchema);
  if (error) return error;

  // TODO: replace with real auth logic (DB lookup, bcrypt compare)
  if (data.email !== 'admin@example.com' || data.password !== 'Password1') {
    return unauthorizedResponse('Invalid credentials');
  }

  const mockUser = { id: '1', email: data.email, name: 'Admin', role: 'admin' as const };
  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  return successResponse({ user: mockUser, tokens: mockTokens }, 'Login successful');
});
