'use client';

import { Delete, History, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { EmptyState } from '@/components/ui/Feedback';
import { ExpressionError, evaluateExpression, tryEvaluate, type AngleMode } from '@/lib/expression';
import { useLocalStorage } from '@/lib/storage';
import { cn, formatForInput, formatSmart } from '@/lib/utils';

type Mode = 'basic' | 'scientific';

interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
}

const MAX_HISTORY = 40;

interface KeyDef {
  label: string;
  /** Text inserted into the expression; defaults to the label. */
  insert?: string;
  kind?: 'number' | 'operator' | 'function' | 'equals' | 'clear';
  /** Grid span for wide keys. */
  wide?: boolean;
  action?: 'equals' | 'clear' | 'backspace';
}

const BASIC_KEYS: KeyDef[] = [
  { label: 'AC', kind: 'clear', action: 'clear' },
  { label: '(', kind: 'function' },
  { label: ')', kind: 'function' },
  { label: '÷', insert: '/', kind: 'operator' },

  { label: '7', kind: 'number' },
  { label: '8', kind: 'number' },
  { label: '9', kind: 'number' },
  { label: '×', insert: '*', kind: 'operator' },

  { label: '4', kind: 'number' },
  { label: '5', kind: 'number' },
  { label: '6', kind: 'number' },
  { label: '−', insert: '-', kind: 'operator' },

  { label: '1', kind: 'number' },
  { label: '2', kind: 'number' },
  { label: '3', kind: 'number' },
  { label: '+', kind: 'operator' },

  { label: '0', kind: 'number', wide: true },
  { label: '.', kind: 'number' },
  { label: '=', kind: 'equals', action: 'equals' },
];

const SCIENTIFIC_KEYS: KeyDef[] = [
  { label: 'sin', insert: 'sin(', kind: 'function' },
  { label: 'cos', insert: 'cos(', kind: 'function' },
  { label: 'tan', insert: 'tan(', kind: 'function' },
  { label: 'π', insert: 'pi', kind: 'function' },
  { label: 'e', insert: 'e', kind: 'function' },

  { label: 'asin', insert: 'asin(', kind: 'function' },
  { label: 'acos', insert: 'acos(', kind: 'function' },
  { label: 'atan', insert: 'atan(', kind: 'function' },
  { label: 'x²', insert: '^2', kind: 'function' },
  { label: 'xʸ', insert: '^', kind: 'function' },

  { label: 'ln', insert: 'ln(', kind: 'function' },
  { label: 'log', insert: 'log(', kind: 'function' },
  { label: 'log₂', insert: 'log2(', kind: 'function' },
  { label: '√', insert: 'sqrt(', kind: 'function' },
  { label: '∛', insert: 'cbrt(', kind: 'function' },

  { label: 'n!', insert: '!', kind: 'function' },
  { label: '|x|', insert: 'abs(', kind: 'function' },
  { label: 'eˣ', insert: 'exp(', kind: 'function' },
  { label: 'mod', insert: '%', kind: 'operator' },
  { label: '1/x', insert: '^-1', kind: 'function' },
];

const KEY_STYLES: Record<NonNullable<KeyDef['kind']>, string> = {
  number: 'bg-card text-fg hover:bg-card-hover border border-border',
  operator: 'bg-accent-soft text-accent-text hover:brightness-95 dark:hover:brightness-110',
  function: 'bg-bg-subtle text-fg-muted hover:text-fg hover:bg-card border border-border',
  equals: 'bg-accent text-accent-fg hover:brightness-110 shadow-sm',
  clear: 'bg-danger/10 text-danger hover:bg-danger/20',
};

