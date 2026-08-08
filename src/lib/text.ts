/**
 * Text statistics and transforms.
 *
 * Word and sentence counting is deliberately Unicode-aware: splitting on
 * /\s+/ and counting `.` characters gets "Dr. Smith arrived." wrong and breaks
 * entirely on scripts without spaces between words.
 */

export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  uniqueWords: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  /** Minutes, at 225 words per minute — an average adult silent reading pace. */
  readingMinutes: number;
  /** Minutes at 150 wpm, roughly a measured speaking pace. */
  speakingMinutes: number;
  longestWord: string;
  averageWordLength: number;
}

const WORDS_PER_MINUTE_READING = 225;
const WORDS_PER_MINUTE_SPEAKING = 150;

function splitWords(text: string): string[] {
  // Letters, marks and digits, allowing internal apostrophes and hyphens so
  // "don't" and "well-known" each count once.
  const matches = text.match(/[\p{L}\p{M}\p{N}]+(?:['’\-][\p{L}\p{M}\p{N}]+)*/gu);
  return matches ?? [];
}

function countSentences(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') return 0;

  // Terminator followed by whitespace and something that starts a new sentence.
  // Not perfect with abbreviations, but far better than counting periods.
  const matches = trimmed.match(/[^.!?…]+(?:[.!?…]+|$)/g);
  return matches ? matches.filter((sentence) => sentence.trim() !== '').length : 1;
}

export function analyzeText(text: string): TextStats {
  const words = splitWords(text);
  const unique = new Set(words.map((word) => word.toLowerCase()));

  const paragraphs = text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter((part) => part.trim() !== '').length;
  const longestWord = words.reduce((longest, word) => (word.length > longest.length ? word : longest), '');
  const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);

  return {
    // Spread to count by code point, so an emoji counts as one character
    // rather than the two UTF-16 units `.length` would report.
    characters: [...text].length,
    charactersNoSpaces: [...text.replace(/\s/g, '')].length,
    words: words.length,
    uniqueWords: unique.size,
    sentences: countSentences(text),
    paragraphs,
    lines: text === '' ? 0 : text.split('\n').length,
    readingMinutes: words.length / WORDS_PER_MINUTE_READING,
    speakingMinutes: words.length / WORDS_PER_MINUTE_SPEAKING,
    longestWord,
    averageWordLength: words.length === 0 ? 0 : totalWordLength / words.length,
  };
}

/** Word frequency, most common first, excluding very common stop words. */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at', 'for', 'with', 'is', 'are', 'was',
  'were', 'be', 'been', 'it', 'its', 'this', 'that', 'these', 'those', 'as', 'by', 'from', 'has', 'have',
  'had', 'not', 'no', 'so', 'if', 'then', 'than', 'i', 'you', 'he', 'she', 'they', 'we', 'his', 'her',
  'their', 'our', 'my', 'me', 'him', 'them', 'us', 'do', 'does', 'did', 'will', 'would', 'can', 'could',
]);

export function wordFrequency(text: string, limit = 12): Array<{ word: string; count: number }> {
  const counts = new Map<string, number>();

  for (const word of splitWords(text)) {
    const key = word.toLowerCase();
    if (STOP_WORDS.has(key) || key.length < 2) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

// ─── Case transforms ──────────────────────────────────────────────────────

/** Words that stay lowercase in title case unless they lead the title. */
const MINOR_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'per', 'so', 'the',
  'to', 'up', 'via', 'vs', 'yet',
]);

/** Split an identifier or sentence into its constituent words, handling
 *  camelCase, snake_case, kebab-case and spaces uniformly. */
function tokenize(text: string): string[] {
  return text
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_\-.]+/)
    .filter((token) => token !== '');
}

export interface Transform {
  id: string;
  label: string;
  description: string
  apply: (text: string) => string;
}

