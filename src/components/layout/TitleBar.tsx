'use client';

import { Copy, Minus, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/layout/ThemeProvider';
import { SITE } from '@/lib/site';
import { cn } from '@/lib/utils';
import type { AppBoxBridge } from '@/types/appbox-bridge';

/**
 * The custom title bar for the frameless desktop window.
 *
 * On macOS the native traffic lights are kept (inset by the main process), so
 * this renders only the drag strip and leaves room on the left for them. On
 * Windows and Linux the window has no frame at all and this draws the
 * minimise/maximise/close buttons.
 */
export function TitleBar({ bridge }: { bridge: AppBoxBridge }) {
  const isMac = bridge.platform === 'darwin';
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    void bridge.window.isMaximized().then(setMaximized);
    // Subscribe to real window events so the icon is right even when the state
    // changed without us — a title-bar double-click, or Win+Up.
    return bridge.window.onStateChange((state) => setMaximized(state.maximized));
  }, [bridge]);

  return (
    <div
      className={cn(
        'drag-region fixed inset-x-0 top-0 z-50 flex h-11 items-center gap-3 border-b border-border bg-card/90 backdrop-blur',
        isMac ? 'pl-20 pr-3' : 'pl-4 pr-0',
      )}
    >
      <span className="pointer-events-none select-none text-[12px] font-semibold text-fg-muted">
        {SITE.name}
      </span>
      <span className="pointer-events-none select-none text-[11px] text-fg-subtle">v{SITE.version}</span>

      <div className="flex-1" />

      <div className="no-drag flex items-center">
        <ThemeToggle className="mr-2" />
      </div>

      {!isMac && (
        <div className="no-drag flex h-full items-stretch">
          <WindowButton onClick={() => bridge.window.minimize()} label="Minimize">
            <Minus className="size-3.5" />
          </WindowButton>
          <WindowButton
            onClick={() => bridge.window.toggleMaximize()}
            label={maximized ? 'Restore' : 'Maximize'}
          >
            {maximized ? <Copy className="size-3" /> : <Square className="size-3" />}
          </WindowButton>
          <WindowButton onClick={() => bridge.window.close()} label="Close" danger>
            <X className="size-3.5" />
          </WindowButton>
        </div>
      )}
    </div>
  );
}

function WindowButton({
  onClick,
  label,
  danger = false,
  children,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'grid w-[46px] place-items-center text-fg-muted transition-colors',
        danger ? 'hover:bg-danger hover:text-white' : 'hover:bg-bg-subtle hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}
