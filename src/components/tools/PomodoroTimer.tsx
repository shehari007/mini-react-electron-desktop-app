'use client';

import { Coffee, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ProgressRing } from '@/components/charts/Charts';
import { ToolColumns } from '@/components/ToolShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, Stat } from '@/components/ui/Card';
import { Slider, Switch } from '@/components/ui/Controls';
import { Badge } from '@/components/ui/Feedback';
import { useNow } from '@/lib/hooks';
import { useLocalStorage } from '@/lib/storage';
import { cn, formatDuration, pluralize } from '@/lib/utils';

type Phase = 'focus' | 'short' | 'long';

interface Settings {
  focusMinutes: number;
  shortMinutes: number;
  longMinutes: number;
  /** Focus sessions completed before a long break. */
  roundsBeforeLong: number;
  autoStart: boolean;
  sound: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25,
  shortMinutes: 5,
  longMinutes: 15,
  roundsBeforeLong: 4,
  autoStart: false,
  sound: true,
};

/** Per-day count of completed focus sessions, keyed by ISO date. */
type DailyLog = Record<string, number>;

const PHASE_META: Record<Phase, { label: string; blurb: string }> = {
  focus: { label: 'Focus', blurb: 'One thing, no tabs.' },
  short: { label: 'Short break', blurb: 'Stand up, look away from the screen.' },
  long: { label: 'Long break', blurb: 'Properly step away.' },
};

const todayKey = () => new Date().toISOString().slice(0, 10);

