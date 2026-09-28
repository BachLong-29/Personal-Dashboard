import { z } from 'zod';
import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { NoteModel } from '@/server/models/note.model';
import type { INote } from '@/server/models/note.model';
import { asyncHandler, createdResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';
import type { Note } from '@/types/note';

const createSchema = z.object({
  content: z.string().trim().min(1, 'Write something first').max(2000),
});

export function serialize(n: INote): Note {
  return {
    id: n._id.toString(),
    content: n.content,
    archivedAt: n.archivedAt?.toISOString(),
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

// GET /api/v1/notes — newest first, dealt-with ones included
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  await connectDB();

  // Archived notes stay in the list rather than disappearing, so they are not
  // filtered out here — the client strikes them through in place.
  const notes = await NoteModel.find({ userId: user.sub }).sort({ createdAt: -1 }).limit(200);

  return successResponse(notes.map(serialize));
});

// POST /api/v1/notes
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { data, error } = await validateBody(req, createSchema);
  if (error) return error;

  await connectDB();

  const note = await NoteModel.create({ userId: user.sub, content: data.content });

  return createdResponse(serialize(note));
});
