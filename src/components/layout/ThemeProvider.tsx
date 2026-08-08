'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes';
import type { ReactNode } from 'react';

import { useMounted } from '@/lib/hooks';
import { cn } from '@/lib/utils';

/**
 * next-themes writes the `class` on <html> before first paint via an inline
 * script, which is what prevents the flash of light theme on a dark-mode load.
 * `suppressHydrationWarning` on <html> in layout.tsx is required because of it.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemeProvider>
  );
}

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-xl border border-border bg-bg-subtle p-0.5',
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        // Before mount the resolved theme is unknown; rendering nothing as
        // active avoids asserting the wrong one and then correcting it.
        const active = mounted && theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-label={`${option.label} theme`}
            aria-pressed={active}
            title={`${option.label} theme`}
            className={cn(
              'grid size-7 place-items-center rounded-lg transition-colors',
              active ? 'bg-card text-accent-text shadow-sm' : 'text-fg-subtle hover:text-fg',
            )}
          >
            <Icon className="size-[15px]" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
