/**
 * CSV parsing and serialisation.
 *
 * Hand-written rather than pulling in a parser, because the tricky parts of
 * RFC 4180 are short: quoted fields that contain the delimiter, escaped quotes
 * (`""`), and embedded newlines inside quotes. Naive `split(',')` breaks on all
 * three, which is what makes most "CSV to JSON" tools quietly mangle real data.
 */

export type CsvRow = string[];

export interface ParseResult {
  rows: CsvRow[];
  /** The delimiter actually used, whether given or detected. */
  delimiter: string;
}

const CANDIDATE_DELIMITERS = [',', '\t', ';', '|'] as const;

/**
 * Guess the delimiter by counting occurrences outside quoted regions on the
 * first few lines. Counting inside quotes would let a single address field
 * ("Berlin, Germany") outvote the real delimiter.
 */
export function detectDelimiter(input: string): string {
  const sample = input.slice(0, 8192);
  let best = ',';
  let bestCount = 0;

  for (const candidate of CANDIDATE_DELIMITERS) {
    let count = 0;
    let inQuotes = false;

    for (let i = 0; i < sample.length; i += 1) {
      const char = sample[i];
      if (char === '"') {
        // A doubled quote inside a quoted field is an escaped quote, not a close.
        if (inQuotes && sample[i + 1] === '"') {
          i += 1;
          continue;
        }
        inQuotes = !inQuotes;
      } else if (char === candidate && !inQuotes) {
        count += 1;
      }
    }

    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  }

  return best;
}

export function parseCsv(input: string, delimiter?: string): ParseResult {
  const sep = delimiter ?? detectDelimiter(input);
  const rows: CsvRow[] = [];

  let field = '';
  let row: CsvRow = [];
  let inQuotes = false;
  let sawAnyContent = false;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      sawAnyContent = true;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      sawAnyContent = true;
      continue;
    }

    if (char === sep) {
      endField();
      sawAnyContent = true;
      continue;
    }

    if (char === '\r') {
      // Swallow CRLF as one line break.
      if (input[i + 1] === '\n') i += 1;
      endRow();
      continue;
    }

    if (char === '\n') {
      endRow();
      continue;
    }

    field += char;
    sawAnyContent = true;
  }

  // Flush the final row unless the input ended with a clean line break.
  if (field !== '' || row.length > 0) endRow();

  // Drop a trailing empty row produced by a file ending in a newline.
  while (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last && last.length === 1 && last[0] === '') rows.pop();
    else break;
  }

  return { rows: sawAnyContent ? rows : [], delimiter: sep };
}

/** Convert a scalar string to a number/boolean/null when it unambiguously is one. */
export function inferType(value: string): string | number | boolean | null {
  const trimmed = value.trim();
  if (trimmed === '') return '';
  if (trimmed === 'null' || trimmed === 'NULL') return null;
  if (trimmed === 'true' || trimmed === 'TRUE') return true;
  if (trimmed === 'false' || trimmed === 'FALSE') return false;

  // Require the round-trip to match, so "007" and "1e999" stay strings rather
  // than silently becoming 7 and Infinity.
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed) && String(parsed) === trimmed) return parsed;
  }

  return value;
}

export interface CsvToJsonOptions {
  /** Treat row 0 as column names. */
  hasHeader?: boolean;
  /** Convert numeric/boolean-looking cells to real JSON types. */
  typed?: boolean;
  delimiter?: string;
}

export function csvToJson(
  input: string,
  options: CsvToJsonOptions = {},
): { data: unknown[]; headers: string[]; delimiter: string } {
  const { hasHeader = true, typed = true, delimiter } = options;
  const { rows, delimiter: used } = parseCsv(input, delimiter);

  if (rows.length === 0) return { data: [], headers: [], delimiter: used };

  const headers = hasHeader
    ? (rows[0] ?? []).map((name, index) => name.trim() || `column_${index + 1}`)
    : (rows[0] ?? []).map((_, index) => `column_${index + 1}`);

  const bodyRows = hasHeader ? rows.slice(1) : rows;

  const data = bodyRows.map((cells) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      const raw = cells[index] ?? '';
      record[header] = typed ? inferType(raw) : raw;
    });
    return record;
  });

  return { data, headers, delimiter: used };
}

/** Quote a field only when it needs it, keeping output diff-friendly. */
function escapeField(value: string, delimiter: string): string {
  const needsQuotes =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r') ||
    value !== value.trim();

  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function jsonToCsv(
  data: unknown,
  options: { delimiter?: string; includeHeader?: boolean } = {},
): string {
  const { delimiter = ',', includeHeader = true } = options;

  if (!Array.isArray(data)) throw new Error('Top-level JSON must be an array of objects or arrays.');
  if (data.length === 0) return '';

  // Arrays of arrays are already tabular.
  if (Array.isArray(data[0])) {
    return (data as unknown[][])
      .map((row) => row.map((cell) => escapeField(stringifyCell(cell), delimiter)).join(delimiter))
      .join('\n');
  }

  // Union the keys across every row in first-seen order, so a record missing a
  // field yields an empty cell rather than shifting the columns.
  const headers: string[] = [];
  for (const row of data) {
    if (row === null || typeof row !== 'object') {
      throw new Error('Every item must be an object (or every item an array).');
    }
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) headers.push(key);
    }
  }

  const lines: string[] = [];
  if (includeHeader) lines.push(headers.map((h) => escapeField(h, delimiter)).join(delimiter));

  for (const row of data as Array<Record<string, unknown>>) {
    lines.push(headers.map((header) => escapeField(stringifyCell(row[header]), delimiter)).join(delimiter));
  }

  return lines.join('\n');
}

export const DELIMITER_OPTIONS = [
  { value: 'auto', label: 'Detect automatically' },
  { value: ',', label: 'Comma  ,' },
  { value: '\t', label: 'Tab' },
  { value: ';', label: 'Semicolon  ;' },
  { value: '|', label: 'Pipe  |' },
] as const;
