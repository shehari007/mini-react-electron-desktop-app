'use client';

import { ArrowDown, ArrowUp, Check, Download, ListChecks, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Controls';
import { Badge, EmptyState } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { useLocalStorage } from '@/lib/storage';
import { cn, downloadText, formatNumber, uid } from '@/lib/utils';

type Priority = 'low' | 'normal' | 'high';
type Filter = 'all' | 'active' | 'completed' | 'overdue';

interface Todo {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
  /** ISO yyyy-mm-dd, or null when no date was set. */
  due: string | null;
  createdAt: number;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low priority' },
  { value: 'normal', label: 'Normal priority' },
  { value: 'high', label: 'High priority' },
];

const PRIORITY_STYLES: Record<Priority, { tone: 'neutral' | 'accent' | 'danger'; label: string }> = {
  low: { tone: 'neutral', label: 'Low' },
  normal: { tone: 'accent', label: 'Normal' },
  high: { tone: 'danger', label: 'High' },
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function isTodoArray(value: unknown): value is Todo[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Todo).id === 'string' &&
        typeof (item as Todo).text === 'string' &&
        typeof (item as Todo).done === 'boolean',
    )
  );
}

export function TodoList() {
  const { toast } = useToast();
  const [todos, setTodos, ready] = useLocalStorage<Todo[]>('todos:list', [], { validate: isTodoArray });

  const [draft, setDraft] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [due, setDue] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState<'done' | 'all' | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  const add = () => {
    const text = draft.trim();
    if (text === '') return;

    setTodos([
      { id: uid(), text, done: false, priority, due: due === '' ? null : due, createdAt: Date.now() },
      ...todos,
    ]);
    setDraft('');
    setDue('');
    setPriority('normal');
  };

  const toggle = (id: string) =>
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));

  const remove = (id: string) => setTodos(todos.filter((todo) => todo.id !== id));

  const move = (id: string, direction: -1 | 1) => {
    const index = todos.findIndex((todo) => todo.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= todos.length) return;

    const next = [...todos];
    // Swap in place; the list order is the user's own priority ordering.
    [next[index], next[target]] = [next[target] as Todo, next[index] as Todo];
    setTodos(next);
  };

  const isOverdue = (todo: Todo) => !todo.done && todo.due !== null && todo.due < todayIso();
  const isDueToday = (todo: Todo) => !todo.done && todo.due === todayIso();

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return todos.filter((todo) => {
      if (needle !== '' && !todo.text.toLowerCase().includes(needle)) return false;
      if (filter === 'active') return !todo.done;
      if (filter === 'completed') return todo.done;
      if (filter === 'overdue') return isOverdue(todo);
      return true;
    });
  }, [todos, filter, query]);

  const counts = useMemo(
    () => ({
      total: todos.length,
      active: todos.filter((todo) => !todo.done).length,
      done: todos.filter((todo) => todo.done).length,
      overdue: todos.filter(isOverdue).length,
    }),
    [todos],
  );

  const handleImport = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      // Accept both a bare array and the shape our own export produces.
      const list = isTodoArray(parsed)
        ? parsed
        : typeof parsed === 'object' && parsed !== null && isTodoArray((parsed as { todos?: unknown }).todos)
          ? ((parsed as { todos: Todo[] }).todos)
          : null;

      if (!list) {
        toast('That file does not contain a task list', { tone: 'danger' });
        return;
      }

      setTodos(list);
      toast(`Imported ${formatNumber(list.length, 0)} tasks`, { tone: 'success' });
    } catch {
      toast('Could not read that file', { tone: 'danger', description: 'It needs to be valid JSON.' });
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Add a task" icon={<ListChecks />} />

        <div className="mt-4 space-y-3">
          <Field label="What needs doing?">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  add();
                }
              }}
              placeholder="Write the release notes"
              inputSize="lg"
            />
          </Field>

          <div className="flex flex-wrap items-end gap-3">
            <Field label="Priority" className="min-w-40 flex-1">
              <Select
                options={PRIORITY_OPTIONS}
                value={priority}
                onChange={(event) => setPriority(event.currentTarget.value as Priority)}
              />
            </Field>
            <Field label="Due date (optional)" className="min-w-40 flex-1">
              <Input type="date" value={due} onChange={(event) => setDue(event.currentTarget.value)} />
            </Field>
            <Button variant="primary" leadingIcon={<Plus />} onClick={add} disabled={draft.trim() === ''}>
              Add task
            </Button>
          </div>
        </div>
      </Card>

      {ready && counts.total > 0 && (
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Total" value={formatNumber(counts.total, 0)} />
          <Stat label="Active" value={formatNumber(counts.active, 0)} />
          <Stat label="Done" value={formatNumber(counts.done, 0)} />
          <Stat label="Overdue" value={formatNumber(counts.overdue, 0)} />
        </div>
      )}

      <Card flush>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <Segmented
            value={filter}
            onChange={setFilter}
            ariaLabel="Filter tasks"
            size="sm"
            options={[
              { value: 'all', label: `All${ready ? ` ${counts.total}` : ''}` },
              { value: 'active', label: `Active${ready ? ` ${counts.active}` : ''}` },
              { value: 'completed', label: `Done${ready ? ` ${counts.done}` : ''}` },
              { value: 'overdue', label: `Overdue${ready && counts.overdue > 0 ? ` ${counts.overdue}` : ''}` },
            ]}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Input
              inputSize="sm"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search tasks"
              prefix={<Search />}
              aria-label="Search tasks"
              className="w-40"
            />
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) void handleImport(file);
                event.currentTarget.value = '';
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              leadingIcon={<Upload />}
              onClick={() => importRef.current?.click()}
              aria-label="Import tasks from JSON"
            />
            <Button
              size="sm"
              variant="ghost"
              leadingIcon={<Download />}
              onClick={() =>
                downloadText(
                  JSON.stringify({ exportedAt: new Date().toISOString(), todos }, null, 2),
                  'appbox-todos.json',
                  'application/json',
                )
              }
              disabled={counts.total === 0}
              aria-label="Export tasks as JSON"
            />
          </div>
        </div>

        {!ready ? (
          <div className="h-40" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<ListChecks />}
            title={counts.total === 0 ? 'No tasks yet' : 'Nothing matches this filter'}
            description={
              counts.total === 0
                ? 'Add your first task above. Everything is saved on this device only.'
                : 'Try a different filter or clear the search.'
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((todo) => {
              const overdue = isOverdue(todo);
              const dueToday = isDueToday(todo);
              const listIndex = todos.findIndex((item) => item.id === todo.id);

              return (
                <li
                  key={todo.id}
                  className={cn('group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-bg-subtle/60', todo.done && 'opacity-60')}
                >
                  <button
                    type="button"
                    onClick={() => toggle(todo.id)}
                    role="checkbox"
                    aria-checked={todo.done}
                    aria-label={todo.done ? `Mark "${todo.text}" as not done` : `Mark "${todo.text}" as done`}
                    className={cn(
                      'mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors',
                      todo.done
                        ? 'border-accent bg-accent text-accent-fg'
                        : 'border-border-strong hover:border-accent',
                    )}
                  >
                    {todo.done && <Check className="size-3.5" strokeWidth={3} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={cn('text-[14px] text-fg', todo.done && 'line-through')}>{todo.text}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {todo.priority !== 'normal' && (
                        <Badge tone={PRIORITY_STYLES[todo.priority].tone}>
                          {PRIORITY_STYLES[todo.priority].label}
                        </Badge>
                      )}
                      {todo.due && (
                        <Badge tone={overdue ? 'danger' : dueToday ? 'warning' : 'neutral'}>
                          {overdue ? 'Overdue · ' : dueToday ? 'Due today' : 'Due '}
                          {!dueToday &&
                            new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(
                              new Date(`${todo.due}T00:00:00`),
                            )}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => move(todo.id, -1)}
                      disabled={listIndex <= 0}
                      aria-label={`Move "${todo.text}" up`}
                      className="rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-card hover:text-fg disabled:opacity-30"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(todo.id, 1)}
                      disabled={listIndex >= todos.length - 1}
                      aria-label={`Move "${todo.text}" down`}
                      className="rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-card hover:text-fg disabled:opacity-30"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(todo.id)}
                      aria-label={`Delete "${todo.text}"`}
                      className="rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {ready && counts.total > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-bg-subtle px-5 py-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmClear('done')}
              disabled={counts.done === 0}
            >
              Clear completed
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmClear('all')}
              className="text-danger hover:bg-danger/10"
            >
              Delete all
            </Button>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmClear !== null}
        onClose={() => setConfirmClear(null)}
        onConfirm={() => {
          if (confirmClear === 'done') {
            setTodos(todos.filter((todo) => !todo.done));
            toast('Completed tasks removed', { tone: 'success' });
          } else {
            setTodos([]);
            toast('All tasks deleted', { tone: 'success' });
          }
        }}
        title={confirmClear === 'done' ? 'Clear completed tasks?' : 'Delete every task?'}
        message={
          confirmClear === 'done'
            ? `This removes the ${counts.done} completed ${counts.done === 1 ? 'task' : 'tasks'} permanently.`
            : `This deletes all ${counts.total} tasks from this device permanently. Export a backup first if you want to keep them.`
        }
        confirmLabel={confirmClear === 'done' ? 'Clear completed' : 'Delete everything'}
      />
    </div>
  );
}
