import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCorsPreflightRequest, createCorsResponse, validateOrigin } from '../_shared/cors.ts'
import { checkRateLimit, RATE_LIMIT_TIERS } from '../_shared/rate-limit.ts'

interface PodcastData {
  user_id: string;
  url: string;
  podcast_id: string;
}

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  // Note: Origin validation is optional for scheduled/cron functions
  // but included for consistency
  const originError = validateOrigin(req);
  if (originError) return originError;

  // Apply LOW_COST rate limit (100 req/hour) - IP-based only (no userId for cron)
  const rateLimitError = await checkRateLimit(req, RATE_LIMIT_TIERS.LOW_COST);
  if (rateLimitError) return rateLimitError;

  console.log('Starting scheduled podcast processing...');

  try {
    // Check for required environment variables
    const webhookUrl = Deno.env.get('PODCAST_FEED_PROCESSING_WEBHOOK_URL')
    if (!webhookUrl) {
      console.error('Missing PODCAST_FEED_PROCESSING_WEBHOOK_URL');
      return createCorsResponse(
        { error: 'Podcast feed processing webhook URL not configured' },
        500,
        origin
      );
    }

    // Try podcast-specific auth token first, fallback to general auth token
    let authToken = Deno.env.get('PODCAST_WEBHOOK_AUTH') || Deno.env.get('NOTEBOOK_GENERATION_AUTH')
    if (!authToken) {
      console.error('Missing auth token');
      return createCorsResponse(
        { error: 'Auth token not configured' },
        500,
        origin
      );
    }
    
    console.log('Using podcast-specific auth:', !!Deno.env.get('PODCAST_WEBHOOK_AUTH'));

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Querying users with podcast processing enabled...');

    // Query to get all users with podcast processing enabled and their podcasts
    const { data: userPodcasts, error: queryError } = await supabaseClient
      .from('profiles')
      .select(`
        id,
        podcasts (
          id,
          rss_feed
        )
      `)
      .eq('podcast_processing', 'enabled')

    if (queryError) {
      console.error('Error querying user podcasts:', queryError)
      return createCorsResponse(
        { error: 'Failed to query user podcasts', details: queryError.message },
        500,
        origin
      );
    }

    if (!userPodcasts || userPodcasts.length === 0) {
      console.log('No users with podcast processing enabled found')
      return createCorsResponse({ 
        message: 'No users with podcast processing enabled found',
        processed_users: 0,
        total_webhooks_sent: 0
      }, 200, origin);
    }

    // Filter users who actually have podcasts
    const usersWithPodcasts = userPodcasts.filter(user => 
      user.podcasts && Array.isArray(user.podcasts) && user.podcasts.length > 0
    )

    if (usersWithPodcasts.length === 0) {
      console.log('No users with podcasts found')
      return createCorsResponse({ 
        message: 'No users with podcasts found',
        processed_users: 0,
        total_webhooks_sent: 0
      }, 200, origin);
    }

    console.log(`Found ${usersWithPodcasts.length} users with podcasts to process`);

    let successfulWebhooks = 0;
    let failedWebhooks = 0;
    const processingResults = [];

    // Process each user's podcasts
    for (const user of usersWithPodcasts) {
      try {
        // Build array of podcast data for this user
        const userPodcastData: PodcastData[] = user.podcasts.map((podcast: any) => ({
          user_id: user.id,
          url: podcast.rss_feed,
          podcast_id: podcast.id
        }));

        console.log(`Processing ${userPodcastData.length} podcasts for user ${user.id}`);

        // Send webhook request for this user
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken
          },
          body: JSON.stringify(userPodcastData)
        });

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error(`Webhook failed for user ${user.id}:`, webhookResponse.status);
          failedWebhooks++;
          processingResults.push({
            user_id: user.id,
            success: false,
            podcast_count: userPodcastData.length,
            error: `HTTP ${webhookResponse.status}`
          });
        } else {
          console.log(`Successfully sent webhook for user ${user.id} with ${userPodcastData.length} podcasts`);
          successfulWebhooks++;
          processingResults.push({
            user_id: user.id,
            success: true,
            podcast_count: userPodcastData.length
          });
        }

      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        failedWebhooks++;
        processingResults.push({
          user_id: user.id,
          success: false,
          podcast_count: user.podcasts?.length || 0,
          error: error.message
        });
      }
    }

    console.log(`Podcast processing completed. Successful: ${successfulWebhooks}, Failed: ${failedWebhooks}`);

    return createCorsResponse({
      message: 'Scheduled podcast processing completed',
      processed_users: usersWithPodcasts.length,
      successful_webhooks: successfulWebhooks,
      failed_webhooks: failedWebhooks,
      total_webhooks_sent: successfulWebhooks + failedWebhooks,
      processing_results: processingResults
    }, 200, origin);

  } catch (error) {
    console.error('Unexpected error in scheduled podcast processing:', error);
    return createCorsResponse({ 
      error: 'Unexpected error during podcast processing', 
      details: error.message 
    }, 500, origin);
  }
})
