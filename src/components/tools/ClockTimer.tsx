'use client';

import { Bell, Flag, Pause, Play, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { Segmented, Switch } from '@/components/ui/Controls';
import { DataTable } from '@/components/ui/DataTable';
import { Callout } from '@/components/ui/Feedback';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useAnimationFrame, useMounted, useNow } from '@/lib/hooks';
import { useLocalStorage } from '@/lib/storage';
import { cn, formatDuration } from '@/lib/utils';

type Tab = 'clock' | 'timer' | 'stopwatch';

export function ClockTimer() {
  const [tab, setTab] = useState<Tab>('clock');

  return (
    <div className="space-y-5">
      <Segmented
        value={tab}
        onChange={setTab}
        ariaLabel="Time tool"
        fullWidth
        className="sm:w-auto"
        options={[
          { value: 'clock', label: 'Clock' },
          { value: 'timer', label: 'Timer' },
          { value: 'stopwatch', label: 'Stopwatch' },
        ]}
      />

      {tab === 'clock' && <LiveClock />}
      {tab === 'timer' && <CountdownTimer />}
      {tab === 'stopwatch' && <Stopwatch />}
    </div>
  );
}

// ─── Clock ────────────────────────────────────────────────────────────────

function LiveClock() {
  const mounted = useMounted();
  const now = useNow(1000);
  const [hour12, setHour12] = useLocalStorage<boolean>('clock:hour12', false);

  // The prerendered HTML cannot contain a real time, so nothing renders until
  // mount — otherwise hydration would mismatch on every load.
  if (!mounted) {
    return (
      <Card className="py-16">
        <div className="mx-auto h-16 w-64 animate-pulse rounded-lg bg-border/50" />
      </Card>
    );
  }

  const date = new Date(now);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12,
  }).format(date);

  const fullDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // ISO week number: Thursday of the current week decides the year, per ISO 8601.
  const weekNumber = (() => {
    const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  })();

  const dayOfYear = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86400000,
  );

  return (
    <>
      <Card className="accent-glow text-center">
        <div className="tabular font-mono text-[3rem] font-light leading-none tracking-tight text-fg sm:text-[4.5rem]">
          {time}
        </div>
        <p className="mt-3 text-sm text-fg-muted">{fullDate}</p>
        <p className="mt-1 text-[12px] text-fg-subtle">{zone}</p>

        <div className="mt-5 flex justify-center">
          <Segmented
            value={hour12 ? '12' : '24'}
            onChange={(value) => setHour12(value === '12')}
            ariaLabel="Time format"
            size="sm"
            options={[
              { value: '24', label: '24-hour' },
              { value: '12', label: '12-hour' },
            ]}
          />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Week number" value={`W${weekNumber}`} hint="ISO 8601" />
        <Stat label="Day of year" value={dayOfYear} hint={`of ${isLeapYear(date.getFullYear()) ? 366 : 365}`} />
        <Stat label="Unix time" value={Math.floor(now / 1000)} hint="seconds since 1970" />
        <Stat
          label="UTC"
          value={new Intl.DateTimeFormat(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC',
            hour12,
          }).format(date)}
        />
      </div>
    </>
  );
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// ─── Countdown timer ──────────────────────────────────────────────────────

const TIMER_PRESETS = [
  { label: '1 min', ms: 60_000 },
  { label: '3 min', ms: 180_000 },
  { label: '5 min', ms: 300_000 },
  { label: '10 min', ms: 600_000 },
  { label: '25 min', ms: 1_500_000 },
  { label: '1 hour', ms: 3_600_000 },
];

