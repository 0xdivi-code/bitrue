/**
 * Tiny TTL cache with localStorage persistence for market snapshots.
 * Keeps the last successful payload so the UI can show a clearly-labelled
 * stale value while the network is unavailable.
 */

export interface CacheEntry<T> {
  value: T;
  fetchedAt: number;
  source: string;
}

const memory = new Map<string, CacheEntry<unknown>>();

const PREFIX = 'bityaris.cache.';

export function cacheGet<T>(key: string, maxAgeMs: number): { entry: CacheEntry<T>; stale: boolean } | null {
  const mem = memory.get(key) as CacheEntry<T> | undefined;
  const entry = mem ?? readStorage<T>(key);
  if (!entry) return null;
  if (mem == null) memory.set(key, entry);
  return { entry, stale: Date.now() - entry.fetchedAt > maxAgeMs };
}

export function cacheSet<T>(key: string, value: T, source: string): CacheEntry<T> {
  const entry: CacheEntry<T> = { value, fetchedAt: Date.now(), source };
  memory.set(key, entry);
  writeStorage(key, entry);
  return entry;
}

export function cacheAge(key: string): number | null {
  const entry = memory.get(key) ?? readStorage(key);
  return entry ? Date.now() - entry.fetchedAt : null;
}

function readStorage<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function writeStorage<T>(key: string, entry: CacheEntry<T>): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    /* storage unavailable (private mode) — memory cache still works */
  }
}

export function cacheClear(): void {
  memory.clear();
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* noop */
  }
}
