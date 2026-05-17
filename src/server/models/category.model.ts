import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
  },
  { timestamps: true },
);

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export const CategoryModel =
  (mongoose.models.Category as mongoose.Model<ICategory>) ??
  mongoose.model<ICategory>('Category', categorySchema);
