import type { Metadata } from 'next';
import { Heart, Mail } from 'lucide-react';
import Link from 'next/link';

import { AppVersionInfo } from '@/components/AppVersionInfo';
import { GithubMark } from '@/components/icons/GithubMark';
import { DataStorageSettings } from '@/components/DataStorageSettings';
import { pageMetadata } from '@/lib/seo';
import { SITE } from '@/lib/site';
import { CATEGORIES, OFFLINE_TOOL_COUNT, TOOL_COUNT, toolsByCategory } from '@/lib/tools';

export const metadata: Metadata = pageMetadata({
  title: 'About AppBox',
  description: `What AppBox is, how it handles your data, and what it's built with. ${TOOL_COUNT} free offline-first utilities, MIT licensed.`,
  path: '/about',
  keywords: ['about appbox', 'privacy', 'open source tools', 'offline utility app'],
});

const STACK = [
  { name: 'Next.js 16', role: 'App Router, exported as a fully static site' },
  { name: 'React 19', role: 'UI, with server components for every static page' },
  { name: 'TypeScript', role: 'Strict mode across the app and the Electron layer' },
  { name: 'Tailwind CSS v4', role: 'CSS-first design tokens, light and dark' },
  { name: 'Electron 43', role: 'Desktop shell, sandboxed with context isolation' },
  { name: 'Vite', role: 'Compiles the Electron main and preload processes' },
] as const;

export default function AboutPage() {
  const groups = toolsByCategory();

  return (
    <div data-accent="indigo" className="mx-auto w-full max-w-4xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-fg">About AppBox</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-fg-muted">
          {TOOL_COUNT} small utilities that would each be a separate browser tab, collected into one app that
          loads instantly and works without a connection.
        </p>
      </header>

      <section className="card p-6">
        <h2 className="text-base font-semibold text-fg">Why it exists</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-fg-muted">
          <p>
            Most single-purpose online tools are the same shape: a couple of inputs, one number out, and
            several megabytes of ads and trackers around them. AppBox is the opposite trade — one app, no
            ads, no analytics, no account, and the computation happens on your device.
          </p>
          <p>
            That constraint is what makes the offline story real rather than marketing. {OFFLINE_TOOL_COUNT} of
            the {TOOL_COUNT} tools never touch the network, because there is nothing they need a server for. The
            two that do — weather and currency rates — use free, key-less APIs and cache their last result, so
            they still show you something useful on a train.
          </p>
        </div>
      </section>

      <section className="card mt-5 p-6">
        <h2 className="text-base font-semibold text-fg">Your data</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-fg-muted">
          <p>
            Anything you save — todos, notes, world-clock cities, calculator history, tracked water intake —
            is written to your browser&apos;s local storage on this device. It is never sent anywhere, and there
            is no server holding a copy. Clearing your browser data, or using the button below, removes it
            permanently.
          </p>
          <p>
            There is no analytics script, no cookie banner, and no third-party embed on any page. The only
            outbound requests the app ever makes are the two weather and currency lookups, and only when you
            open those tools.
          </p>
        </div>

        <DataStorageSettings className="mt-5" />
      </section>

      <section className="card mt-5 p-6">
        <h2 className="text-base font-semibold text-fg">What&apos;s inside</h2>
        <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {groups.map(({ category, tools }) => (
            <li key={category.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-fg-muted">{category.label}</span>
              <span className="tabular font-semibold text-fg">{tools.length}</span>
            </li>
          ))}
          <li className="col-span-full mt-1 flex items-baseline justify-between gap-3 border-t border-border pt-2 text-sm">
            <span className="font-semibold text-fg">Total across {CATEGORIES.length} categories</span>
            <span className="tabular font-bold text-accent-text">{TOOL_COUNT}</span>
          </li>
        </ul>
      </section>

      <section className="card mt-5 p-6">
        <h2 className="text-base font-semibold text-fg">Built with</h2>
        <dl className="mt-3 divide-y divide-border">
          {STACK.map((item) => (
            <div key={item.name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-sm font-medium text-fg">{item.name}</dt>
              <dd className="text-[13px] text-fg-muted">{item.role}</dd>
            </div>
          ))}
        </dl>
        <AppVersionInfo className="mt-5" />
      </section>

      <section className="card mt-5 p-6">
        <h2 className="text-base font-semibold text-fg">Author</h2>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">
          Built and maintained by {SITE.author.name}. AppBox is open source under the MIT licence — issues,
          ideas and pull requests are all welcome.
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <a
            href={SITE.repo}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-[13px] font-semibold text-fg transition-colors hover:border-border-strong"
          >
            <GithubMark className="size-4" />
            GitHub
          </a>
          <a
            href={`mailto:${SITE.author.email}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-[13px] font-semibold text-fg transition-colors hover:border-border-strong"
          >
            <Mail className="size-4" aria-hidden="true" />
            Email
          </a>
          <a
            href={SITE.support}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-[13px] font-semibold text-accent-fg transition-[filter] hover:brightness-110"
          >
            <Heart className="size-4" aria-hidden="true" />
            Buy me a coffee
          </a>
        </div>
      </section>

      <p className="mt-8 text-center text-[13px] text-fg-subtle">
        <Link href="/" className="transition-colors hover:text-fg">
          ← Back to all tools
        </Link>
      </p>
    </div>
  );
}
