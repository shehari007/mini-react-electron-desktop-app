'use client';

import { useMemo, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Card, CardHeader, Result, Stat } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Controls';
import { DetailList } from '@/components/ui/DataTable';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useMounted } from '@/lib/hooks';
import { formatNumber, pluralize } from '@/lib/utils';

const DAY_MS = 86_400_000;

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getMonth() === Number(month) - 1 && date.getDate() === Number(day) ? date : null;
}

const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function AgeCalculator() {
  const mounted = useMounted();
  const [birth, setBirth] = useState('1995-06-15');
  const [useCustomTarget, setUseCustomTarget] = useState(false);
  const [target, setTarget] = useState('');

  // Default the comparison date to today, but only after mount — the
  // prerendered HTML has no "today".
  const targetDate = useMemo(() => {
    if (useCustomTarget) return parseLocalDate(target);
    if (!mounted) return null;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, [useCustomTarget, target, mounted]);

  const result = useMemo(() => {
    const from = parseLocalDate(birth);
    if (!from || !targetDate) return null;
    if (from > targetDate) return { future: true as const };

    // Calendar age with borrowing, so "1 year 11 months" is exact rather than
    // a rounded division.
    let years = targetDate.getFullYear() - from.getFullYear();
    let months = targetDate.getMonth() - from.getMonth();
    let days = targetDate.getDate() - from.getDate();

    if (days < 0) {
      months -= 1;
      days += new Date(targetDate.getFullYear(), targetDate.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const totalDays = Math.round(
      (Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()) -
        Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) /
        DAY_MS,
    );

    // Next birthday: this year's, or next year's if it has already passed.
    let nextBirthday = new Date(targetDate.getFullYear(), from.getMonth(), from.getDate());
    if (nextBirthday < targetDate) {
      nextBirthday = new Date(targetDate.getFullYear() + 1, from.getMonth(), from.getDate());
    }
    const daysToBirthday = Math.round(
      (Date.UTC(nextBirthday.getFullYear(), nextBirthday.getMonth(), nextBirthday.getDate()) -
        Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())) /
        DAY_MS,
    );

    return {
      future: false as const,
      years,
      months,
      days,
      totalDays,
      totalMonths: years * 12 + months,
      bornOn: new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(from),
      bornFull: new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(from),
      nextBirthday,
      daysToBirthday,
      turning: nextBirthday.getFullYear() - from.getFullYear(),
      nextBirthdayWeekday: new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(nextBirthday),
    };
  }, [birth, targetDate]);

  return (
    <ToolColumns
      main={
        <Card>
          <CardHeader title="Date of birth" />

          <Field label="Born on" className="mt-4">
            <Input
              type="date"
              value={birth}
              max={targetDate ? toIso(targetDate) : undefined}
              onChange={(event) => setBirth(event.currentTarget.value)}
              inputSize="lg"
            />
          </Field>

          <div className="mt-4 border-t border-border pt-4">
            <Switch
              checked={useCustomTarget}
              onChange={(checked) => {
                setUseCustomTarget(checked);
                if (checked && target === '' && targetDate) setTarget(toIso(targetDate));
              }}
              label="Compare against a specific date"
              description="Otherwise the age is worked out as of today."
            />
            {useCustomTarget && (
              <Field label="As of" className="mt-3">
                <Input type="date" value={target} onChange={(event) => setTarget(event.currentTarget.value)} />
              </Field>
            )}
          </div>

          {result?.future && (
            <Callout tone="warning" className="mt-4">
              That date is in the future. Pick a birth date on or before the comparison date.
            </Callout>
          )}
        </Card>
      }
      side={
        result === null || result.future ? (
          <Card>
            <p className="py-6 text-center text-[13px] text-fg-muted">
              {result?.future ? 'Adjust the dates to see an age.' : 'Enter a date of birth.'}
            </p>
          </Card>
        ) : (
          <>
            <Card>
              <Result
                label="Age"
                value={`${result.years} ${result.years === 1 ? 'year' : 'years'}`}
                hint={`${pluralize(result.months, 'month')} and ${pluralize(result.days, 'day')} on top`}
              />
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <Stat label="Total days lived" value={formatNumber(result.totalDays, 0)} />
                <Stat label="Born on a" value={result.bornOn} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Next birthday" />
              <DetailList
                className="mt-3"
                items={[
                  {
                    label: 'Date',
                    value: new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(
                      result.nextBirthday,
                    ),
                  },
                  { label: 'Falls on a', value: result.nextBirthdayWeekday },
                  {
                    label: 'Days away',
                    value: result.daysToBirthday === 0 ? 'Today 🎉' : formatNumber(result.daysToBirthday, 0),
                  },
                  { label: 'Turning', value: result.turning },
                ]}
              />
            </Card>

            <Card>
              <CardHeader title="Also expressed as" />
              <DetailList
                className="mt-3"
                items={[
                  { label: 'Months', value: formatNumber(result.totalMonths, 0) },
                  { label: 'Weeks', value: formatNumber(Math.floor(result.totalDays / 7), 0) },
                  { label: 'Days', value: formatNumber(result.totalDays, 0) },
                  { label: 'Hours', value: formatNumber(result.totalDays * 24, 0) },
                  { label: 'Minutes', value: formatNumber(result.totalDays * 1440, 0) },
                ]}
              />
            </Card>
          </>
        )
      }
    />
  );
}
