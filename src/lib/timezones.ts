/**
 * City list for the world clock.
 *
 * Only IANA zone ids are stored — never fixed UTC offsets. The Intl API resolves
 * the offset for a given instant, which is what makes daylight saving correct
 * automatically instead of drifting by an hour twice a year.
 */

export interface City {
  id: string;
  city: string;
  country: string;
  /** IANA timezone identifier. */
  zone: string;
}

export const CITIES: readonly City[] = [
  { id: 'auckland', city: 'Auckland', country: 'New Zealand', zone: 'Pacific/Auckland' },
  { id: 'sydney', city: 'Sydney', country: 'Australia', zone: 'Australia/Sydney' },
  { id: 'melbourne', city: 'Melbourne', country: 'Australia', zone: 'Australia/Melbourne' },
  { id: 'brisbane', city: 'Brisbane', country: 'Australia', zone: 'Australia/Brisbane' },
  { id: 'perth', city: 'Perth', country: 'Australia', zone: 'Australia/Perth' },
  { id: 'tokyo', city: 'Tokyo', country: 'Japan', zone: 'Asia/Tokyo' },
  { id: 'seoul', city: 'Seoul', country: 'South Korea', zone: 'Asia/Seoul' },
  { id: 'shanghai', city: 'Shanghai', country: 'China', zone: 'Asia/Shanghai' },
  { id: 'beijing', city: 'Beijing', country: 'China', zone: 'Asia/Shanghai' },
  { id: 'hongkong', city: 'Hong Kong', country: 'Hong Kong', zone: 'Asia/Hong_Kong' },
  { id: 'taipei', city: 'Taipei', country: 'Taiwan', zone: 'Asia/Taipei' },
  { id: 'manila', city: 'Manila', country: 'Philippines', zone: 'Asia/Manila' },
  { id: 'singapore', city: 'Singapore', country: 'Singapore', zone: 'Asia/Singapore' },
  { id: 'kualalumpur', city: 'Kuala Lumpur', country: 'Malaysia', zone: 'Asia/Kuala_Lumpur' },
  { id: 'jakarta', city: 'Jakarta', country: 'Indonesia', zone: 'Asia/Jakarta' },
  { id: 'bangkok', city: 'Bangkok', country: 'Thailand', zone: 'Asia/Bangkok' },
  { id: 'hanoi', city: 'Hanoi', country: 'Vietnam', zone: 'Asia/Ho_Chi_Minh' },
  { id: 'dhaka', city: 'Dhaka', country: 'Bangladesh', zone: 'Asia/Dhaka' },
  { id: 'kolkata', city: 'Kolkata', country: 'India', zone: 'Asia/Kolkata' },
  { id: 'delhi', city: 'New Delhi', country: 'India', zone: 'Asia/Kolkata' },
  { id: 'mumbai', city: 'Mumbai', country: 'India', zone: 'Asia/Kolkata' },
  { id: 'bengaluru', city: 'Bengaluru', country: 'India', zone: 'Asia/Kolkata' },
  { id: 'colombo', city: 'Colombo', country: 'Sri Lanka', zone: 'Asia/Colombo' },
  { id: 'kathmandu', city: 'Kathmandu', country: 'Nepal', zone: 'Asia/Kathmandu' },
  { id: 'karachi', city: 'Karachi', country: 'Pakistan', zone: 'Asia/Karachi' },
  { id: 'lahore', city: 'Lahore', country: 'Pakistan', zone: 'Asia/Karachi' },
  { id: 'islamabad', city: 'Islamabad', country: 'Pakistan', zone: 'Asia/Karachi' },
  { id: 'tashkent', city: 'Tashkent', country: 'Uzbekistan', zone: 'Asia/Tashkent' },
  { id: 'kabul', city: 'Kabul', country: 'Afghanistan', zone: 'Asia/Kabul' },
  { id: 'dubai', city: 'Dubai', country: 'UAE', zone: 'Asia/Dubai' },
  { id: 'abudhabi', city: 'Abu Dhabi', country: 'UAE', zone: 'Asia/Dubai' },
  { id: 'doha', city: 'Doha', country: 'Qatar', zone: 'Asia/Qatar' },
  { id: 'riyadh', city: 'Riyadh', country: 'Saudi Arabia', zone: 'Asia/Riyadh' },
  { id: 'kuwait', city: 'Kuwait City', country: 'Kuwait', zone: 'Asia/Kuwait' },
  { id: 'baghdad', city: 'Baghdad', country: 'Iraq', zone: 'Asia/Baghdad' },
  { id: 'tehran', city: 'Tehran', country: 'Iran', zone: 'Asia/Tehran' },
  { id: 'jerusalem', city: 'Jerusalem', country: 'Israel', zone: 'Asia/Jerusalem' },
  { id: 'telaviv', city: 'Tel Aviv', country: 'Israel', zone: 'Asia/Jerusalem' },
  { id: 'istanbul', city: 'Istanbul', country: 'Turkey', zone: 'Europe/Istanbul' },
  { id: 'ankara', city: 'Ankara', country: 'Turkey', zone: 'Europe/Istanbul' },
  { id: 'moscow', city: 'Moscow', country: 'Russia', zone: 'Europe/Moscow' },
  { id: 'kyiv', city: 'Kyiv', country: 'Ukraine', zone: 'Europe/Kyiv' },
  { id: 'bucharest', city: 'Bucharest', country: 'Romania', zone: 'Europe/Bucharest' },
  { id: 'athens', city: 'Athens', country: 'Greece', zone: 'Europe/Athens' },
  { id: 'helsinki', city: 'Helsinki', country: 'Finland', zone: 'Europe/Helsinki' },
  { id: 'cairo', city: 'Cairo', country: 'Egypt', zone: 'Africa/Cairo' },
  { id: 'johannesburg', city: 'Johannesburg', country: 'South Africa', zone: 'Africa/Johannesburg' },
  { id: 'capetown', city: 'Cape Town', country: 'South Africa', zone: 'Africa/Johannesburg' },
  { id: 'nairobi', city: 'Nairobi', country: 'Kenya', zone: 'Africa/Nairobi' },
  { id: 'addis', city: 'Addis Ababa', country: 'Ethiopia', zone: 'Africa/Addis_Ababa' },
  { id: 'lagos', city: 'Lagos', country: 'Nigeria', zone: 'Africa/Lagos' },
  { id: 'accra', city: 'Accra', country: 'Ghana', zone: 'Africa/Accra' },
  { id: 'casablanca', city: 'Casablanca', country: 'Morocco', zone: 'Africa/Casablanca' },
  { id: 'stockholm', city: 'Stockholm', country: 'Sweden', zone: 'Europe/Stockholm' },
  { id: 'oslo', city: 'Oslo', country: 'Norway', zone: 'Europe/Oslo' },
  { id: 'copenhagen', city: 'Copenhagen', country: 'Denmark', zone: 'Europe/Copenhagen' },
  { id: 'berlin', city: 'Berlin', country: 'Germany', zone: 'Europe/Berlin' },
  { id: 'munich', city: 'Munich', country: 'Germany', zone: 'Europe/Berlin' },
  { id: 'frankfurt', city: 'Frankfurt', country: 'Germany', zone: 'Europe/Berlin' },
  { id: 'amsterdam', city: 'Amsterdam', country: 'Netherlands', zone: 'Europe/Amsterdam' },
  { id: 'brussels', city: 'Brussels', country: 'Belgium', zone: 'Europe/Brussels' },
  { id: 'paris', city: 'Paris', country: 'France', zone: 'Europe/Paris' },
  { id: 'zurich', city: 'Zurich', country: 'Switzerland', zone: 'Europe/Zurich' },
  { id: 'vienna', city: 'Vienna', country: 'Austria', zone: 'Europe/Vienna' },
  { id: 'prague', city: 'Prague', country: 'Czechia', zone: 'Europe/Prague' },
  { id: 'warsaw', city: 'Warsaw', country: 'Poland', zone: 'Europe/Warsaw' },
  { id: 'budapest', city: 'Budapest', country: 'Hungary', zone: 'Europe/Budapest' },
  { id: 'rome', city: 'Rome', country: 'Italy', zone: 'Europe/Rome' },
  { id: 'milan', city: 'Milan', country: 'Italy', zone: 'Europe/Rome' },
  { id: 'madrid', city: 'Madrid', country: 'Spain', zone: 'Europe/Madrid' },
  { id: 'barcelona', city: 'Barcelona', country: 'Spain', zone: 'Europe/Madrid' },
  { id: 'lisbon', city: 'Lisbon', country: 'Portugal', zone: 'Europe/Lisbon' },
  { id: 'dublin', city: 'Dublin', country: 'Ireland', zone: 'Europe/Dublin' },
  { id: 'london', city: 'London', country: 'United Kingdom', zone: 'Europe/London' },
  { id: 'edinburgh', city: 'Edinburgh', country: 'United Kingdom', zone: 'Europe/London' },
  { id: 'reykjavik', city: 'Reykjavík', country: 'Iceland', zone: 'Atlantic/Reykjavik' },
  { id: 'utc', city: 'UTC', country: 'Coordinated Universal Time', zone: 'UTC' },
  { id: 'saopaulo', city: 'São Paulo', country: 'Brazil', zone: 'America/Sao_Paulo' },
  { id: 'rio', city: 'Rio de Janeiro', country: 'Brazil', zone: 'America/Sao_Paulo' },
  { id: 'buenosaires', city: 'Buenos Aires', country: 'Argentina', zone: 'America/Argentina/Buenos_Aires' },
  { id: 'santiago', city: 'Santiago', country: 'Chile', zone: 'America/Santiago' },
  { id: 'lima', city: 'Lima', country: 'Peru', zone: 'America/Lima' },
  { id: 'bogota', city: 'Bogotá', country: 'Colombia', zone: 'America/Bogota' },
  { id: 'caracas', city: 'Caracas', country: 'Venezuela', zone: 'America/Caracas' },
  { id: 'halifax', city: 'Halifax', country: 'Canada', zone: 'America/Halifax' },
  { id: 'newyork', city: 'New York', country: 'United States', zone: 'America/New_York' },
  { id: 'washington', city: 'Washington DC', country: 'United States', zone: 'America/New_York' },
  { id: 'boston', city: 'Boston', country: 'United States', zone: 'America/New_York' },
  { id: 'miami', city: 'Miami', country: 'United States', zone: 'America/New_York' },
  { id: 'toronto', city: 'Toronto', country: 'Canada', zone: 'America/Toronto' },
  { id: 'montreal', city: 'Montreal', country: 'Canada', zone: 'America/Toronto' },
  { id: 'chicago', city: 'Chicago', country: 'United States', zone: 'America/Chicago' },
  { id: 'dallas', city: 'Dallas', country: 'United States', zone: 'America/Chicago' },
  { id: 'houston', city: 'Houston', country: 'United States', zone: 'America/Chicago' },
  { id: 'mexicocity', city: 'Mexico City', country: 'Mexico', zone: 'America/Mexico_City' },
  { id: 'denver', city: 'Denver', country: 'United States', zone: 'America/Denver' },
  { id: 'phoenix', city: 'Phoenix', country: 'United States', zone: 'America/Phoenix' },
  { id: 'losangeles', city: 'Los Angeles', country: 'United States', zone: 'America/Los_Angeles' },
  { id: 'sanfrancisco', city: 'San Francisco', country: 'United States', zone: 'America/Los_Angeles' },
  { id: 'seattle', city: 'Seattle', country: 'United States', zone: 'America/Los_Angeles' },
  { id: 'vancouver', city: 'Vancouver', country: 'Canada', zone: 'America/Vancouver' },
  { id: 'anchorage', city: 'Anchorage', country: 'United States', zone: 'America/Anchorage' },
  { id: 'honolulu', city: 'Honolulu', country: 'United States', zone: 'Pacific/Honolulu' },
];

