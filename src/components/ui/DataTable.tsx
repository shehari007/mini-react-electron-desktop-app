import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  /** Numeric columns right-align and use tabular figures so digits line up. */
  numeric?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  columns: ReadonlyArray<Column<T>>;
  rows: readonly T[];
  rowKey: (row: T, index: number) => string;
  caption?: ReactNode;
  /** Constrains height and scrolls the body while the header stays put. */
  maxHeight?: string;
  emptyMessage?: ReactNode;
  className?: string;
}

/**
 * The table view that every chart in AppBox is paired with.
 *
 * This is not decoration: the chart palette has a light-mode series below 3:1
 * contrast, and an accessible table of the same numbers is what discharges that
 * — plus it's how anyone actually reads an amortization schedule.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  maxHeight,
  emptyMessage = 'Nothing to show yet.',
  className,
}: DataTableProps<T>) {
  return (
    <div
      className={cn('overflow-auto rounded-xl border border-border', className)}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table className="w-full border-collapse text-left text-[13px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="sticky top-0 z-10 bg-bg-subtle">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'whitespace-nowrap border-b border-border px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle',
                  column.numeric && 'text-right',
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-fg-subtle">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={rowKey(row, index)} className="transition-colors hover:bg-bg-subtle/70">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'border-b border-border/60 px-3 py-2 text-fg',
                      column.numeric && 'tabular text-right',
                      column.className,
                    )}
                  >
                    {column.render(row, index)}
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

/** Label/value rows for detail panels (weather metrics, JWT claims, URL parts). */
export function DetailList({
  items,
  className,
}: {
  items: ReadonlyArray<{ label: ReactNode; value: ReactNode; hint?: ReactNode }>;
  className?: string;
}) {
  return (
    <dl className={cn('divide-y divide-border', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
          <dt className="min-w-0 text-[13px] text-fg-muted">{item.label}</dt>
          <dd className="min-w-0 text-right">
            <span className="tabular text-[13px] font-semibold text-fg">{item.value}</span>
            {item.hint && <span className="mt-0.5 block text-xs text-fg-subtle">{item.hint}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
