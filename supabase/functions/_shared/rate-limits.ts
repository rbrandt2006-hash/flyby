/**
 * Rate Limit Configuration per Endpoint
 * 
 * Configure rate limits for each edge function here.
 * Values can be overridden via environment variables.
 * 
 * @see SECURITY.md for details on configuring rate limits
 */

import { RateLimitConfig } from "./security.ts";

/**
 * Default rate limits by endpoint type.
 * These are conservative defaults suitable for most use cases.
 */
export const RATE_LIMITS = {
  // Authentication endpoints - strict limits to prevent brute force
  LOGIN: {
    maxRequests: parseInt(Deno.env.get("RATE_LIMIT_LOGIN_MAX") || "5"),
    windowSec: parseInt(Deno.env.get("RATE_LIMIT_LOGIN_WINDOW") || "60"),
    prefix: "auth:login",
  } as RateLimitConfig,

  // 2FA endpoints - very strict to prevent code enumeration
  TWOFA_SEND: {
    maxRequests: parseInt(Deno.env.get("RATE_LIMIT_TWOFA_SEND_MAX") || "3"),
    windowSec: parseInt(Deno.env.get("RATE_LIMIT_TWOFA_SEND_WINDOW") || "60"),
    prefix: "twofa:send",
  } as RateLimitConfig,

  TWOFA_VERIFY: {
    maxRequests: parseInt(Deno.env.get("RATE_LIMIT_TWOFA_VERIFY_MAX") || "5"),
    windowSec: parseInt(Deno.env.get("RATE_LIMIT_TWOFA_VERIFY_WINDOW") || "300"),
    prefix: "twofa:verify",
  } as RateLimitConfig,

  TWOFA_CHECK: {
    maxRequests: parseInt(Deno.env.get("RATE_LIMIT_TWOFA_CHECK_MAX") || "10"),
    windowSec: parseInt(Deno.env.get("RATE_LIMIT_TWOFA_CHECK_WINDOW") || "60"),
    prefix: "twofa:check",
  } as RateLimitConfig,

  // Password reset - moderate limits
  PASSWORD_RESET: {
    maxRequests: parseInt(Deno.env.get("RATE_LIMIT_RESET_MAX") || "3"),
    windowSec: parseInt(Deno.env.get("RATE_LIMIT_RESET_WINDOW") || "300"),
    prefix: "auth:reset",
  } as RateLimitConfig,

  // Search/API endpoints - more generous for usability
  SEARCH: {
    maxRequests: parseInt(Deno.env.get("RATE_LIMIT_SEARCH_MAX") || "30"),
    windowSec: parseInt(Deno.env.get("RATE_LIMIT_SEARCH_WINDOW") || "60"),
    prefix: "api:search",
  } as RateLimitConfig,

  // Transcription endpoint
  TRANSCRIBE: {
    maxRequests: parseInt(Deno.env.get("RATE_LIMIT_TRANSCRIBE_MAX") || "10"),
    windowSec: parseInt(Deno.env.get("RATE_LIMIT_TRANSCRIBE_WINDOW") || "60"),
    prefix: "api:transcribe",
  } as RateLimitConfig,

  // General API endpoints
  API_DEFAULT: {
    maxRequests: parseInt(Deno.env.get("RATE_LIMIT_API_MAX") || "60"),
    windowSec: parseInt(Deno.env.get("RATE_LIMIT_API_WINDOW") || "60"),
    prefix: "api:default",
  } as RateLimitConfig,
} as const;

/**
 * Get rate limit config, allowing per-user overrides.
 * Authenticated users may have higher limits.
 */
export function getRateLimitForUser(
  baseConfig: RateLimitConfig,
  userId?: string
): RateLimitConfig {
  if (!userId) {
    return baseConfig;
  }

  // Authenticated users get 2x the limit
  return {
    ...baseConfig,
    maxRequests: baseConfig.maxRequests * 2,
    prefix: `${baseConfig.prefix}:user`,
  };
}
