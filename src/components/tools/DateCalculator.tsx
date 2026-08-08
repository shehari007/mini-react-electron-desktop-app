'use client';

import { useMemo, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Card, CardHeader, Result, Stat } from '@/components/ui/Card';
import { Segmented, Switch } from '@/components/ui/Controls';
import { DetailList } from '@/components/ui/DataTable';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { formatNumber, pluralize } from '@/lib/utils';

type Mode = 'difference' | 'shift';

const isoToday = () => new Date().toISOString().slice(0, 10);

/** Parse a yyyy-mm-dd value as a *local* date. `new Date('2026-01-01')` parses
 *  as UTC midnight, which lands on the previous day west of Greenwich. */
function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  // Rejects impossible dates like 2026-02-31, which Date would roll forward.
  return date.getMonth() === Number(month) - 1 && date.getDate() === Number(day) ? date : null;
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const DAY_MS = 86_400_000;

/** Calendar difference in years/months/days, borrowing like long subtraction. */
function calendarDiff(from: Date, to: Date) {
  const [earlier, later] = from <= to ? [from, to] : [to, from];

  let years = later.getFullYear() - earlier.getFullYear();
  let months = later.getMonth() - earlier.getMonth();
  let days = later.getDate() - earlier.getDate();

  if (days < 0) {
    months -= 1;
    // Days in the month before `later` — the borrow amount.
    days += new Date(later.getFullYear(), later.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

/** Whole days between two dates, counted at local midnight so DST shifts don't
 *  produce a 0.958-day result that floors to the wrong integer. */
function wholeDaysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / DAY_MS);
}

function countWeekdays(from: Date, to: Date): { business: number; weekend: number } {
  const total = Math.abs(wholeDaysBetween(from, to));
  const start = from <= to ? from : to;

  let business = 0;
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  for (let i = 0; i < total; i += 1) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) business += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return { business, weekend: total - business };
}

export function DateCalculator() {
  const [mode, setMode] = useState<Mode>('difference');

  return (
    <div className="space-y-5">
      <Segmented
        value={mode}
        onChange={setMode}
        ariaLabel="Calculation mode"
        options={[
          { value: 'difference', label: 'Difference between dates' },
          { value: 'shift', label: 'Add or subtract' },
        ]}
      />

      {mode === 'difference' ? <DifferenceMode /> : <ShiftMode />}
    </div>
  );
}

function DifferenceMode() {
  const [start, setStart] = useState(isoToday());
  const [end, setEnd] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return toIso(date);
  });
  const [includeEnd, setIncludeEnd] = useState(false);

  const result = useMemo(() => {
    const from = parseLocalDate(start);
    const to = parseLocalDate(end);
    if (!from || !to) return null;

    const rawDays = wholeDaysBetween(from, to);
    const totalDays = Math.abs(rawDays) + (includeEnd ? 1 : 0);
    const { years, months, days } = calendarDiff(from, to);
    const { business, weekend } = countWeekdays(from, to);

    return {
      backwards: rawDays < 0,
      totalDays,
      years,
      months,
      days,
      business: business + (includeEnd ? 1 : 0),
      weekend,
      totalMonths: years * 12 + months,
    };
  }, [start, end, includeEnd]);

  return (
    <ToolColumns
      main={
        <Card>
          <CardHeader title="Two dates" />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Start date">
              <Input type="date" value={start} onChange={(event) => setStart(event.currentTarget.value)} />
            </Field>
            <Field label="End date">
              <Input type="date" value={end} onChange={(event) => setEnd(event.currentTarget.value)} />
            </Field>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <Switch
              checked={includeEnd}
              onChange={setIncludeEnd}
              label="Count the end date as a full day"
              description="Useful for booking nights or counting leave, where both ends are inclusive."
            />
          </div>

          {result?.backwards && (
            <p className="mt-4 text-[13px] text-fg-muted">
              The end date is before the start date — the figures below are the absolute difference.
            </p>
          )}
        </Card>
      }
      side={
        result === null ? (
          <Card>
            <p className="py-6 text-center text-[13px] text-fg-muted">Enter two valid dates.</p>
          </Card>
        ) : (
          <>
            <Card>
              <Result
                label="Difference"
                value={
                  result.years === 0 && result.months === 0
                    ? pluralize(result.days, 'day')
                    : [
                        result.years > 0 ? pluralize(result.years, 'year') : null,
                        result.months > 0 ? pluralize(result.months, 'month') : null,
                        result.days > 0 ? pluralize(result.days, 'day') : null,
                      ]
                        .filter(Boolean)
                        .join(', ')
                }
                hint={`${formatNumber(result.totalDays, 0)} days in total`}
              />
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <Stat label="Working days" value={formatNumber(result.business, 0)} hint="Mon–Fri" />
                <Stat label="Weekend days" value={formatNumber(result.weekend, 0)} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Also expressed as" />
              <DetailList
                className="mt-3"
                items={[
                  { label: 'Total days', value: formatNumber(result.totalDays, 0) },
                  { label: 'Total weeks', value: formatNumber(result.totalDays / 7, 2) },
                  { label: 'Total months', value: formatNumber(result.totalMonths, 0) },
                  { label: 'Total hours', value: formatNumber(result.totalDays * 24, 0) },
                  { label: 'Total minutes', value: formatNumber(result.totalDays * 1440, 0) },
                ]}
              />
            </Card>
          </>
        )
      }
    />
  );
}

