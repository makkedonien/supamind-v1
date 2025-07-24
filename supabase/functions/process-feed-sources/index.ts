import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, userId, urls, title, content, timestamp, sourceIds } = await req.json();
    
    console.log(`Process feed sources received ${type} request for user ${userId}`);

    // Get the webhook URL from Supabase secrets
    const webhookUrl = Deno.env.get('FEED_SOURCES_WEBHOOK_URL');
    if (!webhookUrl) {
      throw new Error('FEED_SOURCES_WEBHOOK_URL not configured');
    }

    // Get the auth token from Supabase secrets
    const authToken = Deno.env.get('NOTEBOOK_GENERATION_AUTH');
    if (!authToken) {
      throw new Error('NOTEBOOK_GENERATION_AUTH not configured');
    }

    // Prepare the webhook payload for feed sources
    let webhookPayload;
    
    if (type === 'multiple-websites') {
      webhookPayload = {
        type: 'feed-multiple-websites',
        userId,
        urls,
        sourceIds, // Array of source IDs corresponding to the URLs
        timestamp,
        context: 'feed' // Indicate this is for feed processing
      };
    } else if (type === 'copied-text') {
      webhookPayload = {
        type: 'feed-copied-text',
        userId,
        title,
        content,
        sourceId: sourceIds?.[0], // Single source ID for copied text
        timestamp,
        context: 'feed' // Indicate this is for feed processing
      };
    } else {
      throw new Error(`Unsupported type: ${type}`);
    }

    console.log('Sending feed webhook payload:', JSON.stringify(webhookPayload, null, 2));

    // Send to webhook with authentication
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
      console.error('Feed sources webhook request failed:', response.status, errorText);
      throw new Error(`Feed sources webhook request failed: ${response.status} - ${errorText}`);
    }

    const webhookResponse = await response.text();
    console.log('Feed sources webhook response:', webhookResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Feed ${type} data sent to webhook successfully`,
      webhookResponse 
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      },
    });

  } catch (error) {
    console.error('Process feed sources error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      },
    });
  }
}); 