'use client';

import { Users } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Card, CardHeader, Result, Stat } from '@/components/ui/Card';
import { Segmented, Stepper, Switch } from '@/components/ui/Controls';
import { DetailList } from '@/components/ui/DataTable';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { CURRENCIES } from '@/lib/rates';
import { Select } from '@/components/ui/Select';
import { useLocalStorage } from '@/lib/storage';
import { cn, formatCurrency, parseNumber } from '@/lib/utils';

const TIP_PRESETS = [0, 10, 12.5, 15, 18, 20, 25] as const;

type TipMode = 'percent' | 'amount';
type Rounding = 'none' | 'up' | 'nearest';

export function TipCalculator() {
  const [bill, setBill] = useState('');
  const [tipMode, setTipMode] = useState<TipMode>('percent');
  const [tipPercent, setTipPercent] = useState(15);
  const [tipAmount, setTipAmount] = useState('');
  const [people, setPeople] = useState(2);
  const [rounding, setRounding] = useState<Rounding>('none');
  const [tipOnPreTax, setTipOnPreTax] = useState(false);
  const [taxPercent, setTaxPercent] = useState('');
  const [currency, setCurrency] = useLocalStorage<string>('tip:currency', 'USD');

  const money = (value: number) => formatCurrency(value, currency);

  const calc = useMemo(() => {
    const billValue = parseNumber(bill);
    if (billValue === null || billValue < 0) return null;

    const tax = parseNumber(taxPercent) ?? 0;

    // When tipping on the pre-tax subtotal, back the tax out of the entered
    // total first — that's the convention in the US, where the bill shown
    // already includes sales tax.
    const tipBase = tipOnPreTax && tax > 0 ? billValue / (1 + tax / 100) : billValue;

    const tip =
      tipMode === 'percent' ? (tipBase * tipPercent) / 100 : Math.max(0, parseNumber(tipAmount) ?? 0);

    const total = billValue + tip;
    const rawPerPerson = people > 0 ? total / people : total;

    let perPerson = rawPerPerson;
    if (rounding === 'up') perPerson = Math.ceil(rawPerPerson);
    else if (rounding === 'nearest') perPerson = Math.round(rawPerPerson);

    const roundedTotal = perPerson * people;

    return {
      bill: billValue,
      tipBase,
      tip,
      total,
      perPerson,
      rawPerPerson,
      roundedTotal,
      // Positive when rounding collected extra, negative when it left a shortfall.
      roundingDelta: roundedTotal - total,
      effectiveTipPercent: tipBase > 0 ? (tip / tipBase) * 100 : 0,
    };
  }, [bill, taxPercent, tipOnPreTax, tipMode, tipPercent, tipAmount, people, rounding]);

  const currencyOptions = CURRENCIES.map((item) => ({
    value: item.code,
    label: `${item.code} — ${item.name}`,
  }));

  return (
    <ToolColumns
      main={
        <Card>
          <CardHeader title="The bill" icon={<Users />} />

          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
              <Field label="Bill total">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={bill}
                  onChange={(event) => setBill(event.currentTarget.value)}
                  placeholder="84.50"
                  inputSize="lg"
                  autoFocus
                />
              </Field>
              <Field label="Currency">
                <Select
                  options={currencyOptions}
                  value={currency}
                  onChange={(event) => setCurrency(event.currentTarget.value)}
                  selectSize="lg"
                />
              </Field>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[13px] font-medium text-fg">Tip</span>
                <Segmented
                  value={tipMode}
                  onChange={setTipMode}
                  ariaLabel="Tip entry mode"
                  options={[
                    { value: 'percent', label: 'Percent' },
                    { value: 'amount', label: 'Exact amount' },
                  ]}
                  size="sm"
                />
              </div>

              {tipMode === 'percent' ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {TIP_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTipPercent(preset)}
                        aria-pressed={tipPercent === preset}
                        className={cn(
                          'h-9 rounded-xl border px-3.5 text-[13px] font-semibold transition-colors',
                          tipPercent === preset
                            ? 'border-accent bg-accent text-accent-fg'
                            : 'border-border bg-card text-fg-muted hover:border-border-strong hover:text-fg',
                        )}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                  <Field label="Or a custom percentage" className="mt-3">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={String(tipPercent)}
                      onChange={(event) => setTipPercent(Math.max(0, Number(event.currentTarget.value) || 0))}
                      suffix="%"
                    />
                  </Field>
                </>
              ) : (
                <Field label="Tip amount">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={tipAmount}
                    onChange={(event) => setTipAmount(event.currentTarget.value)}
                    placeholder="12.00"
                  />
                </Field>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <Field label="Split between">
                <Stepper value={people} onChange={setPeople} min={1} max={100} ariaLabel="number of people" />
              </Field>

              <Field label="Round each share" className="min-w-52 flex-1">
                <Segmented
                  value={rounding}
                  onChange={setRounding}
                  ariaLabel="Rounding"
                  fullWidth
                  options={[
                    { value: 'none', label: 'Exact' },
                    { value: 'nearest', label: 'Nearest' },
                    { value: 'up', label: 'Round up' },
                  ]}
                  size="sm"
                />
              </Field>
            </div>

            <div className="rounded-xl border border-border bg-bg-subtle p-4">
              <Switch
                checked={tipOnPreTax}
                onChange={setTipOnPreTax}
                label="Tip on the pre-tax subtotal"
                description="Backs the tax out of the bill before working out the tip."
              />
              {tipOnPreTax && (
                <Field label="Tax already included in the bill" className="mt-3">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={taxPercent}
                    onChange={(event) => setTaxPercent(event.currentTarget.value)}
                    placeholder="8.5"
                    suffix="%"
                  />
                </Field>
              )}
            </div>
          </div>
        </Card>
      }
      side={
        <>
          <Card>
            {calc === null ? (
              <p className="py-6 text-center text-[13px] text-fg-muted">
                Enter the bill total to see the split.
              </p>
            ) : (
              <>
                <Result
                  label={people > 1 ? `Each of ${people} pays` : 'Total to pay'}
                  value={money(calc.perPerson)}
                  hint={
                    rounding !== 'none' && Math.abs(calc.roundingDelta) > 0.004
                      ? `Exact share is ${money(calc.rawPerPerson)} — rounding ${
                          calc.roundingDelta > 0 ? 'adds' : 'removes'
                        } ${money(Math.abs(calc.roundingDelta))} overall.`
                      : undefined
                  }
                />

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  <Stat label="Tip" value={money(calc.tip)} hint={`${calc.effectiveTipPercent.toFixed(1)}% of base`} />
                  <Stat label="Total" value={money(calc.total)} />
                </div>
              </>
            )}
          </Card>

          {calc !== null && (
            <Card>
              <CardHeader title="Breakdown" />
              <DetailList
                className="mt-3"
                items={[
                  { label: 'Bill as entered', value: money(calc.bill) },
                  ...(tipOnPreTax && calc.tipBase !== calc.bill
                    ? [{ label: 'Pre-tax subtotal', value: money(calc.tipBase) }]
                    : []),
                  { label: 'Tip', value: money(calc.tip) },
                  { label: 'Total with tip', value: money(calc.total) },
                  { label: 'People', value: String(people) },
                  { label: 'Per person', value: money(calc.perPerson) },
                  ...(rounding !== 'none'
                    ? [{ label: 'Collected in total', value: money(calc.roundedTotal) }]
                    : []),
                ]}
              />
            </Card>
          )}
        </>
      }
    />
  );
}
