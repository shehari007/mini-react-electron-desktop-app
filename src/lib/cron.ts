/**
 * Cron expression parsing, description and next-run prediction.
 *
 * Supports the standard five-field Vixen cron syntax: `*`, `a-b` ranges, `a,b,c`
 * lists, `*​/n` and `a-b/n` steps, plus three-letter month and day names. Special
 * strings (@daily and friends) are expanded before parsing.
 *
 * Deliberately does not support the Quartz extensions (`?`, `L`, `W`, `#`) —
 * those mean different things in different schedulers, and silently accepting
 * them would produce confidently wrong next-run times.
 */

export interface CronField {
  name: string;
  min: number;
  max: number;
  /** The set of matching values, sorted ascending. */
  values: number[];
  /** True when the field was `*`, which changes how it's described. */
  wildcard: boolean;
}

export interface ParsedCron {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
}

export interface CronParseError {
  field: string;
  message: string;
}

export type CronResult = { ok: true; cron: ParsedCron } | { ok: false; errors: CronParseError[] };

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const CRON_PRESETS = [
  { expression: '* * * * *', label: 'Every minute' },
  { expression: '*/5 * * * *', label: 'Every 5 minutes' },
  { expression: '0 * * * *', label: 'Hourly, on the hour' },
  { expression: '0 9 * * *', label: 'Every day at 09:00' },
  { expression: '30 2 * * *', label: 'Every day at 02:30' },
  { expression: '0 9 * * 1-5', label: 'Weekdays at 09:00' },
  { expression: '0 0 * * 0', label: 'Weekly, Sunday midnight' },
  { expression: '0 0 1 * *', label: 'Monthly, 1st at midnight' },
  { expression: '0 0 1 1 *', label: 'Yearly, 1 January' },
] as const;

const ALIASES: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

interface FieldSpec {
  name: string;
  min: number;
  max: number;
  names?: string[];
}

const SPECS: FieldSpec[] = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day of month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12, names: MONTH_NAMES },
  { name: 'day of week', min: 0, max: 6, names: DAY_NAMES },
];

function parseValue(token: string, spec: FieldSpec): number | null {
  const lower = token.toLowerCase();

  if (spec.names) {
    const index = spec.names.indexOf(lower.slice(0, 3));
    // Month names are 1-based, day names 0-based — the spec's own min supplies
    // the offset rather than hard-coding it per field.
    if (index >= 0) return index + spec.min;
  }

  if (!/^\d+$/.test(token)) return null;
  const value = Number(token);

  // Cron accepts 7 for Sunday as well as 0.
  if (spec.name === 'day of week' && value === 7) return 0;

  return value >= spec.min && value <= spec.max ? value : null;
}

function parseField(raw: string, spec: FieldSpec): { field: CronField } | { error: string } {
  const values = new Set<number>();
  let wildcard = false;

  for (const part of raw.split(',')) {
    const token = part.trim();
    if (token === '') return { error: 'Empty value in list.' };

    const [rangePart, stepPart, ...extra] = token.split('/');
    if (extra.length > 0) return { error: `Too many "/" in "${token}".` };

    let step = 1;
    if (stepPart !== undefined) {
      if (!/^\d+$/.test(stepPart) || Number(stepPart) < 1) {
        return { error: `Step must be a positive number in "${token}".` };
      }
      step = Number(stepPart);
    }

    let start: number;
    let end: number;

    if (rangePart === '*' || rangePart === undefined) {
      start = spec.min;
      end = spec.max;
      if (step === 1) wildcard = true;
    } else if (rangePart.includes('-')) {
      const [fromRaw, toRaw, ...rest] = rangePart.split('-');
      if (rest.length > 0 || fromRaw === undefined || toRaw === undefined) {
        return { error: `Malformed range "${rangePart}".` };
      }
      const from = parseValue(fromRaw, spec);
      const to = parseValue(toRaw, spec);
      if (from === null) return { error: `"${fromRaw}" is not valid (${spec.min}–${spec.max}).` };
      if (to === null) return { error: `"${toRaw}" is not valid (${spec.min}–${spec.max}).` };
      if (from > to) return { error: `Range "${rangePart}" runs backwards.` };
      start = from;
      end = to;
    } else {
      const single = parseValue(rangePart, spec);
      if (single === null) return { error: `"${rangePart}" is not valid (${spec.min}–${spec.max}).` };
      // A bare value with a step means "from here to the end", per Vixen cron.
      start = single;
      end = stepPart === undefined ? single : spec.max;
    }

    for (let value = start; value <= end; value += step) values.add(value);
  }

  if (values.size === 0) return { error: 'No values matched.' };

  return {
    field: { name: spec.name, min: spec.min, max: spec.max, values: [...values].sort((a, b) => a - b), wildcard },
  };
}

