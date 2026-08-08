'use client';

import { Menu, Search, WifiOff, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { CommandPalette } from '@/components/layout/CommandPalette';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeToggle } from '@/components/layout/ThemeProvider';
import { TitleBar } from '@/components/layout/TitleBar';
import { useElectron, useHotkey, useMediaQuery, useOnline } from '@/lib/hooks';
import { SITE } from '@/lib/site';
import { OFFLINE_TOOL_COUNT, TOOL_COUNT } from '@/lib/tools';
import { cn } from '@/lib/utils';

/**
 * The persistent frame around every route: title bar (desktop), sidebar, mobile
 * header, command palette and the offline indicator.
 *
 * One shell for both targets. The only Electron-specific pieces are the title
 * bar and the native-menu navigation listener, both gated on the bridge being
 * present, so the web build ships neither.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const electron = useElectron();
  const online = useOnline();
  const isDesktopWidth = useMediaQuery('(min-width: 1024px)');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openPalette = useCallback(() => {
    setSidebarOpen(false);
    setPaletteOpen(true);
  }, []);

  useHotkey(
    'k',
    (event) => {
      event.preventDefault();
      setPaletteOpen((current) => !current);
    },
    { ctrlOrMeta: true, allowInInput: true },
  );

  // "/" is the convention for jump-to-search; allowInInput stays false so it
  // still types a slash inside a text field.
  useHotkey('/', (event) => {
    event.preventDefault();
    setPaletteOpen(true);
  });

  // The native Tools menu sends paths over IPC. `?palette=1` is the menu's way
  // of asking for the palette, since it has no other channel into the renderer.
  useEffect(() => {
    if (!electron) return;
    return electron.onNavigate((path) => {
      if (path.includes('palette=1')) {
        setPaletteOpen(true);
        return;
      }
      router.push(path);
    });
  }, [electron, router]);

  return (
    <div className={cn('min-h-dvh', electron && 'pt-11')}>
      {/* Lets keyboard users jump past 36 sidebar links to the tool itself. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-fg"
      >
        Skip to content
      </a>

      {electron && <TitleBar bridge={electron} />}

      <Sidebar open={sidebarOpen || isDesktopWidth} onClose={closeSidebar} onOpenPalette={openPalette} />

      <div className="lg:pl-[17rem]">
        {/* Mobile/tablet header. The desktop layout has no top bar — the sidebar
            and each tool's own <h1> carry the context instead. */}
        <header
          className={cn(
            'sticky z-20 flex h-14 items-center gap-2 border-b border-border bg-bg/85 px-3 backdrop-blur lg:hidden',
            electron ? 'top-11' : 'top-0',
          )}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-fg-muted transition-colors hover:text-fg"
          >
            <Menu className="size-[18px]" />
          </button>

          <Link href="/" className="flex min-w-0 items-center gap-2" data-accent="indigo">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-accent-fg">
              <Zap className="size-4" strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className="truncate text-sm font-bold text-fg">{SITE.name}</span>
          </Link>

          <div className="flex-1" />

          <button
            type="button"
            onClick={openPalette}
            aria-label="Search tools"
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-fg-muted transition-colors hover:text-fg"
          >
            <Search className="size-[18px]" />
          </button>

          {!electron && <ThemeToggle />}
        </header>

        {/* On desktop web there's no title bar, so the theme toggle floats. */}
        {!electron && (
          <div className="pointer-events-none fixed right-5 top-4 z-20 hidden lg:block">
            <div className="pointer-events-auto">
              <ThemeToggle />
            </div>
          </div>
        )}

        <main id="main" className="min-h-[calc(100dvh-3.5rem)]">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Global offline indicator. Most tools don't care, but it explains why
          Weather and Currency are showing cached numbers. */}
      {!online && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-full border border-warning/35 bg-warning/15 px-3.5 py-1.5 text-[12px] font-medium text-warning shadow-lift backdrop-blur"
        >
          <WifiOff className="size-3.5" aria-hidden="true" />
          Offline — {OFFLINE_TOOL_COUNT} of {TOOL_COUNT} tools still work
        </div>
      )}
    </div>
  );
}
