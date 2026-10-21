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
 * 6. **A change is never lost by leaving the page.** This is the one that
 *    matters most, because the app's most important write — recording a trip
 *    that has just been paid for — is immediately followed by navigating away:
 *
 *      - every change is written to the local cache at the moment it is made,
 *        not later in an effect that never runs if the component unmounts in
 *        the same update;
 *      - a save that is still waiting out its debounce when the component
 *        unmounts is sent then, rather than cancelled;
 *      - the next page waits for that save to land before it loads, so it
 *        can't read the server's older copy and paint over the newer one;
 *      - a change that still hasn't reached the server (the tab was closed,
 *        the save failed) is marked, and pushed on the next load instead of
 *        being replaced by the server copy.
 *
 *    Before this, booking a flight and landing on Trips could leave the new
 *    trip in neither place: the save was cancelled on the way out, and the
 *    Trips page then loaded a server copy that didn't have it.
 */

import { useCallback, useEffect, useRef, useState } from "react";
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

// ---------------------------------------------------------------------------
// Unsaved-change tracking
// ---------------------------------------------------------------------------

/** Saves currently in flight, per endpoint. A fresh load waits for these. */
const pendingSaves = new Map<string, Promise<void>>();

const unsavedKey = (cacheKey: string) => `${cacheKey}::unsaved`;

function currentUserId(): string | null {
  return backend.getCurrentSession()?.user?.id ?? null;
}

/**
 * Record that the cache holds a change the server doesn't have yet.
 *
 * The marker names the user it belongs to: the cache is shared by whoever signs
 * in on this browser, and one person's unsaved trips must never be pushed into
 * another person's account.
 */
function markUnsaved(cacheKey: string): string | null {
  const userId = currentUserId();
  if (!userId) return null;
  const token = `${userId}|${Date.now()}|${Math.random().toString(36).slice(2, 8)}`;
  try {
    localStorage.setItem(unsavedKey(cacheKey), token);
  } catch {
    /* storage unavailable — the in-memory flush on unmount still applies */
  }
  return token;
}

function readUnsavedToken(cacheKey: string): string | null {
  try {
    return localStorage.getItem(unsavedKey(cacheKey));
  } catch {
    return null;
  }
}

/** Clear the marker — but only if nothing newer has been marked since. */
function clearUnsaved(cacheKey: string, token: string | null) {
  try {
    if (token && localStorage.getItem(unsavedKey(cacheKey)) === token) {
      localStorage.removeItem(unsavedKey(cacheKey));
    }
  } catch {
    /* ignore */
  }
}

function hasUnsavedFor(cacheKey: string, userId: string | null): boolean {
  const token = readUnsavedToken(cacheKey);
  return Boolean(userId && token && token.startsWith(`${userId}|`));
}

/** Drop a marker left by a different user; the cache no longer holds their data. */
function dropForeignMarker(cacheKey: string, userId: string | null) {
  const token = readUnsavedToken(cacheKey);
  if (token && !(userId && token.startsWith(`${userId}|`))) {
    try {
      localStorage.removeItem(unsavedKey(cacheKey));
    } catch {
      /* ignore */
    }
  }
}

