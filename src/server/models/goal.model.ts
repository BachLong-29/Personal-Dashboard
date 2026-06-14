import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export type GoalCategory = 'career' | 'health' | 'learning' | 'finance' | 'personal';
export type GoalRank     = 'S' | 'A' | 'B' | 'C' | 'D';
export type GoalPriority = 'high' | 'medium' | 'low';
export type GoalStatus   = 'not-started' | 'in-progress' | 'completed' | 'archived';

const GOAL_CATS:       GoalCategory[] = ['career', 'health', 'learning', 'finance', 'personal'];
const GOAL_RANKS:      GoalRank[]     = ['S', 'A', 'B', 'C', 'D'];
const GOAL_PRIORITIES: GoalPriority[] = ['high', 'medium', 'low'];
const GOAL_STATUSES:   GoalStatus[]   = ['not-started', 'in-progress', 'completed', 'archived'];

export interface IGoalMilestone {
  label: string;
  done:  boolean;
}

export interface IGoal extends Document {
  _id:           mongoose.Types.ObjectId;
  userId:        mongoose.Types.ObjectId;
  title:         string;
  cat:           GoalCategory;
  rank:          GoalRank;
  priority:      GoalPriority;
  status:        GoalStatus;
  progress:      number;
  xp:            number;
  coins:         number;
  targetDate:    string;
  desc?:         string;
  note?:         string;
  linkedTrophy?: string;
  completedDate?:string;
  milestones:    IGoalMilestone[];
  active:        boolean;
  createdAt:     Date;
  updatedAt:     Date;
}

const milestoneSchema = new Schema<IGoalMilestone>(
  {
    label: { type: String, required: true, trim: true, maxlength: 200 },
    done:  { type: Boolean, default: false },
  },
  { _id: true },
);

const goalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:  { type: String, required: true, trim: true, maxlength: 100 },
    cat:    { type: String, enum: GOAL_CATS,       required: true },
    rank:   { type: String, enum: GOAL_RANKS,      required: true },
    priority: { type: String, enum: GOAL_PRIORITIES, required: true },
    status:   { type: String, enum: GOAL_STATUSES,   default: 'not-started' },
    progress: { type: Number, default: 0, min: 0, max: 1 },
    xp:       { type: Number, required: true, min: 0 },
    coins:    { type: Number, required: true, min: 0 },
    targetDate:     { type: String, required: true },
    desc:           { type: String, trim: true, maxlength: 500 },
    note:           { type: String, trim: true, maxlength: 500 },
    linkedTrophy:   { type: String, trim: true },
    completedDate:  { type: String },
    milestones:     { type: [milestoneSchema], default: [] },
    active:         { type: Boolean, default: true },
  },
  { timestamps: true },
);

goalSchema.index({ userId: 1, active: 1 });
goalSchema.index({ userId: 1, status: 1 });

if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).Goal;
}

export const GoalModel =
  (mongoose.models.Goal as mongoose.Model<IGoal>) ?? mongoose.model<IGoal>('Goal', goalSchema);
