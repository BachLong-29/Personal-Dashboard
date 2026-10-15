import mongoose from 'mongoose';

import {
  AgentChatModel,
  type AgentProposalState,
  type IAgentChatItem,
} from '@/server/models/agent-chat.model';

import type { AgentTurn } from './run-agent';
import type { PendingAction } from './tools';

/** The conversation keeps this many items; older ones fall off the front. */
export const MAX_CHAT_ITEMS = 100;

export type ChatItemDTO =
  | { id: string; kind: 'user'; text: string; createdAt: string }
  | { id: string; kind: 'assistant'; text: string; choices?: string[]; createdAt: string }
  | {
      id: string;
      kind: 'proposal';
      actions: PendingAction[];
      state: AgentProposalState;
      createdAt: string;
    };

/** An item not yet saved. Its id is made here so callers know it before the write. */
export type NewChatItem =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string; choices?: string[] }
  | { kind: 'proposal'; actions: PendingAction[]; state: 'open' };

export function toDTO(item: IAgentChatItem): ChatItemDTO {
  const base = { id: item._id.toString(), createdAt: item.createdAt.toISOString() };
  if (item.kind === 'proposal') {
    return {
      ...base,
      kind: 'proposal',
      actions: (item.actions ?? []) as PendingAction[],
      state: item.state ?? 'open',
    };
  }
  if (item.kind === 'assistant') {
    const choices = item.choices ?? [];
    return {
      ...base,
      kind: 'assistant',
      text: item.text ?? '',
      ...(choices.length > 0 ? { choices } : {}),
    };
  }
  return { ...base, kind: 'user', text: item.text ?? '' };
}

export async function loadItems(userId: string): Promise<IAgentChatItem[]> {
  const chat = await AgentChatModel.findOne({ userId }).lean();
  return (chat?.items ?? []) as IAgentChatItem[];
}

/** The text turns of the stored chat — all the model needs to continue it. */
export function toTurns(items: IAgentChatItem[]): AgentTurn[] {
  return items.flatMap((item): AgentTurn[] =>
    (item.kind === 'user' || item.kind === 'assistant') && item.text
      ? [{ role: item.kind, content: item.text }]
      : [],
  );
}

/** Appends to the conversation and returns what was written, with its new ids. */
export async function appendItems(userId: string, items: NewChatItem[]): Promise<ChatItemDTO[]> {
  const now = new Date();
  const docs = items.map((item) => ({
    _id: new mongoose.Types.ObjectId(),
    createdAt: now,
    ...item,
  }));

  await AgentChatModel.updateOne(
    { userId },
    { $push: { items: { $each: docs, $slice: -MAX_CHAT_ITEMS } } },
    { upsert: true },
  );

  return docs.map((doc) => toDTO(doc as unknown as IAgentChatItem));
}

/**
 * Moves an `open` proposal to `state` and returns it, or null when it is missing or was
 * already decided. Doing the check and the write in one update is what stops a double
 * tap from running the same changes twice.
 */
export async function claimProposal(
  userId: string,
  proposalId: string,
  state: Exclude<AgentProposalState, 'open'>,
): Promise<IAgentChatItem | null> {
  if (!mongoose.isValidObjectId(proposalId)) return null;

  const chat = await AgentChatModel.findOneAndUpdate(
    { userId, items: { $elemMatch: { _id: proposalId, kind: 'proposal', state: 'open' } } },
    { $set: { 'items.$[proposal].state': state } },
    {
      arrayFilters: [
        { 'proposal._id': new mongoose.Types.ObjectId(proposalId), 'proposal.state': 'open' },
      ],
      // The document as it was, so the actions are still readable and the state is `open`.
      returnDocument: 'before',
    },
  ).lean();

  const found = chat?.items.find((item) => item._id.toString() === proposalId);
  return (found as IAgentChatItem | undefined) ?? null;
}

/** Puts a proposal back to `open`, e.g. when every action in it failed. */
export async function reopenProposal(userId: string, proposalId: string): Promise<void> {
  await AgentChatModel.updateOne(
    { userId, 'items._id': proposalId },
    { $set: { 'items.$.state': 'open' } },
  );
}

export async function clearChat(userId: string): Promise<void> {
  await AgentChatModel.deleteOne({ userId });
}
