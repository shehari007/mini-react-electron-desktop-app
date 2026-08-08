'use client';

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { cn, uid } from '@/lib/utils';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
  description?: string;
}

interface ToastContextValue {
  toast: (
    message: string,
    options?: { tone?: ToastTone; description?: string; durationMs?: number },
  ) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Throws when used outside the provider — a silent no-op would hide a real
 *  wiring mistake behind "the toast just didn't show". */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within <ToastProvider>');
  return context;
}

const TONE_ICONS: Record<ToastTone, ReactNode> = {
  info: <Info />,
  success: <CheckCircle2 />,
  warning: <AlertTriangle />,
  danger: <XCircle />,
};

const TONE_STYLES: Record<ToastTone, string> = {
  info: 'text-accent-text',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback<ToastContextValue['toast']>(
    (message, options = {}) => {
      const { tone = 'info', description, durationMs = 3600 } = options;
      const id = uid();

      setToasts((current) => {
        const next = [...current, { id, tone, message, description }];
        // Cap the stack so a loop calling toast() can't paper over the app.
        return next.length > 4 ? next.slice(next.length - 4) : next;
      });

      timers.current.set(
        id,
        setTimeout(() => dismiss(id), durationMs),
      );
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        // `pointer-events-none` on the stack, re-enabled per toast, so the
        // region never blocks clicks on the page beneath it.
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role={item.tone === 'danger' ? 'alert' : 'status'}
            className="card pointer-events-auto flex animate-fade-up items-start gap-3 p-3.5 shadow-lift"
          >
            <span className={cn('mt-0.5 shrink-0 [&_svg]:size-[18px]', TONE_STYLES[item.tone])}>
              {TONE_ICONS[item.tone]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium leading-snug text-fg">{item.message}</p>
              {item.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{item.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="-mr-1 -mt-1 shrink-0 rounded-lg p-1 text-fg-subtle transition-colors hover:bg-bg-subtle hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
