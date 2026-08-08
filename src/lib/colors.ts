/**
 * Color conversion, harmonies and WCAG contrast.
 *
 * All conversions go through sRGB. OKLCH is included because it's what modern
 * design systems (including this app's own tokens) are authored in, and it's the
 * only space here where changing lightness doesn't shift the perceived hue.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export interface Hsv {
  h: number;
  s: number;
  v: number;
}

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

const clamp255 = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

// ─── Hex ──────────────────────────────────────────────────────────────────

/** Accepts #rgb, #rgba, #rrggbb and #rrggbbaa, with or without the hash. */
export function parseHex(input: string): Rgb | null {
  let hex = input.trim().replace(/^#/, '');

  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .slice(0, 3)
      .split('')
      .map((char) => char + char)
      .join('');
  } else if (hex.length === 8) {
    hex = hex.slice(0, 6);
  }

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((channel) => clamp255(channel).toString(16).padStart(2, '0')).join('')}`;
}

// ─── HSL / HSV ────────────────────────────────────────────────────────────

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) return { h: 0, s: 0, l: l * 100 };

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;

  h *= 60;
  if (h < 0) h += 360;

  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp01(s / 100);
  const ln = clamp01(l / 100);

  const chroma = (1 - Math.abs(2 * ln - 1)) * sn;
  const secondary = chroma * (1 - Math.abs(((hn / 60) % 2) - 1));
  const match = ln - chroma / 2;

  let rgb: [number, number, number];
  if (hn < 60) rgb = [chroma, secondary, 0];
  else if (hn < 120) rgb = [secondary, chroma, 0];
  else if (hn < 180) rgb = [0, chroma, secondary];
  else if (hn < 240) rgb = [0, secondary, chroma];
  else if (hn < 300) rgb = [secondary, 0, chroma];
  else rgb = [chroma, 0, secondary];

  return {
    r: clamp255((rgb[0] + match) * 255),
    g: clamp255((rgb[1] + match) * 255),
    b: clamp255((rgb[2] + match) * 255),
  };
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const delta = max - min;
  const { h } = rgbToHsl({ r, g, b });
  return { h, s: max === 0 ? 0 : (delta / max) * 100, v: max * 100 };
}

// ─── OKLCH ────────────────────────────────────────────────────────────────

const srgbToLinear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const linearToSrgb = (channel: number) => {
  const c = clamp01(channel);
  return (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255;
};

export function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.sqrt(okA * okA + okB * okB);
  let hue = (Math.atan2(okB, okA) * 180) / Math.PI;
  if (hue < 0) hue += 360;

  return { l: okL, c: chroma, h: chroma < 1e-6 ? 0 : hue };
}

export function oklchToRgb({ l, c, h }: Oklch): Rgb {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const bb = c * Math.sin(hRad);

  const lCube = (l + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
  const mCube = (l - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
  const sCube = (l - 0.0894841775 * a - 1.291485548 * bb) ** 3;

  return {
    r: clamp255(linearToSrgb(4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube)),
    g: clamp255(linearToSrgb(-1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube)),
    b: clamp255(linearToSrgb(-0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube)),
  };
}

// ─── Formatting ───────────────────────────────────────────────────────────

const round = (value: number, places = 0) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

export function formatRgb(rgb: Rgb): string {
  return `rgb(${clamp255(rgb.r)}, ${clamp255(rgb.g)}, ${clamp255(rgb.b)})`;
}

export function formatHsl(hsl: Hsl): string {
  return `hsl(${round(hsl.h)}, ${round(hsl.s)}%, ${round(hsl.l)}%)`;
}

export function formatHsv(hsv: Hsv): string {
  return `hsv(${round(hsv.h)}, ${round(hsv.s)}%, ${round(hsv.v)}%)`;
}

export function formatOklch(oklch: Oklch): string {
  return `oklch(${round(oklch.l, 3)} ${round(oklch.c, 3)} ${round(oklch.h, 1)})`;
}

// ─── WCAG contrast ────────────────────────────────────────────────────────

/** Relative luminance per WCAG 2.1. */
export function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastVerdict {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
  /** AA for UI component boundaries and graphical objects (1.4.11). */
  uiComponents: boolean;
}

export function evaluateContrast(foreground: Rgb, background: Rgb): ContrastVerdict {
  const ratio = contrastRatio(foreground, background);
  return {
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
    uiComponents: ratio >= 3,
  };
}

/** Pick black or white text for a swatch — used for labels sitting on a fill. */
export function readableTextOn(background: Rgb): '#000000' | '#ffffff' {
  return contrastRatio({ r: 0, g: 0, b: 0 }, background) >= contrastRatio({ r: 255, g: 255, b: 255 }, background)
    ? '#000000'
    : '#ffffff';
}

// ─── Harmonies & ramps ────────────────────────────────────────────────────

function withHueOffset(base: Rgb, offset: number): Rgb {
  const hsl = rgbToHsl(base);
  return hslToRgb({ ...hsl, h: hsl.h + offset });
}

export interface Harmony {
  id: string;
  label: string;
  description: string;
  colors: string[];
}

export function harmonies(base: Rgb): Harmony[] {
  const hex = (rgb: Rgb) => rgbToHex(rgb);

  return [
    {
      id: 'complementary',
      label: 'Complementary',
      description: 'Opposite on the wheel — maximum contrast for a single accent.',
      colors: [hex(base), hex(withHueOffset(base, 180))],
    },
    {
      id: 'analogous',
      label: 'Analogous',
      description: 'Neighbouring hues — calm, cohesive, low tension.',
      colors: [hex(withHueOffset(base, -30)), hex(base), hex(withHueOffset(base, 30))],
    },
    {
      id: 'triadic',
      label: 'Triadic',
      description: 'Three evenly spaced hues — vivid but balanced.',
      colors: [hex(base), hex(withHueOffset(base, 120)), hex(withHueOffset(base, 240))],
    },
    {
      id: 'split',
      label: 'Split complementary',
      description: 'Softer than complementary, still high contrast.',
      colors: [hex(base), hex(withHueOffset(base, 150)), hex(withHueOffset(base, 210))],
    },
    {
      id: 'tetradic',
      label: 'Tetradic',
      description: 'Two complementary pairs — needs one dominant colour.',
      colors: [
        hex(base),
        hex(withHueOffset(base, 90)),
        hex(withHueOffset(base, 180)),
        hex(withHueOffset(base, 270)),
      ],
    },
  ];
}

/**
 * A tint/shade ramp built by moving OKLCH lightness rather than mixing toward
 * white/black in sRGB, which is what stops mid-steps from going muddy or
 * shifting hue.
 */
export function lightnessRamp(base: Rgb, steps = 11): Array<{ step: number; hex: string }> {
  const { c, h } = rgbToOklch(base);

  return Array.from({ length: steps }, (_, index) => {
    // 0.97 down to 0.17 — the usable range on both light and dark surfaces.
    const l = 0.97 - (index / (steps - 1)) * 0.8;
    return { step: (index + 1) * 50, hex: rgbToHex(oklchToRgb({ l, c, h })) };
  });
}

export const PRESET_SWATCHES = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#64748b',
  '#1e293b',
] as const;
