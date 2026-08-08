'use client';

import { ArrowUpDown, Link2, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Card, CardHeader } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { DataTable, DetailList } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Feedback';
import { Textarea } from '@/components/ui/Input';
import { parseUrl } from '@/lib/encoding';

type Direction = 'encode' | 'decode';
/**
 * `encodeURIComponent` escapes reserved characters (& = ? /), which is right for
 * a single query value. `encodeURI` leaves them alone, which is right for a whole
 * URL. Picking the wrong one is the usual bug, so both are offered explicitly.
 */
type Scope = 'component' | 'full';

export function UrlEncoder() {
  const [direction, setDirection] = useState<Direction>('encode');
  const [scope, setScope] = useState<Scope>('component');
  const [input, setInput] = useState('');

  const result = useMemo(() => {
    if (input.trim() === '') return { ok: true as const, value: '' };

    try {
      if (direction === 'encode') {
        return {
          ok: true as const,
          value: scope === 'component' ? encodeURIComponent(input) : encodeURI(input),
        };
      }
      return {
        ok: true as const,
        value: scope === 'component' ? decodeURIComponent(input) : decodeURI(input),
      };
    } catch {
      // decodeURIComponent throws URIError on a stray or truncated % sequence.
      return {
        ok: false as const,
        error: 'That contains a malformed percent-escape (for example a lone "%" or "%zz").',
      };
    }
  }, [input, direction, scope]);

  const parsed = useMemo(() => parseUrl(direction === 'encode' ? input : (result.ok ? result.value : '')), [
    input,
    direction,
    result,
  ]);

  const swap = () => {
    if (result.ok && result.value !== '') setInput(result.value);
    setDirection(direction === 'encode' ? 'decode' : 'encode');
  };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={direction}
            onChange={setDirection}
            ariaLabel="Direction"
            options={[
              { value: 'encode', label: 'Encode' },
              { value: 'decode', label: 'Decode' },
            ]}
          />
          <Segmented
            value={scope}
            onChange={setScope}
            ariaLabel="Encoding scope"
            size="sm"
            options={[
              { value: 'component', label: 'Query value' },
              { value: 'full', label: 'Whole URL' },
            ]}
          />
          <Button variant="ghost" size="sm" leadingIcon={<ArrowUpDown />} onClick={swap}>
            Swap
          </Button>
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-fg-subtle">
          {scope === 'component'
            ? 'Query value mode escapes everything reserved — & = ? / # — so the result is safe as a single parameter value.'
            : 'Whole URL mode leaves the structural characters intact, so an entire URL stays usable.'}
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card flush>
          <div className="border-b border-border px-5 py-3.5">
            <CardHeader
              title="Input"
              icon={<Link2 />}
              actions={
                <Button
                  size="sm"
                  variant="ghost"
                  leadingIcon={<Trash2 />}
                  onClick={() => setInput('')}
                  disabled={input === ''}
                  aria-label="Clear input"
                  className="text-fg-subtle hover:text-danger"
                />
              }
            />
          </div>
          <div className="p-4">
            <label htmlFor="url-input" className="sr-only">
              URL or text
            </label>
            <Textarea
              id="url-input"
              mono
              rows={10}
              value={input}
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder={
                direction === 'encode'
                  ? 'https://example.com/search?q=hello world&lang=en'
                  : 'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world'
              }
              className="break-all"
            />
          </div>
        </Card>

        <Card flush>
          <div className="border-b border-border px-5 py-3.5">
            <CardHeader title="Result" actions={<CopyButton value={result.ok ? result.value : ''} label="Copy" disabled={!result.ok || result.value === ''} />} />
          </div>
          <div className="p-4">
            {!result.ok ? (
              <Callout tone="danger">{result.error}</Callout>
            ) : result.value === '' ? (
              <p className="py-10 text-center text-[13px] text-fg-subtle">Result appears here as you type.</p>
            ) : (
              <pre className="max-h-[16rem] overflow-auto whitespace-pre-wrap break-all rounded-xl border border-border bg-bg-subtle p-3.5 font-mono text-[12px] leading-relaxed text-fg">
                {result.value}
              </pre>
            )}
          </div>
        </Card>
      </div>

      {parsed && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="URL parts" description="Parsed from the decoded URL." />
            <DetailList
              className="mt-3"
              items={[
                { label: 'Protocol', value: parsed.protocol },
                { label: 'Host', value: parsed.hostname },
                ...(parsed.port ? [{ label: 'Port', value: parsed.port }] : []),
                { label: 'Path', value: parsed.pathname || '/' },
                ...(parsed.hash ? [{ label: 'Fragment', value: parsed.hash }] : []),
                { label: 'Origin', value: parsed.origin },
              ]}
            />
          </Card>

          <Card flush>
            <div className="p-5 pb-3">
              <CardHeader
                title="Query parameters"
                description={
                  parsed.params.length === 0 ? 'This URL has no query string.' : `${parsed.params.length} found.`
                }
              />
            </div>
            <div className="px-3 pb-3">
              <DataTable
                rows={parsed.params}
                rowKey={(param, index) => `${param.key}-${index}`}
                emptyMessage="No query parameters."
                columns={[
                  {
                    key: 'key',
                    header: 'Key',
                    render: (param) => <span className="font-mono font-semibold text-accent-text">{param.key}</span>,
                  },
                  {
                    key: 'value',
                    header: 'Value',
                    render: (param) => (
                      <span className="break-all font-mono text-fg">{param.value || <em className="text-fg-subtle">empty</em>}</span>
                    ),
                  },
                ]}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
