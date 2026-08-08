'use client';

import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

import { useFieldControl } from './Field';

const CONTROL_BASE =
  'w-full bg-card text-fg placeholder:text-fg-subtle border border-border rounded-xl ' +
  'transition-[border-color,box-shadow,background-color] duration-150 ' +
  'hover:border-border-strong ' +
  'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 ' +
  'disabled:opacity-55 disabled:cursor-not-allowed ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/25';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Icon or text pinned inside the left edge (a currency symbol, a search glyph). */
  prefix?: ReactNode;
  /** Icon or text pinned inside the right edge (a unit, a clear button). */
  suffix?: ReactNode;
  mono?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
}

const INPUT_SIZES = {
  sm: 'h-8 px-2.5 text-[13px]',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
} as const;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { prefix, suffix, mono = false, inputSize = 'md', className, ...props },
  ref,
) {
  const fieldProps = useFieldControl();

  const control = (
    <input
      ref={ref}
      {...fieldProps}
      className={cn(
        CONTROL_BASE,
        INPUT_SIZES[inputSize],
        mono && 'font-mono tabular',
        // Native spinners crowd the suffix slot and are near-useless at these
        // sizes; the number tools provide their own steppers where it matters.
        '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        prefix && 'pl-9',
        suffix && 'pr-12',
        className,
      )}
      {...props}
    />
  );

  if (!prefix && !suffix) return control;

  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-fg-subtle [&_svg]:size-4">
          {prefix}
        </span>
      )}
      {control}
      {suffix && (
        <span className="absolute right-3 top-1/2 max-w-20 -translate-y-1/2 truncate text-sm text-fg-subtle [&_svg]:size-4">
          {suffix}
        </span>
      )}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  mono?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { mono = false, className, rows = 6, ...props },
  ref,
) {
  const fieldProps = useFieldControl();

  return (
    <textarea
      ref={ref}
      rows={rows}
      spellCheck={mono ? false : undefined}
      {...fieldProps}
      className={cn(
        CONTROL_BASE,
        'resize-y px-3 py-2.5 text-sm leading-relaxed',
        mono && 'font-mono text-[13px]',
        className,
      )}
      {...props}
    />
  );
});

/**
 * Read-only output field with a copy affordance handled by the caller.
 * Selecting on focus means one click gets the whole value.
 */
export const OutputField = forwardRef<HTMLInputElement, InputProps>(function OutputField(
  { className, ...props },
  ref,
) {
  return (
    <Input
      ref={ref}
      readOnly
      mono
      onFocus={(event) => event.currentTarget.select()}
      className={cn('cursor-text bg-bg-subtle', className)}
      {...props}
    />
  );
});
