'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Hand-rolled inline SVG charts.
 *
 * No charting library: these four forms are all AppBox needs, and a dependency
 * like Recharts would add ~100KB to routes whose whole selling point is being
 * fast. Rendering SVG directly also means the marks inherit the theme's CSS
 * custom properties, so light/dark works without re-rendering on theme change.
 *
 * Series colors come from --series-1..3 (see globals.css) and never from the
 * page accent: a series color identifies an entity, so it must not change
 * because the user navigated to a differently-accented tool.
 */

export const SERIES_COLORS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)'] as const;

/** Gap/ring width from the mark spec — surface color doing the separating,
 *  rather than a stroke around each mark (which would add non-data ink). */
const SURFACE_GAP = 2;

export interface Series {
  key: string;
  label: string;
  values: number[];
}

// ─── Legend ───────────────────────────────────────────────────────────────

/**
 * Always rendered for two or more series. Identity must never rest on color
 * alone, and the swatch-plus-text pairing is what carries it — the label text
 * itself stays in an ink token, never the series color.
 */
export function ChartLegend({
  series,
  className,
}: {
  series: ReadonlyArray<{ key: string; label: string }>;
  className?: string;
}) {
  if (series.length < 2) return null;

  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {series.map((item, index) => (
        <li key={item.key} className="flex items-center gap-1.5 text-xs text-fg-muted">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-[3px]"
            style={{ background: SERIES_COLORS[index % SERIES_COLORS.length] }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

// ─── Shared scale ─────────────────────────────────────────────────────────

interface Scale {
  width: number;
  height: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  padBottom: number;
  plotWidth: number;
  plotHeight: number;
  maxY: number;
  x: (index: number, count: number) => number;
  y: (value: number) => number;
}

function makeScale(opts: {
  width: number;
  height: number;
  maxY: number;
  padLeft?: number;
  padBottom?: number;
}): Scale {
  const { width, height, maxY } = opts;
  const padLeft = opts.padLeft ?? 52;
  const padRight = 12;
  const padTop = 12;
  const padBottom = opts.padBottom ?? 28;

  const plotWidth = Math.max(1, width - padLeft - padRight);
  const plotHeight = Math.max(1, height - padTop - padBottom);
  // Guard against a flat all-zero series collapsing the scale to divide-by-zero.
  const safeMax = maxY > 0 ? maxY : 1;

  return {
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    plotWidth,
    plotHeight,
    maxY: safeMax,
    x: (index, count) => padLeft + (count <= 1 ? plotWidth / 2 : (index / (count - 1)) * plotWidth),
    y: (value) => padTop + plotHeight - (value / safeMax) * plotHeight,
  };
}

/** Round an axis maximum up to a clean 1/2/5 × 10^n number so ticks read as
 *  0 / 5,000 / 10,000 rather than 0 / 4,317 / 8,634. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function Grid({ scale, ticks, formatY }: { scale: Scale; ticks: number; formatY: (v: number) => string }) {
  const lines = Array.from({ length: ticks + 1 }, (_, index) => {
    const value = (scale.maxY / ticks) * index;
    return { value, y: scale.y(value) };
  });

  return (
    <g aria-hidden="true">
      {lines.map(({ value, y }) => (
        <g key={value}>
          {/* Hairline, solid, one step off surface — recessive by construction. */}
          <line
            x1={scale.padLeft}
            x2={scale.width - scale.padRight}
            y1={y}
            y2={y}
            stroke="var(--grid)"
            strokeWidth={1}
          />
          <text
            x={scale.padLeft - 8}
            y={y}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-fg-subtle text-[10px] [font-variant-numeric:tabular-nums]"
          >
            {formatY(value)}
          </text>
        </g>
      ))}
    </g>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────

function TooltipCard({
  scale,
  index,
  x,
  title,
  rows,
}: {
  scale: Scale;
  index: number;
  x: number;
  title: string;
  rows: Array<{ label: string; value: string; color?: string }>;
}) {
  const WIDTH = 172;
  const height = 30 + rows.length * 18;

  // Flip to the other side of the crosshair near the right edge so the card
  // never spills outside the SVG viewport.
  const flip = x + WIDTH + 16 > scale.width;
  const cardX = flip ? x - WIDTH - 10 : x + 10;

  return (
    <g pointerEvents="none" key={index}>
      <line
        x1={x}
        x2={x}
        y1={scale.padTop}
        y2={scale.padTop + scale.plotHeight}
        stroke="var(--axis)"
        strokeWidth={1}
      />
      <foreignObject x={cardX} y={scale.padTop + 4} width={WIDTH} height={height}>
        <div className="card px-2.5 py-2 shadow-lift">
          <p className="text-[11px] font-semibold text-fg">{title}</p>
          <dl className="mt-1 space-y-0.5">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center gap-1.5 text-[11px]">
                {row.color && (
                  <span className="size-2 shrink-0 rounded-[2px]" style={{ background: row.color }} />
                )}
                <dt className="min-w-0 flex-1 truncate text-fg-muted">{row.label}</dt>
                <dd className="font-semibold text-fg [font-variant-numeric:tabular-nums]">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </foreignObject>
    </g>
  );
}

// ─── Stacked area chart ───────────────────────────────────────────────────

export interface StackedAreaChartProps {
  labels: string[];
  series: Series[];
  /** Optional unstacked reference line drawn on top (e.g. inflation-adjusted). */
  overlay?: Series;
  formatValue: (value: number) => string;
  formatAxis?: (value: number) => string;
  xAxisLabel?: string;
  height?: number;
  className?: string;
  ariaLabel: string;
}

/**
 * Cumulative composition over time — "how much of this balance did I put in
 * versus earn". Stacked because the parts sum to a meaningful whole; the top
 * edge is the total, which is the number people actually look for.
 */
export function StackedAreaChart({
  labels,
  series,
  overlay,
  formatValue,
  formatAxis,
  xAxisLabel,
  height = 260,
  className,
  ariaLabel,
}: StackedAreaChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const WIDTH = 720;

  const { scale, stacks, overlayPath } = useMemo(() => {
    const count = labels.length;
    const totals = labels.map((_, index) => series.reduce((sum, s) => sum + (s.values[index] ?? 0), 0));
    const overlayMax = overlay && overlay.values.length > 0 ? Math.max(...overlay.values) : 0;
    const s = makeScale({
      width: WIDTH,
      height,
      maxY: niceMax(Math.max(...totals, overlayMax, 0)),
      padBottom: xAxisLabel ? 40 : 28,
    });

    // Build each band from its own running baseline so segments stack.
    const baselines = new Array<number>(count).fill(0);
    const built = series.map((item) => {
      const lower = [...baselines];
      const upper = labels.map((_, index) => {
        baselines[index] = (baselines[index] ?? 0) + (item.values[index] ?? 0);
        return baselines[index] ?? 0;
      });

      const top = upper.map((value, index) => `${s.x(index, count)},${s.y(value)}`).join(' L ');
      const bottom = lower
        .map((_, reverseIndex) => {
          const index = count - 1 - reverseIndex;
          return `${s.x(index, count)},${s.y(lower[index] ?? 0)}`;
        })
        .join(' L ');

      return {
        key: item.key,
        label: item.label,
        area: `M ${top} L ${bottom} Z`,
        // The top edge is stroked in the surface color to create the 2px gap
        // that separates this band from the one above it.
        edge: `M ${top}`,
      };
    });

    const path =
      overlay && overlay.values.length > 0
        ? `M ${overlay.values.map((value, index) => `${s.x(index, count)},${s.y(value)}`).join(' L ')}`
        : null;

    return { scale: s, stacks: built, overlayPath: path };
  }, [labels, series, overlay, height, xAxisLabel]);

  const axisFormat = formatAxis ?? formatValue;
  const count = labels.length;
  // Label roughly six x positions; more than that collides at this width.
  const labelStep = Math.max(1, Math.ceil(count / 6));
  const legendItems = overlay ? [...series, overlay] : series;

  return (
    <figure className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full touch-none"
        role="img"
        aria-label={ariaLabel}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          // Map client px into viewBox units — the SVG scales with the column.
          const localX = ((event.clientX - rect.left) / rect.width) * WIDTH;
          const ratio = (localX - scale.padLeft) / scale.plotWidth;
          const index = Math.round(ratio * (count - 1));
          setHoverIndex(index >= 0 && index < count ? index : null);
        }}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <Grid scale={scale} ticks={4} formatY={axisFormat} />

        {stacks.map((stack, index) => (
          <g key={stack.key}>
            <path d={stack.area} fill={SERIES_COLORS[index % SERIES_COLORS.length]} fillOpacity={0.85} />
            <path
              d={stack.edge}
              fill="none"
              stroke="var(--card)"
              strokeWidth={SURFACE_GAP}
              strokeLinejoin="round"
            />
          </g>
        ))}

        {overlayPath && (
          <path
            d={overlayPath}
            fill="none"
            stroke={SERIES_COLORS[2]}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5 4"
          />
        )}

        {/* Baseline above the fills, so bands read as resting on it. */}
        <line
          x1={scale.padLeft}
          x2={WIDTH - scale.padRight}
          y1={scale.y(0)}
          y2={scale.y(0)}
          stroke="var(--axis)"
          strokeWidth={1}
        />

        <g aria-hidden="true">
          {labels.map((label, index) =>
            index % labelStep === 0 || index === count - 1 ? (
              <text
                key={`${label}-${index}`}
                x={scale.x(index, count)}
                y={scale.padTop + scale.plotHeight + 16}
                textAnchor="middle"
                className="fill-fg-subtle text-[10px] [font-variant-numeric:tabular-nums]"
              >
                {label}
              </text>
            ) : null,
          )}
          {xAxisLabel && (
            <text
              x={scale.padLeft + scale.plotWidth / 2}
              y={height - 6}
              textAnchor="middle"
              className="fill-fg-subtle text-[10px]"
            >
              {xAxisLabel}
            </text>
          )}
        </g>

        {hoverIndex !== null && (
          <>
            {series.map((_, seriesIndex) => {
              const cumulative = series
                .slice(0, seriesIndex + 1)
                .reduce((sum, s) => sum + (s.values[hoverIndex] ?? 0), 0);
              return (
                <circle
                  key={seriesIndex}
                  cx={scale.x(hoverIndex, count)}
                  cy={scale.y(cumulative)}
                  r={4}
                  fill={SERIES_COLORS[seriesIndex % SERIES_COLORS.length]}
                  // 2px surface ring keeps the dot legible where it crosses an edge.
                  stroke="var(--card)"
                  strokeWidth={SURFACE_GAP}
                />
              );
            })}
            <TooltipCard
              scale={scale}
              index={hoverIndex}
              x={scale.x(hoverIndex, count)}
              title={labels[hoverIndex] ?? ''}
              rows={[
                ...series.map((item, index) => ({
                  label: item.label,
                  value: formatValue(item.values[hoverIndex] ?? 0),
                  color: SERIES_COLORS[index % SERIES_COLORS.length],
                })),
                ...(overlay
                  ? [
                      {
                        label: overlay.label,
                        value: formatValue(overlay.values[hoverIndex] ?? 0),
                        color: SERIES_COLORS[2],
                      },
                    ]
                  : []),
                {
                  label: 'Total',
                  value: formatValue(series.reduce((sum, s) => sum + (s.values[hoverIndex] ?? 0), 0)),
                },
              ]}
            />
          </>
        )}
      </svg>

      <figcaption className="mt-3">
        <ChartLegend series={legendItems} />
      </figcaption>
    </figure>
  );
}

