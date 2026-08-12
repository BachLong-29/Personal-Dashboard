import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { connectDB } from '@/libs/mongodb';
import { getAuthUser } from '@/server/helpers/get-auth-user';
import { FinanceCategoryModel } from '@/server/models/finance-category.model';
import { TransactionModel } from '@/server/models/transaction.model';
import { asyncHandler, notFoundResponse, successResponse, unauthorizedResponse } from '@/server';

// DELETE /api/v1/finance/categories/:id
export const DELETE = asyncHandler(async (req: NextRequest, ctx) => {
  const user = getAuthUser(req);
  if (!user) return unauthorizedResponse();

  const { id } = await ctx.params;

  await connectDB();

  const inUse = await TransactionModel.exists({ userId: user.sub, categoryId: id });
  if (inUse) {
    return NextResponse.json(
      {
        success: false,
        message: 'Cannot delete: this category is used by one or more transactions.',
      },
      { status: 409 },
    );
  }

  const category = await FinanceCategoryModel.findOneAndDelete({ _id: id, userId: user.sub });
  if (!category) return notFoundResponse('Category not found');

  return successResponse(null, 'Category deleted');
});
