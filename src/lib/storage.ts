'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Local persistence.
 *
 * Every tool that remembers something (todos, notes, world-clock cities, cached
 * rates) goes through here. Keys are namespaced so AppBox never collides with
 * anything else on the origin, and reads are defensive: a value written by an
 * older version, hand-edited in devtools, or truncated by a full disk must not
 * take the page down.
 */

const PREFIX = 'appbox:';

const namespaced = (key: string) => (key.startsWith(PREFIX) ? key : PREFIX + key);

function isAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage != null;
  } catch {
    // Accessing localStorage throws outright when cookies are blocked.
    return false;
  }
}

export function readStored<T>(key: string, fallback: T, validate?: (value: unknown) => value is T): T {
  if (!isAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(namespaced(key));
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function writeStored<T>(key: string, value: T): boolean {
  if (!isAvailable()) return false;
  try {
    window.localStorage.setItem(namespaced(key), JSON.stringify(value));
    return true;
  } catch {
    // Almost always QuotaExceededError (private browsing, or a large image
    // cached by the image tool). Failing to persist is recoverable; throwing
    // mid-render is not.
    return false;
  }
}

export function removeStored(key: string): void {
  if (!isAvailable()) return;
  try {
    window.localStorage.removeItem(namespaced(key));
  } catch {
    /* ignore */
  }
}

/** Remove every AppBox key — backs the "clear all data" action in Settings. */
export function clearAllStored(): void {
  if (!isAvailable()) return;
  try {
    const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(PREFIX));
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export interface UseLocalStorageOptions<T> {
  /** Rejects stored values that don't match the current shape, falling back to
   *  the initial value instead of feeding malformed data into the UI. */
  validate?: (value: unknown) => value is T;
}

/**
 * State that persists to localStorage.
 *
 * Returns `hydrated` because this app is statically prerendered: the first paint
 * must render `initial` on both server and client or React logs a hydration
 * mismatch. Components that would visibly flicker (a todo list flashing empty)
 * should hold off on rendering their body until `hydrated` is true.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
  options: UseLocalStorageOptions<T> = {},
): [T, (value: T | ((previous: T) => T)) => void, boolean] {
  const { validate } = options;

  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  // Held in refs so the storage-event listener and the setter don't need to be
  // re-created when these change identity. Assigned in an effect rather than
  // during render, which is not safe under concurrent rendering.
  const validateRef = useRef(validate);
  useEffect(() => {
    validateRef.current = validate;
  }, [validate]);

  const initialRef = useRef(initial);

  useEffect(() => {
    setValue(readStored(key, initialRef.current, validateRef.current));
    setHydrated(true);
  }, [key]);

  const update = useCallback(
    (next: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(previous) : next;
        writeStored(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  // Keep duplicate tabs (and two AppBox windows) consistent. `storage` fires
  // only in *other* documents, so this can't loop back on our own writes.
  useEffect(() => {
    if (!isAvailable()) return;
    const fullKey = namespaced(key);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== fullKey) return;
      if (event.newValue === null) {
        setValue(initialRef.current);
        return;
      }
      try {
        const parsed: unknown = JSON.parse(event.newValue);
        if (validateRef.current && !validateRef.current(parsed)) return;
        setValue(parsed as T);
      } catch {
        /* ignore malformed cross-tab writes */
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, update, hydrated];
}
