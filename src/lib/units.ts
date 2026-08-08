/**
 * Unit conversion tables.
 *
 * Every category except temperature converts through a single base unit, so a
 * conversion is `value * from.factor / to.factor`. That keeps the data flat and
 * makes round-trips exact for the common cases, rather than needing an N×N
 * matrix of pairwise factors that would drift out of sync.
 *
 * Temperature can't work that way (the scales have different zero points), so it
 * carries explicit to/from-base functions instead.
 */

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  /** How many base units one of this unit is worth. */
  factor: number;
}

export interface TemperatureUnit {
  id: string;
  name: string;
  symbol: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

export interface UnitCategory {
  id: string;
  label: string;
  /** Named for the reader's benefit; also shown in the reference table header. */
  baseUnit: string;
  units: Unit[];
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    label: 'Length',
    baseUnit: 'metre',
    units: [
      { id: 'nm', name: 'Nanometre', symbol: 'nm', factor: 1e-9 },
      { id: 'um', name: 'Micrometre', symbol: 'µm', factor: 1e-6 },
      { id: 'mm', name: 'Millimetre', symbol: 'mm', factor: 0.001 },
      { id: 'cm', name: 'Centimetre', symbol: 'cm', factor: 0.01 },
      { id: 'm', name: 'Metre', symbol: 'm', factor: 1 },
      { id: 'km', name: 'Kilometre', symbol: 'km', factor: 1000 },
      { id: 'in', name: 'Inch', symbol: 'in', factor: 0.0254 },
      { id: 'ft', name: 'Foot', symbol: 'ft', factor: 0.3048 },
      { id: 'yd', name: 'Yard', symbol: 'yd', factor: 0.9144 },
      { id: 'mi', name: 'Mile', symbol: 'mi', factor: 1609.344 },
      { id: 'nmi', name: 'Nautical mile', symbol: 'nmi', factor: 1852 },
      { id: 'ly', name: 'Light year', symbol: 'ly', factor: 9.4607304725808e15 },
    ],
  },
  {
    id: 'mass',
    label: 'Weight & mass',
    baseUnit: 'kilogram',
    units: [
      { id: 'mg', name: 'Milligram', symbol: 'mg', factor: 1e-6 },
      { id: 'g', name: 'Gram', symbol: 'g', factor: 0.001 },
      { id: 'kg', name: 'Kilogram', symbol: 'kg', factor: 1 },
      { id: 't', name: 'Metric tonne', symbol: 't', factor: 1000 },
      { id: 'oz', name: 'Ounce', symbol: 'oz', factor: 0.028349523125 },
      { id: 'lb', name: 'Pound', symbol: 'lb', factor: 0.45359237 },
      { id: 'st', name: 'Stone', symbol: 'st', factor: 6.35029318 },
      { id: 'ton_us', name: 'US ton (short)', symbol: 'ton', factor: 907.18474 },
      { id: 'ton_uk', name: 'UK ton (long)', symbol: 'long ton', factor: 1016.0469088 },
      { id: 'ct', name: 'Carat', symbol: 'ct', factor: 0.0002 },
    ],
  },
  {
    id: 'area',
    label: 'Area',
    baseUnit: 'square metre',
    units: [
      { id: 'mm2', name: 'Square millimetre', symbol: 'mm²', factor: 1e-6 },
      { id: 'cm2', name: 'Square centimetre', symbol: 'cm²', factor: 0.0001 },
      { id: 'm2', name: 'Square metre', symbol: 'm²', factor: 1 },
      { id: 'ha', name: 'Hectare', symbol: 'ha', factor: 10000 },
      { id: 'km2', name: 'Square kilometre', symbol: 'km²', factor: 1e6 },
      { id: 'in2', name: 'Square inch', symbol: 'in²', factor: 0.00064516 },
      { id: 'ft2', name: 'Square foot', symbol: 'ft²', factor: 0.09290304 },
      { id: 'yd2', name: 'Square yard', symbol: 'yd²', factor: 0.83612736 },
      { id: 'acre', name: 'Acre', symbol: 'ac', factor: 4046.8564224 },
      { id: 'mi2', name: 'Square mile', symbol: 'mi²', factor: 2589988.110336 },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    baseUnit: 'litre',
    units: [
      { id: 'ml', name: 'Millilitre', symbol: 'ml', factor: 0.001 },
      { id: 'cl', name: 'Centilitre', symbol: 'cl', factor: 0.01 },
      { id: 'l', name: 'Litre', symbol: 'l', factor: 1 },
      { id: 'm3', name: 'Cubic metre', symbol: 'm³', factor: 1000 },
      { id: 'tsp_us', name: 'US teaspoon', symbol: 'tsp', factor: 0.00492892159375 },
      { id: 'tbsp_us', name: 'US tablespoon', symbol: 'tbsp', factor: 0.01478676478125 },
      { id: 'floz_us', name: 'US fluid ounce', symbol: 'fl oz', factor: 0.0295735295625 },
      { id: 'cup_us', name: 'US cup', symbol: 'cup', factor: 0.2365882365 },
      { id: 'pt_us', name: 'US pint', symbol: 'pt', factor: 0.473176473 },
      { id: 'qt_us', name: 'US quart', symbol: 'qt', factor: 0.946352946 },
      { id: 'gal_us', name: 'US gallon', symbol: 'gal', factor: 3.785411784 },
      { id: 'floz_uk', name: 'Imperial fluid ounce', symbol: 'fl oz (UK)', factor: 0.0284130625 },
      { id: 'pt_uk', name: 'Imperial pint', symbol: 'pt (UK)', factor: 0.56826125 },
      { id: 'gal_uk', name: 'Imperial gallon', symbol: 'gal (UK)', factor: 4.54609 },
      { id: 'in3', name: 'Cubic inch', symbol: 'in³', factor: 0.016387064 },
      { id: 'ft3', name: 'Cubic foot', symbol: 'ft³', factor: 28.316846592 },
    ],
  },
  {
    id: 'speed',
    label: 'Speed',
    baseUnit: 'metre per second',
    units: [
      { id: 'mps', name: 'Metre per second', symbol: 'm/s', factor: 1 },
      { id: 'kmh', name: 'Kilometre per hour', symbol: 'km/h', factor: 0.2777777777777778 },
      { id: 'mph', name: 'Mile per hour', symbol: 'mph', factor: 0.44704 },
      { id: 'fps', name: 'Foot per second', symbol: 'ft/s', factor: 0.3048 },
      { id: 'kn', name: 'Knot', symbol: 'kn', factor: 0.5144444444444445 },
      { id: 'mach', name: 'Mach (at sea level)', symbol: 'Ma', factor: 340.29 },
      { id: 'c', name: 'Speed of light', symbol: 'c', factor: 299792458 },
    ],
  },
  {
    id: 'time',
    label: 'Time',
    baseUnit: 'second',
    units: [
      { id: 'ns', name: 'Nanosecond', symbol: 'ns', factor: 1e-9 },
      { id: 'ms', name: 'Millisecond', symbol: 'ms', factor: 0.001 },
      { id: 's', name: 'Second', symbol: 's', factor: 1 },
      { id: 'min', name: 'Minute', symbol: 'min', factor: 60 },
      { id: 'h', name: 'Hour', symbol: 'h', factor: 3600 },
      { id: 'd', name: 'Day', symbol: 'd', factor: 86400 },
      { id: 'wk', name: 'Week', symbol: 'wk', factor: 604800 },
      // Calendar months and years vary in length; these are the average lengths
      // over a Gregorian cycle, which is the only defensible fixed factor.
      { id: 'mo', name: 'Month (average)', symbol: 'mo', factor: 2629746 },
      { id: 'yr', name: 'Year (average)', symbol: 'yr', factor: 31556952 },
      { id: 'decade', name: 'Decade', symbol: 'dec', factor: 315569520 },
    ],
  },
  {
    id: 'data',
    label: 'Digital storage',
    baseUnit: 'byte',
    units: [
      { id: 'bit', name: 'Bit', symbol: 'b', factor: 0.125 },
      { id: 'B', name: 'Byte', symbol: 'B', factor: 1 },
      { id: 'kB', name: 'Kilobyte (1000)', symbol: 'kB', factor: 1000 },
      { id: 'MB', name: 'Megabyte (1000²)', symbol: 'MB', factor: 1e6 },
      { id: 'GB', name: 'Gigabyte (1000³)', symbol: 'GB', factor: 1e9 },
      { id: 'TB', name: 'Terabyte (1000⁴)', symbol: 'TB', factor: 1e12 },
      { id: 'PB', name: 'Petabyte (1000⁵)', symbol: 'PB', factor: 1e15 },
      { id: 'KiB', name: 'Kibibyte (1024)', symbol: 'KiB', factor: 1024 },
      { id: 'MiB', name: 'Mebibyte (1024²)', symbol: 'MiB', factor: 1048576 },
      { id: 'GiB', name: 'Gibibyte (1024³)', symbol: 'GiB', factor: 1073741824 },
      { id: 'TiB', name: 'Tebibyte (1024⁴)', symbol: 'TiB', factor: 1099511627776 },
    ],
  },
  {
    id: 'pressure',
    label: 'Pressure',
    baseUnit: 'pascal',
    units: [
      { id: 'Pa', name: 'Pascal', symbol: 'Pa', factor: 1 },
      { id: 'hPa', name: 'Hectopascal', symbol: 'hPa', factor: 100 },
      { id: 'kPa', name: 'Kilopascal', symbol: 'kPa', factor: 1000 },
      { id: 'bar', name: 'Bar', symbol: 'bar', factor: 100000 },
      { id: 'mbar', name: 'Millibar', symbol: 'mbar', factor: 100 },
      { id: 'atm', name: 'Atmosphere', symbol: 'atm', factor: 101325 },
      { id: 'psi', name: 'Pound per square inch', symbol: 'psi', factor: 6894.757293168 },
      { id: 'mmHg', name: 'Millimetre of mercury', symbol: 'mmHg', factor: 133.322387415 },
      { id: 'inHg', name: 'Inch of mercury', symbol: 'inHg', factor: 3386.388640341 },
    ],
  },
  {
    id: 'energy',
    label: 'Energy',
    baseUnit: 'joule',
    units: [
      { id: 'J', name: 'Joule', symbol: 'J', factor: 1 },
      { id: 'kJ', name: 'Kilojoule', symbol: 'kJ', factor: 1000 },
      { id: 'cal', name: 'Calorie (small)', symbol: 'cal', factor: 4.184 },
      { id: 'kcal', name: 'Kilocalorie (food)', symbol: 'kcal', factor: 4184 },
      { id: 'Wh', name: 'Watt hour', symbol: 'Wh', factor: 3600 },
      { id: 'kWh', name: 'Kilowatt hour', symbol: 'kWh', factor: 3.6e6 },
      { id: 'BTU', name: 'British thermal unit', symbol: 'BTU', factor: 1055.05585262 },
      { id: 'eV', name: 'Electronvolt', symbol: 'eV', factor: 1.602176634e-19 },
      { id: 'ftlb', name: 'Foot-pound', symbol: 'ft·lb', factor: 1.3558179483314 },
    ],
  },
];

/** Kelvin is the base; the others convert through it. */
export const TEMPERATURE_UNITS: TemperatureUnit[] = [
  {
    id: 'C',
    name: 'Celsius',
    symbol: '°C',
    toBase: (v) => v + 273.15,
    fromBase: (v) => v - 273.15,
  },
  {
    id: 'F',
    name: 'Fahrenheit',
    symbol: '°F',
    toBase: (v) => ((v - 32) * 5) / 9 + 273.15,
    fromBase: (v) => ((v - 273.15) * 9) / 5 + 32,
  },
  { id: 'K', name: 'Kelvin', symbol: 'K', toBase: (v) => v, fromBase: (v) => v },
  {
    id: 'R',
    name: 'Rankine',
    symbol: '°R',
    toBase: (v) => (v * 5) / 9,
    fromBase: (v) => (v * 9) / 5,
  },
];

export const TEMPERATURE_CATEGORY_ID = 'temperature';

/** Every category id including temperature, in display order. */
export const ALL_CATEGORY_OPTIONS = [
  ...UNIT_CATEGORIES.slice(0, 2).map((c) => ({ id: c.id, label: c.label })),
  { id: TEMPERATURE_CATEGORY_ID, label: 'Temperature' },
  ...UNIT_CATEGORIES.slice(2).map((c) => ({ id: c.id, label: c.label })),
];

export function getUnitCategory(id: string): UnitCategory | undefined {
  return UNIT_CATEGORIES.find((category) => category.id === id);
}

/** Linear conversion via the category's base unit. */
export function convertUnit(value: number, from: Unit, to: Unit): number {
  return (value * from.factor) / to.factor;
}

export function convertTemperature(value: number, from: TemperatureUnit, to: TemperatureUnit): number {
  return to.fromBase(from.toBase(value));
}

export const TOTAL_UNIT_COUNT =
  UNIT_CATEGORIES.reduce((sum, category) => sum + category.units.length, 0) + TEMPERATURE_UNITS.length;
