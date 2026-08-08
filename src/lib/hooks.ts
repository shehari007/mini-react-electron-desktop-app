'use client';

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';

import type { AppBoxBridge } from '@/types/appbox-bridge';

/**
 * Shared hooks.
 *
 * Anything that reads browser-only state goes through `useSyncExternalStore`
 * rather than `useState` + `useEffect`. That is the API built for this job: it
 * takes an explicit server snapshot (so a statically prerendered page and its
 * hydration agree), and it avoids the extra render pass that setting state from
 * an effect causes.
 */

/** Never changes, so a subscribe that does nothing is correct. */
const noopSubscribe = () => () => {};

/** True once mounted on the client; false during prerender. Use it to gate
 *  anything that would differ between the server and the browser. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** The Electron bridge, or null on the web. */
export function useElectron(): AppBoxBridge | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.appbox ?? null,
    // The prerender has no window, so the web/desktop branch is only ever
    // decided after hydration.
    () => null,
  );
}

/**
 * Online/offline state.
 *
 * `navigator.onLine` only reports whether a network interface exists, so it can
 * claim "online" behind a captive portal. Tools treat it as a hint for messaging,
 * never as a reason to skip a request — a failed fetch is the real signal.
 */
export function useOnline(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener('online', onChange);
    window.addEventListener('offline', onChange);
    return () => {
      window.removeEventListener('online', onChange);
      window.removeEventListener('offline', onChange);
    };
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}

/** Media query state. Returns false during prerender. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * A ticking "now", as a millisecond timestamp.
 *
 * Each tick reads the system clock rather than incrementing a counter, so clocks
 * stay correct after the tab is backgrounded (where timers are throttled) or the
 * machine sleeps. Pass `null` to stop ticking.
 *
 * Returns 0 during prerender — callers gate on `useMounted` before formatting a
 * time, since a server-rendered clock would mismatch on hydration anyway.
 */
export function useNow(intervalMs: number | null = 1000): number {
  // Held outside React so the snapshot is stable between ticks; returning a
  // fresh Date.now() on every read would make useSyncExternalStore loop.
  const nowRef = useRef(0);

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (intervalMs === null) return () => {};

      nowRef.current = Date.now();
      onChange();

      const timer = setInterval(() => {
        nowRef.current = Date.now();
        onChange();
      }, intervalMs);

      return () => clearInterval(timer);
    },
    [intervalMs],
  );

  return useSyncExternalStore(
    subscribe,
    () => nowRef.current,
    () => 0,
  );
}

/**
 * A timestamp that updates every animation frame while `active`.
 *
 * Used for the stopwatch's hundredths: smoother than a 10ms interval, and the
 * browser pauses it automatically when the tab is hidden.
 */
export function useAnimationFrame(active: boolean): number {
  const tickRef = useRef(0);

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!active) return () => {};

      let frame = 0;
      const loop = () => {
        tickRef.current = Date.now();
        onChange();
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(frame);
    },
    [active],
  );

  return useSyncExternalStore(
    subscribe,
    () => tickRef.current,
    () => 0,
  );
}

/** Debounce a rapidly changing value — used for regex/diff/search inputs where
 *  recomputing on every keystroke would drop frames. */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export interface HotkeyOptions {
  ctrlOrMeta?: boolean;
  shift?: boolean;
  alt?: boolean;
  /** By default hotkeys are ignored while typing; set true for keys like Escape
   *  that should still fire inside a field. */
  allowInInput?: boolean;
  enabled?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/**
 * Bind a keyboard shortcut for as long as the component is mounted.
 *
 * `ctrlOrMeta` matches Cmd on macOS and Ctrl elsewhere, which is what users
 * expect from a shortcut like ⌘K without the caller branching on platform.
 */
export function useHotkey(key: string, handler: (event: KeyboardEvent) => void, options: HotkeyOptions = {}): void {
  const { ctrlOrMeta = false, shift = false, alt = false, allowInInput = false, enabled = true } = options;

  // Written in an effect rather than during render: mutating a ref while
  // rendering is not safe under concurrent rendering.
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (ctrlOrMeta !== (event.ctrlKey || event.metaKey)) return;
      if (shift !== event.shiftKey) return;
      if (alt !== event.altKey) return;
      if (!allowInInput && isTypingTarget(event.target)) return;

      handlerRef.current(event);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, ctrlOrMeta, shift, alt, allowInInput, enabled]);
}

/** Run a callback on Escape or on a click outside the element. Backs the
 *  command palette, dropdowns and modals. */
export function useDismiss<T extends HTMLElement>(onDismiss: () => void, active = true) {
  const ref = useRef<T | null>(null);

  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!active) return;

    const onPointerDown = (event: PointerEvent) => {
      const node = ref.current;
      if (node && event.target instanceof Node && !node.contains(event.target)) {
        onDismissRef.current();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onDismissRef.current();
      }
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [active]);

  return ref;
}

/** Transient "Copied!" style flag that resets itself. */
export function useTimedFlag(durationMs = 1600): [boolean, () => void] {
  const [active, setActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const trigger = useCallback(() => {
    setActive(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActive(false), durationMs);
  }, [durationMs]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return [active, trigger];
}

/**
 * Lock body scroll while an overlay is open, compensating for the scrollbar's
 * width so the page behind doesn't shift sideways as it disappears.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [active]);
}

/**
 * A stable id for aria attributes. Delegates to React's useId, which produces
 * the same value on the server and the client — a random suffix here would
 * mismatch on hydration.
 */
export function usePrefixedId(prefix: string): string {
  return `${prefix}${useId()}`;
}
