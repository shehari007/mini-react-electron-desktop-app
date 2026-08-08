import { ChevronRight, WifiOff, Zap } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { ToolIconTile } from '@/components/ToolIcon';
import { Badge } from '@/components/ui/Feedback';
import { breadcrumbJsonLd, toolJsonLd } from '@/lib/seo';
import { accentFor, getCategory, type Tool } from '@/lib/tools';
import { cn } from '@/lib/utils';

export interface ToolShellProps {
  tool: Tool;
  children: ReactNode;
  /** Extra content rendered under the tool, above the About block. */
  footer?: ReactNode;
}

/**
 * The frame every tool page shares: breadcrumb, heading, offline badge, the
 * structured data, and the indexable "about" prose.
 *
 * Setting `data-accent` here is what makes each tool visually distinct — every
 * accent-colored element inside inherits its category's palette from this one
 * attribute, so tool components never reference a color directly.
 */
export function ToolShell({ tool, children, footer }: ToolShellProps) {
  const category = getCategory(tool.category);
  const accent = accentFor(tool);

  return (
    <div data-accent={accent} className="mx-auto w-full max-w-6xl px-4 pb-16 pt-5 sm:px-6 lg:px-8">
      {/* Two separate JSON-LD blocks rather than a @graph: simpler to reason
          about, and each validates independently in Google's tester. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd(tool)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: tool.name, path: `/${tool.slug}` },
            ]),
          ),
        }}
      />

      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-1 text-[13px] text-fg-subtle">
          <li>
            <Link href="/" className="transition-colors hover:text-fg">
              Home
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <li className="text-fg-muted">{category.label}</li>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <li aria-current="page" className="truncate font-medium text-fg">
            {tool.name}
          </li>
        </ol>
      </nav>

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <ToolIconTile name={tool.icon} size="lg" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-[1.75rem]">{tool.name}</h1>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-fg-muted sm:text-sm">
              {tool.description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {tool.offline ? (
            <Badge tone="success" icon={<Zap />}>
              Works offline
            </Badge>
          ) : (
            <Badge tone="warning" icon={<WifiOff />}>
              Needs internet
            </Badge>
          )}
          <Badge tone="accent">{category.label}</Badge>
        </div>
      </header>

      <div className="space-y-5">{children}</div>

      {footer}

      {/* Real prose on every route. Without it these pages are a handful of
          inputs and nothing for a search engine to rank. */}
      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-base font-semibold text-fg">About the {tool.name.toLowerCase()}</h2>
        <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-fg-muted">{tool.about}</p>
        <p className="mt-4 max-w-3xl text-[13px] leading-relaxed text-fg-subtle">
          {tool.offline
            ? 'This tool runs entirely in your browser. Nothing you type is uploaded, and it keeps working with no connection at all — including as an installed app.'
            : 'This tool needs a connection to fetch fresh data, and caches the last result so it still shows something useful offline. No account or API key is required.'}
        </p>
      </section>
    </div>
  );
}

/**
 * Two-column layout used by tools with a primary panel and a secondary side
 * panel (calculator + history, converter + reference table). Collapses to one
 * column below `lg`, where a side-by-side split stops being readable.
 */
export function ToolColumns({
  main,
  side,
  sideWidth = 'md',
  className,
}: {
  main: ReactNode;
  side: ReactNode;
  sideWidth?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid items-start gap-5',
        sideWidth === 'sm' ? 'lg:grid-cols-[1fr_18rem]' : 'lg:grid-cols-[1fr_22rem]',
        className,
      )}
    >
      <div className="min-w-0 space-y-5">{main}</div>
      <div className="min-w-0 space-y-5">{side}</div>
    </div>
  );
}
