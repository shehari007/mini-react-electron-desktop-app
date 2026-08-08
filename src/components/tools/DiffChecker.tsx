'use client';

import { GitCompare, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { Segmented, Switch } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Feedback';
import { Textarea } from '@/components/ui/Input';
import { diffLines, diffStats, toSideBySide, toUnifiedText, type DiffKind } from '@/lib/diff';
import { useDebouncedValue } from '@/lib/hooks';
import { cn, formatNumber } from '@/lib/utils';

type View = 'split' | 'unified';

/** The LCS table is O(n×m); past this the browser would stall. */
const MAX_LINES = 4000;

const KIND_STYLES: Record<DiffKind, { row: string; gutter: string; sign: string }> = {
  added: { row: 'bg-success/10', gutter: 'text-success', sign: '+' },
  removed: { row: 'bg-danger/10', gutter: 'text-danger', sign: '−' },
  equal: { row: '', gutter: 'text-fg-subtle', sign: ' ' },
};

export function DiffChecker() {
  const [original, setOriginal] = useState('');
  const [changed, setChanged] = useState('');
  const [view, setView] = useState<View>('split');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);

  const debouncedOriginal = useDebouncedValue(original, 300);
  const debouncedChanged = useDebouncedValue(changed, 300);

  const tooLarge =
    debouncedOriginal.split('\n').length > MAX_LINES || debouncedChanged.split('\n').length > MAX_LINES;

  const lines = useMemo(() => {
    if (tooLarge) return [];
    if (debouncedOriginal === '' && debouncedChanged === '') return [];
    return diffLines(debouncedOriginal, debouncedChanged, { ignoreWhitespace, ignoreCase });
  }, [debouncedOriginal, debouncedChanged, ignoreWhitespace, ignoreCase, tooLarge]);

  const stats = useMemo(() => diffStats(lines), [lines]);
  const rows = useMemo(() => toSideBySide(lines), [lines]);

  const identical = lines.length > 0 && stats.added === 0 && stats.removed === 0;
  const hasInput = debouncedOriginal !== '' || debouncedChanged !== '';

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card flush>
          <div className="border-b border-border px-5 py-3.5">
            <CardHeader
              title="Original"
              actions={
                <Button
                  size="sm"
                  variant="ghost"
                  leadingIcon={<Trash2 />}
                  onClick={() => setOriginal('')}
                  disabled={original === ''}
                  aria-label="Clear original"
                  className="text-fg-subtle hover:text-danger"
                />
              }
            />
          </div>
          <div className="p-4">
            <label htmlFor="diff-original" className="sr-only">
              Original text
            </label>
            <Textarea
              id="diff-original"
              mono
              rows={12}
              value={original}
              onChange={(event) => setOriginal(event.currentTarget.value)}
              placeholder="Paste the original version here…"
            />
          </div>
        </Card>

        <Card flush>
          <div className="border-b border-border px-5 py-3.5">
            <CardHeader
              title="Changed"
              actions={
                <Button
                  size="sm"
                  variant="ghost"
                  leadingIcon={<Trash2 />}
                  onClick={() => setChanged('')}
                  disabled={changed === ''}
                  aria-label="Clear changed"
                  className="text-fg-subtle hover:text-danger"
                />
              }
            />
          </div>
          <div className="p-4">
            <label htmlFor="diff-changed" className="sr-only">
              Changed text
            </label>
            <Textarea
              id="diff-changed"
              mono
              rows={12}
              value={changed}
              onChange={(event) => setChanged(event.currentTarget.value)}
              placeholder="Paste the new version here…"
            />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Segmented
            value={view}
            onChange={setView}
            ariaLabel="Diff view"
            options={[
              { value: 'split', label: 'Side by side' },
              { value: 'unified', label: 'Unified' },
            ]}
          />
          <div className="flex flex-wrap gap-5">
            <Switch checked={ignoreWhitespace} onChange={setIgnoreWhitespace} label="Ignore whitespace" />
            <Switch checked={ignoreCase} onChange={setIgnoreCase} label="Ignore case" />
          </div>
        </div>
      </Card>

      {tooLarge ? (
        <Callout tone="warning" title="Too much text to diff">
          This compares up to {formatNumber(MAX_LINES, 0)} lines per side. Beyond that the comparison table grows
          large enough to lock up the page, so trim the input or use a local diff tool.
        </Callout>
      ) : !hasInput ? (
        <Card>
          <p className="py-10 text-center text-[13px] text-fg-subtle">
            Paste two versions above to see what changed.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Added" value={formatNumber(stats.added, 0)} hint="lines" />
            <Stat label="Removed" value={formatNumber(stats.removed, 0)} hint="lines" />
            <Stat label="Unchanged" value={formatNumber(stats.unchanged, 0)} hint="lines" />
          </div>

          {identical && (
            <Callout tone="success">
              These two are identical
              {ignoreWhitespace || ignoreCase ? ' with the options above applied' : ''}.
            </Callout>
          )}

          <Card flush>
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <CardHeader title="Differences" icon={<GitCompare />} />
              <CopyButton value={() => toUnifiedText(lines)} label="Copy unified diff" />
            </div>

            <div className="max-h-[36rem] overflow-auto">
              {view === 'split' ? (
                <table className="w-full border-collapse font-mono text-[12px]">
                  <caption className="sr-only">Side-by-side comparison of the two versions</caption>
                  <thead className="sticky top-0 z-10 bg-bg-subtle">
                    <tr>
                      <th scope="col" colSpan={2} className="border-b border-r border-border px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                        Original
                      </th>
                      <th scope="col" colSpan={2} className="border-b border-border px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                        Changed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={index}>
                        <td className="w-10 select-none border-b border-border/50 px-2 py-0.5 text-right align-top text-[10px] text-fg-subtle">
                          {row.left?.number ?? ''}
                        </td>
                        <td
                          className={cn(
                            'w-1/2 border-b border-r border-border/50 px-2 py-0.5 align-top',
                            row.left ? KIND_STYLES[row.left.kind].row : 'bg-bg-subtle/50',
                          )}
                        >
                          <pre className="whitespace-pre-wrap break-words">{row.left?.text ?? ''}</pre>
                        </td>
                        <td className="w-10 select-none border-b border-border/50 px-2 py-0.5 text-right align-top text-[10px] text-fg-subtle">
                          {row.right?.number ?? ''}
                        </td>
                        <td
                          className={cn(
                            'w-1/2 border-b border-border/50 px-2 py-0.5 align-top',
                            row.right ? KIND_STYLES[row.right.kind].row : 'bg-bg-subtle/50',
                          )}
                        >
                          <pre className="whitespace-pre-wrap break-words">{row.right?.text ?? ''}</pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <ul className="font-mono text-[12px]">
                  {lines.map((line, index) => {
                    const style = KIND_STYLES[line.kind];
                    return (
                      <li key={index} className={cn('flex gap-2 px-3 py-0.5', style.row)}>
                        <span className="w-8 shrink-0 select-none text-right text-[10px] text-fg-subtle">
                          {line.leftNumber ?? ''}
                        </span>
                        <span className="w-8 shrink-0 select-none text-right text-[10px] text-fg-subtle">
                          {line.rightNumber ?? ''}
                        </span>
                        <span className={cn('w-3 shrink-0 select-none font-bold', style.gutter)}>
                          {style.sign}
                        </span>
                        <pre className="min-w-0 flex-1 whitespace-pre-wrap break-words">{line.text}</pre>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