export const DEFAULT_CITY_IDS = ['newyork', 'london', 'dubai', 'tokyo'] as const;

export function getCity(id: string): City | undefined {
  return CITIES.find((city) => city.id === id);
}

/** The viewer's own IANA zone, or UTC if the browser won't say. */
export function localZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Minutes that `zone` is offset from UTC at `instant`.
 *
 * Derived by formatting the same instant in the target zone and in UTC and
 * differencing the two — the only approach that respects DST without shipping a
 * timezone database.
 */
export function zoneOffsetMinutes(zone: string, instant: Date): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const parts = formatter.formatToParts(instant);
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0');

    // Hour 24 appears at midnight in some locales; normalise it to 0.
    const hour = get('hour') % 24;

    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));

    // Round to the minute: the source instant carries milliseconds the formatted
    // value doesn't, which would otherwise leave a sub-minute remainder.
    return Math.round((asUtc - instant.getTime()) / 60000);
  } catch {
    return 0;
  }
}

export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  return `UTC${sign}${hours}${mins > 0 ? `:${String(mins).padStart(2, '0')}` : ''}`;
}

export interface ZoneTime {
  time: string;
  date: string;
  weekday: string;
  /** Hour of day 0-23 in that zone, for the meeting-planner shading. */
  hour: number;
  offsetMinutes: number;
  /** -1, 0 or +1 relative to the reference zone's calendar day. */
  dayDelta: number;
}

export function zoneTime(zone: string, instant: Date, referenceZone: string, hour12: boolean): ZoneTime {
  const time = new Intl.DateTimeFormat(undefined, {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    hour12,
  }).format(instant);

  const date = new Intl.DateTimeFormat(undefined, {
    timeZone: zone,
    day: 'numeric',
    month: 'short',
  }).format(instant);

  const weekday = new Intl.DateTimeFormat(undefined, { timeZone: zone, weekday: 'short' }).format(instant);

  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: '2-digit', hour12: false }).format(instant),
  ) % 24;

  // Compare ISO calendar dates rather than offsets, so "tomorrow" is decided by
  // the actual date in each zone.
  const dayOf = (tz: string) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
      instant,
    );

  const target = dayOf(zone);
  const reference = dayOf(referenceZone);
  const dayDelta = target === reference ? 0 : target > reference ? 1 : -1;

  return { time, date, weekday, hour, offsetMinutes: zoneOffsetMinutes(zone, instant), dayDelta };
}