/** Send a collection to the server, tracking the request so loads can wait on it. */
function pushToServer<T>(endpoint: string, payloadKey: string, cacheKey: string, value: T): Promise<void> {
  // Whatever is marked unsaved right now is what this request carries.
  const token = readUnsavedToken(cacheKey);
  const request: Promise<void> = authedFetch(`/api/${endpoint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [payloadKey]: value }),
  })
    .then((response) => {
      if (response.ok) clearUnsaved(cacheKey, token);
      else console.warn(`[sync] Could not save ${endpoint} (${response.status}); it will be retried.`);
    })
    .catch((err) => {
      console.warn(`[sync] Could not save ${endpoint}:`, err);
    })
    .finally(() => {
      if (pendingSaves.get(endpoint) === request) pendingSaves.delete(endpoint);
    });
  pendingSaves.set(endpoint, request);
  return request;
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
  const [value, setValueState] = useState<T>(() => readCache(cacheKey, initial));
  const [ready, setReady] = useState(false);

  // Guards a save from running before the first load has completed.
  const loadedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signedIn = Boolean(backend.getCurrentSession());

  // The newest value, including updates React hasn't rendered yet — or never
  // will, if the component unmounts in the same update that made them.
  const latestRef = useRef<T>(value);
  const mountedRef = useRef(true);
  // This instance made a change that hasn't been sent to the server yet.
  const ownUnsavedRef = useRef(false);
  // Changes made before the first load finished; re-applied on top of what loads.
  const queuedRef = useRef<Array<React.SetStateAction<T>>>([]);

  /**
   * The setter callers use. Same contract as `useState`'s, but the change is
   * made durable here, synchronously: applied to the newest value, written to
   * the cache and marked unsaved — before React has rendered anything. An
   * effect is too late for that when the caller navigates away right after.
   */
  const setValue = useCallback<React.Dispatch<React.SetStateAction<T>>>((update) => {
    // An update arriving after unmount (a late async result) is dropped: this
    // instance's copy may be stale by now, and writing it would overwrite newer
    // changes made on the page the traveler moved to.
    if (!mountedRef.current) return;

    const next = typeof update === "function"
      ? (update as (previous: T) => T)(latestRef.current)
      : update;
    latestRef.current = next;

    if (!loadedRef.current) {
      queuedRef.current.push(update);
    } else {
      writeCache(cacheKey, next);
      if (backend.getCurrentSession()) {
        markUnsaved(cacheKey);
        ownUnsavedRef.current = true;
      }
    }
    setValueState(next);
  }, [cacheKey]);

  // -- load -----------------------------------------------------------------

  useEffect(() => {
    let active = true;

    /**
     * Settle the first load. `next` is what should become the value (undefined
     * keeps the cached copy); `fromLocal` means it is a local copy that still
     * has to be pushed, rather than something the server just told us.
     */
    const finish = (next?: T, fromLocal = false) => {
      if (!active) return;
      let settled = next !== undefined ? (transform ? transform(next) : next) : latestRef.current;

      // Anything the user did before the load finished goes on top.
      const queued = queuedRef.current;
      queuedRef.current = [];
      const hadQueued = queued.length > 0;
      // When nothing loaded, `settled` is already the newest local value and
      // includes them; only a freshly loaded copy needs them re-applied.
      if (hadQueued && next !== undefined) {
        for (const update of queued) {
          settled = typeof update === "function"
            ? (update as (previous: T) => T)(settled)
            : update;
        }
      }

      latestRef.current = settled;
      loadedRef.current = true;
      if (hadQueued || fromLocal) {
        writeCache(cacheKey, settled);
        if (backend.getCurrentSession()) {
          markUnsaved(cacheKey);
          ownUnsavedRef.current = true;
        }
      }
      setValueState(settled);
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
        // A save started by the page just left must land first. Otherwise this
        // reads the server's older copy and paints over the newer local one.
        const inFlight = pendingSaves.get(endpoint);
        if (inFlight) await inFlight;
        if (!active) return;

        const userId = currentUserId();

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

        // This user's cache holds changes that never reached the server — the
        // tab was closed mid-save, or a save failed. Keep them and push them:
        // losing the record of a booking is far worse than a stale read.
        if (hasUnsavedFor(cacheKey, userId)) {
          finish(readCache<T>(cacheKey, incoming), true);
          return;
        }
        dropForeignMarker(cacheKey, userId);

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
      saveTimer.current = null;
      ownUnsavedRef.current = false;
      void pushToServer(endpoint, payloadKey, cacheKey, value);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = null;
    };
  }, [value, endpoint, payloadKey, cacheKey, signedIn]);

  // -- leave ----------------------------------------------------------------

  // When the component goes away with a change still unsent — its debounce
  // hadn't fired, or the change was made in the very update that unmounted it —
  // send it now. Cancelling it here is what used to lose a just-booked trip.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (ownUnsavedRef.current && backend.getCurrentSession()) {
        ownUnsavedRef.current = false;
        void pushToServer(endpoint, payloadKey, cacheKey, latestRef.current);
      }
    };
  }, [endpoint, payloadKey, cacheKey]);

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
