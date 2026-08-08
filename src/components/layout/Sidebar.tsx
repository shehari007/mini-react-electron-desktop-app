'use client';

import { Search, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { GithubMark } from '@/components/icons/GithubMark';
import { ToolIcon } from '@/components/ToolIcon';
import { Badge } from '@/components/ui/Feedback';
import { useElectron } from '@/lib/hooks';
import { SITE } from '@/lib/site';
import { accentFor, TOOL_COUNT, toolsByCategory, type Tool } from '@/lib/tools';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onOpenPalette: () => void;
}

/**
 * Primary navigation over all 36 tools, grouped by category.
 *
 * With this many destinations a flat list is unusable, so the sidebar is grouped
 * and paired with a filter box; the ⌘K palette is the faster path and the filter
 * here is for browsing. On mobile the whole thing becomes an overlay drawer.
 */
export function Sidebar({ open, onClose, onOpenPalette }: SidebarProps) {
  const pathname = usePathname();
  const electron = useElectron();
  const [filter, setFilter] = useState('');

  const groups = useMemo(() => {
    const query = filter.trim().toLowerCase();
    const all = toolsByCategory();
    if (!query) return all;

    // Match the name, the nav label and the keywords, so "hex" finds the number
    // base converter even though neither word appears in its title.
    const matches = (tool: Tool) =>
      tool.name.toLowerCase().includes(query) ||
      tool.navLabel.toLowerCase().includes(query) ||
      tool.keywords.some((keyword) => keyword.includes(query));

    return all
      .map((group) => ({ ...group, tools: group.tools.filter(matches) }))
      .filter((group) => group.tools.length > 0);
  }, [filter]);

  // Close the drawer on navigation, otherwise tapping a tool on mobile leaves
  // the overlay covering the page you just opened.
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const isActive = (slug: string) => pathname === `/${slug}` || pathname === `/${slug}/`;

  return (
    <>
      {/* Scrim. Rendered only when open so it never intercepts clicks otherwise. */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r border-border bg-card',
          'transition-transform duration-300 ease-out lg:translate-x-0',
          open ? 'translate-x-0 shadow-lift' : '-translate-x-full',
          // In Electron the custom title bar occupies the top strip, so the
          // sidebar starts below it rather than under the traffic lights.
          electron && 'lg:top-11',
        )}
        aria-label="Tool navigation"
      >
        <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5"
            data-accent="indigo"
            aria-label={`${SITE.name} home`}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-fg shadow-sm">
              <Zap className="size-[18px]" strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-bold leading-tight text-fg">{SITE.name}</span>
              <span className="block truncate text-[11px] leading-tight text-fg-subtle">
                {TOOL_COUNT} tools · v{SITE.version}
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-fg-subtle transition-colors hover:bg-bg-subtle hover:text-fg lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onOpenPalette}
            className="flex w-full items-center gap-2 rounded-xl border border-border bg-bg-subtle px-3 py-2 text-[13px] text-fg-subtle transition-colors hover:border-border-strong hover:text-fg-muted"
          >
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left">Search tools…</span>
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-sans text-[10px] font-semibold text-fg-subtle">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="px-3 pb-2">
          <label className="sr-only" htmlFor="sidebar-filter">
            Filter tools
          </label>
          <input
            id="sidebar-filter"
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.currentTarget.value)}
            placeholder="Filter this list"
            className="h-8 w-full rounded-lg border border-border bg-card px-2.5 text-[13px] text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {groups.length === 0 && (
            <p className="px-2 py-6 text-center text-[13px] text-fg-subtle">No tools match “{filter}”.</p>
          )}

          {groups.map(({ category, tools }) => (
            <div key={category.id} className="mb-4 last:mb-0">
              <h2 className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-fg-subtle">
                {category.label}
              </h2>
              <ul className="space-y-0.5">
                {tools.map((tool) => {
                  const active = isActive(tool.slug);
                  return (
                    <li key={tool.slug} data-accent={accentFor(tool)}>
                      <Link
                        href={`/${tool.slug}/`}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group flex items-center gap-2.5 rounded-lg px-2 py-[7px] text-[13px] transition-colors',
                          active
                            ? 'bg-accent-soft font-semibold text-accent-text'
                            : 'text-fg-muted hover:bg-bg-subtle hover:text-fg',
                        )}
                      >
                        <span
                          className={cn(
                            'shrink-0 transition-colors',
                            active ? 'text-accent-text' : 'text-fg-subtle group-hover:text-accent-text',
                          )}
                        >
                          <ToolIcon name={tool.icon} className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{tool.navLabel}</span>
                        {!tool.offline && (
                          <span
                            className="size-1.5 shrink-0 rounded-full bg-warning"
                            title="Needs an internet connection"
                            aria-label="Needs an internet connection"
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link href="/about/" className="text-[12px] font-medium text-fg-muted transition-colors hover:text-fg">
              About
            </Link>
            <div className="flex items-center gap-2">
              <Badge tone="success" className="text-[10px]">
                Offline ready
              </Badge>
              <a
                href={SITE.repo}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="View source on GitHub"
                className="text-fg-subtle transition-colors hover:text-fg"
              >
                <GithubMark className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
