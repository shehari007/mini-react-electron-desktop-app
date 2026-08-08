import { AlertTriangle, CheckCircle2, Info, WifiOff, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// ─── Badge ────────────────────────────────────────────────────────────────

export type BadgeTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger';

const BADGE_TONES: Record<BadgeTone, string> = {
  accent: 'bg-accent-soft text-accent-text border-accent/25',
  neutral: 'bg-bg-subtle text-fg-muted border-border',
  success: 'bg-success/12 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/35',
  danger: 'bg-danger/12 text-danger border-danger/30',
};

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
}

export function Badge({ children, tone = 'neutral', icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        BADGE_TONES[tone],
        className,
      )}
    >
      {icon && <span className="[&_svg]:size-3">{icon}</span>}
      {children}
    </span>
  );
}

// ─── Callout ──────────────────────────────────────────────────────────────

export type CalloutTone = 'info' | 'success' | 'warning' | 'danger';

const CALLOUT_STYLES: Record<CalloutTone, { wrapper: string; icon: ReactNode }> = {
  info: { wrapper: 'border-accent/25 bg-accent-soft text-accent-text', icon: <Info /> },
  success: { wrapper: 'border-success/30 bg-success/10 text-success', icon: <CheckCircle2 /> },
  warning: { wrapper: 'border-warning/35 bg-warning/12 text-warning', icon: <AlertTriangle /> },
  danger: { wrapper: 'border-danger/30 bg-danger/10 text-danger', icon: <XCircle /> },
};

export interface CalloutProps {
  tone?: CalloutTone;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function Callout({ tone = 'info', title, children, icon, className }: CalloutProps) {
  const style = CALLOUT_STYLES[tone];

  return (
    <div
      // Problems are announced as they appear; informational notes are not, so
      // they don't interrupt a screen reader mid-sentence.
      role={tone === 'danger' || tone === 'warning' ? 'alert' : undefined}
      className={cn('flex gap-3 rounded-xl border px-4 py-3 text-[13px]', style.wrapper, className)}
    >
      <span className="mt-0.5 shrink-0 [&_svg]:size-4">{icon ?? style.icon}</span>
      <div className="min-w-0 leading-relaxed">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
    </div>
  );
}

// ─── Offline notice ───────────────────────────────────────────────────────

export function OfflineNotice({ cachedAt, className }: { cachedAt?: string; className?: string }) {
  return (
    <Callout tone="warning" icon={<WifiOff />} title="You're offline" className={className}>
      {cachedAt
        ? `Showing the last data saved on this device (${cachedAt}). It will refresh automatically once you're back online.`
        : 'This tool needs a connection for fresh data. Everything else in AppBox keeps working offline.'}
    </Callout>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {icon && (
        <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent-text [&_svg]:size-6">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-semibold text-fg">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-fg-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-border/60', className)} />;
}

/** Screen-reader-only live region for announcing async results (copied, fetched,
 *  calculated) without a visible toast. */
export function LiveRegion({ message }: { message: string }) {
  return (
    <p aria-live="polite" role="status" className="sr-only">
      {message}
    </p>
  );
}
