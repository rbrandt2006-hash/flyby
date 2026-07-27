/**
 * Flyby backend client.
 *
 * A single object that talks to the Flask backend, exposing the surface the app
 * already uses:
 *
 *   backend.auth        sign-up / sign-in / session, with silent token refresh
 *   backend.from(table) chained queries: select / insert / update / upsert / delete
 *   backend.rpc(name)   server-side functions
 *   backend.functions   named service endpoints (2FA, travel search, transcribe)
 *   backend.storage     avatar and receipt uploads
 *   backend.channel     live updates
 *
 * Requests go to the same origin by default, so the Vite dev server proxies
 * `/auth`, `/rest`, `/api`, `/functions` and `/storage` to the backend on
 * :8659 and there is no CORS setup in development. Point `VITE_API_URL` at the
 * backend to run the two on separate hosts.
 *
 * The access token is short-lived. Rather than making every caller think about
 * that, a request that comes back "token expired" refreshes once and replays
 * itself; only if the refresh also fails is the session cleared.
 */

import type {
  AuthChangeEvent,
  BackendError,
  BackendResult,
  BackendSession,
  BackendUser,
} from "./types";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const SESSION_KEY = "flyby.auth.session";

/** Refresh this many seconds before the token actually expires. */
const REFRESH_SKEW_SECONDS = 60;

// ---------------------------------------------------------------------------
// Session storage
// ---------------------------------------------------------------------------

let currentSession: BackendSession | null = null;
let refreshPromise: Promise<BackendSession | null> | null = null;

type AuthListener = (event: AuthChangeEvent, session: BackendSession | null) => void;
const listeners = new Set<AuthListener>();

function readStoredSession(): BackendSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BackendSession;
    if (!parsed?.access_token || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(session: BackendSession | null) {
  currentSession = session;
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable (private mode) — the in-memory session still works */
  }
}

function emit(event: AuthChangeEvent, session: BackendSession | null) {
  listeners.forEach((listener) => {
    try {
      listener(event, session);
    } catch (err) {
      console.error("[auth] listener failed:", err);
    }
  });
}

// Restore the session synchronously so the first render already knows whether
// someone is signed in.
currentSession = readStoredSession();

function isExpired(session: BackendSession | null): boolean {
  if (!session?.expires_at) return false;
  return Date.now() / 1000 >= session.expires_at - REFRESH_SKEW_SECONDS;
}

// ---------------------------------------------------------------------------
// Fetch plumbing
// ---------------------------------------------------------------------------

function toError(message: string, extra: Partial<BackendError> = {}): BackendError {
  return { message, ...extra };
}

async function parseBody(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

/** Exchange the refresh token for a new session. Concurrent callers share one request. */
async function refreshSession(): Promise<BackendSession | null> {
  if (refreshPromise) return refreshPromise;

  const token = currentSession?.refresh_token;
  if (!token) return null;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: token }),
      });
      const body = await parseBody(response);
      if (!response.ok || !body?.access_token) {
        writeStoredSession(null);
        emit("SIGNED_OUT", null);
        return null;
      }
      writeStoredSession(body as BackendSession);
      emit("TOKEN_REFRESHED", body as BackendSession);
      return body as BackendSession;
    } catch {
      // A network blip should not sign the user out; keep the session and let
      // the caller surface the failure.
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** Send the access token (default true). */
  auth?: boolean;
  /** Send the body as-is instead of JSON-encoding it. */
  raw?: boolean;
  signal?: AbortSignal;
}

/**
 * Make a request to the backend.
 *
 * Refreshes a stale token before sending, and retries once if the backend
 * still reports the token as expired.
 */
