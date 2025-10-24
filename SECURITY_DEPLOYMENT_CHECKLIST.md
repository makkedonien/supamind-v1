# Security Deployment Checklist

## Pre-Deployment Steps

### 1. Update CORS Configuration ⚠️ CRITICAL
- [ ] Open `supabase/functions/_shared/cors.ts`
- [ ] Replace localhost URLs with your production domains
- [ ] Remove any test/development URLs
- [ ] Test CORS configuration in staging environment

**File to edit**: `supabase/functions/_shared/cors.ts`
```typescript
const ALLOWED_ORIGINS = [
  // REMOVE THESE IN PRODUCTION:
  // 'http://localhost:5173',
  // 'http://localhost:5174',
  
  // ADD YOUR DOMAINS:
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  'https://app.yourdomain.com',
];
```

### 2. Generate and Set Webhook Secret ⚠️ CRITICAL
- [ ] Generate a strong secret: `openssl rand -hex 32`
- [ ] Set in Supabase: `supabase secrets set WEBHOOK_SECRET=<your-secret>`
- [ ] Update n8n workflows to include HMAC signatures (see SECURITY_CONFIGURATION.md)
- [ ] Test callback functions with signed requests

### 3. Update Security Headers
- [ ] Open `vercel.json`
- [ ] Update CSP `connect-src` with your actual API domains
- [ ] Remove any development URLs
- [ ] Test headers at https://securityheaders.com

### 4. Configure Session Settings
- [ ] Review `supabase/config.toml` auth settings
- [ ] Adjust JWT expiry if needed (currently 4 hours)
- [ ] Verify refresh token rotation is enabled
- [ ] Test authentication flow

### 5. Update Chrome Extension
- [ ] Verify build process injects environment variables
- [ ] Test extension can't run with missing credentials
- [ ] Verify host permissions are restricted
- [ ] Test extension functionality

## Deployment Steps

### 6. Deploy Edge Functions
```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy send-chat-message
supabase functions deploy process-document
supabase functions deploy process-document-callback
# ... etc
```

### 7. Deploy Frontend
```bash
# Build with production environment variables
npm run build

# Deploy to Vercel (or your hosting provider)
vercel --prod
```

### 8. Deploy Chrome Extension
```bash
# Build extension
cd extensions/chrome
npm run build

# Upload to Chrome Web Store
# (Manual process via Chrome Developer Dashboard)
```

## Post-Deployment Verification

### 9. Test Security Measures
- [ ] Test CORS from allowed domain - should work
- [ ] Test CORS from unauthorized domain - should fail
- [ ] Test callback without signature - should reject (401)
- [ ] Test callback with invalid signature - should reject (401)
- [ ] Test callback with valid signature - should succeed
- [ ] Verify security headers: https://securityheaders.com/?q=yourdomain.com
- [ ] Test input validation with malicious payloads
- [ ] Test file upload with invalid file types

### 10. Monitor and Verify
- [ ] Check Supabase logs for errors
- [ ] Monitor edge function metrics
- [ ] Verify no CORS errors in browser console
- [ ] Check n8n workflow execution logs
- [ ] Monitor database for unusual activity

### 11. Update Remaining Edge Functions (Optional)

The following functions have NOT been updated yet with the new security pattern:

**User-facing functions** (Should be updated):
- [ ] `process-feed-sources`
- [ ] `process-feed-document`
- [ ] `process-additional-sources`
- [ ] `generate-notebook-content`
- [ ] `generate-note-title`
- [ ] `generate-audio-overview`
- [ ] `generate-microcast`
- [ ] `refresh-audio-url`
- [ ] `manage-user-categories`

**System functions** (Lower priority):
- [ ] `process-podcast-feed`
- [ ] `scheduled-podcast-processing`
- [ ] `microcast-generation-callback`

**To update these**, follow this pattern:

```typescript
// 1. Add imports
import { getCorsHeaders, handleCorsPreflightRequest, createCorsResponse, validateOrigin } from '../_shared/cors.ts'
import { isValidUUID, sanitizeString, validateUrlList } from '../_shared/validation.ts'

// 2. Update serve function
serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const originError = validateOrigin(req);
  if (originError) return originError;

  try {
    const body = await req.json();
    
    // 3. Add validation
    if (!body.someId || !isValidUUID(body.someId)) {
      return createCorsResponse(
        { error: 'Valid someId required' },
        400,
        origin
      );
    }
    
    // 4. Sanitize inputs
    const sanitizedText = sanitizeString(body.text, 10000);
    
    // ... rest of function logic ...
    
    // 5. Use createCorsResponse for all responses
    return createCorsResponse(
      { success: true, data: result },
      200,
      origin
    );
    
  } catch (error) {
    return createCorsResponse(
      { error: error.message },
      500,
      origin
    );
  }
});
```

## Emergency Rollback Plan

If security measures cause production issues:

### Quick Rollback
```bash
# Rollback edge functions
supabase functions deploy send-chat-message --no-verify-jwt

# Or revert to previous version
git revert HEAD
git push
```

### Temporary Fixes
1. **CORS issues**: Temporarily add domain to `ALLOWED_ORIGINS`
2. **Callback failures**: Set `WEBHOOK_SECRET` to empty in environment (disables signature check)
3. **Validation too strict**: Adjust validation rules in `_shared/validation.ts`

## Rate Limiting Setup (Recommended)

Rate limiting is NOT yet implemented. To add:

1. **Create rate limit table**:
```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  ip_address TEXT,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_lookup 
ON public.rate_limits(user_id, endpoint, window_start);

CREATE INDEX idx_rate_limits_ip 
ON public.rate_limits(ip_address, endpoint, window_start);
```

2. **Create rate limit function**:
```sql
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_limit INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get current count in window
  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM public.rate_limits
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;
  
  -- Check if over limit
  IF v_count >= p_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Increment counter
  INSERT INTO public.rate_limits (user_id, endpoint, request_count, window_start)
  VALUES (p_user_id, p_endpoint, 1, NOW())
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1;
  
  RETURN TRUE;
END;
$$;
```

3. **Add to edge functions**:
```typescript
// Check rate limit before processing
const { data: allowed, error } = await supabase.rpc('check_rate_limit', {
  p_user_id: userId,
  p_endpoint: 'function-name',
  p_limit: 100,
  p_window_minutes: 60
});

if (!allowed) {
  return createCorsResponse(
    { error: 'Rate limit exceeded. Please try again later.' },
    429,
    origin
  );
}
```

## Success Metrics

After deployment, you should see:
- ✅ No CORS errors in browser console
- ✅ All callback functions receiving signed requests
- ✅ Security headers score A+ on securityheaders.com
- ✅ Input validation blocking malicious inputs
- ✅ No unauthorized access to edge functions
- ✅ Proper error handling in logs

## Support

If you encounter issues:
1. Check logs: `supabase functions logs <function-name>`
2. Test locally: `supabase functions serve`
3. Review SECURITY_CONFIGURATION.md
4. Contact security team

---

**Checklist Version**: 1.0.0
**Last Updated**: October 24, 2025

