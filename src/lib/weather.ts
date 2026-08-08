/**
 * Weather via Open-Meteo.
 *
 * Chosen specifically because it needs no API key: the previous version of this
 * app made the user register with OpenWeatherMap and paste a key into settings
 * before Weather would show anything, which meant it was broken by default.
 *
 * The last successful result is cached so the tool degrades to "here's what it
 * was, and when" rather than an error page when offline.
 */

import { readStored, writeStored } from './storage';

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_KEY = 'weather:last';

export interface Place {
  id: number;
  name: string;
  country: string;
  admin1: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  cloudCover: number;
  isDay: boolean;
}

export interface DailyWeather {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbability: number | null;
  windSpeedMax: number;
  uvIndexMax: number | null;
  sunrise: string;
  sunset: string;
}

export interface HourlyWeather {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number | null;
}

export type TemperatureUnitPreference = 'celsius' | 'fahrenheit';

export interface WeatherData {
  place: Place;
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  unit: TemperatureUnitPreference;
  /** When this payload was fetched (ms epoch) — drives the "cached" notice. */
  fetchedAt: number;
}

// ─── WMO weather codes ────────────────────────────────────────────────────

export interface WeatherDescription {
  label: string;
  /** Lucide icon name, resolved by the Weather component. */
  icon: 'sun' | 'cloud-sun' | 'cloud' | 'cloud-fog' | 'cloud-drizzle' | 'cloud-rain' | 'cloud-snow' | 'cloud-lightning';
}

/**
 * WMO 4677 code table, collapsed to the groups worth distinguishing in a UI.
 * Open-Meteo returns these raw integers and no text, so the mapping lives here.
 */
const WEATHER_CODES: Record<number, WeatherDescription> = {
  0: { label: 'Clear sky', icon: 'sun' },
  1: { label: 'Mainly clear', icon: 'cloud-sun' },
  2: { label: 'Partly cloudy', icon: 'cloud-sun' },
  3: { label: 'Overcast', icon: 'cloud' },
  45: { label: 'Fog', icon: 'cloud-fog' },
  48: { label: 'Freezing fog', icon: 'cloud-fog' },
  51: { label: 'Light drizzle', icon: 'cloud-drizzle' },
  53: { label: 'Drizzle', icon: 'cloud-drizzle' },
  55: { label: 'Heavy drizzle', icon: 'cloud-drizzle' },
  56: { label: 'Light freezing drizzle', icon: 'cloud-drizzle' },
  57: { label: 'Freezing drizzle', icon: 'cloud-drizzle' },
  61: { label: 'Light rain', icon: 'cloud-rain' },
  63: { label: 'Rain', icon: 'cloud-rain' },
  65: { label: 'Heavy rain', icon: 'cloud-rain' },
  66: { label: 'Light freezing rain', icon: 'cloud-rain' },
  67: { label: 'Freezing rain', icon: 'cloud-rain' },
  71: { label: 'Light snow', icon: 'cloud-snow' },
  73: { label: 'Snow', icon: 'cloud-snow' },
  75: { label: 'Heavy snow', icon: 'cloud-snow' },
  77: { label: 'Snow grains', icon: 'cloud-snow' },
  80: { label: 'Light showers', icon: 'cloud-rain' },
  81: { label: 'Showers', icon: 'cloud-rain' },
  82: { label: 'Violent showers', icon: 'cloud-rain' },
  85: { label: 'Light snow showers', icon: 'cloud-snow' },
  86: { label: 'Snow showers', icon: 'cloud-snow' },
  95: { label: 'Thunderstorm', icon: 'cloud-lightning' },
  96: { label: 'Thunderstorm with hail', icon: 'cloud-lightning' },
  99: { label: 'Severe thunderstorm with hail', icon: 'cloud-lightning' },
};

export function describeWeather(code: number): WeatherDescription {
  return WEATHER_CODES[code] ?? { label: 'Unknown conditions', icon: 'cloud' };
}

/** Compass point for a wind bearing in degrees. */
export function windDirectionLabel(degrees: number): string {
  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return points[Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16] ?? 'N';
}

export function uvIndexLabel(uv: number): { label: string; tone: 'success' | 'warning' | 'danger' } {
  if (uv < 3) return { label: 'Low', tone: 'success' };
  if (uv < 6) return { label: 'Moderate', tone: 'warning' };
  if (uv < 8) return { label: 'High', tone: 'warning' };
  return { label: 'Very high', tone: 'danger' };
}

