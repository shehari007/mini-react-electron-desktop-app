'use client';

import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn, formatNumber } from '@/lib/utils';

// ─── Switch ───────────────────────────────────────────────────────────────

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * A real checkbox input visually restyled as a switch, so keyboard activation,
 * form semantics and screen-reader behaviour come for free.
 */
export function Switch({ checked, onChange, label, description, disabled, className }: SwitchProps) {
  const id = useId();

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="relative mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.checked)}
          className="peer absolute size-0 opacity-0"
        />
        <label
          htmlFor={id}
          className={cn(
            'relative block h-6 w-11 cursor-pointer rounded-full border border-border bg-bg-subtle',
            'transition-colors duration-200',
            'peer-checked:border-accent peer-checked:bg-accent',
            'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            // The knob is an ::after on the track, so it animates with the
            // colour change in a single compositor-friendly transition.
            'after:absolute after:left-[2px] after:top-[2px] after:size-[18px] after:rounded-full',
            'after:bg-white after:shadow-sm after:transition-transform after:duration-200',
            'after:content-[""] peer-checked:after:translate-x-5',
          )}
        >
          {/* Only supply a hidden name when there is no visible label to
              associate, otherwise the control announces its name twice. */}
          {!label && <span className="sr-only">Toggle</span>}
        </label>
      </div>

      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <label htmlFor={id} className="block cursor-pointer text-[13px] font-medium text-fg">
              {label}
            </label>
          )}
          {description && <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{description}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Renders the current value on the right of the label row. */
  label?: ReactNode;
  formatValue?: (value: number) => string;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  formatValue,
  className,
  ...props
}: SliderProps) {
  const id = useId();
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={id} className="text-[13px] font-medium text-fg">
            {label}
          </label>
          <span className="tabular text-[13px] font-semibold text-accent-text">
            {formatValue ? formatValue(value) : formatNumber(value)}
          </span>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        // The filled portion is a gradient stop driven by the current percent,
        // which avoids a second element and works in both engines.
        style={{
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${percent}%, var(--border) ${percent}%, var(--border) 100%)`,
        }}
        className={cn(
          'h-1.5 w-full cursor-pointer appearance-none rounded-full',
          '[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent',
          '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-card',
          '[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform',
          'hover:[&::-webkit-slider-thumb]:scale-110',
          '[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-card [&::-moz-range-thumb]:bg-accent',
          '[&::-moz-range-track]:bg-transparent',
        )}
        {...props}
      />
    </div>
  );
}

// ─── Segmented control ────────────────────────────────────────────────────

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

export interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  /** Accessible name for the group, e.g. "Calculator mode". */
  ariaLabel: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

/**
 * Tab-style switch for a small set of mutually exclusive modes (basic vs
 * scientific, encode vs decode).
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = 'md',
  fullWidth = false,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-border bg-bg-subtle p-1',
        fullWidth && 'w-full',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium',
              'transition-colors duration-150',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              active ? 'bg-card text-fg shadow-sm' : 'text-fg-muted hover:bg-card/60 hover:text-fg',
            )}
          >
            {option.icon && <span className="[&_svg]:size-3.5">{option.icon}</span>}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Number stepper ───────────────────────────────────────────────────────

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
  ariaLabel: string;
}

/** Compact −/+ control for small bounded integers (people, rounds, decimals). */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix,
  className,
  ariaLabel,
}: StepperProps) {
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)));

  return (
    <div
      className={cn(
        'inline-flex h-10 items-stretch overflow-hidden rounded-xl border border-border bg-card',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => set(value - step)}
        disabled={value <= min}
        aria-label={`Decrease ${ariaLabel}`}
        className="grid w-9 place-items-center text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg disabled:opacity-40 disabled:hover:bg-transparent"
      >
        −
      </button>
      <div className="tabular grid min-w-14 place-items-center border-x border-border px-2 text-sm font-semibold text-fg">
        {formatNumber(value, 0)}
        {suffix && <span className="ml-0.5 text-xs font-normal text-fg-subtle">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={() => set(value + step)}
        disabled={value >= max}
        aria-label={`Increase ${ariaLabel}`}
        className="grid w-9 place-items-center text-fg-muted transition-colors hover:bg-bg-subtle hover:text-fg disabled:opacity-40 disabled:hover:bg-transparent"
      >
        +
      </button>
    </div>
  );
}
