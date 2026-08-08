import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Removes the default padding for cards whose content manages its own. */
  flush?: boolean;
  /** Adds a hover lift — only for cards that are themselves links or buttons. */
  interactive?: boolean;
}

export function Card({ flush = false, interactive = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card',
        !flush && 'p-5',
        interactive &&
          'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-accent/40',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Right-aligned controls — segmented switches, copy buttons, menus. */
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, icon, actions, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-text [&_svg]:size-[18px]">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] leading-relaxed text-fg-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * A large highlighted number — the primary answer a calculator produces.
 * Deliberately loud: it's what the user came to the page for.
 */
export interface ResultProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}

export function Result({ label, value, hint, className }: ResultProps) {
  return (
    <div className={cn('rounded-2xl border border-accent/25 bg-accent-soft px-5 py-4', className)}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-accent-text/80">{label}</div>
      <div className="mt-1 text-3xl font-semibold leading-tight text-accent-text sm:text-[2rem]">{value}</div>
      {hint && <div className="mt-1.5 text-[13px] text-fg-muted">{hint}</div>}
    </div>
  );
}

/** Compact metric tile for supporting figures around a `Result`. */
export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}

export function Stat({ label, value, hint, className }: StatProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-bg-subtle px-4 py-3', className)}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-fg-subtle">{label}</div>
      <div className="mt-0.5 text-lg font-semibold text-fg">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-fg-muted">{hint}</div>}
    </div>
  );
}
