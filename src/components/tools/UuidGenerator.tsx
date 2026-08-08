'use client';

import { Download, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Segmented, Slider, Switch } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { downloadText, pluralize } from '@/lib/utils';

type Version = 'v4' | 'v7';
type Wrap = 'none' | 'quotes' | 'braces' | 'sql';

/** Format 16 random bytes as the canonical 8-4-4-4-12 hyphenated form. */
function formatUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * UUID v4 — 122 bits from the platform CSPRNG.
 *
 * Built from getRandomValues rather than crypto.randomUUID so both versions go
 * through the same code path; randomUUID also requires a secure context, which
 * getRandomValues does not.
 */
function uuidV4(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  // Version 4 in the high nibble of byte 6, RFC 4122 variant in byte 8.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  return formatUuid(bytes);
}

/**
 * UUID v7: a 48-bit big-endian millisecond timestamp, then version/variant bits,
 * then random. Because the timestamp leads, these sort chronologically as
 * strings — which is why they make better database keys than v4.
 */
function uuidV7(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const timestamp = BigInt(Date.now());

  for (let i = 0; i < 6; i += 1) {
    // Most significant byte first.
    bytes[i] = Number((timestamp >> BigInt(8 * (5 - i))) & 0xffn);
  }

  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  return formatUuid(bytes);
}

function applyFormat(uuid: string, options: { uppercase: boolean; hyphens: boolean; wrap: Wrap }): string {
  let value = options.hyphens ? uuid : uuid.replace(/-/g, '');
  if (options.uppercase) value = value.toUpperCase();

  switch (options.wrap) {
    case 'quotes':
      return `"${value}"`;
    case 'braces':
      return `{${value}}`;
    case 'sql':
      return `'${value}'`;
    default:
      return value;
  }
}

const WRAP_OPTIONS = [
  { value: 'none', label: 'Plain' },
  { value: 'quotes', label: 'Double quotes' },
  { value: 'sql', label: 'Single quotes' },
  { value: 'braces', label: 'Braces {…}' },
];

export function UuidGenerator() {
  const [version, setVersion] = useState<Version>('v4');
  const [count, setCount] = useState(10);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [wrap, setWrap] = useState<Wrap>('none');
  const [uuids, setUuids] = useState<string[]>([]);

  const generate = useCallback(() => {
    const generator = version === 'v4' ? uuidV4 : uuidV7;
    setUuids(Array.from({ length: count }, generator));
  }, [version, count]);

  // Generate on mount and whenever version or count changes. Not during render:
  // random output would differ between the prerender and the client.
  useEffect(() => {
    generate();
  }, [generate]);

  const formatted = uuids.map((uuid) => applyFormat(uuid, { uppercase, hyphens, wrap }));
  const joined = formatted.join('\n');

  return (
    <ToolColumns
      main={
        <Card flush>
          <div className="border-b border-border px-5 py-3.5">
            <CardHeader
              title={pluralize(uuids.length, 'identifier')}
              actions={
                <>
                  <Button size="sm" variant="primary" leadingIcon={<RefreshCw />} onClick={generate}>
                    Regenerate
                  </Button>
                  <CopyButton value={joined} label="Copy all" />
                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={<Download />}
                    onClick={() => downloadText(joined, `uuid-${version}.txt`)}
                    aria-label="Download as text file"
                  />
                </>
              }
            />
          </div>

          <ul className="max-h-[30rem] divide-y divide-border overflow-y-auto">
            {formatted.map((value, index) => (
              <li key={`${value}-${index}`} className="group flex items-center gap-3 px-5 py-2">
                <span className="tabular w-8 shrink-0 text-right text-[11px] text-fg-subtle">{index + 1}</span>
                <code className="min-w-0 flex-1 break-all font-mono text-[12px] text-fg">{value}</code>
                <CopyButton
                  value={value}
                  ariaLabel={`Copy identifier ${index + 1}`}
                  size="sm"
                  className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                />
              </li>
            ))}
          </ul>
        </Card>
      }
      side={
        <>
          <Card>
            <CardHeader title="Options" />

            <div className="mt-4 space-y-4">
              <Field label="Version">
                <Segmented
                  value={version}
                  onChange={setVersion}
                  ariaLabel="UUID version"
                  fullWidth
                  options={[
                    { value: 'v4', label: 'v4 random' },
                    { value: 'v7', label: 'v7 sortable' },
                  ]}
                />
              </Field>

              <Slider
                label="How many"
                value={count}
                onChange={setCount}
                min={1}
                max={1000}
                step={1}
                formatValue={(value) => String(value)}
              />

              <Field label="Wrapping">
                <Select
                  options={WRAP_OPTIONS}
                  value={wrap}
                  onChange={(event) => setWrap(event.currentTarget.value as Wrap)}
                />
              </Field>

              <div className="space-y-3 border-t border-border pt-4">
                <Switch checked={uppercase} onChange={setUppercase} label="Uppercase" />
                <Switch
                  checked={hyphens}
                  onChange={setHyphens}
                  label="Keep hyphens"
                  description="Off gives the 32-character compact form."
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={version === 'v4' ? 'About v4' : 'About v7'} />
            <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">
              {version === 'v4'
                ? 'Version 4 is 122 bits of cryptographic randomness. Collisions are not a practical concern, but the values have no order, so using them as a primary key scatters writes across a B-tree index.'
                : 'Version 7 puts a millisecond timestamp in the leading 48 bits, so identifiers generated later sort later as plain strings. That keeps database inserts sequential. The trade-off is that each value reveals roughly when it was created.'}
            </p>
          </Card>

          <Callout tone="info">
            Generated locally with your device&apos;s cryptographic random source. Nothing is requested from a
            server, so these are safe to use as real identifiers.
          </Callout>
        </>
      }
    />
  );
}
