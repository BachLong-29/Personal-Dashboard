import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

/**
 * A thought caught before it escapes.
 *
 * Deliberately almost empty: the whole point is that writing one down costs a
 * sentence and nothing else. Anything that would need a decision at capture
 * time — a category, a date, a difficulty — belongs to Task, not here.
 */
export interface INote extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  /** Set when the note has been dealt with. The row stays, struck through. */
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    archivedAt: { type: Date },
  },
  { timestamps: true },
);

// Newest first is the only order this list is ever read in.
noteSchema.index({ userId: 1, createdAt: -1 });

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).Note;
}

export const NoteModel =
  (mongoose.models.Note as mongoose.Model<INote>) ?? mongoose.model<INote>('Note', noteSchema);
