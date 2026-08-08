'use client';

import { Check, Palette, Shuffle, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Card, CardHeader } from '@/components/ui/Card';
import { CopyButton } from '@/components/ui/CopyButton';
import { Segmented } from '@/components/ui/Controls';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import {
  PRESET_SWATCHES,
  evaluateContrast,
  formatHsl,
  formatHsv,
  formatOklch,
  formatRgb,
  harmonies,
  lightnessRamp,
  parseHex,
  readableTextOn,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  rgbToOklch,
} from '@/lib/colors';
import { cn, formatNumber } from '@/lib/utils';

type Tab = 'picker' | 'contrast';

/** Shown while the typed hex is incomplete or invalid. */
const FALLBACK_COLOR = { r: 91, g: 91, b: 214 };

export function ColorTools() {
  const [tab, setTab] = useState<Tab>('picker');

  return (
    <div className="space-y-5">
      <Segmented
        value={tab}
        onChange={setTab}
        ariaLabel="Mode"
        options={[
          { value: 'picker', label: 'Picker & palettes' },
          { value: 'contrast', label: 'Contrast checker' },
        ]}
      />
      {tab === 'picker' ? <Picker /> : <ContrastChecker />}
    </div>
  );
}

// ─── Picker ───────────────────────────────────────────────────────────────

