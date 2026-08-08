'use client';

import { Landmark } from 'lucide-react';
import { useMemo, useState } from 'react';

import { StackedBarChart } from '@/components/charts/Charts';
import { ToolColumns } from '@/components/ToolShell';
import { Card, CardHeader, Result, Stat } from '@/components/ui/Card';
import { Segmented, Slider } from '@/components/ui/Controls';
import { DataTable } from '@/components/ui/DataTable';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { calculateLoan, yearlyTotals } from '@/lib/finance';
import { CURRENCIES } from '@/lib/rates';
import { useLocalStorage } from '@/lib/storage';
import { formatCurrency, formatNumber, parseNumber, pluralize } from '@/lib/utils';

type ScheduleView = 'yearly' | 'monthly';

export function LoanCalculator() {
  const [amount, setAmount] = useState('250000');
  const [rate, setRate] = useState('6.5');
  const [years, setYears] = useState(30);
  const [extra, setExtra] = useState('0');
  const [view, setView] = useState<ScheduleView>('yearly');
  const [currency, setCurrency] = useLocalStorage<string>('loan:currency', 'USD');

  const money = (value: number) => formatCurrency(value, currency);
  const compact = (value: number) =>
    // Axis labels need to stay short; a full currency string would collide.
    value >= 1_000_000
      ? `${formatNumber(value / 1_000_000, 1)}M`
      : value >= 1000
        ? `${formatNumber(value / 1000, 0)}k`
        : formatNumber(value, 0);

  const result = useMemo(() => {
    const principal = parseNumber(amount);
    const annualRate = parseNumber(rate);
    if (principal === null || annualRate === null) return null;
    return calculateLoan({
      principal,
      annualRatePercent: annualRate,
      years,
      extraMonthly: parseNumber(extra) ?? 0,
    });
  }, [amount, rate, years, extra]);

  const yearly = useMemo(() => (result ? yearlyTotals(result.schedule) : []), [result]);

  const extraValue = parseNumber(extra) ?? 0;

  return (
    <ToolColumns
      main={
        <>
          <Card>
            <CardHeader title="The loan" icon={<Landmark />} />

            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
                <Field label="Loan amount">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.currentTarget.value)}
                    inputSize="lg"
                  />
                </Field>
                <Field label="Currency">
                  <Select
                    options={CURRENCIES.map((item) => ({ value: item.code, label: item.code }))}
                    value={currency}
                    onChange={(event) => setCurrency(event.currentTarget.value)}
                    selectSize="lg"
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Annual interest rate">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={rate}
                    onChange={(event) => setRate(event.currentTarget.value)}
                    suffix="%"
                  />
                </Field>
                <Field label="Extra monthly payment (optional)">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={extra}
                    onChange={(event) => setExtra(event.currentTarget.value)}
                  />
                </Field>
              </div>

              <Slider
                label="Term"
                value={years}
                onChange={setYears}
                min={1}
                max={40}
                formatValue={(value) => pluralize(value, 'year')}
              />
            </div>
          </Card>

          {result === null ? (
            <Callout tone="warning">
              Enter an amount, a rate and a term. If the required payment would not cover the monthly interest,
              the loan can never be repaid and no schedule is possible.
            </Callout>
          ) : (
            <>
              <Card>
                <CardHeader
                  title="Principal and interest over time"
                  description="Each column is one year of payments. Early years are mostly interest; the balance shifts as the principal falls."
                />
                <div className="mt-4">
                  <StackedBarChart
                    ariaLabel={`Yearly principal and interest over ${yearly.length} years`}
                    labels={yearly.map((row) => `Y${row.year}`)}
                    series={[
                      { key: 'principal', label: 'Principal', values: yearly.map((row) => row.principal) },
                      { key: 'interest', label: 'Interest', values: yearly.map((row) => row.interest) },
                    ]}
                    formatValue={money}
                    formatAxis={compact}
                  />
                </div>
              </Card>

              <Card flush>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                  <CardHeader title="Amortization schedule" />
                  <Segmented
                    value={view}
                    onChange={setView}
                    ariaLabel="Schedule detail"
                    size="sm"
                    options={[
                      { value: 'yearly', label: 'By year' },
                      { value: 'monthly', label: 'Every payment' },
                    ]}
                  />
                </div>

                <div className="px-3 pb-3 pt-3">
                  {view === 'yearly' ? (
                    <DataTable
                      maxHeight="26rem"
                      caption="Principal, interest and remaining balance for each year"
                      rows={yearly}
                      rowKey={(row) => String(row.year)}
                      columns={[
                        { key: 'year', header: 'Year', render: (row) => row.year },
                        { key: 'principal', header: 'Principal', numeric: true, render: (row) => money(row.principal) },
                        { key: 'interest', header: 'Interest', numeric: true, render: (row) => money(row.interest) },
                        {
                          key: 'balance',
                          header: 'Balance left',
                          numeric: true,
                          render: (row) => (
                            <span className="font-semibold text-fg">{money(row.balance)}</span>
                          ),
                        },
                      ]}
                    />
                  ) : (
                    <DataTable
                      maxHeight="26rem"
                      caption="Every scheduled payment, split into interest and principal"
                      rows={result.schedule}
                      rowKey={(row) => String(row.period)}
                      columns={[
                        { key: 'period', header: '#', render: (row) => row.period },
                        { key: 'payment', header: 'Payment', numeric: true, render: (row) => money(row.payment) },
                        { key: 'interest', header: 'Interest', numeric: true, render: (row) => money(row.interest) },
                        { key: 'principal', header: 'Principal', numeric: true, render: (row) => money(row.principal) },
                        {
                          key: 'balance',
                          header: 'Balance',
                          numeric: true,
                          render: (row) => (
                            <span className="font-semibold text-fg">{money(row.balance)}</span>
                          ),
                        },
                      ]}
                    />
                  )}
                </div>
              </Card>
            </>
          )}
        </>
      }
      side={
        result === null ? (
          <Card>
            <p className="py-6 text-center text-[13px] text-fg-muted">
              Fill in the loan details to see the payment.
            </p>
          </Card>
        ) : (
          <>
            <Card>
              <Result
                label="Monthly payment"
                value={money(result.monthlyPayment)}
                hint={
                  extraValue > 0
                    ? `Plus your ${money(extraValue)} extra — ${money(result.monthlyPayment + extraValue)} in total.`
                    : undefined
                }
              />

              <div className="mt-4 grid gap-2.5">
                <Stat label="Total interest" value={money(result.totalInterest)} />
                <Stat
                  label="Total repaid"
                  value={money(result.totalPaid)}
                  hint={`Interest adds ${formatNumber((result.totalInterest / (parseNumber(amount) ?? 1)) * 100, 1)}% on top of the amount borrowed`}
                />
                <Stat
                  label="Paid off in"
                  value={`${Math.floor(result.months / 12)}y ${result.months % 12}m`}
                  hint={`${formatNumber(result.months, 0)} payments`}
                />
              </div>
            </Card>

            {result.extraSavings && result.extraSavings.months > 0 && (
              <Callout tone="success" title="Your extra payment pays off">
                Paying {money(extraValue)} more each month clears the loan{' '}
                <strong>
                  {Math.floor(result.extraSavings.months / 12) > 0
                    ? `${Math.floor(result.extraSavings.months / 12)} years ${result.extraSavings.months % 12} months`
                    : pluralize(result.extraSavings.months, 'month')}
                </strong>{' '}
                sooner and saves <strong>{money(result.extraSavings.interest)}</strong> in interest.
              </Callout>
            )}

            <Card>
              <CardHeader title="Where the money goes" />
              <div className="mt-3">
                {/* A single proportion is clearer as one labelled bar than as a
                    pie chart — the two shares are directly comparable. */}
                <div className="flex h-8 overflow-hidden rounded-lg">
                  <div
                    className="grid place-items-center text-[10px] font-bold text-white"
                    style={{
                      width: `${(1 - result.totalInterest / result.totalPaid) * 100}%`,
                      background: 'var(--series-1)',
                    }}
                  >
                    {formatNumber((1 - result.totalInterest / result.totalPaid) * 100, 0)}%
                  </div>
                  <div
                    className="grid place-items-center text-[10px] font-bold text-white"
                    style={{
                      width: `${(result.totalInterest / result.totalPaid) * 100}%`,
                      background: 'var(--series-2)',
                    }}
                  >
                    {formatNumber((result.totalInterest / result.totalPaid) * 100, 0)}%
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5">
                  <li className="flex items-center gap-2 text-[12px] text-fg-muted">
                    <span className="size-2.5 rounded-[3px]" style={{ background: 'var(--series-1)' }} />
                    Principal — {money(result.totalPaid - result.totalInterest)}
                  </li>
                  <li className="flex items-center gap-2 text-[12px] text-fg-muted">
                    <span className="size-2.5 rounded-[3px]" style={{ background: 'var(--series-2)' }} />
                    Interest — {money(result.totalInterest)}
                  </li>
                </ul>
              </div>
            </Card>
          </>
        )
      }
    />
  );
}
