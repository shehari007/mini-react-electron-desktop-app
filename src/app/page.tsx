import { ArrowRight, Lock, Search, Sparkles, WifiOff, Zap } from 'lucide-react';
import Link from 'next/link';

import { GithubMark } from '@/components/icons/GithubMark';
import { ToolIcon } from '@/components/ToolIcon';
import { Badge } from '@/components/ui/Feedback';
import { siteJsonLd } from '@/lib/seo';
import { SITE } from '@/lib/site';
import {
  accentFor,
  FEATURED_TOOLS,
  OFFLINE_TOOL_COUNT,
  TOOL_COUNT,
  toolsByCategory,
} from '@/lib/tools';

/**
 * The home page is a static server component — no 'use client' anywhere in it.
 * That matters: every tool name, description and category label ships as real
 * HTML, giving crawlers the full picture of the site from one document, and the
 * page needs no JavaScript at all to be useful.
 */

const PROMISES = [
  {
    icon: <WifiOff />,
    title: 'Works offline',
    body: `${OFFLINE_TOOL_COUNT} of ${TOOL_COUNT} tools need no connection at all. Install it once and it keeps working on a plane.`,
  },
  {
    icon: <Lock />,
    title: 'Stays on your device',
    body: 'No accounts, no analytics, no uploads. Notes, todos and everything you type live in your browser storage.',
  },
  {
    icon: <Zap />,
    title: 'Instant to load',
    body: 'A static site with per-tool code splitting, so opening a tool loads that tool and nothing else.',
  },
  {
    icon: <Sparkles />,
    title: 'No API keys',
    body: 'Even weather and currency work out of the box. Nothing to sign up for, nothing to configure.',
  },
] as const;

export default function HomePage() {
  const groups = toolsByCategory();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd(TOOL_COUNT)) }}
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        data-accent="indigo"
        className="accent-glow relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-12 sm:px-10 sm:py-16"
      >
        <div className="relative max-w-2xl">
          <Badge tone="accent" icon={<Sparkles />}>
            Version {SITE.version} — {TOOL_COUNT} tools
          </Badge>

          <h1 className="mt-4 text-[2rem] font-bold leading-[1.1] tracking-tight text-fg sm:text-5xl">
            Every small tool you need,{' '}
            <span className="text-gradient">in one fast app</span>
          </h1>

          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            Calculators, converters, developer utilities, timers, finance and health tools — {TOOL_COUNT} of
            them, all free. No signup, no API keys, nothing uploaded, and almost all of it works with no
            internet at all.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/calculator/"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-fg shadow-sm transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
            >
              Open the calculator
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href={SITE.repo}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold text-fg transition-colors hover:border-border-strong"
            >
              <GithubMark className="size-4" />
              Source on GitHub
            </a>
          </div>

          <p className="mt-5 flex items-center gap-1.5 text-[13px] text-fg-subtle">
            <Search className="size-3.5" aria-hidden="true" />
            Press{' '}
            <kbd className="rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-sans text-[11px] font-semibold text-fg-muted">
              ⌘K
            </kbd>{' '}
            anywhere to jump to a tool
          </p>
        </div>
      </section>

      {/* ── Why ──────────────────────────────────────────────────────── */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PROMISES.map((promise) => (
          <div key={promise.title} data-accent="indigo" className="card p-5">
            <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent-text [&_svg]:size-[18px]">
              {promise.icon}
            </span>
            <h2 className="mt-3 text-[14px] font-semibold text-fg">{promise.title}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{promise.body}</p>
          </div>
        ))}
      </section>

      {/* ── Popular ──────────────────────────────────────────────────── */}
      <section className="mt-12">
        <h2 className="text-lg font-bold tracking-tight text-fg">Most used</h2>
        <p className="mt-1 text-[13px] text-fg-muted">The tools people open first.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_TOOLS.map((tool) => (
            <Link
              key={tool.slug}
              href={`/${tool.slug}/`}
              data-accent={accentFor(tool)}
              className="card group flex items-start gap-3.5 p-5 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lift"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-text transition-colors group-hover:bg-accent group-hover:text-accent-fg [&_svg]:size-5">
                <ToolIcon name={tool.icon} className="size-auto" />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-fg">{tool.name}</span>
                <span className="mt-1 block text-[13px] leading-relaxed text-fg-muted">
                  {tool.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── All tools, by category ───────────────────────────────────── */}
      <section className="mt-12">
        <h2 className="text-lg font-bold tracking-tight text-fg">All {TOOL_COUNT} tools</h2>
        <p className="mt-1 text-[13px] text-fg-muted">
          Grouped by what they do. A dot marks the two that need a connection.
        </p>

        <div className="mt-5 space-y-8">
          {groups.map(({ category, tools }) => (
            <div key={category.id} data-accent={category.accent}>
              <div className="mb-3 flex items-center gap-2.5">
                <span className="size-2.5 rounded-full bg-accent" aria-hidden="true" />
                <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-fg">
                  {category.label}
                </h3>
                <span className="text-[12px] text-fg-subtle">{tools.length}</span>
              </div>

              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={`/${tool.slug}/`}
                      className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 transition-[border-color,background-color] hover:border-accent/50 hover:bg-accent-soft/50"
                    >
                      <span className="shrink-0 text-accent-text">
                        <ToolIcon name={tool.icon} className="size-[17px]" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg">
                        {tool.name}
                      </span>
                      {!tool.offline && (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-warning"
                          title="Needs an internet connection"
                          aria-label="Needs an internet connection"
                        />
                      )}
                      <ArrowRight
                        className="size-3.5 shrink-0 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Desktop ──────────────────────────────────────────────────── */}
      <section
        data-accent="violet"
        className="accent-glow mt-12 overflow-hidden rounded-3xl border border-border bg-card px-6 py-10 sm:px-10"
      >
        <div className="max-w-xl">
          <h2 className="text-xl font-bold tracking-tight text-fg">Also a desktop app</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
            The same {TOOL_COUNT} tools ship as a native app for Windows, macOS and Linux — a real window
            with its own menu bar and keyboard shortcuts, and no browser tab in the way. Or install this page
            as an app straight from your browser.
          </p>
          <a
            href={`${SITE.repo}/releases`}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-fg shadow-sm transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
          >
            Download for desktop
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <footer className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-[13px] text-fg-subtle sm:flex-row sm:items-center">
        <p>
          Built by{' '}
          <a
            href={SITE.author.github}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-fg-muted underline decoration-border underline-offset-2 transition-colors hover:text-fg"
          >
            {SITE.author.name}
          </a>
          . MIT licensed.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/about/" className="transition-colors hover:text-fg">
            About
          </Link>
          <a
            href={SITE.repo}
            target="_blank"
            rel="noreferrer noopener"
            className="transition-colors hover:text-fg"
          >
            GitHub
          </a>
          <a
            href={SITE.support}
            target="_blank"
            rel="noreferrer noopener"
            className="transition-colors hover:text-fg"
          >
            Support
          </a>
        </div>
      </footer>
    </div>
  );
}
