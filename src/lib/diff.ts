/**
 * Line diffing.
 *
 * A standard longest-common-subsequence diff. The `diff` npm package would do
 * this too, but it's ~30KB for one algorithm that fits in a screen of code, and
 * this route is meant to load instantly.
 */

export type DiffKind = 'equal' | 'added' | 'removed';

export interface DiffLine {
  kind: DiffKind;
  text: string;
  /** 1-based line number in the original, or null for added lines. */
  leftNumber: number | null;
  /** 1-based line number in the changed text, or null for removed lines. */
  rightNumber: number | null;
}

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

export interface DiffOptions {
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
  /** Treat trailing blank lines as insignificant. */
  trimTrailingBlank?: boolean;
}

function splitLines(input: string, trimTrailingBlank: boolean): string[] {
  const lines = input.replace(/\r\n?/g, '\n').split('\n');
  if (trimTrailingBlank) {
    while (lines.length > 0 && (lines[lines.length - 1] ?? '').trim() === '') lines.pop();
  }
  return lines;
}

/** The value actually compared — display always keeps the original text. */
function normalize(line: string, options: DiffOptions): string {
  let value = line;
  if (options.ignoreWhitespace) value = value.replace(/\s+/g, ' ').trim();
  if (options.ignoreCase) value = value.toLowerCase();
  return value;
}

/**
 * LCS length table, then a walk back through it to recover the edit script.
 *
 * The table is (n+1)×(m+1) numbers, so a 5000-line pair is ~25M entries — enough
 * to matter. Callers cap input size; this is a text-comparison tool, not a
 * source-control engine.
 */
export function diffLines(original: string, changed: string, options: DiffOptions = {}): DiffLine[] {
  const trimTrailing = options.trimTrailingBlank ?? true;
  const left = splitLines(original, trimTrailing);
  const right = splitLines(changed, trimTrailing);

  const leftKeys = left.map((line) => normalize(line, options));
  const rightKeys = right.map((line) => normalize(line, options));

  const n = left.length;
  const m = right.length;

  // Uint32Array rather than nested arrays: one flat allocation, and the indices
  // stay in a range where the engine keeps it as a typed array.
  const width = m + 1;
  const table = new Uint32Array((n + 1) * width);

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i * width + j] =
        leftKeys[i] === rightKeys[j]
          ? (table[(i + 1) * width + (j + 1)] ?? 0) + 1
          : Math.max(table[(i + 1) * width + j] ?? 0, table[i * width + (j + 1)] ?? 0);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < n && j < m) {
    if (leftKeys[i] === rightKeys[j]) {
      result.push({ kind: 'equal', text: left[i] ?? '', leftNumber: i + 1, rightNumber: j + 1 });
      i += 1;
      j += 1;
    } else if ((table[(i + 1) * width + j] ?? 0) >= (table[i * width + (j + 1)] ?? 0)) {
      result.push({ kind: 'removed', text: left[i] ?? '', leftNumber: i + 1, rightNumber: null });
      i += 1;
    } else {
      result.push({ kind: 'added', text: right[j] ?? '', leftNumber: null, rightNumber: j + 1 });
      j += 1;
    }
  }

  while (i < n) {
    result.push({ kind: 'removed', text: left[i] ?? '', leftNumber: i + 1, rightNumber: null });
    i += 1;
  }
  while (j < m) {
    result.push({ kind: 'added', text: right[j] ?? '', leftNumber: null, rightNumber: j + 1 });
    j += 1;
  }

  return result;
}

export function diffStats(lines: readonly DiffLine[]): DiffStats {
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  for (const line of lines) {
    if (line.kind === 'added') added += 1;
    else if (line.kind === 'removed') removed += 1;
    else unchanged += 1;
  }
  return { added, removed, unchanged };
}

export interface SideBySideRow {
  left: { text: string; number: number | null; kind: DiffKind } | null;
  right: { text: string; number: number | null; kind: DiffKind } | null;
}

/**
 * Pair the flat edit script into side-by-side rows, aligning a run of removals
 * against the run of additions that follows it so a modified line shows its old
 * and new text on the same row instead of on two separate ones.
 */
export function toSideBySide(lines: readonly DiffLine[]): SideBySideRow[] {
  const rows: SideBySideRow[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line) break;

    if (line.kind === 'equal') {
      rows.push({
        left: { text: line.text, number: line.leftNumber, kind: 'equal' },
        right: { text: line.text, number: line.rightNumber, kind: 'equal' },
      });
      index += 1;
      continue;
    }

    const removals: DiffLine[] = [];
    const additions: DiffLine[] = [];
    while (index < lines.length && lines[index]?.kind === 'removed') {
      removals.push(lines[index] as DiffLine);
      index += 1;
    }
    while (index < lines.length && lines[index]?.kind === 'added') {
      additions.push(lines[index] as DiffLine);
      index += 1;
    }

    const pairCount = Math.max(removals.length, additions.length);
    for (let pair = 0; pair < pairCount; pair += 1) {
      const removal = removals[pair];
      const addition = additions[pair];
      rows.push({
        left: removal ? { text: removal.text, number: removal.leftNumber, kind: 'removed' } : null,
        right: addition ? { text: addition.text, number: addition.rightNumber, kind: 'added' } : null,
      });
    }
  }

  return rows;
}

/** Unified-diff text, for copying into a comment or a patch. */
export function toUnifiedText(lines: readonly DiffLine[]): string {
  return lines
    .map((line) => `${line.kind === 'added' ? '+' : line.kind === 'removed' ? '-' : ' '}${line.text}`)
    .join('\n');
}
