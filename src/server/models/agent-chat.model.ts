import type { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export type AgentChatItemKind = 'user' | 'assistant' | 'proposal';
export type AgentProposalState = 'open' | 'done' | 'dismissed';

export interface IAgentChatAction {
  tool: string;
  args: Record<string, unknown>;
  /** One line shown on the confirm card. */
  summary: string;
}

export interface IAgentChatItem {
  _id: mongoose.Types.ObjectId;
  kind: AgentChatItemKind;
  /** `user` and `assistant` items. */
  text?: string;
  /** `proposal` items: the changes waiting on a yes. */
  actions?: IAgentChatAction[];
  state?: AgentProposalState;
  createdAt: Date;
}

/** One rolling conversation per user, shared by the web and the app. */
export interface IAgentChat extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  items: IAgentChatItem[];
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IAgentChatItem>(
  {
    kind: { type: String, enum: ['user', 'assistant', 'proposal'], required: true },
    text: { type: String, maxlength: 4000 },
    actions: [
      new Schema(
        {
          tool: { type: String, required: true },
          args: { type: Schema.Types.Mixed, default: {} },
          summary: { type: String, required: true },
        },
        { _id: false },
      ),
    ],
    state: { type: String, enum: ['open', 'done', 'dismissed'] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const agentChatSchema = new Schema<IAgentChat>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: { type: [itemSchema], default: [] },
  },
  { timestamps: true },
);

// Force re-register in dev to avoid stale schema after hot-reload
if (process.env.NODE_ENV === 'development') {
  delete (mongoose.models as Record<string, unknown>).AgentChat;
}

export const AgentChatModel =
  (mongoose.models.AgentChat as mongoose.Model<IAgentChat>) ??
  mongoose.model<IAgentChat>('AgentChat', agentChatSchema);
