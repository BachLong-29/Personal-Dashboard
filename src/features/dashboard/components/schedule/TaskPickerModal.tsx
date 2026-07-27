'use client';

import { useState } from 'react';

import { Icon } from '@/components/common/Icon';
import { Modal, ModalBody, ModalHead } from '@/components/ui/Modal';
import { cn } from '@/libs/utils';

import { useTaskSearch } from '../../hooks/useTaskSearch';
import type { Task } from '../../types';

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

  const filtered = (results as Task[]).filter(
    (task) => task.active && task.status !== 'done' && !excludeIds.has(task.id),
  );

  function handleClose() {
    setQuery('');
    onClose();
  }

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
        <div className={resultList}>
          {isFetching && <p className={emptyMsg}>Searching...</p>}
          {!isFetching && filtered.length === 0 && <p className={emptyMsg}>No matching tasks</p>}
          {!isFetching &&
            filtered.map((task) => (
              <button
                key={task.id}
                type="button"
                className={resultRow}
                onClick={() => {
                  onPick(task);
                  handleClose();
                }}
              >
                <span className={resultIcon}>
                  <Icon icon={task.icon} />
                </span>
                <span className={resultName}>{task.name}</span>
                {task.startDate && <span className={resultDate}>{task.startDate}</span>}
              </button>
            ))}
        </div>
      </ModalBody>
    </Modal>
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

const resultList = 'flex flex-col gap-1 max-h-[280px] overflow-y-auto mt-3';
const emptyMsg = 'text-[11px] text-[var(--text-lo)] text-center py-4';
const resultRow = cn(
  'flex items-center gap-2 px-2.5 py-2 rounded-[var(--r-sm)] w-full text-left',
  'bg-[var(--bg-2)] border border-[var(--border)] cursor-pointer',
  'hover:border-[oklch(0.74_0.17_85_/_0.4)] hover:bg-[oklch(0.74_0.17_85_/_0.05)] transition-colors',
);
const resultIcon = 'text-[14px] shrink-0';
const resultName = 'flex-1 truncate text-[12px] text-[var(--text-hi)]';
const resultDate = 'text-[10px] text-[var(--text-lo)] shrink-0';
