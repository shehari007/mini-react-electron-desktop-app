'use client';

import { Scale } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Card, CardHeader, Result, Stat } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Controls';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { cn, formatNumber, parseNumber } from '@/lib/utils';

type Units = 'metric' | 'imperial';

/** WHO adult BMI categories. */
const CATEGORIES = [
  { max: 18.5, label: 'Underweight', tone: 'warning' as const },
  { max: 25, label: 'Healthy weight', tone: 'success' as const },
  { max: 30, label: 'Overweight', tone: 'warning' as const },
  { max: 35, label: 'Obese (class I)', tone: 'danger' as const },
  { max: 40, label: 'Obese (class II)', tone: 'danger' as const },
  { max: Infinity, label: 'Obese (class III)', tone: 'danger' as const },
];

/** Segment widths for the scale, clamped to a readable 15–40 display range. */
const SCALE_MIN = 15;
const SCALE_MAX = 40;

function categoryFor(bmi: number) {
  return CATEGORIES.find((category) => bmi < category.max) ?? CATEGORIES[CATEGORIES.length - 1]!;
}

export function BmiCalculator() {
  const [units, setUnits] = useState<Units>('metric');

  // Metric
  const [cm, setCm] = useState('175');
  const [kg, setKg] = useState('72');

  // Imperial
  const [feet, setFeet] = useState('5');
  const [inches, setInches] = useState('9');
  const [pounds, setPounds] = useState('160');

  const result = useMemo(() => {
    let heightMetres: number | null = null;
    let weightKg: number | null = null;

    if (units === 'metric') {
      const height = parseNumber(cm);
      const weight = parseNumber(kg);
      if (height !== null && height > 0) heightMetres = height / 100;
      if (weight !== null && weight > 0) weightKg = weight;
    } else {
      const ft = parseNumber(feet) ?? 0;
      const inch = parseNumber(inches) ?? 0;
      const totalInches = ft * 12 + inch;
      const lb = parseNumber(pounds);
      if (totalInches > 0) heightMetres = totalInches * 0.0254;
      if (lb !== null && lb > 0) weightKg = lb * 0.45359237;
    }

    if (heightMetres === null || weightKg === null) return null;

    const bmi = weightKg / heightMetres ** 2;
    if (!Number.isFinite(bmi) || bmi <= 0 || bmi > 200) return null;

    // The weight range that would put this height in the 18.5–24.9 band.
    const healthyMinKg = 18.5 * heightMetres ** 2;
    const healthyMaxKg = 24.9 * heightMetres ** 2;

    return {
      bmi,
      category: categoryFor(bmi),
      heightMetres,
      weightKg,
      healthyMinKg,
      healthyMaxKg,
      // How far from the nearest edge of the healthy band.
      toHealthy:
        bmi < 18.5 ? healthyMinKg - weightKg : bmi > 24.9 ? weightKg - healthyMaxKg : 0,
    };
  }, [units, cm, kg, feet, inches, pounds]);

  const displayWeight = (value: number) =>
    units === 'metric' ? `${formatNumber(value, 1)} kg` : `${formatNumber(value / 0.45359237, 1)} lb`;

  const markerPercent =
    result === null
      ? 0
      : ((Math.min(SCALE_MAX, Math.max(SCALE_MIN, result.bmi)) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;

  return (
    <ToolColumns
      main={
        <>
          <Card>
            <CardHeader
              title="Height and weight"
              icon={<Scale />}
              actions={
                <Segmented
                  value={units}
                  onChange={setUnits}
                  ariaLabel="Units"
                  size="sm"
                  options={[
                    { value: 'metric', label: 'Metric' },
                    { value: 'imperial', label: 'Imperial' },
                  ]}
                />
              }
            />

            <div className="mt-4">
              {units === 'metric' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Height">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={cm}
                      onChange={(event) => setCm(event.currentTarget.value)}
                      suffix="cm"
                      inputSize="lg"
                    />
                  </Field>
                  <Field label="Weight">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={kg}
                      onChange={(event) => setKg(event.currentTarget.value)}
                      suffix="kg"
                      inputSize="lg"
                    />
                  </Field>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Height">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={feet}
                      onChange={(event) => setFeet(event.currentTarget.value)}
                      suffix="ft"
                      inputSize="lg"
                    />
                  </Field>
                  <Field label="&nbsp;">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={inches}
                      onChange={(event) => setInches(event.currentTarget.value)}
                      suffix="in"
                      inputSize="lg"
                    />
                  </Field>
                  <Field label="Weight">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={pounds}
                      onChange={(event) => setPounds(event.currentTarget.value)}
                      suffix="lb"
                      inputSize="lg"
                    />
                  </Field>
                </div>
              )}
            </div>
          </Card>

          {result && (
            <Card>
              <CardHeader title="Where that sits" description="The scale below runs from BMI 15 to 40." />

              <div className="mt-5">
                <div className="relative">
                  {/* Bands are proportional to their real BMI width across the
                      15–40 display range, so the marker position is honest. */}
                  <div className="flex h-7 overflow-hidden rounded-lg">
                    {[
                      { label: 'Under', from: 15, to: 18.5, className: 'bg-warning/70' },
                      { label: 'Healthy', from: 18.5, to: 25, className: 'bg-success' },
                      { label: 'Over', from: 25, to: 30, className: 'bg-warning' },
                      { label: 'Obese', from: 30, to: 40, className: 'bg-danger' },
                    ].map((band) => (
                      <div
                        key={band.label}
                        className={cn('grid place-items-center text-[10px] font-bold text-white', band.className)}
                        style={{ width: `${((band.to - band.from) / (SCALE_MAX - SCALE_MIN)) * 100}%` }}
                      >
                        {band.label}
                      </div>
                    ))}
                  </div>

                  <div
                    className="absolute -top-1 h-9 w-0.5 bg-fg transition-[left] duration-300"
                    style={{ left: `${markerPercent}%` }}
                    aria-hidden="true"
                  >
                    <span className="absolute -left-1 -top-1.5 size-2.5 rounded-full bg-fg ring-2 ring-card" />
                  </div>
                </div>

                <div className="mt-2 flex justify-between text-[10px] text-fg-subtle">
                  <span>15</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>40+</span>
                </div>
              </div>
            </Card>
          )}

          <Callout tone="warning" title="BMI is a rough screening number, not a diagnosis">
            It compares weight to height and nothing else — it cannot tell muscle from fat, and it does not
            account for body composition, frame size, age, ethnicity or pregnancy. A very muscular person often
            reads as &ldquo;overweight&rdquo; on this scale while being nothing of the sort. Treat it as one crude
            signal, and talk to a clinician about what it means for you.
          </Callout>
        </>
      }
      side={
        result === null ? (
          <Card>
            <p className="py-6 text-center text-[13px] text-fg-muted">Enter a height and weight.</p>
          </Card>
        ) : (
          <>
            <Card>
              <Result label="Your BMI" value={formatNumber(result.bmi, 1)} hint={result.category.label} />

              <div className="mt-4 grid gap-2.5">
                <Stat
                  label="Healthy range for your height"
                  value={`${displayWeight(result.healthyMinKg)} – ${displayWeight(result.healthyMaxKg)}`}
                  hint="BMI 18.5 to 24.9"
                />
                {result.toHealthy > 0 && (
                  <Stat
                    label={result.bmi < 18.5 ? 'To reach that range' : 'Above that range by'}
                    value={displayWeight(result.toHealthy)}
                  />
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="The categories" />
              <ul className="mt-3 space-y-1">
                {[
                  { label: 'Underweight', range: 'Below 18.5' },
                  { label: 'Healthy weight', range: '18.5 – 24.9' },
                  { label: 'Overweight', range: '25.0 – 29.9' },
                  { label: 'Obese (class I)', range: '30.0 – 34.9' },
                  { label: 'Obese (class II)', range: '35.0 – 39.9' },
                  { label: 'Obese (class III)', range: '40.0 and above' },
                ].map((row) => (
                  <li
                    key={row.label}
                    className={cn(
                      'flex items-baseline justify-between gap-3 rounded-lg px-2.5 py-1.5 text-[13px]',
                      row.label === result.category.label
                        ? 'bg-accent-soft font-semibold text-accent-text'
                        : 'text-fg-muted',
                    )}
                  >
                    <span>{row.label}</span>
                    <span className="tabular shrink-0 text-[12px]">{row.range}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )
      }
    />
  );
}
