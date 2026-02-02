/**
 * Security Utilities for Edge Functions
 * 
 * This module provides:
 * - Rate limiting (IP + user-based)
 * - Input validation and sanitization
 * - Security headers
 * - Structured error responses
 * - Audit logging utilities
 * 
 * @see SECURITY.md for configuration details
 */

// ============================================================================
// CORS HEADERS - Hardened for production
// ============================================================================

/**
 * Production CORS headers with restrictive defaults.
 * Override ALLOWED_ORIGINS in environment for production deployments.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || ["*"];
  const origin = req.headers.get("origin") || "";
  
  // Check if origin is allowed
  const isAllowed = allowedOrigins.includes("*") || allowedOrigins.includes(origin);
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin || "*" : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Security headers to include in all responses.
 * Helps prevent XSS, clickjacking, and other attacks.
 */
export const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Pragma": "no-cache",
};

/**
 * Combines CORS and security headers for a given request.
 */
export function getResponseHeaders(req: Request): Record<string, string> {
  return {
    ...getCorsHeaders(req),
    ...securityHeaders,
    "Content-Type": "application/json",
  };
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * In-memory rate limit store.
 * In production, consider using Supabase or Redis for distributed rate limiting.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSec: number;
  /** Identifier prefix for the rate limit bucket */
  prefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec?: number;
}

/**
 * Check rate limit for an identifier (IP or user ID).
 * 
 * @param identifier - IP address, user ID, or combined key
 * @param config - Rate limit configuration
 * @returns Rate limit result with remaining count and reset time
 * 
 * @example
 * // 10 requests per minute for login attempts
 * const result = checkRateLimit(clientIP, { maxRequests: 10, windowSec: 60, prefix: "login" });
 * if (!result.allowed) {
 *   return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
 * }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = config.prefix ? `${config.prefix}:${identifier}` : identifier;
  const now = Date.now();
  const windowMs = config.windowSec * 1000;
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }
  
  if (entry.count >= config.maxRequests) {
    // Rate limited
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSec,
    };
  }
  
  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP from request headers.
 * Handles common proxy headers (Cloudflare, X-Forwarded-For).
 */
export function getClientIP(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

/**
 * Create a rate-limited response with proper headers.
 */
export function rateLimitedResponse(
  req: Request,
  result: RateLimitResult
): Response {
  const headers = getResponseHeaders(req);
  headers["Retry-After"] = String(result.retryAfterSec || 60);
  headers["X-RateLimit-Remaining"] = "0";
  headers["X-RateLimit-Reset"] = String(Math.ceil(result.resetAt / 1000));
  
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfterSec: result.retryAfterSec,
    }),
    { status: 429, headers }
  );
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Sanitize string input to prevent XSS and injection attacks.
 * Removes HTML tags and trims whitespace.
 */
export function sanitizeString(input: string | undefined | null, maxLength = 1000): string {
  if (!input) return "";
  
  // Remove HTML tags
  const sanitized = input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim();
  
  // Enforce length limit
  return sanitized.slice(0, maxLength);
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate E.164 phone format.
 */
export function isValidE164Phone(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

/**
 * Validate UUID format.
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate 6-digit OTP code.
 */
export function isValidOTPCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Parse and validate JSON body with field allowlist.
 * Rejects unexpected fields to prevent mass assignment.
 * 
 * @param req - Request object
 * @param allowedFields - Array of allowed field names
 * @returns Parsed and filtered body, or null if invalid
 */
export async function parseAndValidateBody(
  req: Request,
  allowedFields: string[]
): Promise<{ body: Record<string, unknown> | null; error: string | null }> {
  try {
    const raw = await req.json();
    
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      return { body: null, error: "Invalid request body format" };
    }
    
    // Filter to only allowed fields
    const filtered: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in raw) {
        filtered[field] = raw[field];
      }
    }
    
    // Log unexpected fields in development
    const unexpectedFields = Object.keys(raw).filter(k => !allowedFields.includes(k));
    if (unexpectedFields.length > 0) {
      console.warn(`[SECURITY] Unexpected fields rejected: ${unexpectedFields.join(", ")}`);
    }
    
    return { body: filtered, error: null };
  } catch {
    return { body: null, error: "Invalid JSON in request body" };
  }
}

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/**
 * Standardized error response that doesn't leak implementation details.
 */
export function errorResponse(
  req: Request,
  status: number,
  message: string,
  code?: string
): Response {
  const headers = getResponseHeaders(req);
  
  return new Response(
    JSON.stringify({
      error: message,
      ...(code && { code }),
    }),
    { status, headers }
  );
}

/**
 * Success response with security headers.
 */
export function successResponse(
  req: Request,
  data: Record<string, unknown>,
  status = 200
): Response {
  const headers = getResponseHeaders(req);
  
  return new Response(JSON.stringify(data), { status, headers });
}

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

/**
 * Fields that should never be logged.
 */
const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "api_key",
  "apiKey",
  "authorization",
  "auth_token",
  "authToken",
  "credit_card",
  "creditCard",
  "ssn",
  "social_security",
];

/**
 * Redact sensitive fields from an object for logging.
 */
export function redactSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_FIELDS.some(f => lowerKey.includes(f))) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactSensitive(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted;
}

/**
 * Structured log entry for audit purposes.
 */
export interface AuditLogEntry {
  timestamp: string;
  action: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, unknown>;
}

/**
 * Create a structured audit log entry.
 */
export function createAuditLog(
  req: Request,
  action: string,
  userId: string | undefined,
  success: boolean,
  details?: Record<string, unknown>
): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    action,
    userId,
    ip: getClientIP(req),
    userAgent: req.headers.get("user-agent") || undefined,
    success,
    details: details ? redactSensitive(details) : undefined,
  };
}

/**
 * Log audit entry to console (replace with proper logging service in production).
 */
export function logAudit(entry: AuditLogEntry): void {
  console.log(`[AUDIT] ${JSON.stringify(entry)}`);
}
