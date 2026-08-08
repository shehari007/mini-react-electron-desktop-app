'use client';

import { useMemo, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { Stepper } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

/**
 * Base conversion built on BigInt.
 *
 * Number would silently lose precision above 2^53, which is exactly the range
 * where people are converting hex — a 64-bit hash or an address. BigInt means a
 * 16-digit hex value round-trips exactly.
 */

interface BaseField {
  base: number;
  label: string;
  hint: string;
}

const FIXED_BASES: BaseField[] = [
  { base: 2, label: 'Binary', hint: 'base 2' },
  { base: 8, label: 'Octal', hint: 'base 8' },
  { base: 10, label: 'Decimal', hint: 'base 10' },
  { base: 16, label: 'Hexadecimal', hint: 'base 16' },
];

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

function parseInBase(input: string, base: number): { value: bigint; negative: boolean } | { error: string } {
  const trimmed = input.trim().toLowerCase().replace(/[\s_]/g, '');
  if (trimmed === '') return { error: 'empty' };

  const negative = trimmed.startsWith('-');
  // Tolerate the conventional prefixes people paste in.
  let body = negative ? trimmed.slice(1) : trimmed;
  if (base === 16 && body.startsWith('0x')) body = body.slice(2);
  else if (base === 2 && body.startsWith('0b')) body = body.slice(2);
  else if (base === 8 && body.startsWith('0o')) body = body.slice(2);

  if (body === '') return { error: 'empty' };

  const allowed = DIGITS.slice(0, base);
  let value = 0n;
  const bigBase = BigInt(base);

  for (const char of body) {
    const digit = allowed.indexOf(char);
    if (digit < 0) {
      return {
        error: `"${char}" is not a valid digit in base ${base} (allowed: ${allowed.length <= 16 ? allowed : `0–${allowed[allowed.length - 1]}`}).`,
      };
    }
    value = value * bigBase + BigInt(digit);
  }

  return { value, negative };
}

function toBase(value: bigint, negative: boolean, base: number): string {
  const digits = value.toString(base);
  return negative && value !== 0n ? `-${digits}` : digits;
}

export function NumberBaseConverter() {
  const [source, setSource] = useState({ base: 10, text: '255' });
  const [customBase, setCustomBase] = useState(36);

  const parsed = useMemo(() => parseInBase(source.text, source.base), [source]);
  const hasError = 'error' in parsed && parsed.error !== 'empty';
  const isEmpty = 'error' in parsed && parsed.error === 'empty';

  const valueFor = (base: number): string => {
    if ('error' in parsed) return '';
    return toBase(parsed.value, parsed.negative, base);
  };

  // Bit inspector: the binary form padded to whole bytes, grouped in eights.
  const bytes = useMemo(() => {
    if ('error' in parsed) return null;
    const binary = parsed.value.toString(2);
    const padded = binary.padStart(Math.max(8, Math.ceil(binary.length / 8) * 8), '0');
    const groups: string[] = [];
    for (let i = 0; i < padded.length; i += 8) groups.push(padded.slice(i, i + 8));
    return { groups, bitLength: binary === '0' ? 0 : binary.length };
  }, [parsed]);

  return (
    <ToolColumns
      main={
        <Card>
          <CardHeader title="Any base to any base" description="Type in any field — the rest follow." />

          {hasError && (
            <Callout tone="danger" className="mt-4">
              {(parsed as { error: string }).error}
            </Callout>
          )}

          <div className="mt-4 space-y-3">
            {FIXED_BASES.map((field) => {
              const isSource = source.base === field.base;
              const value = isSource ? source.text : valueFor(field.base);

              return (
                <Field
                  key={field.base}
                  label={
                    <span className="flex items-center gap-2">
                      {field.label}
                      <span className="font-normal text-fg-subtle">{field.hint}</span>
                    </span>
                  }
                  labelAction={
                    value !== '' ? (
                      <CopyButton value={value} ariaLabel={`Copy ${field.label} value`} size="sm" />
                    ) : undefined
                  }
                >
                  <Input
                    value={value}
                    onChange={(event) => setSource({ base: field.base, text: event.currentTarget.value })}
                    placeholder={isEmpty ? '0' : ''}
                    mono
                    inputSize="lg"
                    autoComplete="off"
                    spellCheck={false}
                    className={cn(isSource && 'border-accent/50 bg-accent-soft/30')}
                  />
                </Field>
              );
            })}

            <div className="rounded-xl border border-border bg-bg-subtle p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <Field label="Custom base">
                  <Stepper
                    value={customBase}
                    onChange={setCustomBase}
                    min={2}
                    max={36}
                    ariaLabel="custom base"
                  />
                </Field>
                <Field
                  label={`Value in base ${customBase}`}
                  className="min-w-48 flex-1"
                  labelAction={
                    valueFor(customBase) !== '' ? (
                      <CopyButton value={valueFor(customBase)} ariaLabel="Copy custom base value" size="sm" />
                    ) : undefined
                  }
                >
                  <Input
                    value={source.base === customBase ? source.text : valueFor(customBase)}
                    onChange={(event) => setSource({ base: customBase, text: event.currentTarget.value })}
                    mono
                    placeholder="0"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </Field>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[12px] leading-relaxed text-fg-subtle">
            Prefixes are accepted and stripped automatically — <code className="font-mono">0x1f</code>,{' '}
            <code className="font-mono">0b1011</code> and <code className="font-mono">0o17</code> all work.
            Underscores and spaces are ignored, so grouped values paste cleanly.
          </p>
        </Card>
      }
      side={
        <Card>
          <CardHeader title="Bit inspector" description="Binary laid out in bytes, most significant first." />

          {bytes === null ? (
            <p className="mt-4 text-[13px] text-fg-muted">Enter a valid number to inspect its bits.</p>
          ) : (
            <>
              <div className="mt-4 space-y-2">
                {bytes.groups.map((group, groupIndex) => {
                  // Bit position of this byte's most significant bit.
                  const highBit = (bytes.groups.length - groupIndex) * 8 - 1;
                  return (
                    <div key={groupIndex} className="flex items-center gap-2">
                      <span className="w-10 shrink-0 text-right font-mono text-[10px] text-fg-subtle">
                        {highBit}–{highBit - 7}
                      </span>
                      <div className="flex gap-1">
                        {group.split('').map((bit, bitIndex) => (
                          <span
                            key={bitIndex}
                            className={cn(
                              'grid size-6 place-items-center rounded font-mono text-[11px] font-semibold',
                              bit === '1'
                                ? 'bg-accent text-accent-fg'
                                : 'bg-bg-subtle text-fg-subtle',
                            )}
                          >
                            {bit}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <dl className="mt-4 space-y-1.5 border-t border-border pt-3 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-muted">Bits needed</dt>
                  <dd className="tabular font-semibold text-fg">{bytes.bitLength}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-muted">Bytes shown</dt>
                  <dd className="tabular font-semibold text-fg">{bytes.groups.length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-muted">Fits in</dt>
                  <dd className="font-semibold text-fg">
                    {bytes.bitLength <= 8
                      ? '8-bit'
                      : bytes.bitLength <= 16
                        ? '16-bit'
                        : bytes.bitLength <= 32
                          ? '32-bit'
                          : bytes.bitLength <= 64
                            ? '64-bit'
                            : 'more than 64-bit'}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </Card>
      }
    />
  );
}