// ─── Stacked bar chart ────────────────────────────────────────────────────

export interface StackedBarChartProps {
  labels: string[];
  series: Series[];
  formatValue: (value: number) => string;
  formatAxis?: (value: number) => string;
  height?: number;
  className?: string;
  ariaLabel: string;
}

/**
 * Discrete periods with a composition each — a year's payments split into
 * principal and interest. Columns rather than an area because each year is a
 * separate bucket, not a continuous reading.
 */
export function StackedBarChart({
  labels,
  series,
  formatValue,
  formatAxis,
  height = 260,
  className,
  ariaLabel,
}: StackedBarChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const WIDTH = 720;

  const { scale, bandWidth, barWidth } = useMemo(() => {
    const totals = labels.map((_, index) => series.reduce((sum, s) => sum + (s.values[index] ?? 0), 0));
    const s = makeScale({ width: WIDTH, height, maxY: niceMax(Math.max(...totals, 0)) });
    const band = s.plotWidth / Math.max(1, labels.length);
    // Cap at 24px and leave the band's remainder as air, per the mark spec.
    return { scale: s, bandWidth: band, barWidth: Math.min(24, band * 0.62) };
  }, [labels, series, height]);

  const axisFormat = formatAxis ?? formatValue;
  const labelStep = Math.max(1, Math.ceil(labels.length / 10));

  return (
    <figure className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" role="img" aria-label={ariaLabel}>
        <Grid scale={scale} ticks={4} formatY={axisFormat} />

        {labels.map((label, index) => {
          const bandX = scale.padLeft + index * bandWidth;
          const x = bandX + (bandWidth - barWidth) / 2;
          let cursor = 0;

          return (
            <g
              key={`${label}-${index}`}
              onPointerEnter={() => setHoverIndex(index)}
              onPointerLeave={() => setHoverIndex(null)}
            >
              {/* Invisible full-band hit area: the bar itself is a poor target,
                  especially in years where one segment is a few px tall. */}
              <rect
                x={bandX}
                y={scale.padTop}
                width={bandWidth}
                height={scale.plotHeight}
                fill={hoverIndex === index ? 'var(--bg-subtle)' : 'transparent'}
              />
              {series.map((item, seriesIndex) => {
                const value = item.values[index] ?? 0;
                const rawHeight = (value / scale.maxY) * scale.plotHeight;
                const y = scale.y(cursor + value);
                cursor += value;
                if (rawHeight <= 0) return null;

                const isTop = seriesIndex === series.length - 1;
                // Subtract the gap from every segment except the bottom one, so
                // the surface shows through between stacked segments.
                const segmentHeight = Math.max(1, rawHeight - (seriesIndex > 0 ? SURFACE_GAP : 0));

                return (
                  <rect
                    key={item.key}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={segmentHeight}
                    // 4px rounded data-end on the top segment only; the stack
                    // stays square where it meets the baseline.
                    rx={isTop ? 4 : 0}
                    fill={SERIES_COLORS[seriesIndex % SERIES_COLORS.length]}
                  />
                );
              })}
            </g>
          );
        })}

        <line
          x1={scale.padLeft}
          x2={WIDTH - scale.padRight}
          y1={scale.y(0)}
          y2={scale.y(0)}
          stroke="var(--axis)"
          strokeWidth={1}
        />

        <g aria-hidden="true">
          {labels.map((label, index) =>
            index % labelStep === 0 ? (
              <text
                key={`${label}-${index}`}
                x={scale.padLeft + index * bandWidth + bandWidth / 2}
                y={scale.padTop + scale.plotHeight + 16}
                textAnchor="middle"
                className="fill-fg-subtle text-[10px] [font-variant-numeric:tabular-nums]"
              >
                {label}
              </text>
            ) : null,
          )}
        </g>

        {hoverIndex !== null && (
          <TooltipCard
            scale={scale}
            index={hoverIndex}
            x={scale.padLeft + hoverIndex * bandWidth + bandWidth / 2}
            title={labels[hoverIndex] ?? ''}
            rows={[
              ...series.map((item, index) => ({
                label: item.label,
                value: formatValue(item.values[hoverIndex] ?? 0),
                color: SERIES_COLORS[index % SERIES_COLORS.length],
              })),
              {
                label: 'Total',
                value: formatValue(series.reduce((sum, s) => sum + (s.values[hoverIndex] ?? 0), 0)),
              },
            ]}
          />
        )}
      </svg>

      <figcaption className="mt-3">
        <ChartLegend series={series} />
      </figcaption>
    </figure>
  );
}