async function request(path: string, options: RequestOptions = {}): Promise<{ ok: boolean; status: number; body: any }> {
  const { method = "GET", body, headers = {}, auth = true, raw = false, signal } = options;

  if (auth && isExpired(currentSession)) {
    await refreshSession();
  }

  const send = async (): Promise<{ ok: boolean; status: number; body: any }> => {
    const finalHeaders: Record<string, string> = { ...headers };
    if (!raw && body !== undefined) finalHeaders["Content-Type"] = "application/json";
    if (auth && currentSession?.access_token) {
      finalHeaders.Authorization = `Bearer ${currentSession.access_token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : raw ? (body as BodyInit) : JSON.stringify(body),
      signal,
    });

    return { ok: response.ok, status: response.status, body: await parseBody(response) };
  };

  let result = await send();

  if (result.status === 401 && auth && currentSession?.refresh_token) {
    const refreshed = await refreshSession();
    if (refreshed) result = await send();
  }

  return result;
}

/**
 * True when a failure is just "nobody is signed in".
 *
 * Signed-out and guest browsing are normal states, not faults, so callers use
 * this to fall back quietly instead of logging an error the user can't act on.
 */
export function isUnauthenticated(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { code, status } = error as { code?: string; status?: number };
  return code === "unauthenticated" || status === 401;
}

/** The URL of a backend path — for callers that need to fetch directly. */
export function backendUrl(path: string): string {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Auth headers for a direct fetch (file uploads, streamed responses). */
export function authHeaders(): Record<string, string> {
  return currentSession?.access_token
    ? { Authorization: `Bearer ${currentSession.access_token}` }
    : {};
}

/**
 * A `fetch` that carries the session and keeps it alive — for the direct-fetch
 * call sites (collection sync, file uploads, streamed endpoints) that don't go
 * through the query builder.
 *
 * It does what the query builder already does: refresh the token before it's
 * used if it's expired, and on a 401 refresh once and retry. If the refresh
 * itself fails the session is cleared and `SIGNED_OUT` fires (handled inside
 * `refreshSession`), so a dead session bounces the user to sign-in instead of
 * looping 401s. Without this, an expired access token made these endpoints fail
 * forever even though a valid refresh token was sitting right there.
 */
export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (isExpired(currentSession)) {
    await refreshSession();
  }

  const send = () =>
    fetch(backendUrl(path), {
      ...init,
      headers: { ...(init.headers as Record<string, string> | undefined), ...authHeaders() },
    });

  let response = await send();
  if (response.status === 401 && currentSession?.refresh_token) {
    const refreshed = await refreshSession();
    if (refreshed) response = await send();
  }
  return response;
}

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------

type Operation = "select" | "insert" | "update" | "upsert" | "delete";

interface Filter {
  column: string;
  op: string;
  value: unknown;
}

/**
 * A chained query against one table.
 *
 * The chain is collected and sent as a single request when the builder is
 * awaited, so `.select().eq().order().limit()` is one round trip.
 */
class QueryBuilder<T = any> implements PromiseLike<BackendResult<T>> {
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean }[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private singleMode?: "one" | "maybe";
  private wantsCount = false;
  private rows?: unknown;
  private values?: unknown;
  private conflictTarget?: string;

  constructor(private table: string, private operation: Operation = "select") {}

  // -- shaping --------------------------------------------------------------

  /**
   * Choose what comes back.
   *
   * The column list is accepted for readability at the call site — the backend
   * returns the whole row and the app picks what it needs. The options are
   * honoured: `count` asks for the total number of matching rows, and `head`
   * asks for that total *without* the rows themselves.
   */
  select(_columns?: string, options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }): this {
    if (options?.count) this.wantsCount = true;
    if (options?.head) this.limitValue = 0;
    return this;
  }

  // -- filters --------------------------------------------------------------

  private addFilter(column: string, op: string, value: unknown): this {
    this.filters.push({ column, op, value });
    return this;
  }

  eq(column: string, value: unknown) { return this.addFilter(column, "eq", value); }
  neq(column: string, value: unknown) { return this.addFilter(column, "neq", value); }
  gt(column: string, value: unknown) { return this.addFilter(column, "gt", value); }
  gte(column: string, value: unknown) { return this.addFilter(column, "gte", value); }
  lt(column: string, value: unknown) { return this.addFilter(column, "lt", value); }
  lte(column: string, value: unknown) { return this.addFilter(column, "lte", value); }
  like(column: string, value: string) { return this.addFilter(column, "like", value); }
  ilike(column: string, value: string) { return this.addFilter(column, "ilike", value); }
  is(column: string, value: unknown) { return this.addFilter(column, "is", value); }
  in(column: string, values: unknown[]) { return this.addFilter(column, "in", values); }
  contains(column: string, value: unknown) { return this.addFilter(column, "contains", value); }

  match(criteria: Record<string, unknown>): this {
    Object.entries(criteria).forEach(([column, value]) => this.addFilter(column, "eq", value));
    return this;
  }

  // -- ordering / paging ----------------------------------------------------

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderBy.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number): this {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single(): this {
    this.singleMode = "one";
    return this;
  }

  maybeSingle(): this {
    this.singleMode = "maybe";
    return this;
  }

  count(): this {
    this.wantsCount = true;
    return this;
  }

  // -- writes ---------------------------------------------------------------

  insert(rows: unknown): QueryBuilder<T> {
    this.operation = "insert";
    this.rows = rows;
    return this;
  }

  update(values: unknown): QueryBuilder<T> {
    this.operation = "update";
    this.values = values;
    return this;
  }

  upsert(rows: unknown, options?: { onConflict?: string }): QueryBuilder<T> {
    this.operation = "upsert";
    this.rows = rows;
    this.conflictTarget = options?.onConflict;
    return this;
  }

  delete(): QueryBuilder<T> {
    this.operation = "delete";
    return this;
  }

  // -- execution ------------------------------------------------------------

  private buildPayload(): Record<string, unknown> {
    switch (this.operation) {
      case "insert":
        return { rows: this.rows };
      case "upsert":
        return { rows: this.rows, on_conflict: this.conflictTarget };
      case "update":
        return { values: this.values, filters: this.filters };
      case "delete":
        return { filters: this.filters };
      default:
        return {
          filters: this.filters,
          order: this.orderBy,
          limit: this.limitValue,
          offset: this.offsetValue,
          single: this.singleMode,
          count: this.wantsCount,
        };
    }
  }

  private async execute(): Promise<BackendResult<T>> {
    // Every table is scoped to the signed-in user, so without a session this
    // request can only come back 401. Answering locally keeps guests (and the
    // moment right after sign-out) from firing requests that are certain to
    // fail — which is what filled the console and the server log with 401s.
    if (!currentSession) {
      return {
        data: null as T,
        error: toError("Not signed in.", { code: "unauthenticated", status: 401 }),
      };
    }

    try {
      const result = await request(`/rest/v1/${this.table}/${this.operation}`, {
        method: "POST",
        body: this.buildPayload(),
      });

      if (!result.ok) {
        const message =
          result.body?.error?.message ??
          result.body?.message ??
          `Request failed (${result.status})`;
        return {
          data: null as T,
          error: toError(message, { code: result.body?.error?.code, status: result.status }),
        };
      }

      return {
        data: result.body?.data as T,
        error: result.body?.error ?? null,
        count: result.body?.count ?? null,
      };
    } catch (err: any) {
      if (err?.name === "AbortError") throw err;
      return {
        data: null as T,
        error: toError(
          "Couldn't reach the Flyby backend. Make sure it's running on port 8659.",
        ),
      };
    }
  }

  then<R1 = BackendResult<T>, R2 = never>(
    onfulfilled?: ((value: BackendResult<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const auth = {
  async getSession(): Promise<BackendResult<{ session: BackendSession | null }>> {
    if (currentSession && isExpired(currentSession)) {
      await refreshSession();
    }
    return { data: { session: currentSession }, error: null };
  },

  async getUser(): Promise<BackendResult<{ user: BackendUser | null }>> {
    if (!currentSession) return { data: { user: null }, error: null };
    return { data: { user: currentSession.user }, error: null };
  },

  /**
   * Subscribe to sign-in / sign-out / refresh.
   *
   * The current state is delivered asynchronously on subscribe, so a component
   * that mounts after sign-in still learns about the session.
   */
  onAuthStateChange(callback: AuthListener) {
    listeners.add(callback);
    queueMicrotask(() => callback("INITIAL_SESSION", currentSession));
    return {
      data: {
        subscription: {
          unsubscribe() {
            listeners.delete(callback);
          },
        },
      },
    };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const result = await request("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email, password },
      auth: false,
    });

    if (!result.ok) {
      return {
        data: { user: null, session: null },
        error: toError(
          result.body?.error_description ?? result.body?.message ?? "Invalid login credentials.",
          { status: result.status },
        ),
      };
    }

    writeStoredSession(result.body as BackendSession);
    emit("SIGNED_IN", currentSession);
    return { data: { user: currentSession!.user, session: currentSession }, error: null };
  },

  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: { data?: Record<string, unknown>; emailRedirectTo?: string };
  }) {
    const result = await request("/auth/v1/signup", {
      method: "POST",
      body: { email, password, data: options?.data ?? {} },
      auth: false,
    });

    if (!result.ok) {
      return {
        data: { user: null, session: null },
        error: toError(
          result.body?.error_description ?? result.body?.message ?? "Could not create the account.",
          { status: result.status },
        ),
      };
    }

    writeStoredSession(result.body as BackendSession);
    emit("SIGNED_IN", currentSession);
    return { data: { user: currentSession!.user, session: currentSession }, error: null };
  },

  async signOut() {
    try {
      await request("/auth/v1/logout", { method: "POST" });
    } catch {
      /* signing out locally matters more than reaching the server */
    }
    writeStoredSession(null);
    emit("SIGNED_OUT", null);
    return { error: null };
  },

  async updateUser(attributes: {
    password?: string;
    email?: string;
    data?: Record<string, unknown>;
    current_password?: string;
  }) {
    const result = await request("/auth/v1/user", { method: "PUT", body: attributes });

    if (!result.ok) {
      return {
        data: { user: null },
        error: toError(
          result.body?.error_description ?? result.body?.message ?? "Could not save your changes.",
          { status: result.status },
        ),
      };
    }

    if (currentSession) {
      writeStoredSession({ ...currentSession, user: result.body as BackendUser });
      emit("USER_UPDATED", currentSession);
    }
    return { data: { user: result.body as BackendUser }, error: null };
  },

  async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
    const result = await request("/auth/v1/recover", {
      method: "POST",
      body: { email, redirect_to: options?.redirectTo },
      auth: false,
    });

    if (!result.ok) {
      return { data: null, error: toError(result.body?.message ?? "Could not send the reset email.") };
    }
    return { data: result.body, error: null };
  },

  /** Exchange a recovery token from a reset link for a session. */
  async verifyRecoveryToken(token: string) {
    const result = await request("/auth/v1/verify", {
      method: "POST",
      body: { token },
      auth: false,
    });

    if (!result.ok) {
      return { data: null, error: toError(result.body?.message ?? "This reset link is invalid or has expired.") };
    }

    writeStoredSession(result.body as BackendSession);
    emit("SIGNED_IN", currentSession);
    return { data: result.body, error: null };
  },
};

// ---------------------------------------------------------------------------
// Service endpoints
// ---------------------------------------------------------------------------

const functions = {
  async invoke<T = any>(
    name: string,
    options?: { body?: unknown; headers?: Record<string, string> },
  ): Promise<BackendResult<T>> {
    try {
      const result = await request(`/functions/v1/${name}`, {
        method: "POST",
        body: options?.body ?? {},
        headers: options?.headers,
      });

      if (!result.ok) {
        return {
          data: null as T,
          error: toError(
            result.body?.error ?? result.body?.message ?? `${name} failed (${result.status})`,
            { status: result.status },
          ),
        };
      }
      return { data: result.body as T, error: null };
    } catch {
      return {
        data: null as T,
        error: toError("Couldn't reach the Flyby backend. Make sure it's running on port 8659."),
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

function storageBucket(bucket: string) {
  return {
    async upload(path: string, file: Blob | File, options?: { upsert?: boolean; contentType?: string }) {
      try {
        const response = await fetch(backendUrl(`/storage/v1/object/${bucket}/${path}`), {
          method: "POST",
          headers: {
            ...authHeaders(),
            "Content-Type": options?.contentType || (file as File).type || "application/octet-stream",
          },
          body: file,
        });
        const body = await parseBody(response);
        if (!response.ok) {
          return { data: null, error: toError(body?.error?.message ?? "Upload failed.") };
        }
        return { data: body, error: null };
      } catch {
        return { data: null, error: toError("Couldn't reach the Flyby backend to upload the file.") };
      }
    },

    getPublicUrl(path: string) {
      return { data: { publicUrl: backendUrl(`/storage/v1/object/public/${bucket}/${path}`) } };
    },

    async remove(paths: string[]) {
      const result = await request(`/storage/v1/object/${bucket}`, {
        method: "DELETE",
        body: { prefixes: paths },
      });
      return {
        data: result.body?.data ?? null,
        error: result.ok ? null : toError(result.body?.error?.message ?? "Delete failed."),
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Live updates
// ---------------------------------------------------------------------------

/**
 * A lightweight channel for live updates.
 *
 * The backend is a plain Flask app with no realtime transport, so a channel
 * polls the table it watches and reports rows that changed. Components that
 * subscribe get the same "here is the new row" callback either way, and the
 * poll stops as soon as the channel is removed.
 */
function createChannel(name: string) {
  let timer: ReturnType<typeof setInterval> | null = null;
  const watchers: {
    table: string;
    filterColumn?: string;
    filterValue?: string;
    callback: (payload: { new: any; old: any; eventType: string }) => void;
    lastSeen: string | null;
  }[] = [];

  const channel = {
    name,

    on(
      _event: string,
      config: { event?: string; schema?: string; table?: string; filter?: string },
      callback: (payload: any) => void,
    ) {
      const [filterColumn, rawValue] = (config.filter ?? "").split("=eq.");
      watchers.push({
        table: config.table ?? "",
        filterColumn: filterColumn || undefined,
        filterValue: rawValue || undefined,
        callback,
        lastSeen: null,
      });
      return channel;
    },

    subscribe(callback?: (status: string) => void) {
      const poll = async () => {
        // Nothing to watch without a session — and polling anyway would 401 on
        // a loop forever. Stop the timer rather than just skipping, so a signed
        // out (or guest) session doesn't leave a live interval behind.
        if (!currentSession) {
          if (timer) clearInterval(timer);
          timer = null;
          return;
        }

        for (const watcher of watchers) {
          if (!watcher.table) continue;
          const query = new QueryBuilder<any[]>(watcher.table);
          if (watcher.filterColumn && watcher.filterValue) {
            query.eq(watcher.filterColumn, watcher.filterValue);
          }
          const { data, error } = await query;
          if (error || !Array.isArray(data)) continue;

          for (const row of data) {
            const stamp = row?.updated_at ?? row?.created_at ?? null;
            if (stamp && watcher.lastSeen && stamp > watcher.lastSeen) {
              watcher.callback({ new: row, old: null, eventType: "UPDATE" });
            }
            if (!watcher.lastSeen || (stamp && stamp > watcher.lastSeen)) {
              watcher.lastSeen = stamp;
            }
          }
        }
      };

      void poll();
      timer = setInterval(poll, 20_000);
      callback?.("SUBSCRIBED");
      return channel;
    },

    unsubscribe() {
      if (timer) clearInterval(timer);
      timer = null;
      return Promise.resolve("ok");
    },
  };

  return channel;
}

// ---------------------------------------------------------------------------
// The client
// ---------------------------------------------------------------------------

export const backend = {
  auth,
  functions,

  from<T = any>(table: string) {
    return new QueryBuilder<T>(table);
  },

  async rpc<T = any>(name: string, args?: Record<string, unknown>): Promise<BackendResult<T>> {
    // Server-side functions all answer for the signed-in user, so like table
    // queries they are pointless without a session.
    if (!currentSession) {
      return {
        data: null as T,
        error: toError("Not signed in.", { code: "unauthenticated", status: 401 }),
      };
    }

    const result = await request(`/rest/v1/rpc/${name}`, { method: "POST", body: args ?? {} });
    if (!result.ok) {
      return {
        data: null as T,
        error: toError(result.body?.error?.message ?? `${name} failed`, { status: result.status }),
      };
    }
    return { data: result.body?.data as T, error: result.body?.error ?? null };
  },

  storage: {
    from: storageBucket,
  },

  channel: createChannel,

  removeChannel(channel: { unsubscribe: () => Promise<string> }) {
    return channel?.unsubscribe?.() ?? Promise.resolve("ok");
  },

  /** The current session, read synchronously. */
  getCurrentSession(): BackendSession | null {
    return currentSession;
  },
};

export default backend;
