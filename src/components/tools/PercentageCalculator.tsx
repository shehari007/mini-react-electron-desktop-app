'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { cn, formatNumber, parseNumber } from '@/lib/utils';

/**
 * Six separate percentage questions rather than one generic form.
 *
 * "What is 15% of 80" and "80 is what percent of 200" are different questions
 * that a single three-box calculator forces the user to translate into. Each mode
 * also states the formula it used, because the common failure here is the user
 * doubting which way round the answer is.
 */

interface Mode {
  id: string;
  question: string;
  labels: [string, string];
  placeholders: [string, string];
  compute: (a: number, b: number) => { value: number; formula: string; suffix?: string } | null;
  suffix?: string;
}

const MODES: Mode[] = [
  {
    id: 'of',
    question: 'What is X% of Y?',
    labels: ['Percentage (%)', 'Of value'],
    placeholders: ['15', '80'],
    compute: (percent, value) => ({
      value: (percent / 100) * value,
      formula: `${formatNumber(percent)}% × ${formatNumber(value)} = ${formatNumber(value)} × ${formatNumber(percent / 100, 6)}`,
    }),
  },
  {
    id: 'is-what-percent',
    question: 'X is what percent of Y?',
    labels: ['Value', 'Total'],
    placeholders: ['80', '200'],
    compute: (value, total) =>
      total === 0
        ? null
        : {
            value: (value / total) * 100,
            formula: `(${formatNumber(value)} ÷ ${formatNumber(total)}) × 100`,
            suffix: '%',
          },
  },
  {
    id: 'increase',
    question: 'Increase X by Y%',
    labels: ['Starting value', 'Increase by (%)'],
    placeholders: ['250', '20'],
    compute: (value, percent) => ({
      value: value * (1 + percent / 100),
      formula: `${formatNumber(value)} + ${formatNumber((value * percent) / 100)} (which is ${formatNumber(percent)}%)`,
    }),
  },
  {
    id: 'decrease',
    question: 'Decrease X by Y%',
    labels: ['Starting value', 'Decrease by (%)'],
    placeholders: ['250', '20'],
    compute: (value, percent) => ({
      value: value * (1 - percent / 100),
      formula: `${formatNumber(value)} − ${formatNumber((value * percent) / 100)} (which is ${formatNumber(percent)}%)`,
    }),
  },
  {
    id: 'change',
    question: 'Percentage change from X to Y',
    labels: ['From', 'To'],
    placeholders: ['150', '180'],
    compute: (from, to) =>
      from === 0
        ? null
        : {
            value: ((to - from) / Math.abs(from)) * 100,
            formula: `((${formatNumber(to)} − ${formatNumber(from)}) ÷ ${formatNumber(Math.abs(from))}) × 100`,
            suffix: '%',
          },
  },
  {
    id: 'reverse',
    question: 'X is Y% of what?',
    labels: ['Known value', 'Is this percent (%)'],
    placeholders: ['45', '15'],
    compute: (value, percent) =>
      percent === 0
        ? null
        : {
            value: (value / percent) * 100,
            // The classic use: recovering a pre-discount price.
            formula: `${formatNumber(value)} ÷ ${formatNumber(percent / 100, 6)}`,
          },
  },
];

export function PercentageCalculator() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {MODES.map((mode) => (
        <PercentageCard key={mode.id} mode={mode} />
      ))}
    </div>
  );
}

function PercentageCard({ mode }: { mode: Mode }) {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');

  const a = parseNumber(first);
  const b = parseNumber(second);
  const outcome = a !== null && b !== null ? mode.compute(a, b) : null;
  const incomplete = a === null || b === null;

  return (
    <Card className="flex flex-col">
      <h2 className="text-[14px] font-semibold text-fg">{mode.question}</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label={mode.labels[0]}>
          <Input
            type="number"
            inputMode="decimal"
            value={first}
            onChange={(event) => setFirst(event.currentTarget.value)}
            placeholder={mode.placeholders[0]}
          />
        </Field>
        <Field label={mode.labels[1]}>
          <Input
            type="number"
            inputMode="decimal"
            value={second}
            onChange={(event) => setSecond(event.currentTarget.value)}
            placeholder={mode.placeholders[1]}
          />
        </Field>
      </div>

      <div className="mt-4 flex-1 rounded-xl border border-accent/25 bg-accent-soft px-4 py-3">
        {incomplete ? (
          <p className="text-[13px] text-fg-muted">Enter both values to see the answer.</p>
        ) : outcome === null ? (
          <p className="text-[13px] font-medium text-danger">
            That would divide by zero — try a non-zero value.
          </p>
        ) : (
          <>
            <div
              className={cn(
                'tabular text-2xl font-semibold leading-tight text-accent-text',
                Math.abs(outcome.value) >= 1e12 && 'text-xl',
              )}
            >
              {formatNumber(outcome.value, 4)}
              {outcome.suffix ?? ''}
            </div>
            <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-fg-muted">{outcome.formula}</p>
          </>
        )}
      </div>
    </Card>
  );
}
