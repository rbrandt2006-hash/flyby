/**
 * Server-side backend access for MCP tools.
 *
 * MCP tools run outside the browser, so they can't use the app's client (which
 * keeps the session in `localStorage`). Each tool instead forwards the caller's
 * own access token, so a tool only ever reads what that user could read — the
 * backend applies the same ownership scoping it applies to the app.
 */

const API_BASE = (process.env.FLYBY_API_URL ?? "http://localhost:8659").replace(/\/$/, "");

export interface QueryOptions {
  filters?: { column: string; op: string; value: unknown }[];
  order?: { column: string; ascending: boolean }[];
  limit?: number;
  single?: "one" | "maybe";
}

export interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

/** Read rows from a table as the user the token belongs to. */
export async function queryTable<T = unknown[]>(
  token: string,
  table: string,
  options: QueryOptions = {},
): Promise<QueryResult<T>> {
  try {
    const response = await fetch(`${API_BASE}/rest/v1/${table}/select`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        filters: options.filters ?? [],
        order: options.order ?? [],
        limit: options.limit,
        single: options.single,
      }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        error: { message: body?.error?.message ?? `Request failed (${response.status})` },
      };
    }
    return { data: (body?.data ?? null) as T, error: body?.error ?? null };
  } catch (err) {
    return {
      data: null,
      error: {
        message:
          err instanceof Error
            ? `Couldn't reach the Flyby backend: ${err.message}`
            : "Couldn't reach the Flyby backend.",
      },
    };
  }
}

/** Keep only the given fields on each row, so tools return a tight payload. */
export function pick<T extends Record<string, unknown>>(rows: T[], fields: string[]) {
  return rows.map((row) =>
    Object.fromEntries(fields.filter((f) => f in row).map((f) => [f, row[f]])),
  );
}
