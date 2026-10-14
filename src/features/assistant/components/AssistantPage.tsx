'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { Modal, ModalBody, ModalFoot, ModalHead } from '@/components/ui/Modal';
import { NoData } from '@/components/ui/NoData';
import { SkelBlock } from '@/components/ui/Skeleton';
import DashboardTopbar from '@/features/dashboard/components/layout/DashboardTopbar';
import { buildEmptyChar, profileToCharacter } from '@/features/dashboard/utils/character.utils';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { todayISO } from '@/features/tasks/utils/date.utils';
import type { AgentChatItem, AgentPendingAction } from '@/types';

import {
  useAgentChat,
  useAgentHistory,
  useClearAgentChat,
  useDecideProposal,
} from '../hooks/useAssistant';
import { ChatBubble } from './ChatBubble';
import { ProposalCard, type ProposalState } from './ProposalCard';

/**
 * What the page shows: the stored conversation, plus two things that only exist here —
 * a proposal while it is being confirmed, and the line saying a send failed.
 */
type Entry =
  | { id: string; kind: 'user' | 'assistant' | 'error'; text: string }
  | { id: string; kind: 'proposal'; actions: AgentPendingAction[]; state: ProposalState };

const MAX_INPUT_LENGTH = 2000;
/** Taller than this and the box scrolls instead of pushing the chat off screen. */
const MAX_INPUT_HEIGHT = 140;
const SUGGESTIONS = ['today', 'create', 'week'] as const;

let localId = 0;
const newLocalId = () => `local-${(localId += 1)}`;

function fromItem(item: AgentChatItem): Entry {
  return item.kind === 'proposal'
    ? { id: item.id, kind: 'proposal', actions: item.actions, state: item.state }
    : { id: item.id, kind: item.kind, text: item.text };
}

/**
 * Chat with the task assistant. The conversation is stored on the server, so it is still
 * here after a reload and on the app. It can look tasks up on its own, but anything it
 * wants to change is shown as a proposal first and only saved after the user confirms.
 */
