import type { NextRequest } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { TransactionPresetModel } from '@/server/models/transaction-preset.model';
import { asyncHandler, notFoundResponse, successResponse, unauthorizedResponse } from '@/server';
import { validateBody } from '@/server/validate';
import { createPresetSchema, serialize } from '../route';

const updateSchema = createPresetSchema.partial().extend({
  note: createPresetSchema.shape.note.nullable(),
});

// PATCH /api/v1/finance/presets/:id
export const PATCH = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;
  const { data, error } = await validateBody(req, updateSchema);
  if (error) return error;

  await connectDB();

  const { note, ...rest } = data;
  const update: Record<string, unknown> = {};
  const set: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(rest)) {
    if (val !== undefined) set[key] = val;
  }
  if (note) set.note = note;
  if (Object.keys(set).length > 0) update.$set = set;
  // `null` (or an empty string) clears the note.
  if (note === null || note === '') update.$unset = { note: 1 };

  const preset = await TransactionPresetModel.findOneAndUpdate(
    { _id: id, userId: user.sub },
    update,
    { new: true },
  );
  if (!preset) return notFoundResponse('Preset not found');

  return successResponse(serialize(preset), 'Preset updated');
});

// DELETE /api/v1/finance/presets/:id
export const DELETE = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  await connectDB();

  const preset = await TransactionPresetModel.findOneAndDelete({ _id: id, userId: user.sub });
  if (!preset) return notFoundResponse('Preset not found');

  return successResponse(null, 'Preset deleted');
});
