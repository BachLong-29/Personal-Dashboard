'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { UITask } from '../../data/mock';
import type { ColKey } from './TaskAllRow';
import { TaskAllRow } from './TaskAllRow';

// ─── Column definitions ───────────────────────────────────────────────────────

export interface ColDef {
  key: ColKey;
  /** Label shown in the column picker */
  label: string;
  /** Label shown in the table header */
  headerLabel: string;
  headerClass: string;
  defaultVisible: boolean;
}

export const COL_DEFS: ColDef[] = [
  {
    key: 'status',
    label: 'Status',
    headerLabel: 'Status',
    headerClass: 'w-20 shrink-0',
    defaultVisible: true,
  },
  {
    key: 'category',
    label: 'Category',
    headerLabel: 'Category',
    headerClass: 'w-20 shrink-0',
    defaultVisible: true,
  },
  {
    key: 'priority',
    label: 'Priority',
    headerLabel: 'Pri',
    headerClass: 'w-10 text-center shrink-0',
    defaultVisible: true,
  },
  {
    key: 'deadline',
    label: 'Deadline',
    headerLabel: 'Deadline',
    headerClass: 'w-24 shrink-0',
    defaultVisible: true,
  },
  {
    key: 'progress',
    label: 'Progress',
    headerLabel: 'Progress',
    headerClass: 'w-[60px] shrink-0',
    defaultVisible: true,
  },
  {
    key: 'xp',
    label: 'XP',
    headerLabel: 'XP',
    headerClass: 'w-12 text-right shrink-0',
    defaultVisible: true,
  },
  {
    key: 'est',
    label: 'Est',
    headerLabel: 'Est',
    headerClass: 'w-10 text-right shrink-0',
    defaultVisible: true,
  },
  {
    key: 'streak',
    label: 'Streak',
    headerLabel: 'Streak',
    headerClass: 'w-10 text-right shrink-0',
    defaultVisible: false,
  },
  {
    key: 'subtasks',
    label: 'Subtasks',
    headerLabel: 'Sub',
    headerClass: 'w-8 text-right shrink-0',
    defaultVisible: false,
  },
];

export const DEFAULT_VISIBLE_COLS = new Set<ColKey>(
  COL_DEFS.filter((c) => c.defaultVisible).map((c) => c.key),
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskAllTableProps {
  sorted: UITask[];
  visibleCols: Set<ColKey>;
  /** tagId → category name from API */
  catMap: Record<string, string>;
  onEdit?: (task: UITask) => void;
  onDelete: (task: UITask) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskAllTable({ sorted, visibleCols, catMap, onEdit, onDelete }: TaskAllTableProps) {
  const t = useTranslations('tasks');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const colDefs: ColDef[] = [
    {
      key: 'status',
      label: t('taskAllView.columns.status'),
      headerLabel: t('taskAllView.columns.status'),
      headerClass: 'w-20 shrink-0',
      defaultVisible: true,
    },
    {
      key: 'category',
      label: t('taskAllView.columns.category'),
      headerLabel: t('taskAllView.columns.category'),
      headerClass: 'w-20 shrink-0',
      defaultVisible: true,
    },
    {
      key: 'priority',
      label: t('taskAllView.columns.priority'),
      headerLabel: t('taskAllView.columns.priorityShort'),
      headerClass: 'w-10 text-center shrink-0',
      defaultVisible: true,
    },
    {
      key: 'deadline',
      label: t('taskAllView.columns.deadline'),
      headerLabel: t('taskAllView.columns.deadline'),
      headerClass: 'w-24 shrink-0',
      defaultVisible: true,
    },
    {
      key: 'progress',
      label: t('taskAllView.columns.progress'),
      headerLabel: t('taskAllView.columns.progress'),
      headerClass: 'w-[60px] shrink-0',
      defaultVisible: true,
    },
    {
      key: 'xp',
      label: t('taskAllView.columns.xp'),
      headerLabel: t('taskAllView.columns.xp'),
      headerClass: 'w-12 text-right shrink-0',
      defaultVisible: true,
    },
    {
      key: 'est',
      label: t('taskAllView.columns.est'),
      headerLabel: t('taskAllView.columns.est'),
      headerClass: 'w-10 text-right shrink-0',
      defaultVisible: true,
    },
    {
      key: 'streak',
      label: t('taskAllView.columns.streak'),
      headerLabel: t('taskAllView.columns.streak'),
      headerClass: 'w-10 text-right shrink-0',
      defaultVisible: false,
    },
    {
      key: 'subtasks',
      label: t('taskAllView.columns.subtasks'),
      headerLabel: t('taskAllView.columns.subtasksShort'),
      headerClass: 'w-8 text-right shrink-0',
      defaultVisible: false,
    },
  ];
  const visibleDefs = colDefs.filter((c) => visibleCols.has(c.key));

  return (
    <div className="flex-1 overflow-auto min-w-0">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className={tableHeader}>
        <span className="w-[16px] shrink-0" />
        <span className="w-[140px] shrink-0 md:flex-1 md:w-auto md:min-w-0 truncate">
          {t('taskAllView.columns.task')}
        </span>
        {visibleDefs.map((c) => (
          <span key={c.key} className={c.headerClass}>
            {c.headerLabel}
          </span>
        ))}
        <span className="w-5 shrink-0" />
      </div>

      {/* ── Rows ─────────────────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center opacity-50">
          <div className="text-[32px]">◈</div>
          <div className="text-[12px] font-bold text-[var(--text-mid)]">
            {t('taskAllView.table.emptyTitle')}
          </div>
          <div className="text-[10px] text-[var(--text-lo)]">
            {t('taskAllView.table.emptyDescription')}
          </div>
        </div>
      ) : (
        sorted.map((t) => (
          <TaskAllRow
            key={t.id}
            task={t}
            isExpanded={expandedId === t.id}
            onExpand={() => setExpandedId(expandedId === t.id ? null : t.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            visibleCols={visibleCols}
            catLabel={t.tagId ? catMap[t.tagId] : undefined}
          />
        ))
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

// hidden on mobile — rows show their own inline subtitle instead
const tableHeader =
  'hidden sm:flex items-center gap-3 px-4 py-1.5 bg-[var(--panel2)] border-b border-[var(--border)] text-[8px] font-bold text-[var(--text-lo)] tracking-[0.1em] uppercase font-[var(--font-title)] sticky top-0 z-10 shrink-0 min-w-max';
