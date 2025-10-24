
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleCorsPreflightRequest, createCorsResponse, validateOrigin } from '../_shared/cors.ts'
import { isValidUUID, isValidTimestamp, validateUrlList, sanitizeString } from '../_shared/validation.ts'

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
    const { type, notebookId, urls, title, content, timestamp } = body;
    
    // Validate required fields
    if (!type || !notebookId || !isValidUUID(notebookId)) {
      return createCorsResponse(
        { error: 'Valid type and notebookId (UUID) are required' },
        400,
        origin
      );
    }
    
    console.log(`Webhook handler received ${type} request`);

    // Get the webhook URL from Supabase secrets
    const webhookUrl = Deno.env.get('WEBHOOK_URL');
    if (!webhookUrl) {
      throw new Error('WEBHOOK_URL not configured');
    }

    // Get the auth token from Supabase secrets (same as generate-notebook-content)
    const authToken = Deno.env.get('NOTEBOOK_GENERATION_AUTH');
    if (!authToken) {
      throw new Error('NOTEBOOK_GENERATION_AUTH not configured');
    }

    // Prepare and validate the webhook payload
    let webhookPayload;
    
    if (type === 'multiple-websites') {
      // Validate URLs
      const urlValidation = validateUrlList(urls);
      if (!urlValidation.valid) {
        return createCorsResponse(
          { error: 'Invalid URLs', details: urlValidation.errors },
          400,
          origin
        );
      }
      
      webhookPayload = {
        type: 'multiple-websites',
        notebookId,
        urls,
        timestamp
      };
    } else if (type === 'copied-text') {
      // Validate and sanitize content
      if (!title || !content) {
        return createCorsResponse(
          { error: 'title and content are required for copied-text type' },
          400,
          origin
        );
      }
      
      webhookPayload = {
        type: 'copied-text',
        notebookId,
        title: sanitizeString(title, 500),
        content: sanitizeString(content, 100000),
        timestamp
      };
    } else {
      return createCorsResponse(
        { error: `Unsupported type: ${type}` },
        400,
        origin
      );
    }

    console.log('Sending webhook payload');

    // Send to webhook with authentication
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook request failed:', response.status);
      throw new Error(`Webhook request failed: ${response.status}`);
    }

    const webhookResponse = await response.text();
    console.log('Webhook response received');

    return createCorsResponse(
      { 
        success: true, 
        message: `${type} data sent to webhook successfully`,
        webhookResponse 
      },
      200,
      origin
    );

  } catch (error) {
    console.error('Webhook handler error:', error);
    
    return createCorsResponse(
      { 
        error: error.message,
        success: false 
      },
      500,
      origin
    );
  }
});
