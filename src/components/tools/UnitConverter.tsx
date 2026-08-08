'use client';

import { ArrowLeftRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { CopyButton } from '@/components/ui/CopyButton';
import { DataTable } from '@/components/ui/DataTable';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useLocalStorage } from '@/lib/storage';
import {
  ALL_CATEGORY_OPTIONS,
  TEMPERATURE_CATEGORY_ID,
  TEMPERATURE_UNITS,
  TOTAL_UNIT_COUNT,
  convertTemperature,
  convertUnit,
  getUnitCategory,
} from '@/lib/units';
import { cn, formatForInput, formatSmart, parseNumber } from '@/lib/utils';

/**
 * Bidirectional unit conversion.
 *
 * The value being edited is tracked (`editing`) so the other field is the one
 * that gets recomputed. Without that, converting in both directions fights
 * itself: each field's onChange would overwrite the field the user is typing in.
 */

interface UnitOption {
  id: string;
  name: string;
  symbol: string;
}

function unitsFor(categoryId: string): UnitOption[] {
  if (categoryId === TEMPERATURE_CATEGORY_ID) {
    return TEMPERATURE_UNITS.map(({ id, name, symbol }) => ({ id, name, symbol }));
  }
  return (getUnitCategory(categoryId)?.units ?? []).map(({ id, name, symbol }) => ({ id, name, symbol }));
}

function convert(categoryId: string, value: number, fromId: string, toId: string): number | null {
  if (categoryId === TEMPERATURE_CATEGORY_ID) {
    const from = TEMPERATURE_UNITS.find((unit) => unit.id === fromId);
    const to = TEMPERATURE_UNITS.find((unit) => unit.id === toId);
    return from && to ? convertTemperature(value, from, to) : null;
  }

  const category = getUnitCategory(categoryId);
  const from = category?.units.find((unit) => unit.id === fromId);
  const to = category?.units.find((unit) => unit.id === toId);
  return from && to ? convertUnit(value, from, to) : null;
}

