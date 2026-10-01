import type mongoose from 'mongoose';

import { FinanceCategoryModel } from '@/server/models/finance-category.model';

/**
 * Categories whose transactions move a wallet without counting as income or
 * expense — balance corrections, transfers between your own wallets.
 *
 * Looked up rather than denormalised onto each transaction: the flag is a
 * property of the category and can be turned on long after the transactions
 * were written, and a copy on the row would then be a lie.
 */
export async function excludedCategoryIds(
  userId: string | mongoose.Types.ObjectId,
): Promise<mongoose.Types.ObjectId[]> {
  const categories = await FinanceCategoryModel.find({ userId, excludeFromTotals: true })
    .select('_id')
    .lean();

  return categories.map((c) => c._id);
}
