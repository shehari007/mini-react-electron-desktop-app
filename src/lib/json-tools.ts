/**
 * JSON formatting, validation and tree building.
 *
 * The valuable part is error reporting: `JSON.parse` throws messages like
 * "Unexpected token } in JSON at position 47", which is useless in a 2000-line
 * document. This converts the byte position into a line and column and quotes the
 * offending line, which is the difference between a usable validator and a
 * frustrating one.
 */

export interface JsonError {
  message: string;
  line: number;
  column: number;
  /** The source line the error is on, for display. */
  excerpt: string;
}

export type JsonParseResult = { ok: true; value: unknown } | { ok: false; error: JsonError };

/** Pull the character offset out of the various engine message formats. */
function extractPosition(message: string): number | null {
  // V8: "... at position 47". Newer V8 adds "(line 3 column 5)".
  const position = /at position (\d+)/.exec(message);
  if (position?.[1]) return Number(position[1]);
  return null;
}

function locate(source: string, offset: number): { line: number; column: number; excerpt: string } {
  const clamped = Math.max(0, Math.min(offset, source.length));
  const before = source.slice(0, clamped);
  const line = before.split('\n').length;
  const lastBreak = before.lastIndexOf('\n');
  const column = clamped - lastBreak;
  const excerpt = source.split('\n')[line - 1] ?? '';
  return { line, column, excerpt };
}

export function parseJson(source: string): JsonParseResult {
  if (source.trim() === '') {
    return { ok: false, error: { message: 'Nothing to parse yet.', line: 1, column: 1, excerpt: '' } };
  }

  try {
    return { ok: true, value: JSON.parse(source) };
  } catch (caught) {
    const raw = caught instanceof Error ? caught.message : 'Invalid JSON.';
    const offset = extractPosition(raw);

    // Some engines report line/column directly; prefer that when present.
    const direct = /line (\d+) column (\d+)/.exec(raw);
    if (direct?.[1] && direct[2]) {
      const line = Number(direct[1]);
      return {
        ok: false,
        error: {
          message: raw.replace(/\s*\(?line \d+ column \d+\)?/, '').replace(/\s+in JSON at position \d+/, ''),
          line,
          column: Number(direct[2]),
          excerpt: source.split('\n')[line - 1] ?? '',
        },
      };
    }

    const location = offset === null ? { line: 1, column: 1, excerpt: source.split('\n')[0] ?? '' } : locate(source, offset);

    return {
      ok: false,
      error: {
        message: raw.replace(/\s+in JSON at position \d+/, '').replace(/^JSON\.parse:\s*/, ''),
        ...location,
      },
    };
  }
}

/** Recursively sort object keys, for a stable diff between two documents. */
export function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, sortKeys(item)]),
    );
  }
  return value;
}

export function formatJson(value: unknown, indent: number | '\t'): string {
  return JSON.stringify(value, null, indent === '\t' ? '\t' : indent);
}

export function minifyJson(value: unknown): string {
  return JSON.stringify(value);
}

// ─── Tree ─────────────────────────────────────────────────────────────────

export type JsonValueKind = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface TreeNode {
  id: string;
  /** Key within the parent object, or index within the parent array. */
  label: string;
  /** Access path from the root, e.g. `data.items[2].name`. */
  path: string;
  kind: JsonValueKind;
  /** Rendered scalar value; empty for containers. */
  preview: string;
  children: TreeNode[];
  depth: number;
}

function kindOf(value: unknown): JsonValueKind {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const type = typeof value;
  if (type === 'object') return 'object';
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';
  return 'string';
}

function previewOf(value: unknown, kind: JsonValueKind): string {
  switch (kind) {
    case 'object':
      return `{ ${Object.keys(value as object).length} keys }`;
    case 'array':
      return `[ ${(value as unknown[]).length} items ]`;
    case 'string': {
      const text = value as string;
      return text.length > 80 ? `"${text.slice(0, 80)}…"` : `"${text}"`;
    }
    case 'null':
      return 'null';
    default:
      return String(value);
  }
}

/** Build a display tree. Depth is capped to avoid pathological nesting locking
 *  up the render on a hostile document. */
export function buildTree(value: unknown, maxDepth = 24): TreeNode {
  const walk = (item: unknown, label: string, path: string, depth: number, id: string): TreeNode => {
    const kind = kindOf(item);
    const node: TreeNode = {
      id,
      label,
      path,
      kind,
      preview: previewOf(item, kind),
      children: [],
      depth,
    };

    if (depth >= maxDepth) return node;

    if (kind === 'array') {
      node.children = (item as unknown[]).map((child, index) =>
        walk(child, String(index), `${path}[${index}]`, depth + 1, `${id}.${index}`),
      );
    } else if (kind === 'object') {
      node.children = Object.entries(item as Record<string, unknown>).map(([key, child], index) =>
        // Bracket notation for keys that aren't valid identifiers, so the path
        // is always something you could paste into code.
        walk(
          child,
          key,
          /^[A-Za-z_$][\w$]*$/.test(key) ? (path ? `${path}.${key}` : key) : `${path}["${key}"]`,
          depth + 1,
          `${id}.${index}`,
        ),
      );
    }

    return node;
  };

  return walk(value, 'root', '', 0, 'root');
}

export interface JsonStats {
  keys: number;
  arrays: number;
  objects: number;
  maxDepth: number;
  size: number;
}

export function jsonStats(value: unknown, minified: string): JsonStats {
  let keys = 0;
  let arrays = 0;
  let objects = 0;
  let maxDepth = 0;

  const walk = (item: unknown, depth: number) => {
    maxDepth = Math.max(maxDepth, depth);
    if (Array.isArray(item)) {
      arrays += 1;
      for (const child of item) walk(child, depth + 1);
    } else if (item !== null && typeof item === 'object') {
      objects += 1;
      for (const [, child] of Object.entries(item as Record<string, unknown>)) {
        keys += 1;
        walk(child, depth + 1);
      }
    }
  };

  walk(value, 0);
  return { keys, arrays, objects, maxDepth, size: new TextEncoder().encode(minified).length };
}

export const INDENT_OPTIONS = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
  { value: '\t', label: 'Tabs' },
] as const;
