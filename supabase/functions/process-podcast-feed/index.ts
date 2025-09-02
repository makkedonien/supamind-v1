import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting to process request...');
    
    const requestBody = await req.json();
    console.log('Request body parsed:', requestBody);
    
    const { podcastId, userId, rssFeed } = requestBody;
    console.log(`Processing podcast feed for podcast ${podcastId}, user ${userId}`);

    // Get the webhook URL from Supabase secrets
    const webhookUrl = Deno.env.get('PODCAST_ADDING_WEBHOOK_URL');
    console.log('Webhook URL configured:', !!webhookUrl);
    
    if (!webhookUrl) {
      console.error('PODCAST_ADDING_WEBHOOK_URL environment variable not configured');
      return new Response(
        JSON.stringify({ 
          error: 'PODCAST_ADDING_WEBHOOK_URL not configured in Supabase secrets. Please add this secret in your Supabase dashboard.',
          success: false 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try podcast-specific auth token first, fallback to general auth token
    let authToken = Deno.env.get('PODCAST_WEBHOOK_AUTH') || Deno.env.get('NOTEBOOK_GENERATION_AUTH');
    console.log('Auth token configured:', !!authToken);
    console.log('Using podcast-specific auth:', !!Deno.env.get('PODCAST_WEBHOOK_AUTH'));
    
    if (!authToken) {
      console.error('Neither PODCAST_WEBHOOK_AUTH nor NOTEBOOK_GENERATION_AUTH environment variable configured');
      return new Response(
        JSON.stringify({ 
          error: 'Authentication not configured. Please add PODCAST_WEBHOOK_AUTH or NOTEBOOK_GENERATION_AUTH secret in Supabase dashboard.',
          success: false 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare the webhook payload
    const webhookPayload = {
      podcast_id: podcastId,
      user_id: userId,
      rss_feed: rssFeed,
      timestamp: new Date().toISOString()
    };

    console.log('Sending podcast webhook payload:', JSON.stringify(webhookPayload, null, 2));

    // Send to webhook with authentication (try the same format as process-feed-sources)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
        ...corsHeaders
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Podcast webhook request failed:', response.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: `Webhook failed: ${response.status} - ${errorText}`, 
          success: false 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const webhookResponse = await response.text();
    console.log('Podcast webhook response:', webhookResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Podcast feed processing initiated successfully!',
      webhookResponse 
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      },
    });

  } catch (error) {
    console.error('Process podcast feed error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      },
    });
  }
});