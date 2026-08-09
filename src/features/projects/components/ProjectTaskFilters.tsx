'use client';

import type { Category } from '@/types';

interface Props {
  search: string;
  onSearch: (v: string) => void;
  tag: string;
  onTag: (v: string) => void;
  categories: Category[];
}

export function ProjectTaskFilters({ search, onSearch, tag, onTag, categories }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-2 py-1.5 w-full sm:w-[180px] shrink-0">
        <span className="text-[var(--text-lo)] text-[11px] shrink-0">⌕</span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search tasks…"
          className="flex-1 bg-transparent text-[11px] text-[var(--text-hi)] placeholder:text-[var(--text-lo)] outline-none min-w-0"
        />
      </div>

      {categories.length > 0 && (
        <select
          value={tag}
          onChange={(e) => onTag(e.target.value)}
          className="bg-[var(--panel2)] border border-[var(--border)] rounded-[var(--r-sm)] px-2 py-1.5 text-[11px] text-[var(--text-mid)] outline-none w-full sm:w-auto"
        >
          <option value="all">All tags</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
