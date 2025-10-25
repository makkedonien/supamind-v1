/**
 * CORS Configuration and Validation
 * Provides secure CORS handling for Supabase Edge Functions
 */

// Allowed origins - configure these based on your deployment
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:8080',
  'https://localhost:5173',
  'https://supamind.ai',
  'https://www.supamind.ai',
  'https://app.supamind.ai',
];

// For Chrome extension - allow extension protocol if needed
const ALLOW_EXTENSION = true;
const EXTENSION_PATTERN = /^chrome-extension:\/\/[a-z]{32}$/;

/**
 * Validates if the origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  // Check if origin is in allowed list
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Check if it's a chrome extension (if enabled)
  if (ALLOW_EXTENSION && EXTENSION_PATTERN.test(origin)) {
    return true;
  }

  return false;
}

/**
 * Get CORS headers for the response
 * @param origin - The request origin
 * @param allowCredentials - Whether to allow credentials (default: true)
 */
export function getCorsHeaders(origin: string | null, allowCredentials: boolean = true): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400', // 24 hours
  };

  // Only set origin if it's allowed
  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    if (allowCredentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  }

  return headers;
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightRequest(req: Request): Response {
  const origin = req.headers.get('origin');
  const headers = getCorsHeaders(origin);

  return new Response(null, { 
    status: 204,
    headers 
  });
}

/**
 * Create a JSON response with CORS headers
 */
export function createCorsResponse(
  body: any, 
  status: number = 200,
  origin: string | null
): Response {
  const headers = getCorsHeaders(origin);
  headers['Content-Type'] = 'application/json';

  return new Response(
    JSON.stringify(body),
    { status, headers }
  );
}

/**
 * Validate origin and return error response if invalid
 */
export function validateOrigin(req: Request): Response | null {
  const origin = req.headers.get('origin');
  
  // If origin is present but not allowed, reject the request
  if (origin && !isOriginAllowed(origin)) {
    return new Response(
      JSON.stringify({ error: 'Origin not allowed' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return null;
}

