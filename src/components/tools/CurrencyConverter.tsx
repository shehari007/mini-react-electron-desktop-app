'use client';

import { ArrowLeftRight, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, Result } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Callout, Skeleton } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useOnline } from '@/lib/hooks';
import {
  CURRENCIES,
  convertCurrency,
  fetchRates,
  getCurrency,
  isStale,
  pairRate,
  readCachedRates,
  type RateCache,
} from '@/lib/rates';
import { useLocalStorage } from '@/lib/storage';
import { formatCurrency, formatForInput, formatNumber, parseNumber, relativeTime } from '@/lib/utils';

// Typed as plain numbers rather than `as const`: the literal union would make
// the narrowing predicate below unassignable to its own parameter type.
const QUICK_AMOUNTS: readonly number[] = [1, 5, 10, 25, 50, 100, 500, 1000];

export function CurrencyConverter() {
  const online = useOnline();

  const [from, setFrom] = useLocalStorage<string>('currency:from', 'USD');
  const [to, setTo] = useLocalStorage<string>('currency:to', 'EUR');
  const [amountText, setAmountText] = useState('100');
  const [editing, setEditing] = useState<'from' | 'to'>('from');
  const [convertedText, setConvertedText] = useState('');

  const [cache, setCache] = useState<RateCache | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (options: { force?: boolean } = {}) => {
    // Show cached rates immediately; the network is only ever an upgrade.
    const cached = readCachedRates();
    if (cached) {
      setCache(cached);
      setLoading(false);
      if (!options.force && !isStale(cached)) return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    if (!cached) setLoading(true);

    try {
      setCache(await fetchRates(controller.signal));
    } catch (caught) {
      if (controller.signal.aborted) return;
      // With a cache in hand this is a soft failure — the tool still works.
      setError(
        cached
          ? 'Could not refresh rates just now, so these are the last ones saved on this device.'
          : caught instanceof Error
            ? caught.message
            : 'Could not load exchange rates.',
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  const rates = cache?.rates;

  // Recompute the field the user is not editing, same pattern as the unit
  // converter so both directions stay usable.
  useEffect(() => {
    if (!rates) return;

    if (editing === 'from') {
      const value = parseNumber(amountText);
      if (value === null) {
        setConvertedText('');
        return;
      }
      const result = convertCurrency(value, from, to, rates);
      setConvertedText(result === null ? '' : formatForInput(result, 10));
    } else {
      const value = parseNumber(convertedText);
      if (value === null) {
        setAmountText('');
        return;
      }
      const result = convertCurrency(value, to, from, rates);
      setAmountText(result === null ? '' : formatForInput(result, 10));
    }
  }, [amountText, convertedText, from, to, rates, editing]);

  const rate = rates ? pairRate(from, to, rates) : null;
  const inverseRate = rates ? pairRate(to, from, rates) : null;

  const options = useMemo(
    () => CURRENCIES.map((currency) => ({ value: currency.code, label: `${currency.code} — ${currency.name}` })),
    [],
  );

  const fromCurrency = getCurrency(from);
  const toCurrency = getCurrency(to);

  const quickRows = useMemo(() => {
    if (!rates) return [];
    return QUICK_AMOUNTS.map((amount) => ({
      amount,
      converted: convertCurrency(amount, from, to, rates),
    })).filter((row): row is { amount: number; converted: number } => row.converted !== null);
  }, [rates, from, to]);

  const swap = () => {
    setFrom(to);
    setTo(from);
    setAmountText(convertedText);
    setEditing('from');
  };

  return (
    <ToolColumns
      main={
        <Card>
          <CardHeader
            title="Convert"
            description="Live mid-market rates, no API key needed."
            actions={
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={<RefreshCw />}
                onClick={() => void load({ force: true })}
                loading={loading && cache !== null}
                disabled={!online}
              >
                Refresh
              </Button>
            }
          />

          {!online && (
            <Callout tone="warning" className="mt-4">
              You&apos;re offline. Conversions use the last rates saved on this device
              {cache ? ` (${relativeTime(cache.fetchedAt)})` : ''}.
            </Callout>
          )}
          {error && (
            <Callout tone={cache ? 'warning' : 'danger'} className="mt-4">
              {error}
            </Callout>
          )}

          {loading && !cache ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : (
            <div className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div className="space-y-2.5">
                <Field label="Amount">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={amountText}
                    onChange={(event) => {
                      setEditing('from');
                      setAmountText(event.currentTarget.value);
                    }}
                    prefix={fromCurrency?.symbol}
                    inputSize="lg"
                    mono
                  />
                </Field>
                <Select
                  options={options}
                  value={from}
                  onChange={(event) => {
                    setEditing('from');
                    setFrom(event.currentTarget.value);
                  }}
                  aria-label="Convert from currency"
                />
              </div>

              <Button
                variant="soft"
                size="icon"
                onClick={swap}
                aria-label="Swap currencies"
                className="mb-[3.25rem] justify-self-center sm:mb-0 sm:self-end"
              >
                <ArrowLeftRight className="size-4" />
              </Button>

              <div className="space-y-2.5">
                <Field label="Converts to">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={convertedText}
                    onChange={(event) => {
                      setEditing('to');
                      setConvertedText(event.currentTarget.value);
                    }}
                    prefix={toCurrency?.symbol}
                    inputSize="lg"
                    mono
                    className="border-accent/40 bg-accent-soft/40"
                  />
                </Field>
                <Select
                  options={options}
                  value={to}
                  onChange={(event) => {
                    setEditing('from');
                    setTo(event.currentTarget.value);
                  }}
                  aria-label="Convert to currency"
                />
              </div>
            </div>
          )}

          {rate !== null && inverseRate !== null && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <p className="rounded-xl border border-border bg-bg-subtle px-4 py-2.5 text-center text-[13px] text-fg-muted">
                1 {from} = <span className="tabular font-semibold text-fg">{formatNumber(rate, 6)}</span> {to}
              </p>
              <p className="rounded-xl border border-border bg-bg-subtle px-4 py-2.5 text-center text-[13px] text-fg-muted">
                1 {to} = <span className="tabular font-semibold text-fg">{formatNumber(inverseRate, 6)}</span> {from}
              </p>
            </div>
          )}

          {cache && (
            <p className="mt-3 text-center text-[11px] text-fg-subtle">
              Rates fetched {relativeTime(cache.fetchedAt)}
              {cache.providerUpdated ? ` · provider updated ${cache.providerUpdated}` : ''}
              {isStale(cache) ? ' · may be out of date' : ''}
            </p>
          )}
        </Card>
      }
      side={
        <>
          {rates && convertedText !== '' && toCurrency && (
            <Card>
              <Result
                label={`${fromCurrency?.code ?? from} → ${toCurrency.code}`}
                value={formatCurrency(Number(convertedText), toCurrency.code)}
                hint={
                  amountText !== ''
                    ? `From ${formatCurrency(Number(amountText), fromCurrency?.code ?? from)}`
                    : undefined
                }
              />
            </Card>
          )}

          <Card flush>
            <div className="p-5 pb-3">
              <CardHeader title="Common amounts" description={`${from} to ${to}`} />
            </div>
            <div className="px-3 pb-3">
              <DataTable
                rows={quickRows}
                rowKey={(row) => String(row.amount)}
                emptyMessage="Rates unavailable."
                columns={[
                  {
                    key: 'amount',
                    header: from,
                    numeric: true,
                    render: (row) => formatNumber(row.amount, 0),
                  },
                  {
                    key: 'converted',
                    header: to,
                    numeric: true,
                    render: (row) => (
                      <span className="font-semibold text-accent-text">{formatNumber(row.converted, 2)}</span>
                    ),
                  },
                ]}
              />
            </div>
          </Card>
        </>
      }
    />
  );
}
