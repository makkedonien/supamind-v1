# Security Configuration Guide

## Overview

This document outlines the security hardening measures implemented in Supamind and provides configuration instructions for deployment.

## ⚠️ CRITICAL: Required Configuration Before Deployment

### 1. Update Allowed Origins for CORS

**File**: `supabase/functions/_shared/cors.ts`

Before deploying to production, you **MUST** update the `ALLOWED_ORIGINS` array with your actual domain(s):

```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://localhost:5173',
  // ADD YOUR PRODUCTION DOMAINS HERE:
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  'https://app.yourdomain.com',
];
```

**Why this is critical**: The CORS configuration prevents unauthorized websites from making requests to your edge functions. Failing to configure this properly will either:
- Block legitimate requests (if you don't add your domain)
- Allow malicious requests (if you leave localhost in production)

### 2. Configure Webhook Secret for Callbacks

**Required Environment Variable**: `WEBHOOK_SECRET`

Add this to your Supabase project secrets:

```bash
# Generate a strong random secret (32+ characters)
openssl rand -hex 32

# Add to Supabase:
supabase secrets set WEBHOOK_SECRET=<your-generated-secret>
```

**Affected Functions**:
- `process-document-callback`
- `audio-generation-callback`
- `microcast-generation-callback` (if you update it)

**Why this is critical**: Without this secret, anyone who discovers your callback URLs can inject malicious data into your database.

### 3. Update n8n Workflows to Sign Webhook Calls

Your n8n workflows must now include HMAC signatures when calling back to Supabase functions.

**Example n8n HTTP Request Node Configuration**:

```javascript
// In your n8n workflow, add a Function node before the HTTP Request:

const crypto = require('crypto');
const webhookSecret = '{{your-webhook-secret}}';
const payload = JSON.stringify($input.all());

const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');

return {
  json: {
    payload: $input.all(),
    signature: signature
  }
};

// Then in HTTP Request node:
// URL: Your callback URL
// Method: POST
// Headers:
//   x-webhook-signature: {{$json.signature}}
// Body: {{$json.payload}}
```

### 4. Update Security Headers for Your Domain

**File**: `vercel.json`

Update the Content-Security-Policy to include your actual API endpoints:

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.assemblyai.com https://api.openai.com https://generativelanguage.googleapis.com https://yourdomain.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
}
```

## Security Features Implemented

### ✅ CORS Protection
- **Status**: Implemented
- **Location**: `supabase/functions/_shared/cors.ts`
- **What it does**: Validates request origins and only allows configured domains
- **Action required**: Update `ALLOWED_ORIGINS` array before production deployment

### ✅ Input Validation
- **Status**: Implemented
- **Location**: `supabase/functions/_shared/validation.ts`
- **What it does**: 
  - Validates UUIDs, URLs, file paths
  - Prevents directory traversal attacks
  - Sanitizes text inputs
  - Validates data types and ranges
- **Functions updated**: 
  - `send-chat-message`
  - `process-document`
  - `webhook-handler`
  - More to be updated

### ✅ HMAC Signature Verification
- **Status**: Implemented
- **Location**: `supabase/functions/_shared/webhook-security.ts`
- **What it does**: Verifies webhook callbacks are authentic
- **Action required**: 
  1. Set `WEBHOOK_SECRET` environment variable
  2. Update n8n workflows to sign requests

### ✅ Security Headers
- **Status**: Implemented
- **Location**: `vercel.json`
- **What it does**:
  - `X-Frame-Options: DENY` - Prevents clickjacking
  - `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
  - `Strict-Transport-Security` - Enforces HTTPS
  - `Content-Security-Policy` - Prevents XSS attacks
  - `Permissions-Policy` - Restricts browser features
- **Action required**: Update CSP connect-src with your domains

### ✅ Chrome Extension Security
- **Status**: Improved
- **Location**: 
  - `extensions/chrome/src/supabase.ts`
  - `extensions/chrome/manifest.json`
- **What changed**:
  - Removed hardcode hints
  - Added validation for required environment variables
  - Restricted host permissions
- **Action required**: Ensure build process injects environment variables

### ✅ Session Security
- **Status**: Enhanced
- **Location**: `supabase/config.toml`
- **What changed**:
  - Extended JWT expiry to 4 hours (better UX)
  - Enabled refresh token rotation
  - Added minimum password length (12 characters)
  - Enabled secure email change settings

### ✅ Audit Logging
- **Status**: Improved
- **What changed**: Reduced sensitive data in logs
- **Examples**:
  - User IDs still logged for debugging
  - Message content length logged instead of full content
  - File paths sanitized in logs

## ✅ Rate Limiting - IMPLEMENTED

**Status**: Implemented with Upstash Redis

Rate limiting protects against:
- DDoS attacks
- API quota exhaustion  
- Brute force attempts
- Cost overruns from abuse

### Configuration

Rate limits are tiered by function cost/risk:

| Tier | Limit | Functions |
|------|-------|-----------|
| **High-Cost** | 20 req/hour | LLM, TTS API calls |
| **Medium-Cost** | 50 req/hour | Document/feed processing |
| **Low-Cost** | 100 req/hour | CRUD operations |
| **Callback** | 500 req/hour | Trusted webhooks |

### How It Works

