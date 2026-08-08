'use client';

import { Droplets, Plus, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ProgressRing } from '@/components/charts/Charts';
import { ToolColumns } from '@/components/ToolShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { Segmented, Slider } from '@/components/ui/Controls';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useMounted } from '@/lib/hooks';
import { useLocalStorage } from '@/lib/storage';
import { cn, formatNumber, parseNumber, pluralize } from '@/lib/utils';

type Units = 'ml' | 'oz';

interface Settings {
  units: Units;
  weightKg: number;
  activity: 'low' | 'moderate' | 'high';
  climate: 'temperate' | 'hot';
  /** A manual override, in millilitres. Null uses the calculated target. */
  customTargetMl: number | null;
}

const DEFAULT_SETTINGS: Settings = {
  units: 'ml',
  weightKg: 70,
  activity: 'moderate',
  climate: 'temperate',
  customTargetMl: null,
};

/** Intake log, millilitres per ISO date. */
type Log = Record<string, number>;

const ML_PER_OZ = 29.5735;

const QUICK_ADDS_ML = [
  { label: 'Glass', ml: 250 },
  { label: 'Large glass', ml: 400 },
  { label: 'Bottle', ml: 500 },
  { label: 'Large bottle', ml: 750 },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * Estimate a daily target.
 *
 * Starts from roughly 33 ml per kg of body weight — a commonly cited baseline —
 * then adds for activity and heat. This is a rule of thumb, not a clinical
 * recommendation, and the UI says so.
 */
function calculateTargetMl(settings: Settings): number {
  const base = settings.weightKg * 33;
  const activityBonus = settings.activity === 'high' ? 700 : settings.activity === 'moderate' ? 350 : 0;
  const climateBonus = settings.climate === 'hot' ? 500 : 0;
  return Math.round(base + activityBonus + climateBonus);
}

export function WaterTracker() {
  const mounted = useMounted();
  const [settings, setSettings] = useLocalStorage<Settings>('water:settings', DEFAULT_SETTINGS, {
    validate: (value): value is Settings =>
      typeof value === 'object' && value !== null && typeof (value as Settings).weightKg === 'number',
  });
  const [log, setLog, logReady] = useLocalStorage<Log>('water:log', {}, {
    validate: (value): value is Log => typeof value === 'object' && value !== null,
  });
  const [customAmount, setCustomAmount] = useState('');

  const targetMl = settings.customTargetMl ?? calculateTargetMl(settings);
  const consumedMl = mounted ? (log[todayKey()] ?? 0) : 0;

  const toDisplay = (ml: number) => (settings.units === 'ml' ? ml : ml / ML_PER_OZ);
  const unitLabel = settings.units === 'ml' ? 'ml' : 'fl oz';
  const showAmount = (ml: number) =>
    `${formatNumber(toDisplay(ml), settings.units === 'ml' ? 0 : 1)} ${unitLabel}`;

  const addMl = (ml: number) => {
    if (ml <= 0) return;
    setLog((current) => ({
      ...current,
      // Never go below zero when subtracting.
      [todayKey()]: Math.max(0, (current[todayKey()] ?? 0) + ml),
    }));
  };

  const history = useMemo(() => {
    const days: Array<{ date: string; ml: number; label: string }> = [];
    for (let offset = 13; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      days.push({
        date: key,
        ml: log[key] ?? 0,
        label: new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(date),
      });
    }
    return days;
  }, [log]);

  const streak = useMemo(() => {
    // Count back from today while each day hit the target.
    let count = 0;
    for (let index = history.length - 1; index >= 0; index -= 1) {
      if ((history[index]?.ml ?? 0) >= targetMl) count += 1;
      else break;
    }
    return count;
  }, [history, targetMl]);

  const percent = targetMl > 0 ? Math.min(100, (consumedMl / targetMl) * 100) : 0;
  const remaining = Math.max(0, targetMl - consumedMl);

  return (
    <ToolColumns
      main={
        <>
          <Card className="text-center">
            <CardHeader title="Today" icon={<Droplets />} className="text-left" />

            <div className="mt-5 flex justify-center">
              <ProgressRing
                value={consumedMl}
                max={targetMl}
                size={220}
                label={`${formatNumber(percent, 0)}%`}
                sublabel={
                  logReady
                    ? `${showAmount(consumedMl)} of ${showAmount(targetMl)}`
                    : 'Loading…'
                }
                ariaLabel={`${formatNumber(percent, 0)} percent of today's water target reached`}
              />
            </div>

            {logReady && (
              <p className="mt-4 text-[13px] text-fg-muted">
                {remaining === 0
                  ? "You've hit today's target. 🎉"
                  : `${showAmount(remaining)} to go.`}
              </p>
            )}

            <div className="mt-6">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                Log a drink
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_ADDS_ML.map((item) => (
                  <Button key={item.label} variant="soft" onClick={() => addMl(item.ml)}>
                    {item.label}
                    <span className="ml-1 text-[11px] opacity-70">{showAmount(item.ml)}</span>
                  </Button>
                ))}
              </div>

              <div className="mx-auto mt-4 flex max-w-sm items-end gap-2">
                <Field label={`Custom amount (${unitLabel})`} className="flex-1">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.currentTarget.value)}
                    placeholder={settings.units === 'ml' ? '300' : '10'}
                  />
                </Field>
                <Button
                  variant="primary"
                  leadingIcon={<Plus />}
                  onClick={() => {
                    const value = parseNumber(customAmount);
                    if (value === null || value <= 0) return;
                    addMl(settings.units === 'ml' ? value : value * ML_PER_OZ);
                    setCustomAmount('');
                  }}
                >
                  Add
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => addMl(-250)} disabled={consumedMl === 0}>
                  Undo a glass
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leadingIcon={<RotateCcw />}
                  onClick={() => setLog((current) => ({ ...current, [todayKey()]: 0 }))}
                  disabled={consumedMl === 0}
                  className="text-fg-subtle hover:text-danger"
                >
                  Reset today
                </Button>
              </div>
            </div>
          </Card>

          {logReady && (
            <Card>
              <CardHeader title="Last 14 days" description="Bars reaching the line hit that day's target." />
              <div className="mt-5">
                {/* One shared scale for the bars and the target line: the tallest
                    of (target, best day) maps to BAR_AREA px. */}
                {(() => {
                  const BAR_AREA = 88;
                  const scale = Math.max(targetMl, ...history.map((day) => day.ml));
                  const barHeight = (ml: number) => Math.max(3, (ml / scale) * BAR_AREA);

                  return (
                    <>
                      <div className="relative" style={{ height: BAR_AREA }}>
                        <div
                          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-accent/60"
                          style={{ bottom: barHeight(targetMl) }}
                          aria-hidden="true"
                        />
                        <div className="flex h-full items-end justify-between gap-1.5">
                          {history.map((day) => (
                            <div
                              key={day.date}
                              title={`${day.date}: ${showAmount(day.ml)}`}
                              className={cn(
                                'flex-1 rounded-t-[3px] transition-[height]',
                                day.ml === 0 ? 'bg-border' : day.ml >= targetMl ? 'bg-accent' : 'bg-accent/45',
                              )}
                              style={{ height: barHeight(day.ml) }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-1.5 flex justify-between gap-1.5">
                        {history.map((day) => (
                          <span key={day.date} className="flex-1 text-center text-[9px] text-fg-subtle">
                            {day.label}
                          </span>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Stat label="Current streak" value={pluralize(streak, 'day')} hint="days hitting the target" />
                <Stat
                  label="14-day average"
                  value={showAmount(history.reduce((sum, day) => sum + day.ml, 0) / history.length)}
                />
                <Stat
                  label="Days on target"
                  value={`${history.filter((day) => day.ml >= targetMl).length} of 14`}
                />
              </div>
            </Card>
          )}

          <Callout tone="info" title="A rule of thumb, not a prescription">
            Fluid needs vary a great deal with body size, activity, heat, altitude, diet and any medical
            conditions — and food contributes a meaningful share of your intake too. Thirst is a reasonable
            guide for most healthy adults. If you have a kidney or heart condition, or take medication that
            affects fluid balance, follow your clinician&apos;s advice over any calculator.
          </Callout>
        </>
      }
      side={
        <Card>
          <CardHeader title="Your target" />

          <div className="mt-4 space-y-4">
            <Field label="Units">
              <Segmented
                value={settings.units}
                onChange={(value) => setSettings({ ...settings, units: value })}
                ariaLabel="Units"
                fullWidth
                options={[
                  { value: 'ml', label: 'Millilitres' },
                  { value: 'oz', label: 'Fluid ounces' },
                ]}
              />
            </Field>

            <Slider
              label="Body weight"
              value={settings.weightKg}
              onChange={(value) => setSettings({ ...settings, weightKg: value })}
              min={30}
              max={200}
              formatValue={(value) =>
                settings.units === 'ml'
                  ? `${value} kg`
                  : `${formatNumber(value / 0.45359237, 0)} lb`
              }
            />

            <Field label="Activity">
              <Segmented
                value={settings.activity}
                onChange={(value) => setSettings({ ...settings, activity: value })}
                ariaLabel="Activity level"
                fullWidth
                size="sm"
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'moderate', label: 'Moderate' },
                  { value: 'high', label: 'High' },
                ]}
              />
            </Field>

            <Field label="Climate">
              <Segmented
                value={settings.climate}
                onChange={(value) => setSettings({ ...settings, climate: value })}
                ariaLabel="Climate"
                fullWidth
                size="sm"
                options={[
                  { value: 'temperate', label: 'Temperate' },
                  { value: 'hot', label: 'Hot or humid' },
                ]}
              />
            </Field>

            <div className="rounded-xl border border-accent/25 bg-accent-soft px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-text/80">
                Suggested daily target
              </p>
              <p className="tabular mt-0.5 text-xl font-semibold text-accent-text">
                {showAmount(calculateTargetMl(settings))}
              </p>
              <p className="mt-1 text-[11px] text-fg-muted">
                About 33 ml per kg, plus activity and climate.
              </p>
            </div>

            <Field label="Or set your own target" hint="Leave empty to use the suggestion above.">
              <Input
                type="number"
                inputMode="decimal"
                value={
                  settings.customTargetMl === null
                    ? ''
                    : String(Math.round(toDisplay(settings.customTargetMl)))
                }
                onChange={(event) => {
                  const value = parseNumber(event.currentTarget.value);
                  setSettings({
                    ...settings,
                    customTargetMl:
                      value === null || value <= 0
                        ? null
                        : settings.units === 'ml'
                          ? value
                          : value * ML_PER_OZ,
                  });
                }}
                suffix={unitLabel}
              />
            </Field>
          </div>
        </Card>
      }
    />
  );
}
