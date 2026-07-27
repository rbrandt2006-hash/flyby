/**
 * Backend-backed state for the app's collections (trips, expenses, chats, ...).
 *
 * Replaces reading and writing `localStorage` directly, while keeping the same
 * shape callers already use: state in, state out.
 *
 * How it behaves:
 *
 * 1. **Instant first paint** — state initialises from the local cache, so the
 *    UI renders immediately instead of waiting on a request.
 * 2. **Server is the source of truth** — once the collection loads from the
 *    backend it replaces the cached copy.
 * 3. **Writes are debounced** — rapid edits coalesce into one save.
 * 4. **Nothing is saved before the first load finishes.** Otherwise the local
 *    cache (or a seeded default) would be written back over real server data on
 *    a fresh browser, deleting it.
 * 5. **Guests stay local** — signed-out users keep working against the cache.
 */

import { useEffect, useRef, useState } from "react";
import { backend, authedFetch } from "@/integrations/backend/client";

const SAVE_DEBOUNCE_MS = 600;

/** Read the cached value written by a previous session. */
export function readCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeCache<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode — the server copy is still authoritative */
  }
}

interface Options<T> {
  /** Endpoint path under /api, e.g. "trips". */
  endpoint: string;
  /** Key this collection uses in the request/response body. */
  payloadKey: string;
  /** localStorage key for the offline cache. */
  cacheKey: string;
  /** Value used before anything has loaded. */
  initial: T;
  /** Seed used when both the server and the cache are empty (first ever run). */
  seed?: () => T;
  /** True when the loaded value should count as "empty". */
  isEmpty?: (value: T) => boolean;
  /** Normalise whatever was loaded before it becomes state. */
  transform?: (value: T) => T;
}

/**
 * Keep one collection in sync with the backend.
 *
 * Returns the value, a setter with the same contract as `useState`, and a
 * `ready` flag that is true once the first load has settled.
 */
export function useBackendCollection<T>({
  endpoint,
  payloadKey,
  cacheKey,
  initial,
  seed,
  isEmpty,
  transform,
}: Options<T>): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(() => readCache(cacheKey, initial));
  const [ready, setReady] = useState(false);

  // Guards a save from running before the first load has completed.
  const loadedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signedIn = Boolean(backend.getCurrentSession());

  // -- load -----------------------------------------------------------------

  useEffect(() => {
    let active = true;

    const finish = (next?: T) => {
      if (!active) return;
      if (next !== undefined) setValue(transform ? transform(next) : next);
      loadedRef.current = true;
      setReady(true);
    };

    if (!signedIn) {
      // Guest: whatever is cached locally is all there is.
      const cached = readCache<T>(cacheKey, initial);
      const empty = isEmpty ? isEmpty(cached) : false;
      finish(empty && seed ? seed() : cached);
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        // authedFetch refreshes an expired token before the request and again
        // on a 401, so a stale-but-refreshable session loads instead of failing.
        const response = await authedFetch(`/api/${endpoint}`);

        if (!response.ok) {
          // A 401 that survives a refresh means the session is genuinely gone;
          // authedFetch has already cleared it and signed the user out, so this
          // just keeps the local copy. Other statuses are transient.
          if (response.status !== 401) {
            console.warn(`[sync] Could not load ${endpoint} (${response.status}); using local copy.`);
          }
          finish();
          return;
        }

        const body = await response.json();
        const incoming = body?.[payloadKey] as T | undefined;
        if (incoming === undefined) {
          finish();
          return;
        }

        const empty = isEmpty ? isEmpty(incoming) : false;
        if (empty && seed) {
          // Nothing on the server yet: seed once, then let the save below
          // persist it so the seed exists everywhere the user signs in.
          const seeded = seed();
          finish(seeded);
          return;
        }

        writeCache(cacheKey, incoming);
        finish(incoming);
      } catch (err) {
        console.warn(`[sync] Could not reach the backend for ${endpoint}:`, err);
        finish();
      }
    })();

    return () => {
      active = false;
    };
    // Re-runs when the signed-in user changes, so switching accounts reloads
    // that account's data rather than showing the previous user's.
  }, [endpoint, payloadKey, cacheKey, signedIn]);

  // -- save -----------------------------------------------------------------

  useEffect(() => {
    if (!loadedRef.current) return;

    writeCache(cacheKey, value);
    if (!signedIn) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void authedFetch(`/api/${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [payloadKey]: value }),
      }).catch((err) => {
        console.warn(`[sync] Could not save ${endpoint}:`, err);
      });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [value, endpoint, payloadKey, cacheKey, signedIn]);

  return [value, setValue, ready];
}

/** Bearer header for the current session, if there is one. */
function authHeadersFor(): Record<string, string> {
  const session = backend.getCurrentSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

/**
 * The same synchronisation for a single object rather than a list.
 *
 * Used by preferences and itineraries, which the app stores as one document.
 */
export function useBackendDocument<T>(options: Options<T>) {
  return useBackendCollection<T>(options);
}

/** Force-refresh a collection from the backend, bypassing the cache. */
export async function fetchCollection<T>(endpoint: string, payloadKey: string): Promise<T | null> {
  try {
    const response = await authedFetch(`/api/${endpoint}`);
    if (!response.ok) return null;
    const body = await response.json();
    return (body?.[payloadKey] ?? null) as T | null;
  } catch {
    return null;
  }
}

export const collectionSync = { readCache, fetchCollection };

/** Re-exported so callers can build their own requests against /api. */
export { authHeadersFor as backendAuthHeaders };
