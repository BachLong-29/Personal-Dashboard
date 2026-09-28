import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { NoteModel } from '@/server/models/note.model';
import { asyncHandler, notFoundResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';

import { serialize } from '../route';

const updateSchema = z.object({
  archived: z.boolean(),
});

// PATCH /api/v1/notes/[id] — mark a note dealt with, or put it back
export const PATCH = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, updateSchema);
  if (error) return error;

  await connectDB();

  const { id } = await ctx.params;
  const note = await NoteModel.findOneAndUpdate(
    { _id: id, userId: user.sub },
    // `$unset` rather than setting null, so "open" stays the absence of a
    // date and the serializer can keep returning `undefined`.
    data.archived ? { $set: { archivedAt: new Date() } } : { $unset: { archivedAt: 1 } },
    { new: true },
  );
  if (!note) return notFoundResponse('Note not found');

  return successResponse(serialize(note));
});
