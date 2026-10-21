import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import {
  appendItems,
  claimProposal,
  reopenProposal,
  setProposalTargets,
} from '@/server/agent/chat-store';
import { executeAction } from '@/server/agent/tools';
import { asyncHandler, errorResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';

const bodySchema = z.object({
  proposalId: z.string().min(1),
  decision: z.enum(['confirm', 'dismiss']),
});

// POST /api/v1/agent/execute — decide a proposal. The actions are read from the stored
// conversation, never from the request, so a client cannot run anything the assistant did
// not itself propose. A proposal can be decided once: the claim below is atomic.
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, bodySchema);
  if (error) return error;

  await connectDB();

  const proposal = await claimProposal(
    user.sub,
    data.proposalId,
    data.decision === 'confirm' ? 'done' : 'dismissed',
  );
  if (!proposal)
    return errorResponse('This proposal was already decided or no longer exists.', 409);

  if (data.decision === 'dismiss') {
    return successResponse({ state: 'dismissed' as const, results: [], items: [] });
  }

  const results = [];
  for (const action of proposal.actions ?? []) {
    results.push(await executeAction(action.tool, action.args, user.sub));
  }

  // Nothing went through: leave it open so the user can try again.
  if (results.length > 0 && results.every((result) => !result.ok)) {
    await reopenProposal(user.sub, data.proposalId);
    return successResponse({ state: 'open' as const, results, items: [] });
  }

  // The same thing touched twice (edit, then book) is one place to go.
  const seen = new Set<string>();
  const targets = results.flatMap((result) => {
    if (!result.ok || !result.target) return [];
    const key = `${result.target.kind}:${result.target.id}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [result.target];
  });
  await setProposalTargets(user.sub, data.proposalId, targets);

  // Said in the chat as well, so the model knows the change really happened.
  const items = await appendItems(user.sub, [
    { kind: 'assistant', text: results.map((result) => result.message).join('\n') },
  ]);
  return successResponse({ state: 'done' as const, results, targets, items });
});
