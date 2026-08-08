'use client';

import { TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';

import { StackedAreaChart } from '@/components/charts/Charts';
import { ToolColumns } from '@/components/ToolShell';
import { Card, CardHeader, Result, Stat } from '@/components/ui/Card';
import { Slider, Switch } from '@/components/ui/Controls';
import { DataTable } from '@/components/ui/DataTable';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { COMPOUND_OPTIONS, calculateCompound, type CompoundFrequency } from '@/lib/finance';
import { CURRENCIES } from '@/lib/rates';
import { useLocalStorage } from '@/lib/storage';
import { formatCurrency, formatNumber, parseNumber, pluralize } from '@/lib/utils';

export function CompoundInterestCalculator() {
  const [initial, setInitial] = useState('10000');
  const [monthly, setMonthly] = useState('250');
  const [rate, setRate] = useState('7');
  const [years, setYears] = useState(20);
  const [frequency, setFrequency] = useState<CompoundFrequency>(12);
  const [adjustInflation, setAdjustInflation] = useState(false);
  const [inflation, setInflation] = useState('3');
  const [currency, setCurrency] = useLocalStorage<string>('compound:currency', 'USD');

  const money = (value: number) => formatCurrency(value, currency);
  const compact = (value: number) =>
    value >= 1_000_000
      ? `${formatNumber(value / 1_000_000, 1)}M`
      : value >= 1000
        ? `${formatNumber(value / 1000, 0)}k`
        : formatNumber(value, 0);

  const result = useMemo(() => {
    const start = parseNumber(initial);
    const contribution = parseNumber(monthly);
    const annualRate = parseNumber(rate);
    if (start === null || contribution === null || annualRate === null) return null;

    return calculateCompound({
      initial: start,
      monthlyContribution: contribution,
      annualRatePercent: annualRate,
      years,
      frequency,
      inflationPercent: adjustInflation ? (parseNumber(inflation) ?? 0) : 0,
    });
  }, [initial, monthly, rate, years, frequency, adjustInflation, inflation]);

  const labels = result?.years.map((row) => `Y${row.year}`) ?? [];

  return (
    <ToolColumns
      main={
        <>
          <Card>
            <CardHeader title="Your plan" icon={<TrendingUp />} />

            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_9rem]">
                <Field label="Starting amount">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={initial}
                    onChange={(event) => setInitial(event.currentTarget.value)}
                  />
                </Field>
                <Field label="Added each month">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={monthly}
                    onChange={(event) => setMonthly(event.currentTarget.value)}
                  />
                </Field>
                <Field label="Currency">
                  <Select
                    options={CURRENCIES.map((item) => ({ value: item.code, label: item.code }))}
                    value={currency}
                    onChange={(event) => setCurrency(event.currentTarget.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Annual return" hint="Long-run global equities have averaged roughly 7% after inflation.">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={rate}
                    onChange={(event) => setRate(event.currentTarget.value)}
                    suffix="%"
                  />
                </Field>
                <Field label="Compounding">
                  <Select
                    options={[...COMPOUND_OPTIONS]}
                    value={String(frequency)}
                    onChange={(event) => setFrequency(Number(event.currentTarget.value) as CompoundFrequency)}
                  />
                </Field>
              </div>

              <Slider
                label="Time horizon"
                value={years}
                onChange={setYears}
                min={1}
                max={50}
                formatValue={(value) => pluralize(value, 'year')}
              />

              <div className="border-t border-border pt-4">
                <Switch
                  checked={adjustInflation}
                  onChange={setAdjustInflation}
                  label="Show the result in today's money"
                  description="Discounts the final balance by inflation, which is usually the figure that actually matters."
                />
                {adjustInflation && (
                  <Field label="Assumed annual inflation" className="mt-3">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={inflation}
                      onChange={(event) => setInflation(event.currentTarget.value)}
                      suffix="%"
                    />
                  </Field>
                )}
              </div>
            </div>
          </Card>

          {result === null ? (
            <Callout tone="warning">Fill in the amounts and rate to see a projection.</Callout>
          ) : (
            <>
              <Card>
                <CardHeader
                  title="Growth over time"
                  description="The lower band is what you put in; the upper band is what the return earned on top."
                />
                <div className="mt-4">
                  <StackedAreaChart
                    ariaLabel={`Projected balance over ${years} years, split into contributions and interest`}
                    labels={labels}
                    series={[
                      { key: 'contributed', label: 'What you paid in', values: result.years.map((row) => row.contributed) },
                      { key: 'interest', label: 'Interest earned', values: result.years.map((row) => row.interest) },
                    ]}
                    overlay={
                      adjustInflation && result.years[0]?.realBalance !== null
                        ? {
                            key: 'real',
                            label: "In today's money",
                            values: result.years.map((row) => row.realBalance ?? 0),
                          }
                        : undefined
                    }
                    formatValue={money}
                    formatAxis={compact}
                    xAxisLabel="Years from now"
                    height={280}
                  />
                </div>
              </Card>

              <Card flush>
                <div className="p-5 pb-3">
                  <CardHeader
                    title="Year by year"
                    description="The same figures as the chart, in full."
                  />
                </div>
                <div className="px-3 pb-3">
                  <DataTable
                    maxHeight="26rem"
                    caption="Contributions, interest and balance for each year"
                    rows={result.years}
                    rowKey={(row) => String(row.year)}
                    columns={[
                      { key: 'year', header: 'Year', render: (row) => row.year },
                      { key: 'contributed', header: 'Paid in', numeric: true, render: (row) => money(row.contributed) },
                      { key: 'interest', header: 'Interest', numeric: true, render: (row) => money(row.interest) },
                      {
                        key: 'balance',
                        header: 'Balance',
                        numeric: true,
                        render: (row) => <span className="font-semibold text-fg">{money(row.balance)}</span>,
                      },
                      ...(adjustInflation
                        ? [
                            {
                              key: 'real',
                              header: "Today's money",
                              numeric: true,
                              render: (row: (typeof result.years)[number]) =>
                                row.realBalance === null ? '—' : money(row.realBalance),
                            },
                          ]
                        : []),
                    ]}
                  />
                </div>
              </Card>
            </>
          )}
        </>
      }
      side={
        result === null ? (
          <Card>
            <p className="py-6 text-center text-[13px] text-fg-muted">Enter your plan to see the projection.</p>
          </Card>
        ) : (
          <>
            <Card>
              <Result
                label={`Balance after ${pluralize(years, 'year')}`}
                value={money(result.finalBalance)}
                hint={
                  result.realFinalBalance !== null
                    ? `About ${money(result.realFinalBalance)} in today's money.`
                    : undefined
                }
              />

              <div className="mt-4 grid gap-2.5">
                <Stat label="You paid in" value={money(result.totalContributed)} />
                <Stat
                  label="Interest earned"
                  value={money(result.totalInterest)}
                  hint={`${formatNumber((result.totalInterest / result.finalBalance) * 100, 1)}% of the final balance`}
                />
                <Stat
                  label="Growth multiple"
                  value={`${formatNumber(result.finalBalance / Math.max(1, result.totalContributed), 2)}×`}
                  hint="final balance ÷ what you paid in"
                />
              </div>
            </Card>

            <Card>
              <CardHeader title="Contributions vs growth" />
              <div className="mt-3">
                <div className="flex h-8 overflow-hidden rounded-lg">
                  <div
                    className="grid place-items-center text-[10px] font-bold text-white"
                    style={{
                      width: `${(result.totalContributed / result.finalBalance) * 100}%`,
                      background: 'var(--series-1)',
                    }}
                  >
                    {formatNumber((result.totalContributed / result.finalBalance) * 100, 0)}%
                  </div>
                  <div
                    className="grid place-items-center text-[10px] font-bold text-white"
                    style={{
                      width: `${(result.totalInterest / result.finalBalance) * 100}%`,
                      background: 'var(--series-2)',
                    }}
                  >
                    {formatNumber((result.totalInterest / result.finalBalance) * 100, 0)}%
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5">
                  <li className="flex items-center gap-2 text-[12px] text-fg-muted">
                    <span className="size-2.5 rounded-[3px]" style={{ background: 'var(--series-1)' }} />
                    What you paid in
                  </li>
                  <li className="flex items-center gap-2 text-[12px] text-fg-muted">
                    <span className="size-2.5 rounded-[3px]" style={{ background: 'var(--series-2)' }} />
                    Interest earned
                  </li>
                </ul>
              </div>
            </Card>

            <Callout tone="info">
              This is arithmetic on the assumptions you entered, not a forecast. Real returns vary year to year,
              and a steady average hides sequences that matter a great deal if you need the money at a fixed time.
            </Callout>
          </>
        )
      }
    />
  );
}
