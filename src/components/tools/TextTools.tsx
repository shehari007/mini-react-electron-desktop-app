'use client';

import { RotateCcw, Trash2, Type } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { CopyButton } from '@/components/ui/CopyButton';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { useDebouncedValue } from '@/lib/hooks';
import {
  CASE_TRANSFORMS,
  LINE_TRANSFORMS,
  TEXT_TRANSFORMS,
  analyzeText,
  wordFrequency,
  type Transform,
} from '@/lib/text';
import { downloadText, formatNumber } from '@/lib/utils';

export function TextTools() {
  const [text, setText] = useState('');
  /** Previous values, so every transform is undoable. */
  const [history, setHistory] = useState<string[]>([]);

  const debounced = useDebouncedValue(text, 150);

  const stats = useMemo(() => analyzeText(debounced), [debounced]);
  const frequency = useMemo(() => wordFrequency(debounced, 10), [debounced]);

  const apply = (transform: Transform) => {
    setHistory((current) => [...current.slice(-19), text]);
    setText(transform.apply(text));
  };

  const undo = () => {
    setHistory((current) => {
      const previous = current[current.length - 1];
      if (previous === undefined) return current;
      setText(previous);
      return current.slice(0, -1);
    });
  };

  const formatMinutes = (minutes: number) => {
    if (minutes === 0) return '0 sec';
    if (minutes < 1) return `${Math.ceil(minutes * 60)} sec`;
    return `${Math.round(minutes)} min`;
  };

  const maxFrequency = frequency[0]?.count ?? 1;

  return (
    <div className="space-y-5">
      <Card flush>
        <div className="border-b border-border px-5 py-3.5">
          <CardHeader
            title="Your text"
            icon={<Type />}
            actions={
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  leadingIcon={<RotateCcw />}
                  onClick={undo}
                  disabled={history.length === 0}
                >
                  Undo
                </Button>
                <CopyButton value={text} label="Copy" disabled={text === ''} />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadText(text, 'text.txt')}
                  disabled={text === ''}
                >
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leadingIcon={<Trash2 />}
                  onClick={() => {
                    setHistory((current) => [...current, text]);
                    setText('');
                  }}
                  disabled={text === ''}
                  aria-label="Clear text"
                  className="text-fg-subtle hover:text-danger"
                />
              </>
            }
          />
        </div>
        <div className="p-4">
          <label htmlFor="text-input" className="sr-only">
            Text to analyse and transform
          </label>
          <Textarea
            id="text-input"
            rows={12}
            value={text}
            onChange={(event) => setText(event.currentTarget.value)}
            placeholder="Paste or type anything — statistics update as you go, and the buttons below transform it in place."
          />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Words" value={formatNumber(stats.words, 0)} />
        <Stat label="Characters" value={formatNumber(stats.characters, 0)} hint={`${formatNumber(stats.charactersNoSpaces, 0)} without spaces`} />
        <Stat label="Sentences" value={formatNumber(stats.sentences, 0)} />
        <Stat label="Paragraphs" value={formatNumber(stats.paragraphs, 0)} />
        <Stat label="Reading time" value={formatMinutes(stats.readingMinutes)} hint="at 225 wpm" />
        <Stat label="Speaking time" value={formatMinutes(stats.speakingMinutes)} hint="at 150 wpm" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <TransformCard title="Change case" transforms={CASE_TRANSFORMS} onApply={apply} disabled={text === ''} />
        <TransformCard title="Work on lines" transforms={LINE_TRANSFORMS} onApply={apply} disabled={text === ''} />
        <TransformCard title="Clean up" transforms={TEXT_TRANSFORMS} onApply={apply} disabled={text === ''} />
      </div>

      {stats.words > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="More detail" />
            <dl className="mt-3 divide-y divide-border text-[13px]">
              {[
                ['Unique words', formatNumber(stats.uniqueWords, 0)],
                ['Lines', formatNumber(stats.lines, 0)],
                ['Longest word', stats.longestWord || '—'],
                ['Average word length', `${formatNumber(stats.averageWordLength, 1)} characters`],
                [
                  'Lexical variety',
                  `${formatNumber((stats.uniqueWords / Math.max(1, stats.words)) * 100, 1)}%`,
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0">
                  <dt className="text-fg-muted">{label}</dt>
                  <dd className="tabular font-semibold text-fg">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader
              title="Most used words"
              description="Common filler words like 'the' and 'and' are excluded."
            />
            {frequency.length === 0 ? (
              <p className="mt-3 text-[13px] text-fg-muted">Not enough distinct words yet.</p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {frequency.map((entry) => (
                  <li key={entry.word} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 truncate font-mono text-[12px] text-fg">{entry.word}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-bg-subtle">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${(entry.count / maxFrequency) * 100}%` }}
                      />
                    </span>
                    <span className="tabular w-8 shrink-0 text-right text-[12px] font-semibold text-fg-muted">
                      {entry.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function TransformCard({
  title,
  transforms,
  onApply,
  disabled,
}: {
  title: string;
  transforms: Transform[];
  onApply: (transform: Transform) => void;
  disabled: boolean;
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="mt-3 space-y-1">
        {transforms.map((transform) => (
          <button
            key={transform.id}
            type="button"
            onClick={() => onApply(transform)}
            disabled={disabled}
            className="w-full rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
          >
            <span className="block text-[13px] font-medium text-fg">{transform.label}</span>
            <span className="block text-[11px] text-fg-subtle">{transform.description}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
