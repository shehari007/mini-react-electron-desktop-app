'use client';

import { Download, NotebookPen, Pin, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Controls';
import { CopyButton } from '@/components/ui/CopyButton';
import { EmptyState } from '@/components/ui/Feedback';
import { Input, Textarea } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useLocalStorage } from '@/lib/storage';
import { analyzeText } from '@/lib/text';
import { cn, downloadText, formatNumber, relativeTime, safeFilename, uid } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  updatedAt: number;
}

type View = 'write' | 'preview';

function isNoteArray(value: unknown): value is Note[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Note).id === 'string' &&
        typeof (item as Note).body === 'string',
    )
  );
}

/** First non-empty line, used when the note has no explicit title. */
function derivedTitle(note: Note): string {
  if (note.title.trim() !== '') return note.title;
  const firstLine = note.body.split('\n').find((line) => line.trim() !== '');
  return firstLine ? firstLine.replace(/^#+\s*/, '').slice(0, 60) : 'Untitled note';
}

export function Notes() {
  const [notes, setNotes, ready] = useLocalStorage<Note[]>('notes:list', [], { validate: isNoteArray });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('write');
  const [html, setHtml] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Sorted for display: pinned first, then most recently edited.
  const sorted = useMemo(
    () =>
      [...notes].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      }),
    [notes],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === '') return sorted;
    return sorted.filter(
      (note) =>
        note.title.toLowerCase().includes(needle) || note.body.toLowerCase().includes(needle),
    );
  }, [sorted, query]);

  // Keep a valid selection as notes are created, deleted or filtered away.
  useEffect(() => {
    if (!ready) return;
    if (activeId !== null && notes.some((note) => note.id === activeId)) return;
    setActiveId(sorted[0]?.id ?? null);
  }, [ready, notes, activeId, sorted]);

  const active = notes.find((note) => note.id === activeId) ?? null;

  const createNote = () => {
    const note: Note = { id: uid(), title: '', body: '', pinned: false, updatedAt: Date.now() };
    setNotes([note, ...notes]);
    setActiveId(note.id);
    setView('write');
  };

  const updateActive = (changes: Partial<Note>) => {
    if (!active) return;
    setNotes(
      notes.map((note) => (note.id === active.id ? { ...note, ...changes, updatedAt: Date.now() } : note)),
    );
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
    if (activeId === id) setActiveId(null);
  };

  // Markdown is rendered on demand, same sanitised path as the markdown tool.
  useEffect(() => {
    if (view !== 'preview' || !active || active.body === '') {
      setHtml('');
      return;
    }

    let cancelled = false;
    void (async () => {
      const [{ marked }, DOMPurify] = await Promise.all([
        import('marked'),
        import('dompurify').then((module) => module.default),
      ]);
      if (cancelled) return;
      const rendered = await marked.parse(active.body, { gfm: true, breaks: true });
      if (cancelled) return;
      setHtml(DOMPurify.sanitize(rendered, { USE_PROFILES: { html: true } }));
    })();

    return () => {
      cancelled = true;
    };
  }, [view, active]);

  const stats = active ? analyzeText(active.body) : null;

  return (
    <>
      <ToolColumns
        sideWidth="sm"
        main={
          active === null ? (
            <Card>
              <EmptyState
                icon={<NotebookPen />}
                title={ready && notes.length === 0 ? 'No notes yet' : 'Select a note'}
                description="Notes are saved in this browser only — no account, and nothing leaves your device."
                action={
                  <Button variant="primary" leadingIcon={<Plus />} onClick={createNote}>
                    New note
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card flush>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <label htmlFor="note-title" className="sr-only">
                    Note title
                  </label>
                  <input
                    id="note-title"
                    value={active.title}
                    onChange={(event) => updateActive({ title: event.currentTarget.value })}
                    placeholder={derivedTitle(active)}
                    className="w-full bg-transparent text-[15px] font-semibold text-fg outline-none placeholder:text-fg-subtle"
                  />
                  <p className="mt-0.5 text-[11px] text-fg-subtle">
                    Saved {relativeTime(active.updatedAt)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Segmented
                    value={view}
                    onChange={setView}
                    ariaLabel="Note view"
                    size="sm"
                    options={[
                      { value: 'write', label: 'Write' },
                      { value: 'preview', label: 'Preview' },
                    ]}
                  />
                  <Button
                    size="sm"
                    variant={active.pinned ? 'soft' : 'ghost'}
                    onClick={() => updateActive({ pinned: !active.pinned })}
                    aria-pressed={active.pinned}
                    aria-label={active.pinned ? 'Unpin this note' : 'Pin this note'}
                    leadingIcon={<Pin />}
                  />
                  <CopyButton value={active.body} ariaLabel="Copy note text" size="sm" />
                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={<Download />}
                    onClick={() =>
                      downloadText(active.body, `${safeFilename(derivedTitle(active), 'note')}.md`, 'text/markdown')
                    }
                    aria-label="Download this note"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    leadingIcon={<Trash2 />}
                    onClick={() => setConfirmDelete(active.id)}
                    aria-label="Delete this note"
                    className="text-fg-subtle hover:text-danger"
                  />
                </div>
              </div>

              <div className="p-4">
                {view === 'write' ? (
                  <>
                    <label htmlFor="note-body" className="sr-only">
                      Note content
                    </label>
                    <Textarea
                      id="note-body"
                      rows={20}
                      value={active.body}
                      onChange={(event) => updateActive({ body: event.currentTarget.value })}
                      placeholder="Start writing. Markdown is supported — switch to Preview to see it rendered."
                    />
                  </>
                ) : html === '' ? (
                  <p className="py-16 text-center text-[13px] text-fg-subtle">
                    This note is empty.
                  </p>
                ) : (
                  <div
                    dangerouslySetInnerHTML={{ __html: html }}
                    className="markdown-body max-h-[34rem] overflow-y-auto text-[14px] leading-relaxed text-fg"
                  />
                )}
              </div>

              {stats && (
                <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-border bg-bg-subtle px-5 py-2.5 text-[11px] text-fg-subtle">
                  <span>{formatNumber(stats.words, 0)} words</span>
                  <span>{formatNumber(stats.characters, 0)} characters</span>
                  <span>{formatNumber(stats.lines, 0)} lines</span>
                </div>
              )}
            </Card>
          )
        }
        side={
          <Card flush>
            <div className="border-b border-border px-4 py-3.5">
              <CardHeader
                title={`Notes${ready ? ` (${notes.length})` : ''}`}
                actions={
                  <Button size="sm" variant="primary" leadingIcon={<Plus />} onClick={createNote} aria-label="New note" />
                }
              />
              <Input
                inputSize="sm"
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Search notes"
                prefix={<Search />}
                aria-label="Search notes"
                className="mt-3"
              />
            </div>

            {!ready ? (
              <div className="h-40" />
            ) : filtered.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-fg-subtle">
                {notes.length === 0 ? 'No notes yet.' : `Nothing matches “${query}”.`}
              </p>
            ) : (
              <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto">
                {filtered.map((note) => (
                  <li key={note.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(note.id);
                        setView('write');
                      }}
                      className={cn(
                        'w-full px-4 py-3 text-left transition-colors',
                        note.id === activeId ? 'bg-accent-soft' : 'hover:bg-bg-subtle',
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {note.pinned && <Pin className="size-3 shrink-0 text-accent-text" aria-label="Pinned" />}
                        <span
                          className={cn(
                            'min-w-0 flex-1 truncate text-[13px] font-medium',
                            note.id === activeId ? 'text-accent-text' : 'text-fg',
                          )}
                        >
                          {derivedTitle(note)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-fg-subtle">
                        {note.body.trim().split('\n')[0]?.slice(0, 60) || 'Empty note'}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-fg-subtle">
                        {relativeTime(note.updatedAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {ready && notes.length > 0 && (
              <div className="border-t border-border px-4 py-3">
                <Button
                  size="sm"
                  variant="ghost"
                  fullWidth
                  leadingIcon={<Download />}
                  onClick={() =>
                    downloadText(
                      JSON.stringify({ exportedAt: new Date().toISOString(), notes }, null, 2),
                      'appbox-notes.json',
                      'application/json',
                    )
                  }
                >
                  Export all notes
                </Button>
              </div>
            )}
          </Card>
        }
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && deleteNote(confirmDelete)}
        title="Delete this note?"
        message="This removes the note from this device permanently. It cannot be undone."
        confirmLabel="Delete note"
      />
    </>
  );
}
