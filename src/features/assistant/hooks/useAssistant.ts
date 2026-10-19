'use client';

import { useCallback, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { agentEndpoints } from '@/services/endpoints/agent';
import { queryKeys } from '@/constants/query-keys';
import type { AgentChatPayload } from '@/types';

import { sendWithRetry } from '../utils/chat-retry';

const HISTORY_KEY = ['agent', 'history'] as const;

/** The stored conversation. Loaded once per visit; the page keeps it in sync after that. */
export function useAgentHistory() {
  return useQuery({
    queryKey: HISTORY_KEY,
    queryFn: async () => (await agentEndpoints.history()).data.data?.items ?? [],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

/**
 * One assistant turn. Not cached: every send is a fresh question.
 *
 * When the assistant is busy or unreachable the same message is sent again on its own, a few
 * times, with a growing wait. `stop` cancels the request in flight (and the server's model call
 * with it) or the wait between tries. `retrying` says which try is next, for the status line.
 */
export function useAgentChat() {
  const controller = useRef<AbortController | null>(null);
  const [retrying, setRetrying] = useState<{ attempt: number; max: number } | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: AgentChatPayload) => {
      const abort = new AbortController();
      controller.current = abort;
      try {
        return await sendWithRetry(
          (signal) =>
            agentEndpoints.chat(payload, signal).then((res) => res.data.data?.items ?? []),
          abort.signal,
          (attempt, max) => setRetrying({ attempt, max }),
        );
      } finally {
        controller.current = null;
        setRetrying(null);
      }
    },
  });

  const stop = useCallback(() => controller.current?.abort(), []);

  return { ...mutation, stop, retrying };
}

/** Confirm or dismiss a proposal; a confirm refreshes everything a task shows on. */
export function useDecideProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      proposalId,
      decision,
    }: {
      proposalId: string;
      decision: 'confirm' | 'dismiss';
    }) => {
      const data = (await agentEndpoints.decide(proposalId, decision)).data.data;
      if (!data) throw new Error('Empty response');
      return data;
    },
    onSuccess: (result, { decision }) => {
      if (decision !== 'confirm' || result.state !== 'done') return;
      // The assistant now writes tasks, their sessions and habits; anything
      // drawn from those is stale after a confirm.
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: queryKeys.scheduleBlocks.all });
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['habit-logs'] });
      qc.invalidateQueries({ queryKey: ['notes'] });
      qc.invalidateQueries({ queryKey: queryKeys.events.all });
      qc.invalidateQueries({ queryKey: queryKeys.quests.all });
      qc.invalidateQueries({ queryKey: ['calendar-day'] });
      qc.invalidateQueries({ queryKey: queryKeys.calendar.all });
      qc.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}

export function useClearAgentChat() {
  return useMutation({
    mutationFn: async () => {
      await agentEndpoints.clear();
    },
  });
}
