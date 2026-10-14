import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { clearChat, loadItems, toDTO } from '@/server/agent/chat-store';
import { asyncHandler, successResponse, unauthorizedResponse } from '@/server';

// GET /api/v1/agent/history — the stored conversation, oldest first.
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();
  const items = await loadItems(user.sub);
  return successResponse({ items: items.map(toDTO) });
});

// DELETE /api/v1/agent/history — start over.
export const DELETE = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();
  await clearChat(user.sub);
  return successResponse(null, 'Conversation cleared');
});
