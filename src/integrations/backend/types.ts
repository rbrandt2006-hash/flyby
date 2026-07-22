/**
 * Types for the Flyby backend client.
 *
 * These describe what the Flask backend actually returns, so components get
 * real type checking against the API they talk to.
 */

/** The signed-in user, as returned by `/auth/v1`. */
export interface BackendUser {
  id: string;
  aud: string;
  role: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  app_metadata: Record<string, unknown>;
  user_metadata: {
    full_name?: string;
    email?: string;
    avatar_url?: string | null;
    /** Job title shown in the profile menu when no profile row has loaded yet. */
    role?: string;
    [key: string]: unknown;
  };
  identities?: unknown[];
}

/** An authenticated session: tokens plus the user they belong to. */
export interface BackendSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  /** Absolute expiry, in seconds since the epoch. */
  expires_at: number;
  user: BackendUser;
}

/** A failure from any backend call. */
export interface BackendError {
  message: string;
  code?: string;
  details?: string;
  status?: number;
}

/** The `{ data, error }` envelope every call resolves to. */
export interface BackendResult<T> {
  data: T;
  error: BackendError | null;
  count?: number | null;
}

export type AuthChangeEvent =
  | "INITIAL_SESSION"
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED";

/** Aliases kept so existing imports of the auth types keep resolving. */
export type User = BackendUser;
export type Session = BackendSession;
