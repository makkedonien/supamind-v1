import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sourceId, filePath, sourceType, userId } = await req.json()

    if (!sourceId || !filePath || !sourceType || !userId) {
      return new Response(
        JSON.stringify({ error: 'sourceId, filePath, sourceType, and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing feed document:', { source_id: sourceId, file_path: filePath, source_type: sourceType, user_id: userId });

    // Get environment variables
    const webhookUrl = Deno.env.get('FEED_DOCUMENT_PROCESSING_WEBHOOK_URL')
    const authHeader = Deno.env.get('NOTEBOOK_GENERATION_AUTH')

    if (!webhookUrl) {
      console.error('Missing FEED_DOCUMENT_PROCESSING_WEBHOOK_URL environment variable')
      
      // Initialize Supabase client to update status
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Update source status to failed
      await supabaseClient
        .from('sources')
        .update({ processing_status: 'failed' })
        .eq('id', sourceId)

      return new Response(
        JSON.stringify({ error: 'Feed document processing webhook URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Calling external feed document processing webhook:', webhookUrl);

    // Create the file URL for public access
    const fileUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/sources/${filePath}`

    // Prepare the payload for the webhook with feed-specific context
    const payload = {
      source_id: sourceId,
      file_url: fileUrl,
      file_path: filePath,
      source_type: sourceType,
      user_id: userId, // Pass user_id instead of notebook_id
      context: 'feed', // Indicate this is for feed processing
      callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-document-callback`
    }

    console.log('Feed document webhook payload:', payload);

    // Call external webhook with proper headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Feed document webhook call failed:', response.status, errorText);
      
      // Initialize Supabase client to update status
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Update source status to failed
      await supabaseClient
        .from('sources')
        .update({ processing_status: 'failed' })
        .eq('id', sourceId)

      return new Response(
        JSON.stringify({ error: 'Feed document processing failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    console.log('Feed document webhook response:', result);

    return new Response(
      JSON.stringify({ success: true, message: 'Feed document processing initiated', result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-feed-document function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 