function ShiftMode() {
  const [base, setBase] = useState(isoToday());
  const [direction, setDirection] = useState<'add' | 'subtract'>('add');
  const [years, setYears] = useState('0');
  const [months, setMonths] = useState('0');
  const [weeks, setWeeks] = useState('0');
  const [days, setDays] = useState('30');

  const result = useMemo(() => {
    const from = parseLocalDate(base);
    if (!from) return null;

    const sign = direction === 'add' ? 1 : -1;
    const y = (Number(years) || 0) * sign;
    const m = (Number(months) || 0) * sign;
    const d = ((Number(weeks) || 0) * 7 + (Number(days) || 0)) * sign;

    const shifted = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    // Year and month first, then days. Adding a month to 31 January would
    // otherwise overflow; setDate afterwards keeps the result predictable.
    shifted.setFullYear(shifted.getFullYear() + y);
    shifted.setMonth(shifted.getMonth() + m);
    shifted.setDate(shifted.getDate() + d);

    const weekNumber = (() => {
      const target = new Date(Date.UTC(shifted.getFullYear(), shifted.getMonth(), shifted.getDate()));
      const weekday = target.getUTCDay() || 7;
      target.setUTCDate(target.getUTCDate() + 4 - weekday);
      const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
      return Math.ceil(((target.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
    })();

    return {
      date: shifted,
      iso: toIso(shifted),
      long: new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(shifted),
      weekday: new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(shifted),
      weekNumber,
      daysFromBase: wholeDaysBetween(from, shifted),
    };
  }, [base, direction, years, months, weeks, days]);

  return (
    <ToolColumns
      main={
        <Card>
          <CardHeader title="Shift a date" />

          <Field label="Starting date" className="mt-4">
            <Input type="date" value={base} onChange={(event) => setBase(event.currentTarget.value)} />
          </Field>

          <div className="mt-4">
            <Segmented
              value={direction}
              onChange={setDirection}
              ariaLabel="Direction"
              options={[
                { value: 'add', label: 'Add' },
                { value: 'subtract', label: 'Subtract' },
              ]}
              size="sm"
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Field label="Years">
              <Input type="number" min={0} value={years} onChange={(event) => setYears(event.currentTarget.value)} />
            </Field>
            <Field label="Months">
              <Input type="number" min={0} value={months} onChange={(event) => setMonths(event.currentTarget.value)} />
            </Field>
            <Field label="Weeks">
              <Input type="number" min={0} value={weeks} onChange={(event) => setWeeks(event.currentTarget.value)} />
            </Field>
            <Field label="Days">
              <Input type="number" min={0} value={days} onChange={(event) => setDays(event.currentTarget.value)} />
            </Field>
          </div>
        </Card>
      }
      side={
        result === null ? (
          <Card>
            <p className="py-6 text-center text-[13px] text-fg-muted">Enter a valid starting date.</p>
          </Card>
        ) : (
          <Card>
            <Result label="Resulting date" value={result.iso} hint={result.long} />
            <DetailList
              className="mt-4"
              items={[
                { label: 'Weekday', value: result.weekday },
                { label: 'ISO week', value: `W${result.weekNumber}` },
                {
                  label: 'Days from start',
                  value: `${result.daysFromBase >= 0 ? '+' : ''}${formatNumber(result.daysFromBase, 0)}`,
                },
              ]}
            />
          </Card>
        )
      }
    />
  );
}
