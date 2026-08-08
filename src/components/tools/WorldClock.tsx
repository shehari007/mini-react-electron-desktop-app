'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Controls';
import { Badge, EmptyState } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { useMounted, useNow } from '@/lib/hooks';
import { useLocalStorage } from '@/lib/storage';
import { CITIES, DEFAULT_CITY_IDS, formatOffset, getCity, localZone, zoneTime } from '@/lib/timezones';
import { cn } from '@/lib/utils';

/** Hours shaded as "reasonable to schedule a meeting". */
const WORK_START = 9;
const WORK_END = 18;

export function WorldClock() {
  const mounted = useMounted();
  const now = useNow(1000);

  const [cityIds, setCityIds] = useLocalStorage<string[]>('worldclock:cities', [...DEFAULT_CITY_IDS], {
    validate: (value): value is string[] => Array.isArray(value) && value.every((id) => typeof id === 'string'),
  });
  const [hour12, setHour12] = useLocalStorage<boolean>('worldclock:hour12', false);
  const [pending, setPending] = useState('');

  const reference = localZone();
  const instant = useMemo(() => new Date(now), [now]);

  // Drop any saved ids that no longer exist in the city list.
  const cities = useMemo(
    () => cityIds.map((id) => getCity(id)).filter((city): city is NonNullable<typeof city> => city !== undefined),
    [cityIds],
  );

  const available = useMemo(
    () =>
      CITIES.filter((city) => !cityIds.includes(city.id)).map((city) => ({
        value: city.id,
        label: `${city.city} — ${city.country}`,
      })),
    [cityIds],
  );

  const add = () => {
    if (pending === '' || cityIds.includes(pending)) return;
    setCityIds([...cityIds, pending]);
    setPending('');
  };

  const remove = (id: string) => setCityIds(cityIds.filter((cityId) => cityId !== id));

  if (!mounted) {
    // Times cannot be prerendered without a hydration mismatch.
    return (
      <Card className="py-16">
        <div className="mx-auto h-10 w-56 animate-pulse rounded-lg bg-border/50" />
      </Card>
    );
  }

  const localTime = zoneTime(reference, instant, reference, hour12);

  return (
    <div className="space-y-5">
      <Card className="accent-glow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-text">Your local time</p>
            <div className="tabular mt-1 font-mono text-[2.5rem] font-light leading-none text-fg sm:text-[3.25rem]">
              {localTime.time}
            </div>
            <p className="mt-2 text-[13px] text-fg-muted">
              {localTime.weekday} {localTime.date} · {reference} ·{' '}
              {formatOffset(localTime.offsetMinutes)}
            </p>
          </div>

          <Segmented
            value={hour12 ? '12' : '24'}
            onChange={(value) => setHour12(value === '12')}
            ariaLabel="Time format"
            size="sm"
            options={[
              { value: '24', label: '24h' },
              { value: '12', label: '12h' },
            ]}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Add a city" description={`${CITIES.length} cities available.`} />
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <Field label="City" className="min-w-56 flex-1">
            <Select
              options={available}
              value={pending}
              onChange={(event) => setPending(event.currentTarget.value)}
              placeholder={available.length > 0 ? 'Choose a city…' : 'All cities added'}
              disabled={available.length === 0}
            />
          </Field>
          <Button variant="primary" leadingIcon={<Plus />} onClick={add} disabled={pending === ''}>
            Add
          </Button>
        </div>
      </Card>

      {cities.length === 0 ? (
        <Card>
          <EmptyState
            title="No cities yet"
            description="Add a city above to start tracking time zones side by side."
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => {
              const time = zoneTime(city.zone, instant, reference, hour12);
              const isNight = time.hour < 6 || time.hour >= 20;

              return (
                <Card key={city.id} className="relative">
                  <button
                    type="button"
                    onClick={() => remove(city.id)}
                    aria-label={`Remove ${city.city}`}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </button>

                  <div className="pr-8">
                    <p className="truncate text-[14px] font-semibold text-fg">{city.city}</p>
                    <p className="truncate text-[11px] text-fg-subtle">{city.country}</p>
                  </div>

                  <div className="tabular mt-3 font-mono text-[2rem] font-light leading-none text-fg">
                    {time.time}
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone="neutral">{formatOffset(time.offsetMinutes)}</Badge>
                    {time.dayDelta !== 0 && (
                      <Badge tone="warning">{time.dayDelta > 0 ? 'Next day' : 'Previous day'}</Badge>
                    )}
                    <span className="text-[11px] text-fg-subtle">
                      {isNight ? '🌙' : '☀️'} {time.weekday} {time.date}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card flush>
            <div className="p-5 pb-3">
              <CardHeader
                title="Meeting planner"
                description="The next 24 hours in every city. Shaded hours are between 09:00 and 18:00 locally."
              />
            </div>

            <div className="overflow-x-auto px-5 pb-5">
              <table className="w-full border-collapse">
                <caption className="sr-only">
                  Local hour in each city over the next 24 hours, with working hours highlighted
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="sticky left-0 z-10 bg-card pb-2 pr-3 text-left text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                      City
                    </th>
                    {Array.from({ length: 24 }, (_, offset) => {
                      const future = new Date(instant.getTime() + offset * 3_600_000);
                      const localHour = zoneTime(reference, future, reference, false).hour;
                      return (
                        <th
                          key={offset}
                          scope="col"
                          className="pb-2 text-center text-[10px] font-medium text-fg-subtle"
                        >
                          {String(localHour).padStart(2, '0')}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {[{ id: '__local', city: 'You', country: '', zone: reference }, ...cities].map((city) => (
                    <tr key={city.id}>
                      <th
                        scope="row"
                        className="sticky left-0 z-10 max-w-28 truncate bg-card py-1 pr-3 text-left text-[12px] font-medium text-fg"
                      >
                        {city.city}
                      </th>
                      {Array.from({ length: 24 }, (_, offset) => {
                        const future = new Date(instant.getTime() + offset * 3_600_000);
                        const { hour } = zoneTime(city.zone, future, reference, false);
                        const isWork = hour >= WORK_START && hour < WORK_END;
                        const isAsleep = hour < 7 || hour >= 22;

                        return (
                          <td key={offset} className="px-px py-1">
                            <div
                              title={`${city.city}: ${String(hour).padStart(2, '0')}:00`}
                              className={cn(
                                'grid h-6 place-items-center rounded text-[9px] font-semibold tabular-nums',
                                isWork
                                  ? 'bg-accent text-accent-fg'
                                  : isAsleep
                                    ? 'bg-bg-subtle text-fg-subtle/60'
                                    : 'bg-accent-soft text-accent-text',
                              )}
                            >
                              {hour}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-fg-muted">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded bg-accent" aria-hidden="true" /> Working hours
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded bg-accent-soft" aria-hidden="true" /> Awake
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded bg-bg-subtle" aria-hidden="true" /> Probably asleep
                </span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
