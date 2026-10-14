import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { appendItems, loadItems, toTurns } from '@/server/agent/chat-store';
import { LlmError } from '@/server/agent/llm';
import { runAgent } from '@/server/agent/run-agent';
import { asyncHandler, errorResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';

const bodySchema = z.object({
  /** What the user just said. The earlier turns come from the stored conversation. */
  message: z.string().trim().min(1).max(2000),
  /** The client's local `YYYY-MM-DD`, so "tomorrow" means the user's tomorrow. */
  today: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  timezone: z.string().max(64).optional(),
});

// POST /api/v1/agent — one assistant turn. Reads run on their own; writes come back as a
// `proposal` item for the user to decide on via POST /api/v1/agent/execute. The turn is
// saved to the conversation only once the model has answered, so a failed request leaves
// nothing half-written and the client can simply send the same message again.
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, bodySchema);
  if (error) return error;

  await connectDB();

  try {
    const stored = await loadItems(user.sub);
    const result = await runAgent({
      history: [...toTurns(stored), { role: 'user', content: data.message }],
      userId: user.sub,
      today: data.today ?? new Date().toISOString().slice(0, 10),
      timezone: data.timezone ?? 'UTC',
    });

    const items = await appendItems(user.sub, [
      { kind: 'user', text: data.message },
      { kind: 'assistant', text: result.reply },
      ...(result.pendingActions.length > 0
        ? [{ kind: 'proposal' as const, actions: result.pendingActions, state: 'open' as const }]
        : []),
    ]);
    return successResponse({ items });
  } catch (err) {
    if (err instanceof LlmError) return errorResponse(err.message, err.status);
    throw err;
  }
});
