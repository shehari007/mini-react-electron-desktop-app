/**
 * The tool registry — the single source of truth for AppBox.
 *
 * The sidebar, home grid, command palette, sitemap.xml and every route's
 * `generateMetadata` all read from this file. Adding a tool means adding one
 * entry here plus one `src/app/<slug>/page.tsx`; nothing else needs touching.
 *
 * Deliberately free of JSX/React imports so server components (sitemap,
 * metadata) and client components (palette, nav) can both consume it. Icons are
 * referenced by name and resolved in `components/ToolIcon.tsx`.
 */

export type CategoryId =
  | 'calc'
  | 'convert'
  | 'time'
  | 'dev'
  | 'text'
  | 'productivity'
  | 'design'
  | 'finance'
  | 'health'
  | 'weather';

/** Accent keys map to the `data-accent` palettes defined in `globals.css`. */
export type Accent =
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'violet'
  | 'sky'
  | 'rose'
  | 'fuchsia'
  | 'teal'
  | 'lime'
  | 'cyan';

export type IconName =
  | 'calculator'
  | 'percent'
  | 'receipt'
  | 'ruler'
  | 'coins'
  | 'binary'
  | 'timer'
  | 'globe'
  | 'brain'
  | 'calendar-days'
  | 'cake'
  | 'braces'
  | 'file-code'
  | 'key-round'
  | 'link'
  | 'fingerprint'
  | 'hash'
  | 'regex'
  | 'git-compare'
  | 'table'
  | 'calendar-clock'
  | 'type'
  | 'book-open'
  | 'pilcrow'
  | 'list-checks'
  | 'notebook-pen'
  | 'shield-check'
  | 'qr-code'
  | 'palette'
  | 'image'
  | 'landmark'
  | 'trending-up'
  | 'scale'
  | 'flame'
  | 'droplets'
  | 'cloud-sun';

export interface Category {
  id: CategoryId;
  label: string;
  accent: Accent;
}

export interface Tool {
  /** URL segment; also the i18n/analytics key. Never change once shipped. */
  slug: string;
  /** Full name, used in <h1> and page titles. */
  name: string;
  /** Compact label for the sidebar, where horizontal space is tight. */
  navLabel: string;
  /** Meta description. Aim for 110-155 characters. */
  description: string;
  /** Longer prose rendered on the page — gives each route real indexable text. */
  about: string;
  category: CategoryId;
  icon: IconName;
  /** Search terms for the command palette, and `keywords` in metadata. */
  keywords: string[];
  /** False only for tools that degrade without a network. */
  offline: boolean;
  /** Surfaced in the "popular" strip on the home page. */
  featured?: boolean;
}

export const CATEGORIES: readonly Category[] = [
  { id: 'calc', label: 'Calculators', accent: 'indigo' },
  { id: 'convert', label: 'Converters', accent: 'emerald' },
  { id: 'time', label: 'Time', accent: 'amber' },
  { id: 'dev', label: 'Developer', accent: 'violet' },
  { id: 'text', label: 'Text', accent: 'sky' },
  { id: 'productivity', label: 'Productivity', accent: 'rose' },
  { id: 'design', label: 'Design & Media', accent: 'fuchsia' },
  { id: 'finance', label: 'Finance', accent: 'teal' },
  { id: 'health', label: 'Health', accent: 'lime' },
  { id: 'weather', label: 'Weather', accent: 'cyan' },
] as const;

