'use client';

import { CornerDownLeft, Search, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ToolIcon } from '@/components/ToolIcon';
import { useScrollLock } from '@/lib/hooks';
import { accentFor, getCategory, TOOL_COUNT, TOOLS, type Tool } from '@/lib/tools';
import { cn } from '@/lib/utils';

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Rank tools against a query.
 *
 * Deliberately not a fuzzy subsequence match: with 36 short names, substring
 * matching plus a prefix bonus gives predictable results, whereas fuzzy matching
 * surfaces surprising hits ("csv" matching "Compound Interest Calculator" via
 * scattered letters) that make the palette feel unreliable.
 */
function search(query: string): Tool[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...TOOLS];

  const scored: Array<{ tool: Tool; score: number }> = [];

  for (const tool of TOOLS) {
    const name = tool.name.toLowerCase();
    const nav = tool.navLabel.toLowerCase();
    let score = 0;

    if (name === q || nav === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (nav.startsWith(q)) score = 70;
    else if (tool.keywords.some((k) => k === q)) score = 60;
    else if (name.includes(q)) score = 55;
    else if (tool.keywords.some((k) => k.startsWith(q))) score = 45;
    else if (tool.keywords.some((k) => k.includes(q))) score = 30;
    else if (tool.description.toLowerCase().includes(q)) score = 15;

    if (score > 0) scored.push({ tool, score });
  }

  // Stable tie-break on name keeps the order from jittering as you type.
  return scored
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .map((entry) => entry.tool);
}

/**
 * Mount gate.
 *
 * The panel's state lives one level down so closing the palette unmounts it
 * entirely. That is what resets the query and selection — an effect that cleared
 * them on every `open` change would do the same thing less directly, and would
 * set state during an effect for no reason.
 */
export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  if (!open) return null;
  return <PalettePanel onClose={onClose} />;
}

function PalettePanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => search(query), [query]);
  // Guard against a stale index when the result list shrinks as you type.
  const selectedIndex = Math.min(activeIndex, Math.max(0, results.length - 1));
  const activeTool = results[selectedIndex];

  useScrollLock(true);

  // Focus after paint; focusing in the same tick loses to the open animation.
  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => (results.length === 0 ? 0 : (index + 1) % results.length));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => (results.length === 0 ? 0 : (index - 1 + results.length) % results.length));
        return;
      }
      if (event.key === 'Enter') {
        if (!activeTool) return;
        event.preventDefault();
        onClose();
        router.push(`/${activeTool.slug}/`);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [results, activeTool, onClose, router]);

  const openTool = (tool: Tool) => {
    onClose();
    router.push(`/${tool.slug}/`);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/45 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        className="card flex max-h-[70vh] w-full max-w-lg animate-pop-in flex-col overflow-hidden p-0 shadow-lift"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setActiveIndex(0);
            }}
            placeholder={`Search ${TOOL_COUNT} tools…`}
            aria-label="Search tools"
            role="combobox"
            aria-expanded
            aria-controls="palette-results"
            aria-activedescendant={activeTool ? `palette-${activeTool.slug}` : undefined}
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-4 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
          />
          <kbd className="shrink-0 rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-sans text-[10px] font-semibold text-fg-subtle">
            ESC
          </kbd>
        </div>

        {results.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-fg-subtle">No tools match “{query}”.</p>
        ) : (
          <ul id="palette-results" ref={listRef} role="listbox" className="min-h-0 flex-1 overflow-y-auto p-2">
            {results.map((tool, index) => {
              const active = index === selectedIndex;
              return (
                <li key={tool.slug} data-accent={accentFor(tool)}>
                  <button
                    type="button"
                    id={`palette-${tool.slug}`}
                    role="option"
                    aria-selected={active}
                    data-active={active}
                    // Pointer move rather than enter: with the keyboard driving
                    // selection, `enter` fires spuriously as the list scrolls
                    // under a stationary cursor.
                    onPointerMove={() => setActiveIndex(index)}
                    onClick={() => openTool(tool)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
                      active ? 'bg-accent-soft' : 'hover:bg-bg-subtle',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-lg',
                        active ? 'bg-accent text-accent-fg' : 'bg-bg-subtle text-fg-subtle',
                      )}
                    >
                      <ToolIcon name={tool.icon} className="size-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-[13px] font-medium',
                          active ? 'text-accent-text' : 'text-fg',
                        )}
                      >
                        {tool.name}
                      </span>
                      <span className="block truncate text-[11px] text-fg-subtle">
                        {getCategory(tool.category).label}
                        {!tool.offline && (
                          <>
                            {' · '}
                            <WifiOff className="inline size-3 align-[-2px]" aria-hidden="true" /> needs internet
                          </>
                        )}
                      </span>
                    </span>

                    {active && <CornerDownLeft className="size-3.5 shrink-0 text-accent-text" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border bg-bg-subtle px-4 py-2 text-[11px] text-fg-subtle">
          <span>
            {results.length} {results.length === 1 ? 'tool' : 'tools'}
          </span>
          <span className="flex items-center gap-3">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
          </span>
        </div>
      </div>
    </div>
  );
}