export function Calculator() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('basic');
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');
  const [history, setHistory, historyReady] = useLocalStorage<HistoryEntry[]>('calculator:history', [], {
    validate: (value): value is HistoryEntry[] => Array.isArray(value),
  });

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Live preview of the current expression, shown under the input while typing.
  // Errors here are silent — a half-typed expression is not a mistake.
  const preview = expression.trim() === '' ? null : tryEvaluate(expression, angleMode);

  const insert = useCallback((text: string) => {
    setError(null);
    setExpression((current) => current + text);
    inputRef.current?.focus();
  }, []);

  const clear = useCallback(() => {
    setExpression('');
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  }, []);

  const backspace = useCallback(() => {
    setError(null);
    setExpression((current) => current.slice(0, -1));
  }, []);

  const evaluate = useCallback(() => {
    const trimmed = expression.trim();
    if (trimmed === '') return;

    try {
      const value = evaluateExpression(trimmed, angleMode);
      // Plain numeric form: the result is chained back into the expression input,
      // where a thousands separator would parse as an argument comma.
      const formatted = formatForInput(value, 12);

      setResult(formatted);
      setError(null);
      setHistory((current) =>
        [{ id: `${Date.now()}-${current.length}`, expression: trimmed, result: formatted }, ...current].slice(
          0,
          MAX_HISTORY,
        ),
      );
      // Chain from the result, which is what a calculator is expected to do.
      setExpression(formatted);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof ExpressionError ? caught.message : 'Could not evaluate that expression.');
    }
  }, [expression, angleMode, setHistory]);

  const handleKey = (key: KeyDef) => {
    if (key.action === 'equals') evaluate();
    else if (key.action === 'clear') clear();
    else if (key.action === 'backspace') backspace();
    else insert(key.insert ?? key.label);
  };

  // Escape clears from anywhere on the page, matching the old app's behaviour
  // that people were used to.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        clear();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clear]);

  return (
    <ToolColumns
      main={
        <Card flush className="overflow-hidden">
          {/* Display */}
          <div className="border-b border-border bg-bg-subtle px-5 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Segmented
                value={mode}
                onChange={setMode}
                ariaLabel="Calculator mode"
                options={[
                  { value: 'basic', label: 'Basic' },
                  { value: 'scientific', label: 'Scientific' },
                ]}
                size="sm"
              />
              {mode === 'scientific' && (
                <Segmented
                  value={angleMode}
                  onChange={setAngleMode}
                  ariaLabel="Angle unit"
                  options={[
                    { value: 'deg', label: 'DEG' },
                    { value: 'rad', label: 'RAD' },
                  ]}
                  size="sm"
                />
              )}
            </div>

            <label htmlFor="calc-input" className="sr-only">
              Expression
            </label>
            <input
              id="calc-input"
              ref={inputRef}
              value={expression}
              onChange={(event) => {
                setExpression(event.currentTarget.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  evaluate();
                }
              }}
              placeholder="0"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              aria-describedby="calc-readout"
              className="tabular w-full bg-transparent text-right font-mono text-[28px] font-light text-fg outline-none placeholder:text-fg-subtle sm:text-[34px]"
            />

            <div id="calc-readout" className="mt-1 min-h-6 text-right" aria-live="polite">
              {error ? (
                <span className="text-[13px] font-medium text-danger">{error}</span>
              ) : result !== null ? (
                <span className="tabular font-mono text-lg font-semibold text-accent-text">= {result}</span>
              ) : preview?.ok ? (
                <span className="tabular font-mono text-sm text-fg-subtle">= {formatSmart(preview.value, 10)}</span>
              ) : null}
            </div>
          </div>

          {/* Keypad */}
          <div className="p-4">
            {mode === 'scientific' && (
              <div className="mb-3 grid grid-cols-5 gap-2">
                {SCIENTIFIC_KEYS.map((key) => (
                  <CalcKey key={key.label} def={key} onPress={handleKey} compact />
                ))}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {BASIC_KEYS.map((key) => (
                <CalcKey key={key.label} def={key} onPress={handleKey} />
              ))}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="secondary" leadingIcon={<Delete />} onClick={backspace} disabled={expression === ''}>
                Backspace
              </Button>
              <CopyButton
                value={result ?? expression}
                label="Copy result"
                variant="secondary"
                size="md"
                disabled={result === null && expression === ''}
              />
            </div>

            <p className="mt-3 text-center text-[11px] text-fg-subtle">
              Type directly, or use the keypad. <kbd className="font-sans font-semibold">Enter</kbd> evaluates,{' '}
              <kbd className="font-sans font-semibold">Esc</kbd> clears.
            </p>
          </div>
        </Card>
      }
      side={
        <Card flush>
          <div className="px-5 pt-5">
            <CardHeader
              title="History"
              description={history.length > 0 ? 'Click any entry to reuse it.' : undefined}
              icon={<History />}
              actions={
                history.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    leadingIcon={<Trash2 />}
                    onClick={() => setHistory([])}
                    aria-label="Clear history"
                    className="text-fg-subtle hover:text-danger"
                  />
                ) : undefined
              }
            />
          </div>

          {!historyReady ? (
            // Render nothing until storage is read, so the prerendered HTML and
            // the hydrated result agree.
            <div className="h-24" />
          ) : history.length === 0 ? (
            <EmptyState
              icon={<History />}
              title="No calculations yet"
              description="Results you work out will collect here so you can reuse them."
              className="py-10"
            />
          ) : (
            <ul className="max-h-[26rem] divide-y divide-border overflow-y-auto px-2 pb-2">
              {history.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setExpression(entry.result);
                      setResult(null);
                      setError(null);
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-right transition-colors hover:bg-bg-subtle"
                  >
                    <span className="block truncate font-mono text-[11px] text-fg-subtle">{entry.expression}</span>
                    <span className="tabular block truncate font-mono text-sm font-semibold text-fg">
                      {entry.result}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      }
      sideWidth="sm"
    />
  );
}

function CalcKey({
  def,
  onPress,
  compact = false,
}: {
  def: KeyDef;
  onPress: (key: KeyDef) => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onPress(def)}
      className={cn(
        'flex items-center justify-center rounded-xl font-medium transition-[background-color,filter,transform] active:scale-[0.97]',
        compact ? 'h-10 text-[13px]' : 'h-14 text-lg',
        KEY_STYLES[def.kind ?? 'number'],
        def.wide && 'col-span-2',
      )}
    >
      {def.label}
    </button>
  );
}