export function parseCron(input: string): CronResult {
  const normalized = (ALIASES[input.trim().toLowerCase()] ?? input).trim().replace(/\s+/g, ' ');

  if (normalized === '') {
    return { ok: false, errors: [{ field: 'expression', message: 'Enter a cron expression.' }] };
  }

  if (/[?LW#]/.test(normalized)) {
    return {
      ok: false,
      errors: [
        {
          field: 'expression',
          message: 'Quartz-only syntax (? L W #) is not supported — these mean different things per scheduler.',
        },
      ],
    };
  }

  const parts = normalized.split(' ');
  if (parts.length !== 5) {
    return {
      ok: false,
      errors: [
        {
          field: 'expression',
          message: `Expected 5 fields (minute hour day month weekday), found ${parts.length}.`,
        },
      ],
    };
  }

  const errors: CronParseError[] = [];
  const fields: CronField[] = [];

  parts.forEach((part, index) => {
    const spec = SPECS[index];
    if (!spec) return;
    const outcome = parseField(part, spec);
    if ('error' in outcome) errors.push({ field: spec.name, message: outcome.error });
    else fields.push(outcome.field);
  });

  if (errors.length > 0) return { ok: false, errors };

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;
  if (!minute || !hour || !dayOfMonth || !month || !dayOfWeek) {
    return { ok: false, errors: [{ field: 'expression', message: 'Could not parse all five fields.' }] };
  }

  return { ok: true, cron: { minute, hour, dayOfMonth, month, dayOfWeek } };
}

// ─── Description ──────────────────────────────────────────────────────────

function listToWords(values: number[], labels?: string[]): string {
  const names = values.map((value) => labels?.[value] ?? String(value));
  if (names.length === 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function isEveryN(field: CronField): number | null {
  if (field.values.length < 2) return null;
  const first = field.values[0];
  if (first !== field.min) return null;

  const step = (field.values[1] ?? 0) - (first ?? 0);
  for (let i = 1; i < field.values.length; i += 1) {
    if ((field.values[i] ?? 0) - (field.values[i - 1] ?? 0) !== step) return null;
  }
  // Confirm it really covers the range, so 0,15,30 (stopping early) isn't
  // described as "every 15 minutes".
  return (field.values[field.values.length - 1] ?? 0) + step > field.max ? step : null;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** A plain-English sentence for the expression. */
export function describeCron(cron: ParsedCron): string {
  const { minute, hour, dayOfMonth, month, dayOfWeek } = cron;

  // Time of day
  let time: string;
  const minuteStep = isEveryN(minute);
  const hourStep = isEveryN(hour);

  if (minute.wildcard && hour.wildcard) {
    time = 'Every minute';
  } else if (minuteStep && hour.wildcard) {
    time = `Every ${minuteStep} minutes`;
  } else if (minute.wildcard) {
    time = `Every minute past hour ${listToWords(hour.values)}`;
  } else if (hour.wildcard) {
    time =
      minute.values.length === 1
        ? `At ${minute.values[0]} minutes past every hour`
        : `At ${listToWords(minute.values)} minutes past every hour`;
  } else if (hourStep && minute.values.length === 1) {
    time = `Every ${hourStep} hours at ${pad(minute.values[0] ?? 0)} past`;
  } else if (minute.values.length === 1 && hour.values.length === 1) {
    time = `At ${pad(hour.values[0] ?? 0)}:${pad(minute.values[0] ?? 0)}`;
  } else {
    const times = hour.values.flatMap((h) => minute.values.map((m) => `${pad(h)}:${pad(m)}`));
    // A cross product of hours × minutes can run to dozens of entries; past six
    // the list stops being readable, so it gets truncated with a count.
    time =
      times.length > 6
        ? `At ${times.slice(0, 6).join(', ')} and ${times.length - 6} more times`
        : `At ${times.join(', ')}`;
  }

  // Day constraints. Cron ORs day-of-month and day-of-week when both are
  // restricted, which is a genuine gotcha worth spelling out.
  const parts: string[] = [];
  const domRestricted = !dayOfMonth.wildcard;
  const dowRestricted = !dayOfWeek.wildcard;

  if (domRestricted && dowRestricted) {
    // Rendered as plain text, so no markdown emphasis here — it would show up
    // as literal asterisks.
    parts.push(
      `on day ${listToWords(dayOfMonth.values)} of the month, or on ${listToWords(dayOfWeek.values, DAY_LABELS)} — cron matches either of those, not both together`,
    );
  } else if (domRestricted) {
    const step = isEveryN(dayOfMonth);
    parts.push(step ? `every ${step} days` : `on day ${listToWords(dayOfMonth.values)} of the month`);
  } else if (dowRestricted) {
    const isWeekdays = dayOfWeek.values.join(',') === '1,2,3,4,5';
    const isWeekend = dayOfWeek.values.join(',') === '0,6';
    if (isWeekdays) parts.push('on weekdays');
    else if (isWeekend) parts.push('at weekends');
    else parts.push(`on ${listToWords(dayOfWeek.values, DAY_LABELS)}`);
  }

  if (!month.wildcard) {
    // Month values are 1-based, so the label array is padded at index 0 to keep
    // `labels[value]` aligned.
    parts.push(`in ${listToWords(month.values, ['', ...MONTH_LABELS])}`);
  }

  return parts.length > 0 ? `${time}, ${parts.join(', ')}.` : `${time}, every day.`;
}

// ─── Next runs ────────────────────────────────────────────────────────────

/**
 * Step forward minute by minute looking for matches.
 *
 * Brute force rather than clever date arithmetic: the search is bounded to four
 * years, and being obviously correct matters more here than being fast, because
 * a wrong next-run time is worse than a slow one.
 */
export function nextRuns(cron: ParsedCron, from: Date, count = 5): Date[] {
  const results: Date[] = [];

  const cursor = new Date(from.getTime());
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  const minuteSet = new Set(cron.minute.values);
  const hourSet = new Set(cron.hour.values);
  const domSet = new Set(cron.dayOfMonth.values);
  const monthSet = new Set(cron.month.values);
  const dowSet = new Set(cron.dayOfWeek.values);

  const domRestricted = !cron.dayOfMonth.wildcard;
  const dowRestricted = !cron.dayOfWeek.wildcard;

  const limit = new Date(cursor.getTime());
  limit.setFullYear(limit.getFullYear() + 4);

  while (results.length < count && cursor <= limit) {
    if (
      minuteSet.has(cursor.getMinutes()) &&
      hourSet.has(cursor.getHours()) &&
      monthSet.has(cursor.getMonth() + 1)
    ) {
      const domMatch = domSet.has(cursor.getDate());
      const dowMatch = dowSet.has(cursor.getDay());

      // Both restricted → OR. Otherwise only the restricted one applies.
      const dayMatch =
        domRestricted && dowRestricted ? domMatch || dowMatch : domRestricted ? domMatch : dowRestricted ? dowMatch : true;

      if (dayMatch) results.push(new Date(cursor.getTime()));
    }

    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return results;
}

export const CRON_FIELD_REFERENCE = [
  { field: 'Minute', range: '0–59', example: '*/15 → 0, 15, 30, 45' },
  { field: 'Hour', range: '0–23', example: '9-17 → 9am through 5pm' },
  { field: 'Day of month', range: '1–31', example: '1,15 → 1st and 15th' },
  { field: 'Month', range: '1–12 or JAN–DEC', example: '*/3 → quarterly' },
  { field: 'Day of week', range: '0–6 or SUN–SAT', example: '1-5 → Mon to Fri' },
] as const;