export function AssistantPage() {
  const t = useTranslations('assistant');
  const tCommon = useTranslations('common');

  const { data: profileData } = useProfile();
  const char = useMemo(
    () => (profileData?.profile ? profileToCharacter(profileData.profile) : buildEmptyChar()),
    [profileData],
  );
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const history = useAgentHistory();
  const { mutate: sendChat, isPending: thinking } = useAgentChat();
  const { mutate: decide } = useDecideProposal();
  const { mutate: clearChat, isPending: clearing } = useClearAgentChat();

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hydrated = useRef(false);
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  // Load the stored conversation once, when it arrives.
  useEffect(() => {
    if (hydrated.current || !history.data) return;
    hydrated.current = true;
    setEntries(history.data.map(fromItem));
  }, [history.data]);

  // Keep the newest message in view as the chat grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [entries, thinking]);

  // Grow the box with its text, up to a cap. `scrollHeight` leaves the border out, so it is
  // added back: sized without it the box sits 2 px short of its content and shows a scrollbar
  // while empty. The scrollbar only appears once the text outgrows the cap.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const border = el.offsetHeight - el.clientHeight;
    const wanted = el.scrollHeight + border;
    el.style.height = `${Math.min(wanted, MAX_INPUT_HEIGHT)}px`;
    el.style.overflowY = wanted > MAX_INPUT_HEIGHT ? 'auto' : 'hidden';
  }, [draft]);

  const patchProposal = (id: string, state: ProposalState) =>
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id && entry.kind === 'proposal' ? { ...entry, state } : entry,
      ),
    );

  /**
   * Sends `message`. `pendingId` is the local entry showing it: on success it is swapped for
   * what the server stored, on failure it stays and an error line follows it.
   */
  const submit = useCallback(
    (message: string, pendingId: string) => {
      sendChat(
        { message, today: todayISO(), timezone },
        {
          onSuccess: (items) => {
            setEntries((prev) => [
              ...prev.filter((e) => e.id !== pendingId),
              ...items.map(fromItem),
            ]);
          },
          onError: () => {
            setEntries((prev) => [...prev, { id: newLocalId(), kind: 'error', text: t('failed') }]);
          },
        },
      );
    },
    [sendChat, t, timezone],
  );

  const send = (text: string) => {
    const message = text.trim();
    if (!message || thinking || history.isLoading) return;

    const pendingId = newLocalId();
    setEntries((prev) => [...prev, { id: pendingId, kind: 'user', text: message }]);
    setDraft('');
    setNotice(null);
    submit(message, pendingId);
  };

  const retry = () => {
    if (thinking) return;
    // The failed message is the last user line; drop the error and send it again.
    const lastUser = [...entries].reverse().find((e) => e.kind === 'user');
    if (!lastUser || lastUser.kind !== 'user') return;
    setEntries((prev) => prev.filter((e) => e.kind !== 'error'));
    submit(lastUser.text, lastUser.id);
  };

  const confirm = (id: string) => {
    patchProposal(id, 'confirming');
    decide(
      { proposalId: id, decision: 'confirm' },
      {
        onSuccess: (result) => {
          patchProposal(id, result.state === 'open' ? 'open' : 'done');
          if (result.items.length > 0) {
            setEntries((prev) => [...prev, ...result.items.map(fromItem)]);
          }
          const allOk = result.results.every((r) => r.ok);
          setNotice(result.state === 'open' ? t('saveFailed') : allOk ? null : t('savePartial'));
        },
        onError: () => {
          // Already decided elsewhere, or the request never landed: reload the truth.
          patchProposal(id, 'open');
          setNotice(t('saveFailed'));
          void history.refetch().then(({ data }) => {
            if (data) setEntries(data.map(fromItem));
          });
        },
      },
    );
  };

  const dismiss = (id: string) => {
    patchProposal(id, 'dismissed');
    decide({ proposalId: id, decision: 'dismiss' }, { onError: () => patchProposal(id, 'open') });
  };

  const startOver = () => {
    clearChat(undefined, {
      onSuccess: () => {
        setEntries([]);
        setNotice(null);
        setConfirmingClear(false);
      },
      onError: () => {
        setConfirmingClear(false);
        setNotice(t('clearFailed'));
      },
    });
  };

  const loading = history.isLoading;
  const empty = !loading && entries.length === 0;
  const canSend = draft.trim().length > 0 && !thinking && !loading;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg)]">
      <DashboardTopbar char={char} dateStr={dateStr} />

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-4 pt-4">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[9px] tracking-[0.3em] text-[var(--gold)] [font-family:var(--f-title)]">
                {t('eyebrow').toUpperCase()}
              </div>
              <h1 className="truncate text-[22px] font-bold tracking-[0.03em] text-[var(--text-hi)] [font-family:var(--f-title)]">
                {t('title')}
              </h1>
            </div>
            {entries.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setConfirmingClear(true)}>
                {t('newChat')}
              </Button>
            )}
          </div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
            {loading && (
              <div className="flex flex-col gap-3" aria-hidden>
                <SkelBlock className="h-[44px] w-3/5 self-end" />
                <SkelBlock className="h-[68px] w-4/5" />
                <SkelBlock className="h-[44px] w-1/2 self-end" />
              </div>
            )}

            {empty && (
              <div className="flex flex-col items-center gap-4 pt-6">
                <NoData icon="✨" title={t('emptyTitle')} message={t('emptyMessage')} />
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => send(t(`suggestions.${key}`))}
                      className="rounded-full border border-[var(--border)] bg-[var(--bg-2)] px-3.5 py-2 text-[13px] text-[var(--text-hi)] transition-colors hover:border-[var(--gold)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
                    >
                      {t(`suggestions.${key}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {entries.map((entry, index) => {
              if (entry.kind === 'proposal') {
                return (
                  <ProposalCard
                    key={entry.id}
                    actions={entry.actions}
                    state={entry.state}
                    onConfirm={() => confirm(entry.id)}
                    onDismiss={() => dismiss(entry.id)}
                  />
                );
              }
              if (entry.kind === 'error') {
                return (
                  <div key={entry.id} className="flex flex-col items-start gap-2">
                    <ChatBubble role="error" text={entry.text} />
                    {index === entries.length - 1 && (
                      <Button variant="ghost" size="sm" onClick={retry}>
                        {t('retry')}
                      </Button>
                    )}
                  </div>
                );
              }
              return <ChatBubble key={entry.id} role={entry.kind} text={entry.text} />;
            })}

            {thinking && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-2 py-1 text-[13px] text-[var(--text-lo)]"
              >
                <span className="inline-flex gap-1" aria-hidden>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--gold)]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--gold)] [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--gold)] [animation-delay:300ms]" />
                </span>
                {t('thinking')}
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
          className="shrink-0 border-t border-[var(--border-lo)] bg-[var(--bg-1)] px-4 py-3"
        >
          <div className="mx-auto w-full max-w-2xl">
            {notice && (
              <p role="alert" className="pb-2 text-[13px] text-[var(--rose)]">
                {notice}
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  // Enter sends; Shift+Enter keeps writing on a new line.
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    send(draft);
                  }
                }}
                rows={1}
                maxLength={MAX_INPUT_LENGTH}
                placeholder={t('placeholder')}
                aria-label={t('placeholder')}
                className="min-h-[44px] flex-1 resize-none rounded-[var(--r-lg,14px)] border border-[var(--border)] bg-[var(--bg-2)] px-3.5 py-3 text-[14px] leading-snug text-[var(--text-hi)] outline-none placeholder:text-[var(--text-dim)] focus:border-[var(--gold)]"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={!canSend}
                aria-label={t('send')}
                className="h-[44px] shrink-0 px-4"
              >
                {t('send')}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <Modal open={confirmingClear} onClose={() => setConfirmingClear(false)} maxWidth="380px">
        <ModalHead title={t('newChatTitle')} />
        <ModalBody>
          <p className="text-[12px] leading-relaxed text-[var(--text-mid)]">
            {t('newChatMessage')}
          </p>
        </ModalBody>
        <ModalFoot>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => setConfirmingClear(false)}
              disabled={clearing}
              className="w-full justify-center sm:w-auto"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={startOver}
              isLoading={clearing}
              className="w-full justify-center sm:w-auto"
            >
              {t('newChatConfirm')}
            </Button>
          </div>
        </ModalFoot>
      </Modal>
    </div>
  );
}
