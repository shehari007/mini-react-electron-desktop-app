'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a spinner and blocks interaction without changing layout width. */
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

/** Colors resolve from the accent CSS variables, so a button inherits whatever
 *  `data-accent` its nearest ancestor set — no per-tool variants needed. */
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-fg shadow-sm hover:brightness-110 active:brightness-95 disabled:hover:brightness-100',
  secondary: 'bg-card text-fg border border-border hover:bg-card-hover hover:border-border-strong',
  outline:
    'bg-transparent text-accent-text border border-accent/40 hover:bg-accent-soft hover:border-accent/70',
  soft: 'bg-accent-soft text-accent-text hover:brightness-[0.97] dark:hover:brightness-110',
  ghost: 'bg-transparent text-fg-muted hover:bg-bg-subtle hover:text-fg',
  danger: 'bg-danger text-white shadow-sm hover:brightness-110 active:brightness-95',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-[13px] rounded-lg',
  md: 'h-10 gap-2 px-4 text-sm rounded-xl',
  lg: 'h-12 gap-2 px-6 text-base rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex select-none items-center justify-center font-medium',
        'transition-[background-color,border-color,color,filter,box-shadow,transform] duration-150',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : leadingIcon && <span className="shrink-0 [&_svg]:size-4">{leadingIcon}</span>}
      {children}
      {trailingIcon && !loading && <span className="shrink-0 [&_svg]:size-4">{trailingIcon}</span>}
    </button>
  );
});

function Spinner() {
  return (
    <svg className="size-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