export const TOOLS: readonly Tool[] = [
  // ── Calculators ─────────────────────────────────────────────────────────
  {
    slug: 'calculator',
    name: 'Calculator',
    navLabel: 'Calculator',
    description:
      'Free online calculator with basic and scientific modes, full keyboard support, and a running history you can reuse.',
    about:
      'Switch between a clean basic keypad and a scientific mode with trigonometry, logarithms, roots, powers, factorials and constants. Every result is kept in a history panel, so you can click any earlier line to drop it straight back into the display. The whole keypad is keyboard-driven: type expressions directly, press Enter to evaluate and Escape to clear.',
    category: 'calc',
    icon: 'calculator',
    keywords: ['calculator', 'scientific calculator', 'math', 'arithmetic', 'trigonometry'],
    offline: true,
    featured: true,
  },
  {
    slug: 'percentage-calculator',
    name: 'Percentage Calculator',
    navLabel: 'Percentage',
    description:
      'Work out percentages, percentage change, increases, decreases and reverse percentages with every step shown.',
    about:
      'Six of the percentage questions people actually run into, each as its own small form: what is X% of Y, X is what percent of Y, percentage increase and decrease, percentage change between two numbers, and reverse percentage to recover an original value from a discounted one. Each answer shows the formula it used so you can check the reasoning.',
    category: 'calc',
    icon: 'percent',
    keywords: ['percentage', 'percent', 'percentage change', 'discount', 'increase', 'decrease'],
    offline: true,
  },
  {
    slug: 'tip-calculator',
    name: 'Tip & Bill Split Calculator',
    navLabel: 'Tip & Split',
    description:
      'Split any bill between friends, add a tip by percent or amount, and round the result to something payable.',
    about:
      'Enter the bill, pick a tip percentage or type an exact tip amount, then set how many people are sharing. You get the tip, the total and the per-person figure at a glance. Optional rounding nudges each share up or down to a whole unit so nobody is handing over small change, and it tells you exactly how much rounding added or removed.',
    category: 'calc',
    icon: 'receipt',
    keywords: ['tip calculator', 'bill split', 'gratuity', 'split bill', 'restaurant'],
    offline: true,
  },

  // ── Converters ──────────────────────────────────────────────────────────
  {
    slug: 'unit-converter',
    name: 'Unit Converter',
    navLabel: 'Units',
    description:
      'Convert length, weight, temperature, area, volume, speed, time, data, pressure and energy between 90+ units.',
    about:
      'Ten measurement families covering the conversions that come up day to day, with 90+ units in total. Pick a category, choose your units and the result updates as you type in either direction. A swap button flips the pair, and a reference table underneath shows the same value expressed in every other unit of that category at once.',
    category: 'convert',
    icon: 'ruler',
    keywords: ['unit converter', 'metric', 'imperial', 'length', 'weight', 'temperature'],
    offline: true,
    featured: true,
  },
  {
    slug: 'currency-converter',
    name: 'Currency Converter',
    navLabel: 'Currency',
    description:
      'Convert between 60+ world currencies with live exchange rates that stay usable offline from cache.',
    about:
      'Rates are fetched from a free, key-less exchange rate feed and cached locally, so the converter keeps working when you are offline — it just tells you how old the cached rates are. Covers 60+ currencies, converts in both directions as you type, and shows a small table of common amounts for the pair you picked.',
    category: 'convert',
    icon: 'coins',
    keywords: ['currency converter', 'exchange rate', 'forex', 'usd', 'eur', 'money'],
    offline: false,
  },
  {
    slug: 'number-base-converter',
    name: 'Number Base Converter',
    navLabel: 'Number Base',
    description:
      'Convert numbers between binary, octal, decimal, hexadecimal and any base from 2 to 36, plus bitwise views.',
    about:
      'Type a value into any base field and the others update instantly — binary, octal, decimal and hex side by side, with a custom field for any radix from 2 to 36. Large values are handled with BigInt so nothing silently loses precision. A bit inspector shows the binary laid out in bytes with each bit position labelled.',
    category: 'convert',
    icon: 'binary',
    keywords: ['binary', 'hexadecimal', 'octal', 'decimal', 'base converter', 'radix', 'bitwise'],
    offline: true,
  },

  // ── Time ────────────────────────────────────────────────────────────────
  {
    slug: 'clock-timer',
    name: 'Clock, Timer & Stopwatch',
    navLabel: 'Clock & Timer',
    description:
      'A live clock, a countdown timer with an audible alert, and a lap stopwatch accurate to hundredths of a second.',
    about:
      'Three time tools in one place. The clock shows local time and date in your choice of 12 or 24 hour format. The countdown timer takes hours, minutes and seconds, offers one-tap presets and sounds an alert when it reaches zero. The stopwatch records laps with per-lap and cumulative splits, and both keep accurate time even when the tab is backgrounded because they track wall-clock timestamps rather than counting ticks.',
    category: 'time',
    icon: 'timer',
    keywords: ['clock', 'timer', 'countdown', 'stopwatch', 'lap timer', 'alarm'],
    offline: true,
    featured: true,
  },
  {
    slug: 'world-clock',
    name: 'World Clock',
    navLabel: 'World Clock',
    description:
      'Track current time across multiple cities and time zones, with UTC offsets and day differences at a glance.',
    about:
      'Add any of 100+ major cities and watch their local times side by side, each with its UTC offset and a marker when it is a different calendar day from yours. A meeting planner strip shows the next 24 hours across every city you have added, shading the hours that fall inside normal working time so you can spot an overlap quickly. Your city list is saved locally.',
    category: 'time',
    icon: 'globe',
    keywords: ['world clock', 'time zones', 'utc', 'timezone converter', 'meeting planner'],
    offline: true,
  },
  {
    slug: 'pomodoro-timer',
    name: 'Pomodoro Focus Timer',
    navLabel: 'Pomodoro',
    description:
      'Structure work into focus and break intervals with a configurable Pomodoro timer and daily session tracking.',
    about:
      'Runs the Pomodoro cycle — focus, short break, long break — and moves between phases for you, with the focus, break and long-break lengths all adjustable. It counts completed sessions and keeps a per-day tally so you can see the week behind you. Optional auto-start carries you into the next phase without a click, and a notification fires when a phase ends.',
    category: 'time',
    icon: 'brain',
    keywords: ['pomodoro', 'focus timer', 'productivity timer', 'time management', 'deep work'],
    offline: true,
  },
  {
    slug: 'date-calculator',
    name: 'Date Calculator',
    navLabel: 'Dates',
    description:
      'Find the duration between two dates, or add and subtract days, weeks, months and years from any date.',
    about:
      'Two modes. Difference tells you how far apart two dates are in years, months and days, and also as a total in days, weeks, hours and minutes, with an option to count only working days. Add or subtract shifts a date by any mix of years, months, weeks and days and gives you the resulting date with its weekday and week number.',
    category: 'time',
    icon: 'calendar-days',
    keywords: ['date calculator', 'days between dates', 'date difference', 'add days', 'business days'],
    offline: true,
  },
  {
    slug: 'age-calculator',
    name: 'Age Calculator',
    navLabel: 'Age',
    description:
      'Calculate exact age in years, months and days from a birth date, plus the countdown to the next birthday.',
    about:
      'Enter a date of birth to get an exact age broken into years, months and days, along with the same span expressed as total months, weeks, days, hours and minutes. It also works out which weekday you were born on and how many days remain until the next birthday. Optionally compare against a date other than today.',
    category: 'time',
    icon: 'cake',
    keywords: ['age calculator', 'date of birth', 'how old am i', 'birthday countdown'],
    offline: true,
  },

  // ── Developer ───────────────────────────────────────────────────────────
  {
    slug: 'json-formatter',
    name: 'JSON Formatter & Validator',
    navLabel: 'JSON',
    description:
      'Format, minify and validate JSON with precise error positions, sorted keys and a collapsible tree view.',
    about:
      'Paste JSON to pretty-print it at your chosen indent width, minify it to a single line, or sort object keys for a stable diff. Invalid input reports the exact line and column of the problem rather than a bare "unexpected token". A collapsible tree view lets you walk large documents, and every node shows the path you would use to reach it in code.',
    category: 'dev',
    icon: 'braces',
    keywords: ['json formatter', 'json validator', 'json beautifier', 'json minify', 'pretty print'],
    offline: true,
    featured: true,
  },
  {
    slug: 'base64-encoder',
    name: 'Base64 Encoder & Decoder',
    navLabel: 'Base64',
    description:
      'Encode text or files to Base64 and decode Base64 back to text, with URL-safe output and data URI support.',
    about:
      'Converts in both directions with correct UTF-8 handling, so accented characters and emoji survive the round trip. A URL-safe mode swaps the +/ characters and drops padding for use in query strings and JWTs. Drop in a file to get a Base64 string or a ready-made data URI, and decoding a data URI gives you the file back.',
    category: 'dev',
    icon: 'file-code',
    keywords: ['base64', 'base64 encode', 'base64 decode', 'data uri', 'url safe base64'],
    offline: true,
  },
  {
    slug: 'jwt-decoder',
    name: 'JWT Decoder',
    navLabel: 'JWT',
    description:
      'Decode JSON Web Tokens to inspect header and payload claims, with expiry checking. Nothing leaves your device.',
    about:
      'Paste a token to see its header and payload decoded and pretty-printed, with the standard registered claims explained in plain language. Time claims like exp, iat and nbf are rendered as readable dates alongside a clear indicator of whether the token has expired or is not yet valid. Decoding happens entirely in your browser — the token is never transmitted anywhere.',
    category: 'dev',
    icon: 'key-round',
    keywords: ['jwt decoder', 'json web token', 'jwt', 'token decoder', 'claims', 'bearer token'],
    offline: true,
  },
  {
    slug: 'url-encoder',
    name: 'URL Encoder & Decoder',
    navLabel: 'URL',
    description:
      'Percent-encode and decode URLs and query strings, and break any URL into its component parts.',
    about:
      'Encode or decode text for safe use in URLs, choosing between full component encoding and the looser form that leaves reserved characters intact. A parser splits any URL into protocol, host, port, path, hash and a readable table of query parameters, which you can edit and reassemble back into a URL.',
    category: 'dev',
    icon: 'link',
    keywords: ['url encode', 'url decode', 'percent encoding', 'query string', 'uri parser'],
    offline: true,
  },
  {
    slug: 'hash-generator',
    name: 'Hash Generator',
    navLabel: 'Hashes',
    description:
      'Generate MD5, SHA-1, SHA-256, SHA-384 and SHA-512 hashes from text or files, and compare two hashes safely.',
    about:
      'Produces all five digests at once from whatever you type, updating live, with one-click copy for each. Files are hashed in chunks so even large ones do not lock up the page. A compare mode checks a computed hash against one you paste — useful for verifying a download — and reports a match without being fooled by case or stray whitespace.',
    category: 'dev',
    icon: 'fingerprint',
    keywords: ['hash generator', 'md5', 'sha256', 'sha1', 'sha512', 'checksum', 'file hash'],
    offline: true,
  },
  {
    slug: 'uuid-generator',
    name: 'UUID Generator',
    navLabel: 'UUID',
    description:
      'Generate cryptographically random UUID v4 identifiers, or time-ordered UUID v7, in bulk with formatting options.',
    about:
      'Generates v4 UUIDs from the platform cryptographic random source, or v7 UUIDs whose leading bits encode a timestamp so they sort chronologically — handy as database keys. Produce up to 1000 at a time, switch to uppercase, strip the hyphens or wrap each in braces or quotes, then copy the whole batch or download it as a text file.',
    category: 'dev',
    icon: 'hash',
    keywords: ['uuid generator', 'guid', 'uuid v4', 'uuid v7', 'unique id', 'random id'],
    offline: true,
  },
  {
    slug: 'regex-tester',
    name: 'Regex Tester',
    navLabel: 'Regex',
    description:
      'Test regular expressions against sample text with live match highlighting, capture groups and replace preview.',
    about:
      'Write a pattern, toggle the flags and see every match highlighted in your test string as you type. A table below lists each match with its index and named or numbered capture groups broken out. A replace field previews the substituted result, with $1 style references supported, and a quick-reference panel covers the syntax you keep forgetting.',
    category: 'dev',
    icon: 'regex',
    keywords: ['regex tester', 'regular expression', 'regexp', 'pattern matching', 'regex replace'],
    offline: true,
  },
  {
    slug: 'diff-checker',
    name: 'Diff Checker',
    navLabel: 'Diff',
    description:
      'Compare two blocks of text or code and see exactly what was added, removed and changed, line by line.',
    about:
      'Paste an original and a changed version to get a line-by-line diff with additions and removals marked, viewable either as two side-by-side panes or as a single unified list. Options let you ignore whitespace differences or case, and a summary counts how many lines were added, removed and left alone. Everything is computed locally.',
    category: 'dev',
    icon: 'git-compare',
    keywords: ['diff checker', 'text compare', 'compare files', 'diff tool', 'code diff'],
    offline: true,
  },
  {
    slug: 'csv-json-converter',
    name: 'CSV to JSON Converter',
    navLabel: 'CSV ⇄ JSON',
    description:
      'Convert CSV to JSON and JSON back to CSV, with delimiter detection, quoted fields and type inference.',
    about:
      'Handles real-world CSV properly: quoted fields containing commas, escaped quotes and embedded newlines all survive the conversion. The delimiter is detected automatically or you can set it yourself, and optional type inference turns numeric and boolean columns into real JSON types instead of strings. Going the other way, JSON arrays become CSV with headers derived from the keys, and a table preview shows the parsed result before you copy it.',
    category: 'dev',
    icon: 'table',
    keywords: ['csv to json', 'json to csv', 'csv converter', 'csv parser', 'tsv', 'spreadsheet'],
    offline: true,
  },
  {
    slug: 'cron-parser',
    name: 'Cron Expression Parser',
    navLabel: 'Cron',
    description:
      'Translate cron expressions into plain English and preview the next scheduled run times before you deploy.',
    about:
      'Paste a five-field cron expression to get a plain-English description of when it fires, plus a list of the next runs so you can sanity-check the schedule before it goes anywhere near a server. Each field is validated separately with a clear message when something is out of range, and a set of common presets covers the schedules most jobs actually need.',
    category: 'dev',
    icon: 'calendar-clock',
    keywords: ['cron', 'crontab', 'cron expression', 'cron parser', 'schedule', 'cron to english'],
    offline: true,
  },

  // ── Text ────────────────────────────────────────────────────────────────
  {
    slug: 'text-tools',
    name: 'Text Tools & Word Counter',
    navLabel: 'Text Tools',
    description:
      'Count words and characters, change case, sort and deduplicate lines, and clean up messy text in one place.',
    about:
      'Live statistics for words, characters with and without spaces, sentences, paragraphs, lines, unique words and estimated reading time. Alongside them a set of one-click transforms: convert between upper, lower, title, sentence, camel, snake and kebab case; sort lines alphabetically or by length; remove duplicates or blank lines; trim whitespace; reverse; and number the lines.',
    category: 'text',
    icon: 'type',
    keywords: ['word counter', 'character count', 'case converter', 'text tools', 'sort lines', 'remove duplicates'],
    offline: true,
  },
  {
    slug: 'markdown-preview',
    name: 'Markdown Preview',
    navLabel: 'Markdown',
    description:
      'Write Markdown and see the rendered result live, with GitHub-flavoured tables, task lists and code blocks.',
    about:
      'A split editor with your Markdown on one side and the rendered output on the other, scrolling together. Supports GitHub-flavoured extensions including tables, task lists, strikethrough and fenced code blocks. The rendered HTML is sanitised before display, your draft is saved locally as you type, and you can copy the HTML out or download the Markdown.',
    category: 'text',
    icon: 'book-open',
    keywords: ['markdown preview', 'markdown editor', 'md to html', 'gfm', 'markdown viewer'],
    offline: true,
  },
  {
    slug: 'lorem-ipsum-generator',
    name: 'Lorem Ipsum Generator',
    navLabel: 'Lorem Ipsum',
    description:
      'Generate placeholder text by paragraphs, sentences or words, as plain text or ready-to-paste HTML.',
    about:
      'Produce as much or as little filler as a mockup needs — choose paragraphs, sentences or an exact word count, and decide whether to open with the traditional "Lorem ipsum dolor sit amet". Output as plain text or as HTML wrapped in paragraph tags. A handful of alternative word lists are included if classical Latin does not suit the design.',
    category: 'text',
    icon: 'pilcrow',
    keywords: ['lorem ipsum', 'placeholder text', 'dummy text', 'filler text', 'sample text'],
    offline: true,
  },

  // ── Productivity ────────────────────────────────────────────────────────
  {
    slug: 'todo-list',
    name: 'Todo List',
    navLabel: 'Todo List',
    description:
      'A fast, private task list with priorities, due dates, filters and drag-free reordering. Saved on your device.',
    about:
      'Capture tasks quickly, then give them a priority and a due date when it matters. Filter to active, completed or overdue, search across everything, and reorder with the keyboard. Overdue and due-today items are called out visually. Everything lives in your browser storage — no account, no sync, nothing leaving the device — and you can export or import the whole list as JSON.',
    category: 'productivity',
    icon: 'list-checks',
    keywords: ['todo list', 'task manager', 'checklist', 'to do app', 'task tracker'],
    offline: true,
    featured: true,
  },
  {
    slug: 'notes',
    name: 'Notes & Scratchpad',
    navLabel: 'Notes',
    description:
      'A private multi-note scratchpad with Markdown support, instant search and automatic local saving.',
    about:
      'Keep as many notes as you like, each saved automatically as you type. Search across every note by title or body, pin the ones you keep coming back to, and toggle a rendered Markdown preview when a note has structure worth seeing. Notes are stored only in your browser, and the whole collection can be exported to a JSON file for backup.',
    category: 'productivity',
    icon: 'notebook-pen',
    keywords: ['notes app', 'scratchpad', 'notepad', 'markdown notes', 'quick notes'],
    offline: true,
  },
  {
    slug: 'password-generator',
    name: 'Password Generator',
    navLabel: 'Passwords',
    description:
      'Generate strong random passwords or memorable passphrases, with a real entropy estimate. Never sent anywhere.',
    about:
      'Build a password from the character classes you want, at any length from 8 to 128, with options to avoid look-alike characters such as l, 1, I and O. Or switch to passphrase mode for several random words joined by a separator, which is far easier to type and remember at the same strength. Strength is reported as actual bits of entropy with an estimated time to crack, and generation uses the platform cryptographic random source locally.',
    category: 'productivity',
    icon: 'shield-check',
    keywords: ['password generator', 'random password', 'strong password', 'passphrase', 'secure password'],
    offline: true,
  },
  {
    slug: 'qr-code',
    name: 'QR Code Generator & Reader',
    navLabel: 'QR Codes',
    description:
      'Create QR codes for links, text, Wi-Fi and contacts, and read codes from an image or your camera.',
    about:
      'Generate a QR code from plain text or a URL, or use the structured builders for Wi-Fi credentials, a contact card, an email or an SMS so scanners act on them properly. Adjust size, margin, error-correction level and colours, then download as PNG or SVG. The reader decodes a code from an uploaded image or a live camera feed, all locally.',
    category: 'productivity',
    icon: 'qr-code',
    keywords: ['qr code generator', 'qr scanner', 'qr reader', 'wifi qr code', 'vcard'],
    offline: true,
  },

  // ── Design & Media ──────────────────────────────────────────────────────
  {
    slug: 'color-tools',
    name: 'Color Picker & Contrast Checker',
    navLabel: 'Colors',
    description:
      'Pick colors, convert between HEX, RGB, HSL and OKLCH, build palettes and check WCAG contrast ratios.',
    about:
      'Choose a color and see it expressed in HEX, RGB, HSL, HSV and OKLCH at once, each ready to copy. Generate tints, shades, and complementary, analogous and triadic harmonies from any base color. The contrast checker scores any foreground and background pair against WCAG AA and AAA for both normal and large text, and tells you how far you are from passing.',
    category: 'design',
    icon: 'palette',
    keywords: ['color picker', 'hex to rgb', 'color converter', 'palette generator', 'wcag contrast', 'accessibility'],
    offline: true,
  },
  {
    slug: 'image-tools',
    name: 'Image Compressor & Resizer',
    navLabel: 'Images',
    description:
      'Compress, resize, crop and convert images between PNG, JPEG and WebP entirely in your browser.',
    about:
      'Drop in one image or a batch and reduce file size with a quality slider that shows the before and after weight as you move it. Resize by pixels or percentage with the aspect ratio locked, and convert between PNG, JPEG and WebP. Processing happens on a canvas inside your browser, so the images are never uploaded anywhere, and you can download results individually.',
    category: 'design',
    icon: 'image',
    keywords: ['image compressor', 'resize image', 'convert to webp', 'compress png', 'image optimizer'],
    offline: true,
  },

  // ── Finance ─────────────────────────────────────────────────────────────
  {
    slug: 'loan-calculator',
    name: 'Loan & EMI Calculator',
    navLabel: 'Loan / EMI',
    description:
      'Calculate monthly loan payments and total interest, with a full amortization schedule and payoff chart.',
    about:
      'Enter the amount, annual interest rate and term to get the monthly payment, the total interest paid over the life of the loan and the overall cost. A chart shows principal and interest shifting over time, and a full amortization table breaks down every payment. An extra-payment field shows how much interest an additional monthly amount saves and how much sooner the loan clears.',
    category: 'finance',
    icon: 'landmark',
    keywords: ['loan calculator', 'emi calculator', 'mortgage calculator', 'amortization', 'interest'],
    offline: true,
  },
  {
    slug: 'compound-interest-calculator',
    name: 'Compound Interest Calculator',
    navLabel: 'Compound Interest',
    description:
      'Project savings and investment growth with compound interest, regular contributions and inflation adjustment.',
    about:
      'Model how a balance grows from a starting amount, a regular contribution and a rate of return, with the compounding frequency configurable from annual to daily. A stacked chart separates what you put in from what the interest earned, and a year-by-year table gives the detail. An optional inflation rate shows the result in today\'s money, which is usually the number that actually matters.',
    category: 'finance',
    icon: 'trending-up',
    keywords: ['compound interest', 'investment calculator', 'savings calculator', 'future value', 'inflation'],
    offline: true,
  },

  // ── Health ──────────────────────────────────────────────────────────────
  {
    slug: 'bmi-calculator',
    name: 'BMI Calculator',
    navLabel: 'BMI',
    description:
      'Calculate Body Mass Index in metric or imperial units, with category ranges and a healthy weight range.',
    about:
      'Enter height and weight in metric or imperial units to get your BMI along with the category it falls into, shown on a scale so you can see where you sit rather than just reading a number. It also gives the weight range considered healthy for your height. BMI is a population-level screening measure and does not account for muscle mass or body composition, so treat it as one rough signal rather than a diagnosis.',
    category: 'health',
    icon: 'scale',
    keywords: ['bmi calculator', 'body mass index', 'healthy weight', 'bmi chart', 'ideal weight'],
    offline: true,
  },
  {
    slug: 'calorie-calculator',
    name: 'Calorie & Macro Calculator',
    navLabel: 'Calories',
    description:
      'Estimate daily calorie needs from BMR and activity level, with macronutrient splits for your goal.',
    about:
      'Calculates basal metabolic rate using the Mifflin-St Jeor equation, then scales it by activity level to estimate daily energy needs. Pick a goal — lose, maintain or gain — and it adjusts the target and breaks it into protein, carbohydrate and fat in grams across several common macro splits. These are estimates from population formulas, useful as a starting point rather than a prescription.',
    category: 'health',
    icon: 'flame',
    keywords: ['calorie calculator', 'tdee', 'bmr calculator', 'macro calculator', 'macros', 'protein'],
    offline: true,
  },
  {
    slug: 'water-tracker',
    name: 'Water Intake Tracker',
    navLabel: 'Water',
    description:
      'Work out a daily water target from your weight and activity, then log intake with a streak history.',
    about:
      'Estimates a sensible daily fluid target from body weight, activity level and climate, then lets you log drinks against it with quick-add buttons for a glass, a bottle or a custom amount. A ring shows progress toward the day\'s goal, and a history strip tracks the last two weeks so you can see a streak forming. Logs are kept locally and reset each day.',
    category: 'health',
    icon: 'droplets',
    keywords: ['water tracker', 'water intake', 'hydration', 'daily water goal', 'drink reminder'],
    offline: true,
  },

  // ── Weather ─────────────────────────────────────────────────────────────
  {
    slug: 'weather',
    name: 'Weather Forecast',
    navLabel: 'Weather',
    description:
      'Current conditions and a 7-day forecast for any city worldwide. No API key required, and cached for offline use.',
    about:
      'Search any city or use your current location to get conditions now — temperature, how it feels, humidity, wind, pressure, UV index, sunrise and sunset — plus an hourly outlook and a seven-day forecast. Powered by the free Open-Meteo service, so there is no API key to set up. The last successful result is cached, so the tool still shows you something useful when you are offline.',
    category: 'weather',
    icon: 'cloud-sun',
    keywords: ['weather', 'forecast', 'hourly forecast', '7 day forecast', 'temperature', 'local weather'],
    offline: false,
    featured: true,
  },
] as const;