export function PomodoroTimer() {
  const [settings, setSettings] = useLocalStorage<Settings>('pomodoro:settings', DEFAULT_SETTINGS, {
    validate: (value): value is Settings =>
      typeof value === 'object' && value !== null && typeof (value as Settings).focusMinutes === 'number',
  });
  const [log, setLog, logReady] = useLocalStorage<DailyLog>('pomodoro:log', {}, {
    validate: (value): value is DailyLog => typeof value === 'object' && value !== null,
  });

  const [phase, setPhase] = useState<Phase>('focus');
  const [round, setRound] = useState(1);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const phaseMs = useMemo(() => {
    const minutes =
      phase === 'focus'
        ? settings.focusMinutes
        : phase === 'short'
          ? settings.shortMinutes
          : settings.longMinutes;
    return minutes * 60_000;
  }, [phase, settings]);

  const running = deadline !== null;
  const now = useNow(running ? 250 : null);

  const remaining = running
    ? Math.max(0, deadline - now)
    : pausedRemaining !== null
      ? pausedRemaining
      : phaseMs;

  /** Move to the next phase in the cycle. `completed` marks a finished focus
   *  block, which is what increments the day's tally. */
  const advance = useCallback(
    (completed: boolean) => {
      setDeadline(null);
      setPausedRemaining(null);

      if (phase === 'focus') {
        if (completed) {
          setLog((current) => ({ ...current, [todayKey()]: (current[todayKey()] ?? 0) + 1 }));
        }
        const isLongBreak = round % settings.roundsBeforeLong === 0;
        setPhase(isLongBreak ? 'long' : 'short');
      } else {
        setPhase('focus');
        setRound((current) => current + 1);
      }
    },
    [phase, round, settings.roundsBeforeLong, setLog],
  );

  // Phase transition when the deadline passes.
  useEffect(() => {
    if (deadline === null || now < deadline) return;

    if (settings.sound) audioRef.current?.play().catch(() => {});
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`${PHASE_META[phase].label} finished`, {
        body: phase === 'focus' ? 'Take a break.' : 'Back to it.',
      });
    }

    advance(true);
  }, [deadline, now, phase, settings.sound, advance]);

  // Auto-start the next phase once the previous one has been cleared.
  useEffect(() => {
    if (!settings.autoStart || running || pausedRemaining !== null) return;
    // A phase length of zero would loop instantly.
    if (phaseMs <= 0) return;
    const timer = setTimeout(() => setDeadline(Date.now() + phaseMs), 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round]);

  const start = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
    setDeadline(Date.now() + (pausedRemaining ?? phaseMs));
    setPausedRemaining(null);
  };

  const pause = () => {
    if (deadline === null) return;
    setPausedRemaining(Math.max(0, deadline - Date.now()));
    setDeadline(null);
  };

  const resetAll = () => {
    setDeadline(null);
    setPausedRemaining(null);
    setPhase('focus');
    setRound(1);
  };

  const progress = phaseMs > 0 ? (phaseMs - remaining) / phaseMs : 0;
  const todayCount = log[todayKey()] ?? 0;

  // Last 14 days, oldest first.
  const history = useMemo(() => {
    const days: Array<{ date: string; count: number; label: string }> = [];
    for (let offset = 13; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      days.push({
        date: key,
        count: log[key] ?? 0,
        label: new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(date),
      });
    }
    return days;
  }, [log]);

  const maxCount = Math.max(1, ...history.map((day) => day.count));
  const focusMinutesToday = todayCount * settings.focusMinutes;

  return (
    <ToolColumns
      main={
        <Card className={cn('text-center', phase !== 'focus' && 'accent-glow')}>
          <audio ref={audioRef} src="/audio.wav" preload="auto" />

          <div className="flex items-center justify-center gap-2">
            <Badge tone={phase === 'focus' ? 'accent' : 'success'} icon={phase === 'focus' ? undefined : <Coffee />}>
              {PHASE_META[phase].label}
            </Badge>
            <Badge tone="neutral">
              Round {round} of {settings.roundsBeforeLong}
            </Badge>
          </div>

          <div className="mt-6 flex justify-center">
            <ProgressRing
              value={progress}
              max={1}
              size={220}
              label={formatDuration(remaining)}
              sublabel={PHASE_META[phase].blurb}
              ariaLabel={`${PHASE_META[phase].label}: ${formatDuration(remaining)} remaining`}
            />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {running ? (
              <Button variant="primary" leadingIcon={<Pause />} onClick={pause}>
                Pause
              </Button>
            ) : (
              <Button variant="primary" leadingIcon={<Play />} onClick={start}>
                {pausedRemaining !== null ? 'Resume' : 'Start'}
              </Button>
            )}
            <Button leadingIcon={<SkipForward />} onClick={() => advance(false)}>
              Skip
            </Button>
            <Button leadingIcon={<RotateCcw />} onClick={resetAll}>
              Reset
            </Button>
          </div>
        </Card>
      }
      side={
        <>
          <Card>
            <CardHeader title="Today" />
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <Stat label="Sessions" value={logReady ? todayCount : '—'} />
              <Stat
                label="Focused time"
                value={logReady ? formatDuration(focusMinutesToday * 60_000) : '—'}
                hint={`at ${settings.focusMinutes} min each`}
              />
            </div>

            {logReady && (
              <div className="mt-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                  Last 14 days
                </p>
                <div className="flex items-end justify-between gap-1" style={{ height: 64 }}>
                  {history.map((day) => (
                    <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        title={`${day.date}: ${pluralize(day.count, 'session')}`}
                        className={cn(
                          'w-full rounded-t-[3px]',
                          day.count > 0 ? 'bg-accent' : 'bg-border',
                        )}
                        style={{ height: `${Math.max(3, (day.count / maxCount) * 48)}px` }}
                      />
                      <span className="text-[9px] text-fg-subtle">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Settings" />
            <div className="mt-4 space-y-4">
              <Slider
                label="Focus length"
                value={settings.focusMinutes}
                onChange={(value) => setSettings({ ...settings, focusMinutes: value })}
                min={5}
                max={90}
                step={5}
                formatValue={(value) => `${value} min`}
                disabled={running}
              />
              <Slider
                label="Short break"
                value={settings.shortMinutes}
                onChange={(value) => setSettings({ ...settings, shortMinutes: value })}
                min={1}
                max={30}
                formatValue={(value) => `${value} min`}
                disabled={running}
              />
              <Slider
                label="Long break"
                value={settings.longMinutes}
                onChange={(value) => setSettings({ ...settings, longMinutes: value })}
                min={5}
                max={60}
                step={5}
                formatValue={(value) => `${value} min`}
                disabled={running}
              />
              <Slider
                label="Rounds before a long break"
                value={settings.roundsBeforeLong}
                onChange={(value) => setSettings({ ...settings, roundsBeforeLong: value })}
                min={2}
                max={8}
                disabled={running}
              />

              <div className="space-y-3 border-t border-border pt-4">
                <Switch
                  checked={settings.autoStart}
                  onChange={(checked) => setSettings({ ...settings, autoStart: checked })}
                  label="Start the next phase automatically"
                />
                <Switch
                  checked={settings.sound}
                  onChange={(checked) => setSettings({ ...settings, sound: checked })}
                  label="Play a sound at each transition"
                />
              </div>
            </div>
          </Card>
        </>
      }
    />
  );
}