// ─── Requests ─────────────────────────────────────────────────────────────

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `${GEOCODE_URL}?name=${encodeURIComponent(trimmed)}&count=8&language=en&format=json`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Place search failed (${response.status})`);

  const payload = (await response.json()) as {
    results?: Array<{
      id: number;
      name: string;
      country?: string;
      admin1?: string;
      latitude: number;
      longitude: number;
      timezone?: string;
    }>;
  };

  return (payload.results ?? []).map((result) => ({
    id: result.id,
    name: result.name,
    country: result.country ?? '',
    admin1: result.admin1 ?? null,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone ?? 'auto',
  }));
}

/** A number that may legitimately be absent from the response. */
const num = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const nullableNum = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export async function fetchWeather(
  place: Place,
  unit: TemperatureUnitPreference,
  signal?: AbortSignal,
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m',
    hourly: 'temperature_2m,weather_code,precipitation_probability',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
    timezone: 'auto',
    forecast_days: '7',
  });
  if (unit === 'fahrenheit') params.set('temperature_unit', 'fahrenheit');

  const response = await fetch(`${FORECAST_URL}?${params.toString()}`, { signal });
  if (!response.ok) throw new Error(`Forecast failed (${response.status})`);

  const payload = (await response.json()) as {
    current?: Record<string, unknown>;
    hourly?: Record<string, unknown[]>;
    daily?: Record<string, unknown[]>;
  };

  const c = payload.current ?? {};
  const current: CurrentWeather = {
    temperature: num(c.temperature_2m),
    apparentTemperature: num(c.apparent_temperature),
    humidity: num(c.relative_humidity_2m),
    precipitation: num(c.precipitation),
    weatherCode: num(c.weather_code),
    windSpeed: num(c.wind_speed_10m),
    windDirection: num(c.wind_direction_10m),
    pressure: num(c.pressure_msl),
    cloudCover: num(c.cloud_cover),
    isDay: num(c.is_day) === 1,
  };

  const h = payload.hourly ?? {};
  const hourlyTimes = (h.time ?? []) as string[];
  const allHourly: HourlyWeather[] = hourlyTimes.map((time, index) => ({
    time,
    temperature: num(h.temperature_2m?.[index]),
    weatherCode: num(h.weather_code?.[index]),
    precipitationProbability: nullableNum(h.precipitation_probability?.[index]),
  }));

  // Trim to the next 24 hours from now — the API returns whole days, so the
  // first entries are already in the past.
  const nowIso = new Date().toISOString().slice(0, 13);
  const startIndex = Math.max(
    0,
    allHourly.findIndex((entry) => entry.time.slice(0, 13) >= nowIso),
  );
  const hourly = allHourly.slice(startIndex, startIndex + 24);

  const d = payload.daily ?? {};
  const dailyDates = (d.time ?? []) as string[];
  const daily: DailyWeather[] = dailyDates.map((date, index) => ({
    date,
    weatherCode: num(d.weather_code?.[index]),
    tempMax: num(d.temperature_2m_max?.[index]),
    tempMin: num(d.temperature_2m_min?.[index]),
    precipitationSum: num(d.precipitation_sum?.[index]),
    precipitationProbability: nullableNum(d.precipitation_probability_max?.[index]),
    windSpeedMax: num(d.wind_speed_10m_max?.[index]),
    uvIndexMax: nullableNum(d.uv_index_max?.[index]),
    sunrise: String(d.sunrise?.[index] ?? ''),
    sunset: String(d.sunset?.[index] ?? ''),
  }));

  const data: WeatherData = { place, current, hourly, daily, unit, fetchedAt: Date.now() };
  writeStored(CACHE_KEY, data);
  return data;
}

function isWeatherData(value: unknown): value is WeatherData {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<WeatherData>;
  return (
    typeof candidate.fetchedAt === 'number' &&
    typeof candidate.place === 'object' &&
    candidate.place !== null &&
    typeof candidate.current === 'object' &&
    candidate.current !== null &&
    Array.isArray(candidate.daily)
  );
}

export function readCachedWeather(): WeatherData | null {
  return readStored<WeatherData | null>(CACHE_KEY, null, (value): value is WeatherData | null =>
    value === null ? true : isWeatherData(value),
  );
}

export function placeLabel(place: Place): string {
  return [place.name, place.admin1, place.country].filter(Boolean).join(', ');
}