function CountdownTimer() {
  const [durationMs, setDurationMs] = useState(300_000);
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('5');
  const [seconds, setSeconds] = useState('0');

  /** Wall-clock instant the timer should reach zero. Storing a deadline rather
   *  than a decrementing counter keeps it accurate when the tab is throttled. */
  const [deadline, setDeadline] = useState<number | null>(null);
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [soundOn, setSoundOn] = useLocalStorage<boolean>('timer:sound', true);

  const running = deadline !== null;
  const now = useNow(running ? 100 : null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const remaining = running
    ? Math.max(0, deadline - now)
    : pausedRemaining !== null
      ? pausedRemaining
      : durationMs;

  const applyFields = useCallback(() => {
    const h = Math.max(0, Number(hours) || 0);
    const m = Math.max(0, Number(minutes) || 0);
    const s = Math.max(0, Number(seconds) || 0);
    const total = (h * 3600 + m * 60 + s) * 1000;
    setDurationMs(total);
    setPausedRemaining(null);
    setFinished(false);
    return total;
  }, [hours, minutes, seconds]);

  const start = () => {
    const base = pausedRemaining ?? (durationMs > 0 ? durationMs : applyFields());
    if (base <= 0) return;
    setFinished(false);
    setPausedRemaining(null);
    setDeadline(Date.now() + base);
  };

  const pause = () => {
    if (deadline === null) return;
    setPausedRemaining(Math.max(0, deadline - Date.now()));
    setDeadline(null);
  };

  const reset = () => {
    setDeadline(null);
    setPausedRemaining(null);
    setFinished(false);
    setDurationMs(applyFields());
  };

  // Fire once when the deadline passes.
  useEffect(() => {
    if (deadline === null || now < deadline) return;
    setDeadline(null);
    setPausedRemaining(null);
    setFinished(true);

    if (soundOn) {
      // Autoplay can be blocked until the user has interacted; they pressed
      // Start, so this is allowed — but a rejection is still not worth an error.
      audioRef.current?.play().catch(() => {});
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Timer finished', { body: 'Your countdown has reached zero.' });
    }
  }, [deadline, now, soundOn]);

  const preset = (ms: number) => {
    setDeadline(null);
    setPausedRemaining(null);
    setFinished(false);
    setDurationMs(ms);
    setHours(String(Math.floor(ms / 3_600_000)));
    setMinutes(String(Math.floor((ms % 3_600_000) / 60_000)));
    setSeconds(String(Math.floor((ms % 60_000) / 1000)));
  };

  const progress = durationMs > 0 ? 1 - remaining / durationMs : 0;

  return (
    <>
      <Card className="text-center">
        {/* The audio file ships with the app, so the alert works offline. */}
        <audio ref={audioRef} src="/audio.wav" preload="auto" />

        <div
          className={cn(
            'tabular font-mono text-[3rem] font-light leading-none tracking-tight sm:text-[4.5rem]',
            finished ? 'text-danger' : remaining <= 10_000 && running ? 'text-warning' : 'text-fg',
          )}
          role="timer"
          aria-live="off"
        >
          {formatDuration(remaining)}
        </div>

        <div className="mx-auto mt-5 h-1.5 max-w-md overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {running ? (
            <Button variant="primary" leadingIcon={<Pause />} onClick={pause}>
              Pause
            </Button>
          ) : (
            <Button variant="primary" leadingIcon={<Play />} onClick={start} disabled={remaining <= 0 && !finished}>
              {pausedRemaining !== null ? 'Resume' : 'Start'}
            </Button>
          )}
          <Button leadingIcon={<RotateCcw />} onClick={reset}>
            Reset
          </Button>
        </div>

        {finished && (
          <Callout tone="success" icon={<Bell />} className="mt-5 text-left">
            Time&apos;s up.
          </Callout>
        )}
      </Card>

      <Card>
        <CardHeader title="Set the duration" />

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Hours">
            <Input
              type="number"
              min={0}
              max={99}
              value={hours}
              onChange={(event) => setHours(event.currentTarget.value)}
              onBlur={applyFields}
              disabled={running}
            />
          </Field>
          <Field label="Minutes">
            <Input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(event) => setMinutes(event.currentTarget.value)}
              onBlur={applyFields}
              disabled={running}
            />
          </Field>
          <Field label="Seconds">
            <Input
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={(event) => setSeconds(event.currentTarget.value)}
              onBlur={applyFields}
              disabled={running}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {TIMER_PRESETS.map((item) => (
            <Button key={item.label} size="sm" onClick={() => preset(item.ms)} disabled={running}>
              {item.label}
            </Button>
          ))}
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <Switch
            checked={soundOn}
            onChange={setSoundOn}
            label="Play a sound when the timer ends"
            description="Uses a bundled audio file, so it works offline."
          />
        </div>
      </Card>
    </>
  );
}