export const CASE_TRANSFORMS: Transform[] = [
  { id: 'upper', label: 'UPPERCASE', description: 'Every letter capitalised', apply: (t) => t.toUpperCase() },
  { id: 'lower', label: 'lowercase', description: 'Every letter lowercased', apply: (t) => t.toLowerCase() },
  {
    id: 'title',
    label: 'Title Case',
    description: 'Capitalised, with minor words left lowercase',
    apply: (text) =>
      text
        .toLowerCase()
        .replace(/\S+/g, (word, offset: number) => {
          const bare = word.replace(/[^\p{L}\p{N}']/gu, '');
          if (offset > 0 && MINOR_WORDS.has(bare)) return word;
          return word.replace(/\p{L}/u, (letter) => letter.toUpperCase());
        }),
  },
  {
    id: 'sentence',
    label: 'Sentence case',
    description: 'First letter of each sentence capitalised',
    apply: (text) =>
      text
        .toLowerCase()
        .replace(/(^\s*|[.!?…]\s+)(\p{Ll})/gu, (_match, prefix: string, letter: string) => prefix + letter.toUpperCase()),
  },
  {
    id: 'camel',
    label: 'camelCase',
    description: 'For variable names',
    apply: (text) =>
      tokenize(text)
        .map((token, index) =>
          index === 0
            ? token.toLowerCase()
            : token.charAt(0).toUpperCase() + token.slice(1).toLowerCase(),
        )
        .join(''),
  },
  {
    id: 'pascal',
    label: 'PascalCase',
    description: 'For type and class names',
    apply: (text) =>
      tokenize(text)
        .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
        .join(''),
  },
  {
    id: 'snake',
    label: 'snake_case',
    description: 'Lowercase, underscore separated',
    apply: (text) => tokenize(text).map((token) => token.toLowerCase()).join('_'),
  },
  {
    id: 'constant',
    label: 'CONSTANT_CASE',
    description: 'Uppercase, underscore separated',
    apply: (text) => tokenize(text).map((token) => token.toUpperCase()).join('_'),
  },
  {
    id: 'kebab',
    label: 'kebab-case',
    description: 'Lowercase, hyphen separated — URL slugs',
    apply: (text) => tokenize(text).map((token) => token.toLowerCase()).join('-'),
  },
  {
    id: 'alternate',
    label: 'aLtErNaTiNg',
    description: 'Alternating capitalisation',
    apply: (text) =>
      [...text].map((char, index) => (index % 2 === 0 ? char.toLowerCase() : char.toUpperCase())).join(''),
  },
];

export const LINE_TRANSFORMS: Transform[] = [
  {
    id: 'sort-asc',
    label: 'Sort A → Z',
    description: 'Alphabetical, case-insensitive',
    apply: (text) => text.split('\n').sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).join('\n'),
  },
  {
    id: 'sort-desc',
    label: 'Sort Z → A',
    description: 'Reverse alphabetical',
    apply: (text) => text.split('\n').sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' })).join('\n'),
  },
  {
    id: 'sort-length',
    label: 'Sort by length',
    description: 'Shortest line first',
    apply: (text) => text.split('\n').sort((a, b) => a.length - b.length).join('\n'),
  },
  {
    id: 'dedupe',
    label: 'Remove duplicates',
    description: 'Keeps the first occurrence of each line',
    apply: (text) => [...new Set(text.split('\n'))].join('\n'),
  },
  {
    id: 'remove-blank',
    label: 'Remove blank lines',
    description: 'Drops empty and whitespace-only lines',
    apply: (text) => text.split('\n').filter((line) => line.trim() !== '').join('\n'),
  },
  {
    id: 'trim',
    label: 'Trim each line',
    description: 'Removes leading and trailing spaces',
    apply: (text) => text.split('\n').map((line) => line.trim()).join('\n'),
  },
  {
    id: 'reverse-lines',
    label: 'Reverse line order',
    description: 'Last line becomes first',
    apply: (text) => text.split('\n').reverse().join('\n'),
  },
  {
    id: 'number-lines',
    label: 'Number the lines',
    description: 'Prefixes each line with its position',
    apply: (text) => {
      const lines = text.split('\n');
      // Pad to the widest number so the text stays aligned.
      const width = String(lines.length).length;
      return lines.map((line, index) => `${String(index + 1).padStart(width, ' ')}. ${line}`).join('\n');
    },
  },
  {
    id: 'shuffle',
    label: 'Shuffle lines',
    description: 'Random order',
    apply: (text) => {
      const lines = text.split('\n');
      // Fisher-Yates, so every permutation is equally likely.
      for (let i = lines.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [lines[i], lines[j]] = [lines[j] as string, lines[i] as string];
      }
      return lines.join('\n');
    },
  },
];

export const TEXT_TRANSFORMS: Transform[] = [
  {
    id: 'reverse',
    label: 'Reverse text',
    description: 'Character order reversed',
    apply: (text) => [...text].reverse().join(''),
  },
  {
    id: 'collapse-spaces',
    label: 'Collapse spaces',
    description: 'Multiple spaces become one',
    apply: (text) => text.replace(/[ \t]+/g, ' '),
  },
  {
    id: 'strip-html',
    label: 'Strip HTML tags',
    description: 'Removes < … > markup',
    apply: (text) => text.replace(/<[^>]*>/g, ''),
  },
  {
    id: 'strip-accents',
    label: 'Remove accents',
    description: 'café → cafe',
    // NFD splits a letter from its combining mark, which can then be dropped.
    // \p{M} matches any combining mark, which is exactly what NFD split off.
    apply: (text) => text.normalize('NFD').replace(/\p{M}/gu, ''),
  },
  {
    id: 'slug',
    label: 'Make a URL slug',
    description: 'Lowercase, hyphenated, accent-free',
    apply: (text) =>
      text
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, ''),
  },
];