1. **Identifier**: Uses `user_id` if authenticated, otherwise client IP
2. **Algorithm**: Sliding window (proper rate limiting, not fixed windows)
3. **Storage**: Upstash Redis (sub-10ms latency, auto-expiration)
4. **Fail-safe**: Fails open if Redis unavailable (won't block users)
5. **Bypass**: Optional bypass parameter for admin/premium users

### Function Coverage

All 17 edge functions are protected:

**High-Cost** (20/hour):
- send-chat-message
- generate-microcast
- generate-audio-overview
- generate-notebook-content
- generate-note-title

**Medium-Cost** (50/hour):
- process-document
- process-feed-document
- process-feed-sources
- process-additional-sources
- refresh-audio-url

**Low-Cost** (100/hour):
- webhook-handler
- manage-user-categories
- process-podcast-feed
- scheduled-podcast-processing

**Callback** (500/hour):
- process-document-callback
- audio-generation-callback
- microcast-generation-callback

### Adjusting Limits

To modify rate limits, edit `supabase/functions/_shared/rate-limit.ts`:

```typescript
highCost: new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"), // Change 20 to desired limit
  analytics: true,
  prefix: "rl:high",
}),
```

### Bypassing Rate Limits

For admin or premium users, pass `bypass: true`:

```typescript
const rateLimitError = await checkRateLimit(
  req, 
  RATE_LIMIT_TIERS.HIGH_COST, 
  user_id,
  true  // Bypass rate limiting
);
```

### Monitoring

Check Upstash dashboard for:
- Request counts per endpoint
- Rate limit hits
- Top users/IPs
- Analytics trends

Watch logs for rate limit warnings:
```
⚠️ Rate limit exceeded: { tier: 'highCost', identifier: 'user:123', limit: 20, ... }
```

### Cost Monitoring

**Upstash Free Tier:**
- 10,000 commands/day
- Sufficient for <50 users with typical usage

**Estimate your usage:**
```
For N users making M requests/hour:
Total Redis commands = N × M × 1.2 (overhead for analytics)

Example: 50 users × 10 requests/hour × 1.2 = 600 commands/hour
Daily: 600 × 24 = 14,400 commands/day
```

If you exceed 10k commands/day consistently, upgrade to paid tier (~$10/month).

### Required Environment Variables

Add these to Supabase:
```bash
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

Set via: `supabase secrets set VARIABLE_NAME=value`

## Additional Security Recommendations

### High Priority

1. **File Upload Validation**
   - Implement virus scanning (e.g., ClamAV integration)
   - Add magic number validation for file types
   - Scan uploaded PDFs for malicious scripts

2. **API Key Rotation**
   - Implement automatic key expiration
   - Add notification system for key rotation
   - Track API key usage

3. **Database Auditing**
   - Log all sensitive operations
   - Track RLS policy violations
   - Monitor for suspicious patterns

### Medium Priority

4. **Dependency Scanning**
   ```bash
   # Add to CI/CD pipeline
   npm audit
   snyk test
   ```

5. **Automated Security Testing**
   - Add OWASP ZAP to CI/CD
   - Implement automated penetration testing
   - Regular security audits

6. **Backup Encryption**
   - Ensure Supabase backups are encrypted
   - Test restore procedures regularly

## Environment Variables Checklist

Before deploying, ensure these environment variables are set:

### Supabase Edge Functions
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `WEBHOOK_SECRET` (Required for callbacks)
- [ ] `UPSTASH_REDIS_REST_URL` (NEW - Required for rate limiting)
- [ ] `UPSTASH_REDIS_REST_TOKEN` (NEW - Required for rate limiting)
- [ ] `NOTEBOOK_CHAT_URL`
- [ ] `NOTEBOOK_GENERATION_AUTH`
- [ ] `DOCUMENT_PROCESSING_WEBHOOK_URL`
- [ ] `FEED_SOURCES_WEBHOOK_URL`
- [ ] `FEED_DOCUMENT_PROCESSING_WEBHOOK_URL`
- [ ] `WEBHOOK_URL`

### Frontend (Vercel/Build)
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_GOOGLE_CLIENT_ID`

### Chrome Extension (Build)
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`

## Testing Security Measures

### Manual Testing Checklist

- [ ] Test CORS by making requests from unauthorized domain
- [ ] Verify webhook signature rejection with invalid signature
- [ ] Test input validation with malicious payloads
- [ ] Check security headers using securityheaders.com
- [x] Test rate limiting - IMPLEMENTED (verify 429 responses after limit exceeded)
- [ ] Verify RLS policies block unauthorized access
- [ ] Test Chrome extension with missing environment variables

### Automated Testing

```bash
# Example security scan
npm run security-scan

# Check for vulnerable dependencies
npm audit

# Test edge functions
supabase functions serve
# Run test suite against local functions
```

## Incident Response

If you discover a security vulnerability:

1. **Do NOT** disclose publicly until patched
2. Contact security@yourdomain.com (set up dedicated security email)
3. Document the vulnerability
4. Patch immediately
5. Notify affected users if data was compromised
6. Conduct post-mortem

## Security Updates

This configuration should be reviewed and updated:
- **Quarterly**: Review and update dependencies
- **Monthly**: Check for new security advisories
- **Weekly**: Review audit logs for anomalies
- **Daily**: Monitor error logs for security-related failures

## Support

For security questions or concerns, contact:
- Technical Lead: [Add contact]
- Security Team: security@yourdomain.com

---

**Last Updated**: October 24, 2025
**Version**: 1.0.0
**Review Date**: January 24, 2026

