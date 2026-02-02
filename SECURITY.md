# Flyby MVP Security Documentation

This document describes the security measures implemented in the Flyby MVP and provides configuration guidance for production deployments.

## Table of Contents

1. [Overview](#overview)
2. [Rate Limiting](#rate-limiting)
3. [Input Validation](#input-validation)
4. [Authentication & Authorization](#authentication--authorization)
5. [Session Security](#session-security)
6. [CORS & CSRF Protection](#cors--csrf-protection)
7. [Security Headers](#security-headers)
8. [Error Handling & Logging](#error-handling--logging)
9. [Secrets Management](#secrets-management)
10. [Endpoint Security Checklist](#endpoint-security-checklist)
11. [Configuration Guide](#configuration-guide)

---

## Overview

The Flyby MVP implements defense-in-depth security following OWASP ASVS guidelines:

- **Rate limiting** on all public endpoints (IP + user-based)
- **Schema-based input validation** with strict type checking
- **Supabase Auth** with JWT tokens and RLS policies
- **Security headers** (CSP, HSTS, X-Frame-Options, etc.)
- **Audit logging** for security-sensitive operations
- **Structured error responses** that don't leak implementation details

---

## Rate Limiting

### Configuration

Rate limits are configured in `supabase/functions/_shared/rate-limits.ts`:

| Endpoint Type | Max Requests | Window | Purpose |
|--------------|--------------|--------|---------|
| Login (`LOGIN`) | 5 | 60s | Brute force protection |
| 2FA Send (`TWOFA_SEND`) | 3 | 60s | SMS abuse prevention |
| 2FA Verify (`TWOFA_VERIFY`) | 5 | 300s | Code enumeration prevention |
| 2FA Check (`TWOFA_CHECK`) | 10 | 60s | User enumeration prevention |
| Password Reset (`PASSWORD_RESET`) | 3 | 300s | Email spam prevention |
| Search (`SEARCH`) | 30 | 60s | API abuse prevention |
| Transcribe (`TRANSCRIBE`) | 10 | 60s | Cost control |
| Default API (`API_DEFAULT`) | 60 | 60s | General protection |

### Environment Variable Overrides

Override defaults via environment variables:

```bash
# Example: Increase login attempts for testing
RATE_LIMIT_LOGIN_MAX=10
RATE_LIMIT_LOGIN_WINDOW=120
```

### Response Format

Rate-limited requests receive a `429 Too Many Requests` response:

```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfterSec": 45
}
```

With headers:
- `Retry-After: 45`
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: 1700000000`

---

## Input Validation

### Validation Rules

All inputs are validated using the shared security utilities:

| Input Type | Validation | Max Length |
|-----------|------------|------------|
| Email | RFC 5322 format | 255 chars |
| Phone | E.164 format (`+1234567890`) | 20 chars |
| OTP Code | 6 digits only | 6 chars |
| UUID | RFC 4122 format | 36 chars |
| Query strings | HTML stripped, trimmed | 500 chars |
| Dates | YYYY-MM-DD format | 10 chars |

### Field Allowlisting

Request bodies are filtered to only allowed fields:

```typescript
// In edge function:
const ALLOWED_FIELDS = ["email", "password"];
const { body, error } = await parseAndValidateBody(req, ALLOWED_FIELDS);
```

Unexpected fields are:
1. Logged as security warnings
2. Silently discarded (not processed)

### Sanitization

All string inputs are sanitized:
- HTML tags removed
- Leading/trailing whitespace trimmed
- Length limits enforced

---

## Authentication & Authorization

### Authentication Flow

1. **Email/Password**: Standard Supabase Auth flow
2. **2FA (optional)**: SMS verification via Twilio Verify
3. **JWT tokens**: Stored in localStorage, refreshed automatically

### Authorization (RLS)

Row-Level Security policies enforce:

- **Object-level access**: Users can only access their own data
- **Company-level access**: Team members can view within their organization
- **Admin isolation**: Service role operations bypass RLS for system functions

### Protected Routes

Frontend routes requiring authentication:
- `/` (Dashboard)
- `/trips/*`
- `/expenses`
- `/team`
- `/settings`
- `/chats`

Unprotected routes:
- `/auth` (login/signup)
- `/forgot-password`
- `/reset-password`

---

## Session Security

### Token Storage

- **JWT tokens**: Stored in localStorage (Supabase default)
- **Session persistence**: Enabled with auto-refresh
- **Token expiration**: Managed by Supabase (default 1 hour, refreshable)

### Recommendations for Production

For enhanced security, consider:

1. **Shorter token lifetimes**: Configure in Supabase dashboard
2. **Refresh token rotation**: Enable in Supabase settings
3. **Session fingerprinting**: Add device/browser validation

---

## CORS & CSRF Protection

### CORS Configuration

Edge functions use restrictive CORS:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": origin, // Validated against allowlist
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
```

### Environment Configuration

Set allowed origins in production:

```bash
ALLOWED_ORIGINS=https://app.flyby.com,https://flyby.com
```

### CSRF Protection

- **SameSite cookies**: Not applicable (JWT in localStorage)
- **Origin validation**: CORS headers validate request origin
- **State tokens**: Used for OAuth flows

---

## Security Headers

### HTML Meta Tags (index.html)

```html
<meta http-equiv="X-Content-Type-Options" content="nosniff" />
<meta http-equiv="X-Frame-Options" content="DENY" />
<meta http-equiv="X-XSS-Protection" content="1; mode=block" />
<meta name="referrer" content="strict-origin-when-cross-origin" />
```

### Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.elevenlabs.io;
frame-ancestors 'none';
```

### Edge Function Response Headers

All edge functions include:

```typescript
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};
```

---

## Error Handling & Logging

### Standardized Error Responses

All errors return consistent structure:

```json
{
  "error": "Human-readable message",
  "code": "OPTIONAL_ERROR_CODE"
}
```

**Never exposed:**
- Stack traces
- Internal error details
- Database query information
- File paths

### Audit Logging

Security-sensitive operations are logged:

```typescript
{
  "timestamp": "2024-01-15T10:30:00Z",
  "action": "twofa_verify_success",
  "userId": "uuid",
  "ip": "1.2.3.4",
  "userAgent": "...",
  "success": true
}
```

### Sensitive Data Redaction

These fields are automatically redacted from logs:
- `password`
- `token`, `secret`, `api_key`
- `authorization`, `auth_token`
- `credit_card`, `ssn`

---

## Secrets Management

### Current Secrets

| Secret | Purpose | Rotation Frequency |
|--------|---------|-------------------|
| `TWILIO_ACCOUNT_SID` | SMS API authentication | Yearly |
| `TWILIO_AUTH_TOKEN` | SMS API authentication | Quarterly |
| `TWILIO_VERIFY_SERVICE_SID` | Verify service ID | As needed |
| `ELEVENLABS_API_KEY` | Transcription service | Quarterly |
| `SUPABASE_SERVICE_ROLE_KEY` | System operations | As needed |

### Best Practices

1. **No hardcoded secrets**: All secrets in environment variables
2. **No client-side secrets**: Only `VITE_` prefixed (publishable) keys in frontend
3. **Rotation procedure**: Update in Supabase Secrets, redeploy functions
4. **Audit access**: Review Supabase function logs for secret usage

### Verifying Build Output

Check that no secrets appear in built files:

```bash
# Search for potential secrets in dist/
grep -r "sk_" dist/ || echo "No Stripe keys found"
grep -r "Bearer" dist/ || echo "No Bearer tokens found"
```

---

## Endpoint Security Checklist

### Edge Functions

| Endpoint | Rate Limit | Auth Required | Input Validation | Audit Log |
|----------|------------|---------------|------------------|-----------|
| `twofa-send-sms` | ✅ 3/min | ✅ JWT | ✅ E.164 phone | ✅ |
| `twofa-verify-sms` | ✅ 5/5min | ✅ JWT | ✅ 6-digit OTP | ✅ |
| `twofa-check-required` | ✅ 10/min | ❌ Public | ✅ Email format | ✅ |
| `twofa-status` | ✅ 60/min | ✅ JWT | ❌ No body | ✅ |
| `twofa-disable` | ✅ 60/min | ✅ JWT | ❌ No body | ✅ |
| `transcribe` | ✅ 10/min | ❌ Public | ✅ File size/type | ✅ |
| `search-travel` | ✅ 30/min | ❌ Public | ✅ Query params | ✅ |

### Database Tables with RLS

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | Own + company | Own | Own | ❌ |
| `trips` | Own + company | Own | Own | Own |
| `expenses` | Own + company | Own | Own | Own |
| `travel_preferences` | Own | Own | Own | Own |
| `two_factor_audit_log` | Own | Service role | ❌ | ❌ |

---

## Configuration Guide

### Production Deployment Checklist

1. **Environment Variables**
   ```bash
   ALLOWED_ORIGINS=https://yourdomain.com
   RATE_LIMIT_LOGIN_MAX=5
   ```

2. **Supabase Settings**
   - Enable email confirmation
   - Set JWT expiry to 1 hour
   - Enable refresh token rotation

3. **DNS/CDN**
   - Enable HTTPS everywhere
   - Add HSTS header at CDN level
   - Configure WAF rules if available

4. **Monitoring**
   - Set up alerts for 429 responses
   - Monitor audit logs for failed auth attempts
   - Alert on unusual traffic patterns

### Testing Security Controls

```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST https://your-project.supabase.co/functions/v1/twofa-check-required \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
done

# Verify unexpected fields are rejected (check logs)
curl -X POST https://your-project.supabase.co/functions/v1/twofa-check-required \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","malicious_field":"value"}'

# Test authorization (should get 401)
curl https://your-project.supabase.co/functions/v1/twofa-status
```

---

## Security Contact

For security issues, contact the development team immediately. Do not disclose vulnerabilities publicly.

---

*Last updated: February 2026*
