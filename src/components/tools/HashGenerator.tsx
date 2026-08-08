'use client';

import { Check, FileUp, Fingerprint, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Card, CardHeader } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { Button } from '@/components/ui/Button';
import { Badge, Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input, Textarea } from '@/components/ui/Input';
import { HASH_ALGORITHMS, hashBytes, hashTextAll, hashesMatch, type HashAlgorithm } from '@/lib/hash';
import { useDebouncedValue } from '@/lib/hooks';
import { formatBytes } from '@/lib/utils';

type Source = 'text' | 'file';

const EMPTY_DIGESTS: Record<HashAlgorithm, string> = {
  MD5: '',
  'SHA-1': '',
  'SHA-256': '',
  'SHA-384': '',
  'SHA-512': '',
};

/** MD5 and SHA-1 are broken for anything security-related; the UI says so
 *  rather than presenting all five as equivalent choices. */
const WEAK: ReadonlySet<HashAlgorithm> = new Set(['MD5', 'SHA-1']);

export function HashGenerator() {
  const [source, setSource] = useState<Source>('text');
  const [text, setText] = useState('');
  const [digests, setDigests] = useState<Record<HashAlgorithm, string>>(EMPTY_DIGESTS);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [compareTo, setCompareTo] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const debouncedText = useDebouncedValue(text, 150);

  // Hash the text whenever it settles. Cancelled via a token because the async
  // digests can resolve out of order as the user keeps typing.
  useEffect(() => {
    if (source !== 'text') return;
    if (debouncedText === '') {
      setDigests(EMPTY_DIGESTS);
      return;
    }

    let cancelled = false;
    void hashTextAll(debouncedText).then((result) => {
      if (!cancelled) setDigests(result);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedText, source]);

  const handleFile = async (selected: File) => {
    setBusy(true);
    setSource('file');
    setFile({ name: selected.name, size: selected.size });

    try {
      const bytes = new Uint8Array(await selected.arrayBuffer());
      // Sequential rather than parallel: hashing a large file five times at once
      // pins the main thread far longer than doing them one after another.
      const entries: Array<[HashAlgorithm, string]> = [];
      for (const algorithm of HASH_ALGORITHMS) {
        entries.push([algorithm, await hashBytes(bytes, algorithm)]);
      }
      setDigests(Object.fromEntries(entries) as Record<HashAlgorithm, string>);
    } catch {
      setDigests(EMPTY_DIGESTS);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setText('');
    setFile(null);
    setDigests(EMPTY_DIGESTS);
    setCompareTo('');
  };

  const hasOutput = Object.values(digests).some((value) => value !== '');

  /** Which algorithm (if any) the pasted comparison hash matches. */
  const matchedAlgorithm = useMemo(() => {
    if (compareTo.trim() === '') return null;
    return HASH_ALGORITHMS.find((algorithm) => hashesMatch(digests[algorithm], compareTo)) ?? null;
  }, [compareTo, digests]);

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={source}
            onChange={(value) => {
              setSource(value);
              setDigests(EMPTY_DIGESTS);
              if (value === 'text') setFile(null);
            }}
            ariaLabel="Input source"
            options={[
              { value: 'text', label: 'Text' },
              { value: 'file', label: 'File' },
            ]}
          />
          <Button
            size="sm"
            variant="ghost"
            leadingIcon={<Trash2 />}
            onClick={reset}
            disabled={!hasOutput && text === ''}
            className="text-fg-subtle hover:text-danger"
          >
            Clear
          </Button>
        </div>

        <div className="mt-4">
          {source === 'text' ? (
            <>
              <label htmlFor="hash-input" className="sr-only">
                Text to hash
              </label>
              <Textarea
                id="hash-input"
                rows={6}
                value={text}
                onChange={(event) => setText(event.currentTarget.value)}
                placeholder="Type or paste anything — all five digests update as you go."
              />
            </>
          ) : (
            <div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const selected = event.currentTarget.files?.[0];
                  if (selected) void handleFile(selected);
                  event.currentTarget.value = '';
                }}
              />

              {file ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/25 bg-accent-soft p-4">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-accent-text">{file.name}</p>
                    <p className="mt-0.5 text-[12px] text-fg-muted">{formatBytes(file.size)}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} loading={busy}>
                    Choose another
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong bg-bg-subtle px-6 py-10 transition-colors hover:border-accent hover:bg-accent-soft/40"
                >
                  <FileUp className="size-6 text-fg-subtle" aria-hidden="true" />
                  <span className="text-[13px] font-medium text-fg">Choose a file to hash</span>
                  <span className="text-[12px] text-fg-subtle">
                    Read locally and never uploaded anywhere.
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Digests" icon={<Fingerprint />} description={busy ? 'Hashing…' : undefined} />

        <div className="mt-4 space-y-3">
          {HASH_ALGORITHMS.map((algorithm) => {
            const value = digests[algorithm];
            const matched = matchedAlgorithm === algorithm;

            return (
              <Field
                key={algorithm}
                label={
                  <span className="flex items-center gap-2">
                    {algorithm}
                    {WEAK.has(algorithm) && (
                      <Badge tone="warning">Not for security</Badge>
                    )}
                    {matched && <Badge tone="success" icon={<Check />}>Matches</Badge>}
                  </span>
                }
                labelAction={value !== '' ? <CopyButton value={value} ariaLabel={`Copy ${algorithm}`} size="sm" /> : undefined}
              >
                <Input
                  readOnly
                  mono
                  value={value}
                  placeholder="—"
                  onFocus={(event) => event.currentTarget.select()}
                  className={
                    matched
                      ? 'border-success/50 bg-success/10 text-success'
                      : 'cursor-text bg-bg-subtle text-[12px]'
                  }
                />
              </Field>
            );
          })}
        </div>

        {(WEAK.size > 0 && hasOutput) && (
          <p className="mt-4 text-[12px] leading-relaxed text-fg-subtle">
            MD5 and SHA-1 both have practical collision attacks, so they should not be used for signatures,
            passwords or integrity against a motivated attacker. They remain useful for checking a download
            against a published checksum, or as fast non-adversarial fingerprints.
          </p>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Compare against a known hash"
          description="Paste a checksum from a download page — it is matched against all five above."
        />

        <Field className="mt-4">
          <Input
            mono
            value={compareTo}
            onChange={(event) => setCompareTo(event.currentTarget.value)}
            placeholder="e.g. 9e107d9d372bb6826bd81d3542a419d6"
            suffix={
              compareTo.trim() === '' ? undefined : matchedAlgorithm ? (
                <Check className="text-success" />
              ) : (
                <X className="text-danger" />
              )
            }
          />
        </Field>

        {compareTo.trim() !== '' &&
          (matchedAlgorithm ? (
            <Callout tone="success" className="mt-3">
              Match — this is the {matchedAlgorithm} hash of your input.
            </Callout>
          ) : hasOutput ? (
            <Callout tone="danger" className="mt-3">
              No match against any of the five digests. The file or text differs from the one that checksum was
              generated for.
            </Callout>
          ) : (
            <Callout tone="info" className="mt-3">
              Add some text or a file above to compare against.
            </Callout>
          ))}
      </Card>
    </div>
  );
}
