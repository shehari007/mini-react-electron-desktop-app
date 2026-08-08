'use client';

import { ArrowDownWideNarrow, Braces, ChevronRight, Minimize2, Trash2, Wand2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  INDENT_OPTIONS,
  buildTree,
  formatJson,
  jsonStats,
  minifyJson,
  parseJson,
  sortKeys,
  type TreeNode,
} from '@/lib/json-tools';
import { useDebouncedValue } from '@/lib/hooks';
import { cn, downloadText, formatBytes, formatNumber } from '@/lib/utils';

const SAMPLE = `{
  "name": "AppBox",
  "version": "3.0.0",
  "offline": true,
  "tools": [
    { "slug": "calculator", "category": "calc" },
    { "slug": "json-formatter", "category": "dev" }
  ],
  "author": { "name": "Muhammad Sheharyar Butt", "url": "https://github.com/shehari007" }
}`;

type View = 'formatted' | 'tree';

export function JsonFormatter() {
  const [source, setSource] = useState('');
  const [indent, setIndent] = useState<string>('2');
  const [view, setView] = useState<View>('formatted');
  const [sorted, setSorted] = useState(false);

  // Parsing a large document on every keystroke drops frames; the delay is short
  // enough that it still feels live.
  const debounced = useDebouncedValue(source, 200);

  const parsed = useMemo(() => parseJson(debounced), [debounced]);

  const output = useMemo(() => {
    if (!parsed.ok) return '';
    const value = sorted ? sortKeys(parsed.value) : parsed.value;
    return formatJson(value, indent === '\t' ? '\t' : Number(indent));
  }, [parsed, indent, sorted]);

  const stats = useMemo(() => {
    if (!parsed.ok) return null;
    return jsonStats(parsed.value, minifyJson(parsed.value));
  }, [parsed]);

  const tree = useMemo(() => (parsed.ok ? buildTree(parsed.value) : null), [parsed]);

  const isEmpty = source.trim() === '';

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Input */}
        <Card flush className="flex flex-col overflow-hidden">
          <div className="border-b border-border px-5 py-3.5">
            <CardHeader
              title="Input"
              icon={<Braces />}
              actions={
                <>
                  <Button size="sm" variant="ghost" onClick={() => setSource(SAMPLE)}>
                    Sample
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={<Trash2 />}
                    onClick={() => setSource('')}
                    disabled={isEmpty}
                    aria-label="Clear input"
                    className="text-fg-subtle hover:text-danger"
                  />
                </>
              }
            />
          </div>

          <div className="p-4">
            <label htmlFor="json-input" className="sr-only">
              JSON to format
            </label>
            <Textarea
              id="json-input"
              mono
              rows={18}
              value={source}
              onChange={(event) => setSource(event.currentTarget.value)}
              placeholder='Paste JSON here, e.g. {"hello": "world"}'
              className="resize-y font-mono"
            />
          </div>
        </Card>

        {/* Output */}
        <Card flush className="flex flex-col overflow-hidden">
          <div className="border-b border-border px-5 py-3.5">
            <CardHeader
              title="Output"
              actions={
                <>
                  <CopyButton value={output} label="Copy" disabled={!parsed.ok} />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadText(output, 'formatted.json', 'application/json')}
                    disabled={!parsed.ok}
                  >
                    Download
                  </Button>
                </>
              }
            />
          </div>

          <div className="flex flex-wrap items-end gap-3 border-b border-border bg-bg-subtle px-4 py-3">
            <Field label="Indent" className="w-32">
              <Select
                options={[...INDENT_OPTIONS]}
                value={indent}
                onChange={(event) => setIndent(event.currentTarget.value)}
                selectSize="sm"
              />
            </Field>

            <Button
              size="sm"
              variant={sorted ? 'soft' : 'secondary'}
              leadingIcon={<ArrowDownWideNarrow />}
              onClick={() => setSorted((current) => !current)}
              aria-pressed={sorted}
            >
              Sort keys
            </Button>

            <Button
              size="sm"
              variant="secondary"
              leadingIcon={<Minimize2 />}
              onClick={() => {
                if (parsed.ok) setSource(minifyJson(sorted ? sortKeys(parsed.value) : parsed.value));
              }}
              disabled={!parsed.ok}
            >
              Minify
            </Button>

            <Button
              size="sm"
              variant="secondary"
              leadingIcon={<Wand2 />}
              onClick={() => parsed.ok && setSource(output)}
              disabled={!parsed.ok}
            >
              Format in place
            </Button>

            <Segmented
              value={view}
              onChange={setView}
              ariaLabel="Output view"
              size="sm"
              className="ml-auto"
              options={[
                { value: 'formatted', label: 'Text' },
                { value: 'tree', label: 'Tree' },
              ]}
            />
          </div>

          <div className="min-h-0 flex-1 p-4">
            {isEmpty ? (
              <p className="py-10 text-center text-[13px] text-fg-subtle">
                Formatted JSON will appear here.
              </p>
            ) : !parsed.ok ? (
              <Callout tone="danger" title={`Invalid JSON — line ${parsed.error.line}, column ${parsed.error.column}`}>
                <span className="block">{parsed.error.message}</span>
                {parsed.error.excerpt !== '' && (
                  <code className="mt-2 block overflow-x-auto whitespace-pre rounded-lg bg-danger/10 px-2.5 py-1.5 font-mono text-[11px]">
                    {parsed.error.excerpt}
                    {'\n'}
                    {/* Caret under the reported column. */}
                    {' '.repeat(Math.max(0, parsed.error.column - 1))}^
                  </code>
                )}
              </Callout>
            ) : view === 'formatted' ? (
              <pre className="max-h-[28rem] overflow-auto rounded-xl border border-border bg-bg-subtle p-3.5 font-mono text-[12px] leading-relaxed text-fg">
                {output}
              </pre>
            ) : (
              tree && (
                <div className="max-h-[28rem] overflow-auto rounded-xl border border-border bg-bg-subtle p-2">
                  <TreeView node={tree} defaultOpen />
                </div>
              )
            )}
          </div>
        </Card>
      </div>

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Size (minified)" value={formatBytes(stats.size)} />
          <Stat label="Keys" value={formatNumber(stats.keys, 0)} />
          <Stat label="Objects" value={formatNumber(stats.objects, 0)} />
          <Stat label="Arrays" value={formatNumber(stats.arrays, 0)} />
          <Stat label="Max depth" value={stats.maxDepth} />
        </div>
      )}
    </div>
  );
}

