import { ArrowLeft, SearchX } from 'lucide-react';
import Link from 'next/link';

import { ToolIcon } from '@/components/ToolIcon';
import { accentFor, FEATURED_TOOLS } from '@/lib/tools';

export default function NotFound() {
  return (
    <div data-accent="indigo" className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-accent-soft text-accent-text">
        <SearchX className="size-7" aria-hidden="true" />
      </span>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-fg">This page doesn&apos;t exist</h1>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        The tool you were looking for may have been renamed or moved. Try one of these, or press{' '}
        <kbd className="rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-sans text-[11px] font-semibold text-fg-muted">
          ⌘K
        </kbd>{' '}
        to search everything.
      </p>

      <ul className="mt-8 grid w-full gap-2 sm:grid-cols-2">
        {FEATURED_TOOLS.map((tool) => (
          <li key={tool.slug} data-accent={accentFor(tool)}>
            <Link
              href={`/${tool.slug}/`}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 text-left transition-colors hover:border-accent/50 hover:bg-accent-soft/50"
            >
              <span className="shrink-0 text-accent-text">
                <ToolIcon name={tool.icon} className="size-4" />
              </span>
              <span className="min-w-0 truncate text-[13px] font-medium text-fg">{tool.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/"
        className="mt-8 inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-[13px] font-semibold text-fg transition-colors hover:border-border-strong"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to all tools
      </Link>
    </div>
  );
}