// ─── Lorem ipsum ──────────────────────────────────────────────────────────

export const LOREM_WORD_SETS = {
  classic: 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' '),
  hipster: 'artisan craft beard kombucha vinyl fixie ethical sustainable locavore mixtape gentrify brunch cardigan denim flannel gluten kale kitsch loft mumblecore normcore occupy pickled quinoa raw selvage tattooed umami vegan whatever yolo authentic banjo chambray'.split(' '),
  tech: 'scalable microservice container orchestration pipeline latency throughput idempotent eventual consistency sharding replication cache invalidation backpressure observability telemetry deployment rollback canary feature flag schema migration index query optimiser thread pool mutex semaphore'.split(' '),
} as const;

export type LoremFlavor = keyof typeof LOREM_WORD_SETS;

const LOREM_OPENER = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeSentence(words: readonly string[], minWords = 6, maxWords = 16): string {
  const length = randomInt(minWords, maxWords);
  const picked = Array.from({ length }, () => words[randomInt(0, words.length - 1)] ?? 'lorem');

  let sentence = picked.join(' ');
  // Insert a comma somewhere in the middle of longer sentences so the filler
  // has believable rhythm rather than reading as a word list.
  if (length > 9) {
    const commaAt = randomInt(3, length - 4);
    const parts = sentence.split(' ');
    parts[commaAt] = `${parts[commaAt]},`;
    sentence = parts.join(' ');
  }

  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
}

export interface LoremOptions {
  flavor: LoremFlavor;
  startWithLorem: boolean;
}

export function generateParagraphs(count: number, options: LoremOptions): string[] {
  const words = LOREM_WORD_SETS[options.flavor];

  return Array.from({ length: count }, (_, index) => {
    const sentences = Array.from({ length: randomInt(3, 6) }, () => makeSentence(words));
    if (index === 0 && options.startWithLorem) sentences[0] = `${LOREM_OPENER}.`;
    return sentences.join(' ');
  });
}

export function generateSentences(count: number, options: LoremOptions): string[] {
  const words = LOREM_WORD_SETS[options.flavor];
  const sentences = Array.from({ length: count }, () => makeSentence(words));
  if (options.startWithLorem && sentences.length > 0) sentences[0] = `${LOREM_OPENER}.`;
  return sentences;
}

export function generateWords(count: number, options: LoremOptions): string {
  const words = LOREM_WORD_SETS[options.flavor];
  const picked = Array.from({ length: count }, () => words[randomInt(0, words.length - 1)] ?? 'lorem');

  if (options.startWithLorem) {
    const opener = LOREM_OPENER.toLowerCase().replace(',', '').split(' ');
    // Replace the leading words rather than appending, so the count is exact.
    for (let i = 0; i < Math.min(opener.length, picked.length); i += 1) {
      picked[i] = opener[i] as string;
    }
  }

  const joined = picked.join(' ');
  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)}`;
}
