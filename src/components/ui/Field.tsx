'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import { usePrefixedId } from '@/lib/hooks';
import { cn } from '@/lib/utils';

/**
 * Label + control + hint/error wrapper.
 *
 * `Field` owns the generated id and passes it down through context so the
 * control inside doesn't need to be told its own id, and `aria-describedby` /
 * `aria-invalid` stay wired up correctly without every call site repeating it.
 */

interface FieldContextValue {
  controlId: string;
  describedBy?: string;
  invalid: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/** Returns the ids/state a control should adopt, or nulls when used standalone. */
export function useFieldControl(): {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
} {
  const context = useContext(FieldContext);
  if (!context) return {};
  return {
    id: context.controlId,
    'aria-describedby': context.describedBy,
    'aria-invalid': context.invalid || undefined,
  };
}

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Right-aligned adornment on the label row — units, a "max" link, a counter. */
  labelAction?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, labelAction, required, className, children }: FieldProps) {
  const controlId = usePrefixedId('field');
  const messageId = `${controlId}-msg`;
  const hasMessage = Boolean(error ?? hint);

  return (
    <FieldContext.Provider
      value={{ controlId, describedBy: hasMessage ? messageId : undefined, invalid: Boolean(error) }}
    >
      <div className={cn('flex flex-col gap-1.5', className)}>
        {(label || labelAction) && (
          <div className="flex items-baseline justify-between gap-3">
            {label ? (
              <label htmlFor={controlId} className="text-[13px] font-medium text-fg">
                {label}
                {required && (
                  <span className="ml-0.5 text-danger" aria-hidden="true">
                    *
                  </span>
                )}
              </label>
            ) : (
              <span />
            )}
            {labelAction && <div className="text-xs text-fg-subtle">{labelAction}</div>}
          </div>
        )}

        {children}

        {hasMessage && (
          <p
            id={messageId}
            // Errors are announced; plain hints are static text and shouldn't be.
            role={error ? 'alert' : undefined}
            className={cn('text-xs leading-relaxed', error ? 'text-danger' : 'text-fg-subtle')}
          >
            {error ?? hint}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}
