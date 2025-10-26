

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleCorsPreflightRequest, createCorsResponse, validateOrigin } from '../_shared/cors.ts'
import { validateChatMessage, sanitizeString } from '../_shared/validation.ts'
import { checkRateLimit, RATE_LIMIT_TIERS } from '../_shared/rate-limit.ts'

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  // Validate origin
  const originError = validateOrigin(req);
  if (originError) return originError;

  try {
    const body = await req.json();
    
    // Validate input
    const validation = validateChatMessage(body);
    if (!validation.valid) {
      return createCorsResponse(
        { error: 'Validation failed', details: validation.errors },
        400,
        origin
      );
    }

    const { session_id, message, user_id } = body;

    // Apply HIGH_COST rate limit (20 req/hour)
    const rateLimitError = await checkRateLimit(req, RATE_LIMIT_TIERS.HIGH_COST, user_id);
    if (rateLimitError) return rateLimitError;
    
    // Sanitize message
    const sanitizedMessage = sanitizeString(message, 50000);
    
    console.log('Received message:', { session_id, user_id, message_length: sanitizedMessage.length });

    // Get the webhook URL and auth header from environment
    const webhookUrl = Deno.env.get('NOTEBOOK_CHAT_URL');
    const authHeader = Deno.env.get('NOTEBOOK_GENERATION_AUTH');
    
    if (!webhookUrl) {
      throw new Error('NOTEBOOK_CHAT_URL environment variable not set');
    }

    if (!authHeader) {
      throw new Error('NOTEBOOK_GENERATION_AUTH environment variable not set');
    }

    console.log('Sending to webhook with auth header');

    // Send message to n8n webhook with authentication
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        session_id,
        message: sanitizedMessage,
        user_id,
        timestamp: new Date().toISOString()
      })
    });

    if (!webhookResponse.ok) {
      console.error(`Webhook responded with status: ${webhookResponse.status}`);
      const errorText = await webhookResponse.text();
      console.error('Webhook error response:', errorText);
      throw new Error(`Webhook responded with status: ${webhookResponse.status}`);
    }

    const webhookData = await webhookResponse.json();
    console.log('Webhook response received');

    return createCorsResponse(
      { success: true, data: webhookData },
      200,
      origin
    );

  } catch (error) {
    console.error('Error in send-chat-message:', error);
    
    return createCorsResponse(
      { error: error.message || 'Failed to send message to webhook' },
      500,
      origin
    );
  }
});