export function UnitConverter() {
  const [categoryId, setCategoryId] = useLocalStorage<string>('units:category', 'length');
  const [fromId, setFromId] = useState('m');
  const [toId, setToId] = useState('ft');
  const [fromText, setFromText] = useState('1');
  const [toText, setToText] = useState('');
  const [editing, setEditing] = useState<'from' | 'to'>('from');

  const units = useMemo(() => unitsFor(categoryId), [categoryId]);

  // Switching category invalidates the selected units, so reset to that
  // category's first two.
  useEffect(() => {
    const list = unitsFor(categoryId);
    const first = list[0]?.id;
    const second = list[1]?.id ?? first;
    if (!first || !second) return;
    if (!list.some((unit) => unit.id === fromId) || !list.some((unit) => unit.id === toId)) {
      setFromId(first);
      setToId(second);
      setEditing('from');
    }
    // Only the category drives this reset; unit ids are read, not depended on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  // Recompute whichever field the user is not currently typing in.
  useEffect(() => {
    if (editing === 'from') {
      const value = parseNumber(fromText);
      if (value === null) {
        setToText('');
        return;
      }
      const converted = convert(categoryId, value, fromId, toId);
      setToText(converted === null ? '' : formatForInput(converted, 10));
    } else {
      const value = parseNumber(toText);
      if (value === null) {
        setFromText('');
        return;
      }
      const converted = convert(categoryId, value, toId, fromId);
      setFromText(converted === null ? '' : formatForInput(converted, 10));
    }
  }, [fromText, toText, fromId, toId, categoryId, editing]);

  const swap = () => {
    setFromId(toId);
    setToId(fromId);
    setFromText(toText);
    setEditing('from');
  };

  const unitOptions = units.map((unit) => ({ value: unit.id, label: `${unit.name} (${unit.symbol})` }));
  const fromUnit = units.find((unit) => unit.id === fromId);
  const toUnit = units.find((unit) => unit.id === toId);

  // Reference table: the entered value in every other unit of this category.
  const referenceRows = useMemo(() => {
    const value = parseNumber(fromText);
    if (value === null || !fromUnit) return [];
    return units
      .filter((unit) => unit.id !== fromId)
      .map((unit) => ({
        unit,
        value: convert(categoryId, value, fromId, unit.id),
      }))
      .filter((row): row is { unit: UnitOption; value: number } => row.value !== null);
  }, [fromText, fromId, units, categoryId, fromUnit]);

  return (
    <ToolColumns
      main={
        <Card>
          <CardHeader
            title="Convert"
            description={`${TOTAL_UNIT_COUNT} units across ${ALL_CATEGORY_OPTIONS.length} categories.`}
          />

          <Field label="Category" className="mt-4">
            <Select
              options={ALL_CATEGORY_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
              value={categoryId}
              onChange={(event) => setCategoryId(event.currentTarget.value)}
            />
          </Field>

          <div className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-2.5">
              <Field label="From">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={fromText}
                  onChange={(event) => {
                    setEditing('from');
                    setFromText(event.currentTarget.value);
                  }}
                  placeholder="0"
                  inputSize="lg"
                  mono
                />
              </Field>
              <Select
                options={unitOptions}
                value={fromId}
                onChange={(event) => {
                  setEditing('from');
                  setFromId(event.currentTarget.value);
                }}
                aria-label="Convert from unit"
              />
            </div>

            <Button
              variant="soft"
              size="icon"
              onClick={swap}
              aria-label="Swap units"
              className="mb-[3.25rem] justify-self-center sm:mb-0 sm:self-end"
            >
              <ArrowLeftRight className="size-4" />
            </Button>

            <div className="space-y-2.5">
              <Field
                label="To"
                labelAction={
                  toText !== '' ? <CopyButton value={toText} ariaLabel="Copy converted value" size="sm" /> : undefined
                }
              >
                <Input
                  type="number"
                  inputMode="decimal"
                  value={toText}
                  onChange={(event) => {
                    setEditing('to');
                    setToText(event.currentTarget.value);
                  }}
                  placeholder="0"
                  inputSize="lg"
                  mono
                  className="border-accent/40 bg-accent-soft/40"
                />
              </Field>
              <Select
                options={unitOptions}
                value={toId}
                onChange={(event) => {
                  setEditing('from');
                  setToId(event.currentTarget.value);
                }}
                aria-label="Convert to unit"
              />
            </div>
          </div>

          {fromUnit && toUnit && fromText !== '' && toText !== '' && (
            <p className="mt-4 rounded-xl border border-accent/25 bg-accent-soft px-4 py-3 text-center text-[15px] font-semibold text-accent-text">
              {fromText} {fromUnit.symbol} = {toText} {toUnit.symbol}
            </p>
          )}
        </Card>
      }
      side={
        <Card flush>
          <div className="p-5 pb-3">
            <CardHeader
              title="Same value, every unit"
              description={
                fromUnit ? `${fromText || '0'} ${fromUnit.symbol} expressed in each other unit.` : undefined
              }
            />
          </div>
          <div className="px-3 pb-3">
            <DataTable
              maxHeight="24rem"
              rows={referenceRows}
              rowKey={(row) => row.unit.id}
              emptyMessage="Enter a value to fill this table."
              columns={[
                {
                  key: 'unit',
                  header: 'Unit',
                  render: (row) => (
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-fg">{row.unit.name}</span>
                      <span className="text-[11px] text-fg-subtle">{row.unit.symbol}</span>
                    </span>
                  ),
                },
                {
                  key: 'value',
                  header: 'Value',
                  numeric: true,
                  render: (row) => (
                    <span className={cn('font-mono', row.unit.id === toId && 'font-bold text-accent-text')}>
                      {formatSmart(row.value, 8)}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      }
    />
  );
}
