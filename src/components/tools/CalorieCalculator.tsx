'use client';

import { Flame } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Card, CardHeader, Result, Stat } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Controls';
import { DataTable } from '@/components/ui/DataTable';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatNumber, parseNumber } from '@/lib/utils';

type Units = 'metric' | 'imperial';
type Sex = 'male' | 'female';
type Goal = 'lose' | 'maintain' | 'gain';

/** Activity multipliers applied to BMR to estimate total daily expenditure. */
const ACTIVITY_LEVELS = [
  { value: '1.2', label: 'Sedentary — desk job, little exercise' },
  { value: '1.375', label: 'Lightly active — 1–3 sessions a week' },
  { value: '1.55', label: 'Moderately active — 3–5 sessions a week' },
  { value: '1.725', label: 'Very active — 6–7 sessions a week' },
  { value: '1.9', label: 'Extremely active — physical job or twice daily' },
];

/** Goal adjustments, as a share of maintenance rather than a flat number, so a
 *  smaller person is not given an unsafely aggressive deficit. */
const GOALS: Record<Goal, { label: string; factor: number; note: string }> = {
  lose: { label: 'Lose weight', factor: 0.8, note: 'A 20% deficit — roughly 0.5 kg (1 lb) a week' },
  maintain: { label: 'Maintain', factor: 1, note: 'Matches your estimated daily expenditure' },
  gain: { label: 'Gain weight', factor: 1.15, note: 'A 15% surplus, aimed at gaining slowly' },
};

const MACRO_SPLITS = [
  { id: 'balanced', label: 'Balanced', protein: 30, carbs: 40, fat: 30 },
  { id: 'lowcarb', label: 'Lower carb', protein: 35, carbs: 25, fat: 40 },
  { id: 'highcarb', label: 'Higher carb', protein: 25, carbs: 55, fat: 20 },
  { id: 'keto', label: 'Very low carb', protein: 30, carbs: 10, fat: 60 },
];

/** Calories per gram. */
const KCAL = { protein: 4, carbs: 4, fat: 9 };

