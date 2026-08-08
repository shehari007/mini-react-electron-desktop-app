'use client';

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplet,
  Gauge,
  LocateFixed,
  Search,
  Sun,
  Sunrise,
  Sunset,
  Wind,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { ToolColumns } from '@/components/ToolShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Controls';
import { DetailList } from '@/components/ui/DataTable';
import { Badge, Callout, Skeleton } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useDebouncedValue, useOnline } from '@/lib/hooks';
import { useLocalStorage } from '@/lib/storage';
import {
  describeWeather,
  fetchWeather,
  placeLabel,
  readCachedWeather,
  searchPlaces,
  uvIndexLabel,
  windDirectionLabel,
  type Place,
  type TemperatureUnitPreference,
  type WeatherData,
} from '@/lib/weather';
import { cn, formatNumber, relativeTime } from '@/lib/utils';

const ICONS: Record<ReturnType<typeof describeWeather>['icon'], ReactNode> = {
  sun: <Sun />,
  'cloud-sun': <CloudSun />,
  cloud: <Cloud />,
  'cloud-fog': <CloudFog />,
  'cloud-drizzle': <CloudDrizzle />,
  'cloud-rain': <CloudRain />,
  'cloud-snow': <CloudSnow />,
  'cloud-lightning': <CloudLightning />,
};