// ─── Progress ring ────────────────────────────────────────────────────────

export interface ProgressRingProps {
  value: number;
  max: number;
  /** The big number inside the ring. */
  label: ReactNode;
  sublabel?: ReactNode;
  size?: number;
  className?: string;
  ariaLabel: string;
}

/**
 * A single value against a target. Per the meter spec the unfilled track is a
 * lighter step of the fill's own ramp rather than plain gray, so the state reads
 * across the whole ring.
 */
export function ProgressRing({
  value,
  max,
  label,
  sublabel,
  size = 180,
  className,
  ariaLabel,
}: ProgressRingProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={cn('relative inline-grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        // Start the fill at 12 o'clock rather than 3 o'clock.
        className="-rotate-90"
        role="img"
        aria-label={ariaLabel}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent-soft)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          {/* Proportional figures: a large standalone number looks loose in
              tabular-nums at display sizes. */}
          <div className="text-3xl font-semibold leading-none text-fg">{label}</div>
          {sublabel && <div className="mt-1 text-xs text-fg-muted">{sublabel}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────

export interface SparklineProps {
  values: number[];
  /** Highlights the final point — "where we are now". */
  markLast?: boolean;
  width?: number;
  height?: number;
  className?: string;
  ariaLabel: string;
}

export function Sparkline({
  values,
  markLast = true,
  width = 120,
  height = 32,
  className,
  ariaLabel,
}: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 3;

  const points = values.map((value, index) => {
    const x = pad + (index / (values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return { x, y };
  });

  const path = `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
      role="img"
      aria-label={ariaLabel}
    >
      <path
        d={path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {markLast && last && (
        <circle cx={last.x} cy={last.y} r={3} fill="var(--accent)" stroke="var(--card)" strokeWidth={SURFACE_GAP} />
      )}
    </svg>
  );
}
