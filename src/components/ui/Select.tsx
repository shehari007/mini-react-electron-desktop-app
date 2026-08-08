'use client';

import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

import { useFieldControl } from './Field';

export interface SelectOption {
  value: string;
  label: string;
  /** Groups options under an <optgroup> heading. */
  group?: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'children'> {
  options: readonly SelectOption[];
  placeholder?: string;
  selectSize?: 'sm' | 'md' | 'lg';
}

const SELECT_SIZES = {
  sm: 'h-8 pl-2.5 pr-8 text-[13px]',
  md: 'h-10 pl-3 pr-9 text-sm',
  lg: 'h-12 pl-4 pr-10 text-base',
} as const;

/**
 * Native <select> rather than a custom listbox — 90+ unit options and 60+
 * currencies are exactly the case where the OS picker (with its type-ahead and
 * mobile wheel) beats anything reimplemented in a div.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, selectSize = 'md', className, ...props },
  ref,
) {
  const fieldProps = useFieldControl();

  // Preserve the registry order within each group while collecting the groups
  // themselves in first-seen order.
  const groups = new Map<string, SelectOption[]>();
  for (const option of options) {
    const key = option.group ?? '';
    const bucket = groups.get(key);
    if (bucket) bucket.push(option);
    else groups.set(key, [option]);
  }

  return (
    <div className="relative">
      <select
        ref={ref}
        {...fieldProps}
        className={cn(
          'w-full appearance-none rounded-xl border border-border bg-card text-fg',
          'transition-[border-color,box-shadow] duration-150 hover:border-border-strong',
          'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25',
          'disabled:cursor-not-allowed disabled:opacity-55',
          'aria-[invalid=true]:border-danger',
          SELECT_SIZES[selectSize],
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {[...groups.entries()].map(([group, items]) =>
          group ? (
            <optgroup key={group} label={group}>
              {items.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ) : (
            items.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))
          ),
        )}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
        aria-hidden="true"
      />
    </div>
  );
});
