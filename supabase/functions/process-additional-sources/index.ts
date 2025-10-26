
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleCorsPreflightRequest, createCorsResponse, validateOrigin } from '../_shared/cors.ts'
import { isValidUUID, validateUrlList, sanitizeString } from '../_shared/validation.ts'
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
    const { type, notebookId, urls, title, content, timestamp, sourceIds, userId } = await req.json();
    
    // Validate required fields
    if (!notebookId || !isValidUUID(notebookId)) {
      return createCorsResponse(
        { error: 'Valid notebookId (UUID) is required' },
        400,
        origin
      );
    }

    if (!userId || !isValidUUID(userId)) {
      return createCorsResponse(
        { error: 'Valid userId (UUID) is required' },
        400,
        origin
      );
    }

    // Apply MEDIUM_COST rate limit (50 req/hour)
    const rateLimitError = await checkRateLimit(req, RATE_LIMIT_TIERS.MEDIUM_COST, userId);
    if (rateLimitError) return rateLimitError;

    if (!type || !['multiple-websites', 'copied-text'].includes(type)) {
      return createCorsResponse(
        { error: 'Valid type is required (multiple-websites or copied-text)' },
        400,
        origin
      );
    }

    // Validate URLs if type is multiple-websites
    if (type === 'multiple-websites') {
      const urlValidation = validateUrlList(urls || []);
      if (!urlValidation.valid) {
        return createCorsResponse(
          { error: 'URL validation failed', details: urlValidation.errors },
          400,
          origin
        );
      }
    }
    
    console.log(`Process additional sources received ${type} request for notebook ${notebookId}, user ${userId}`);

    // Get the webhook URL from Supabase secrets
    const webhookUrl = Deno.env.get('ADDITIONAL_SOURCES_WEBHOOK_URL');
    if (!webhookUrl) {
      return createCorsResponse(
        { error: 'ADDITIONAL_SOURCES_WEBHOOK_URL not configured' },
        500,
        origin
      );
    }

    // Get the auth token from Supabase secrets
    const authToken = Deno.env.get('NOTEBOOK_GENERATION_AUTH');
    if (!authToken) {
      return createCorsResponse(
        { error: 'NOTEBOOK_GENERATION_AUTH not configured' },
        500,
        origin
      );
    }

    // Prepare the webhook payload
    let webhookPayload;
    
    if (type === 'multiple-websites') {
      webhookPayload = {
        type: 'multiple-websites',
        notebookId,
        urls,
        sourceIds, // Array of source IDs corresponding to the URLs
        user_id: userId,
        timestamp
      };
    } else if (type === 'copied-text') {
      const sanitizedTitle = title ? sanitizeString(title, 500) : '';
      const sanitizedContent = content ? sanitizeString(content, 100000) : '';

      webhookPayload = {
        type: 'copied-text',
        notebookId,
        title: sanitizedTitle,
        content: sanitizedContent,
        sourceId: sourceIds?.[0], // Single source ID for copied text
        user_id: userId,
        timestamp
      };
    }

    console.log('Sending webhook payload:', JSON.stringify({ ...webhookPayload, content: content ? `${content.substring(0, 100)}...` : '' }, null, 2));

    // Send to webhook with authentication
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook request failed:', response.status, errorText);
      return createCorsResponse(
        { error: `Webhook request failed: ${response.status}` },
        500,
        origin
      );
    }

    const webhookResponse = await response.text();
    console.log('Webhook response received');

    return createCorsResponse({ 
      success: true, 
      message: `${type} data sent to webhook successfully`,
      webhookResponse 
    }, 200, origin);

  } catch (error) {
    console.error('Process additional sources error:', error);
    
    return createCorsResponse({ 
      error: error.message,
      success: false 
    }, 500, origin);
  }
});
