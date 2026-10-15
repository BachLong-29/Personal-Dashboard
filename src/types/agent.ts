/** A change the assistant proposed. Nothing is saved until the user confirms it. */
export interface AgentPendingAction {
  tool:
    | 'create_task'
    | 'complete_task'
    | 'update_task'
    | 'delete_task'
    | 'create_session'
    | 'update_session'
    | 'delete_session'
    | 'create_habit'
    | 'update_habit'
    | 'set_habit_active'
    | 'delete_habit';
  args: Record<string, unknown>;
  /** One line for the confirm card, e.g. `Create "Study" on 2026-10-16`. */
  summary: string;
}

/** `open` waits on the user; the other two are final. */
export type AgentProposalState = 'open' | 'done' | 'dismissed';

/** One entry of the stored conversation, as the API returns it. */
export type AgentChatItem =
  | { id: string; kind: 'user'; text: string; createdAt: string }
  | {
      id: string;
      kind: 'assistant';
      text: string;
      /** Quick replies for a question the assistant asked. */
      choices?: string[];
      createdAt: string;
    }
  | {
      id: string;
      kind: 'proposal';
      actions: AgentPendingAction[];
      state: AgentProposalState;
      createdAt: string;
    };

export interface AgentChatPayload {
  /** What the user just said; the earlier turns are kept server-side. */
  message: string;
  /** Local `YYYY-MM-DD`, so "tomorrow" means the user's tomorrow. */
  today: string;
  timezone: string;
}

export interface AgentActionResult {
  ok: boolean;
  message: string;
}

export interface AgentDecisionResult {
  /** `open` again when nothing went through, so the user can retry. */
  state: AgentProposalState;
  results: AgentActionResult[];
  /** Items the decision added to the conversation (the outcome message). */
  items: AgentChatItem[];
}