function Picker() {
  const [hex, setHex] = useState('#5b5bd6');

  // Both memoised on `hex`: parseHex returns a fresh object each call, so
  // without this every downstream useMemo would see a new reference and
  // recompute the ramp and harmonies on every keystroke.
  const parsed = useMemo(() => parseHex(hex), [hex]);
  const valid = parsed !== null;
  const color = useMemo(() => parsed ?? FALLBACK_COLOR, [parsed]);

  const formats = useMemo(
    () => [
      { label: 'HEX', value: rgbToHex(color).toUpperCase() },
      { label: 'RGB', value: formatRgb(color) },
      { label: 'HSL', value: formatHsl(rgbToHsl(color)) },
      { label: 'HSV', value: formatHsv(rgbToHsv(color)) },
      { label: 'OKLCH', value: formatOklch(rgbToOklch(color)) },
    ],
    [color],
  );

  const ramp = useMemo(() => lightnessRamp(color), [color]);
  const schemes = useMemo(() => harmonies(color), [color]);

  const onWhite = evaluateContrast(color, { r: 255, g: 255, b: 255 });
  const onBlack = evaluateContrast(color, { r: 0, g: 0, b: 0 });

  const randomize = () => {
    const random = Array.from({ length: 3 }, () => Math.floor(Math.random() * 256));
    setHex(rgbToHex({ r: random[0] ?? 0, g: random[1] ?? 0, b: random[2] ?? 0 }));
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
      <div className="space-y-5">
        <Card>
          <CardHeader title="Pick a colour" icon={<Palette />} />

          <div
            className="mt-4 grid h-32 place-items-center rounded-2xl border border-border"
            style={{ backgroundColor: valid ? hex : '#5b5bd6' }}
          >
            <span
              className="font-mono text-lg font-semibold"
              style={{ color: readableTextOn(color) }}
            >
              {rgbToHex(color).toUpperCase()}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <Field label="Colour value" error={valid ? undefined : 'Not a valid hex colour.'}>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={rgbToHex(color)}
                  onChange={(event) => setHex(event.currentTarget.value)}
                  aria-label="Colour picker"
                  className="h-10 w-14 shrink-0 cursor-pointer rounded-xl border border-border bg-card p-1"
                />
                <Input
                  mono
                  value={hex}
                  onChange={(event) => setHex(event.currentTarget.value)}
                  placeholder="#5b5bd6"
                  className="flex-1"
                />
              </div>
            </Field>

            <Button leadingIcon={<Shuffle />} onClick={randomize} fullWidth>
              Random colour
            </Button>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Presets</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setHex(swatch)}
                  aria-label={`Use ${swatch}`}
                  title={swatch}
                  className={cn(
                    'size-7 rounded-lg border transition-transform hover:scale-110',
                    hex.toLowerCase() === swatch ? 'border-fg' : 'border-border',
                  )}
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Text contrast" description="How this colour performs as text." />
          <div className="mt-3 space-y-2">
            {[
              { label: 'On white', verdict: onWhite, bg: '#ffffff' },
              { label: 'On black', verdict: onBlack, bg: '#000000' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5" style={{ backgroundColor: row.bg }}>
                <span className="text-[13px] font-semibold" style={{ color: rgbToHex(color) }}>
                  {row.label}
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="tabular text-[13px] font-bold"
                    style={{ color: row.bg === '#ffffff' ? '#000' : '#fff' }}
                  >
                    {formatNumber(row.verdict.ratio, 2)}:1
                  </span>
                  {row.verdict.aaNormal ? (
                    <Check className="size-4 text-success" aria-label="Passes AA" />
                  ) : (
                    <X className="size-4 text-danger" aria-label="Fails AA" />
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader title="Every format" description="Click any value to copy it." />
          <div className="mt-3 space-y-2">
            {formats.map((format) => (
              <div key={format.label} className="flex items-center gap-3 rounded-xl border border-border bg-bg-subtle px-3 py-2">
                <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-fg-subtle">
                  {format.label}
                </span>
                <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-fg">{format.value}</code>
                <CopyButton value={format.value} ariaLabel={`Copy ${format.label} value`} size="sm" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Tints and shades"
            description="Stepped in OKLCH, so the hue stays put as lightness changes."
          />
          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <div className="flex">
              {ramp.map((step) => (
                <button
                  key={step.step}
                  type="button"
                  onClick={() => setHex(step.hex)}
                  title={`${step.step} · ${step.hex}`}
                  aria-label={`Use ${step.hex}`}
                  className="group relative h-20 flex-1 transition-transform hover:z-10 hover:scale-105"
                  style={{ backgroundColor: step.hex }}
                >
                  <span
                    className="absolute inset-x-0 bottom-1 text-[9px] font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: readableTextOn(parseHex(step.hex) ?? color) }}
                  >
                    {step.step}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Harmonies" />
          <div className="mt-3 space-y-4">
            {schemes.map((scheme) => (
              <div key={scheme.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-semibold text-fg">{scheme.label}</span>
                  <CopyButton value={scheme.colors.join(', ')} ariaLabel={`Copy ${scheme.label} palette`} size="sm" />
                </div>
                <p className="mb-2 text-[11px] text-fg-subtle">{scheme.description}</p>
                <div className="flex gap-1.5">
                  {scheme.colors.map((swatch, index) => (
                    <button
                      key={`${swatch}-${index}`}
                      type="button"
                      onClick={() => setHex(swatch)}
                      aria-label={`Use ${swatch}`}
                      className="h-14 flex-1 rounded-lg border border-border transition-transform hover:scale-[1.03]"
                      style={{ backgroundColor: swatch }}
                    >
                      <span
                        className="block text-[9px] font-semibold"
                        style={{ color: readableTextOn(parseHex(swatch) ?? color) }}
                      >
                        {swatch.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Contrast checker ─────────────────────────────────────────────────────

const SAMPLE_PAIRS = [
  { fg: '#767676', bg: '#ffffff', label: 'Minimum AA grey' },
  { fg: '#ffffff', bg: '#5b5bd6', label: 'White on indigo' },
  { fg: '#1f2937', bg: '#f9fafb', label: 'Near-black on off-white' },
  { fg: '#eab308', bg: '#ffffff', label: 'Yellow on white (fails)' },
];

function ContrastChecker() {
  const [foreground, setForeground] = useState('#767676');
  const [background, setBackground] = useState('#ffffff');

  const fg = parseHex(foreground) ?? { r: 0, g: 0, b: 0 };
  const bg = parseHex(background) ?? { r: 255, g: 255, b: 255 };
  const verdict = evaluateContrast(fg, bg);

  const swap = () => {
    setForeground(background);
    setBackground(foreground);
  };

  const criteria = [
    { label: 'AA · normal text', pass: verdict.aaNormal, required: '4.5:1', note: 'Body copy under 18pt' },
    { label: 'AA · large text', pass: verdict.aaLarge, required: '3:1', note: '18pt+, or 14pt bold' },
    { label: 'AAA · normal text', pass: verdict.aaaNormal, required: '7:1', note: 'Enhanced standard' },
    { label: 'AAA · large text', pass: verdict.aaaLarge, required: '4.5:1', note: 'Enhanced, large' },
    { label: 'UI components', pass: verdict.uiComponents, required: '3:1', note: 'Borders, icons, focus rings' },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
      <Card>
        <CardHeader title="Two colours" />

        <div className="mt-4 space-y-3">
          <Field label="Foreground (text)">
            <div className="flex gap-2">
              <input
                type="color"
                value={rgbToHex(fg)}
                onChange={(event) => setForeground(event.currentTarget.value)}
                aria-label="Foreground colour"
                className="h-10 w-14 shrink-0 cursor-pointer rounded-xl border border-border bg-card p-1"
              />
              <Input mono value={foreground} onChange={(event) => setForeground(event.currentTarget.value)} />
            </div>
          </Field>

          <Field label="Background">
            <div className="flex gap-2">
              <input
                type="color"
                value={rgbToHex(bg)}
                onChange={(event) => setBackground(event.currentTarget.value)}
                aria-label="Background colour"
                className="h-10 w-14 shrink-0 cursor-pointer rounded-xl border border-border bg-card p-1"
              />
              <Input mono value={background} onChange={(event) => setBackground(event.currentTarget.value)} />
            </div>
          </Field>

          <Button onClick={swap} fullWidth>
            Swap the two
          </Button>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Try one of these</p>
          <div className="space-y-1.5">
            {SAMPLE_PAIRS.map((pair) => (
              <button
                key={pair.label}
                type="button"
                onClick={() => {
                  setForeground(pair.fg);
                  setBackground(pair.bg);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-bg-subtle"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded border border-border text-[11px] font-bold" style={{ background: pair.bg, color: pair.fg }}>
                  Aa
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-fg-muted">{pair.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <CardHeader title="Contrast ratio" />
            <span
              className={cn(
                'tabular text-3xl font-bold',
                verdict.aaNormal ? 'text-success' : verdict.aaLarge ? 'text-warning' : 'text-danger',
              )}
            >
              {formatNumber(verdict.ratio, 2)}:1
            </span>
          </div>

          <div
            className="mt-4 rounded-2xl border border-border p-6"
            style={{ backgroundColor: rgbToHex(bg), color: rgbToHex(fg) }}
          >
            <p className="text-2xl font-bold">Large heading text</p>
            <p className="mt-2 text-base font-semibold">Semibold subheading at 16px</p>
            <p className="mt-2 text-sm leading-relaxed">
              This is body copy at 14 pixels. If this paragraph is uncomfortable to read, the ratio above is
              telling you why — and the checks below say exactly which standard it misses.
            </p>
            <p className="mt-2 text-xs">And this is small print at 12 pixels.</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="WCAG 2.1 checks" />
          <ul className="mt-3 space-y-2">
            {criteria.map((criterion) => (
              <li
                key={criterion.label}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3.5 py-2.5',
                  criterion.pass ? 'border-success/30 bg-success/8' : 'border-danger/30 bg-danger/8',
                )}
              >
                <span className="shrink-0">
                  {criterion.pass ? (
                    <Check className="size-4 text-success" aria-hidden="true" />
                  ) : (
                    <X className="size-4 text-danger" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-fg">{criterion.label}</span>
                  <span className="block text-[11px] text-fg-subtle">{criterion.note}</span>
                </span>
                <Badge tone={criterion.pass ? 'success' : 'danger'}>
                  {criterion.pass ? 'Pass' : `Needs ${criterion.required}`}
                </Badge>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[12px] leading-relaxed text-fg-subtle">
            Contrast is only part of legibility — font weight, size and the surrounding colours all matter too.
            A ratio that passes at 4.5:1 can still read poorly in a thin weight at a small size.
          </p>
        </Card>
      </div>
    </div>
  );
}