// ── Derived lookups ───────────────────────────────────────────────────────

const TOOLS_BY_SLUG = new Map(TOOLS.map((t) => [t.slug, t]));
const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getTool(slug: string): Tool | undefined {
  return TOOLS_BY_SLUG.get(slug);
}

/** Throws rather than returning undefined — used by routes, where a missing
 *  slug is a build-time bug we want surfaced immediately, not rendered. */
export function requireTool(slug: string): Tool {
  const tool = TOOLS_BY_SLUG.get(slug);
  if (!tool) throw new Error(`Unknown tool slug: "${slug}". Add it to src/lib/tools.ts.`);
  return tool;
}

export function getCategory(id: CategoryId): Category {
  const category = CATEGORY_BY_ID.get(id);
  if (!category) throw new Error(`Unknown category: "${id}"`);
  return category;
}

export function accentFor(tool: Tool): Accent {
  return getCategory(tool.category).accent;
}

export function toolsByCategory(): Array<{ category: Category; tools: Tool[] }> {
  return CATEGORIES.map((category) => ({
    category,
    tools: TOOLS.filter((t) => t.category === category.id),
  })).filter((group) => group.tools.length > 0);
}

export const FEATURED_TOOLS: readonly Tool[] = TOOLS.filter((t) => t.featured);

export const TOOL_COUNT = TOOLS.length;
export const OFFLINE_TOOL_COUNT = TOOLS.filter((t) => t.offline).length;
