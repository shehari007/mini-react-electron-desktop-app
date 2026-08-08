'use client';

import { BookOpen, Download, Eye, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { useDebouncedValue } from '@/lib/hooks';
import { useLocalStorage } from '@/lib/storage';
import { analyzeText } from '@/lib/text';
import { cn, downloadText, formatNumber } from '@/lib/utils';

type View = 'split' | 'editor' | 'preview';

const SAMPLE = `# Markdown preview

Write on the left, see it rendered on the right. Your draft is **saved locally** as you type.

## What's supported

- GitHub-flavoured tables
- Task lists
- ~~Strikethrough~~ and \`inline code\`

| Tool | Category | Offline |
| --- | --- | :-: |
| Calculator | Maths | yes |
| Weather | Info | cached |

- [x] Write some markdown
- [ ] Copy the HTML out

> Blockquotes work too.

\`\`\`ts
const greet = (name: string) => \`Hello, \${name}\`;
\`\`\`

1. Ordered lists
2. Also fine

[A link](https://appbox.msyb.dev)
`;

export function MarkdownPreview() {
  const [source, setSource] = useLocalStorage<string>('markdown:draft', '');
  const [view, setView] = useState<View>('split');
  const [html, setHtml] = useState('');

  const debounced = useDebouncedValue(source, 200);

  // marked is loaded on demand: it is only needed once there is something to
  // render, and keeping it out of the initial chunk keeps this route light.
  useEffect(() => {
    if (debounced === '') {
      setHtml('');
      return;
    }

    let cancelled = false;

    void (async () => {
      const [{ marked }, DOMPurify] = await Promise.all([
        import('marked'),
        // DOMPurify is the reason rendering arbitrary markdown is safe here:
        // marked will happily emit inline <script> or an onerror attribute from
        // raw HTML in the source, and this strips it before it reaches the DOM.
        import('dompurify').then((module) => module.default),
      ]);
      if (cancelled) return;

      const rendered = await marked.parse(debounced, { gfm: true, breaks: true });
      if (cancelled) return;

      setHtml(DOMPurify.sanitize(rendered, { USE_PROFILES: { html: true } }));
    })();

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const stats = useMemo(() => analyzeText(debounced), [debounced]);

  const showEditor = view === 'split' || view === 'editor';
  const showPreview = view === 'split' || view === 'preview';

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={view}
            onChange={setView}
            ariaLabel="Layout"
            options={[
              { value: 'split', label: 'Split' },
              { value: 'editor', label: 'Editor' },
              { value: 'preview', label: 'Preview' },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSource(SAMPLE)}>
              Load sample
            </Button>
            <CopyButton value={html} label="Copy HTML" disabled={html === ''} />
            <Button
              size="sm"
              variant="ghost"
              leadingIcon={<Download />}
              onClick={() => downloadText(source, 'document.md', 'text/markdown')}
              disabled={source === ''}
            >
              .md
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leadingIcon={<Trash2 />}
              onClick={() => setSource('')}
              disabled={source === ''}
              aria-label="Clear the draft"
              className="text-fg-subtle hover:text-danger"
            />
          </div>
        </div>
      </Card>

      <div className={cn('grid gap-5', view === 'split' && 'lg:grid-cols-2')}>
        {showEditor && (
          <Card flush>
            <div className="border-b border-border px-5 py-3.5">
              <CardHeader title="Markdown" icon={<BookOpen />} />
            </div>
            <div className="p-4">
              <label htmlFor="md-input" className="sr-only">
                Markdown source
              </label>
              <Textarea
                id="md-input"
                mono
                rows={view === 'editor' ? 26 : 20}
                value={source}
                onChange={(event) => setSource(event.currentTarget.value)}
                placeholder="# Start writing…"
              />
            </div>
          </Card>
        )}

        {showPreview && (
          <Card flush>
            <div className="border-b border-border px-5 py-3.5">
              <CardHeader title="Rendered" icon={<Eye />} description="HTML is sanitised before display." />
            </div>
            <div className="p-5">
              {html === '' ? (
                <p className="py-16 text-center text-[13px] text-fg-subtle">
                  The rendered document will appear here.
                </p>
              ) : (
                <div
                  // Sanitised immediately above; marked's raw HTML passthrough is
                  // what makes the sanitiser non-optional.
                  dangerouslySetInnerHTML={{ __html: html }}
                  className={cn(
                    'markdown-body max-w-none text-[14px] leading-relaxed text-fg',
                    view === 'split' ? 'max-h-[38rem] overflow-y-auto' : '',
                  )}
                />
              )}
            </div>
          </Card>
        )}
      </div>

      {stats.words > 0 && (
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Words" value={formatNumber(stats.words, 0)} />
          <Stat label="Characters" value={formatNumber(stats.characters, 0)} />
          <Stat label="Lines" value={formatNumber(stats.lines, 0)} />
          <Stat
            label="Reading time"
            value={stats.readingMinutes < 1 ? `${Math.ceil(stats.readingMinutes * 60)} sec` : `${Math.round(stats.readingMinutes)} min`}
          />
        </div>
      )}
    </div>
  );
}
