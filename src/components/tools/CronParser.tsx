'use client';

import { CalendarClock } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { CopyButton } from '@/components/ui/CopyButton';
import { DataTable } from '@/components/ui/DataTable';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { CRON_FIELD_REFERENCE, CRON_PRESETS, describeCron, nextRuns, parseCron } from '@/lib/cron';
import { useMounted } from '@/lib/hooks';
import { cn, relativeTime } from '@/lib/utils';

const FIELD_LABELS = ['Minute', 'Hour', 'Day of month', 'Month', 'Day of week'] as const;

export function CronParser() {
  const mounted = useMounted();
  const [expression, setExpression] = useState('*/15 9-17 * * 1-5');

  const parsed = useMemo(() => parseCron(expression), [expression]);

  const description = useMemo(() => (parsed.ok ? describeCron(parsed.cron) : null), [parsed]);

  // Next runs depend on "now", so they are computed only after mount to keep the
  // prerendered HTML stable.
  const runs = useMemo(() => {
    if (!parsed.ok || !mounted) return [];
    return nextRuns(parsed.cron, new Date(), 8);
  }, [parsed, mounted]);

  const segments = expression.trim().replace(/\s+/g, ' ').split(' ');

  return (
    <ToolColumns
      main={
        <>
          <Card>
            <CardHeader
              title="Cron expression"
              icon={<CalendarClock />}
              actions={<CopyButton value={expression} ariaLabel="Copy expression" size="sm" />}
            />

            <Field
              className="mt-4"
              hint="Five fields: minute, hour, day of month, month, day of week. Shorthands like @daily also work."
            >
              <Input
                mono
                inputSize="lg"
                value={expression}
                onChange={(event) => setExpression(event.currentTarget.value)}
                placeholder="*/15 9-17 * * 1-5"
                autoComplete="off"
                spellCheck={false}
              />
            </Field>

            {/* Label each field under the expression so the positions are obvious. */}
            {segments.length === 5 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {segments.map((segment, index) => {
                  const invalid =
                    !parsed.ok &&
                    parsed.errors.some(
                      (error) => error.field === FIELD_LABELS[index]?.toLowerCase(),
                    );
                  return (
                    <div
                      key={index}
                      className={cn(
                        'rounded-lg border px-2 py-1.5 text-center',
                        invalid ? 'border-danger/40 bg-danger/10' : 'border-border bg-bg-subtle',
                      )}
                    >
                      <div className={cn('font-mono text-[13px] font-semibold', invalid ? 'text-danger' : 'text-accent-text')}>
                        {segment}
                      </div>
                      <div className="mt-0.5 text-[9px] uppercase tracking-wide text-fg-subtle">
                        {FIELD_LABELS[index]}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {parsed.ok ? (
              <Callout tone="success" title="This runs" className="mt-4">
                {description}
              </Callout>
            ) : (
              <div className="mt-4 space-y-2">
                {parsed.errors.map((error, index) => (
                  <Callout key={index} tone="danger" title={`Problem in the ${error.field} field`}>
                    {error.message}
                  </Callout>
                ))}
              </div>
            )}
          </Card>

          <Card flush>
            <div className="p-5 pb-3">
              <CardHeader
                title="Next runs"
                description={
                  parsed.ok
                    ? 'Computed in your local timezone. A server usually runs in UTC — check before relying on the times.'
                    : 'Fix the expression to preview its schedule.'
                }
              />
            </div>
            <div className="px-3 pb-3">
              <DataTable
                rows={runs}
                rowKey={(date) => date.toISOString()}
                emptyMessage={parsed.ok && !mounted ? 'Calculating…' : 'No runs in the next four years.'}
                columns={[
                  {
                    key: 'when',
                    header: 'Date and time',
                    render: (date) =>
                      new Intl.DateTimeFormat(undefined, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(date),
                  },
                  {
                    key: 'relative',
                    header: 'From now',
                    numeric: true,
                    render: (date) => <span className="text-fg-muted">{relativeTime(date.getTime())}</span>,
                  },
                ]}
              />
            </div>
          </Card>
        </>
      }
      side={
        <>
          <Card>
            <CardHeader title="Common schedules" />
            <ul className="mt-3 space-y-1">
              {CRON_PRESETS.map((preset) => (
                <li key={preset.expression}>
                  <button
                    type="button"
                    onClick={() => setExpression(preset.expression)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                      expression.trim() === preset.expression
                        ? 'bg-accent-soft'
                        : 'hover:bg-bg-subtle',
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate text-[12px] text-fg-muted">{preset.label}</span>
                    <code className="shrink-0 font-mono text-[11px] font-semibold text-accent-text">
                      {preset.expression}
                    </code>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card flush>
            <div className="p-5 pb-3">
              <CardHeader title="Field reference" />
            </div>
            <div className="px-3 pb-3">
              <DataTable
                rows={CRON_FIELD_REFERENCE}
                rowKey={(row) => row.field}
                columns={[
                  { key: 'field', header: 'Field', render: (row) => row.field },
                  {
                    key: 'range',
                    header: 'Range',
                    render: (row) => <code className="font-mono text-[11px] text-accent-text">{row.range}</code>,
                  },
                ]}
              />
            </div>
          </Card>

          <Callout tone="info" title="One gotcha worth knowing">
            When both day-of-month and day-of-week are restricted, cron matches{' '}
            <strong>either</strong> — not both. So <code className="font-mono">0 0 1 * 1</code> fires on the 1st
            of the month <em>and</em> every Monday.
          </Callout>
        </>
      }
    />
  );
}
