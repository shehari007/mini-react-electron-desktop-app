'use client';

import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { Segmented, Slider, Switch } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { escapeHtml, formatNumber } from '@/lib/utils';
import {
  generateParagraphs,
  generateSentences,
  generateWords,
  type LoremFlavor,
} from '@/lib/text';
import { analyzeText } from '@/lib/text';

type Unit = 'paragraphs' | 'sentences' | 'words';
type Format = 'text' | 'html';

const FLAVOR_OPTIONS = [
  { value: 'classic', label: 'Classic Latin' },
  { value: 'hipster', label: 'Hipster' },
  { value: 'tech', label: 'Tech jargon' },
];

const UNIT_LIMITS: Record<Unit, { min: number; max: number; default: number }> = {
  paragraphs: { min: 1, max: 30, default: 3 },
  sentences: { min: 1, max: 60, default: 5 },
  words: { min: 5, max: 800, default: 50 },
};

export function LoremIpsumGenerator() {
  const [unit, setUnit] = useState<Unit>('paragraphs');
  const [count, setCount] = useState(UNIT_LIMITS.paragraphs.default);
  const [flavor, setFlavor] = useState<LoremFlavor>('classic');
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [format, setFormat] = useState<Format>('text');
  const [blocks, setBlocks] = useState<string[]>([]);

  const generate = useCallback(() => {
    const options = { flavor, startWithLorem };
    if (unit === 'paragraphs') setBlocks(generateParagraphs(count, options));
    else if (unit === 'sentences') setBlocks(generateSentences(count, options));
    else setBlocks([generateWords(count, options)]);
  }, [unit, count, flavor, startWithLorem]);

  // Generated in an effect rather than during render: the output is random, so
  // producing it while rendering would differ between prerender and hydration.
  useEffect(() => {
    generate();
  }, [generate]);

  const output = useMemo(() => {
    if (format === 'html') {
      // Escaped before wrapping — the word lists are ours, but the output is
      // meant to be pasted into real markup, so it should be clean either way.
      return blocks.map((block) => `<p>${escapeHtml(block)}</p>`).join('\n');
    }
    return blocks.join(unit === 'paragraphs' ? '\n\n' : ' ');
  }, [blocks, format, unit]);

  const stats = useMemo(() => analyzeText(blocks.join(' ')), [blocks]);

  const limits = UNIT_LIMITS[unit];

  return (
    <ToolColumns
      main={
        <Card flush>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <CardHeader title="Generated text" />
            <div className="flex flex-wrap gap-2">
              <Segmented
                value={format}
                onChange={setFormat}
                ariaLabel="Output format"
                size="sm"
                options={[
                  { value: 'text', label: 'Plain' },
                  { value: 'html', label: 'HTML' },
                ]}
              />
              <Button size="sm" variant="primary" leadingIcon={<RefreshCw />} onClick={generate}>
                Regenerate
              </Button>
              <CopyButton value={output} label="Copy" />
            </div>
          </div>

          <div className="p-5">
            {format === 'html' ? (
              <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-bg-subtle p-4 font-mono text-[12px] leading-relaxed text-fg">
                {output}
              </pre>
            ) : (
              <div className="max-h-[32rem] space-y-4 overflow-y-auto">
                {blocks.map((block, index) => (
                  <p key={index} className="text-[14px] leading-relaxed text-fg">
                    {block}
                  </p>
                ))}
              </div>
            )}
          </div>
        </Card>
      }
      side={
        <>
          <Card>
            <CardHeader title="Options" />

            <div className="mt-4 space-y-4">
              <Field label="Generate by">
                <Segmented
                  value={unit}
                  onChange={(value) => {
                    setUnit(value);
                    setCount(UNIT_LIMITS[value].default);
                  }}
                  ariaLabel="Unit"
                  fullWidth
                  size="sm"
                  options={[
                    { value: 'paragraphs', label: 'Paragraphs' },
                    { value: 'sentences', label: 'Sentences' },
                    { value: 'words', label: 'Words' },
                  ]}
                />
              </Field>

              <Slider
                label={`How many ${unit}`}
                value={count}
                onChange={setCount}
                min={limits.min}
                max={limits.max}
                formatValue={(value) => String(value)}
              />

              <Field label="Word list">
                <Select
                  options={FLAVOR_OPTIONS}
                  value={flavor}
                  onChange={(event) => setFlavor(event.currentTarget.value as LoremFlavor)}
                />
              </Field>

              <div className="border-t border-border pt-4">
                <Switch
                  checked={startWithLorem}
                  onChange={setStartWithLorem}
                  label="Start with “Lorem ipsum dolor sit amet”"
                  description="The conventional opening, so it reads as recognisable filler."
                />
              </div>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Words" value={formatNumber(stats.words, 0)} />
            <Stat label="Characters" value={formatNumber(stats.characters, 0)} />
          </div>
        </>
      }
    />
  );
}