// ─── Stopwatch ────────────────────────────────────────────────────────────

interface Lap {
  index: number;
  /** Elapsed total at the moment the lap was recorded. */
  at: number;
  /** Time since the previous lap. */
  split: number;
}

function Stopwatch() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [accumulated, setAccumulated] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);

  const running = startedAt !== null;
  // rAF rather than a 10ms interval: smoother hundredths and it pauses itself
  // when the tab is hidden.
  const frame = useAnimationFrame(running);

  const elapsed = running ? accumulated + (frame - startedAt) : accumulated;

  const start = () => setStartedAt(Date.now());

  const stop = () => {
    if (startedAt === null) return;
    setAccumulated((current) => current + (Date.now() - startedAt));
    setStartedAt(null);
  };

  const reset = () => {
    setStartedAt(null);
    setAccumulated(0);
    setLaps([]);
  };

  const recordLap = () => {
    const at = elapsed;
    setLaps((current) => {
      const previous = current[0]?.at ?? 0;
      return [{ index: current.length + 1, at, split: at - previous }, ...current];
    });
  };

  const { fastest, slowest } = useMemo(() => {
    if (laps.length < 2) return { fastest: null, slowest: null };
    const splits = laps.map((lap) => lap.split);
    return { fastest: Math.min(...splits), slowest: Math.max(...splits) };
  }, [laps]);

  return (
    <>
      <Card className="text-center">
        <div className="tabular font-mono text-[3rem] font-light leading-none tracking-tight text-fg sm:text-[4.5rem]">
          {formatDuration(elapsed, { showMs: true })}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {running ? (
            <Button variant="primary" leadingIcon={<Pause />} onClick={stop}>
              Stop
            </Button>
          ) : (
            <Button variant="primary" leadingIcon={<Play />} onClick={start}>
              {elapsed > 0 ? 'Resume' : 'Start'}
            </Button>
          )}
          <Button leadingIcon={<Flag />} onClick={recordLap} disabled={elapsed === 0}>
            Lap
          </Button>
          <Button leadingIcon={<RotateCcw />} onClick={reset} disabled={elapsed === 0 && laps.length === 0}>
            Reset
          </Button>
        </div>
      </Card>

      {laps.length > 0 && (
        <Card flush>
          <div className="p-5 pb-3">
            <CardHeader
              title="Laps"
              description={laps.length >= 2 ? 'Fastest and slowest splits are marked.' : undefined}
            />
          </div>
          <div className="px-3 pb-3">
            <DataTable
              maxHeight="20rem"
              rows={laps}
              rowKey={(lap) => String(lap.index)}
              columns={[
                { key: 'index', header: 'Lap', render: (lap) => `#${lap.index}` },
                {
                  key: 'split',
                  header: 'Split',
                  numeric: true,
                  render: (lap) => (
                    <span
                      className={cn(
                        'font-mono',
                        laps.length >= 2 && lap.split === fastest && 'font-bold text-success',
                        laps.length >= 2 && lap.split === slowest && 'font-bold text-danger',
                      )}
                    >
                      {formatDuration(lap.split, { showMs: true })}
                    </span>
                  ),
                },
                {
                  key: 'at',
                  header: 'Total',
                  numeric: true,
                  render: (lap) => (
                    <span className="font-mono text-fg-muted">{formatDuration(lap.at, { showMs: true })}</span>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}
    </>
  );
}
