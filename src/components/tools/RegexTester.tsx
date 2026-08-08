'use client';

import { Regex as RegexIcon } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { DataTable } from '@/components/ui/DataTable';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input, Textarea } from '@/components/ui/Input';
import { useDebouncedValue } from '@/lib/hooks';
import { formatNumber } from '@/lib/utils';

interface MatchInfo {
  index: number;
  text: string;
  start: number;
  end: number;
  groups: Array<{ name: string; value: string | undefined }>;
}

const FLAG_OPTIONS = [
  { flag: 'g', label: 'Global', hint: 'Find every match, not just the first' },
  { flag: 'i', label: 'Ignore case', hint: 'Match regardless of upper/lowercase' },
  { flag: 'm', label: 'Multiline', hint: '^ and $ match at each line break' },
  { flag: 's', label: 'Dotall', hint: '. also matches newline characters' },
  { flag: 'u', label: 'Unicode', hint: 'Enables \\p{…} property escapes' },
] as const;

const CHEATSHEET = [
  { token: '.', meaning: 'Any character (except newline unless /s)' },
  { token: '\\d \\w \\s', meaning: 'Digit · word character · whitespace' },
  { token: '\\D \\W \\S', meaning: 'The negation of each' },
  { token: '[abc] [^abc]', meaning: 'One of these · none of these' },
  { token: '* + ?', meaning: 'Zero or more · one or more · optional' },
  { token: '{2} {2,} {2,5}', meaning: 'Exactly · at least · between' },
  { token: '(…)', meaning: 'Capture group' },
  { token: '(?:…)', meaning: 'Group without capturing' },
  { token: '(?<name>…)', meaning: 'Named capture group' },
  { token: '^ $', meaning: 'Start · end of string (or line with /m)' },
  { token: '\\b', meaning: 'Word boundary' },
  { token: 'a|b', meaning: 'Either a or b' },
  { token: '(?=…) (?!…)', meaning: 'Lookahead · negative lookahead' },
] as const;

const SAMPLE_PATTERN = '(?<user>[\\w.+-]+)@(?<domain>[\\w-]+\\.[\\w.]+)';
const SAMPLE_TEXT = `Contact ada@example.com or grace.hopper+work@navy.mil.
Invalid: not-an-email@, @nope.com
Support: help@appbox.dev`;

