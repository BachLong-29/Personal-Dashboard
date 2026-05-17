import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { CategoryModel } from '@/server/models/category.model';
import { HabitModel } from '@/server/models/habit.model';
import {
  asyncHandler,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from '@/server';
import { validateBody } from '@/server/validate';
import type { Category } from '@/types/category';
import type { ICategory } from '@/server/models/category.model';

const updateSchema = z.object({
  name: z.string().min(1).max(50).trim(),
});

function serialize(c: ICategory): Category {
  return {
    id: c._id.toString(),
    userId: c.userId.toString(),
    name: c.name,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

// PATCH /api/v1/categories/:id
export const PATCH = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  const { data, error } = await validateBody(req, updateSchema);
  if (error) return error;

  await connectDB();

  const category = await CategoryModel.findOneAndUpdate(
    { _id: id, userId: user.sub },
    { name: data.name },
    { new: true },
  );

  if (!category) return notFoundResponse('Category not found');

  return successResponse(serialize(category), 'Category updated');
});

// DELETE /api/v1/categories/:id
export const DELETE = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  await connectDB();

  const inUse = await HabitModel.exists({ userId: user.sub, tagId: id, active: true });
  if (inUse) {
    return NextResponse.json(
      {
        success: false,
        message: 'Cannot delete: this category is used by one or more habits.',
      },
      { status: 409 },
    );
  }

  const category = await CategoryModel.findOneAndDelete({ _id: id, userId: user.sub });
  if (!category) return notFoundResponse('Category not found');

  return successResponse(null, 'Category deleted');
});
