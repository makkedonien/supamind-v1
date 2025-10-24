/**
 * Webhook Security Utilities
 * Provides HMAC signature verification for webhook callbacks
 */

/**
 * Generates HMAC signature for webhook payload
 * @param payload - The payload to sign (as string)
 * @param secret - The webhook secret
 */
export async function generateHmacSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  
  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifies HMAC signature from webhook request
 * @param payload - The payload to verify (as string)
 * @param signature - The signature from the request header
 * @param secret - The webhook secret
 */
export async function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const expectedSignature = await generateHmacSignature(payload, secret);
    
    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(signature, expectedSignature);
  } catch (error) {
    console.error('Error verifying HMAC signature:', error);
    return false;
  }
}

/**
 * Timing-safe string comparison
 * @param a - First string
 * @param b - Second string
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validates webhook request with HMAC signature
 * Returns null if valid, error Response if invalid
 */
export async function validateWebhookRequest(
  req: Request,
  secret: string,
  signatureHeader: string = 'x-webhook-signature'
): Promise<Response | null> {
  // Get signature from header
  const signature = req.headers.get(signatureHeader);
  
  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'Missing webhook signature' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Get the raw body
  const body = await req.text();
  
  // Verify signature
  const isValid = await verifyHmacSignature(body, signature, secret);
  
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Invalid webhook signature' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return null;
}

/**
 * Creates a signed webhook request
 * Use this when calling external webhooks that expect signatures
 */
export async function createSignedWebhookRequest(
  url: string,
  payload: any,
  secret: string,
  additionalHeaders: Record<string, string> = {}
): Promise<Response> {
  const body = JSON.stringify(payload);
  const signature = await generateHmacSignature(body, secret);

  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature,
      ...additionalHeaders
    },
    body
  });
}

