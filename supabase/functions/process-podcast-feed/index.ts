import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCorsPreflightRequest, createCorsResponse, validateOrigin } from '../_shared/cors.ts'
import { isValidUUID, isValidRssUrl } from '../_shared/validation.ts'
import { checkRateLimit, RATE_LIMIT_TIERS } from '../_shared/rate-limit.ts'

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const originError = validateOrigin(req);
  if (originError) return originError;

  try {
    console.log('Processing podcast feed request...');
    
    const requestBody = await req.json();
    const { podcastId, userId, rssFeed } = requestBody;

    // Validate inputs
    if (!podcastId || !isValidUUID(podcastId)) {
      return createCorsResponse(
        { error: 'Valid podcastId (UUID) is required', success: false },
        400,
        origin
      );
    }

    if (!userId || !isValidUUID(userId)) {
      return createCorsResponse(
        { error: 'Valid userId (UUID) is required', success: false },
        400,
        origin
      );
    }

    // Apply LOW_COST rate limit (100 req/hour)
    const rateLimitError = await checkRateLimit(req, RATE_LIMIT_TIERS.LOW_COST, userId);
    if (rateLimitError) return rateLimitError;

    if (!rssFeed || !isValidRssUrl(rssFeed)) {
      return createCorsResponse(
        { error: 'Valid RSS feed URL is required', success: false },
        400,
        origin
      );
    }

    console.log(`Processing podcast feed for podcast ${podcastId}, user ${userId}`);

    // Check if user has podcast processing enabled
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('podcast_processing')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return createCorsResponse({ 
        error: 'Failed to verify user settings. Please try again.',
        success: false 
      }, 500, origin);
    }

    if (!profile || profile.podcast_processing === 'disabled') {
      console.log('Podcast processing is disabled for user:', userId);
      return createCorsResponse({ 
        error: 'Podcast processing is disabled in your settings. Please enable it in Settings > Podcasts to add podcast feeds.',
        success: false 
      }, 403, origin);
    }

    console.log('Podcast processing is enabled for user, proceeding');

    // Get the webhook URL from Supabase secrets
    const webhookUrl = Deno.env.get('PODCAST_ADDING_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('PODCAST_ADDING_WEBHOOK_URL not configured');
      return createCorsResponse({ 
        error: 'PODCAST_ADDING_WEBHOOK_URL not configured',
        success: false 
      }, 500, origin);
    }

    // Try podcast-specific auth token first, fallback to general auth token
    let authToken = Deno.env.get('PODCAST_WEBHOOK_AUTH') || Deno.env.get('NOTEBOOK_GENERATION_AUTH');
    
    if (!authToken) {
      console.error('No auth token configured');
      return createCorsResponse({ 
        error: 'Auth token not configured',
        success: false 
      }, 500, origin);
    }

    console.log('Sending to webhook...');

    // Send to webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      },
      body: JSON.stringify({
        podcastId,
        userId,
        rssFeed
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook request failed:', response.status, errorText);
      return createCorsResponse({ 
        error: `Webhook request failed: ${response.status}`,
        success: false 
      }, 500, origin);
    }

    const webhookResponse = await response.text();
    console.log('Webhook request succeeded');

    return createCorsResponse({ 
      success: true, 
      message: 'Podcast feed submitted for processing',
      webhookResponse 
    }, 200, origin);

  } catch (error) {
    console.error('Error in process-podcast-feed:', error);
    return createCorsResponse({ 
      error: error.message,
      success: false 
    }, 500, origin);
  }
})
