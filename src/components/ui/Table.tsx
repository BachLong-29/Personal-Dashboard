import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  className?: string;
  emptyMessage?: string;
}

export function TableAvatar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'w-7 h-7 rounded-full inline-flex items-center justify-center text-[12px] mr-2 align-middle',
        '[font-family:var(--f-title)] font-bold',
        className,
      )}
      style={{
        background: 'linear-gradient(135deg, var(--violet-2), var(--violet))',
      }}
    >
      {children}
    </span>
  );
}

export function Table<T>({
  columns,
  data,
  rowKey,
  className,
  emptyMessage = 'No data',
}: TableProps<T>) {
  return (
    <div
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] overflow-hidden',
        className,
      )}
    >
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'text-left px-4 py-3 [font-family:var(--f-title)] text-[9px] tracking-[0.18em] uppercase text-[var(--text-lo)]',
                  'bg-[var(--bg-2)] border-b border-[var(--border)]',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-[var(--text-lo)] text-[13px]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={rowKey(row)}
                className="border-b border-[var(--border-lo)] last:border-b-0 hover:[&_td]:bg-[var(--surface-2)] hover:[&_td]:text-[var(--text-hi)]"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-[var(--text-md)] transition-colors duration-150',
                      col.className,
                    )}
                  >
                    {col.cell(row, i)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
