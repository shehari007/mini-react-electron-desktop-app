'use client';

import { Check, Copy } from 'lucide-react';
import { useCallback } from 'react';

import { useTimedFlag } from '@/lib/hooks';
import { cn, copyText } from '@/lib/utils';

import { Button, type ButtonProps } from './Button';

// `value` is omitted from ButtonProps as well as the handler slots: the native
// button attribute of the same name is a string, and this one needs to accept a
// lazy getter.
export interface CopyButtonProps
  extends Omit<ButtonProps, 'onClick' | 'children' | 'leadingIcon' | 'value'> {
  /** The text to copy, or a getter for values that are expensive to build. */
  value: string | (() => string);
  /** Visible label. Omit for an icon-only button. */
  label?: string;
  /** Accessible name when icon-only. */
  ariaLabel?: string;
}

/**
 * Copy-to-clipboard with confirmation feedback.
 *
 * The swap to a check mark is the entire point — without it users click twice,
 * unsure whether the first one registered. The change is also announced via a
 * live region so it isn't a purely visual confirmation.
 */
export function CopyButton({
  value,
  label,
  ariaLabel,
  variant = 'ghost',
  size,
  className,
  disabled,
  ...props
}: CopyButtonProps) {
  const [copied, flagCopied] = useTimedFlag(1800);

  const handleCopy = useCallback(async () => {
    const text = typeof value === 'function' ? value() : value;
    if (!text) return;
    if (await copyText(text)) flagCopied();
  }, [value, flagCopied]);

  const resolvedSize = size ?? (label ? 'sm' : 'icon');
  const accessibleName = ariaLabel ?? (label ? undefined : 'Copy to clipboard');

  return (
    <>
      <Button
        variant={variant}
        size={resolvedSize}
        onClick={handleCopy}
        disabled={disabled}
        aria-label={accessibleName}
        className={cn(copied && 'text-success', className)}
        leadingIcon={copied ? <Check /> : <Copy />}
        {...props}
      >
        {label && (copied ? 'Copied' : label)}
      </Button>
      <span aria-live="polite" role="status" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </>
  );
}
