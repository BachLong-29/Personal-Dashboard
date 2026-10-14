import { apiClient } from '@/libs/axios';
import type { AgentChatItem, AgentChatPayload, AgentDecisionResult, ApiResponse } from '@/types';

/**
 * The assistant can take far longer than a normal call: the model may be retried or handed
 * to a fallback when the provider is busy, so a short client default would cut off an
 * answer that was about to arrive.
 */
const AGENT_TIMEOUT_MS = 60_000;

export const agentEndpoints = {
  /** The stored conversation, oldest first. */
  history: () => apiClient.get<ApiResponse<{ items: AgentChatItem[] }>>('/agent/history'),

  /** One assistant turn. Returns the items it added: the user's message, the reply, any proposal. */
  chat: (payload: AgentChatPayload) =>
    apiClient.post<ApiResponse<{ items: AgentChatItem[] }>>('/agent', payload, {
      timeout: AGENT_TIMEOUT_MS,
    }),

  /** Confirms or dismisses a proposal. The server holds the actions; only the id travels. */
  decide: (proposalId: string, decision: 'confirm' | 'dismiss') =>
    apiClient.post<ApiResponse<AgentDecisionResult>>('/agent/execute', { proposalId, decision }),

  /** Starts over. */
  clear: () => apiClient.delete<ApiResponse<null>>('/agent/history'),
};