const KIND_COLORS: Record<TreeNode['kind'], string> = {
  string: 'text-success',
  number: 'text-accent-text',
  boolean: 'text-warning',
  null: 'text-fg-subtle',
  object: 'text-fg-muted',
  array: 'text-fg-muted',
};

function TreeView({ node, defaultOpen = false }: { node: TreeNode; defaultOpen?: boolean }) {
  // Deep levels start collapsed so a large document isn't a wall of text.
  const [open, setOpen] = useState(defaultOpen || node.depth < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div style={{ paddingLeft: node.depth === 0 ? 0 : 14 }}>
      <div className="group flex items-center gap-1.5 rounded py-0.5 hover:bg-card">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-label={open ? `Collapse ${node.label}` : `Expand ${node.label}`}
            className="shrink-0 rounded p-0.5 text-fg-subtle transition-colors hover:text-fg"
          >
            <ChevronRight className={cn('size-3.5 transition-transform', open && 'rotate-90')} />
          </button>
        ) : (
          <span className="w-[18px] shrink-0" />
        )}

        <span className="font-mono text-[12px] text-fg">
          {node.depth > 0 && <span className="font-semibold">{node.label}</span>}
          {node.depth > 0 && <span className="text-fg-subtle">: </span>}
          <span className={KIND_COLORS[node.kind]}>{node.preview}</span>
        </span>

        {node.path !== '' && (
          <CopyButton
            value={node.path}
            ariaLabel={`Copy path ${node.path}`}
            size="sm"
            className="ml-auto opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          />
        )}
      </div>

      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeView key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