export function Weather() {
  const online = useOnline();

  const [unit, setUnit] = useLocalStorage<TemperatureUnitPreference>('weather:unit', 'celsius');
  const [savedPlace, setSavedPlace] = useLocalStorage<Place | null>('weather:place', null);

  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 350);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (place: Place, preference: TemperatureUnitPreference) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        setData(await fetchWeather(place, preference, controller.signal));
        setFromCache(false);
      } catch (caught) {
        if (controller.signal.aborted) return;
        const cached = readCachedWeather();
        if (cached) {
          setData(cached);
          setFromCache(true);
          setError(null);
        } else {
          setError(
            caught instanceof Error && !online
              ? 'You are offline and there is no saved forecast on this device yet.'
              : 'Could not load the forecast just now. Try again in a moment.',
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [online],
  );

  // On first mount show the cached forecast immediately, then refresh it.
  useEffect(() => {
    const cached = readCachedWeather();
    if (cached) {
      setData(cached);
      setFromCache(true);
    }

    const place = savedPlace ?? cached?.place ?? null;
    if (place) void load(place, unit);

    return () => abortRef.current?.abort();
    // Deliberately mount-only: later refreshes are driven by explicit actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when the unit changes, so the API returns the right scale rather
  // than us converting locally and risking a mismatch with the daily extremes.
  useEffect(() => {
    if (!data || data.unit === unit) return;
    void load(data.place, unit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setPlaces([]);
      return;
    }

    let cancelled = false;
    setSearching(true);

    void searchPlaces(debouncedQuery)
      .then((results) => {
        if (!cancelled) setPlaces(results);
      })
      .catch(() => {
        if (!cancelled) setPlaces([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const choose = (place: Place) => {
    setSavedPlace(place);
    setQuery('');
    setPlaces([]);
    void load(place, unit);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('This browser cannot report your location.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const place: Place = {
          id: -1,
          name: 'My location',
          country: '',
          admin1: null,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timezone: 'auto',
        };
        setSavedPlace(place);
        void load(place, unit);
      },
      () => {
        setLoading(false);
        setError('Location permission was declined. Search for a city instead.');
      },
      { timeout: 10_000 },
    );
  };

  const degree = unit === 'celsius' ? '°C' : '°F';
  const speedUnit = 'km/h';

  const current = data?.current;
  const today = data?.daily[0];
  const conditions = current ? describeWeather(current.weatherCode) : null;

  const formatTime = (iso: string) =>
    iso === ''
      ? '—'
      : new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

  return (
    <ToolColumns
      main={
        <>
          <Card>
            <CardHeader
              title="Find a place"
              actions={
                <Segmented
                  value={unit}
                  onChange={setUnit}
                  ariaLabel="Temperature unit"
                  size="sm"
                  options={[
                    { value: 'celsius', label: '°C' },
                    { value: 'fahrenheit', label: '°F' },
                  ]}
                />
              }
            />

            <div className="mt-4 flex flex-wrap items-end gap-2">
              <Field label="City" className="min-w-56 flex-1">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  placeholder="Karachi, Berlin, São Paulo…"
                  prefix={<Search />}
                  autoComplete="off"
                />
              </Field>
              <Button leadingIcon={<LocateFixed />} onClick={useMyLocation}>
                My location
              </Button>
            </div>

            {searching && <p className="mt-3 text-[13px] text-fg-subtle">Searching…</p>}

            {places.length > 0 && (
              <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
                {places.map((place) => (
                  <li key={`${place.id}-${place.latitude}`}>
                    <button
                      type="button"
                      onClick={() => choose(place)}
                      className="w-full px-3.5 py-2.5 text-left transition-colors hover:bg-accent-soft"
                    >
                      <span className="block text-[13px] font-medium text-fg">{place.name}</span>
                      <span className="block text-[11px] text-fg-subtle">
                        {[place.admin1, place.country].filter(Boolean).join(', ')} ·{' '}
                        {formatNumber(place.latitude, 2)}, {formatNumber(place.longitude, 2)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {debouncedQuery.trim().length >= 2 && !searching && places.length === 0 && (
              <p className="mt-3 text-[13px] text-fg-subtle">No places match “{debouncedQuery}”.</p>
            )}
          </Card>

          {!online && data && (
            <Callout tone="warning" title="You're offline">
              Showing the forecast saved on this device {relativeTime(data.fetchedAt)}. It will refresh
              automatically once you are back online.
            </Callout>
          )}
          {error && <Callout tone="danger">{error}</Callout>}

          {loading && !data && (
            <Card>
              <Skeleton className="h-32" />
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-16" />
                ))}
              </div>
            </Card>
          )}

          {data && current && conditions && (
            <>
              <Card className="accent-glow">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-fg">{placeLabel(data.place)}</p>
                    <p className="mt-0.5 text-[12px] text-fg-subtle">
                      Updated {relativeTime(data.fetchedAt)}
                      {fromCache ? ' · from cache' : ''}
                    </p>

                    <div className="mt-4 flex items-center gap-4">
                      <span className="text-accent-text [&_svg]:size-12">{ICONS[conditions.icon]}</span>
                      <div>
                        <div className="tabular text-[3.25rem] font-light leading-none text-fg">
                          {formatNumber(current.temperature, 0)}
                          <span className="text-2xl align-top text-fg-muted">{degree}</span>
                        </div>
                        <p className="mt-1 text-[14px] font-medium text-fg-muted">{conditions.label}</p>
                      </div>
                    </div>

                    <p className="mt-3 text-[13px] text-fg-muted">
                      Feels like {formatNumber(current.apparentTemperature, 0)}
                      {degree}
                      {today && (
                        <>
                          {' · '}
                          High {formatNumber(today.tempMax, 0)}
                          {degree}, low {formatNumber(today.tempMin, 0)}
                          {degree}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge tone={current.isDay ? 'warning' : 'accent'}>
                      {current.isDay ? 'Daytime' : 'Night'}
                    </Badge>
                    {today?.precipitationProbability !== null && today?.precipitationProbability !== undefined && (
                      <Badge tone="neutral">{today.precipitationProbability}% chance of rain</Badge>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat label="Humidity" value={`${formatNumber(current.humidity, 0)}%`} />
                  <Stat
                    label="Wind"
                    value={`${formatNumber(current.windSpeed, 0)} ${speedUnit}`}
                    hint={windDirectionLabel(current.windDirection)}
                  />
                  <Stat label="Pressure" value={`${formatNumber(current.pressure, 0)} hPa`} />
                  <Stat label="Cloud cover" value={`${formatNumber(current.cloudCover, 0)}%`} />
                </div>
              </Card>

              {data.hourly.length > 0 && (
                <Card flush>
                  <div className="p-5 pb-3">
                    <CardHeader title="Next 24 hours" />
                  </div>
                  <div className="overflow-x-auto px-5 pb-5">
                    <div className="flex gap-2">
                      {data.hourly.map((hour) => {
                        const hourly = describeWeather(hour.weatherCode);
                        return (
                          <div
                            key={hour.time}
                            className="flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-xl border border-border bg-bg-subtle px-1 py-2.5"
                          >
                            <span className="text-[10px] text-fg-subtle">
                              {new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(new Date(hour.time))}
                            </span>
                            <span className="text-accent-text [&_svg]:size-4">{ICONS[hourly.icon]}</span>
                            <span className="tabular text-[12px] font-semibold text-fg">
                              {formatNumber(hour.temperature, 0)}°
                            </span>
                            {hour.precipitationProbability !== null && hour.precipitationProbability > 0 && (
                              <span className="flex items-center gap-0.5 text-[9px] text-fg-subtle">
                                <Droplet className="size-2.5" aria-hidden="true" />
                                {hour.precipitationProbability}%
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              )}

              <Card flush>
                <div className="p-5 pb-3">
                  <CardHeader title="7-day forecast" />
                </div>
                <ul className="divide-y divide-border px-5 pb-5">
                  {data.daily.map((day, index) => {
                    const daily = describeWeather(day.weatherCode);
                    // Scale each day's range bar against the whole week, so the
                    // bars are comparable rather than each self-normalised.
                    const weekMin = Math.min(...data.daily.map((d) => d.tempMin));
                    const weekMax = Math.max(...data.daily.map((d) => d.tempMax));
                    const span = weekMax - weekMin || 1;

                    return (
                      <li key={day.date} className="flex items-center gap-3 py-2.5">
                        <span className="w-16 shrink-0 text-[13px] font-medium text-fg">
                          {index === 0
                            ? 'Today'
                            : new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(
                                new Date(`${day.date}T12:00:00`),
                              )}
                        </span>
                        <span className="w-6 shrink-0 text-accent-text [&_svg]:size-4">{ICONS[daily.icon]}</span>
                        <span className="hidden min-w-0 flex-1 truncate text-[12px] text-fg-muted sm:block">
                          {daily.label}
                        </span>
                        <span className="tabular w-9 shrink-0 text-right text-[12px] text-fg-subtle">
                          {formatNumber(day.tempMin, 0)}°
                        </span>
                        <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-bg-subtle sm:w-28">
                          <span
                            className="block h-full rounded-full bg-accent"
                            style={{
                              marginLeft: `${((day.tempMin - weekMin) / span) * 100}%`,
                              width: `${Math.max(6, ((day.tempMax - day.tempMin) / span) * 100)}%`,
                            }}
                          />
                        </span>
                        <span className="tabular w-9 shrink-0 text-right text-[12px] font-semibold text-fg">
                          {formatNumber(day.tempMax, 0)}°
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </>
          )}
        </>
      }
      side={
        data && today ? (
          <>
            <Card>
              <CardHeader title="Sun" />
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-subtle px-3.5 py-2.5">
                  <Sunrise className="size-4 shrink-0 text-warning" aria-hidden="true" />
                  <span className="flex-1 text-[13px] text-fg-muted">Sunrise</span>
                  <span className="tabular text-[13px] font-semibold text-fg">{formatTime(today.sunrise)}</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-subtle px-3.5 py-2.5">
                  <Sunset className="size-4 shrink-0 text-warning" aria-hidden="true" />
                  <span className="flex-1 text-[13px] text-fg-muted">Sunset</span>
                  <span className="tabular text-[13px] font-semibold text-fg">{formatTime(today.sunset)}</span>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Today in detail" />
              <DetailList
                className="mt-3"
                items={[
                  {
                    label: (
                      <span className="flex items-center gap-1.5">
                        <Sun className="size-3.5" aria-hidden="true" /> UV index
                      </span>
                    ),
                    value:
                      today.uvIndexMax === null ? '—' : formatNumber(today.uvIndexMax, 1),
                    hint: today.uvIndexMax === null ? undefined : uvIndexLabel(today.uvIndexMax).label,
                  },
                  {
                    label: (
                      <span className="flex items-center gap-1.5">
                        <Droplet className="size-3.5" aria-hidden="true" /> Rain total
                      </span>
                    ),
                    value: `${formatNumber(today.precipitationSum, 1)} mm`,
                  },
                  {
                    label: (
                      <span className="flex items-center gap-1.5">
                        <Wind className="size-3.5" aria-hidden="true" /> Max wind
                      </span>
                    ),
                    value: `${formatNumber(today.windSpeedMax, 0)} ${speedUnit}`,
                  },
                  {
                    label: (
                      <span className="flex items-center gap-1.5">
                        <Gauge className="size-3.5" aria-hidden="true" /> Pressure
                      </span>
                    ),
                    value: `${formatNumber(data.current.pressure, 0)} hPa`,
                  },
                ]}
              />
            </Card>

            <Card>
              <CardHeader title="Where this comes from" />
              <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">
                Forecasts are from{' '}
                <a
                  href="https://open-meteo.com"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-accent-text underline decoration-border underline-offset-2"
                >
                  Open-Meteo
                </a>
                , a free service that needs no API key. Only the coordinates of the place you search for are
                sent — no identifying information, and nothing is stored on a server.
              </p>
            </Card>
          </>
        ) : (
          <Card>
            <p className={cn('py-6 text-center text-[13px] text-fg-muted')}>
              Search for a city, or use your location, to see the forecast.
            </p>
          </Card>
        )
      }
    />
  );
}
