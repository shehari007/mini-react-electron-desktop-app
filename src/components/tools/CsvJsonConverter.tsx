'use client';

import { ArrowUpDown, Download, Table2, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { Segmented, Switch } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DELIMITER_OPTIONS, csvToJson, jsonToCsv, parseCsv } from '@/lib/csv';
import { useDebouncedValue } from '@/lib/hooks';
import { cn, downloadText, formatNumber } from '@/lib/utils';

type Direction = 'csv-to-json' | 'json-to-csv';

const SAMPLE_CSV = `name,role,years,remote
Ada Lovelace,Engineer,7,true
"Hopper, Grace",Admiral,42,false
Alan Turing,Researcher,12,true`;

const SAMPLE_JSON = `[
  { "name": "Ada Lovelace", "role": "Engineer", "years": 7 },
  { "name": "Hopper, Grace", "role": "Admiral", "years": 42 }
]`;

export function CsvJsonConverter() {
  const [direction, setDirection] = useState<Direction>('csv-to-json');
  const [input, setInput] = useState('');
  const [delimiter, setDelimiter] = useState('auto');
  const [hasHeader, setHasHeader] = useState(true);
  const [typed, setTyped] = useState(true);
  const [indent, setIndent] = useState(true);

  const debounced = useDebouncedValue(input, 250);

  const result = useMemo(() => {
    if (debounced.trim() === '') return null;

    if (direction === 'csv-to-json') {
      try {
        const { data, headers, delimiter: used } = csvToJson(debounced, {
          hasHeader,
          typed,
          delimiter: delimiter === 'auto' ? undefined : delimiter,
        });
        return {
          ok: true as const,
          output: JSON.stringify(data, null, indent ? 2 : 0),
          rowCount: data.length,
          headers,
          usedDelimiter: used,
          preview: parseCsv(debounced, delimiter === 'auto' ? undefined : delimiter).rows.slice(0, 12),
        };
      } catch (caught) {
        return { ok: false as const, error: caught instanceof Error ? caught.message : 'Could not parse that CSV.' };
      }
    }

    try {
      const parsed: unknown = JSON.parse(debounced);
      const csv = jsonToCsv(parsed, { delimiter: delimiter === 'auto' ? ',' : delimiter });
      const rows = parseCsv(csv, delimiter === 'auto' ? ',' : delimiter).rows;
      return {
        ok: true as const,
        output: csv,
        rowCount: Math.max(0, rows.length - 1),
        headers: rows[0] ?? [],
        usedDelimiter: delimiter === 'auto' ? ',' : delimiter,
        preview: rows.slice(0, 12),
      };
    } catch (caught) {
      return {
        ok: false as const,
        error:
          caught instanceof SyntaxError
            ? `That is not valid JSON: ${caught.message}`
            : caught instanceof Error
              ? caught.message
              : 'Could not convert that JSON.',
      };
    }
  }, [debounced, direction, delimiter, hasHeader, typed, indent]);

  const swap = () => {
    if (result?.ok) setInput(result.output);
    setDirection(direction === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json');
  };

  const delimiterName = (value: string) =>
    value === '\t' ? 'Tab' : value === ',' ? 'Comma' : value === ';' ? 'Semicolon' : value === '|' ? 'Pipe' : value;

  const isCsvInput = direction === 'csv-to-json';

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={direction}
            onChange={setDirection}
            ariaLabel="Conversion direction"
            options={[
              { value: 'csv-to-json', label: 'CSV → JSON' },
              { value: 'json-to-csv', label: 'JSON → CSV' },
            ]}
          />
          <Button variant="ghost" size="sm" leadingIcon={<ArrowUpDown />} onClick={swap}>
            Swap
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-4 border-t border-border pt-4">
          <Field label="Delimiter" className="w-48">
            <Select
              options={[...DELIMITER_OPTIONS]}
              value={delimiter}
              onChange={(event) => setDelimiter(event.currentTarget.value)}
              selectSize="sm"
            />
          </Field>

          {isCsvInput ? (
            <>
              <Switch
                checked={hasHeader}
                onChange={setHasHeader}
                label="First row is a header"
                description="Otherwise columns are named column_1, column_2…"
              />
              <Switch
                checked={typed}
                onChange={setTyped}
                label="Infer types"
                description="Turns 42 and true into real JSON values."
              />
            </>
          ) : (
            <Switch checked={indent} onChange={setIndent} label="Indent the JSON output" />
          )}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card flush>
          <div className="border-b border-border px-5 py-3.5">
            <CardHeader
              title={isCsvInput ? 'CSV input' : 'JSON input'}
              actions={
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setInput(isCsvInput ? SAMPLE_CSV : SAMPLE_JSON)}
                  >
                    Sample
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={<Trash2 />}
                    onClick={() => setInput('')}
                    disabled={input === ''}
                    aria-label="Clear input"
                    className="text-fg-subtle hover:text-danger"
                  />
                </>
              }
            />
          </div>
          <div className="p-4">
            <label htmlFor="csv-input" className="sr-only">
              {isCsvInput ? 'CSV to convert' : 'JSON to convert'}
            </label>
            <Textarea
              id="csv-input"
              mono
              rows={14}
              value={input}
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder={isCsvInput ? 'name,role\nAda,Engineer' : '[{ "name": "Ada" }]'}
            />
          </div>
        </Card>

        <Card flush>
          <div className="border-b border-border px-5 py-3.5">
            <CardHeader
              title={isCsvInput ? 'JSON output' : 'CSV output'}
              actions={
                <>
                  <CopyButton value={result?.ok ? result.output : ''} label="Copy" disabled={!result?.ok} />
                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={<Download />}
                    onClick={() =>
                      result?.ok &&
                      downloadText(
                        result.output,
                        isCsvInput ? 'converted.json' : 'converted.csv',
                        isCsvInput ? 'application/json' : 'text/csv',
                      )
                    }
                    disabled={!result?.ok}
                    aria-label="Download output"
                  />
                </>
              }
            />
          </div>
          <div className="p-4">
            {result === null ? (
              <p className="py-10 text-center text-[13px] text-fg-subtle">
                Output appears here as you paste.
              </p>
            ) : !result.ok ? (
              <Callout tone="danger">{result.error}</Callout>
            ) : (
              <pre className="max-h-[22rem] overflow-auto rounded-xl border border-border bg-bg-subtle p-3.5 font-mono text-[12px] leading-relaxed text-fg">
                {result.output}
              </pre>
            )}
          </div>
        </Card>
      </div>

      {result?.ok && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Rows" value={formatNumber(result.rowCount, 0)} />
            <Stat label="Columns" value={result.headers.length} />
            <Stat label="Delimiter" value={delimiterName(result.usedDelimiter)} hint={delimiter === 'auto' ? 'detected' : 'chosen'} />
          </div>

          <Card flush>
            <div className="p-5 pb-3">
              <CardHeader
                title="Table preview"
                icon={<Table2 />}
                description={
                  result.rowCount > 12 ? `First 12 of ${formatNumber(result.rowCount, 0)} rows.` : undefined
                }
              />
            </div>
            <div className="overflow-x-auto px-5 pb-5">
              <table className="w-full border-collapse text-left text-[12px]">
                <caption className="sr-only">Parsed table data</caption>
                <tbody>
                  {result.preview.map((row, rowIndex) => {
                    const isHeaderRow = rowIndex === 0 && (isCsvInput ? hasHeader : true);
                    return (
                      <tr key={rowIndex} className={cn(!isHeaderRow && 'hover:bg-bg-subtle/60')}>
                        {row.map((cell, cellIndex) =>
                          isHeaderRow ? (
                            <th
                              key={cellIndex}
                              scope="col"
                              className="whitespace-nowrap border-b border-border bg-bg-subtle px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle"
                            >
                              {cell}
                            </th>
                          ) : (
                            <td
                              key={cellIndex}
                              className="max-w-56 truncate border-b border-border/60 px-3 py-1.5 font-mono text-fg"
                              title={cell}
                            >
                              {cell === '' ? <span className="text-fg-subtle">—</span> : cell}
                            </td>
                          ),
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