export function CalorieCalculator() {
  const [units, setUnits] = useState<Units>('metric');
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('30');
  const [cm, setCm] = useState('175');
  const [kg, setKg] = useState('72');
  const [feet, setFeet] = useState('5');
  const [inches, setInches] = useState('9');
  const [pounds, setPounds] = useState('160');
  const [activity, setActivity] = useState('1.375');
  const [goal, setGoal] = useState<Goal>('maintain');

  const result = useMemo(() => {
    const years = parseNumber(age);
    if (years === null || years < 15 || years > 100) return null;

    let heightCm: number | null = null;
    let weightKg: number | null = null;

    if (units === 'metric') {
      heightCm = parseNumber(cm);
      weightKg = parseNumber(kg);
    } else {
      const totalInches = (parseNumber(feet) ?? 0) * 12 + (parseNumber(inches) ?? 0);
      const lb = parseNumber(pounds);
      if (totalInches > 0) heightCm = totalInches * 2.54;
      if (lb !== null) weightKg = lb * 0.45359237;
    }

    if (heightCm === null || weightKg === null || heightCm <= 0 || weightKg <= 0) return null;

    // Mifflin-St Jeor — the equation with the best accuracy in validation
    // studies for the general adult population.
    const bmr =
      10 * weightKg + 6.25 * heightCm - 5 * years + (sex === 'male' ? 5 : -161);

    const tdee = bmr * Number(activity);
    const target = tdee * GOALS[goal].factor;

    return { bmr, tdee, target, weightKg };
  }, [units, sex, age, cm, kg, feet, inches, pounds, activity, goal]);

  const macroRows = useMemo(() => {
    if (!result) return [];
    return MACRO_SPLITS.map((split) => ({
      ...split,
      proteinGrams: (result.target * (split.protein / 100)) / KCAL.protein,
      carbGrams: (result.target * (split.carbs / 100)) / KCAL.carbs,
      fatGrams: (result.target * (split.fat / 100)) / KCAL.fat,
    }));
  }, [result]);

  return (
    <ToolColumns
      main={
        <>
          <Card>
            <CardHeader
              title="About you"
              icon={<Flame />}
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

            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Sex" hint="The equation uses different constants for each.">
                  <Segmented
                    value={sex}
                    onChange={setSex}
                    ariaLabel="Sex"
                    fullWidth
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                    ]}
                  />
                </Field>
                <Field label="Age">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={age}
                    onChange={(event) => setAge(event.currentTarget.value)}
                    suffix="years"
                  />
                </Field>
              </div>

              {units === 'metric' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Height">
                    <Input type="number" value={cm} onChange={(event) => setCm(event.currentTarget.value)} suffix="cm" />
                  </Field>
                  <Field label="Weight">
                    <Input type="number" value={kg} onChange={(event) => setKg(event.currentTarget.value)} suffix="kg" />
                  </Field>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Height">
                    <Input type="number" value={feet} onChange={(event) => setFeet(event.currentTarget.value)} suffix="ft" />
                  </Field>
                  <Field label="&nbsp;">
                    <Input type="number" value={inches} onChange={(event) => setInches(event.currentTarget.value)} suffix="in" />
                  </Field>
                  <Field label="Weight">
                    <Input type="number" value={pounds} onChange={(event) => setPounds(event.currentTarget.value)} suffix="lb" />
                  </Field>
                </div>
              )}

              <Field label="Activity level">
                <Select
                  options={ACTIVITY_LEVELS}
                  value={activity}
                  onChange={(event) => setActivity(event.currentTarget.value)}
                />
              </Field>

              <Field label="Goal" hint={GOALS[goal].note}>
                <Segmented
                  value={goal}
                  onChange={setGoal}
                  ariaLabel="Goal"
                  fullWidth
                  options={[
                    { value: 'lose', label: 'Lose' },
                    { value: 'maintain', label: 'Maintain' },
                    { value: 'gain', label: 'Gain' },
                  ]}
                />
              </Field>
            </div>
          </Card>

          {result && (
            <Card flush>
              <div className="p-5 pb-3">
                <CardHeader
                  title="Macronutrient splits"
                  description={`Grams per day at ${formatNumber(result.target, 0)} kcal. Pick whichever split you can actually stick to.`}
                />
              </div>
              <div className="px-3 pb-3">
                <DataTable
                  caption="Protein, carbohydrate and fat in grams for each split"
                  rows={macroRows}
                  rowKey={(row) => row.id}
                  columns={[
                    { key: 'label', header: 'Split', render: (row) => <span className="font-medium text-fg">{row.label}</span> },
                    {
                      key: 'protein',
                      header: 'Protein',
                      numeric: true,
                      render: (row) => (
                        <span>
                          {formatNumber(row.proteinGrams, 0)} g
                          <span className="ml-1 text-[11px] text-fg-subtle">{row.protein}%</span>
                        </span>
                      ),
                    },
                    {
                      key: 'carbs',
                      header: 'Carbs',
                      numeric: true,
                      render: (row) => (
                        <span>
                          {formatNumber(row.carbGrams, 0)} g
                          <span className="ml-1 text-[11px] text-fg-subtle">{row.carbs}%</span>
                        </span>
                      ),
                    },
                    {
                      key: 'fat',
                      header: 'Fat',
                      numeric: true,
                      render: (row) => (
                        <span>
                          {formatNumber(row.fatGrams, 0)} g
                          <span className="ml-1 text-[11px] text-fg-subtle">{row.fat}%</span>
                        </span>
                      ),
                    },
                  ]}
                />
              </div>
            </Card>
          )}

          <Callout tone="warning" title="These are population estimates">
            BMR equations are fitted to averages, so an individual&apos;s real energy needs can differ by several
            hundred calories a day. Activity multipliers are especially rough. Use this as a starting point,
            track what actually happens over two or three weeks, and adjust from there — and speak to a doctor
            or dietitian before making significant changes, particularly if you are pregnant, managing a
            condition, or under 18.
          </Callout>
        </>
      }
      side={
        result === null ? (
          <Card>
            <p className="py-6 text-center text-[13px] text-fg-muted">
              Fill in your details to see an estimate.
            </p>
          </Card>
        ) : (
          <>
            <Card>
              <Result
                label={`Daily target to ${GOALS[goal].label.toLowerCase()}`}
                value={`${formatNumber(result.target, 0)} kcal`}
                hint={GOALS[goal].note}
              />

              <div className="mt-4 grid gap-2.5">
                <Stat
                  label="BMR"
                  value={`${formatNumber(result.bmr, 0)} kcal`}
                  hint="At complete rest — Mifflin-St Jeor"
                />
                <Stat
                  label="Maintenance (TDEE)"
                  value={`${formatNumber(result.tdee, 0)} kcal`}
                  hint="BMR scaled by your activity level"
                />
                {goal !== 'maintain' && (
                  <Stat
                    label={goal === 'lose' ? 'Daily deficit' : 'Daily surplus'}
                    value={`${formatNumber(Math.abs(result.tdee - result.target), 0)} kcal`}
                    hint={
                      goal === 'lose'
                        ? `About ${formatNumber((Math.abs(result.tdee - result.target) * 7) / 7700, 2)} kg a week`
                        : `About ${formatNumber((Math.abs(result.tdee - result.target) * 7) / 7700, 2)} kg a week`
                    }
                  />
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Protein guideline" />
              <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">
                A common recommendation for someone training regularly is{' '}
                <strong className="text-fg">
                  {formatNumber(result.weightKg * 1.6, 0)}–{formatNumber(result.weightKg * 2.2, 0)} g
                </strong>{' '}
                of protein a day, which is 1.6 to 2.2 g per kilogram of body weight. If you are not training,
                the lower end is plenty.
              </p>
            </Card>
          </>
        )
      }
    />
  );
}
