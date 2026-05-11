import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

import type { Difficulty, QuestType } from '@/types/quest';

export interface IQuest extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  desc: string;
  type: QuestType;
  difficulty: Difficulty;
  xp: number;
  coins: number;
  done: boolean;
  tags: string[];
  dueDate: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QUEST_TYPES: QuestType[] = ['focus', 'habit', 'reflect', 'admin', 'create', 'health', 'break'];
const DIFFICULTIES: Difficulty[] = ['S', 'A', 'B', 'C', 'D'];

const questSchema = new Schema<IQuest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    desc: {
      type: String,
      default: 'Complete this quest',
      trim: true,
      maxlength: 300,
    },
    type: {
      type: String,
      enum: QUEST_TYPES,
      required: true,
    },
    difficulty: {
      type: String,
      enum: DIFFICULTIES,
      required: true,
    },
    xp: {
      type: Number,
      required: true,
      min: 0,
    },
    coins: {
      type: Number,
      required: true,
      min: 0,
    },
    done: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    dueDate: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Compound index for the most common query: user's quests by date
questSchema.index({ userId: 1, dueDate: 1 });

export const QuestModel =
  (mongoose.models.Quest as mongoose.Model<IQuest>) ?? mongoose.model<IQuest>('Quest', questSchema);

export const XP_MAP: Record<Difficulty, number> = { S: 150, A: 120, B: 90, C: 60, D: 50 };
export const COIN_MAP: Record<Difficulty, number> = { S: 40, A: 30, B: 25, C: 15, D: 12 };
