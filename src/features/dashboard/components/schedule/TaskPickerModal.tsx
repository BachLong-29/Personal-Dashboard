'use client';

import { useState } from 'react';

import { Icon } from '@/components/common/Icon';
import { Modal, ModalBody, ModalHead } from '@/components/ui/Modal';
import { cn } from '@/libs/utils';
import type { Task, TaskSuggestion } from '@/types';

import { useTaskSearch } from '../../hooks/useTaskSearch';
import { useTaskSuggestions } from '../../hooks/useTaskSuggestions';

interface TaskPickerModalProps {
  open: boolean;
  /** Day this pick will be assigned to (YYYY-MM-DD), shown in the header. */
  dateStr: string;
  /** Task ids already placed on that day — filtered out so they can't be picked twice. */
  excludeIds: Set<string>;
  onClose: () => void;
  onPick: (task: Task) => void;
}

export function TaskPickerModal({
  open,
  dateStr,
  excludeIds,
  onClose,
  onPick,
}: TaskPickerModalProps) {
  const [query, setQuery] = useState('');
  const { data: results = [], isFetching } = useTaskSearch(query, 20);

  // Suggestions answer "what should go here?" — only useful before searching.
  const isBrowsing = query.trim().length === 0;
  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useTaskSuggestions(
    open && isBrowsing ? dateStr : null,
  );

  const visibleSuggestions = suggestions.filter((s) => !excludeIds.has(s.task.id));
  const suggestedIds = new Set(visibleSuggestions.map((s) => s.task.id));

  const filtered = results.filter(
    (task) =>
      task.active &&
      task.status !== 'done' &&
      !excludeIds.has(task.id) &&
      // Don't repeat a task that is already sitting in the suggestion block.
      !(isBrowsing && suggestedIds.has(task.id)),
  );

  function handleClose() {
    setQuery('');
    onClose();
  }

  function handlePick(task: Task) {
    onPick(task);
    handleClose();
  }

  const showSuggestions = isBrowsing && (isLoadingSuggestions || visibleSuggestions.length > 0);

  return (
    <Modal open={open} onClose={handleClose} maxWidth="380px" closeButton>
      <ModalHead title={<>📋 Assign to {dateStr}</>} />
      <ModalBody>
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks..."
          className={searchInput}
        />

        <div className={scrollArea}>
          {showSuggestions && (
            <section className={section}>
              <p className={sectionLabel}>✦ Suggested from backlog</p>
              {isLoadingSuggestions && <p className={emptyMsg}>Ranking backlog...</p>}
              {!isLoadingSuggestions &&
                visibleSuggestions.map((suggestion) => (
                  <SuggestionRow
                    key={suggestion.task.id}
                    suggestion={suggestion}
                    onPick={handlePick}
                  />
                ))}
            </section>
          )}

          <section className={section}>
            {showSuggestions && filtered.length > 0 && <p className={sectionLabel}>Recent</p>}
            {isFetching && <p className={emptyMsg}>Searching...</p>}
            {!isFetching && filtered.length === 0 && !showSuggestions && (
              <p className={emptyMsg}>No matching tasks</p>
            )}
            {!isFetching &&
              filtered.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className={resultRow}
                  onClick={() => handlePick(task)}
                >
                  <span className={resultIcon}>
                    <Icon icon={task.icon} />
                  </span>
                  <span className={resultName}>{task.name}</span>
                  {task.startDate && <span className={resultDate}>{task.startDate}</span>}
                </button>
              ))}
          </section>
        </div>
      </ModalBody>
    </Modal>
  );
}

function SuggestionRow({
  suggestion,
  onPick,
}: {
  suggestion: TaskSuggestion;
  onPick: (task: Task) => void;
}) {
  const { task, score, reasons } = suggestion;

  return (
    <button type="button" className={suggestionRow} onClick={() => onPick(task)}>
      <span className={resultIcon}>
        <Icon icon={task.icon} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={resultName}>{task.name}</span>
        {reasons.length > 0 && (
          <span className="flex flex-wrap gap-1">
            {reasons.map((reason) => (
              <span key={reason.code} className={reasonChip}>
                {reason.label}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className={scoreBadge} title={`Match score ${score}/100`}>
        {score}
      </span>
    </button>
  );
}

const searchInput = cn(
  'w-full rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--bg-2)]',
  'px-3 py-2 text-[12px] text-[var(--text-hi)] placeholder:text-[var(--text-dim)]',
  'hover:border-[var(--border-hi)] hover:bg-[var(--bg-3)]',
  'focus:border-[var(--gold)] focus:outline-none',
  'focus:shadow-[0_0_0_3px_oklch(0.78_0.16_82_/_0.15)]',
  'transition-all duration-[180ms]',
);

const scrollArea = 'flex flex-col gap-3 max-h-[320px] overflow-y-auto mt-3';
const section = 'flex flex-col gap-1';
const sectionLabel = 'text-[10px] font-semibold uppercase tracking-wide text-[var(--text-lo)] px-1';
const emptyMsg = 'text-[11px] text-[var(--text-lo)] text-center py-4';
const resultRow = cn(
  'flex items-center gap-2 px-2.5 py-2 rounded-[var(--r-sm)] w-full text-left',
  'bg-[var(--bg-2)] border border-[var(--border)] cursor-pointer',
  'hover:border-[oklch(0.74_0.17_85_/_0.4)] hover:bg-[oklch(0.74_0.17_85_/_0.05)] transition-colors',
);
const suggestionRow = cn(
  'flex items-start gap-2 px-2.5 py-2 rounded-[var(--r-sm)] w-full text-left',
  'bg-[oklch(0.74_0.17_85_/_0.05)] border border-[oklch(0.74_0.17_85_/_0.25)] cursor-pointer',
  'hover:border-[var(--gold)] hover:bg-[oklch(0.74_0.17_85_/_0.1)] transition-colors',
);
const resultIcon = 'text-[14px] shrink-0';
const resultName = 'flex-1 truncate text-[12px] text-[var(--text-hi)]';
const resultDate = 'text-[10px] text-[var(--text-lo)] shrink-0';
const reasonChip = cn(
  'rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg-2)]',
  'px-1.5 py-0.5 text-[9px] leading-none text-[var(--text-lo)]',
);
const scoreBadge = 'shrink-0 text-[11px] font-bold text-[var(--gold)] tabular-nums';