export function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('gi');
  const [testText, setTestText] = useState('');
  const [replacement, setReplacement] = useState('');

  // Constructing a RegExp on every keystroke of a half-typed pattern throws
  // constantly; debouncing keeps the error message from flickering.
  const debouncedPattern = useDebouncedValue(pattern, 200);
  const debouncedText = useDebouncedValue(testText, 200);

  const compiled = useMemo(() => {
    if (debouncedPattern === '') return { ok: true as const, regex: null };
    try {
      return { ok: true as const, regex: new RegExp(debouncedPattern, flags) };
    } catch (caught) {
      return {
        ok: false as const,
        error: caught instanceof Error ? caught.message : 'That pattern is not valid.',
      };
    }
  }, [debouncedPattern, flags]);

  const matches = useMemo<MatchInfo[]>(() => {
    if (!compiled.ok || !compiled.regex || debouncedText === '') return [];

    const found: MatchInfo[] = [];
    // A fresh RegExp per run so lastIndex never leaks between renders.
    const regex = new RegExp(compiled.regex.source, compiled.regex.flags.includes('g') ? compiled.regex.flags : `${compiled.regex.flags}g`);

    let match: RegExpExecArray | null;
    let guard = 0;

    while ((match = regex.exec(debouncedText)) !== null) {
      // A zero-length match would loop forever without advancing lastIndex.
      if (match[0] === '') regex.lastIndex += 1;

      found.push({
        index: found.length + 1,
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
        groups: [
          // Numbered groups first, then any named ones.
          ...match.slice(1).map((value, groupIndex) => ({ name: String(groupIndex + 1), value })),
          ...Object.entries(match.groups ?? {}).map(([name, value]) => ({ name, value })),
        ],
      });

      // Without /g only the first match is meaningful.
      if (!compiled.regex.flags.includes('g')) break;

      guard += 1;
      if (guard > 5000) break;
    }

    return found;
  }, [compiled, debouncedText]);

  const highlighted = useMemo<ReactNode[]>(() => {
    if (matches.length === 0) return [debouncedText];

    const parts: ReactNode[] = [];
    let cursor = 0;

    matches.forEach((match, index) => {
      // Overlapping or out-of-order matches would corrupt the slicing.
      if (match.start < cursor) return;
      if (match.start > cursor) parts.push(debouncedText.slice(cursor, match.start));
      parts.push(
        <mark key={index} className="rounded bg-accent px-0.5 text-accent-fg">
          {match.text}
        </mark>,
      );
      cursor = match.end;
    });

    if (cursor < debouncedText.length) parts.push(debouncedText.slice(cursor));
    return parts;
  }, [matches, debouncedText]);

  const replaced = useMemo(() => {
    if (!compiled.ok || !compiled.regex || debouncedText === '') return null;
    try {
      return debouncedText.replace(compiled.regex, replacement);
    } catch {
      return null;
    }
  }, [compiled, debouncedText, replacement]);

  const toggleFlag = (flag: string) => {
    setFlags((current) => (current.includes(flag) ? current.replace(flag, '') : current + flag));
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Pattern"
          icon={<RegexIcon />}
          actions={
            <>
              <button
                type="button"
                onClick={() => {
                  setPattern(SAMPLE_PATTERN);
                  setTestText(SAMPLE_TEXT);
                  setReplacement('$<user> at $<domain>');
                }}
                className="text-[13px] font-medium text-accent-text hover:underline"
              >
                Load an example
              </button>
              {pattern !== '' && <CopyButton value={`/${pattern}/${flags}`} ariaLabel="Copy regex" size="sm" />}
            </>
          }
        />

        <div className="mt-4">
          <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-card focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
            <span className="grid place-items-center border-r border-border bg-bg-subtle px-3 font-mono text-sm text-fg-subtle">
              /
            </span>
            <label htmlFor="regex-pattern" className="sr-only">
              Regular expression
            </label>
            <input
              id="regex-pattern"
              value={pattern}
              onChange={(event) => setPattern(event.currentTarget.value)}
              placeholder="\\b\\w+@\\w+\\.\\w+\\b"
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-sm text-fg outline-none placeholder:text-fg-subtle"
            />
            <span className="grid place-items-center border-l border-border bg-bg-subtle px-3 font-mono text-sm text-accent-text">
              /{flags}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FLAG_OPTIONS.map((option) => (
            <Switch
              key={option.flag}
              checked={flags.includes(option.flag)}
              onChange={() => toggleFlag(option.flag)}
              label={
                <span className="flex items-center gap-1.5">
                  <code className="font-mono text-accent-text">/{option.flag}</code>
                  {option.label}
                </span>
              }
              description={option.hint}
            />
          ))}
        </div>

        {!compiled.ok && (
          <Callout tone="danger" title="Invalid pattern" className="mt-4">
            {compiled.error}
          </Callout>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card flush>
          <div className="border-b border-border px-5 py-3.5">
            <CardHeader title="Test string" />
          </div>
          <div className="p-4">
            <label htmlFor="regex-text" className="sr-only">
              Text to test against
            </label>
            <Textarea
              id="regex-text"
              rows={10}
              mono
              value={testText}
              onChange={(event) => setTestText(event.currentTarget.value)}
              placeholder="Paste the text you want to match against…"
            />
          </div>
        </Card>

        <Card flush>
          <div className="border-b border-border px-5 py-3.5">
            <CardHeader
              title="Matches highlighted"
              description={
                matches.length === 0 && debouncedText !== '' && compiled.ok && pattern !== ''
                  ? 'No matches in this text.'
                  : undefined
              }
            />
          </div>
          <div className="p-4">
            {debouncedText === '' ? (
              <p className="py-10 text-center text-[13px] text-fg-subtle">
                Add a test string to see matches.
              </p>
            ) : (
              <pre className="max-h-[18rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-bg-subtle p-3.5 font-mono text-[12px] leading-relaxed text-fg">
                {highlighted}
              </pre>
            )}
          </div>
        </Card>
      </div>

      {matches.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Matches" value={formatNumber(matches.length, 0)} />
            <Stat label="Capture groups" value={matches[0]?.groups.length ?? 0} />
            <Stat
              label="Characters matched"
              value={formatNumber(
                matches.reduce((sum, match) => sum + match.text.length, 0),
                0,
              )}
            />
          </div>

          <Card flush>
            <div className="p-5 pb-3">
              <CardHeader title="Match details" description="Position and capture groups for each match." />
            </div>
            <div className="px-3 pb-3">
              <DataTable
                maxHeight="22rem"
                rows={matches}
                rowKey={(match) => String(match.index)}
                columns={[
                  { key: 'index', header: '#', render: (match) => match.index },
                  {
                    key: 'text',
                    header: 'Match',
                    render: (match) => (
                      <code className="break-all font-mono text-accent-text">{match.text}</code>
                    ),
                  },
                  {
                    key: 'position',
                    header: 'Position',
                    numeric: true,
                    render: (match) => `${match.start}–${match.end}`,
                  },
                  {
                    key: 'groups',
                    header: 'Groups',
                    render: (match) =>
                      match.groups.length === 0 ? (
                        <span className="text-fg-subtle">—</span>
                      ) : (
                        <span className="flex flex-wrap gap-1">
                          {match.groups.map((group) => (
                            <span
                              key={group.name}
                              className="rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-mono text-[11px]"
                            >
                              <span className="text-fg-subtle">{group.name}:</span>{' '}
                              {group.value === undefined ? (
                                <em className="text-fg-subtle">unset</em>
                              ) : (
                                <span className="text-fg">{group.value}</span>
                              )}
                            </span>
                          ))}
                        </span>
                      ),
                  },
                ]}
              />
            </div>
          </Card>
        </>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Replace" description="Use $1, $2 or $<name> to reference capture groups." />
          <Field label="Replacement" className="mt-4">
            <Input
              mono
              value={replacement}
              onChange={(event) => setReplacement(event.currentTarget.value)}
              placeholder="$1"
            />
          </Field>
          {replaced !== null && (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Result</span>
                <CopyButton value={replaced} ariaLabel="Copy replaced text" size="sm" />
              </div>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-bg-subtle p-3.5 font-mono text-[12px] leading-relaxed text-fg">
                {replaced}
              </pre>
            </div>
          )}
        </Card>

        <Card flush>
          <div className="p-5 pb-3">
            <CardHeader title="Quick reference" />
          </div>
          <div className="px-3 pb-3">
            <DataTable
              maxHeight="20rem"
              rows={CHEATSHEET}
              rowKey={(row) => row.token}
              columns={[
                {
                  key: 'token',
                  header: 'Syntax',
                  render: (row) => <code className="font-mono text-accent-text">{row.token}</code>,
                },
                { key: 'meaning', header: 'Meaning', render: (row) => row.meaning },
              ]}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
